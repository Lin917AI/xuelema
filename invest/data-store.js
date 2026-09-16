/* 私有数据只保存在本浏览器的 IndexedDB；此模块不发送任何网络请求。 */
(function (root, factory) {
  var api = factory(typeof module === 'object' && module.exports ? require('./engine.js') : root.InvestEngine);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.InvestDataStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine) {
  'use strict';
  var DB_NAME = 'xuelema-invest-personal-v1';
  var STORE = 'packages';
  function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
  function validISO(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)); }
  function text(value, max) { return typeof value === 'string' && value.length > 0 && value.length <= max; }
  function https(value) { try { return text(value, 1500) && new URL(value).protocol === 'https:'; } catch (_) { return false; } }
  function validate(pkg, now) {
    if (!pkg || pkg.kind !== 'xuelema-invest-private' || pkg.schemaVersion !== 1) throw new Error('请选择“投资时光机-个人数据.json”，不是截图、压缩包或其他格式');
    if (!validISO(pkg.createdAt)) throw new Error('数据包缺少有效制作日期');
    var data = pkg.market;
    if (!data || !Array.isArray(data.rows) || data.rows.length < 2 || data.rows.length > 1600) throw new Error('数据包缺少有效的连续月度行情');
    if (data.rows[0].month !== '1999-12') throw new Error('必须包含 1999-12 参考价，才能从 2000 年开始推演');
    if (!text(data.method, 3000) || !Array.isArray(data.sources) || data.sources.length < 1 || data.sources.length > 20) throw new Error('数据包缺少计价口径或来源');
    data.sources.forEach(function (source) { if (!source || !text(source.label, 200) || !https(source.url) || (source.note != null && !text(source.note, 3000))) throw new Error('来源必须有名称与 HTTPS 原始链接'); });
    if (!validISO(data.updatedAt)) throw new Error('行情缺少有效更新时间');
    var clock = now || new Date();
    var currentMonth = clock.getUTCFullYear() + '-' + String(clock.getUTCMonth() + 1).padStart(2, '0');
    var last = data.rows[data.rows.length - 1].month;
    if (last >= currentMonth) throw new Error('数据含当前未完成月份或未来月份，请使用最后完整月版本');
    engine.simulate(data, { asset: 'nasdaq', currency: 'CNY', start: '2000-01', end: last, monthly: 0 });
    var funds = pkg.funds;
    if (funds != null) {
      if (!validISO(funds.checkedAt) || !Array.isArray(funds.funds) || funds.funds.length > 80) throw new Error('基金快照格式不正确');
      var codes = new Set();
      funds.funds.forEach(function (fund) {
        if (!fund || !/^\d{6}$/.test(fund.code) || codes.has(fund.code) || !text(fund.name, 160) || !['nasdaq', 'sp500'].includes(fund.index) || !https(fund.url) || !validISO(fund.checkedAt)) throw new Error('基金快照含错误或重复记录');
        codes.add(fund.code);
        if (!['open', 'paused', 'unknown'].includes(fund.purchaseState)) throw new Error('基金申购状态格式不正确');
        if (fund.nav != null && (!finite(fund.nav) || fund.nav <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(fund.navDate))) throw new Error('基金净值或披露日期不正确');
        ['purchaseLimit', 'purchaseFeePct', 'annualFeePct'].forEach(function (key) { if (fund[key] != null && (!finite(fund[key]) || fund[key] < 0)) throw new Error('基金限额或费率必须是非负数字或未知'); });
      });
    }
    return pkg;
  }
  function open() {
    return new Promise(function (resolve, reject) {
      if (typeof indexedDB === 'undefined') { reject(new Error('当前浏览器不支持本地数据保存')); return; }
      var request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = function () { request.result.createObjectStore(STORE); };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error('无法打开本地数据库')); };
      request.onblocked = function () { reject(new Error('请关闭其他学了么窗口后重新导入')); };
    });
  }
  function transaction(mode, action) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, mode);
        var request = action(tx.objectStore(STORE));
        var result;
        request.onsuccess = function () { result = request.result; };
        tx.oncomplete = function () { db.close(); resolve(result); };
        tx.onabort = tx.onerror = function () { db.close(); reject(tx.error || request.error || new Error('本地保存失败')); };
      });
    });
  }
  return {
    validate: validate,
    save: function (pkg) { validate(pkg); return transaction('readwrite', function (store) { return store.put(pkg, 'current'); }); },
    load: function () { return transaction('readonly', function (store) { return store.get('current'); }); }
  };
});
