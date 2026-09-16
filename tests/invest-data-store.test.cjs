'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const store = require('../invest/data-store.js');
// Intentionally synthetic fixture. No restricted market data ships in tests.
function fixture() {
  return { schemaVersion: 1, kind: 'xuelema-invest-private', createdAt: '2026-01-01T00:00:00Z', market: {
    method: 'Synthetic unit-test values; not market data.', updatedAt: '2026-01-01T00:00:00Z',
    sources: [{ label: 'Fixture', url: 'https://example.com/fixture' }],
    rows: [{ month: '1999-12', nasdaq: 100, sp500: 100, gold: 100, fx: 7 }, { month: '2000-01', nasdaq: 90, sp500: 95, gold: 105, fx: 7.1 }]
  }, funds: { checkedAt: '2026-01-01T00:00:00Z', funds: [] } };
}
test('accepts a complete personal package without mutating it', () => {
  const pkg = fixture(), original = JSON.stringify(pkg);
  assert.equal(store.validate(pkg), pkg);
  assert.equal(JSON.stringify(pkg), original);
});
test('rejects other files, unsupported versions and absent provenance', () => {
  assert.throws(() => store.validate({}), /个人数据/);
  const pkg = fixture(); pkg.schemaVersion = 2;
  assert.throws(() => store.validate(pkg), /个人数据/);
  pkg.schemaVersion = 1; pkg.market.sources = [];
  assert.throws(() => store.validate(pkg), /来源/);
});
test('requires contiguous monthly data, baseline and strictly positive values', () => {
  let pkg = fixture(); pkg.market.rows[0].month = '2000-01';
  assert.throws(() => store.validate(pkg), /1999-12/);
  pkg = fixture(); pkg.market.rows[1].month = '2000-02';
  assert.throws(() => store.validate(pkg), /连续/);
  pkg = fixture(); pkg.market.rows[1].gold = null;
  assert.throws(() => store.validate(pkg), /gold/);
  pkg = fixture(); pkg.market.rows[0].fx = -1;
  assert.throws(() => store.validate(pkg), /fx/);
});
test('rejects current or future month rather than treating partial month as complete', () => {
  assert.throws(() => store.validate(fixture(), new Date('2000-01-20T00:00:00Z')), /未完成|未来/);
  assert.doesNotThrow(() => store.validate(fixture(), new Date('2000-02-01T00:00:00Z')));
});
test('rejects unsafe source links and invalid timestamps', () => {
  const pkg = fixture(); pkg.market.sources[0].url = 'javascript:alert(1)';
  assert.throws(() => store.validate(pkg), /HTTPS/);
  pkg.market.sources[0].url = 'https://example.com/'; pkg.createdAt = 'yesterday';
  assert.throws(() => store.validate(pkg), /日期/);
});
test('fund snapshot keeps unknown limits distinct from zero or unlimited', () => {
  const pkg = fixture();
  pkg.funds.funds.push({ code: '123456', name: '测试基金', index: 'nasdaq', url: 'https://example.com/fund', checkedAt: '2026-01-01T00:00:00Z', purchaseState: 'unknown', nav: null, purchaseLimit: null, purchaseFeePct: null, annualFeePct: null });
  assert.doesNotThrow(() => store.validate(pkg));
  pkg.funds.funds[0].purchaseLimit = -1;
  assert.throws(() => store.validate(pkg), /限额/);
  pkg.funds.funds[0].purchaseLimit = null; pkg.funds.funds.push(pkg.funds.funds[0]);
  assert.throws(() => store.validate(pkg), /重复/);
});
test('storage failures surface; there is no pretend successful persistence', async () => {
  await assert.rejects(store.save(fixture()), /本地数据保存/);
  await assert.rejects(store.load(), /本地数据保存/);
});
test('personal browser modules contain no network upload or remote data fetch', () => {
  for (const file of ['invest.js', 'data-store.js']) {
    const text = fs.readFileSync(path.join(__dirname, '..', 'invest', file), 'utf8');
    assert.doesNotMatch(text, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/);
  }
  const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  assert.doesNotMatch(sw, /market\.json|funds\.json|个人数据\.json/);
});
