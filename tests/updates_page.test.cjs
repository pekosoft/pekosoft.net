const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { setImmediate: settle } = require('node:timers/promises');

const script = fs.readFileSync(path.join(__dirname, '..', 'js', 'updates_page.js'), 'utf8');

async function createUpdates({ savedPage, count = 60, failingPages = [] } = {}) {
  const storage = new Map(savedPage === undefined ? [] : [['updates.page', savedPage]]);
  const requests = [];
  const warnings = [];
  function element() {
    return {
      children: [], dataset: {}, handlers: {},
      replaceChildren() { this.children = []; },
      appendChild(child) { this.children.push(child); },
      append(...children) { this.children.push(...children); },
      addEventListener(event, handler) { this.handlers[event] = handler; },
      click() { return this.handlers.click(); }
    };
  }
  const nodes = {
    'updates-runs': element(),
    'updates-previous-button': element(),
    'updates-next-button': element(),
    'updates-page': element()
  };
  vm.runInNewContext(script, {
    document: {
      getElementById(id) { return nodes[id]; },
      createElement: element
    },
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, value); }
    },
    console: { warn(...args) { warnings.push(args); } },
    fetch: async url => {
      const page = Number(new URL(url, 'http://localhost').searchParams.get('page'));
      requests.push(page);
      if (failingPages.includes(page)) return { ok: false, status: 503 };
      const length = Math.max(0, Math.min(25, count - (page - 1) * 25));
      const workflow_runs = Array.from({ length }, (_, index) => ({
        display_title: `Update ${index}`, head_sha: 'abcdefg', created_at: '2026-01-01T00:00:00Z'
      }));
      return { ok: true, json: async () => ({ workflow_runs, total_count: count }) };
    }
  });
  await settle();
  return { nodes, requests, storage, warnings };
}

test('Updates saves navigation and restores the selected page', async () => {
  const first = await createUpdates();
  await first.nodes['updates-next-button'].click();
  assert.equal(first.storage.get('updates.page'), '2');
  assert.equal(first.nodes['updates-page'].textContent, 'Page 2 of 3');

  const restored = await createUpdates({ savedPage: first.storage.get('updates.page') });
  assert.deepEqual(restored.requests, [2]);
  assert.equal(restored.nodes['updates-page'].textContent, 'Page 2 of 3');
  assert.equal(restored.nodes['updates-runs'].children.length, 25);
});

test('Updates reloads the last available page when the saved page is out of range', async () => {
  const updates = await createUpdates({ savedPage: '8' });
  assert.deepEqual(updates.requests, [8, 3]);
  assert.equal(updates.storage.get('updates.page'), '3');
  assert.equal(updates.nodes['updates-page'].textContent, 'Page 3 of 3');
  assert.equal(updates.nodes['updates-runs'].children.length, 10);
});

test('Updates reports invalid saved pages and starts at the first page', async () => {
  for (const savedPage of ['0', '2.5', '12x', '9007199254740992']) {
    const updates = await createUpdates({ savedPage });
    assert.deepEqual(updates.requests, [1]);
    assert.equal(updates.storage.get('updates.page'), '1');
    assert.equal(updates.warnings.length, 1);
  }
});

test('Updates keeps the saved page if loading another page fails', async () => {
  const updates = await createUpdates({ savedPage: '2', failingPages: [3] });
  await updates.nodes['updates-next-button'].click();
  assert.equal(updates.storage.get('updates.page'), '2');
  assert.equal(updates.nodes['updates-page'].textContent, 'Page 2 of 3');
  assert.equal(updates.nodes['updates-runs'].children[0].children[0].textContent, 'Updates unavailable');
  assert.equal(updates.warnings.length, 1);
});
