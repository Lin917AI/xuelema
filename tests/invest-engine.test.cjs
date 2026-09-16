'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Engine = require('../invest/engine.js');

function close(actual, expected, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon * Math.max(1, Math.abs(expected)), `${actual} ≠ ${expected}`);
}

function market(prices, start = '1999-12', fx = 1) {
  let month = start;
  return { rows: prices.map((value) => {
    const row = { month, nasdaq: value, sp500: value, gold: value, fx };
    month = Engine.nextMonth(month);
    return row;
  }) };
}

function options(overrides = {}) {
  return { asset: 'nasdaq', currency: 'USD', start: '2000-01', end: '2000-03', initial: 0, monthly: 100, feeAnnual: 0, changes: [], ...overrides };
}

test('UMD module works both in Node and as browser global without dependencies', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../invest/engine.js'), 'utf8'), context);
  assert.equal(typeof context.InvestEngine.simulate, 'function');
  assert.equal(context.InvestEngine.nextMonth('2000-12'), '2001-01');
  assert.deepEqual(Object.keys(Engine).sort(), ['annualReturns', 'nextMonth', 'simulate']);
});

test('month-start buys use preceding price; first contribution includes initial plus monthly', () => {
  const result = Engine.simulate(market([100, 200, 100, 150]), options({ initial: 100 }));
  assert.deepEqual(result.points.map((point) => point.contribution), [200, 100, 100]);
  assert.deepEqual(result.points.map((point) => point.units), [2, 2.5, 3.5]);
  assert.deepEqual(result.points.map((point) => point.value), [400, 250, 525]);
  assert.deepEqual(result.points.map((point) => point.price), [200, 100, 150]);
  assert.equal(result.summary.invested, 400);
  assert.equal(result.summary.value, 525);
  assert.equal(result.summary.profit, 125);
  close(result.summary.returnPct, 31.25);
});

test('CNY asset prices use each month’s CNY/USD rate on both buys and valuations', () => {
  const data = market([100, 110, 100, 100]);
  data.rows.forEach((row, index) => { row.fx = [7, 8, 6, 6][index]; });
  const cny = Engine.simulate(data, options({ currency: 'CNY', initial: 700, monthly: 0 }));
  const usd = Engine.simulate(data, options({ initial: 100, monthly: 0 }));
  assert.equal(cny.points[0].value, 880);
  close(cny.points[0].nav, 880 / 700);
  assert.equal(cny.summary.value, 600);
  assert.equal(usd.points[0].value, 110);
  assert.equal(usd.summary.value, 100);
});

test('each selected asset is priced independently', () => {
  const data = market([100, 100]);
  data.rows[1].sp500 = 110;
  data.rows[1].gold = 80;
  for (const [asset, expected] of [['nasdaq', 100], ['sp500', 110], ['gold', 80]]) {
    close(Engine.simulate(data, options({ asset, end: '2000-01' })).summary.value, expected);
  }
});

test('zero monthly contribution pauses purchases without selling holdings; a later change resumes', () => {
  const result = Engine.simulate(market([100, 100, 80, 100, 100]), options({
    end: '2000-04', changes: [{ month: '2000-03', amount: 200 }, { month: '2000-02', amount: 0 }]
  }));
  assert.deepEqual(result.points.map((point) => point.monthly), [100, 0, 200, 200]);
  assert.deepEqual(result.points.map((point) => point.contribution), [100, 0, 200, 200]);
  assert.equal(result.points[1].units, result.points[0].units);
  assert.equal(result.summary.invested, 500);
  assert.equal(result.summary.value, 550);
});

test('event decisions affect only their explicit next-month effective date, never the event month', () => {
  const data = market([100, 100, 50, 100]);
  const baseline = Engine.simulate(data, options());
  const eventMonth = '2000-02';
  const changed = Engine.simulate(data, options({ changes: [{ month: Engine.nextMonth(eventMonth), amount: 0 }] }));
  assert.deepEqual(changed.points.slice(0, 2), baseline.points.slice(0, 2));
  assert.equal(changed.points[2].contribution, 0);
  assert.equal(changed.summary.invested, 200);
  assert.equal(baseline.summary.invested, 300);
});

test('an explicit first-month adjustment changes monthly amount, not initial capital', () => {
  const result = Engine.simulate(market([100, 100, 100, 100]), options({
    initial: 200, changes: [{ month: '2000-01', amount: 0 }]
  }));
  assert.deepEqual(result.points.map((point) => point.contribution), [200, 0, 0]);
});

test('additional annual fee deducts units with exact effective monthly retention once', () => {
  const data = market(Array(13).fill(100));
  const result = Engine.simulate(data, options({ end: '2000-12', initial: 1000, monthly: 0, feeAnnual: 10 }));
  close(result.summary.value, 900);
  close(result.points[0].units, 10 * Math.pow(0.9, 1 / 12));
  close(result.points[11].nav, 0.9);
  close(result.yearly[0].returnPct, -10);
  const noFee = Engine.simulate(data, options({ end: '2000-12', initial: 1000, monthly: 0 }));
  assert.equal(noFee.summary.value, 1000);
  assert.equal(noFee.points[11].nav, 1);
});

test('XIRR uses actual first-day investments and leap-year final calendar day', () => {
  // 2000-01-01 to 2000-12-31 spans exactly 365 days.
  const data = market([100, ...Array(11).fill(100), 200]);
  const result = Engine.simulate(data, options({ end: '2000-12', initial: 1000, monthly: 0 }));
  close(result.summary.xirrPct, 100);
});

test('XIRR annualization uses 364 days for a non-leap full calendar year', () => {
  const data = market([100, ...Array(11).fill(100), 110], '2000-12');
  const result = Engine.simulate(data, options({ start: '2001-01', end: '2001-12', initial: 1000, monthly: 0 }));
  close(result.summary.xirrPct, (Math.pow(1.1, 365 / 364) - 1) * 100);
});

test('XIRR returns zero on flat one-month and recurring investments and null with no investments', () => {
  const data = market([100, 100, 100, 100]);
  assert.equal(Engine.simulate(data, options({ end: '2000-01' })).summary.xirrPct, 0);
  assert.equal(Engine.simulate(data, options()).summary.xirrPct, 0);
  const empty = Engine.simulate(data, options({ initial: 0, monthly: 0 }));
  assert.equal(empty.summary.xirrPct, null);
  assert.equal(empty.summary.returnPct, null);
  assert.equal(empty.summary.value, 0);
});

test('XIRR satisfies the independently calculated discounted cashflow equation', () => {
  const result = Engine.simulate(market([100, 120, 80, 90]), options({ initial: 250, monthly: 100 }));
  const rate = result.summary.xirrPct / 100;
  const start = Date.UTC(2000, 0, 1);
  let npv = 0;
  for (const point of result.points) {
    const date = Date.UTC(Number(point.month.slice(0, 4)), Number(point.month.slice(5)) - 1, 1);
    npv -= point.contribution / Math.pow(1 + rate, (date - start) / 86400000 / 365);
  }
  npv += result.summary.value / Math.pow(1 + rate, (Date.UTC(2000, 2, 31) - start) / 86400000 / 365);
  close(npv, 0, 1e-7);
});

test('deep-loss short-term XIRR remains valid near -100 percent', () => {
  const result = Engine.simulate(market([100, 50]), options({ end: '2000-01' }));
  close(result.summary.xirrPct, (Math.pow(0.5, 365 / 30) - 1) * 100);
});

test('drawdown and unit NAV do not depend on initial capital or large deposits', () => {
  const data = market([100, 120, 60, 90]);
  const small = Engine.simulate(data, options({ monthly: 1 }));
  const large = Engine.simulate(data, options({ initial: 1000000, monthly: 10000, changes: [{ month: '2000-02', amount: 10000000 }] }));
  assert.deepEqual(small.points.map((point) => point.nav), large.points.map((point) => point.nav));
  assert.deepEqual(small.points.map((point) => point.drawdown), large.points.map((point) => point.drawdown));
  close(small.summary.maxDrawdownPct, -50);
  close(large.summary.maxDrawdownPct, -50);
  assert.equal(small.summary.underwaterMonths, 2);
  assert.equal(small.summary.recoveryMonths, 0);
});

test('recovery is longest completed peak-to-peak cycle and underwater is the unfinished tail', () => {
  const result = Engine.simulate(market([100, 100, 50, 70, 100, 80, 100, 90, 80]), options({ end: '2000-08' }));
  assert.equal(result.summary.recoveryMonths, 3);
  assert.equal(result.summary.underwaterMonths, 2);
  close(result.summary.maxDrawdownPct, -50);
  assert.equal(result.points[3].drawdown, 0);
});

test('first-month loss is measured from the initial NAV of one', () => {
  const result = Engine.simulate(market([100, 50]), options({ end: '2000-01' }));
  close(result.summary.maxDrawdownPct, -50);
  assert.equal(result.summary.underwaterMonths, 1);
});

test('annual returns use each calendar year’s own reference price and flag partial years', () => {
  // 2000 selected in full doubles; January 2001 returns +10%, not +120%.
  const data = market([100, ...Array(11).fill(100), 200, 220]);
  const yearly = Engine.annualReturns(data, 'nasdaq', 'USD', '2000-01', '2001-01');
  assert.deepEqual(yearly.map(({ year, partial }) => ({ year, partial })), [
    { year: 2000, partial: false }, { year: 2001, partial: true }
  ]);
  close(yearly[0].returnPct, 100);
  close(yearly[1].returnPct, 10);
  const partial = Engine.annualReturns(data, 'nasdaq', 'USD', '2000-12', '2001-01');
  assert.ok(partial.every((year) => year.partial));
  close(partial[0].returnPct, 100);
  const result = Engine.simulate(data, options({ end: '2001-01' }));
  assert.deepEqual(result.yearly, yearly);
  assert.deepEqual(result.summary.bestYear, yearly[0]);
  assert.deepEqual(result.summary.worstYear, yearly[1]);
});

test('annual returns reflect FX and fees but not cashflows', () => {
  const data = market(Array(13).fill(100), '1999-12', 7);
  data.rows[12].fx = 8;
  const yearly = Engine.annualReturns(data, 'gold', 'CNY', '2000-01', '2000-12', 1);
  close(yearly[0].returnPct, (8 / 7 * 0.99 - 1) * 100);
  const result = Engine.simulate(data, options({ asset: 'gold', currency: 'CNY', end: '2000-12', feeAnnual: 1, changes: [{ month: '2000-07', amount: 0 }] }));
  assert.deepEqual(result.yearly, yearly);
});

test('range can start at 2000-01, end at last row, and consist of one month', () => {
  const data = market([100, 110, 120]);
  const result = Engine.simulate(data, options({ start: '2000-02', end: '2000-02' }));
  assert.equal(result.points.length, 1);
  close(result.summary.value, 100 * 120 / 110);
  assert.equal(result.yearly[0].partial, true);
});

test('month arithmetic validates dates and rolls December to January', () => {
  assert.equal(Engine.nextMonth('2000-12'), '2001-01');
  assert.equal(Engine.nextMonth('2024-02'), '2024-03');
  for (const month of ['2000-1', '2000-00', '2000-13', '2000-01-01', '0000-01', '', null]) {
    assert.throws(() => Engine.nextMonth(month), /月份|年份/);
  }
  assert.throws(() => Engine.nextMonth('9999-12'), /范围/);
});

test('invalid inputs reject with Chinese errors instead of coercion or silent adjustment', () => {
  const data = market([100, 100, 100, 100]);
  const invalidOptions = [
    { asset: 'bitcoin' }, { currency: 'EUR' }, { start: '1999-12' },
    { start: '2000-00' }, { start: '2000-1' }, { start: '2000-04' },
    { start: '2000-02', end: '2000-01' }, { end: '2000-04' },
    { initial: -1 }, { initial: Infinity }, { initial: NaN }, { initial: 100000001 },
    { monthly: '100' }, { monthly: -1 }, { monthly: Infinity }, { monthly: 100000001 },
    { feeAnnual: -0.1 }, { feeAnnual: 10.1 }, { feeAnnual: NaN }, { feeAnnual: '1' },
    { changes: null }, { changes: [null] }, { changes: [{ month: '2000-04', amount: 0 }] },
    { changes: [{ month: '2000-00', amount: 0 }] }, { changes: [{ month: '2000-02', amount: -1 }] },
    { changes: [{ month: '2000-02', amount: 100000001 }] },
    { changes: [{ month: '2000-02', amount: 0 }, { month: '2000-02', amount: 50 }] }
  ];
  for (const invalid of invalidOptions) assert.throws(() => Engine.simulate(data, options(invalid)), /[\u4e00-\u9fff]/);
  assert.throws(() => Engine.simulate(data, null), /参数/);
  assert.throws(() => Engine.simulate({ rows: [] }, options()), /数据/);
  assert.throws(() => Engine.simulate({ rows: data.rows.slice(1) }, options()), /上一月/);
});

test('missing, duplicate, out-of-order months and non-positive or nonfinite market data reject', () => {
  const base = market([100, 100, 100, 100]);
  for (const indices of [[0, 2, 3], [0, 1, 1, 2, 3], [0, 2, 1, 3]]) {
    assert.throws(() => Engine.simulate({ rows: indices.map((i) => base.rows[i]) }, options()), /连续/);
  }
  for (const field of ['nasdaq', 'sp500', 'gold', 'fx']) {
    for (const value of [0, -1, Infinity, NaN, '100', undefined]) {
      const data = structuredClone(base);
      data.rows[1][field] = value;
      assert.throws(() => Engine.simulate(data, options()), /有效正数/);
    }
  }
});

test('maximum contribution and fee boundaries are accepted without mutating inputs', () => {
  const data = market([100, 100, 100, 100]);
  const settings = options({ initial: 100000000, monthly: 100000000, feeAnnual: 10, changes: [{ month: '2000-02', amount: 100000000 }] });
  const before = JSON.stringify({ data, settings });
  const result = Engine.simulate(data, settings);
  assert.equal(result.summary.invested, 400000000);
  assert.equal(JSON.stringify({ data, settings }), before);
});

// Independent oracle: value each deposit as a separate lot, multiplying its own
// purchase-to-valuation price ratio and elapsed-month fee factor. This does not
// reproduce the production engine's month-by-month units or NAV recurrence.
function manualLotAccounting(data, settings) {
  const first = data.rows.findIndex((row) => row.month === settings.start);
  const last = data.rows.findIndex((row) => row.month === settings.end);
  const changes = [...settings.changes].sort((a, b) => a.month.localeCompare(b.month));
  const selectedPrice = (row) => row[settings.asset] * (settings.currency === 'CNY' ? row.fx : 1);
  const schedule = data.rows.slice(first, last + 1).map((row, index) => {
    const activeChange = changes.filter((change) => change.month <= row.month).at(-1);
    const monthly = activeChange ? activeChange.amount : settings.monthly;
    return { month: row.month, monthly, contribution: monthly + (index === 0 ? settings.initial : 0) };
  });
  const points = schedule.map((entry, offset) => {
    const endPrice = selectedPrice(data.rows[first + offset]);
    const deposits = schedule.slice(0, offset + 1);
    const invested = deposits.reduce((sum, lot) => sum + lot.contribution, 0);
    const value = deposits.reduce((sum, lot, depositOffset) => {
      const purchasePrice = selectedPrice(data.rows[first + depositOffset - 1]);
      const monthsHeld = offset - depositOffset + 1;
      return sum + lot.contribution * endPrice / purchasePrice * Math.pow(1 - settings.feeAnnual / 100, monthsHeld / 12);
    }, 0);
    return {
      ...entry, invested, value, profit: value - invested,
      nav: endPrice / selectedPrice(data.rows[first - 1]) * Math.pow(1 - settings.feeAnnual / 100, (offset + 1) / 12)
    };
  });
  const yearly = [...new Set(schedule.map((entry) => entry.month.slice(0, 4)))].map((year) => {
    const selected = data.rows.slice(first, last + 1).filter((row) => row.month.startsWith(year + '-'));
    const beforeFirst = data.rows.findIndex((row) => row.month === selected[0].month) - 1;
    return {
      year: Number(year),
      returnPct: (selectedPrice(selected.at(-1)) / selectedPrice(data.rows[beforeFirst]) * Math.pow(1 - settings.feeAnnual / 100, selected.length / 12) - 1) * 100,
      partial: selected.length !== 12
    };
  });
  return { points, yearly };
}

function fourYearSyntheticMarket(pattern) {
  const rows = [];
  for (let index = 0; index <= 48; index += 1) {
    const date = new Date(Date.UTC(1999, 11 + index, 1));
    const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    let factor;
    if (pattern === 'flat') factor = 1;
    else if (pattern === 'trend') factor = Math.pow(1.012, index);
    else if (pattern === 'zigzag') factor = [1, 1.3, 0.6, 1.15, 0.75][index % 5] * Math.pow(1.002, index);
    else factor = index < 12 ? 1 + index * 0.02 : index < 30 ? 1.24 - (index - 12) * 0.035 : 0.61 + (index - 30) * 0.04;
    rows.push({
      month,
      nasdaq: 100 * factor,
      sp500: 150 * Math.pow(factor, 0.6),
      gold: 200 * Math.pow(factor, -0.3),
      fx: pattern === 'flat' ? 7 : 7 * Math.exp(0.003 * index + 0.02 * Math.sin(index * 0.7))
    });
  }
  return { rows };
}

test('288 four-year scenarios agree with independent per-deposit hand calculation at every month and year boundary', () => {
  const schedules = [
    { initial: 0, monthly: 1000, changes: [] },
    { initial: 5700, monthly: 3250, changes: [] },
    {
      initial: 3456, monthly: 1000,
      changes: [
        { month: '2003-12', amount: 3000 }, { month: '2000-01', amount: 0 },
        { month: '2000-12', amount: 2500 }, { month: '2001-01', amount: 0 },
        { month: '2001-07', amount: 4000 }, { month: '2002-12', amount: 0 },
        { month: '2003-01', amount: 1200 }
      ]
    },
    { initial: 0, monthly: 0, changes: [{ month: '2003-12', amount: 1500 }] }
  ];
  let cases = 0;
  for (const pattern of ['flat', 'trend', 'zigzag', 'crash-recovery']) {
    const data = fourYearSyntheticMarket(pattern);
    for (const asset of ['nasdaq', 'sp500', 'gold']) {
      for (const currency of ['CNY', 'USD']) {
        for (const feeAnnual of [0, 0.5, 10]) {
          for (const schedule of schedules) {
            const settings = options({ ...schedule, asset, currency, feeAnnual, end: '2003-12' });
            const actual = Engine.simulate(data, settings);
            const expected = manualLotAccounting(data, settings);
            assert.equal(actual.points.length, 48);
            assert.equal(actual.points[0].month, '2000-01');
            assert.equal(actual.points.at(-1).month, '2003-12');
            actual.points.forEach((point, index) => {
              assert.equal(point.month, expected.points[index].month);
              for (const field of ['monthly', 'contribution', 'invested', 'value', 'profit', 'nav']) close(point[field], expected.points[index][field]);
            });
            close(actual.summary.invested, expected.points.at(-1).invested);
            close(actual.summary.value, expected.points.at(-1).value);
            close(actual.summary.profit, expected.points.at(-1).profit);
            close(actual.summary.returnPct, (expected.points.at(-1).value / expected.points.at(-1).invested - 1) * 100);
            actual.yearly.forEach((year, index) => {
              assert.equal(year.year, 2000 + index);
              assert.equal(year.partial, false);
              close(year.returnPct, expected.yearly[index].returnPct);
            });

            // Independently restart each calendar year with the preceding closing
            // balance. Carry-in includes prior profit, but is not counted as new
            // money or as that year's investment return in the full-period run.
            for (let year = 2000; year <= 2003; year += 1) {
              const start = `${year}-01`;
              const end = `${year}-12`;
              const offset = (year - 2000) * 12;
              const carryIn = year === 2000 ? settings.initial : expected.points[offset - 1].value;
              const inheritedMonthly = expected.points[offset].monthly;
              const annual = Engine.simulate(data, {
                ...settings, start, end, initial: carryIn, monthly: inheritedMonthly,
                changes: settings.changes.filter((change) => change.month >= start && change.month <= end)
              });
              const yearPoints = expected.points.slice(offset, offset + 12);
              const newMonthlyMoney = yearPoints.reduce((sum, point) => sum + point.monthly, 0);
              close(annual.summary.invested, carryIn + newMonthlyMoney);
              close(annual.summary.value, yearPoints.at(-1).value);
              close(annual.summary.profit, yearPoints.at(-1).value - carryIn - newMonthlyMoney);
              close(annual.yearly[0].returnPct, expected.yearly[year - 2000].returnPct);
              annual.points.forEach((point, index) => close(point.value, yearPoints[index].value));
            }
            cases += 1;
          }
        }
      }
    }
  }
  assert.equal(cases, 288);
});

test('flat four-year prices produce no profit from deposit increases, pauses, carry-in, or resumption', () => {
  const result = Engine.simulate(fourYearSyntheticMarket('flat'), options({
    currency: 'CNY', end: '2003-12', initial: 50000, monthly: 1000,
    changes: [{ month: '2000-12', amount: 90000 }, { month: '2001-01', amount: 0 }, { month: '2002-01', amount: 5000 }]
  }));
  result.points.forEach((point) => {
    close(point.value, point.invested);
    close(point.profit, 0, 1e-7);
    assert.equal(point.nav, 1);
    assert.equal(point.drawdown, 0);
  });
  close(result.summary.returnPct, 0);
  close(result.summary.xirrPct, 0);
  result.yearly.forEach((year) => assert.equal(year.returnPct, 0));
});

test('selected interval includes both endpoints once, excludes outside months, and prices only its own deposits', () => {
  const data = fourYearSyntheticMarket('zigzag');
  for (const [start, end, count] of [
    ['2000-01', '2003-12', 48], ['2001-02', '2002-11', 22], ['2003-12', '2003-12', 1]
  ]) {
    const settings = options({ start, end, initial: 500, monthly: 1000, currency: 'CNY', feeAnnual: 0.5 });
    const result = Engine.simulate(data, settings);
    const expected = manualLotAccounting(data, settings);
    assert.equal(result.points.length, count);
    assert.equal(result.points[0].month, start);
    assert.equal(result.points.at(-1).month, end);
    assert.equal(result.summary.invested, 500 + count * 1000);
    close(result.summary.value, expected.points.at(-1).value);
    result.yearly.forEach((year, index) => {
      assert.equal(year.partial, expected.yearly[index].partial);
      close(year.returnPct, expected.yearly[index].returnPct);
    });
  }
});

test('a single deposit in only the terminal month has a defined XIRR for all 48 calendar months, including both February lengths', () => {
  const data = fourYearSyntheticMarket('trend');
  const feeAnnual = 0.5;
  const observedDays = new Set();
  for (let index = 1; index < data.rows.length; index += 1) {
    const month = data.rows[index].month;
    const result = Engine.simulate(data, options({
      end: month, initial: 0, monthly: 0, feeAnnual,
      changes: [{ month, amount: 1234 }]
    }));
    assert.equal(result.points.filter((point) => point.contribution > 0).length, 1);
    assert.equal(result.points.at(-1).contribution, 1234);
    assert.equal(result.summary.invested, 1234);
    const year = Number(month.slice(0, 4));
    const monthIndex = Number(month.slice(5)) - 1;
    const firstDay = Date.UTC(year, monthIndex, 1);
    const lastDay = Date.UTC(year, monthIndex + 1, 0);
    const elapsedDays = (lastDay - firstDay) / 86400000;
    observedDays.add(elapsedDays);
    assert.ok(elapsedDays > 0, 'the final-month contribution and valuation must never share a date');
    const holdingReturnFactor = data.rows[index].nasdaq / data.rows[index - 1].nasdaq * Math.pow(1 - feeAnnual / 100, 1 / 12);
    const expected = (Math.pow(holdingReturnFactor, 365 / elapsedDays) - 1) * 100;
    assert.ok(Number.isFinite(result.summary.xirrPct));
    close(result.summary.xirrPct, expected);
  }
  assert.deepEqual([...observedDays].sort(), [27, 28, 29, 30]);
});

test('24 historical events have unique identifiers and valid strictly increasing months', () => {
  const events = require('../invest/events.js');
  assert.equal(events.length, 24);
  assert.equal(new Set(events.map((event) => event.id)).size, events.length);
  assert.equal(new Set(events.map((event) => event.month)).size, events.length);
  events.forEach((event, index) => {
    assert.match(event.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.match(event.month, /^20\d{2}-(0[1-9]|1[0-2])$/);
    if (index > 0) assert.ok(event.month > events[index - 1].month, `${event.id}: event dates must be strictly increasing`);
  });
});

test('every historical event contains complete reading, reflection, hindsight, and HTTPS source fields', () => {
  const events = require('../invest/events.js');
  for (const event of events) {
    for (const key of ['id', 'month', 'title', 'summary', 'impact', 'question', 'afterword']) {
      assert.equal(typeof event[key], 'string', `${event.id}.${key}`);
      assert.ok(event[key].trim().length > 0, `${event.id}.${key} must not be empty`);
    }
    assert.equal(typeof event.article, 'string', `${event.id}.article must exist even without a related article`);
    assert.ok(event.source && typeof event.source === 'object', `${event.id}.source`);
    assert.equal(typeof event.source.label, 'string', `${event.id}.source.label`);
    assert.ok(event.source.label.trim().length > 0);
    const url = new URL(event.source.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(url.hostname.includes('.'));
  }
});

test('nonempty historical event article routes resolve to existing ready catalog entries and real article bodies', () => {
  const events = require('../invest/events.js');
  const websiteDir = path.resolve(__dirname, '..');
  const context = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(path.join(websiteDir, 'data.js'), 'utf8'), context);
  for (const filename of fs.readdirSync(websiteDir).filter((filename) => /^content-[a-z]+\.js$/.test(filename))) {
    vm.runInContext(fs.readFileSync(path.join(websiteDir, filename), 'utf8'), context);
  }
  const catalog = new Map();
  function collectCatalog(node) {
    if (!node || typeof node !== 'object') return;
    if (typeof node.id === 'string' && typeof node.ready === 'boolean') catalog.set(node.id, node);
    Object.values(node).forEach((child) => {
      if (child && typeof child === 'object') collectCatalog(child);
    });
  }
  collectCatalog(context.window.XLM_DATA);
  const linkedEvents = events.filter((event) => event.article !== '');
  assert.ok(linkedEvents.length > 0);
  for (const event of linkedEvents) {
    assert.match(event.article, /^#\/a\/[a-z0-9]+(?:-[a-z0-9]+)*$/);
    const articleId = event.article.slice('#/a/'.length);
    assert.ok(catalog.has(articleId), `${event.id} links to missing catalog entry ${articleId}`);
    assert.equal(catalog.get(articleId).ready, true, `${articleId} must not be a placeholder`);
    const article = context.window.XLM_ARTICLES[articleId];
    assert.ok(article && typeof article.title === 'string' && typeof article.body === 'string', `${articleId} must have a real article body`);
    assert.ok(article.body.trim().length > 0);
  }
});
