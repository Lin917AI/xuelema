/* ==========================================================
   学了么 · 目录数据
   这里定义所有大分类、二级分类和篇目规划。
   ready: true 表示已写好（正文在 content-*.js 中），
   ready: false 表示"待更新"占位。
   ========================================================== */

window.XLM_ARTICLES = {}; // 各 content-*.js 文件会把正文注册到这里

window.XLM_DATA = {
  version: "1.0",
  batch: "第 1 批 · 金融危机系列",

  categories: [
    {
      id: "crisis",
      name: "金融危机",
      emoji: "🌊",
      tagline: "每一次泡沫，都相信这次不一样",
      articles: [
        { id: "crisis-tulip",       title: "郁金香狂热",       year: "1634–1637", sub: "第一场载入史册的投机狂潮，主角是一朵花", ready: true },
        { id: "crisis-mississippi", title: "密西西比泡沫",     year: "1716–1720", sub: "一个赌徒当上法国财政大臣，把整个国家变成赌局", ready: true },
        { id: "crisis-southsea",    title: "南海泡沫",         year: "1720",      sub: "连牛顿都亏掉巨款：'我算得出天体，算不出人心'", ready: true },
        { id: "crisis-1929",        title: "1929 大萧条",      year: "1929–1933", sub: "股灾如何一步步演变成吞噬十年的大萧条", ready: true },
        { id: "crisis-1987",        title: "黑色星期一",       year: "1987",      sub: "单日暴跌 22.6%，至今无人打破的纪录", ready: true },
        { id: "crisis-japan",       title: "日本泡沫破裂",     year: "1985–1992", sub: "'失去的三十年'从何而来，34 年才回到原点", ready: true },
        { id: "crisis-asia97",      title: "亚洲金融风暴",     year: "1997–1998", sub: "一场从曼谷开始、烧遍半个亚洲的传染病", ready: true },
        { id: "crisis-dotcom",      title: "互联网泡沫",       year: "1995–2001", sub: "故事是真的，价格是错的：纳斯达克跌去 78%", ready: true },
        { id: "crisis-2008",        title: "2008 全球金融危机", year: "2007–2009", sub: "一根看不见的链条，如何拖垮整个世界", ready: true },
        { id: "crisis-2015",        title: "2015 A股股灾",     year: "2014–2016", sub: "杠杆牛、千股跌停与熔断：离我们最近的一课", ready: true }
      ]
    },

    {
      id: "china",
      name: "中国历史",
      emoji: "🏯",
      tagline: "两千年兴衰，都在故事里",
      subs: [
        {
          id: "china-qin", name: "秦", desc: "前 221 — 前 207 · 短暂而深刻的第一帝国",
          articles: [
            { id: "china-qin-1", title: "商鞅变法：强国方案与它的代价", year: "前356起", sub: "", ready: false },
            { id: "china-qin-2", title: "秦始皇:统一六国与二世而亡",    year: "前221起", sub: "", ready: false }
          ]
        },
        {
          id: "china-han", name: "汉", desc: "前 202 — 220 · 定义'中国'的四百年",
          articles: [
            { id: "china-han-1", title: "楚汉相争与文景之治", year: "前202起", sub: "", ready: false },
            { id: "china-han-2", title: "汉武帝：极盛的账单", year: "前141起", sub: "", ready: false },
            { id: "china-han-3", title: "光武中兴与东汉的落幕", year: "25起", sub: "", ready: false }
          ]
        },
        {
          id: "china-tang", name: "唐", desc: "618 — 907 · 盛世与转折",
          articles: [
            { id: "china-tang-1", title: "玄武门与贞观之治", year: "618起", sub: "", ready: false },
            { id: "china-tang-2", title: "开元盛世与安史之乱", year: "713起", sub: "", ready: false },
            { id: "china-tang-3", title: "藩镇、黄巢与大唐落幕", year: "763起", sub: "", ready: false }
          ]
        },
        {
          id: "china-song", name: "宋", desc: "960 — 1279 · 最富有也最憋屈的王朝",
          articles: [
            { id: "china-song-1", title: "陈桥兵变与北宋立国", year: "960起", sub: "", ready: false },
            { id: "china-song-2", title: "王安石变法：改革为何失败", year: "1069起", sub: "", ready: false },
            { id: "china-song-3", title: "靖康之变与南宋偏安", year: "1127起", sub: "", ready: false }
          ]
        },
        {
          id: "china-ming", name: "明", desc: "1368 — 1644 · 从洪武到甲申",
          articles: [
            { id: "china-ming-1", title: "明朝早期：洪武与永乐", year: "1368起", sub: "", ready: false },
            { id: "china-ming-2", title: "明朝中期：从土木堡到张居正", year: "1449起", sub: "", ready: false },
            { id: "china-ming-3", title: "明朝晚期：万历、崇祯与终局", year: "1573起", sub: "", ready: false }
          ]
        },
        {
          id: "china-qing", name: "清", desc: "1644 — 1912 · 最后的王朝",
          articles: [
            { id: "china-qing-1", title: "清朝早期：入关与康雍乾", year: "1644起", sub: "", ready: false },
            { id: "china-qing-2", title: "清朝中期：鸦片战争与洋务运动", year: "1840起", sub: "", ready: false },
            { id: "china-qing-3", title: "清朝晚期：甲午、新政与辛亥", year: "1894起", sub: "", ready: false }
          ]
        }
      ]
    },

    {
      id: "worldhist",
      name: "世界历史",
      emoji: "🌍",
      tagline: "看懂世界如何走到今天",
      subs: [
        {
          id: "wh-ancient", name: "古代与中世纪", desc: "帝国的兴衰逻辑",
          articles: [
            { id: "wh-rome",    title: "罗马帝国的兴衰", year: "前27起", sub: "", ready: false },
            { id: "wh-mongol",  title: "蒙古帝国与草原征服", year: "1206起", sub: "", ready: false }
          ]
        },
        {
          id: "wh-modern", name: "近代转折", desc: "现代世界的诞生",
          articles: [
            { id: "wh-renaissance", title: "文艺复兴与地理大发现", year: "14世纪起", sub: "", ready: false },
            { id: "wh-france",      title: "法国大革命", year: "1789起", sub: "", ready: false },
            { id: "wh-america",     title: "美国的诞生与崛起", year: "1776起", sub: "", ready: false }
          ]
        },
        {
          id: "wh-20c", name: "二十世纪", desc: "战争与秩序重建",
          articles: [
            { id: "wh-ww1",     title: "第一次世界大战", year: "1914起", sub: "", ready: false },
            { id: "wh-ww2",     title: "第二次世界大战", year: "1939起", sub: "", ready: false },
            { id: "wh-coldwar", title: "冷战始末", year: "1947起", sub: "", ready: false }
          ]
        }
      ]
    },

    {
      id: "econ",
      name: "世界经济发展",
      emoji: "📈",
      tagline: "财富从哪里来，到哪里去",
      articles: [
        { id: "econ-industrial", title: "工业革命：机器改变世界", year: "1760起", sub: "", ready: false },
        { id: "econ-colonial",   title: "大航海与殖民贸易", year: "1500起", sub: "", ready: false },
        { id: "econ-bretton",    title: "布雷顿森林体系：美元登基", year: "1944", sub: "", ready: false },
        { id: "econ-oil",        title: "石油危机与大滞胀", year: "1973起", sub: "", ready: false },
        { id: "econ-japan",      title: "日本战后经济奇迹", year: "1950起", sub: "", ready: false },
        { id: "econ-global",     title: "全球化与产业转移", year: "1980起", sub: "", ready: false },
        { id: "econ-reform",     title: "中国改革开放", year: "1978起", sub: "", ready: false },
        { id: "econ-dollar",     title: "美元霸权：印钞机与全世界", year: "1971起", sub: "", ready: false }
      ]
    },

    {
      id: "money",
      name: "货币史",
      emoji: "🪙",
      tagline: "钱本身的故事",
      articles: [
        { id: "money-origin",  title: "货币的诞生：从贝壳到黄金", year: "远古起", sub: "", ready: false },
        { id: "money-jiaozi",  title: "交子：世界最早的纸币", year: "1024", sub: "", ready: false },
        { id: "money-gold",    title: "金本位的兴衰", year: "1816起", sub: "", ready: false },
        { id: "money-hyper",   title: "恶性通胀简史：魏玛与津巴布韦", year: "1923起", sub: "", ready: false },
        { id: "money-digital", title: "数字货币时代", year: "2009起", sub: "", ready: false }
      ]
    },

    {
      id: "powers",
      name: "大国博弈",
      emoji: "♟️",
      tagline: "牌桌上的国家们",
      articles: [
        { id: "powers-coldwar", title: "冷战经济战：不开枪的较量", year: "1947起", sub: "", ready: false },
        { id: "powers-plaza",   title: "广场协议：汇率战经典一役", year: "1985", sub: "", ready: false },
        { id: "powers-empire",  title: "大英帝国的兴衰", year: "1688起", sub: "", ready: false },
        { id: "powers-ussr",    title: "苏联解体：超级大国的落幕", year: "1991", sub: "", ready: false },
        { id: "powers-trade",   title: "中美贸易战", year: "2018起", sub: "", ready: false }
      ]
    },

    {
      id: "people",
      name: "历史人物",
      emoji: "👤",
      tagline: "商业与权力的弄潮儿",
      articles: [
        { id: "people-lvbuwei",     title: "吕不韦：把王位当生意做", year: "战国", sub: "", ready: false },
        { id: "people-fanli",       title: "范蠡：三散家财的商圣", year: "春秋", sub: "", ready: false },
        { id: "people-huxueyan",    title: "胡雪岩：红顶商人的起落", year: "晚清", sub: "", ready: false },
        { id: "people-rockefeller", title: "洛克菲勒：石油帝国", year: "19世纪", sub: "", ready: false },
        { id: "people-morgan",      title: "J.P.摩根：一个人的央行", year: "19世纪", sub: "", ready: false },
        { id: "people-rothschild",  title: "罗斯柴尔德家族", year: "18世纪起", sub: "", ready: false }
      ]
    }
  ]
};
