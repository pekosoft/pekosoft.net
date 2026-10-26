const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const maxInteger = execFileSync('php', ['-r', 'echo PHP_INT_MAX;'], { encoding: 'utf8' });

function renderPhp(file, query = '', { documentRoot = root, setup = '', load = 'require $argv[1];' } = {}) {
  const code = `
    http_response_code(200);
    $_SERVER['DOCUMENT_ROOT'] = $argv[3];
    $_SERVER['SCRIPT_NAME'] = '/' . $argv[4];
    $_SERVER['REQUEST_URI'] = '/' . $argv[4] . '?' . $argv[2];
    $_SERVER['REQUEST_METHOD'] = 'GET';
    parse_str($argv[2], $_GET);
    register_shutdown_function(static function () {
      fwrite(STDERR, "\\nSTATUS:" . http_response_code());
    });
    ${setup}
    ${load}
  `;
  const result = spawnSync('php', [
    '-d', 'error_reporting=32767', '-d', 'display_errors=0', '-d', 'log_errors=1',
    '-r', code, path.join(root, file), query, documentRoot, file.replaceAll('\\', '/')
  ], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  const status = result.stderr.match(/\nSTATUS:(\d+)$/);
  assert.ok(status, result.stderr);
  return {
    body: result.stdout,
    status: Number(status[1]),
    diagnostics: result.stderr.slice(0, status.index)
  };
}

function createFixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'php-compatibility-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function createFeed(t, count) {
  const documentRoot = createFixture(t);
  const runs = Array.from({ length: count }, (_, index) => ({ head_sha: String(index) }));
  fs.mkdirSync(path.join(documentRoot, 'data'));
  fs.writeFileSync(path.join(documentRoot, 'data', 'updates.json'), JSON.stringify({ workflow_runs: runs }));
  return { documentRoot, runs };
}

test('updates pagination preserves defaults, limits, page boundaries and total count', t => {
  const { documentRoot, runs } = createFeed(t, 125);
  for (const [query, expected] of [
    ['', runs.slice(0, 25)],
    ['page=2&per_page=10', runs.slice(10, 20)],
    ['page=13&per_page=10', runs.slice(120)],
    ['page=14&per_page=10', []],
    ['per_page=1000', runs.slice(0, 100)],
    ['page=0&per_page=-1', runs.slice(0, 1)],
    [`page=${maxInteger}&per_page=100`, []]
  ]) {
    const result = renderPhp('updates_data.php', query, { documentRoot });
    assert.equal(result.status, 200, query);
    assert.equal(result.diagnostics, '', query);
    assert.deepEqual(JSON.parse(result.body), { workflow_runs: expected, total_count: runs.length }, query);
  }
});

test('updates pagination handles an empty feed without overflow', t => {
  const { documentRoot } = createFeed(t, 0);
  for (const query of ['', `page=${maxInteger}&per_page=100`]) {
    const result = renderPhp('updates_data.php', query, { documentRoot });
    assert.equal(result.status, 200);
    assert.equal(result.diagnostics, '');
    assert.deepEqual(JSON.parse(result.body), { workflow_runs: [], total_count: 0 });
  }
});

test('invalid pagination parameters return explicit JSON errors without PHP diagnostics', t => {
  const { documentRoot } = createFeed(t, 1);
  for (const query of [
    'page[]=1', 'per_page[]=25', 'page=abc', 'per_page=1.5', 'page=',
    `page=${maxInteger}0`, `per_page=${maxInteger}0`
  ]) {
    const result = renderPhp('updates_data.php', query, { documentRoot });
    assert.equal(result.status, 400, query);
    assert.equal(result.diagnostics, '', query);
    assert.deepEqual(JSON.parse(result.body), { error: 'Pagination parameters must be integers.' }, query);
  }
});

test('release pages reject array-valued release parameters without warnings', () => {
  for (const file of ['about.php', 'help.php', 'history.php']) {
    for (const query of ['t[]=index', 't[name]=index']) {
      const result = renderPhp(file, query);
      assert.equal(result.status, 400, `${file}?${query}`);
      assert.equal(result.diagnostics, '', `${file}?${query}`);
      assert.match(result.body, /Invalid release parameter\./);
    }
  }
});

test('shared metadata ignores non-string release parameters on standalone pages', () => {
  for (const file of ['elements\\head.php', 'tools\\player.php']) {
    const result = renderPhp(file, 't[]=index');
    assert.equal(result.status, 200);
    assert.equal(result.diagnostics, '');
    assert.match(result.body, /<link rel="canonical"/);
  }
});

test('normal release pages, missing entries and standalone pages retain their responses', () => {
  for (const file of ['about.php', 'help.php', 'history.php']) {
    for (const [query, status] of [['t=index', 200], ['t=tuner', 200], ['', 200], ['t=missing-entry', 404]]) {
      const result = renderPhp(file, query);
      assert.equal(result.status, status, `${file}?${query}`);
      assert.equal(result.diagnostics, '', `${file}?${query}`);
    }
  }
  const result = renderPhp('tools\\player.php');
  assert.equal(result.status, 200);
  assert.equal(result.diagnostics, '');
});

test('failed About metadata reads are logged and return only the 500 page', t => {
  const documentRoot = createFixture(t);
  fs.mkdirSync(path.join(documentRoot, 'about'));
  fs.writeFileSync(path.join(documentRoot, 'about', 'index.txt'), 'Metadata');
  fs.writeFileSync(path.join(documentRoot, '500.php'), '<?php http_response_code(500); echo "Read failure page";');
  const result = renderPhp('about.php', 't=index', {
    documentRoot,
    load: `
      $source = file_get_contents($argv[1]);
      eval('namespace ReadFailure;
        function file($filename, $flags) {
          return \\\\file($filename . ".missing", $flags);
        }
        ?>' . $source);
    `
  });
  assert.equal(result.status, 500);
  assert.equal(result.body, 'Read failure page');
  assert.match(result.diagnostics, /About: file\(/);
  assert.doesNotMatch(result.diagnostics, /Fatal error|TypeError/);
});
