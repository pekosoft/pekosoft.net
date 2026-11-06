const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const deploy = require('../scripts/deploy.cjs');
const root = path.resolve(__dirname, '..', '..');
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'deploy.yml'), 'utf8').replace(/\r\n/g, '\n');

function command(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function write(root, file, content = 'fixture') {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function commit(root) {
  command(['add', '.'], root);
  command(['-c', 'user.name=Deployment Test', '-c', 'user.email=test@example.invalid',
    '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Updated fixture'], root);
  return command(['rev-parse', 'HEAD'], root);
}

test('All modes use SFTP with environment-based passwords and explicit errors', () => {
  assert.match(workflow, /options: \[check, dry-run, changed, full\]/);
  assert.match(workflow, /actions: read/);
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.doesNotMatch(workflow, /protocol: ftps|FTP-Deploy-Action|sshpass/);
  const script = fs.readFileSync(path.join(root, '.github', 'scripts', 'deploy.cjs'), 'utf8');
  assert.match(script, /sftp:\/\/\$\{env.SFTP_HOST\}/);
  assert.match(script, /--env-password/);
  assert.match(script, /process.exitCode = 1/);
  assert.match(script, /LFTP_PASSWORD: env.SFTP_PASSWORD/);
});

test('Repository files, secrets and archives are excluded but runtime files remain deployable', () => {
  const patterns = deploy.exclusions(fs.readFileSync(path.join(root, '.ftpignore'), 'utf8'));
  const excluded = file => patterns.some(pattern => pattern.test(file));
  for (const file of ['.github/workflows/deploy.yml', '.github/scripts/deploy.cjs', '.git/config',
    '.vscode/tasks.json', 'tests/test.cjs', 'README.md', 'notes/test.md', '.env', 'data/.env.local',
    'cert.key', 'data/error_log', '.well-known/pki-validation/file']) assert.ok(excluded(file), file);
  for (const file of ['index.php', '.htaccess', 'style.css', 'index.js', 'icons.svg', 'favicon.svg',
    'data/artists.json', 'photos_bands/photo.jpg', 'img/cover.png']) assert.ok(!excluded(file), file);
  for (const pattern of ['.git/', '**/.github/**', '*.md', 'photos_bands_originals/**']) {
    const regexes = deploy.exclusions(`${pattern}\r\n`);
    const file = pattern === '.git/' ? '.git/config' : pattern === '*.md' ? 'nested/file.md' :
      pattern === 'photos_bands_originals/**' ? 'photos_bands_originals/file.png' : '.github/file';
    assert.ok(regexes.some(regex => regex.test(file)), pattern);
  }
});

test('Settings reject missing values, invalid ports, wrong-site destinations and account roots', () => {
  const valid = { SFTP_HOST: 'host.example', SFTP_USERNAME: 'test', SFTP_PASSWORD: 'unused',
    SFTP_REMOTE_DIR: '/home/account/site.example/', GITHUB_REPOSITORY: 'owner/site.example' };
  assert.deepEqual(deploy.settings(valid), { remote: '/home/account/site.example', port: 22 });
  const site = path.basename(root);
  const destination = `/home/flamenco/${site === 'peko.net' ? 'public_html' : site}`;
  assert.ok(workflow.includes(`SFTP_REMOTE_DIR: ${destination}\n`));
  assert.equal(deploy.settings({ ...valid, GITHUB_REPOSITORY: `owner/${site}`, SFTP_REMOTE_DIR: destination }).remote, destination);
  assert.throws(() => deploy.settings({ ...valid, SFTP_REMOTE_DIR: '/home/flamenco/public_html' }), /directory/);
  assert.equal(deploy.settings({ ...valid, SFTP_REMOTE_DIR: 'account/site.example' }).remote, 'account/site.example');
  for (const name of ['SFTP_HOST', 'SFTP_USERNAME', 'SFTP_PASSWORD', 'SFTP_REMOTE_DIR']) {
    assert.throws(() => deploy.settings({ ...valid, [name]: '' }), /Missing/);
  }
  for (const SFTP_PORT of ['0', '65536', '-1', '22x']) assert.throws(() => deploy.settings({ ...valid, SFTP_PORT }), /port/i);
  for (const SFTP_REMOTE_DIR of ['/', '/home/account', '/home/account/other.example', '/home/../site.example']) {
    assert.throws(() => deploy.settings({ ...valid, SFTP_REMOTE_DIR }), /directory/);
  }
  assert.throws(() => deploy.settings({ ...valid, SFTP_HOST: 'sftp://host.example' }), /hostname/);
});

test('Incremental plans recover failed commits, handle spaces and renames, and full uploads use tracked files only', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'deployment-fixture-'));
  try {
    command(['init', '-q'], fixture);
    write(fixture, '.ftpignore', fs.readFileSync(path.join(root, '.ftpignore'), 'utf8'));
    write(fixture, 'index.php');
    write(fixture, 'obsolete.php');
    write(fixture, 'old name.php');
    const base = commit(fixture);
    write(fixture, 'index.php', 'failed upload');
    commit(fixture);
    write(fixture, 'data/artists.json', '{}');
    write(fixture, 'content.php');
    write(fixture, 'functions.php');
    write(fixture, '.github/scripts/deploy.cjs');
    write(fixture, 'tests/test.cjs');
    write(fixture, 'data/.env');
    fs.unlinkSync(path.join(fixture, 'obsolete.php'));
    fs.renameSync(path.join(fixture, 'old name.php'), path.join(fixture, 'new name.php'));
    const head = commit(fixture);
    const result = deploy.plan(fixture, 'changed', base, head);
    assert.deepEqual(result.uploads, ['data/artists.json', 'content.php', 'functions.php', 'index.php', 'new name.php']);
    assert.deepEqual(result.deletes, ['obsolete.php', 'old name.php']);
    write(fixture, 'untracked.php');
    const full = deploy.plan(fixture, 'full', '', head, true);
    assert.ok(!full.uploads.includes('untracked.php'));
    assert.ok(!full.uploads.some(file => file.startsWith('.github/')));
    assert.ok(full.uploads.includes('data/updates.json'));
    assert.deepEqual(full.deletes, []);
    const feed = JSON.parse(fs.readFileSync(path.join(fixture, 'data', 'updates.json')));
    assert.equal(feed.total_count, 3);
    assert.equal(feed.workflow_runs[0].head_sha, head);
    for (const baseline of ['', '0'.repeat(40)]) {
      assert.throws(() => deploy.plan(fixture, 'changed', baseline, head));
    }
    const script = deploy.batch(result, '/home/account/site.example');
    assert.ok(script.indexOf('put "data/artists.json"') < script.indexOf('put "content.php"'));
    assert.ok(script.indexOf('put "content.php"') < script.indexOf('put "functions.php"'));
    assert.ok(script.indexOf('put "new name.php"') < script.indexOf('rm "obsolete.php"'));
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test('Transfer commands quote paths, create nested directories once and verify destination before uploads', () => {
  const script = deploy.batch({ uploads: ['nested/deeper/a.php', 'nested/deeper/b.php', 'space $`".php'], deletes: ['old.php'] }, '/home/site.example');
  assert.match(script, /set cmd:fail-exit yes/);
  assert.match(script, /set sftp:auto-confirm no/);
  assert.match(script, /cls -d "nested" >\/dev\/null \|\| mkdir "nested"/);
  assert.equal(script.split('mkdir "nested/deeper"').length - 1, 1);
  assert.ok(script.indexOf('cd "/home/site.example"') < script.indexOf('put '));
  assert.equal(deploy.quote('a$`"\\b'), '"a\\$\\`\\"\\\\b"');
  for (const file of ['../bad', '/bad', 'a/../bad', 'a\nbad']) assert.throws(() => deploy.safePath(file));
  const deletionOnly = deploy.batch({ uploads: [], deletes: ['old.php'] }, '/home/site.example');
  assert.doesNotMatch(deletionOnly, /^put /m);
  assert.match(deletionOnly, /^rm "old.php"$/m);
  const full = deploy.batch({ uploads: [], deletes: [] }, '/home/site.example',
    ['disco_photos'], ['*.bak']);
  assert.match(full, /mirror --reverse --delete/);
  assert.match(full, /--exclude-glob "\*\.bak"/);
  assert.ok(full.trim().split('\n').some(line => line.endsWith('"disco_photos/" "disco_photos"')));
  assert.throws(() => deploy.batch({ uploads: [], deletes: [] }, '/home/site.example', ['../other']));
});

test('Successful connection checks and dry runs never become upload baselines', async () => {
  const step = workflow.split('      - name: Find last successful upload\n')[1].split('\n      - name: ')[0];
  const script = step.split('          script: |\n')[1].split('\n')
    .filter(line => line.startsWith('            ') || !line.trim()).map(line => line.slice(12)).join('\n');
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const methods = { listWorkflowRuns: Symbol('runs'), listJobsForWorkflowRun: Symbol('jobs') };
  let output;
  let failure;
  let apiFailure = false;
  const github = { rest: { actions: methods }, paginate: async (method, options) => {
    if (apiFailure) throw new Error('API unavailable');
    if (method === methods.listWorkflowRuns) return [
      { id: 3, event: 'workflow_dispatch', updated_at: '2026-11-05T13:00:00Z' },
      { id: 2, event: 'workflow_dispatch', updated_at: '2026-11-05T12:00:00Z' },
      { id: 1, event: 'push', head_sha: 'deployed', updated_at: '2026-11-05T11:00:00Z' }
    ];
    assert.equal(method, methods.listJobsForWorkflowRun);
    return [{ steps: [{ name: 'Check connection or preview changes', conclusion: 'success' },
      { name: 'Upload website files', conclusion: 'skipped' }] }];
  }};
  const execute = () => new AsyncFunction('github', 'context', 'core', script)(github,
    { repo: { owner: 'owner', repo: 'site' }, ref: 'refs/heads/main', runId: 99 },
    { info() {}, setOutput(key, value) { output = value; }, setFailed(value) { failure = value; } });
  await execute();
  assert.equal(output, 'deployed');
  assert.equal(failure, undefined);
  apiFailure = true;
  await assert.rejects(execute(), /API unavailable/);
});

test('Read-only connection checks use SFTP and propagate transfer failures without exposing passwords', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'deployment-connection-fixture-'));
  const env = { DEPLOY_MODE: 'check', SFTP_HOST: 'host.example', SFTP_USERNAME: 'test',
    SFTP_PASSWORD: 'fixture-password', SFTP_REMOTE_DIR: '/home/site.example',
    GITHUB_REPOSITORY: 'owner/site.example', RUNNER_TEMP: temporary };
  let calls = 0;
  try {
    deploy.main(env, (command, args, options) => {
      calls++;
      assert.equal(command, 'lftp');
      assert.ok(args.includes('sftp://host.example'));
      assert.ok(args.includes('--env-password'));
      assert.ok(!args.join(' ').includes(env.SFTP_PASSWORD));
      assert.equal(options.env.LFTP_PASSWORD, env.SFTP_PASSWORD);
      const script = fs.readFileSync(path.join(temporary, 'deploy.lftp'), 'utf8');
      assert.doesNotMatch(script, /^put |^rm |^mirror /m);
      assert.match(script, /cd "\/home\/site.example"/);
    });
    assert.equal(calls, 1);
    assert.deepEqual(fs.readdirSync(temporary), []);
    assert.throws(() => deploy.main(env, () => { throw new Error('Transfer rejected'); }), /Transfer rejected/);
    assert.deepEqual(fs.readdirSync(temporary), []);
    assert.throws(() => deploy.run(process.execPath, ['-e', 'process.exit(7)']), /exit code 7/);
  } finally {
    fs.rmdirSync(temporary);
  }
});
