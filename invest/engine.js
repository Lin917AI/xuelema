(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.InvestEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var ASSETS = ['nasdaq', 'sp500', 'gold'];
  var MAX_CONTRIBUTION = 100000000;
  var DAY_MS = 86400000;
  var EPSILON = 1e-12;

  function monthNumber(month, label) {
    if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new Error((label || '月份') + '必须为 YYYY-MM 格式的有效月份');
    }
    var year = Number(month.slice(0, 4));
    if (year < 1) throw new Error((label || '月份') + '的年份必须大于 0');
    return year * 12 + Number(month.slice(5, 7)) - 1;
  }

  function numberToMonth(number) {
    var year = Math.floor(number / 12);
    if (year < 1 || year > 9999) throw new Error('月份超出支持范围');
    return String(year).padStart(4, '0') + '-' + String(number % 12 + 1).padStart(2, '0');
  }

  function nextMonth(month) {
    return numberToMonth(monthNumber(month) + 1);
  }

  function amount(value, label) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > MAX_CONTRIBUTION) {
      throw new Error(label + '必须为 0 至 1 亿元之间的有限数字');
    }
    return value;
  }

  function prepare(data, options) {
    if (!data || !Array.isArray(data.rows) || data.rows.length < 2) {
      throw new Error('行情数据至少需要连续两个月，包含首月的上一月参考价');
    }
    if (!options || typeof options !== 'object') throw new Error('请提供模拟参数');
    if (ASSETS.indexOf(options.asset) === -1) throw new Error('请选择有效资产：纳斯达克、标普 500 或黄金');
    if (options.currency !== 'CNY' && options.currency !== 'USD') throw new Error('币种必须为 CNY 或 USD');

    var startNumber = monthNumber(options.start, '开始月份');
    var endNumber = monthNumber(options.end, '结束月份');
    if (startNumber < 2000 * 12) throw new Error('开始月份不能早于 2000-01');
    if (endNumber < startNumber) throw new Error('结束月份不能早于开始月份');
    var fee = options.feeAnnual === undefined ? 0 : options.feeAnnual;
    if (typeof fee !== 'number' || !Number.isFinite(fee) || fee < 0 || fee > 10) {
      throw new Error('年费率必须为 0 至 10 之间的百分数');
    }

    var initial = amount(options.initial === undefined ? 0 : options.initial, '首次投入');
    var monthly = amount(options.monthly === undefined ? 0 : options.monthly, '每月投入');
    var rowNumbers = [];
    data.rows.forEach(function (row, index) {
      if (!row || typeof row !== 'object') throw new Error('第 ' + (index + 1) + ' 行行情数据无效');
      var number = monthNumber(row.month, '第 ' + (index + 1) + ' 行月份');
      if (index > 0 && number !== rowNumbers[index - 1] + 1) {
        throw new Error('行情月份必须按时间升序连续排列，不能重复或缺月');
      }
      ASSETS.concat(['fx']).forEach(function (key) {
        if (typeof row[key] !== 'number' || !Number.isFinite(row[key]) || row[key] <= 0) {
          throw new Error(row.month + ' 的 ' + key + ' 行情必须为有效正数');
        }
      });
      rowNumbers.push(number);
    });
    var startIndex = rowNumbers.indexOf(startNumber);
    var endIndex = rowNumbers.indexOf(endNumber);
    if (startIndex < 1) throw new Error('开始月份及其上一月参考价必须包含在行情数据内');
    if (endIndex === -1) throw new Error('结束月份必须包含在行情数据内');

    var changes = options.changes === undefined ? [] : options.changes;
    if (!Array.isArray(changes)) throw new Error('定投调整记录必须为数组');
    var changeMap = Object.create(null);
    changes.forEach(function (change) {
      if (!change || typeof change !== 'object') throw new Error('定投调整记录无效');
      var number = monthNumber(change.month, '调整生效月份');
      if (number < startNumber || number > endNumber) throw new Error('调整生效月份必须在模拟区间内');
      if (Object.prototype.hasOwnProperty.call(changeMap, change.month)) throw new Error('同一月份不能重复设置定投调整');
      changeMap[change.month] = amount(change.amount, '调整后每月投入');
    });

    return {
      rows: data.rows,
      startIndex: startIndex,
      endIndex: endIndex,
      asset: options.asset,
      currency: options.currency,
      initial: initial,
      monthly: monthly,
      changes: changeMap,
      // feeAnnual is an additional user-specified fee; no assumed baseline fee is added.
      monthlyRetention: Math.pow(1 - fee / 100, 1 / 12)
    };
  }

  function price(row, settings) {
    var value = row[settings.asset] * (settings.currency === 'CNY' ? row.fx : 1);
    if (!Number.isFinite(value) || value <= 0) throw new Error('所选币种的行情换算超出可计算范围');
    return value;
  }

  function calendarDate(month, lastDay) {
    var year = Number(month.slice(0, 4));
    var index = Number(month.slice(5, 7)) - 1;
    return Date.UTC(year, index + (lastDay ? 1 : 0), lastDay ? 0 : 1);
  }

  // Every contribution is nonnegative and the terminal value is positive. Thus the
  // future-value equation has exactly one root. Solve in log(1 + annual rate)
  // space to cover returns close to -100% without unstable fractional powers.
  function xirr(cashFlows, terminalValue, endMonth) {
    if (cashFlows.length === 0 || terminalValue <= 0 || !Number.isFinite(terminalValue)) return null;
    var terminalDate = calendarDate(endMonth, true);
    var terms = cashFlows.map(function (flow) {
      return {
        logAmount: Math.log(flow.amount),
        years: (terminalDate - calendarDate(flow.month, false)) / DAY_MS / 365
      };
    });
    var target = Math.log(terminalValue);
    function balance(logRate) {
      var values = terms.map(function (term) { return term.logAmount + logRate * term.years; });
      var max = Math.max.apply(null, values);
      var total = values.reduce(function (sum, value) { return sum + Math.exp(value - max); }, 0);
      return max + Math.log(total) - target;
    }
    if (Math.abs(balance(0)) < 1e-13) return 0;
    var low = -1;
    var high = 1;
    while (balance(low) > 0 && low > -1048576) low *= 2;
    while (balance(high) < 0 && high < 1048576) high *= 2;
    if (balance(low) > 0 || balance(high) < 0) return null;
    for (var iteration = 0; iteration < 180; iteration += 1) {
      var mid = (low + high) / 2;
      if (balance(mid) > 0) high = mid;
      else low = mid;
    }
    var result = Math.expm1((low + high) / 2) * 100;
    return Number.isFinite(result) ? result : null;
  }

  function yearlyFromSettings(settings) {
    var years = [];
    var current;
    for (var index = settings.startIndex; index <= settings.endIndex; index += 1) {
      var row = settings.rows[index];
      var year = Number(row.month.slice(0, 4));
      if (!current || current.year !== year) {
        current = { year: year, factor: 1, count: 0, firstMonth: row.month.slice(5, 7), lastMonth: '' };
        years.push(current);
      }
      current.factor *= price(row, settings) / price(settings.rows[index - 1], settings) * settings.monthlyRetention;
      if (!Number.isFinite(current.factor)) throw new Error('年度收益超出可计算范围');
      current.count += 1;
      current.lastMonth = row.month.slice(5, 7);
    }
    return years.map(function (year) {
      return {
        year: year.year,
        returnPct: (year.factor - 1) * 100,
        partial: year.count !== 12 || year.firstMonth !== '01' || year.lastMonth !== '12'
      };
    });
  }

  function annualReturns(data, asset, currency, start, end, feeAnnual) {
    return yearlyFromSettings(prepare(data, {
      asset: asset, currency: currency, start: start, end: end, feeAnnual: feeAnnual
    }));
  }

  function simulate(data, options) {
    var settings = prepare(data, options);
    var invested = 0;
    var units = 0;
    var value = 0;
    var nav = 1;
    var peak = 1;
    var peakIndex = 0;
    var isUnderwater = false;
    var recoveryMonths = 0;
    var underwaterMonths = 0;
    var maxDrawdownPct = 0;
    var currentMonthly = settings.monthly;
    var cashFlows = [];
    var points = [];

    for (var index = settings.startIndex; index <= settings.endIndex; index += 1) {
      var row = settings.rows[index];
      var step = index - settings.startIndex + 1;
      if (Object.prototype.hasOwnProperty.call(settings.changes, row.month)) currentMonthly = settings.changes[row.month];
      var contribution = currentMonthly + (step === 1 ? settings.initial : 0);
      var buyPrice = price(settings.rows[index - 1], settings);
      var closingPrice = price(row, settings);
      invested += contribution;
      units = (units + contribution / buyPrice) * settings.monthlyRetention;
      value = units * closingPrice;
      nav *= closingPrice / buyPrice * settings.monthlyRetention;
      if (!Number.isFinite(units) || !Number.isFinite(value) || !Number.isFinite(nav) || nav <= 0) {
        throw new Error('模拟结果超出可计算范围，请检查行情价格');
      }
      if (contribution > 0) cashFlows.push({ month: row.month, amount: contribution });

      var drawdown = 0;
      if (nav >= peak * (1 - EPSILON)) {
        if (isUnderwater) recoveryMonths = Math.max(recoveryMonths, step - peakIndex);
        peak = Math.max(peak, nav);
        peakIndex = step;
        isUnderwater = false;
        underwaterMonths = 0;
      } else {
        drawdown = (nav / peak - 1) * 100;
        maxDrawdownPct = Math.min(maxDrawdownPct, drawdown);
        isUnderwater = true;
        underwaterMonths = step - peakIndex;
      }
      points.push({
        month: row.month,
        invested: invested,
        value: value,
        profit: value - invested,
        contribution: contribution,
        monthly: currentMonthly,
        price: closingPrice,
        units: units,
        nav: nav,
        drawdown: drawdown
      });
    }

    var yearly = yearlyFromSettings(settings);
    var bestYear = yearly.reduce(function (best, year) { return !best || year.returnPct > best.returnPct ? year : best; }, null);
    var worstYear = yearly.reduce(function (worst, year) { return !worst || year.returnPct < worst.returnPct ? year : worst; }, null);
    return {
      points: points,
      yearly: yearly,
      summary: {
        invested: invested,
        value: value,
        profit: value - invested,
        returnPct: invested > 0 ? (value / invested - 1) * 100 : null,
        xirrPct: xirr(cashFlows, value, options.end),
        maxDrawdownPct: maxDrawdownPct,
        recoveryMonths: recoveryMonths,
        underwaterMonths: underwaterMonths,
        bestYear: bestYear,
        worstYear: worstYear
      }
    };
  }

  return Object.freeze({ simulate: simulate, annualReturns: annualReturns, nextMonth: nextMonth });
});
