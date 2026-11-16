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

test('Reference direct links expose their table identity without JavaScript', () => {
  const titles = {
    bpm: 'BPM', tempi: 'Italian tempi', notes: 'Notes', scales: 'Scales',
    chords: 'Chords', prefixes: 'Metric prefixes', cables: 'Cables'
  };
  for (const [mode, title] of Object.entries(titles)) {
    const result = renderPhp('tools\\reference.php', `a=${mode}&other=ignored`, {
      setup: `$_SERVER['REQUEST_URI'] = '/reference?a=${mode}&other=ignored';`
    });
    assert.equal(result.status, 200, mode);
    assert.equal(result.diagnostics, '', mode);
    assert.ok(result.body.includes(`<title>Pekosoft - Reference - ${title}</title>`), mode);
    assert.ok(result.body.includes(`<meta property="og:title" content="Pekosoft - Reference - ${title}">`), mode);
    for (const marker of ['<link rel="canonical" href=', '<meta property="og:url" content=']) {
      assert.ok(result.body.includes(`${marker}"https://pekosoft.net/reference?a=${mode}">`), mode);
    }
    assert.match(result.body, /property="og:image" content="https:\/\/pekosoft\.net\/png\/og\/reference\.png"/);
    if (mode === 'cables') assert.match(result.body, /property="og:description" content="Compare USB, HDMI/);
  }
});

test('Reference metadata ignores unknown and non-string tables without PHP warnings', () => {
  for (const query of ['', 'a=unknown', 'a[]=cables', 'a=%22%3E%3Cscript%3E']) {
    const result = renderPhp('tools\\reference.php', query, {
      setup: "$_SERVER['REQUEST_URI'] = '/reference?' . $argv[2];"
    });
    assert.equal(result.status, 200, query);
    assert.equal(result.diagnostics, '', query);
    assert.match(result.body, /<title>Pekosoft - Reference<\/title>/);
    assert.match(result.body, /property="og:url" content="https:\/\/pekosoft\.net\/reference"/);
  }
  const result = renderPhp('help.php', 't=reference&a=cables');
  assert.equal(result.diagnostics, '');
  assert.match(result.body, /<title>Pekosoft - Help - Reference<\/title>/);
  assert.doesNotMatch(result.body, /Reference - Cables/);
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

test('front page omits the updates feed while retaining official tools and Updates navigation', () => {
  const result = renderPhp('index.php', '', { setup: "$_SERVER['REQUEST_URI'] = '/';" });
  assert.equal(result.status, 200);
  assert.equal(result.diagnostics, '');
  assert.doesNotMatch(result.body, /Latest updates|github-actions|index_page\.js/);
  for (const slug of ['tap_pad', 'bpm_calculator', 'metronome', 'turntable']) {
    assert.ok(result.body.includes(`href="/${slug}"`), slug);
  }
  assert.ok(result.body.includes('href="/demo"'));
  assert.match(result.body, /data-href="\/updates"/);
});

test('demo presents the four official tools with only playback controls and clean metadata', () => {
  const result = renderPhp('demo.php', '', {
    setup: "$_SERVER['REQUEST_URI'] = '/demo';"
  });
  assert.equal(result.status, 200);
  assert.equal(result.diagnostics, '');
  assert.match(result.body, /<link rel="canonical" href="https:\/\/pekosoft\.net\/demo">/);
  assert.match(result.body, /<meta name="description" content="Free online audio tools\.">/);
  assert.match(result.body, /src="\/js\/demo\.js\?v=/);
  const captions = [...result.body.matchAll(/<\/svg>\s*<div class="demo-caption">\s*<h1\b[^>]*>([^<]+)<\/h1>\s*<p data-demo-description>([^<]+)<\/p>\s*<\/div>/g)]
    .map(([, name, description]) => [name, description]);
  assert.deepEqual(captions, [
    ['Tap Pad', 'For tapping tempo.'],
    ['BPM Calculator', 'For tempo calculations.'],
    ['Metronome', 'For keeping time.'],
    ['Turntable', 'For visualizing RPM.']
  ]);
  const tapSlide = result.body.match(/<section\b[^>]*aria-labelledby="demo-tap-pad"[\s\S]*?<\/section>/)[0];
  assert.match(tapSlide, /#tap_pad" mask="url\(#demo-tap-hand\)"/);
  const handMask = tapSlide.match(/<mask id="demo-tap-hand"[\s\S]*?<\/mask>/)[0];
  assert.match(handMask, /<circle\b[^>]*fill="#000"/);
  assert.match(handMask, /<circle\b[^>]*>[\s\S]*<rect\b[^>]*x="184\.112"[^>]*fill="#fff"/);
  assert.match(tapSlide, /<circle class="demo-feedback" data-demo-tap/);
  const metronomeSlide = result.body.match(/<section\b[^>]*aria-labelledby="demo-metronome"[\s\S]*?<\/section>/)[0];
  assert.match(metronomeSlide, /#metronome" clip-path="url\(#demo-metronome-base\)"/);
  assert.match(metronomeSlide, /<path data-demo-metronome-body fill-rule="evenodd"/);
  assert.doesNotMatch(metronomeSlide, /data-demo-tempo-line|M248\.486 22\.261h11\.13v360\.801h-11\.13Z/);
  const outline = metronomeSlide.match(/<path data-demo-metronome-body[^>]*>/)[0];
  assert.doesNotMatch(outline, /\bstroke(?:-width)?=/);
  const [leftTop, top, rightTop, rightBottom, bottom, leftBottom] = outline
    .match(/d="M([\d.]+) ([\d.]+)H([\d.]+)L([\d.]+) ([\d.]+)H([\d.]+)Z/).slice(1).map(Number);
  const sprite = fs.readFileSync(path.join(root, 'icons.svg'), 'utf8');
  const original = sprite.match(/<symbol id="metronome"[\s\S]*?<\/symbol>/)[0];
  const base = original.match(/<polygon points="([^"]+)"/)[1].split(/\s+/).map(Number);
  const baseTop = base[1];
  const leftSlope = (leftTop - leftBottom) / (bottom - top);
  const rightSlope = (rightBottom - rightTop) / (bottom - top);
  assert.ok(Math.abs(leftBottom - leftSlope * (baseTop - bottom) - base[2]) < 0.001);
  assert.ok(Math.abs(rightBottom + rightSlope * (baseTop - bottom) - base[0]) < 0.001);
  const circles = [...metronomeSlide.matchAll(/<circle data-demo-signature-beat cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/g)]
    .map(([, x, y, radius]) => [Number(x), Number(y), Number(radius)]);
  assert.equal(circles.length, 4);
  const center = (base[4] + base[6]) / 2;
  assert.ok(Math.abs((circles[0][0] + circles[3][0]) / 2 - center) < 0.001);
  for (const [index, [x, y, radius]] of circles.entries()) {
    assert.ok(y - radius > baseTop && y + radius < base[5]);
    if (index > 0) assert.ok(Math.abs(x - circles[index - 1][0] - 44) < 0.001);
  }
  assert.match(metronomeSlide, /data-demo-pendulum/);
  const pendulum = metronomeSlide.match(/<g\b[^>]*data-demo-pendulum>[\s\S]*?<\/g>/)[0];
  assert.match(pendulum, /href="\/icons\.svg\?v=\d+#pendulum_weight"/);
  assert.doesNotMatch(pendulum, /<rect/);
  const [armTop, armLength] = pendulum.match(/<path d="M[\d.]+ ([\d.]+)h[\d.]+v([\d.]+)h-[\d.]+Z"/).slice(1).map(Number);
  const armBottom = armTop + armLength;
  assert.ok(armBottom > baseTop && armBottom < base[5]);
  const filledBase = metronomeSlide.match(/<use\b[^>]*#metronome"[^>]*>/)[0];
  assert.ok(metronomeSlide.indexOf(filledBase) > metronomeSlide.indexOf(pendulum) + pendulum.length);
  assert.ok(metronomeSlide.indexOf('data-demo-signature-beat') > metronomeSlide.indexOf(filledBase));
  const buttons = [...result.body.matchAll(/<button\b[^>]*aria-label="([^"]+)"[^>]*>/g)];
  assert.deepEqual(buttons.map(([, label]) => label), ['More', 'Dark mode', 'Sound', 'Play', 'Loop', 'Download', 'Fullscreen']);
  assert.match(result.body, /data-demo-more[^>]*aria-expanded="false"[^>]*aria-controls="demo-playback"/);
  assert.match(result.body, /id="demo-playback"[^>]*hidden/);
  assert.match(result.body, /data-demo-dark-mode[^>]*title="Toggle dark mode"[^>]*>\s*<svg[^>]*><use href="\/icons\.svg#moon"/);
  assert.match(result.body, /data-demo-download[^>]*title="Download video with audio"/);
  assert.match(result.body, /src="\/js\/demo-video\.js\?v=/);
  assert.deepEqual(buttons.filter(([markup]) => markup.includes('aria-pressed')).map(([markup]) => markup.match(/aria-pressed="([^"]+)"/)[1]),
    ['true', 'true', 'true', 'false', 'false']);
  const opening = result.body.match(/<section\b[^>]*data-demo-slide[\s\S]*?<\/section>/)[0];
  assert.match(opening, /data-duration="6000"/);
  assert.match(opening, /#logo/);
  assert.match(opening, /<p class="demo-tagline" data-demo-slogan hidden>Free online audio tools\.<\/p>/);
  assert.equal((result.body.match(/Free online audio tools\.<\/p>/g) || []).length, 1);
  const turntableSlide = result.body.match(/<section\b[^>]*aria-labelledby="demo-turntable"[\s\S]*?<\/section>/)[0];
  assert.match(turntableSlide, /#turntable"/);
  assert.doesNotMatch(turntableSlide, /data-demo-tonearm|<rect/);
  const ending = [...result.body.matchAll(/<section\b[^>]*data-demo-slide[\s\S]*?<\/section>/g)]
    .slice(-7).map(([markup]) => markup);
  assert.match(ending[0], /href="\/icons\.svg\?v=\d+#index"/);
  assert.doesNotMatch(ending[0], /#logo|pekosoft\.net/);
  for (const [index, [label, icon]] of [
    ['Simple', 'star'],
    ['Documented', 'reference'],
    ['Secure', 'lock'],
    ['Open source', 'github'],
    ['Customizable', 'settings']
  ].entries()) {
    const point = ending[index + 1];
    assert.match(point, /data-duration="1000"/);
    assert.match(point, index === 4
      ? /<svg class="demo-icon" data-demo-point-icon="fade"/
      : /<svg class="demo-icon" data-demo-point-icon viewBox/);
    assert.ok(point.includes(`>${label}</h1>`), label);
    assert.ok(point.includes(`#${icon}"`), icon);
  }
  assert.match(ending[6], /<p class="demo-tagline demo-url" data-demo-url aria-label="pekosoft\.net">/);
  assert.match(ending[6], /<a class="demo-url-typing" data-demo-url-link="\/" aria-label="pekosoft\.net"><span data-demo-url-text aria-hidden="true"><\/span><span class="demo-caret" data-demo-url-caret aria-hidden="true"><\/span><\/a>/);
  assert.doesNotMatch(ending[6], /<a\b[^>]*\shref=/);
  assert.doesNotMatch(ending[6], /<svg/);
  assert.equal((result.body.match(/href="\/assets\.svg#logo"/g) || []).length, 1);
  const buttonContent = [...result.body.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)];
  for (const [, content] of buttonContent) {
    assert.equal(content.replace(/<svg\b[\s\S]*?<\/svg>/g, '').trim(), '');
  }
  assert.equal((result.body.match(/<a\b/g) || []).length, 1);
  assert.doesNotMatch(result.body, /<input\b|<linearGradient\b|See sound in motion|Find your next sound/);

  const routing = fs.readFileSync(path.join(root, '.htaccess'), 'utf8');
  assert.match(routing, /RewriteRule \^demo\\\.php\$ \/demo \[R=301,L\]/);
  assert.match(routing, /RewriteRule \^\(beta\|bitcoin\|contact\|updates\|about\|help\|history\|dev\|demo\)\$ \/\$1\.php \[END\]/);
});

test('demo Calculator scrolls its original double note after the individual notes and repeats seamlessly', () => {
  const result = renderPhp('demo.php', '', {
    setup: "$_SERVER['REQUEST_URI'] = '/demo';"
  });
  assert.equal(result.status, 200);
  assert.equal(result.diagnostics, '');
  const calculatorSlide = result.body.match(/<section\b[^>]*aria-labelledby="demo-bpm-calculator"[\s\S]*?<\/section>/);
  assert.ok(calculatorSlide);
  assert.match(calculatorSlide[0], /<g clip-path="url\(#demo-calculator-display\)">\s*<g class="demo-moving-part" data-demo-notes>/);
  assert.match(calculatorSlide[0], /#bpm_calculator" mask="url\(#demo-calculator-housing\)"/);
  const noteStream = calculatorSlide[0].match(/<g class="demo-moving-part" data-demo-notes>([\s\S]*?)<\/g>/)[1];
  const noteSymbols = [...noteStream.matchAll(/href="\/icons\.svg\?v=\d+#([^"]+)"/g)]
    .map(([, symbol]) => symbol);
  assert.deepEqual(noteSymbols, ['1_2', '1_4', '1_8', '1_16', 'bpm_calculator', '1_2', '1_4']);
  assert.match(noteStream, /<svg x="1128"[^>]*viewBox="144 64 224 224">\s*<use[^>]*#bpm_calculator" width="512" height="512"><\/use>\s*<\/svg>/);
  const notePositions = [...noteStream.matchAll(/<(?:use|svg)\b[^>]*\bx="(\d+)"/g)].map(([, x]) => Number(x));
  assert.equal(notePositions[0], 104);
  assert.equal(notePositions[5] - notePositions[0], 1280);
  assert.equal(notePositions[6] - notePositions[1], 1280);
  assert.doesNotMatch(calculatorSlide[0], /data-demo-final-note|data-demo-tempo/);
});

test('Demo appears above Buy Us Coffee and Share stays in Settings on official and beta pages', () => {
  for (const file of ['index.php', 'tools\\metronome.php', 'beta.php', 'tools\\player.php']) {
    const result = renderPhp(file, '', {
      setup: file === 'index.php' ? "$_SERVER['REQUEST_URI'] = '/';" : ''
    });
    assert.equal(result.status, 200, file);
    assert.equal(result.diagnostics, '', file);
    const toc = result.body.slice(result.body.indexOf('<div id="toc"'), result.body.indexOf('<div id="settings-menu-container"'));
    assert.equal((toc.match(/data-href="\/demo"/g) || []).length, 1, file);
    assert.match(toc, /data-href="\/demo" title="Demo" aria-label="Demo">[\s\S]*?<\/svg>\s*Demo\s*<\/button>\s*<button[^>]*data-href="\/bitcoin"/, file);
    assert.match(result.body, /id="settings-panel"[\s\S]*id="toggle-fullscreen-button"[\s\S]*id="share-settings-button"[\s\S]*id="play-site-button"/, file);
    const shareButton = result.body.match(/<button id="share-settings-button"[^>]*>/)[0];
    assert.doesNotMatch(shareButton, /data-href=/, file);
    assert.equal((result.body.match(/id="share-settings-button"/g) || []).length, 1, file);
    assert.doesNotMatch(result.body, /id="share-toc-button"/, file);
  }
});

test('TOC omits empty groups on standalone pages and preserves release and module navigation', () => {
  for (const [file, query, hasReleaseMenu, hasModules] of [
    ['bitcoin.php', '', false, false],
    ['contact.php', '', false, false],
    ['updates.php', '', false, false],
    ['help.php', 't=index', true, false],
    ['tools\\metronome.php', '', true, true]
  ]) {
    const result = renderPhp(file, query);
    assert.equal(result.status, 200, file);
    assert.equal(result.diagnostics, '', file);
    const toc = result.body.slice(result.body.indexOf('<div id="toc"'), result.body.indexOf('<div id="settings-menu-container"'));
    assert.doesNotMatch(toc, /<div(?: id="toc-module-items")? class="toc-column">\s*<\/div>/, file);
    for (const label of ['Tool', 'Help', 'History', 'About']) {
      assert.equal(toc.includes(`aria-label="${label}"`), hasReleaseMenu, `${file}: ${label}`);
    }
    assert.equal(toc.includes('id="toc-module-items"'), hasModules, file);
    if (hasModules) assert.match(toc, /id="tool-toggle-toc-button"/, file);
    for (const href of ['/demo', '/bitcoin', '/contact', '/updates']) {
      assert.ok(toc.includes(`data-href="${href}"`), `${file}: ${href}`);
    }
  }
});

test('developer controls move out of Settings and render once on the clean Dev page', () => {
  const controlIds = ['grid', 'grid-size-value', 'settings-grid-size-knob', 'toggle-alpha', 'background-image', 'background-image-picker'];
  for (const file of ['index.php', 'tools\\metronome.php', 'beta.php', 'dev.php']) {
    const result = renderPhp(file, '', {
      setup: file === 'dev.php' ? "$_SERVER['REQUEST_URI'] = '/dev';" : ''
    });
    assert.equal(result.status, 200, file);
    assert.equal(result.diagnostics, '', file);
    const settings = result.body.slice(result.body.indexOf('<div id="settings-panel"'), result.body.indexOf('id="toggle-settings-panel-close-button"'));
    for (const id of controlIds) {
      assert.ok(!settings.includes(`id="${id}"`), `${id} must not appear in Settings`);
      assert.equal(result.body.split(`id="${id}"`).length - 1, file === 'dev.php' ? 1 : 0, `${file}: ${id}`);
    }
    if (file === 'dev.php') {
      assert.match(result.body, /<title>Pekosoft - Dev<\/title>/);
      assert.match(result.body, /rel="canonical" href="https:\/\/pekosoft.net\/dev"/);
      assert.match(result.body, /src="\/js\/settings\.js\?v=/);
    }
  }
});

test('tool Help links shared Meters documentation to General Help without legacy copies', () => {
  for (const release of [
    'bpm_calculator', 'bpm_circle', 'bpm_curve', 'circle_of_fifths', 'drum_machine',
    'metronome', 'piano', 'player', 'tap_pad', 'tuner', 'turntable'
  ]) {
    const result = renderPhp('help.php', `t=${release}`);
    assert.equal(result.status, 200, release);
    assert.equal(result.diagnostics, '', release);
    assert.match(result.body, /<h1>Meters <span class="object">module<\/span><\/h1>/, release);
    assert.match(result.body, /href="\/help\?t=index&amp;e=meters&amp;k=module"/, release);
    assert.doesNotMatch(result.body, /<h1>(Spectroscope|Level|Oscilloscope|Wavescope) <span class="object">button<\/span>/, release);
  }
});

test('meter contextual Help targets the matching General Help entries', () => {
  const help = renderPhp('help.php', 't=index');
  const tool = renderPhp('tools\\metronome.php');
  assert.equal(help.status, 200);
  assert.equal(help.diagnostics, '');
  assert.equal(tool.diagnostics, '');
  for (const [id, heading] of [
    ['tool-spectroscope-button', 'Spectroscope'], ['tool-level-button', 'Level'],
    ['tool-oscilloscope-button', 'Oscilloscope'], ['tool-wavescope-button', 'Wavescope'],
    ['tool-phasescope-button', 'Phasescope'], ['tool-bit-meter-button', 'Bit'],
    ['meters-play-button', 'Meter play'], ['meters-next-button', 'Next meter'],
    ['meters-all-button', 'All'], ['meters-freeze-button', 'Meter freeze'],
    ['meters-crosshair-button', 'Meter crosshair'], ['tool-guides-button', 'Guides'],
    ['tool-bright-button', 'Bright'], ['tool-rulers-button', 'Meter rulers'],
    ['tool-color-button', 'Color'], ['meters-save-button', 'Meter bitmap'],
    ['meters-copy-button', 'Meter bitmap']
  ]) {
    const button = tool.body.match(new RegExp(`<button id="${id}"[^>]*>`))?.[0];
    assert.ok(button, id);
    assert.match(button, /data-help-release="index"/, id);
    assert.ok(help.body.includes(`<h1>${heading} <span class="object">button</span></h1>`), heading);
  }
});

test('Meters tabs display the requested abbreviated labels', () => {
  const meters = renderPhp('meters.php');
  assert.equal(meters.status, 200);
  assert.equal(meters.diagnostics, '');
  const labels = Array.from(meters.body.matchAll(
    /<button\b[^>]*\bid="(tool-(?:spectroscope|oscilloscope|wavescope|phasescope)-button)"[^>]*>[\s\S]*?<span class="button-text">([^<]+)<\/span>/g
  ), match => [match[1], match[2]]);
  assert.deepEqual(labels, [
    ['tool-spectroscope-button', 'SPECTRO'],
    ['tool-oscilloscope-button', 'OSCILLO'],
    ['tool-wavescope-button', 'WAVE'],
    ['tool-phasescope-button', 'PHASE']
  ]);
});

test('launch introduction and shared previews use the approved product description', () => {
  const frontPage = renderPhp('index.php');
  const help = renderPhp('help.php', 't=index');
  assert.equal(frontPage.status, 200);
  assert.equal(help.status, 200);
  assert.equal(frontPage.diagnostics, '');
  assert.equal(help.diagnostics, '');
  assert.match(frontPage.body, /<meta name="description" content="Free online audio tools\.">/);
  assert.match(frontPage.body, /<meta property="og:description" content="Free online audio tools\.">/);
  assert.match(help.body, /Pekosoft is free online audio tools\. Have fun with Metronome, BPM Calculator, Tap Pad and Turntable\./);
  assert.doesNotMatch(help.body, /alpha versions|Not ready for real use|<h1>Open source<\/h1>/);
  assert.match(help.body, /<h1>Source available<\/h1>/);
});

test('private route restriction leaves public pages, tool redirects and the Updates feed reachable', () => {
  const routing = fs.readFileSync(path.join(__dirname, '..', '.htaccess'), 'utf8');
  const rule = routing.match(/^RewriteRule (\S+) - \[R=404,L\]$/m)?.[1];
  assert.ok(rule, 'A private-route restriction must be present');
  const privatePath = new RegExp(rule);
  for (const url of ['elements/head.php', 'elements/toc.php', 'data', 'data/updates.json']) {
    assert.ok(privatePath.test(url), url);
  }
  for (const url of ['', 'index.php', 'metronome', 'tools/metronome.php', 'help', 'updates', 'updates_data.php', 'icons.svg', 'css/main.css']) {
    assert.ok(!privatePath.test(url), url);
  }
});

test('official controls and global Sound and Rulers have matching contextual Help destinations', () => {
  for (const [release, heading] of [['metronome', 'Weight'], ['turntable', 'Standard']]) {
    const help = renderPhp('help.php', `t=${release}`);
    assert.equal(help.status, 200);
    assert.equal(help.diagnostics, '');
    assert.ok(help.body.includes(`<h1>${heading} <span class="object">button</span></h1>`), release);
  }
  const help = renderPhp('help.php', 't=index');
  for (const release of ['metronome', 'bpm_calculator', 'tap_pad', 'turntable']) {
    const tool = renderPhp(`tools\\${release}.php`);
    assert.equal(tool.status, 200, release);
    assert.equal(tool.diagnostics, '', release);
    for (const name of ['Sound', 'Rulers']) {
      const button = tool.body.match(new RegExp(`<button[^>]*data-setting-toggle="${name.toLowerCase()}"[^>]*>`))?.[0];
      assert.match(button || '', /data-help-release="index"/, `${release}: ${name}`);
      assert.ok(button.includes(`data-help-entry="${name}"`), `${release}: ${name}`);
      assert.ok(help.body.includes(`<h1>${name} <span class="object">option</span></h1>`), name);
    }
  }
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
