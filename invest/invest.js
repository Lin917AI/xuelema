/* 投资时光机：纯浏览器计算。事件当月结算后才允许改变下一月的投入。 */
(function () {
  'use strict';

  var E = window.InvestEngine;
  var EVENTS = window.INVEST_EVENTS || [];
  var ASSETS = { nasdaq: '纳斯达克100', sp500: '标普500', gold: '黄金' };
  var COLORS = { nasdaq: '#3478b6', sp500: '#287970', gold: '#b48836' };
  var market = null;
  var funds = null;
  var personalPackage = null;
  var journey = null;
  var timer = null;
  var activeTab = 'journey';
  var latest = '';

  function $(id) { return document.getElementById(id); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeURL(value) {
    try { var url = new URL(value); return url.protocol === 'https:' ? url.href : ''; }
    catch (_) { return ''; }
  }
  function link(url, label) {
    var href = safeURL(url);
    return href ? '<a href="' + esc(href) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + ' ↗</a>' : esc(label);
  }
  function monthLabel(month) { return Number(month.slice(0, 4)) + ' 年 ' + Number(month.slice(5, 7)) + ' 月'; }
  function dateTime(iso) {
    if (!iso || !Number.isFinite(Date.parse(iso))) return '未知';
    return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso)) + '（北京时间）';
  }
  function pct(value) { return Number.isFinite(value) ? (value > 0 ? '+' : '') + value.toFixed(2) + '%' : '—'; }
  function money(value, currency) {
    return (value < 0 ? '−' : '') + (currency === 'USD' ? '$' : '¥') + Math.abs(Number(value)).toLocaleString('zh-CN', { maximumFractionDigits: 0 });
  }
  function compact(value) {
    var abs = Math.abs(value);
    if (abs >= 1e8) return (value / 1e8).toFixed(1) + '亿';
    if (abs >= 1e4) return (value / 1e4).toFixed(abs < 1e5 ? 1 : 0) + '万';
    return value.toFixed(0);
  }
  function error(id, message) { $(id).textContent = message || ''; $(id).hidden = !message; }
  function metric(label, value, note) {
    return '<dl class="metric"><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd>' + (note ? '<small>' + esc(note) + '</small>' : '') + '</dl>';
  }
  function validateMarket(data) {
    if (!data || !Array.isArray(data.rows) || data.rows.length < 2) throw new Error('行情文件缺少连续月度数据');
    if (data.rows[0].month !== '1999-12') throw new Error('数据必须包含 1999-12 参考价，以支持从 2000 年开始');
    var last = data.rows[data.rows.length - 1].month;
    var now = new Date();
    var thisMonth = now.getUTCFullYear() + '-' + String(now.getUTCMonth() + 1).padStart(2, '0');
    if (last >= thisMonth) throw new Error('仅使用已完整结束的月份，不能混入当前月或未来行情');
    // The engine validates all rows, not only the displayed endpoints.
    E.simulate(data, { asset: 'nasdaq', currency: 'CNY', start: '2000-01', end: last, monthly: 0 });
    if (!data.method || !Array.isArray(data.sources) || !data.sources.length) throw new Error('行情文件必须附有计价口径和来源');
    return data;
  }
  function applyMarket(data, local) {
    market = validateMarket(data);
    latest = market.rows[market.rows.length - 1].month;
    $('coverage').textContent = '2000.01 — ' + latest.replace('-', '.') + ' · 月度历史模拟';
    $('start-month').max = latest;
    $('end-month').max = latest;
    if ($('end-month').value > latest) $('end-month').value = latest;
    $('end-mode').options[0].textContent = '至最新数据';
    $('start-button').disabled = false;
    $('load-status').hidden = true;
    $('data-stamp').textContent = (local ? '设备本地数据 · ' : '历史数据 · ') + '完整至 ' + latest + (market.updatedAt ? ' · 更新 ' + market.updatedAt.slice(0, 10) : '');
    renderAnnual();
    renderMethod();
  }
  function usePackage(pkg, persisted) {
    window.InvestDataStore.validate(pkg);
    if (journey) restart();
    personalPackage = pkg;
    funds = pkg.funds || null;
    applyMarket(pkg.market, true);
    renderFunds();
    $('import-card').classList.add('loaded');
    $('import-title').textContent = '本地行情 · 完整至 ' + latest;
    $('import-label').textContent = '更新数据';
    $('export-data').hidden = false;
    $('import-description').hidden = true;
    $('import-message').textContent = persisted ? '已保存在此设备 · 无需每次导入 · 不是实时行情' : '本次可用，但浏览器未能保存；关闭后需重新导入。请保留原始数据包。';
  }
  function importData(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    pause();
    error('import-error', '');
    if (file.size > 4 * 1024 * 1024) { error('import-error', '文件超过 4 MB，请选择本工具的个人数据包'); $('data-file').value = ''; return; }
    $('import-message').textContent = '正在校验完整月份、来源和数据格式…';
    file.text().then(function (content) {
      var pkg;
      try { pkg = JSON.parse(content); } catch (_) { throw new Error('无法读取 JSON 数据，请不要选择图片或压缩包'); }
      window.InvestDataStore.validate(pkg);
      return window.InvestDataStore.save(pkg).then(function () { usePackage(pkg, true); }, function () { usePackage(pkg, false); });
    }).catch(function (err) {
      error('import-error', err.message + '。原有数据未被替换。');
      $('import-message').textContent = personalPackage ? '继续使用上一次有效数据 · 完整至 ' + latest : '尚未导入，请选择有效的个人数据包。';
    }).finally(function () { $('data-file').value = ''; });
  }
  function exportData() {
    if (!personalPackage) return;
    var blob = new Blob([JSON.stringify(personalPackage)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = '投资时光机-个人数据-' + latest + '.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }
  function showImportHelp() {
    pause();
    $('method-title').textContent = '一分钟，完成首次导入';
    $('method-content').innerHTML = '<h3>1 · 把数据包放到手机</h3><p>把电脑上的“投资时光机-个人数据.json”通过隔空投送、iCloud 或你自己选择的方式保存到 iPhone 的“文件”App。不要修改文件内容，也不要把个人数据包发布到 GitHub。</p><h3>2 · 在平时使用的 App 内导入</h3><p>从手机主屏幕打开学了么 → 投资时光机 → 导入个人数据包，在文件选择器中选中这个 JSON 文件。没有文件内容上传：校验、保存和计算都在当前设备里完成。</p><h3>3 · 以后直接打开即可</h3><p>数据保存在当前浏览器的本地数据库。不同浏览器、Safari 与主屏幕 App 可能使用不同存储；请在实际使用的入口完成导入。无痕模式、清理网站数据、浏览器存储回收、换手机等情况可能导致数据丢失，因此请保留备份。</p><h3>如何补充最新行情</h3><p>个人版不在 GitHub 定时发布受限制的数据，也不会自动获取每日基金状态。需要更新时，请让我重新生成个人数据包，你再点“更新数据”导入。页面会一直显示当前包的截止月份与基金检查日期，不会把旧数据说成实时。</p>';
    $('method-dialog').showModal();
  }

  function setTab(name) {
    pause();
    activeTab = name;
    document.querySelectorAll('[data-tab]').forEach(function (button) {
      var active = button.dataset.tab === name;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
    ['journey', 'annual', 'funds'].forEach(function (key) { $(key + '-panel').hidden = key !== name; });
  }
  function optionsFromForm() {
    return {
      asset: document.querySelector('input[name="asset"]:checked').value,
      currency: $('currency').value,
      start: $('start-month').value,
      end: $('end-mode').value === 'latest' ? latest : $('end-month').value,
      monthly: Number($('monthly').value),
      initial: Number($('initial').value),
      feeAnnual: Number($('fee').value),
      changes: []
    };
  }
  function startJourney(event) {
    event.preventDefault();
    if (!market) return;
    try {
      var options = optionsFromForm();
      if (options.monthly + options.initial <= 0) throw new Error('初始资金与每月投入至少有一项大于 0');
      var result = E.simulate(market, options);
      pause();
      journey = { options: options, result: result, baseline: result, index: 0, seen: {}, complete: false, running: false };
      error('form-error', '');
      $('setup-layout').hidden = true;
      $('playback').hidden = false;
      $('results').hidden = true;
      $('decision-log').hidden = true;
      $('journey-label').textContent = ASSETS[options.asset] + ' · ' + (options.currency === 'CNY' ? '人民币口径，含汇率' : '美元口径');
      $('journey-range').textContent = options.start + ' → ' + options.end + ' · 模拟年费率 ' + options.feeAnnual + '%';
      $('play-button').disabled = false;
      $('next-event-button').disabled = false;
      $('adjust-button').disabled = false;
      renderJourney();
      $('playback').scrollIntoView({ block: 'start', behavior: 'smooth' });
      $('play-button').focus({ preventScroll: true });
      if (!checkStop()) resume();
    } catch (err) { error('form-error', err.message); }
  }
  function pause() {
    clearTimeout(timer);
    timer = null;
    if (journey) journey.running = false;
    $('play-button').textContent = journey && journey.complete ? '旅程已完成' : '继续';
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      timer = null;
      if (!journey || !journey.running) return;
      journey.index += 1;
      renderJourney();
      if (!checkStop()) schedule();
    }, Number($('speed').value));
  }
  function resume() {
    if (!journey || journey.complete || activeTab !== 'journey') return;
    if ($('event-dialog').open || $('method-dialog').open) return;
    if (journey.index >= journey.result.points.length - 1) { finish(); return; }
    journey.running = true;
    $('play-button').textContent = '暂停';
    $('play-note').textContent = '时间正在向前。遇到历史节点将自动暂停；你也可以随时调整后续投入。';
    schedule();
  }
  function eventHere() {
    var month = journey.result.points[journey.index].month;
    return EVENTS.find(function (event) { return event.month === month && !journey.seen[event.id]; });
  }
  function checkStop() {
    var event = eventHere();
    if (event) { journey.seen[event.id] = true; openDecision(event); return true; }
    if (journey.index >= journey.result.points.length - 1) { finish(); return true; }
    return false;
  }
  function nextEvent() {
    if (!journey || journey.complete) return;
    pause();
    var points = journey.result.points;
    var index = journey.index + 1;
    while (index < points.length - 1 && !EVENTS.some(function (event) { return event.month === points[index].month && !journey.seen[event.id]; })) index += 1;
    journey.index = Math.min(index, points.length - 1);
    renderJourney();
    if (!checkStop()) $('play-note').textContent = '已暂停。你可以继续推演或调整后续月投。';
  }
  function chart(points, base, currency) {
    var width = 800, height = 300, left = 65, right = 20, top = 24, bottom = 35;
    var all = points.flatMap(function (p) { return [p.value, p.invested]; });
    if (base) all = all.concat(base.map(function (p) { return p.value; }));
    var max = Math.max.apply(null, all.concat([1])) * 1.1;
    function x(i) { return left + (width - left - right) * i / Math.max(1, points.length - 1); }
    function y(v) { return height - bottom - (height - top - bottom) * v / max; }
    function path(list, key) { return list.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p[key]).toFixed(1); }).join(' '); }
    var svg = '<svg viewBox="0 0 ' + width + ' ' + height + '" aria-hidden="true">';
    for (var i = 0; i <= 4; i++) {
      var v = max * i / 4;
      svg += '<line class="grid" x1="' + left + '" x2="' + (width - right) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (left - 10) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + (currency === 'USD' ? '$' : '¥') + compact(v) + '</text>';
    }
    svg += '<path d="' + path(points, 'invested') + '" stroke="#a8a7a0" fill="none" stroke-width="2" stroke-dasharray="6 5"/>';
    if (base) svg += '<path d="' + path(base, 'value') + '" stroke="#b48836" fill="none" stroke-width="2" stroke-dasharray="3 4"/>';
    svg += '<path d="' + path(points, 'value') + '" stroke="#287970" fill="none" stroke-width="3" stroke-linejoin="round"/>';
    var last = points.length - 1;
    svg += '<circle cx="' + x(last) + '" cy="' + y(points[last].value) + '" r="4" fill="#287970"/>';
    var labels = Array.from(new Set([0, Math.floor(last / 2), last]));
    labels.forEach(function (idx) { svg += '<text x="' + x(idx) + '" y="' + (height - 9) + '" text-anchor="' + (idx === 0 ? 'start' : idx === last ? 'end' : 'middle') + '">' + points[idx].month + '</text>'; });
    return svg + '</svg>';
  }
  function renderJourney() {
    var p = journey.result.points[journey.index];
    var c = journey.options.currency;
    $('current-month').textContent = monthLabel(p.month);
    $('journey-metrics').innerHTML = metric('账户资产', money(p.value, c), '参考价估值') + metric('累计投入', money(p.invested, c), '已走过 ' + (journey.index + 1) + ' 个月') + metric('当前盈亏', money(p.profit, c), '资产减去累计投入') + metric('本月定投', money(p.monthly, c), '不含初始资金');
    var changed = journey.options.changes.length > 0;
    $('baseline-legend').hidden = !changed;
    $('journey-chart').innerHTML = chart(journey.result.points.slice(0, journey.index + 1), changed ? journey.baseline.points.slice(0, journey.index + 1) : null, c);
    $('journey-chart').setAttribute('aria-label', p.month + '，账户资产 ' + money(p.value, c) + '，累计投入 ' + money(p.invested, c));
    $('progress-bar').style.width = ((journey.index + 1) / journey.result.points.length * 100) + '%';
    $('adjust-button').disabled = journey.index === journey.result.points.length - 1;
    renderDecisions();
  }
  function renderDecisions() {
    var changes = journey.options.changes;
    $('decision-log').hidden = !changes.length;
    if (changes.length) $('decision-log').innerHTML = '<h3>你做过的选择</h3><p>' + changes.map(function (change) { return esc(change.month) + ' 起，每月 ' + esc(money(change.amount, journey.options.currency)); }).join(' · ') + '</p><small>只改变后续新增投入，不卖出已有份额。</small>';
  }
  function openDecision(event) {
    if (!journey || journey.complete) return;
    pause();
    var p = journey.result.points[journey.index];
    var last = journey.index === journey.result.points.length - 1;
    $('event-date').textContent = monthLabel(p.month) + (event ? ' · 历史节点' : ' · 你的决定');
    $('event-title').textContent = event ? event.title : '下一步，按你的节奏走。';
    $('event-content').innerHTML = event ? '<h3>发生了什么</h3><p>' + esc(event.summary) + '</p><h3>为什么与你有关</h3><p>' + esc(event.impact) + '</p><p class="field-note">' + link(event.source.url, event.source.label) + ' · 来源可能包含事后回顾</p>' : '<p>调整只影响下一月起的新增投入，已有份额继续持有。设为 0 表示暂停定投，不是清仓。</p>';
    $('event-stats').innerHTML = '<div class="event-stat"><span>已经历</span><b>' + (journey.index + 1) + ' 个月</b></div><div class="event-stat"><span>累计投入</span><b>' + esc(money(p.invested, journey.options.currency)) + '</b></div><div class="event-stat"><span>账户资产</span><b>' + esc(money(p.value, journey.options.currency)) + '</b></div>';
    $('event-question').textContent = event ? event.question : '这次调整是因为现金安排变了，还是市场波动改变了你的感受？';
    $('adjust-form').hidden = true;
    $('event-actions').hidden = false;
    $('event-adjust').hidden = last;
    $('event-continue').textContent = last ? '到达终点，查看复盘' : '看看接下来会怎样';
    error('adjust-error', '');
    $('play-note').textContent = '已暂停。历史节点读完后，你来决定下一步。';
    if (!$('event-dialog').open) $('event-dialog').showModal();
    document.querySelector('.event-scroll').scrollTop = 0;
    if (!event && !last) showAdjust();
  }
  function showAdjust() {
    if (!journey || journey.index >= journey.result.points.length - 1) return;
    var next = journey.result.points[journey.index + 1].month;
    var existing = journey.options.changes.find(function (change) { return change.month === next; });
    $('adjust-amount').value = existing ? existing.amount : journey.result.points[journey.index].monthly;
    $('adjust-unit').textContent = journey.options.currency === 'CNY' ? '元 / 月' : '美元 / 月';
    $('adjust-effective').textContent = '从 ' + monthLabel(next) + ' 起生效，直到你再次调整。输入 0 可暂停新增投入；历史月份不会重算。';
    $('adjust-form').hidden = false;
    $('event-actions').hidden = true;
    $('adjust-amount').focus();
  }
  function saveAdjust(event) {
    event.preventDefault();
    if (!journey) return;
    try {
      var amount = Number($('adjust-amount').value);
      if ($('adjust-amount').value.trim() === '' || !Number.isFinite(amount) || amount < 0 || amount > 1e8) throw new Error('请输入 0 至 1 亿元之间的有效金额');
      var month = journey.result.points[journey.index + 1].month;
      var changes = journey.options.changes.filter(function (change) { return change.month !== month; });
      changes.push({ month: month, amount: amount });
      changes.sort(function (a, b) { return a.month.localeCompare(b.month); });
      var options = Object.assign({}, journey.options, { changes: changes });
      var result = E.simulate(market, options);
      journey.options = options;
      journey.result = result;
      renderJourney();
      $('event-dialog').close();
      resume();
    } catch (err) { error('adjust-error', err.message); }
  }
  function comparisonRow(label, summary, c) {
    return '<tr><th scope="row">' + esc(label) + '</th><td>' + esc(money(summary.invested, c)) + '</td><td>' + esc(money(summary.value, c)) + '</td><td>' + esc(money(summary.profit, c)) + '</td><td>' + pct(summary.xirrPct) + '</td></tr>';
  }
  function finish() {
    if (!journey || journey.complete) return;
    pause();
    journey.complete = true;
    $('play-button').textContent = '旅程已完成';
    $('play-button').disabled = true;
    $('next-event-button').disabled = true;
    $('adjust-button').disabled = true;
    $('play-note').textContent = '时间到达终点。现在回看选择，而不是用已经知道的结局评价当时的自己。';
    var s = journey.result.summary, c = journey.options.currency;
    var html = '<div class="result-header"><p class="eyebrow">03 / 回到现在</p><h2>把结果看清，把选择想明白。</h2><p>这是 ' + esc(journey.options.start) + ' 至 ' + esc(journey.options.end) + ' 的历史模拟，不是未来收益承诺。</p></div>';
    html += '<div class="metrics">' + metric('资金加权年化', pct(s.xirrPct), journey.result.points.length < 12 ? '不足一年 · 年化可能被放大' : 'XIRR · 考虑每笔投入时间') + metric('累计盈利 / 本金', pct(s.returnPct), '不是年化收益') + metric('资产最大回撤', pct(s.maxDrawdownPct), '单位净值口径 · 排除入金') + metric('期末未回到前高', s.underwaterMonths ? s.underwaterMonths + ' 个月' : '已回到前高', '仅观察所选区间内高点') + '</div>';
    if (journey.result.points.length < 12) html += '<p class="field-note">本次不足一年。年化只是把短期结果按复利换算，可能显著放大波动，不是已经获得的一年收益，更不能当作未来预期。</p>';
    html += '<section class="surface result-card"><h3>坚持原计划，还是中途调整？</h3><div class="table-wrap"><table><caption class="sr-only">原计划与调整计划对照</caption><thead><tr><th>方案</th><th>累计投入</th><th>期末资产</th><th>盈利</th><th>资金年化</th></tr></thead><tbody>' + comparisonRow('原计划', journey.baseline.summary, c) + comparisonRow(journey.options.changes.length ? '你的调整' : '你的计划（未调整）', s, c) + '</tbody></table></div><p class="field-note">多投入的钱不是收益。比较时要一起看本金、盈利和资金加权年化；即使年化更高，也不能据此证明这套择时方法以后仍然有效。</p></section>';
    html += '<section class="surface result-card"><h3>如果同样的投入，选择另一种资产</h3><div class="table-wrap"><table><caption class="sr-only">同区间与同现金流的资产比较</caption><thead><tr><th>资产</th><th>期末资产</th><th>盈利</th><th>资金年化</th><th>最大回撤</th></tr></thead><tbody>';
    Object.keys(ASSETS).forEach(function (asset) {
      var result = E.simulate(market, Object.assign({}, journey.options, { asset: asset })).summary;
      html += '<tr><th scope="row">' + ASSETS[asset] + (asset === journey.options.asset ? ' · 本次' : '') + '</th><td>' + esc(money(result.value, c)) + '</td><td>' + esc(money(result.profit, c)) + '</td><td>' + pct(result.xirrPct) + '</td><td>' + pct(result.maxDrawdownPct) + '</td></tr>';
    });
    html += '</tbody></table></div><p class="field-note">沿用你本次的投入与调整时间、币种和模拟费率，不是三种资产各自最优策略。指数为价格指数，未计股息再投资；黄金没有股息，二者并非总回报的完全公平比较。</p></section>';
    var visited = EVENTS.filter(function (event) { return event.month >= journey.options.start && event.month <= journey.options.end; });
    if (visited.length) {
      html += '<section class="surface result-card event-review"><h3>那些暂停的时刻，后来怎样了</h3>';
      visited.forEach(function (event) {
        html += '<details><summary>' + esc(event.month) + ' · ' + esc(event.title) + '</summary><p>' + esc(event.afterword) + '</p><p>' + link(event.source.url, event.source.label) + '</p>';
        if (/^#\/a\/[a-z0-9-]+$/.test(event.article)) html += '<a href="../' + esc(event.article) + '">在学了么继续读完整故事 →</a>';
        html += '</details>';
      });
      html += '</section>';
    }
    html += '<p class="field-note">最长已完成的前高恢复周期：' + s.recoveryMonths + ' 个月。未恢复的阶段不计入这个数，因此要结合“期末未回到前高”一起看。月度数据会漏掉月内更深的跌幅；这份模拟也不包含通胀、税、交易滑点、跟踪误差与全部实际费用。</p>';
    $('results').innerHTML = html;
    $('results').hidden = false;
  }
  function restart() {
    pause();
    journey = null;
    $('event-dialog').close();
    $('setup-layout').hidden = false;
    $('playback').hidden = true;
    $('start-month').focus();
    $('setup-layout').scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function renderAnnual() {
    if (!market) return;
    var c = $('annual-currency').value;
    var rows = {};
    Object.keys(ASSETS).forEach(function (asset) { rows[asset] = E.annualReturns(market, asset, c, '2000-01', latest, 0); });
    var table = '<table><caption>年度价格收益（无额外模拟费用；* 为非完整年度）</caption><thead><tr><th>年份</th><th>纳斯达克100</th><th>标普500</th><th>黄金</th></tr></thead><tbody>';
    for (var i = rows.nasdaq.length - 1; i >= 0; i--) {
      table += '<tr><th scope="row">' + rows.nasdaq[i].year + (rows.nasdaq[i].partial ? '*' : '') + '</th>';
      Object.keys(ASSETS).forEach(function (asset) { table += '<td>' + pct(rows[asset][i].returnPct) + '</td>'; });
      table += '</tr>';
    }
    $('annual-table').innerHTML = table + '</tbody></table><p class="field-note">年度变化＝本年最后可用参考价 ÷ 上年12月参考价 − 1。不是每年定投的收益；月均口径不等于市场常见的年末收盘价口径。最后一年截至 ' + esc(latest) + '。</p>';
    var selected = rows.nasdaq.slice(-10);
    var max = Math.max.apply(null, Object.keys(rows).flatMap(function (asset) { return rows[asset].slice(-10).map(function (r) { return Math.abs(r.returnPct); }); }).concat([1]));
    var bars = '<div class="annual-table-legend">' + Object.keys(ASSETS).map(function (asset) { return '<span><i style="background:' + COLORS[asset] + '"></i>' + ASSETS[asset] + '</span>'; }).join('') + '</div><div class="annual-bars" role="img" aria-label="最近十年的年度价格收益柱形图，完整数值见下表">';
    selected.forEach(function (year) {
      bars += '<div class="annual-group"><div class="annual-track">';
      Object.keys(ASSETS).forEach(function (asset, index) {
        var row = rows[asset].find(function (r) { return r.year === year.year; });
        var height = Math.abs(row.returnPct) / max * 46;
        bars += '<span title="' + ASSETS[asset] + ' ' + year.year + ' ' + pct(row.returnPct) + '" class="annual-bar ' + asset + '" style="height:' + height + '%;left:' + (10 + index * 28) + '%;top:' + (row.returnPct >= 0 ? 50 - height : 50) + '%"></span>';
      });
      bars += '</div><small>' + String(year.year).slice(2) + (year.partial ? '*' : '') + '</small></div>';
    });
    $('annual-chart').innerHTML = bars + '</div>';
  }
  function stale(date) {
    if (!date) return true;
    return Date.now() - new Date(date).getTime() > 3 * 86400000;
  }
  function renderFunds() {
    if (!funds || !Array.isArray(funds.funds)) {
      $('fund-status').textContent = '尚未导入基金快照。';
      $('fund-list').innerHTML = '<div class="status">导入个人数据包后可查看当时的快照。申购与净值信息请以基金公司及天天基金原页为准。</div>';
      return;
    }
    $('fund-status').textContent = '天天基金快照 · 检查 ' + dateTime(funds.checkedAt) + ' · ' + funds.funds.length + ' 只基金，非全市场名单' + (stale(funds.checkedAt) ? ' · 快照已过期，操作前请查原页' : '');
    var query = $('fund-search').value.trim().toLowerCase();
    var index = $('fund-index').value, state = $('fund-state').value;
    var list = funds.funds.filter(function (fund) {
      return (!query || (fund.code + fund.name).toLowerCase().includes(query)) && (index === 'all' || fund.index === index) && (state === 'all' || fund.purchaseState === state);
    });
    $('fund-list').innerHTML = list.map(function (fund) {
      var expired = stale(fund.checkedAt);
      var badge = fund.purchaseState === 'paused' ? '暂停申购' : fund.purchaseState === 'open' ? (Number.isFinite(fund.purchaseLimit) ? '限额申购' : '开放申购') : '状态未知';
      var fields = [
        ['披露净值', Number.isFinite(fund.nav) ? fund.nav.toFixed(4) + '（' + (fund.navDate || '日期未知') + '）' : '未取得'],
        ['日累计申购限额', fund.purchaseState === 'paused' ? '暂停中，不能申购' : Number.isFinite(fund.purchaseLimit) ? money(fund.purchaseLimit, 'CNY') : '原页未明确，需核对'],
        ['渠道申购费率', Number.isFinite(fund.purchaseFeePct) ? fund.purchaseFeePct.toFixed(2) + '%' : '未取得'],
        ['年运作费率合计', Number.isFinite(fund.annualFeePct) ? fund.annualFeePct.toFixed(2) + '%' : '未取得']
      ];
      return '<article class="surface fund-card"><div class="fund-title"><div><p class="fund-code">' + esc(fund.code) + ' · ' + esc(ASSETS[fund.index] || '') + '</p><h3>' + link(fund.url, fund.name) + '</h3></div><span class="fund-badge ' + (fund.purchaseState === 'paused' ? 'paused' : '') + '">' + badge + '</span></div><dl class="fund-fields">' + fields.map(function (field) { return '<div><dt>' + field[0] + '</dt><dd>' + esc(field[1]) + '</dd></div>'; }).join('') + '</dl><details><summary>净值口径与数据时间</summary><p>净值内已扣除基金运作费用，不能再扣一次。此处不直接用具体基金净值模拟 2000 年起的历史：基金成立日期、分红和跟踪误差均不同。</p><p>原页申购状态：' + esc(fund.purchaseStatus || '未取得') + '。如为暂停申购，原页列出的数字不代表当前可买额度。</p><p>本条检查：' + esc(dateTime(fund.checkedAt)) + (expired ? ' · 已过期，请查原页' : '') + '</p></details></article>';
    }).join('') || '<p class="status">没有符合条件的基金，试试更换筛选条件。</p>';
  }
  function renderMethod() {
    var sources = market && market.sources ? market.sources : [];
    $('method-content').innerHTML = '<h3>这是什么，不是什么</h3><p>这是月度历史学习工具，不连接券商、不下单，也不提供未来价格预测。纳斯达克100与标普500使用价格指数，不含股息再投资；黄金使用美元/金衡盎司参考价，不是黄金ETF净值。</p>' +
      '<h3>从哪一天开始，如何买入</h3><p>区间包含所选开始月和结束月。首月投入初始资金与当月定投；以后每月投入约定金额。每次按上一月参考价计算买入份额，再按本月参考价估值。' + esc(market ? market.method : '行情来源尚未加载。') + '</p><p>如果采用月均价，这是统一月频的教学近似，并非能在月初按上一月均价真实成交的回测。不能将其与常见月末收盘价回测混为一谈。</p>' +
      '<h3>人民币与美元</h3><p>人民币参考价＝美元资产价 × 人民币/美元汇率。买入和估值都使用对应月份的汇率，因此人民币升贬值会改变人民币结果。没有汇率对冲，也不包含换汇价差。</p>' +
      '<h3>调整、费用与收益</h3><p>事件在当月结束后展示，调整从下一月生效，只改变新增投入，不卖出持仓。年费率默认0；如填写1%，每月按 (1−1%) 的十二分之一次方保留份额。它是统一模拟费用，不代表具体基金真实费率。</p><p>盈利＝期末资产−累计投入。累计收益率＝盈利÷累计投入，不是年化。XIRR 使用各月月初投入及最后一个月月末资产，按365天折算资金加权年化；极短区间的年化可能很大，不代表可重复实现。</p>' +
      '<h3>回撤与年度表现</h3><p>最大回撤按排除新增资金的单位净值计算，避免加钱掩盖损失。只观察所选区间，月度采样会漏掉月内更深的跌幅。前高恢复周期也是区间内、月度口径。历年表现是资产价格变化，不是定投收益；末年未结束时标星。</p>' +
      '<h3>历史事件的边界</h3><p>节点描述尽量限于当月已知信息；影响解释是机制分析，不是对涨跌的唯一归因。完整后续故事只在结算出现。史料链接可能是事后回顾，打开后可能看到后续结果。</p>' +
      '<h3>来源与日期</h3>' + (sources.length ? '<ul>' + sources.map(function (source) { return '<li>' + link(source.url, source.label) + (source.note ? '：' + esc(source.note) : '') + '</li>'; }).join('') + '</ul>' : '<p>尚未载入行情来源。</p>') +
      '<p>“最新”指个人数据包中所有资产与汇率共同覆盖的最后完整月份，不是今日实时行情。基金观察来自包内的天天基金快照，记录净值披露日期和逐条检查时间，不自动刷新。基金限额、渠道费率可能变化，下单前必须核对原页。</p>' +
      '<p>本工具未包含税、通胀、交易滑点、全部基金成本和跟踪误差；历史结果不构成买卖建议。数据来源标注不等同于取得公开再分发许可。</p>';
  }
  function showMethod() { pause(); $('method-title').textContent = '数据与计算说明'; renderMethod(); $('method-dialog').showModal(); }

  document.querySelectorAll('[data-tab]').forEach(function (button) { button.addEventListener('click', function () { setTab(button.dataset.tab); }); });
  $('setup-form').addEventListener('submit', startJourney);
  $('end-mode').addEventListener('change', function () { $('custom-end-wrap').hidden = this.value !== 'custom'; $('end-month').required = this.value === 'custom'; });
  document.querySelectorAll('[data-preset]').forEach(function (button) {
    button.addEventListener('click', function () {
      var range = button.dataset.preset.split(',');
      $('start-month').value = range[0]; $('end-month').value = range[1]; $('end-mode').value = 'custom'; $('custom-end-wrap').hidden = false; $('end-month').required = true;
    });
  });
  $('play-button').addEventListener('click', function () { if (journey && journey.running) { pause(); $('play-note').textContent = '已暂停，你可以继续或调整后续月投。'; } else resume(); });
  $('speed').addEventListener('change', function () { if (journey && journey.running) schedule(); });
  $('next-event-button').addEventListener('click', nextEvent);
  $('adjust-button').addEventListener('click', function () { openDecision(null); });
  $('restart-button').addEventListener('click', restart);
  $('event-continue').addEventListener('click', function () { $('event-dialog').close(); resume(); });
  $('event-adjust').addEventListener('click', showAdjust);
  $('event-close').addEventListener('click', function () { $('event-dialog').close(); });
  $('event-dialog').addEventListener('close', function () { if (journey && !journey.running && !journey.complete) $('play-note').textContent = '已暂停。点击“继续”让时间继续向前。'; });
  $('adjust-form').addEventListener('submit', saveAdjust);
  $('annual-currency').addEventListener('change', renderAnnual);
  ['fund-search', 'fund-index', 'fund-state'].forEach(function (id) { $(id).addEventListener(id === 'fund-search' ? 'input' : 'change', renderFunds); });
  $('method-button').addEventListener('click', showMethod);
  $('footer-method').addEventListener('click', showMethod);
  $('method-close').addEventListener('click', function () { $('method-dialog').close(); });
  $('data-file').addEventListener('change', importData);
  $('export-data').addEventListener('click', exportData);
  $('import-help').addEventListener('click', showImportHelp);
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);

  window.InvestDataStore.load().then(function (pkg) {
    if (pkg) usePackage(pkg, true);
    else {
      $('load-status').hidden = true;
      $('coverage').textContent = '支持 2000 年起的历史 · 首次请导入个人数据';
      $('annual-table').innerHTML = '<p class="status">导入个人数据后，可查看三种资产的历年表现。</p>';
    }
  }).catch(function () {
    $('load-status').textContent = '未能读取此设备的数据，请重新导入个人数据包。';
    $('coverage').textContent = '支持 2000 年起的月度历史 · 等待数据';
    $('annual-table').innerHTML = '<p class="status">请先载入经过核验的历史数据。</p>';
    renderMethod();
  });
  renderFunds();
})();
