/* ==========================================================
   学了么 · 目录数据
   这里定义所有大分类、二级分类和篇目规划。
   ready: true 表示已写好（正文在 content-*.js 中），
   ready: false 表示"待更新"占位。
   ========================================================== */

window.XLM_ARTICLES = {}; // 各 content-*.js 文件会把正文注册到这里

window.XLM_DATA = {
  version: "1.7",
  batch: "世界历史 · 从文明曙光到全球互依",

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
            { id: "china-ezhou-confucius", title: "孔子：一个失败者如何成为万世师表", year: "前551–前479", sub: "从陋巷课堂到《论语》，他没说服诸侯，却教育了两千年", ready: true },
            { id: "china-ezhou-laozi", title: "老子：五千字里的柔弱与力量", year: "约前6世纪", sub: "函谷关外的传说，与《道德经》真正留下的人生方法", ready: true },
            { id: "china-ezhou-2", title: "战国：变法图强与大兼并", year: "前453起", sub: "两百年淘汰赛，改革最狠的笑到最后", ready: true }
          ]
        },
        {
          id: "china-qin", name: "秦", emoji: "👑", desc: "前 221 — 前 207 · 短暂而深刻的第一帝国",
          articles: [
            { id: "china-qin-1", title: "商鞅变法：强国方案与它的代价", year: "前356起", sub: "徙木立信、作法自毙：一场改变中国底色的改革", ready: true },
            { id: "china-qin-2", title: "秦始皇：统一六国与二世而亡", year: "前221起", sub: "千古一帝与十五年而亡：制度活了两千年", ready: true },
            { id: "china-qin-qinshihuang", title: "人物篇 · 秦始皇", year: "前259–前210", sub: "人质之子、千古一帝与求仙路上的孤独者", ready: true },
            { id: "china-qin-shangyang", title: "人物篇 · 商鞅", year: "约前390–前338", sub: "把秦国改造成战争机器，也被自己的制度反噬", ready: true }
          ]
        },
        {
          id: "china-han", name: "汉", emoji: "🐎", desc: "前 202 — 220 · 定义'中国'的四百年",
          articles: [
            { id: "china-han-1", title: "楚汉相争与文景之治", year: "前202起", sub: "会用人的赢了会打仗的，休养生息攒出第一个盛世", ready: true },
            { id: "china-han-2", title: "汉武帝：极盛的账单", year: "前141起", sub: "封狼居胥的荣光，与'户口减半'的账单", ready: true },
            { id: "china-han-3", title: "光武中兴与东汉的落幕", year: "25起", sub: "最温和的开国皇帝，与外戚宦官的死循环", ready: true },
            { id: "china-han-liubang", title: "人物篇 · 刘邦", year: "前256–前195", sub: "四十八岁起兵：一个总打败仗的人为什么赢到最后", ready: true },
            { id: "china-han-xiangyu", title: "人物篇 · 项羽", year: "前232–前202", sub: "力拔山兮气盖世：战神、虞姬与不会复盘的霸王", ready: true },
            { id: "china-han-hanwudi", title: "人物篇 · 汉武帝", year: "前156–前87", sub: "从金屋藏娇到轮台罪己：雄才大略的全部账单", ready: true },
            { id: "china-han-huoqubing", title: "人物篇 · 霍去病", year: "前140–前117", sub: "十八岁封侯，二十三岁谢幕：最耀眼也最短暂的将星", ready: true },
            { id: "china-han-hanxin", title: "人物篇 · 韩信", year: "约前231–前196", sub: "能指挥百万大军，却走不出功高震主的权力迷局", ready: true },
            { id: "china-han-lvzhi", title: "人物篇 · 吕雉", year: "前241–前180", sub: "从患难妻子到铁腕掌舵人：暴行与治绩如何同看", ready: true },
            { id: "china-han-zhangliang", title: "人物篇 · 张良", year: "约前250–前186", sub: "最聪明的不是献计，而是知道何时离场", ready: true },
            { id: "china-han-xiaohe", title: "人物篇 · 萧何", year: "约前257–前193", sub: "别人争天下，他替天下准备粮仓、档案与人才", ready: true }
          ]
        },
        {
          id: "china-3k", name: "三国", emoji: "🪶", desc: "220 — 280 · 最出名的乱世",
          articles: [
            { id: "china-3k-1", title: "从黄巾到赤壁：三分天下", year: "184起", sub: "烧掉那箱信：官渡、隆中对与赤壁", ready: true },
            { id: "china-3k-2", title: "三国归晋：谁笑到了最后", year: "220起", sub: "鞠躬尽瘁者与装病等待者，谁笑到最后", ready: true },
            { id: "china-3k-caocao", title: "人物篇 · 曹操", year: "155–220", sub: "治世能臣还是乱世奸雄？诗人、枭雄与背锅最多的人", ready: true },
            { id: "china-3k-zhugeliang", title: "人物篇 · 诸葛亮", year: "181–234", sub: "隆中对、空城计与出师表：真实的他比传说更动人", ready: true },
            { id: "china-3k-liubei", title: "人物篇 · 刘备", year: "161–223", sub: "屡败屡战的织席少年，靠什么换来一群人的忠诚", ready: true },
            { id: "china-3k-sunquan", title: "人物篇 · 孙权", year: "182–252", sub: "十九岁接班、坐断东南：守成高手为何晚年失控", ready: true },
            { id: "china-3k-simayi", title: "人物篇 · 司马懿", year: "179–251", sub: "熬过曹氏四代：忍耐、装病与高平陵的最后一击", ready: true }
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
            { id: "china-tang-3", title: "藩镇、黄巢与大唐落幕", year: "763起", sub: "藩镇、宦官、党争，与一个落第考生的复仇", ready: true },
            { id: "china-tang-lishimin", title: "人物篇 · 李世民", year: "598–649", sub: "玄武门的血与贞观的光：一个明君如何面对原罪", ready: true },
            { id: "china-tang-lilongji", title: "人物篇 · 李隆基", year: "685–762", sub: "前半生开创盛世，后半生亲手失去它", ready: true },
            { id: "china-tang-wuzetian", title: "人物篇 · 武则天", year: "624–705", sub: "从才人到女皇：无字碑为什么比颂词更有力量", ready: true },
            { id: "china-tang-libai", title: "人物篇 · 李白", year: "701–762", sub: "诗仙不是只会喝酒：天才、狂气与一生求仕不得", ready: true },
            { id: "china-tang-dufu", title: "人物篇 · 杜甫", year: "712–770", sub: "一个总在失业的父亲，如何写成中国人的诗史", ready: true },
            { id: "china-tang-wangwei", title: "人物篇 · 王维", year: "约701–761", sub: "诗中有画：盛唐最安静的人，也经历过最喧闹的乱世", ready: true },
            { id: "china-tang-baijuyi", title: "人物篇 · 白居易", year: "772–846", sub: "让卖炭翁与长恨歌都能被普通人听见", ready: true },
            { id: "china-tang-wangbo", title: "人物篇 · 王勃", year: "约650–约676", sub: "一篇滕王阁序，把二十余年的人生写成长回声", ready: true },
            { id: "china-tang-wangchangling", title: "人物篇 · 王昌龄", year: "约698–约756", sub: "边塞风雪里，也藏着一片冰心", ready: true },
            { id: "china-tang-yangyuhuan", title: "人物篇 · 杨玉环", year: "719–756", sub: "爱情传奇背后，她为何成了帝国衰败的替罪羊", ready: true },
            { id: "china-tang-taiping", title: "人物篇 · 太平公主", year: "约665–713", sub: "最像武则天的女儿，为何没能成为第二个母亲", ready: true }
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
            { id: "china-song-3", title: "靖康之变与南宋偏安", year: "1127起", sub: "靖康之耻、岳飞之死与崖山蹈海", ready: true },
            { id: "china-song-zhaokuangyin", title: "人物篇 · 赵匡胤", year: "927–976", sub: "黄袍加身后，他如何防止下一个自己出现", ready: true },
            { id: "china-song-wanganshi", title: "人物篇 · 王安石", year: "1021–1086", sub: "当一个改革者试图重新设计国家", ready: true },
            { id: "china-song-sushi", title: "人物篇 · 苏轼", year: "1037–1101", sub: "一生被贬，却把困顿重新过成名篇", ready: true },
            { id: "china-song-liqingzhao", title: "人物篇 · 李清照", year: "1084–约1155", sub: "从赌书泼茶到山河破碎，她不只写愁", ready: true },
            { id: "china-song-xinqiji", title: "人物篇 · 辛弃疾", year: "1140–1207", sub: "最会打仗的词人，最会写词的将军", ready: true }
          ]
        },
        {
          id: "china-yuan", name: "元", emoji: "⛺", desc: "1271 — 1368 · 从草原到大都",
          articles: [
            { id: "china-yuan-1", title: "元朝：从成吉思汗到忽必烈", year: "1206起", sub: "千户制、行省与纸币：草原如何统治天下", ready: true },
            { id: "china-yuan-2", title: "元末：纸币崩溃与红巾军", year: "1351起", sub: "石人一只眼：人类第一次纸币崩溃实录", ready: true },
            { id: "china-yuan-genghis", title: "人物篇 · 成吉思汗", year: "约1162–1227", sub: "从被抛弃的少年到草原征服者：组织与毁灭", ready: true },
            { id: "china-yuan-kublai", title: "人物篇 · 忽必烈", year: "1215–1294", sub: "从草原大汗到中国皇帝，两种身份如何搭桥", ready: true }
          ]
        },
        {
          id: "china-ming", name: "明", emoji: "⛵", desc: "1368 — 1644 · 从洪武到甲申",
          articles: [
            { id: "china-ming-1", title: "明朝早期：洪武与永乐", year: "1368起", sub: "乞丐开国，藩王夺位：'勉之！世子多疾'", ready: true },
            { id: "china-ming-2", title: "明朝中期：从土木堡到张居正", year: "1449起", sub: "皇帝被俘、于谦救国，与一场人亡政息的改革", ready: true },
            { id: "china-ming-3", title: "明朝晚期：万历、崇祯与终局", year: "1573起", sub: "三十年不上朝的皇帝，和勤政亡国的皇帝", ready: true },
            { id: "china-ming-zhuyuanzhang", title: "人物篇 · 朱元璋", year: "1328–1398", sub: "从草席葬亲到大明开国：苦难怎样塑造也扭曲一个人", ready: true },
            { id: "china-ming-zhudi", title: "人物篇 · 朱棣", year: "1360–1424", sub: "靖难、永乐与“世子多疾”：抢来的皇位如何证明自己", ready: true }
          ]
        },
        {
          id: "china-qing", name: "清", emoji: "🏮", desc: "1644 — 1912 · 最后的王朝",
          articles: [
            { id: "china-qing-1", title: "清朝早期：入关与康雍乾", year: "1644起", sub: "擒鳌拜、摊丁入亩与人口爆炸：盛世的成色", ready: true },
            { id: "china-qing-2", title: "清朝中期：鸦片战争与洋务运动", year: "1840起", sub: "虎门销烟、火烧圆明园与只换零件的自救", ready: true },
            { id: "china-qing-3", title: "清朝晚期：甲午、新政与辛亥", year: "1894起", sub: "甲午之败、科举之废与武昌一声枪响", ready: true },
            { id: "china-qing-kangxi", title: "人物篇 · 康熙", year: "1654–1722", sub: "少年擒鳌拜，晚年困于九子夺嫡：六十一年帝王课", ready: true },
            { id: "china-qing-yongzheng", title: "人物篇 · 雍正", year: "1678–1735", sub: "篡位传说背后，是十三年不眠不休的改革", ready: true },
            { id: "china-qing-qianlong", title: "人物篇 · 乾隆", year: "1711–1799", sub: "十全老人：盛世怎样在掌声中悄悄转过拐点", ready: true },
            { id: "china-qing-puyi", title: "人物篇 · 溥仪", year: "1906–1967", sub: "三次登基三次退场：一个皇帝被时代反复改写", ready: true },
            { id: "china-qing-cixi", title: "人物篇 · 慈禧太后", year: "1835–1908", sub: "垂帘、变法与庚子：妖后标签之外的真实掌权者", ready: true },
            { id: "china-qing-lihongzhang", title: "人物篇 · 李鸿章", year: "1823–1901", sub: "晚清裱糊匠：近代化、条约与该由谁承担的账", ready: true },
            { id: "china-qing-jiawu", title: "事件篇 · 甲午战争", year: "1894–1895", sub: "亚洲第一舰队，为何沉入制度的裂缝", ready: true }
          ]
        },
        {
          id: "china-roc", name: "中华民国", emoji: "🚂", desc: "1912 — 1949 · 大转型时代",
          articles: [
            { id: "china-roc-1", title: "辛亥革命与民国初年", year: "1911起", sub: "宋教仁之死、洪宪闹剧与新文化运动", ready: true },
            { id: "china-roc-2", title: "从北伐到 1949", year: "1926起", sub: "十四年抗战，与一场货币崩溃的倒计时", ready: true },
            { id: "china-roc-sunyatsen", title: "人物篇 · 孙中山", year: "1866–1925", sub: "十次起义与一次成功：革命先行者也曾不断失败", ready: true },
            { id: "china-roc-chiang", title: "人物篇 · 蒋介石", year: "1887–1975", sub: "北伐、抗战与败退台湾：功过最难一笔写完的人", ready: true },
            { id: "china-roc-mao", title: "人物篇 · 毛泽东", year: "1893–1976", sub: "从韶山到天安门：革命、建国与巨大争议", ready: true },
            { id: "china-roc-resistance", title: "事件篇 · 中国抗日战争", year: "1931–1945", sub: "十四年血火：一个积弱国家怎样撑到最后", ready: true },
            { id: "china-roc-luxun", title: "人物篇 · 鲁迅", year: "1881–1936", sub: "弃医从文不是不想救人，而是换了一把手术刀", ready: true },
            { id: "china-roc-xuzhimo", title: "人物篇 · 徐志摩", year: "1897–1931", sub: "轻轻的诗句背后，是从不轻的人生责任", ready: true },
            { id: "china-roc-linhuiyin", title: "人物篇 · 林徽因", year: "1904–1955", sub: "她最重要的作品，从来不是一段爱情传闻", ready: true }
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
          id: "wh-ancient", name: "古代文明与古典世界", emoji: "🏛️", desc: "城市、民主与帝国的最初实验",
          articles: [
            { id: "wh-civilizations", title: "最早的文明：人类为什么要挤进城市", year: "约前3500起", sub: "文字先替粮仓记账，城市同时发明协作、阶层与国家", ready: true },
            { id: "wh-greece", title: "古希腊：民主、哲学与不民主的另一面", year: "前8世纪起", sub: "从雅典公民大会到亚历山大：追问比答案活得更久", ready: true },
            { id: "wh-rome", title: "罗马帝国：一座城怎样统治地中海", year: "前509起", sub: "共和国为何被胜利撑破，西罗马又为何不是一天倒下", ready: true }
          ]
        },
        {
          id: "wh-medieval", name: "中世纪与欧亚交流", emoji: "🧭", desc: "信仰、商路、征服与瘟疫",
          articles: [
            { id: "wh-islam-silk", title: "丝路与伊斯兰黄金时代", year: "7世纪起", sub: "从巴格达到长安：知识如何穿过语言和帝国边界", ready: true },
            { id: "wh-mongol", title: "蒙古帝国：马背征服重新连接欧亚", year: "1206起", sub: "驿站让商人与技术走得更远，也让战争和疾病更快", ready: true },
            { id: "wh-plague", title: "十字军与黑死病", year: "1095起", sub: "信仰远征、地中海碰撞与一场重估劳动价值的瘟疫", ready: true }
          ]
        },
        {
          id: "wh-modern", name: "近代革命与新世界", emoji: "⛵", desc: "印刷、远航与公民政治",
          articles: [
            { id: "wh-renaissance", title: "文艺复兴与宗教改革", year: "14世纪起", sub: "一张印刷纸如何挑战旧权威，也把争论交给更多人", ready: true },
            { id: "wh-exploration", title: "大航海与殖民征服", year: "1492起", sub: "世界连成一体时，白银、土豆、病菌与奴役同船而来", ready: true },
            { id: "wh-america", title: "美国的诞生与崛起", year: "1776起", sub: "自由宣言为何容得下奴隶制，一个国家如何追赶自己的理想", ready: true },
            { id: "wh-france", title: "法国大革命与拿破仑", year: "1789起", sub: "自由平等为何走进断头台，革命成果又如何传遍欧洲", ready: true }
          ]
        },
        {
          id: "wh-industrial-age", name: "工业与帝国时代", emoji: "⚙️", desc: "机器、资本与被瓜分的世界",
          articles: [
            { id: "wh-industrial", title: "工业革命：机器与钟表接管生活", year: "约1760起", sub: "生产率、工厂纪律、童工与大众生活改善之间的长路", ready: true },
            { id: "wh-imperialism", title: "帝国主义与殖民体系", year: "约1870起", sub: "地图上的直线是谁画的，铁路又首先通向谁的港口", ready: true }
          ]
        },
        {
          id: "wh-worldwars", name: "两次世界大战", emoji: "🕊️", desc: "总体战、灭绝与旧秩序崩塌",
          articles: [
            { id: "wh-ww1", title: "第一次世界大战", year: "1914–1918", sub: "一个月里，联盟、动员表和恐惧怎样把欧洲锁进战争", ready: true },
            { id: "wh-ww2", title: "第二次世界大战", year: "1931/1939–1945", sub: "侵略、种族主义、大屠杀与核时代共同改写世界", ready: true }
          ]
        },
        {
          id: "wh-postwar", name: "冷战、独立与全球化", emoji: "🔗", desc: "超级大国、民族自决与互依世界",
          articles: [
            { id: "wh-coldwar", title: "冷战始末", year: "1947–1991", sub: "美苏不敢直接开战，热战为何却落在别人的土地", ready: true },
            { id: "wh-decolonization", title: "去殖民化：地图突然多出许多国家", year: "1945起", sub: "独立不是帝国赠礼，升旗以后还要接手旧边界和经济结构", ready: true },
            { id: "wh-europe-global", title: "欧洲一体化与全球化", year: "1950起", sub: "把煤钢绑在一起阻止战争，供应链又如何连接和放大风险", ready: true }
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
