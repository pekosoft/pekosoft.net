const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const workflow = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'deploy.yml'), 'utf8').replace(/\r\n/g, '\n');

function stepScript(name, key) {
  const step = workflow.split(`      - name: ${name}\n`)[1]?.split('\n      - name: ')[0];
  assert.ok(step, `Missing workflow step: ${name}`);
  const indent = key === 'script' ? 12 : 10;
  const block = step.split(`${' '.repeat(indent - 2)}${key}: |\n`)[1];
  assert.ok(block, `Missing ${key} in ${name}`);
  return block.split('\n').filter(line => line.startsWith(' '.repeat(indent)) || !line.trim())
    .map(line => line.slice(indent)).join('\n');
}

const baselineScript = stepScript('Find last successful deployment', 'script');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

async function findBaseline(runs, error) {
  const outputs = {};
  let request;
  const github = {
    rest: { actions: { listWorkflowRuns: Symbol('listWorkflowRuns') } },
    paginate: async (method, options) => {
      assert.equal(method, github.rest.actions.listWorkflowRuns);
      request = options;
      if (error) throw error;
      return runs;
    }
  };
  await new AsyncFunction('github', 'context', 'core', baselineScript)(
    github,
    { repo: { owner: 'owner', repo: 'site' }, ref: 'refs/heads/main', runId: 99 },
    { info() {}, setOutput: (key, value) => { outputs[key] = value; } }
  );
  return { outputs, request };
}

test('Deployment baseline uses the latest successful completion, including reruns and pagination', async () => {
  const { outputs, request } = await findBaseline([
    { id: 99, head_sha: 'current', updated_at: '2026-10-28T15:00:00Z' },
    { id: 2, head_sha: 'newer-created', updated_at: '2026-10-28T12:00:00Z' },
    { id: 1, head_sha: 'latest-deployed', updated_at: '2026-10-28T14:00:00Z' }
  ]);
  assert.equal(outputs.sha, 'latest-deployed');
  assert.deepEqual(request, {
    owner: 'owner', repo: 'site', workflow_id: 'deploy.yml', branch: 'main', status: 'success', per_page: 100
  });
  assert.deepEqual((await findBaseline([])).outputs, {});
});

test('Deployment lookup errors fail explicitly instead of assuming a baseline', async () => {
  await assert.rejects(findBaseline([], new Error('API unavailable')), /API unavailable/);
});

function command(executable, args, cwd, env = {}) {
  const result = spawnSync(executable, args, {
    cwd, encoding: 'utf8', env: { ...process.env, ...env }
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${executable} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  return result.stdout.trim();
}

function git(cwd, ...args) {
  return command('git', args, cwd);
}

function write(cwd, file, content) {
  const target = path.join(cwd, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function commit(cwd) {
  git(cwd, 'add', '.');
  git(cwd, '-c', 'user.name=Deployment Test', '-c', 'user.email=test@example.invalid',
    '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Updated fixture');
  return git(cwd, 'rev-parse', 'HEAD');
}

const bash = process.platform === 'win32'
  ? path.join(process.env.ProgramFiles, 'Git', 'bin', 'bash.exe') : 'bash';
const planScript = stepScript('Prepare deployment plan', 'run');

function plan(cwd, base, head, mode = 'changed') {
  command(bash, ['--noprofile', '--norc', '-e', '-o', 'pipefail', '-c', planScript], cwd, {
    DEPLOY_BASE_SHA: base, GITHUB_SHA: head, DEPLOY_MODE: mode,
    DEPLOY_UPLOAD_LIST: 'uploads.txt', DEPLOY_DELETE_LIST: 'deletes.txt', GITHUB_OUTPUT: 'outputs.txt'
  });
  const read = file => fs.readFileSync(path.join(cwd, file), 'utf8').trim().split('\n').filter(Boolean);
  const result = { uploads: read('uploads.txt'), deletes: read('deletes.txt'), outputs: read('outputs.txt') };
  for (const file of ['uploads.txt', 'deletes.txt', 'outputs.txt']) fs.unlinkSync(path.join(cwd, file));
  return result;
}

test('Incremental plans cover an entire push and changes since the last successful deployment', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'deployment-test-'));
  try {
    git(cwd, 'init', '-q');
    write(cwd, 'css/index.css', 'old');
    write(cwd, 'obsolete.php', 'old');
    write(cwd, 'old-name.php', 'rename content');
    const deployed = commit(cwd);
    write(cwd, 'css/index.css', 'updated in an earlier commit');
    const failed = commit(cwd);
    write(cwd, 'js/modules.js', 'updated in final commit');
    write(cwd, 'tests/repository-only.cjs', 'test');
    write(cwd, '.github/workflows/deploy.yml', 'workflow');
    write(cwd, '.dev/tool.js', 'tool');
    write(cwd, 'pekosoft.md', 'documentation');
    fs.unlinkSync(path.join(cwd, 'obsolete.php'));
    fs.renameSync(path.join(cwd, 'old-name.php'), path.join(cwd, 'new-name.php'));
    const head = commit(cwd);
    const result = plan(cwd, deployed, head);
    assert.deepEqual(result.uploads.sort(), ['css/index.css', 'data/updates.json', 'js/modules.js', 'new-name.php']);
    assert.deepEqual(result.deletes.sort(), ['obsolete.php', 'old-name.php']);
    assert.ok(result.outputs.includes('mode=changed'));
    assert.ok(result.outputs.includes('upload_count=4'));
    assert.ok(result.outputs.includes('delete_count=2'));
    assert.ok(!plan(cwd, failed, head).uploads.includes('css/index.css'),
      'A failed deployment must never replace the successful baseline');
    for (const base of ['', '0'.repeat(40)]) {
      assert.ok(plan(cwd, base, head).outputs.includes('mode=full'));
    }
    assert.ok(plan(cwd, deployed, head, 'full').outputs.includes('mode=full'));
    git(cwd, 'checkout', '-q', '--orphan', 'unrelated');
    git(cwd, 'rm', '-q', '-rf', '.');
    write(cwd, 'index.php', 'unrelated history');
    const unrelated = commit(cwd);
    assert.ok(plan(cwd, deployed, unrelated).outputs.includes('mode=full'));
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('SFTP uploads use batch mode so failed puts cannot produce a successful deployment', () => {
  const script = stepScript('Upload changed website files', 'run');
  assert.match(script, /sftp \\\s+-b "\$DEPLOY_SFTP_BATCH"/);
  assert.match(script, /-o BatchMode=no/);
  assert.doesNotMatch(script, /< "\$DEPLOY_SFTP_BATCH"/);
});
