const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js', 'swipe.js'), 'utf8');
const officialLinks = [
  '/index.php', '/tap_pad', '/bpm_calculator', '/metronome', '/turntable',
  '/bitcoin.php', '/contact', '#', '/updates'
];
const betaLinks = ['/beta.php', '/player', '/tuner', '/icons', '/contact', '/updates'];

function createSwipe(url, links = officialLinks) {
  const parsed = new URL(url, 'http://localhost:8000');
  const location = { pathname: parsed.pathname, search: parsed.search, origin: parsed.origin, href: parsed.href };
  const header = { style: {}, addEventListener() {}, querySelectorAll: () => [] };
  const api = vm.runInNewContext(`${source}
    ({ swipePages, getCurrentPage, getTargetPage, goToNextPage, goToPreviousPage });
  `, {
    window: { location },
    document: {
      querySelector: () => header,
      querySelectorAll: selector => selector === '#toc .toc-button[data-href]'
        ? links.map(href => ({ getAttribute: () => href })) : [],
      addEventListener() {}
    },
    URL, URLSearchParams
  });
  return { ...api, location };
}

test('official About swipes wrap between Turntable and Pekosoft without Contact', () => {
  const last = createSwipe('/about.php?t=turntable');
  assert.equal(last.getTargetPage('forward'), 'index');
  last.goToNextPage();
  assert.equal(last.location.href, '/about.php?t=index');
  const first = createSwipe('/about.php?t=index');
  first.goToPreviousPage();
  assert.equal(first.location.href, '/about.php?t=turntable');
});

test('Beta About swipes wrap between Icons and Beta without Contact', () => {
  const last = createSwipe('/about.php?t=icons', betaLinks);
  last.goToNextPage();
  assert.equal(last.location.href, '/about.php?t=beta');
  const first = createSwipe('/about.php?t=beta', betaLinks);
  first.goToPreviousPage();
  assert.equal(first.location.href, '/about.php?t=icons');
});

test('Contact stays out of tool and contextual swipe loops', () => {
  for (const pathname of ['/turntable', ...['about', 'help', 'history', 'js', 'css']
    .map(page => `/${page}.php?t=turntable`)]) {
    const swipe = createSwipe(pathname);
    assert.deepEqual(Array.from(swipe.swipePages), [
      'index', 'tap_pad', 'bpm_calculator', 'metronome', 'turntable'
    ]);
    assert.equal(swipe.getTargetPage('forward'), 'index');
  }
});

test('standalone Contact has no swipe destinations', () => {
  for (const pathname of ['/contact', '/contact.php', '/about.php?t=contact']) {
    const swipe = createSwipe(pathname);
    assert.equal(swipe.getCurrentPage(), null);
    assert.equal(swipe.getTargetPage('forward'), null);
    assert.equal(swipe.getTargetPage('backward'), null);
    const original = swipe.location.href;
    swipe.goToNextPage();
    assert.equal(swipe.location.href, original);
  }
});

test('Contact is excluded regardless of clean, implementation or contextual link form', () => {
  const swipe = createSwipe('/about.php?t=turntable', [
    ...officialLinks, '/contact.php', '/about.php?t=contact', '/help.php?t=contact'
  ]);
  assert.ok(!swipe.swipePages.includes('contact'));
  assert.equal(swipe.getTargetPage('forward'), 'index');
});

test('fallback swipe navigation retains its existing tool order', () => {
  const swipe = createSwipe('/about.php?t=turntable', []);
  assert.deepEqual(Array.from(swipe.swipePages), [
    'index', 'tap_pad', 'bpm_calculator', 'metronome', 'turntable'
  ]);
  assert.equal(swipe.getTargetPage('forward'), 'index');
});

test('Contact remains in the TOC and both Play sequences', () => {
  const toc = fs.readFileSync(path.join(root, 'elements', 'burger.php'), 'utf8');
  const script = fs.readFileSync(path.join(root, 'js', 'index.js'), 'utf8');
  assert.match(toc, /data-href="\/contact" title="Contact"/);
  assert.equal([...script.matchAll(/^\s*'\/contact',?\s*$/gm)].length, 2);
});

test('both footer variants version the swipe script so navigation updates reach cached pages', () => {
  for (const name of ['footer.php', 'beta_footer.php']) {
    const footer = fs.readFileSync(path.join(root, 'elements', name), 'utf8');
    assert.match(footer, /src="\/js\/swipe\.js\?v=<\?php echo filemtime\(/);
  }
});

test('Contact and Settings About URLs return 404 even if metadata exists', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'about-routes-'));
  try {
    fs.mkdirSync(path.join(directory, 'about'));
    for (const name of ['contact', 'settings', 'tuner']) {
      fs.writeFileSync(path.join(directory, 'about', `${name}.txt`), 'Metadata');
    }
    fs.writeFileSync(path.join(directory, '404.php'), '<?php http_response_code(404);');
    const guard = fs.readFileSync(path.join(root, 'about.php'), 'utf8')
      .split('?>')[0].replace(/^<\?php\s*/, '');
    const code = `
      $_SERVER['DOCUMENT_ROOT'] = $argv[1];
      $_GET['t'] = $argv[2];
      register_shutdown_function(static function () { echo http_response_code() ?: 200; });
      ${guard}
    `;
    for (const [release, status] of [['contact', '404'], ['settings', '404'], ['missing', '404'], ['tuner', '200']]) {
      assert.equal(execFileSync('php', ['-r', code, directory, release], { encoding: 'utf8' }), status);
    }
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
