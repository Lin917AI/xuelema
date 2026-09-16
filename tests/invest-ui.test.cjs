'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Engine = require('../invest/engine.js');
const events = require('../invest/events.js');
const html = fs.readFileSync(path.join(__dirname, '../invest/index.html'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, '../invest/invest.js'), 'utf8');

// Exercise real UI handlers with synthetic prices and a deterministic clock.
async function page(start = '2000-01', end = '2025-04') {
  const nodes = {}, documentHandlers = {}, timers = new Map();
  let nextTimer = 0;
  function node(id) {
    if (!nodes[id]) nodes[id] = {
      value: '', hidden: false, disabled: false, open: false, textContent: '', innerHTML: '',
      style: {}, dataset: {}, options: [{}], handlers: {}, focusCount: 0,
      classList: { add() {}, toggle() {} }, setAttribute() {}, scrollIntoView() {},
      addEventListener(name, handler) { this.handlers[name] = handler; },
      focus() { this.focusCount++; },
      showModal() { this.open = true; },
      close() { this.open = false; if (this.handlers.close) this.handlers.close(); }
    };
    return nodes[id];
  }
  const values = { 'start-month': start, 'end-month': end, 'end-mode': 'custom', monthly: '1000', initial: '0', fee: '0', currency: 'CNY', 'annual-currency': 'CNY', 'fund-index': 'all', 'fund-state': 'all' };
  for (const [id, value] of Object.entries(values)) node(id).value = value;
  const speedOptions = [...html.match(/<select id="speed">(.*?)<\/select>/s)[1].matchAll(/value="(\d+)"/g)].map(m => m[1]);
  node('speed').value = speedOptions[0];
  const rows = [];
  for (let month = '1999-12'; month <= '2025-04'; month = Engine.nextMonth(month)) rows.push({ month, nasdaq: 100, sp500: 100, gold: 100, fx: 7 });
  const root = { dataset: {} };
  const document = {
    documentElement: root, getElementById: node, hidden: false,
    querySelectorAll: () => [],
    querySelector: selector => selector.includes('input[name="asset"]') ? { value: 'nasdaq' } : node(selector),
    addEventListener: (name, handler) => { documentHandlers[name] = handler; }
  };
  const window = { InvestEngine: Engine, INVEST_EVENTS: events, addEventListener() {}, InvestDataStore: {
    validate() {}, load: async () => ({ market: { rows, method: 'Synthetic test prices only', sources: [{ label: 'test', url: 'https://example.com/' }] } })
  } };
  vm.runInNewContext(script, { document, window, URL, Intl, Date, console,
    setTimeout: (fn, delay) => { const id = ++nextTimer; timers.set(id, { fn, delay }); return id; },
    clearTimeout: id => timers.delete(id)
  });
  await Promise.resolve();
  assert.equal(node('start-button').disabled, false);
  const fire = (id, name = 'click') => node(id).handlers[name].call(node(id), { preventDefault() {} });
  return { node, fire, root, documentHandlers, timers, speedOptions,
    start: () => fire('setup-form', 'submit'),
    tick: () => { const [id, timer] = [...timers][0]; timers.delete(id); timer.fn(); return timer.delay; }
  };
}

test('only 1x and 5x remain, with 220ms and 44ms timer cadence', async () => {
  const p = await page('2000-01', '2000-12');
  assert.deepEqual(p.speedOptions, ['220', '44']);
  p.start();
  assert.equal(p.tick(), 220);
  assert.equal(p.node('current-month').textContent, '2000 年 2 月');
  p.node('speed').value = '44'; p.fire('speed', 'change');
  assert.equal(p.timers.size, 1, 'changing speed replaces the timer instead of doubling playback');
  assert.equal(p.tick(), 44);
  assert.equal(p.node('current-month').textContent, '2000 年 3 月');
  assert.equal(p.node('event-dialog').open, true);
  assert.equal(p.timers.size, 0, 'major event must pause even at 5x');
  p.fire('event-continue');
  assert.equal(p.timers.size, 1);
});

test('next node traverses only the eight major events, then completes without repeats', async () => {
  const p = await page(); p.start();
  const visited = [];
  for (const event of events) {
    p.fire('next-event-button');
    assert.equal(p.node('event-dialog').open, true);
    assert.equal(p.node('event-title').textContent, event.title);
    assert.equal(p.timers.size, 0);
    visited.push(p.node('current-month').textContent);
    p.fire('event-close');
  }
  assert.equal(new Set(visited).size, 8);
  assert.equal(p.node('event-adjust').hidden, true, 'cannot change a contribution beyond the final month');
  p.fire('play-button');
  assert.equal(p.node('play-button').disabled, true);
  assert.equal(p.node('results').hidden, false);
  assert.match(p.node('results').innerHTML, /2000-01 至 2025-04/);
});

test('pointer entry avoids forced playback focus; keyboard entry keeps accessible focus', async () => {
  const p = await page(); p.start();
  assert.equal(p.root.dataset.inputMode, 'pointer');
  assert.equal(p.node('play-button').focusCount, 0);
  p.fire('restart-button');
  p.documentHandlers.keydown({ key: 'Tab' }); p.start();
  assert.equal(p.root.dataset.inputMode, 'keyboard');
  assert.equal(p.node('play-button').focusCount, 1);
  p.documentHandlers.pointerdown({ pointerType: 'touch' });
  assert.equal(p.root.dataset.inputMode, 'pointer');
});

test('start-time label and free date choice remain without the removed presets', () => {
  assert.match(html, /<label for="start-month">开始时间<\/label>/);
  assert.match(html, /id="end-mode"/);
  assert.match(html, /id="end-month" type="month"/);
  assert.doesNotMatch(html + script, /data-preset|preset-row|快速选择历史区间/);
});
