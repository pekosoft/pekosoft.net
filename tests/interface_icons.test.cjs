const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const sprite = fs.readFileSync(path.join(__dirname, '..', 'icons.svg'), 'utf8');
function content(id) {
  const matches = [...sprite.matchAll(new RegExp(`<symbol id="${id}" viewBox="0 0 512 512">([\\s\\S]*?)<\\/symbol>`, 'g'))];
  assert.equal(matches.length, 1, id);
  return matches[0][1];
}

test('updated interface icons remain unique standalone monochrome geometry', () => {
  for (const id of ['clock', 'release', 'help', 'bars', 'loop', 'beat', 'knob', 'arrow_up_down', 'center', 'asterisk', 'ip', 'external', 'pulse', 'cassette']) {
    assert.doesNotMatch(content(id), /<(?:text|use|image)\b|\b(?:fill|stroke|style)\s*=|\bfont-/i, id);
  }
});

test('Circle Of Fifths Signature button uses the standalone Hash icon', () => {
  const icon = content('hash');
  assert.match(icon, /transform="translate\(51\.2 51\.2\) scale\(0\.8\)"/);
  assert.equal(51.2 + 0.8 * 256, 256);
  assert.doesNotMatch(icon, /<(?:text|use|image)\b|\b(?:fill|stroke|style)=/);
  assert.match(icon, /M184 0h48l-96 512H88Z/);
  assert.match(icon, /M376 0h48l-96 512h-48Z/);
  assert.match(icon, /M32 144h480v48H32ZM0 320h480v48H0Z/);
  const template = fs.readFileSync(path.join(__dirname, '..', 'tools', 'circle_of_fifths.php'), 'utf8');
  const button = template.match(/<button id="toggle-signature-button"[\s\S]*?<\/button>/)[0];
  assert.match(button, /href="\/icons\.svg#hash"/);
  assert.match(button, /title="Toggle key signature ring"/);
});

test('Circle Of Fifths Arrows button uses four outward triangles and its concise tooltip', () => {
  const icon = content('arrows');
  assert.doesNotMatch(icon, /<(?:text|use|image)\b|\b(?:fill|stroke|style)=/);
  assert.match(icon, /d="M256 0l80 144H176ZM512 256l-144 80V176ZM256 512l-80-144h160ZM0 256l144-80v160Z"/);
  const template = fs.readFileSync(path.join(__dirname, '..', 'tools', 'circle_of_fifths.php'), 'utf8');
  const button = template.match(/<button id="toggle-arrows-button"[\s\S]*?<\/button>/)[0];
  assert.match(button, /href="\/icons\.svg#arrows"/);
  assert.match(button, /title="Toggle arrows"/);
});

test('BPM Curve leaves circular transparent gaps around three unchanged dots', () => {
  const icon = content('bpm_curve');
  const circles = [...icon.matchAll(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"\s*\/>/g)];
  assert.deepEqual(circles.map(([, x, y, radius]) => [Number(x), Number(y), Number(radius)]),
    [[48, 341.34, 48], [256, 170.65, 48], [464, 341.34, 48]]);
  const paths = [...icon.matchAll(/\bd="([^"]+)"/g)].map(([, data]) => data);
  assert.equal(paths.length, 2);
  assert.equal(paths[0], paths[1]);
  assert.equal([...paths[0].matchAll(/A64 64/g)].length, 2);
  assert.match(icon, /transform="translate\(512 0\) scale\(-1 1\)"/);
  assert.doesNotMatch(icon, /<(?:mask|clipPath|use)\b|\b(?:fill|stroke|style)=/);
});

test('Crosshair and circular labels have stronger lines, with an enlarged Pivot dot', () => {
  for (const id of ['label_l', 'label_s', 'pivot', 'jukebox']) {
    assert.match(content(id), /fill-rule="evenodd" d="M256 0a256 256/);
    assert.match(content(id), /M256 32a224 224/);
  }
  for (const [id, radius] of [['label_l', 86], ['label_s', 72], ['pivot', 12], ['jukebox', 32]]) {
    assert.match(content(id), new RegExp(`<circle cx="256" cy="256" r="${radius}"`));
  }
  assert.match(content('crosshair'), /M256 96a160 160/);
  assert.match(content('crosshair'), /M240 0h32v240h240v32H272v240h-32V272H0v-32h240Z/);
});

test('Archive, Battery Full and RAM are single merged silhouettes', () => {
  for (const id of ['archive', 'battery_full', 'ram']) {
    const icon = content(id);
    assert.equal([...icon.matchAll(/<path\b/g)].length, 1, id);
    assert.doesNotMatch(icon, /<(?:rect|polygon|circle|use)\b/, id);
    assert.equal(icon.match(/\bd="([^"]+)"/)[1].split('Z').filter(Boolean).length, 1, id);
  }
});

test('Circle Of Fifths matches BPM Circle band weights with twelve sectors and no triangles', () => {
  const icon = content('circle_of_fifths');
  const paths = [...icon.matchAll(/\bd="([^"]+)"/g)].map(([, data]) => data);
  assert.equal(paths.length, 12);
  assert.equal(new Set(paths).size, 1);
  assert.equal(paths[0].split('Z').filter(Boolean).length, 2);
  assert.deepEqual([...paths[0].matchAll(/A(\d+) (\d+)/g)].map(([, radius]) => Number(radius)),
    [256, 198, 186, 134]);
  assert.doesNotMatch(icon, /<(?:circle|polygon|use)\b/);
  const rotations = [...icon.matchAll(/rotate\((\d+) 256 256\)/g)].map(([, angle]) => Number(angle));
  assert.deepEqual(rotations, Array.from({ length: 11 }, (_, index) => (index + 1) * 30));
});

test('Cassette replaces Recorder with a single simple path and symmetric reel cutouts', () => {
  assert.doesNotMatch(sprite, /<symbol id="recorder"/);
  const icon = content('cassette');
  assert.equal([...icon.matchAll(/<path\b/g)].length, 1);
  assert.match(icon, /fill-rule="evenodd"/);
  const data = icon.match(/\bd="([^"]+)"/)[1];
  assert.ok(data.length < 320);
  assert.match(data, /M144 176a48 48 0 1 0 0 96 48 48 0 1 0 0-96Z/);
  assert.match(data, /M368 176a48 48 0 1 0 0 96 48 48 0 1 0 0-96Z/);
  assert.match(data, /M224 192h64v64h-64Z/);
  assert.match(data, /M160 336h192l32 64H128Z/);
});

test('Pulse horizontal sections share exact edges and preserve the pulse peaks', () => {
  const data = content('pulse').match(/\bd="([^"]+)"/)[1];
  const left = data.match(/^M0 ([\d.]+)V([\d.]+)H132\.65/);
  const right = data.match(/L411\.93 ([\d.]+)H512V([\d.]+)H379\.35/);
  assert.equal(left[1], right[2]);
  assert.equal(left[2], right[1]);
  assert.match(data, /L100\.07 279\.27H0Z$/);
  assert.match(data, /L186\.18 374\.68L325\.82 6\.4/);
  assert.match(data, /L325\.82 137\.32L186\.18 505\.61/);
});

test('External has square corners and flat ends while retaining its scale and arrow direction', () => {
  const icon = content('external');
  assert.match(icon, /transform="scale\(21\.333333\)"/);
  const data = icon.match(/\bd="([^"]+)"/)[1];
  assert.doesNotMatch(data, /[aAcCqQsStT]/);
  assert.equal(data, 'M13 3h8v8h-2V6.414l-9.293 9.293-1.414-1.414L17.586 5H13V3ZM3 5h8v2H5v12h12v-6h2v8H3V5Z');
});

test('Asterisk is reduced by ten percent around the canvas center', () => {
  const icon = content('asterisk');
  assert.match(icon, /<g transform="translate\(25\.6 25\.6\) scale\(0\.9\)">[\s\S]*<path\b[\s\S]*<\/g>/);
  assert.equal([...icon.matchAll(/<path\b/g)].length, 1);
  assert.equal(25.6 + 0.9 * 256, 256);
});

test('IP retains its location pin and circular cutout without an interior rectangle', () => {
  const icon = content('ip');
  assert.doesNotMatch(icon, /<rect\b/);
  assert.equal([...icon.matchAll(/<path\b/g)].length, 1);
  assert.match(icon, /M256 0C156\.589 0 76 80\.589 76 180/);
  assert.match(icon, /M256 256c-44\.183 0-80-35\.817-80-80/);
});

test('Center has four inward arrows and a central point, and is wired to Icons Controls', () => {
  const icon = content('center');
  assert.match(icon, /<circle cx="256" cy="256" r="24"\s*\/>/);
  const data = icon.match(/\bd="([^"]+)"/)[1];
  assert.equal(data.split('Z').filter(Boolean).length, 4);
  assert.match(data, /^M0 240h128v-48l64 64-64 64v-48H0Z/);
  assert.match(data, /M512 240H384v-48l-64 64 64 64v-48h128Z/);
  assert.match(data, /M240 0h32v128h48l-64 64-64-64h48Z/);
  assert.match(data, /M240 512v-128h-48l64-64 64 64h-48v128Z$/);
  const template = fs.readFileSync(path.join(__dirname, '..', 'tools', 'icons.php'), 'utf8');
  const button = template.match(/<button id="center-button"[\s\S]*?<\/button>/)[0];
  assert.match(button, /<use href="\/icons\.svg#center"\s*\/>/);
  assert.match(button, /title="Center selected elements"/);
});

test('Up and down arrows move to the canvas edges without changing their shapes', () => {
  const polygons = [...content('arrow_up_down').matchAll(/<polygon points="([^"]+)"/g)];
  const original = [
    [272,160,160,0,48,160,128,160,128,512,192,512,192,160,272,160],
    [240,352,352,512,464,352,384,352,384,0,320,0,320,352,240,352]
  ];
  assert.equal(polygons.length, 2);
  polygons.forEach(([, points], index) => {
    const values = points.split(/\s+/).map(Number);
    assert.deepEqual(values, original[index].map((value, coordinate) =>
      coordinate % 2 === 0 ? value + (index === 0 ? -48 : 48) : value));
    const horizontal = values.filter((_, coordinate) => coordinate % 2 === 0);
    assert.equal(index === 0 ? Math.min(...horizontal) : Math.max(...horizontal), index === 0 ? 0 : 512);
  });
});

test('Knob pointer follows the knob curve while preserving its endpoints and width', () => {
  const icon = content('knob');
  assert.match(icon, /fill-rule="evenodd"/);
  assert.match(icon, /M256,40A216,216,0,1,0,256,472A216,216,0,1,0,256,40Z/);
  assert.match(icon, /M408\.97,136\.97L272\.97,272\.97A24,24,0,0,1,239\.03,239\.03L375\.03,103\.03A193\.825,193\.825,0,0,1,408\.97,136\.97Z/);
  for (const [x, y] of [[375.03, 103.03], [408.97, 136.97]]) {
    assert.ok(Math.abs(Math.hypot(x - 256, y - 256) - 193.825) < 0.001);
  }
});

test('Beat centers its lower cutout without changing the body, cutout size or height', () => {
  const data = content('beat').match(/\bd="([^"]+)"/)[1];
  assert.equal(data, 'M256,64c-123.71,0-224,100.29-224,224s100.29,224,224,224,224-100.29,224-224-100.29-224-224-224ZM256,448c-35.35,0-64-28.65-64-64s28.65-64,64-64,64,28.65,64,64-28.65,64-64,64Z');
});

test('Clock, Release and Help share the outlined circular rim and retain interior symbols', () => {
  for (const id of ['clock', 'release', 'help']) {
    const icon = content(id);
    assert.match(icon, /fill-rule="evenodd"/, id);
    assert.match(icon, /M256 32a224 224/, id);
    assert.ok([...icon.matchAll(/<path\b/g)].length >= 2, id);
  }
});

test('Clock has no hour markers and an extended vertical hand', () => {
  const icon = content('clock');
  assert.doesNotMatch(icon, /<circle\b/);
  assert.equal([...icon.matchAll(/<path\b/g)].length, 2);
  assert.doesNotMatch(icon, /\btransform=/);
  assert.match(icon, /M240 80h32v160h112v32H240V80Z/);
});

test('Help uses a reduced lighter question mark and a round dot', () => {
  const icon = content('help');
  assert.match(icon, /<path d="M196 184l-60-8c4-64 48-108 120-108/);
  assert.match(icon, /h-56c0-50 12-74 48-104/);
  assert.match(icon, /<circle cx="256" cy="416" r="32"\s*\/>/);
  assert.equal([...icon.matchAll(/<circle\b/g)].length, 1);
});

test('Release keeps its slash shorter without changing the surrounding rim', () => {
  assert.match(content('release'), /<path d="M208.349 400H165.932L303.853 112h42.226L208.349 400Z"/);
});

test('Bars retains its filled portion and uses a thicker track border', () => {
  assert.match(content('bars'), /fill-rule="evenodd" d="M0 156h512v200H0ZM160 188v136h320V188H160Z"/);
  assert.equal(188 - 156, 32);
  assert.equal(512 - 480, 32);
  assert.equal(356 - 324, 32);
});

test('Loop rounds only its two bends while keeping sharp heads and flat ends', () => {
  const data = content('loop').match(/\bd="([^"]+)"/)[1];
  assert.equal([...data.matchAll(/M/g)].length, 2);
  assert.equal([...data.matchAll(/Z/g)].length, 2);
  assert.doesNotMatch(data, /[QC]/);
  assert.equal([...data.matchAll(/a64 64/g)].length, 2);
  assert.equal([...data.matchAll(/a12\.8 12\.8/g)].length, 2);
  assert.match(data, /^M128 512L25\.6 409\.6L128 307\.2L163\.84 344\.32L124\.16 384/);
  assert.match(data, /L348\.16 37\.12L384 0L486\.4 102\.4L384 204\.8L348\.16 167\.68/);
  assert.match(data, /V281\.6h51\.2/);
  assert.match(data, /v89\.6H76\.8Z$/);
});
