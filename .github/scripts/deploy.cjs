const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status}: ${result.stderr || ''}`);
  return result.stdout;
}

function globRegex(pattern) {
  let source = '';
  for (let index = 0; index < pattern.length; index++) {
    const character = pattern[index];
    if (character === '*' && pattern[index + 1] === '*') {
      index++;
      if (pattern[index + 1] === '/') {
        source += '(?:.*/)?';
        index++;
      } else {
        source += '.*';
      }
    } else if (character === '*') {
      source += '[^/]*';
    } else if (character === '?') {
      source += '[^/]';
    } else {
      source += character.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
    }
  }
  return new RegExp(`^${source}$`);
}

function exclusions(text) {
  return text.split(/\r?\n/).map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      let pattern = line.endsWith('/') ? `${line}**` : line;
      if (!pattern.includes('/')) pattern = `**/${pattern}`;
      return globRegex(pattern);
    });
}

function quote(value) {
  if (/[\r\n\0]/.test(value)) throw new Error('Deployment paths cannot contain line breaks or NUL.');
  return `"${value.replace(/[\\"$`]/g, '\\$&')}"`;
}

function safePath(file) {
  if (!file || file.startsWith('/') || file.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error(`Unsafe deployment path: ${file}`);
  }
  quote(file);
  return file;
}

function settings(env) {
  for (const name of ['SFTP_HOST', 'SFTP_USERNAME', 'SFTP_PASSWORD', 'SFTP_REMOTE_DIR']) {
    if (!env[name]) throw new Error(`Missing deployment setting: ${name}`);
  }
  if (!/^[a-zA-Z0-9.-]+$/.test(env.SFTP_HOST)) throw new Error('SFTP_HOST must be a hostname, without a URL or port.');
  const port = Number(env.SFTP_PORT || '22');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid SFTP_PORT.');
  if (/[\r\n\0,]/.test(env.SFTP_USERNAME)) throw new Error('Unsupported SFTP_USERNAME.');
  const remote = env.SFTP_REMOTE_DIR.replace(/\/+$/, '');
  const parts = remote.replace(/^\//, '').split('/');
  const site = (env.GITHUB_REPOSITORY || '').split('/').at(-1);
  const directory = site === 'peko.net' ? 'public_html' : site;
  if (!site || !remote || parts.some(part => !part || part === '.' || part === '..') || parts.at(-1) !== directory) {
    throw new Error('The SFTP destination must name this repository website directory, not the account or server root.');
  }
  quote(remote);
  return { remote, port };
}

function plan(root, mode, base, sha, generateFeed = false) {
  const patterns = exclusions(fs.readFileSync(path.join(root, '.ftpignore'), 'utf8'));
  const excluded = file => patterns.some(pattern => pattern.test(file));
  const uploads = new Set();
  const deletes = new Set();
  const git = args => run('git', args, { cwd: root });
  const add = (set, file) => {
    safePath(file);
    if (!excluded(file)) set.add(file);
  };
  if (mode === 'full') {
    for (const file of git(['ls-files', '-z']).split('\0').filter(Boolean)) add(uploads, file);
  } else {
    if (!base || !/^[a-f0-9]{40}$/.test(base) || !/^[a-f0-9]{40}$/.test(sha)) {
      throw new Error('A successful deployment baseline and current commit are required.');
    }
    git(['merge-base', '--is-ancestor', base, sha]);
    const records = git(['diff', '--name-status', '--no-renames', '-z', base, sha]).split('\0');
    for (let index = 0; index < records.length - 1; index += 2) {
      const status = records[index];
      const file = records[index + 1];
      if (status === 'D') add(deletes, file);
      else if (['A', 'M', 'T'].includes(status)) add(uploads, file);
      else throw new Error(`Unsupported deployment change: ${status}`);
    }
  }
  if (generateFeed) {
    const records = git(['log', '--format=%H%x1f%aI%x1f%s%x1e']).split('\x1e');
    const runs = records.map(record => record.trim().split('\x1f', 3))
      .filter(parts => parts.length === 3)
      .map(([head_sha, created_at, display_title]) => ({ head_sha, created_at, display_title }));
    fs.mkdirSync(path.join(root, 'data'), { recursive: true });
    fs.writeFileSync(path.join(root, 'data', 'updates.json'), `${JSON.stringify({ workflow_runs: runs, total_count: runs.length })}\n`);
    add(uploads, 'data/updates.json');
  }
  const priority = file => file.startsWith('data/') ? 0 : file === 'content.php' ? 1 : file === 'functions.php' ? 2 : 3;
  const files = [...uploads].sort((left, right) => priority(left) - priority(right) || left.localeCompare(right));
  for (const file of files) {
    if (!fs.lstatSync(path.join(root, file)).isFile()) throw new Error(`Deployment file is not a regular file: ${file}`);
  }
  return { uploads: files, deletes: [...deletes].sort() };
}

function batch(deployment, remote, prune = [], patterns = []) {
  const commands = [
    'set cmd:fail-exit yes',
    'set net:max-retries 2',
    'set net:timeout 30',
    'set sftp:auto-confirm no',
    `cd ${quote(remote)}`,
    'cls -d . >/dev/null'
  ];
  const directories = new Set();
  for (const file of deployment.uploads) {
    const parts = safePath(file).split('/');
    parts.pop();
    let directory = '';
    for (const part of parts) {
      directory = directory ? `${directory}/${part}` : part;
      if (!directories.has(directory)) {
        commands.push(`cls -d ${quote(directory)} >/dev/null || mkdir ${quote(directory)}`);
        directories.add(directory);
      }
    }
    commands.push(`put ${quote(file)} -o ${quote(file)}`);
  }
  for (const file of deployment.deletes) commands.push(`rm ${quote(safePath(file))}`);
  const filters = patterns.filter(pattern => pattern && !pattern.startsWith('#'))
    .map(pattern => `--exclude-glob ${quote(pattern.endsWith('/') ? `${pattern}**` : pattern)}`).join(' ');
  for (const directory of prune) {
    if (!['disco', 'disco_photos', 'disco_photos_small'].includes(directory)) {
      throw new Error('Unsupported full-sync pruning directory.');
    }
    commands.push(`mirror --reverse --delete --verbose --no-perms ${filters} ${quote(`${directory}/`)} ${quote(directory)}`);
  }
  commands.push('bye');
  return `${commands.join('\n')}\n`;
}

function main(env = process.env, execute = run) {
  const root = path.resolve(__dirname, '..', '..');
  const mode = env.DEPLOY_MODE || 'changed';
  if (!['changed', 'full', 'check', 'dry-run'].includes(mode)) throw new Error('Invalid deployment mode.');
  const { remote, port } = settings(env);
  const deployment = mode === 'check' ? { uploads: [], deletes: [] } :
    plan(root, mode === 'full' ? 'full' : 'changed', env.DEPLOY_BASE, env.GITHUB_SHA, env.DEPLOY_UPDATES_FEED === 'true');
  console.log(`SFTP plan: ${deployment.uploads.length} uploads, ${deployment.deletes.length} deletions.`);
  if (mode === 'dry-run') {
    console.log('Dry run only. No SFTP connection or upload was made.');
    return;
  }
  const script = path.join(env.RUNNER_TEMP, 'deploy.lftp');
  const prune = mode === 'full' ? (env.DEPLOY_FULL_PRUNE || '').split(' ').filter(Boolean) : [];
  const patterns = fs.readFileSync(path.join(root, '.ftpignore'), 'utf8').split(/\r?\n/).map(line => line.trim());
  fs.writeFileSync(script, batch(deployment, remote, prune, patterns), { mode: 0o600 });
  try {
    execute('lftp', ['--env-password', '-u', env.SFTP_USERNAME, '-p', String(port),
      '-e', `source ${quote(script)}`, `sftp://${env.SFTP_HOST}`], {
      cwd: root,
      env: { ...env, LFTP_PASSWORD: env.SFTP_PASSWORD },
      stdio: 'inherit'
    });
  } finally {
    fs.unlinkSync(script);
  }
  console.log(mode === 'check' ? 'SFTP connection and destination verified. No files changed.' : 'SFTP deployment completed.');
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { run, globRegex, exclusions, quote, safePath, settings, plan, batch, main };
