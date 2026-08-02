/* ==========================================================
   学了么 · 导航与渲染逻辑
   三层结构：首页大分类 → 二级分类 → 具体篇目
   路由基于 URL hash，返回键、浏览器后退都可用。
   ========================================================== */

(function () {
  "use strict";

  var DATA = window.XLM_DATA;
  var ARTS = window.XLM_ARTICLES;
  var app = document.getElementById("app");
  var topTitle = document.getElementById("top-title");
  var backSlot = document.getElementById("back-slot");

  /* ---------- 索引：文章 id → 所在分类 ---------- */
  var INDEX = {};
  DATA.categories.forEach(function (cat) {
    (cat.articles || []).forEach(function (a) {
      INDEX[a.id] = { cat: cat, sub: null, meta: a };
    });
    (cat.subs || []).forEach(function (sub) {
      (sub.articles || []).forEach(function (a) {
        INDEX[a.id] = { cat: cat, sub: sub, meta: a };
      });
    });
  });

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function textFromHtml(html) {
    var box = document.createElement("div");
    box.innerHTML = html || "";
    return (box.textContent || "").replace(/\s+/g, " ").trim();
  }

  function smartExcerpt(text, limit) {
    if (text.length <= limit) return text;
    var cut = text.slice(0, limit);
    var stop = Math.max(cut.lastIndexOf("。"), cut.lastIndexOf("！"), cut.lastIndexOf("？"));
    if (stop > Math.round(limit * 0.62)) return cut.slice(0, stop + 1);
    return cut.replace(/[，、；：]?[^，、；：。！？]{0,22}$/, "") + "……";
  }

  function buildChatGPTPrompt(art, info) {
    var category = info.cat.name + (info.sub ? " · " + info.sub.name : "");
    var articleText = smartExcerpt(textFromHtml(art.body), 330);
    var people = (art.people || []).slice(0, 5).map(function (p) { return p.name; }).join("、");
    var insights = (art.insights || []).slice(0, 4).map(function (it) {
      return it.t + "：" + smartExcerpt(textFromHtml(it.d), 52);
    }).join("；");

    return [
      "我刚在「学了么」读完《" + art.title + "》。",
      "阅读背景：" + category + "；" + (art.kicker || info.meta.year || "历史与经济故事") + "。",
      "文章摘要：" + articleText,
      people ? "关键人物：" + people + "。" : "",
      insights ? "文章给出的核心启示：" + insights : "",
      "请把以上内容作为这次新对话的学习背景。回答时请保持史实严谨，同时讲得像故事一样清楚、有趣、容易记住；区分确定史实、争议解释和后世传说，并尽量补充人物动机、决策背后的利益、伏笔与反转，以及对今天经济、投资、管理或人生选择的启发。不要机械复述文章。",
      "如果我还没有补充具体问题，请先给我 3 个最值得继续深挖的问题；如果我在下面补充了问题，请直接回答。",
      "我的问题："
    ].filter(Boolean).join("\n\n");
  }

  function buildExploreCard(id, art, info) {
    var prompt = buildChatGPTPrompt(art, info);
    var href = "https://chatgpt.com/?prompt=" + encodeURIComponent(prompt);
    return '<section class="explore-card" aria-labelledby="explore-title-' + esc(id) + '">' +
      '<div class="explore-heading"><span class="explore-orb" aria-hidden="true">✦</span>' +
      '<div><div class="explore-eyebrow">继续探索</div>' +
      '<h2 id="explore-title-' + esc(id) + '">让好奇心再往前一步</h2></div></div>' +
      '<p class="explore-copy">这篇文章的背景、人物与核心启示已经整理好。打开新对话后，你可以追问细节，也可以把历史放到今天重新推演。</p>' +
      '<div class="explore-chips" aria-label="可探索方向"><span>人物细节</span><span>因果推演</span><span>联系今天</span></div>' +
      '<a class="explore-btn" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer external" aria-describedby="explore-note-' + esc(id) + '">' +
      '<span class="explore-btn-mark" aria-hidden="true">✦</span><span class="explore-btn-label"><b>继续探索</b><small>问 ChatGPT</small></span><span class="explore-btn-arrow" aria-hidden="true">↗</span></a>' +
      '<div class="explore-note" id="explore-note-' + esc(id) + '"><span aria-hidden="true"></span>将打开新的 ChatGPT 对话 · 已带入本篇背景</div>' +
      '</section>';
  }

  function readyCount(list) {
    var n = 0;
    (list || []).forEach(function (a) { if (a.ready) n++; });
    return n;
  }
  function catArticleList(cat) {
    if (cat.articles) return cat.articles;
    var all = [];
    (cat.subs || []).forEach(function (s) { all = all.concat(s.articles || []); });
    return all;
  }

  /* ---------- 顶栏 ---------- */
  function setTopBar(title, backHash, backLabel) {
    topTitle.textContent = title || "";
    if (backHash === null) {
      backSlot.innerHTML = "";
    } else {
      backSlot.innerHTML =
        '<a class="back-btn" href="' + esc(backHash) + '">' +
        '<span class="chev">‹</span><span>' + esc(backLabel || "返回") + "</span></a>";
    }
  }

  /* ---------- 待更新提示 ---------- */
  var toastEl = null, toastTimer = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
  }

  /* ---------- 视图：首页 ---------- */
  function viewHome() {
    var total = 0, done = 0;
    DATA.categories.forEach(function (cat) {
      var list = catArticleList(cat);
      total += list.length;
      done += readyCount(list);
    });

    var h = '<div class="view">';
    h += '<header class="hero"><h1><span>学</span><span>了</span><span>么</span></h1>' +
      "<p>每天读懂一段历史、一次经济浪潮，把好奇变成判断力。</p>" +
      '<span class="progress">已更新 ' + done + " 篇 · 规划中 " + (total - done) + " 篇</span></header>";

    DATA.categories.forEach(function (cat) {
      var list = catArticleList(cat);
      var rc = readyCount(list);
      h += '<div class="cat-card" data-nav="#/c/' + cat.id + '">' +
        '<div class="cat-emoji">' + cat.emoji + "</div>" +
        '<div class="cat-info"><div class="name">' + esc(cat.name) + "</div>" +
        '<div class="tag">' + esc(cat.tagline) + "</div></div>" +
        '<div class="cat-count">' + (rc > 0 ? rc + " 篇" : "筹备中") + "</div>" +
        '<div class="chevron">›</div></div>';
    });

    h += '<div class="home-foot">学了么 · 用故事积累认知<br>当前版本 v' + esc(DATA.version) +
      " · " + esc(DATA.batch) + "</div></div>";

    app.innerHTML = h;
    setTopBar("", null);
  }

  /* ---------- 视图：分类页 ---------- */
  function viewCategory(cat) {
    var h = '<div class="view">';
    h += '<header class="page-head"><h1>' + esc(cat.name) + "</h1><p>" + esc(cat.tagline) + "</p></header>";

    if (cat.subs) {
      cat.subs.forEach(function (sub) {
        var rc = readyCount(sub.articles);
        h += '<div class="cat-card" data-nav="#/c/' + cat.id + "/" + sub.id + '">' +
          '<div class="cat-emoji">' + esc(sub.emoji || cat.emoji) + "</div>" +
          '<div class="cat-info"><div class="name">' + esc(sub.name) + "</div>" +
          '<div class="tag">' + esc(sub.desc || "") + "</div></div>" +
          '<div class="cat-count">' + (rc > 0 ? rc + " 篇" : "筹备中") + "</div>" +
          '<div class="chevron">›</div></div>';
      });
    } else {
      h += articleRows(cat.articles);
    }
    h += "</div>";
    app.innerHTML = h;
    setTopBar(cat.name, "#/", "首页");
  }

  /* ---------- 视图：二级分类页 ---------- */
  function viewSub(cat, sub) {
    var h = '<div class="view">';
    h += '<header class="page-head"><h1>' + esc(sub.name) + "</h1><p>" + esc(sub.desc || "") + "</p></header>";
    h += articleRows(sub.articles);
    h += "</div>";
    app.innerHTML = h;
    setTopBar(cat.name + " · " + sub.name, "#/c/" + cat.id, cat.name);
  }

  /* ---------- 篇目列表 ---------- */
  function articleRows(list) {
    var h = "";
    (list || []).forEach(function (a) {
      var metaBadge = a.flag
        ? '<div class="event-meta" title="' + esc(a.country || "") + '">' +
            '<div class="country-mark"><span class="country-flag" aria-hidden="true">' + esc(a.flag) + "</span>" +
            '<span class="country-name">' + esc(a.country || "") + "</span></div>" +
            '<div class="event-year">' + esc(a.year) + "</div></div>"
        : '<div class="year-badge">' + esc(a.year) + "</div>";
      if (a.ready && ARTS[a.id]) {
        h += '<div class="row-card" data-nav="#/a/' + a.id + '">' +
          metaBadge +
          '<div class="row-main"><div class="row-title">' + esc(a.title) + "</div>" +
          (a.sub ? '<div class="row-sub">' + esc(a.sub) + "</div>" : "") +
          "</div>" + '<div class="chevron">›</div></div>';
      } else {
        h += '<div class="row-card soon" data-soon="1">' +
          metaBadge +
          '<div class="row-main"><div class="row-title">' + esc(a.title) + "</div></div>" +
          '<div class="badge-soon">待更新</div></div>';
      }
    });
    if (!h) h = '<div class="empty-tip">本分类的故事正在打磨中<br>敬请期待</div>';
    return h;
  }

  /* ---------- 视图：文章页 ---------- */
  function viewArticle(id) {
    var art = ARTS[id];
    var info = INDEX[id];
    if (!art || !info) { location.hash = "#/"; return; }

    var cat = info.cat, sub = info.sub;
    var listHash = sub ? "#/c/" + cat.id + "/" + sub.id : "#/c/" + cat.id;
    var listName = sub ? sub.name : cat.name;

    // 字数与阅读时间（按正文纯文字估算）
    var plain = art.body.replace(/<[^>]*>/g, "").replace(/\s/g, "");
    var chars = Math.round(plain.length / 100) * 100;
    var mins = Math.max(2, Math.round(plain.length / 420));

    var h = '<div class="view"><article class="article">';
    h += '<div class="kicker">' + esc(art.kicker || info.meta.year) + "</div>";
    h += '<h1 class="a-title">' + esc(art.title) + "</h1>";
    h += '<div class="a-meta"><span>' + esc(cat.name) + (sub ? " · " + esc(sub.name) : "") +
      "</span><span>全文约 " + chars + " 字</span><span>约 " + mins + " 分钟读完</span></div>";
    h += '<div class="a-body">' + art.body + "</div>";

    // ⏳ 时间线
    if (art.timeline && art.timeline.length) {
      h += '<section class="mod"><div class="mod-head"><span>⏳</span><span>时间线</span></div>' +
        '<div class="tl-scroll">' + buildTimeline(art.timeline) + "</div>" +
        (art.timeline.length > 4 ? '<div class="tl-hint">← 左右滑动查看 →</div>' : "") +
        "</section>";
    }

    // 👤 关键人物
    if (art.people && art.people.length) {
      h += '<section class="mod"><div class="mod-head"><span>👤</span><span>关键人物</span></div>';
      art.people.forEach(function (p) {
        h += '<div class="person-card"><div class="person-avatar">' + esc(p.name.charAt(0)) + "</div>" +
          '<div class="person-main"><div class="person-name-row">' +
          '<span class="person-name">' + esc(p.name) + "</span>" +
          (p.years ? '<span class="person-years">' + esc(p.years) + "</span>" : "") +
          (p.role ? '<span class="person-role">' + esc(p.role) + "</span>" : "") +
          "</div>" + '<div class="person-desc">' + esc(p.desc) + "</div></div></div>";
      });
      h += "</section>";
    }

    // 💡 启示
    if (art.insights && art.insights.length) {
      h += '<section class="mod"><div class="mod-head"><span>💡</span><span>启示</span></div>';
      art.insights.forEach(function (it) {
        h += '<div class="insight-card"><div class="t">' + esc(it.t) + "</div>" +
          '<div class="d">' + esc(it.d) + "</div></div>";
      });
      h += "</section>";
    }

    // ✦ 继续探索：为每篇文章生成专属背景，交给新的 ChatGPT 对话
    h += buildExploreCard(id, art, info);

    // 上一篇 / 下一篇（同列表内已更新的篇目）
    var siblings = (sub ? sub.articles : cat.articles) || [];
    var pos = -1;
    siblings.forEach(function (a, i) { if (a.id === id) pos = i; });
    var prev = null, next = null;
    for (var i = pos - 1; i >= 0; i--) { if (siblings[i].ready && ARTS[siblings[i].id]) { prev = siblings[i]; break; } }
    for (var j = pos + 1; j < siblings.length; j++) { if (siblings[j].ready && ARTS[siblings[j].id]) { next = siblings[j]; break; } }
    h += '<div class="a-nav">';
    if (next) h += '<a class="a-nav-btn" href="#/a/' + next.id + '"><div class="dir">下一篇</div><div class="ttl">' + esc(next.title) + " ›</div></a>";
    if (prev) h += '<a class="a-nav-btn" href="#/a/' + prev.id + '"><div class="dir">上一篇</div><div class="ttl">‹ ' + esc(prev.title) + "</div></a>";
    h += '<a class="a-nav-btn" href="' + listHash + '"><div class="dir">返回目录</div><div class="ttl">' + esc(listName) + " 全部篇目</div></a></div>";

    h += "</article></div>";
    app.innerHTML = h;
    setTopBar(art.title, listHash, listName);
  }

  /* ---------- 时间线 SVG ---------- */
  function buildTimeline(events) {
    var stepW = 118, padL = 46, padR = 46;
    var w = padL + padR + stepW * (events.length - 1);
    if (w < 340) w = 340;
    var hgt = 132, midY = 66;

    var s = '<svg viewBox="0 0 ' + w + " " + hgt + '" width="' + w + '" height="' + hgt +
      '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="时间线">';
    s += '<line class="tl-line" x1="' + (padL - 24) + '" y1="' + midY + '" x2="' + (w - padR + 24) + '" y2="' + midY + '"/>';

    events.forEach(function (ev, i) {
      var x = padL + i * stepW;
      s += '<circle class="tl-dot" cx="' + x + '" cy="' + midY + '" r="5.5"/>';
      s += '<text class="tl-year" x="' + x + '" y="' + (midY - 16) + '" text-anchor="middle">' + esc(ev.y) + "</text>";
      // 事件说明：超过 8 个字自动折成两行
      var t = ev.t || "";
      var lines = [];
      if (t.length > 8) { lines = [t.slice(0, 8), t.slice(8, 17)]; } else { lines = [t]; }
      lines.forEach(function (ln, k) {
        s += '<text class="tl-lab" x="' + x + '" y="' + (midY + 24 + k * 16) + '" text-anchor="middle">' + esc(ln) + "</text>";
      });
    });
    s += "</svg>";
    return s;
  }

  /* ---------- 路由 ---------- */
  function route() {
    var hash = location.hash || "#/";
    var parts = hash.replace(/^#\//, "").split("/").filter(Boolean);

    if (parts.length === 0) { viewHome(); }
    else if (parts[0] === "c" && parts[1]) {
      var cat = null;
      DATA.categories.forEach(function (c) { if (c.id === parts[1]) cat = c; });
      if (!cat) { viewHome(); }
      else if (parts[2] && cat.subs) {
        var sub = null;
        cat.subs.forEach(function (s) { if (s.id === parts[2]) sub = s; });
        sub ? viewSub(cat, sub) : viewCategory(cat);
      } else { viewCategory(cat); }
    }
    else if (parts[0] === "a" && parts[1]) { viewArticle(parts[1]); }
    else { viewHome(); }

    window.scrollTo(0, 0);
  }

  /* ---------- 事件 ---------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("[data-nav],[data-soon]") : null;
    if (!el) return;
    if (el.hasAttribute("data-soon")) { toast("这一篇还在打磨中，敬请期待 ✍️"); return; }
    location.hash = el.getAttribute("data-nav");
  });

  window.addEventListener("hashchange", route);
  route();
})();
