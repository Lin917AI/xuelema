'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function worker() {
  const handlers = {}, deleted = [], stored = [];
  const context = { URL, Request, Response, Promise,
    self: { registration: { scope: 'https://example.com/xuelema/' }, location: { origin: 'https://example.com' }, clients: { claim: () => Promise.resolve() }, skipWaiting: () => Promise.resolve(), addEventListener: (name, fn) => { handlers[name] = fn; } },
    caches: { open: async () => ({ addAll: async (urls) => { stored.push(...urls); }, put: async () => {} }), keys: async () => ['xuelema-v12', 'xuelema-v13', 'another-app-v2'], delete: async (key) => { deleted.push(key); }, match: async (req) => new Response('cached:' + req.url) },
    fetch: async () => { throw new Error('offline'); }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), context);
  return { context, handlers, deleted, stored };
}
test('offline home and investment navigation use separate cached pages under Pages subpath', async () => {
  const w = worker();
  for (const [url, expected] of [['https://example.com/xuelema/?v=2.0', '/index.html?v=3.0'], ['https://example.com/xuelema/invest/', '/invest/index.html?v=3.0'], ['https://example.com/xuelema/invest/index.html', '/invest/index.html?v=3.0']]) {
    let response;
    w.handlers.fetch({ request: { method: 'GET', mode: 'navigate', url }, respondWith: (p) => { response = p; }, waitUntil: () => {} });
    assert.equal(await (await response).text(), 'cached:https://example.com/xuelema' + expected);
  }
});
test('unknown navigation is not silently replaced with homepage', async () => {
  const w = worker(); let response;
  w.handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: 'https://example.com/xuelema/unknown' }, respondWith: (p) => { response = p; }, waitUntil: () => {} });
  assert.equal(await (await response).text(), 'cached:https://example.com/xuelema/unknown');
});
test('cache cleanup never deletes another project cache or IndexedDB', async () => {
  const w = worker(); let work;
  w.handlers.activate({ waitUntil: (p) => { work = p; } }); await work;
  assert.deepEqual(w.deleted, ['xuelema-v12']);
});
test('all precache files exist and no private dataset enters public cache', async () => {
  const w = worker(); let work;
  w.handlers.install({ waitUntil: (p) => { work = p; } }); await work;
  assert.ok(w.stored.includes('./invest/data-store.js?v=3.0'));
  for (const url of w.stored) {
    assert.doesNotMatch(url, /个人数据|\.json(?:\?|$)/);
    assert.ok(fs.existsSync(path.join(__dirname, '..', url.split('?')[0])), url);
  }
});
