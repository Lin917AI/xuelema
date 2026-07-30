/* ==========================================================
   学了么 · 目录数据
   这里定义所有大分类、二级分类和篇目规划。
   ready: true 表示已写好（正文在 content-*.js 中），
   ready: false 表示"待更新"占位。
   ========================================================== */

window.XLM_ARTICLES = {}; // 各 content-*.js 文件会把正文注册到这里

window.XLM_DATA = {
  version: "1.3",
  batch: "视觉体验升级",

  categories: [
    {
      id: "crisis",
      name: "金融危机",
      emoji: "🌊",
      tagline: "每一次泡沫，都相信这次不一样",
      articles: [
        { id: "crisis-tulip",       title: "郁金香狂热",       year: "1634–1637", country: "荷兰", flag: "🇳🇱", sub: "第一场载入史册的投机狂潮，主角是一朵花", ready: true },
        { id: "crisis-mississippi", title: "密西西比泡沫",     year: "1716–1720", country: "法国", flag: "🇫🇷", sub: "一个赌徒当上法国财政大臣，把整个国家变成赌局", ready: true },
        { id: "crisis-southsea",    title: "南海泡沫",         year: "1720",      country: "英国", flag: "🇬🇧", sub: "连牛顿都亏掉巨款：'我算得出天体，算不出人心'", ready: true },
        { id: "crisis-1929",        title: "1929 大萧条",      year: "1929–1933", country: "美国", flag: "🇺🇸", sub: "股灾如何一步步演变成吞噬十年的大萧条", ready: true },
        { id: "crisis-1987",        title: "黑色星期一",       year: "1987",      country: "美国", flag: "🇺🇸", sub: "单日暴跌 22.6%，至今无人打破的纪录", ready: true },
        { id: "crisis-japan",       title: "日本泡沫破裂",     year: "1985–1992", country: "日本", flag: "🇯🇵", sub: "'失去的三十年'从何而来，34 年才回到原点", ready: true },
        { id: "crisis-asia97",      title: "亚洲金融风暴",     year: "1997–1998", country: "泰国", flag: "🇹🇭", sub: "一场从曼谷开始、烧遍半个亚洲的传染病", ready: true },
        { id: "crisis-dotcom",      title: "互联网泡沫",       year: "1995–2001", country: "美国", flag: "🇺🇸", sub: "故事是真的，价格是错的：纳斯达克跌去 78%", ready: true },
        { id: "crisis-2008",        title: "2008 全球金融危机", year: "2007–2009", country: "美国", flag: "🇺🇸", sub: "一根看不见的链条，如何拖垮整个世界", ready: true },
        { id: "crisis-2015",        title: "2015 A股股灾",     year: "2014–2016", country: "中国", flag: "🇨🇳", sub: "杠杆牛、千股跌停与熔断：离我们最近的一课", ready: true }
      ]
    },

    {
      id: "china",
      name: "中国历史",
      emoji: "🏯",
      tagline: "从传说时代到民国，兴衰都在故事里",
      subs: [
        {
          id: "china-legend", name: "三皇五帝", emoji: "🔥", desc: "传说时代 · 神话与文明的曙光",
          articles: [
            { id: "china-legend-1", title: "三皇五帝：传说里的文明开端", year: "传说时代", sub: "神话是压缩的历史，考古正在给传说'验伤'", ready: true }
          ]
        },
        {
          id: "china-xia", name: "夏", emoji: "🌊", desc: "约前 2070 — 前 1600 · 第一王朝之谜",
          articles: [
            { id: "china-xia-1", title: "夏朝：中国第一王朝之谜", year: "约前2070起", sub: "大禹治水、家天下，与一座叫二里头的遗址", ready: true }
          ]
        },
        {
          id: "china-shang", name: "商", emoji: "🐢", desc: "约前 1600 — 前 1046 · 甲骨文与青铜时代",
          articles: [
            { id: "china-shang-1", title: "商朝：刻在龟甲上的王朝", year: "约前1600起", sub: "一味中药，救回了一个王朝三千年前的记忆", ready: true }
          ]
        },
        {
          id: "china-wzhou", name: "西周", emoji: "🏺", desc: "前 1046 — 前 771 · 封建天下与礼乐制度",
          articles: [
            { id: "china-wzhou-1", title: "西周：把天下分出去的王朝", year: "前1046起", sub: "分封、礼乐，以及中国确切纪年的开始", ready: true }
          ]
        },
        {
          id: "china-ezhou", name: "东周", emoji: "⚔️", desc: "前 770 — 前 256 · 春秋与战国",
          articles: [
            { id: "china-ezhou-1", title: "春秋：礼崩乐坏与五霸迭兴", year: "前770起", sub: "周天子还在，但说了算的换成了霸主", ready: true },
            { id: "china-ezhou-2", title: "战国：变法图强与大兼并", year: "前453起", sub: "两百年淘汰赛，改革最狠的笑到最后", ready: true }
          ]
        },
        {
          id: "china-qin", name: "秦", emoji: "👑", desc: "前 221 — 前 207 · 短暂而深刻的第一帝国",
          articles: [
            { id: "china-qin-1", title: "商鞅变法：强国方案与它的代价", year: "前356起", sub: "徙木立信、作法自毙：一场改变中国底色的改革", ready: true },
            { id: "china-qin-2", title: "秦始皇：统一六国与二世而亡", year: "前221起", sub: "千古一帝与十五年而亡：制度活了两千年", ready: true }
          ]
        },
        {
          id: "china-han", name: "汉", emoji: "🐎", desc: "前 202 — 220 · 定义'中国'的四百年",
          articles: [
            { id: "china-han-1", title: "楚汉相争与文景之治", year: "前202起", sub: "会用人的赢了会打仗的，休养生息攒出第一个盛世", ready: true },
            { id: "china-han-2", title: "汉武帝：极盛的账单", year: "前141起", sub: "封狼居胥的荣光，与'户口减半'的账单", ready: true },
            { id: "china-han-3", title: "光武中兴与东汉的落幕", year: "25起", sub: "最温和的开国皇帝，与外戚宦官的死循环", ready: true }
          ]
        },
        {
          id: "china-3k", name: "三国", emoji: "🪶", desc: "220 — 280 · 最出名的乱世",
          articles: [
            { id: "china-3k-1", title: "从黄巾到赤壁：三分天下", year: "184起", sub: "烧掉那箱信：官渡、隆中对与赤壁", ready: true },
            { id: "china-3k-2", title: "三国归晋：谁笑到了最后", year: "220起", sub: "鞠躬尽瘁者与装病等待者，谁笑到最后", ready: true }
          ]
        },
        {
          id: "china-wjin", name: "西晋", emoji: "📜", desc: "266 — 316 · 短暂统一与大崩溃",
          articles: [
            { id: "china-wjin-1", title: "西晋：八王之乱与永嘉之祸", year: "266起", sub: "斗富、傻皇帝与八王之乱：统一只撑了37年", ready: true }
          ]
        },
        {
          id: "china-ejin", name: "东晋", emoji: "🖌️", desc: "317 — 420 · 衣冠南渡",
          articles: [
            { id: "china-ejin-1", title: "东晋：衣冠南渡与淝水之战", year: "317起", sub: "闻鸡起舞、淝水之战：八万人如何胜八十万", ready: true }
          ]
        },
        {
          id: "china-nbc", name: "南北朝", emoji: "🪷", desc: "420 — 589 · 大分裂与大融合",
          articles: [
            { id: "china-nbc-1", title: "南北朝：胡汉融合一百七十年", year: "420起", sub: "孝文帝汉化与侯景之乱：大分裂酿出大融合", ready: true }
          ]
        },
        {
          id: "china-sui", name: "隋", emoji: "🚤", desc: "581 — 618 · 再造统一的短命王朝",
          articles: [
            { id: "china-sui-1", title: "隋朝：再造统一与大运河", year: "581起", sub: "三省六部、大运河：又一个'像秦朝'的王朝", ready: true }
          ]
        },
        {
          id: "china-tang", name: "唐", emoji: "🐫", desc: "618 — 907 · 盛世与转折",
          articles: [
            { id: "china-tang-1", title: "玄武门与贞观之治", year: "618起", sub: "血腥的开局，克制的盛世：以人为镜", ready: true },
            { id: "china-tang-2", title: "开元盛世与安史之乱", year: "713起", sub: "从开元全盛到马嵬驿：巅峰跌落只用一年", ready: true },
            { id: "china-tang-3", title: "藩镇、黄巢与大唐落幕", year: "763起", sub: "藩镇、宦官、党争，与一个落第考生的复仇", ready: true }
          ]
        },
        {
          id: "china-5d", name: "五代十国", emoji: "🏹", desc: "907 — 979 · 武人当政的五十年",
          articles: [
            { id: "china-5d-1", title: "五代十国：枪杆子里的走马灯", year: "907起", sub: "儿皇帝、伶人天子与'三个十年'的柴荣", ready: true }
          ]
        },
        {
          id: "china-song", name: "宋", emoji: "🧭", desc: "960 — 1279 · 最富有也最憋屈的王朝",
          articles: [
            { id: "china-song-1", title: "陈桥兵变与北宋立国", year: "960起", sub: "黄袍加身与杯酒释兵权：一杯酒解决千年难题", ready: true },
            { id: "china-song-2", title: "王安石变法：改革为何失败", year: "1069起", sub: "青苗法为何变成摊派：好心办坏事的标本", ready: true },
            { id: "china-song-3", title: "靖康之变与南宋偏安", year: "1127起", sub: "靖康之耻、岳飞之死与崖山蹈海", ready: true }
          ]
        },
        {
          id: "china-yuan", name: "元", emoji: "⛺", desc: "1271 — 1368 · 从草原到大都",
          articles: [
            { id: "china-yuan-1", title: "元朝：从成吉思汗到忽必烈", year: "1206起", sub: "千户制、行省与纸币：草原如何统治天下", ready: true },
            { id: "china-yuan-2", title: "元末：纸币崩溃与红巾军", year: "1351起", sub: "石人一只眼：人类第一次纸币崩溃实录", ready: true }
          ]
        },
        {
          id: "china-ming", name: "明", emoji: "⛵", desc: "1368 — 1644 · 从洪武到甲申",
          articles: [
            { id: "china-ming-1", title: "明朝早期：洪武与永乐", year: "1368起", sub: "乞丐开国，藩王夺位：'勉之！世子多疾'", ready: true },
            { id: "china-ming-2", title: "明朝中期：从土木堡到张居正", year: "1449起", sub: "皇帝被俘、于谦救国，与一场人亡政息的改革", ready: true },
            { id: "china-ming-3", title: "明朝晚期：万历、崇祯与终局", year: "1573起", sub: "三十年不上朝的皇帝，和勤政亡国的皇帝", ready: true }
          ]
        },
        {
          id: "china-qing", name: "清", emoji: "🏮", desc: "1644 — 1912 · 最后的王朝",
          articles: [
            { id: "china-qing-1", title: "清朝早期：入关与康雍乾", year: "1644起", sub: "擒鳌拜、摊丁入亩与人口爆炸：盛世的成色", ready: true },
            { id: "china-qing-2", title: "清朝中期：鸦片战争与洋务运动", year: "1840起", sub: "虎门销烟、火烧圆明园与只换零件的自救", ready: true },
            { id: "china-qing-3", title: "清朝晚期：甲午、新政与辛亥", year: "1894起", sub: "甲午之败、科举之废与武昌一声枪响", ready: true }
          ]
        },
        {
          id: "china-roc", name: "中华民国", emoji: "🚂", desc: "1912 — 1949 · 大转型时代",
          articles: [
            { id: "china-roc-1", title: "辛亥革命与民国初年", year: "1911起", sub: "宋教仁之死、洪宪闹剧与新文化运动", ready: true },
            { id: "china-roc-2", title: "从北伐到 1949", year: "1926起", sub: "十四年抗战，与一场货币崩溃的倒计时", ready: true }
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
