const $ = s => document.querySelector(s);
const stage = $('#map-stage'), modal = $('#modal'), content = $('#modal-content');
let clueFound = false;
const cityMinZoom = matchMedia('(max-width:700px)').matches ? 1 : .69;
let cityZoom = cityMinZoom;
let cityPanX = 0, cityPanY = 0;
let worldZoom = 1, worldPanX = 0, worldPanY = 0;
let scenePanX = 0, scenePanY = 0;
let soundEnabled = true, narrationEnabled = false, audioContext, masterGain, ambientTimer, marketTimer, hoverNarrationTimer;
let lastNarration = '';
let activeStoryKey = null;

const stories = {
  registan: ['REGISTAN · 雷吉斯坦广场','15TH–17TH CENTURY','先站远一点。三座经学院不是同时出现的：兀鲁伯经学院约 1420 年先到，谢尔多尔与蒂拉卡里隔了两百年才把广场围合。它们像三位很有主见、却被迫合影的建筑师。别只看正面；一座城市如何把教育、礼仪和权力放在同一片空地，才是雷吉斯坦最耐看的地方。'],
  gur: ['GUR-E-AMIR · 古尔·埃米尔陵墓','ROUTE STOP 01','先认那顶青蓝色肋拱穹顶。陵墓原为帖木儿早逝的孙子穆罕默德·苏丹而建，后来帖木儿与王族也长眠于此。你在大厅看到的是纪念石棺，真正墓室在地下。征服者生前走得很远，身后倒把安静交给了一栋极其醒目的建筑。'],
  bibi: ['BIBI-KHANYM · 比比哈努姆清真寺','ROUTE STOP 03','先抬头——这座清真寺从来没打算低调。帖木儿在 1399 年印度远征后下令兴建，巨大的尺度要把统治雄心变成人人看得见的东西；只是建筑也有承重极限，宏伟不等于免检。靠近看釉砖时，你会发现帝国宣言最后仍要由工匠一块块完成。'],
  siyob: ['SIYOB BAZAAR · 锡亚布市场','ROUTE STOP 04','先闻到它，再看见它。十四世纪末帖木儿扩建撒马尔罕时，从比比哈努姆清真寺通往雷吉斯坦的主街就是市集轴线。今天的锡亚布仍把馕、干果、香料和讨价还价留在纪念建筑旁边。帝国会改朝换代，午饭时间通常照常营业。'],
  shah: ['SHAH-I-ZINDA · 沙赫静达陵墓群','ROUTE STOP 05','先别数门廊，你很快会数乱。这里不是一座陵墓，而是从喀喇汗王朝到帖木儿时代逐渐形成的陵墓街，围绕库萨姆·伊本·阿巴斯的圣迹传统成为朝圣地。每几步，釉砖技法和赞助者就换一次。它像一条建筑时间线，只是比年表漂亮，也更不肯按顺序说话。'],
  afrasiab: ['AFRASIAB · 阿弗拉西亚卜遗址','DAY 02 · STOP 06','眼前的土丘很安静，地下却藏着蒙古征服前的撒马尔罕。1965 年修路时，七世纪“大使厅”壁画意外出土：使节、礼物与远方人物挤进四面墙。画面解释仍有争议，这反而是它迷人的地方——考古不是把答案擦亮，而是学会和残缺认真相处。'],
  observatory: ['ULUGH BEG OBSERVATORY · 兀鲁伯天文台','DAY 02 · STOP 07','这段地下弧槽不像天文台，倒像建筑忘了收好的巨型量角器。十五世纪，兀鲁伯的观测站用约 40 米半径的固定仪器细分刻度，团队随后编成《兀鲁伯星表》。有些人仰望星空；他们更务实，先造了一栋楼来量它。'],
  rukhabad: ['RUKHABAD MAUSOLEUM · 鲁哈巴德陵墓','NEARBY LANDMARK','先看看它有多克制：没有宏大门廊，只有砖墙、中央平面与一顶穹顶。十四世纪末，它为苏菲学者布尔汉丁·萨加拉吉而建，和不远处的古尔·埃米尔像两种完全不同的纪念方式。前者不抢镜——在撒马尔罕，这已经很有个性。'],
  chorsu: ['CHORSU · 四顶穹顶建筑','NEARBY LANDMARK','先别把它只当展览馆。“Chorsu”这个名字来自四路交会；早期文献里的 Čahār Suq 很可能是雷吉斯坦的前身之一。换句话说，城市中央不只属于宫殿和经学院，也属于找路、碰面和做买卖的人。建筑如今安静，名字却还在指挥交通。'],
  khizr: ['HAZRAT KHIZR MOSQUE · 哈兹拉特·希兹尔清真寺','NEARBY LANDMARK','站到廊下再回头。今天看到的哈兹拉特·希兹尔清真寺主要形成于 1854 年及其后的增建；从高处望向比比哈努姆，城市层次一下排开。它很适合最后停一会儿——不是每个景点都必须继续证明自己很重要。'],
  tile: ['YOU FOUND A CLUE','BLUE TILE','为什么撒马尔罕如此湛蓝？蓝与青绿釉砖让宏伟建筑在尘土色城市中像远方的信标。你找到了一块属于这座城的颜色。'],
  merchant: ['A TRAVELLER SAYS…','LOOKING FOR SILK?','“我从东方带来丝绸，从南方带来香料。可最珍贵的，是一路听来的故事。”'],
  camel: ['THE CAMEL SAYS…','GRRROAN','它似乎对历史没有意见，只想知道下一处水井在哪里。'],
  courtyard_tiles: ['LOOK CLOSER','THE TILED IWAN','巨大的拱门把视线引向经学院内部。蓝、青绿与赭色釉砖把平面墙体拆解成连续的几何秩序；从远处看是整体图案，走近后才看见每块砖的差异。'],
  fountain: ['COURTYARD LIFE','SHADE & WATER','庭院不是空白的纪念空间。树荫、水池与环绕的学生房间让这里成为可以停留、交谈和学习的日常场所。'],
  doorway: ['ENTER THE MADRASA','STUDY CHAMBER','门洞后的房间比广场安静得多。向前进入，看看知识如何在手稿、仪器与面对面的讲授中被保存。'],
  astrolabe: ['KNOWLEDGE OBJECT','ASTROLABE','星盘把天空的运动压缩进一件可以携带的黄铜仪器。它可用于观测、计时与方向判断，也象征撒马尔罕与天文学之间的联系。'],
  manuscripts: ['KNOWLEDGE OBJECT','MANUSCRIPTS','纸张让文字更容易被复制、携带与交换。丝路上的知识传播不是抽象概念，而是由抄写者、教师、商人和一页页手稿共同完成。'],
  niche: ['ARCHITECTURAL DETAIL','PAINTED NICHE','室内的蓝色并不依赖宏大的尺度。小型几何纹样与拱形壁龛把广场上的建筑语言带进学习空间。'],
  registan_tiger: ['LOCAL DETAIL · 建筑奇观','THE TIGERS & HUMAN SUN · 狮虎与人面太阳','谢尔多尔经学院正门上出现追逐鹿只的猫科动物和带有人脸的太阳，在宗教建筑中格外醒目。这不是对面兀鲁伯经学院的简单复制，而是 17 世纪统治者与 15 世纪帖木儿黄金时代的建筑对话。'],
  ulugh_teacher: ['ULUGH BEG MADRASA · 兀鲁伯经学院','THE KING AT THE BLACKBOARD · 国王讲数学','传统记载认为，兀鲁伯本人曾在经学院参与授课与学术讨论。在这里，他不只是坐在王座上的统治者，也可能是站在天球仪、星盘和几何图前的教师。这一叙述展现了帖木儿时代权力与知识并存的一面。'],
  bibi_kiss: ['LOCAL LEGEND · 当地传说','THE QUEEN, THE ARCHITECT & A KISS · 王后与建筑师之吻','传说帖木儿出征时，王后想建造清真寺作为惊喜，建筑师却要求以一个吻交换按时完工，吻痕最终引发帖木儿的震怒。这是后世的浪漫传说；较可信的记录显示工程由帖木儿下令兴建。'],
  siyob_bread: ['LOCAL LEGEND · 城市滋味','THE BREAD THAT CANNOT LEAVE · 带不走的撒马尔罕面包','当地流传一种说法：即使把最好的配方和师傅带走，离开撒马尔罕后也烤不出完全相同的圆馕。故事常把秘密归因于城市的水、空气，甚至撒马尔罕本身。它不是食品科学结论，却准确说出食物如何成为城市身份。'],
  ceramics: ['MARKET OBJECT','GLAZED CERAMICS','釉陶既是日用品也是技术传播的证据。颜色、烧制方法与纹样会随着工匠、商人和消费者跨地区流动。'],
  spices: ['MARKET OBJECT','SPICE SACKS','香料价值高、体积小，适合长距离运输。市场里的气味提醒旅行者：路线连接的不只是城市，也连接气候与食物传统。'],
  cat: ['LOCAL EXPERT','THE BAZAAR CAT','这只猫仍然拒绝就丝绸之路发表任何意见。']
  ,gur_dome: ['GUR-E-AMIR · 古尔·埃米尔陵墓','THE RIBBED DOME · 肋拱穹顶','从远处识别古尔·埃米尔，最醒目的就是高起的青蓝色肋拱穹顶。竖向肋线把体量拉得更高，表面文字与几何装饰让穹顶像一顶覆盖陵墓的织物冠冕。'],
  gur_tombs: ['WHO IS BURIED HERE? · 谁长眠于此','A DYNASTIC MAUSOLEUM · 王朝陵墓','帖木儿与部分子孙、导师被纪念于此。室内可见的石棺是地面纪念物，实际墓穴位于地下。帖木儿的深色墓碑常被视为视觉中心，但建筑最初与他早逝的孙子穆罕默德·苏丹有关。'],
  gur_anecdote: ['ANECDOTE · 逸闻','THE CURSE OF TIMUR · 帖木儿的诅咒','1941 年苏联考古团队打开墓室研究遗骸，两天后纳粹德国进攻苏联，于是出现“释放了比帖木儿更可怕的征服者”的传闻。后来又有人把遗骸重新安葬与斯大林格勒战局逆转联系起来。所谓警告铭文与命令重葬的细节缺乏可靠证据，它更适合被理解为 20 世纪的都市传说。'],
  bibi_portal: ['BIBI-KHANYM · 比比哈努姆清真寺','THE IMPERIAL PORTAL · 帝国门廊','巨型门廊用尺度宣告帖木儿帝国的力量。快速施工与超大跨度也带来结构问题；今天所见包含长期损毁和现代修复留下的层次。'],
  bibi_stand: ['COURTYARD OBJECT · 庭院物件','QURAN STAND · 古兰经架','庭院中央的石质书架原用于托举巨幅古兰经。当地流传从架下穿行可获得生育祝福的说法，显示宗教建筑如何进入城市居民的日常叙事。'],
  bibi_scale: ['LOOK UP · 抬头看','ARCHITECTURE AS AMBITION · 建筑与雄心','门廊、宣礼塔与穹顶共同制造远超人体尺度的体验。靠近看釉砖，远退看轮廓，能读出工艺细节与帝国政治之间的关系。'],
  shah_lane: ['SHAH-I-ZINDA · 沙赫静达陵墓群','A STREET OF MAUSOLEUMS · 陵墓街','它不是单一建筑，而是一条沿坡地逐步形成的陵墓长廊。每走几步，年代、赞助者与装饰技术都会变化。'],
  shah_tiles: ['LOOK CLOSER · 靠近看','A LABORATORY OF BLUE · 蓝色实验室','马赛克釉砖、雕刻陶片和绘制釉面并置出现。蓝色并非一种色值，而是一组从深钴蓝到青绿的材料选择。'],
  shah_legend: ['NAME & LEGEND · 名称与传说','THE LIVING KING · 永生之王','名称与库萨姆·伊本·阿巴斯的圣迹传统有关。传说他在撒马尔罕传教时被斩首，却拾起自己的头颅，走入一口通往乐园的井中继续生活，因而被称为“永生之王”。这是宗教传说，其确切埋葬位置无法完全由考古证实。'],
  afrasiab_discovery: ['AFRASIAB · 阿弗拉西亚卜遗址','1965 · AN ACCIDENTAL DISCOVERY · 意外发现','修路工程让埋藏的厅堂重见天日，也造成部分损坏。考古学家随后面对的不只是发掘，还包括与氧化和残缺赛跑的保护工作。'],
  afrasiab_ambassadors: ['THE WEST WALL · 西壁','AMBASSADORS · 万国使节','西壁出现来自不同地区的使者与礼物。它可能表达王权、外交与撒马尔罕的中心想象；具体人物和政治事件仍存在学术争论。'],
  afrasiab_north: ['THE NORTH WALL · 北壁','CHINA IMAGINED · 想象中的中国','狩猎与水上场景常被联系到唐代宫廷。画中主角是否为某位皇帝、皇后或公主并无定论，更可靠的读法是观察粟特画师如何把远方信息转译成自己的视觉语言。'],
  afrasiab_method: ['HOW DO WE KNOW? · 如何解读','EVIDENCE, NOT CERTAINTY · 证据而非定论','研究者会比较题记、服饰、动物、节庆、墓葬图像与多语种文献。残画留下的空白不能靠一个漂亮故事填满；好的解读会同时展示依据与不确定性。'],
  afrasiab_room: ['THE AMBASSADORS’ HALL · “大使厅”','A PRIVATE ROOM? · 私密空间？','壁画所在房间约 11 平方米，并不适合大型会客。它依附于一座私人住宅，画作品质却极高，因此委托人可能非常富有，甚至接近统治阶层；但这仍缺少可以定案的证据。“大使厅”是依据主壁使节场面而来的考古命名。'],
  afrasiab_south: ['THE SOUTH WALL · 南壁','PROCESSION & EMPTY HORSE · 队伍与空鞍马','南壁队伍中出现大象、骑马女性、白鸟与一匹装饰华丽却无人骑乘的马。学者把它与祭祖、诺鲁孜节及伊朗宗教传统联系起来；空鞍马也可能象征引导亡者跨入来世。'],
  afrasiab_animals: ['LOOK AT THE ANIMALS · 观察动物','HORSES, DOGS & WATERBIRDS · 马、犬与水禽','空鞍马可能是祭品或通往来世的象征；尖耳猎犬与贵妇身边的陪伴犬显示动物具有不同社会角色；南壁成列水禽或与祭祀有关，北壁水鸟则可能只是营造水上场景。动物不是边角装饰，而是辨认仪式、阶层和跨文化图像来源的线索。'],
  sogdian_world: ['SOGDIAN WORLDVIEW · 粟特人的世界观','A CITY BETWEEN EMPIRES · 帝国之间的城市','粟特并非统一帝国，而是绿洲城邦网络。撒马尔罕处在中国、伊朗、印度与草原世界之间，商业带来财富，也让居民习惯从多个方向理解世界。四壁把不同地域并列，正是这种世界经验的视觉表达。'],
  sogdian_trade: ['SOGDIAN NETWORK · 粟特网络','FARMERS, MERCHANTS, TRANSLATORS · 农人、商人与翻译者','粟特繁荣并不只靠商队：泽拉夫善河谷的农业与灌溉先支撑城市，部分居民再沿商路远行。处在唐帝国与伊朗—阿拉伯世界之间，让粟特人长期充当商人、外交中介与文化翻译者。'],
  mural_materials: ['MURAL MATERIALS · 壁画材料','COLOR UNDER THREAT · 脆弱的颜色','书评资料提到壁画绘于泥质、石膏处理的墙面，并使用朱砂、青金石等矿物颜料。干燥大风、暴露后的氧化与早期施工扰动都会让颜色和地层信息继续流失；观看残片也应同时理解保护的紧迫性。'],
  observatory_sextant: ['ULUGH BEG OBSERVATORY · 兀鲁伯天文台','THE GREAT MERIDIAN ARC · 巨型子午仪','地下弧槽是一件固定在建筑中的巨型测量仪器。半径越大，刻度越能细分，学者便能更精确记录天体越过子午线的位置。'],
  observatory_catalogue: ['HOUSE OF KNOWLEDGE · 知识之所','THE STAR CATALOGUE · 星表','兀鲁伯与学者团队编制星表，显示观测不是孤独天才的一夜灵感，而是长期协作、计算、校正与记录。'],
  observatory_story: ['ANECDOTE · 逸闻','A RULER WHO WATCHED THE SKY · 仰望星空的统治者','兀鲁伯的政治生涯以悲剧告终，但天文学工作让他的名字持续被记住。遗址消失数百年后，考古学家依据文献与地形重新找到天文台。']
};

stories.observatory_story = ['ANECDOTE · 逸闻','THE OBSERVATORY THAT VANISHED · 消失的天文台','兀鲁伯去世后，天文台逐渐废弃，地面建筑消失，位置也被遗忘。直到 1908 年，考古学家才依据文献与地形重新发现地下测量弧的一部分。它提醒人们：一座曾经用来测量整片天空的建筑，也可以在城市记忆中失踪几百年。'];

Object.assign(stories,{
  bukhara_hauz:['LYABI-HAUZ · 拉比哈乌兹建筑群','DAY 01 · STOP 01','先找水，不要先找纪念碑。“拉比哈乌兹”就是“水池旁”。在干燥的绿洲城市里，水池决定人在哪里停下、聊天、喝茶，也决定商人愿不愿意多留一晚。今天大家坐在树荫下看手机；几百年前，人们坐在这里看谁刚从远方回来。功能其实没有差得太远。'],
  bukhara_domes:['TRADING DOMES · 布哈拉穹顶市场','DAY 01 · STOP 02','抬头看穹顶，再低头看秤。前者负责遮阳和通风，后者负责避免一笔买卖只剩下热情。珠宝、帽子、布匹与钱币兑换曾各有空间；来自不同地区的钱币和重量单位必须被换算，长途贸易才不会在第一句讨价还价里结束。历史在市场里通常不穿礼服，而且很会算账。'],
  bukhara_madrasas:['KOSH MADRASAS · 双经学院','DAY 01 · STOP 03','先在两座门廊之间站一下——当然，要留意来车。1417 年的兀鲁伯经学院更讲秩序；17 世纪中叶的阿卜杜拉齐兹汗经学院明显更繁丽。后来的赞助人没有拆掉前人的作品，而是把自己的答案放到对面。一边像写得很干净的论文，另一边坚持给每一页都加插图。'],
  bukhara_kalyan:['PO-I-KALYAN · 波伊卡扬建筑群','DAY 01 · STOP 04','现在可以抬头了。12 世纪的卡扬宣礼塔与更晚的清真寺、米尔阿拉伯经学院没有整齐排队，却共同组成布哈拉最醒目的天际线。商队远远看见高塔，知道布哈拉到了。至于我，通常先确认附近有没有阴凉和水——地标与鸭，各有各的导航方法。'],
  bukhara_ark:['ARK OF BUKHARA · 布哈拉阿尔克城堡','DAY 02 · STOP 05','城堡为什么要站得这么高？因为权力喜欢被看见，也喜欢先看见别人。阿尔克不是单纯的堡垒，而是一座城中之城：统治者在这里居住、接见、审判并管理财政。丝绸之路从来不只有浪漫远行；每支商队背后，都跟着关卡、文书和一位对税率很有想法的人。'],
  bukhara_ayub:['CHASHMA-AYUB · 查什马阿尤布陵墓','DAY 02 · STOP 06','先听水声。传说先知约伯经过这里，用手杖击地，泉水随即涌出。我们无法把传说写进水文报告，但它准确说出了绿洲居民最现实的愿望：水要出现，而且最好不要消失。建筑后来多次增修，所以别强迫每个穹顶都属于同一年；城市没有义务替我们整理时间线。'],
  bukhara_samanid:['SAMANID MAUSOLEUM · 萨曼王陵','DAY 02 · STOP 07','这次别找釉砖，这里最会表演的是普通烧砖。陵墓建于 9 世纪末至 10 世纪初，砖块横放、竖放、斜放，墙面便像织物一样起伏；太阳每移动一点，图案就换一种说法。建筑很小，野心不小。好作品偶尔就是这样，不需要先通知你它有多重要。'],
  bukhara_magoki:['MAGOKI ATTORI · 马戈基阿塔里清真寺','NEARBY LANDMARK','先看看它为什么比街面低。不是建筑沉下去了，是城市一层层长高了。它与旧市场、香料商和多重宗教记忆相连，最适合说明布哈拉如何把新信仰盖进旧城市，而不是把过去擦得干干净净。'],
  bukhara_bolo:['BOLO HAUZ · 博洛哈乌兹清真寺','NEARBY LANDMARK','木柱已经够好看，水里的倒影还要再来一遍。人们因此把二十根柱子看成“四十根”。这不是数学错误，是建筑借水面给自己加了一排座位。'],
  bukhara_chor:['CHOR MINOR · 楚尔小宣礼塔','NEARBY LANDMARK','四座小塔让它看起来像刚从故事书里走出来的门楼。它属于较晚的布哈拉，也与商人赞助宗教教育有关。可爱是真的，古到开天辟地则没有。'],
  ark_high_ground:['LOOK UP · 抬头看','THE HIGH CITADEL · 夯土高台','高台既是防御，也是声明。站在这里，统治者能俯瞰城市；站在下面，城市也很难忘记统治者在哪里。先看看墙面向上收拢的坡度——权力在这里不需要写成标语，建筑已经替它说完了。'],
  ark_gate_legend:['LOCAL LEGEND · 地方传说','A BULL HIDE AND A CITY · 一张牛皮与一座城','地方传说说，英雄西亚武什只获准在一张牛皮大小的土地上建城，于是他把牛皮裁成细条，围出了更大的范围。它不能当作城堡营建记录，却说明文字游戏若运用得当，偶尔真的能换来一座城堡。'],
  ark_court:['POWER AT WORK · 权力如何工作','PALACE, LEDGER & PRISON · 宫殿、账本与监狱','宫殿、行政办公室、金库和监狱被放在同一处，不是巧合。市集里流动的钱与消息，最后总有一部分走进这道门。权力最擅长的事，就是把仪式、账目和惩罚安排在很短的步行距离内。'],
  buk_hauz_water:['LOOK AT THE WATER · 看水面','THE CITY IN REFLECTION · 倒影里的城市','看看倒影。水把几座年代不同的建筑临时放在同一个平面上。布哈拉的城市空间常围绕水组织；这座幸存的水池，也让我们仍能看见那套生活方式。'],
  buk_hauz_portal:['LOOK UP · 抬头看','BIRDS ON THE PORTAL · 门廊上的鸟','门上的鸟很难装作没看见。它提醒我们：伊斯兰世界的装饰并非只有几何纹样，不同地区、赞助人和时代，会给规则留下很有性格的例外。'],
  buk_hauz_nasreddin:['LOCAL CHARACTER · 城市人物','NASREDDIN AND HIS DONKEY · 纳斯列丁与驴','这位先生擅长用一句听起来不太正经的话，把一本正经的人绕进去。至于这头驴，它大概是广场上最稳定的哲学立场。'],
  buk_domes_oculus:['ARCHITECTURE AT WORK · 建筑如何工作','LIGHT, AIR & SHADE · 光、风与阴凉','这个空间不是为了壮观才盖成穹顶。高处聚集热空气，交叉通道带来气流，厚砖墙则帮人躲开中亚午后的太阳。建筑先解决身体问题，然后才谈美。'],
  buk_domes_coins:['MARKET LOGIC · 市场逻辑','COINS & SCALES · 钱币与秤','一枚钱币来自哪里、含多少银、能换多少布，都是旅行者的现实问题。路线可以画在地图上，贸易却要落在秤盘上。'],
  buk_domes_textiles:['GOODS ON THE MOVE · 流动的货物','TEXTILES & HATS · 布匹与帽商','商品会说出人的来路。布料、头饰、金属工艺和染色方法沿商路移动，有时比使节更早抵达下一座城。'],
  buk_madrasas_ulugh:['ULUGH BEG MADRASA · 兀鲁伯经学院','ORDER & KNOWLEDGE · 秩序与知识','兀鲁伯不只在撒马尔罕仰望星空。他也用经学院把知识制度铺向别的城市。对他来说，统治一片土地和安排一套课程，并不是完全分开的事情。'],
  buk_madrasas_abdulaziz:['ABDULAZIZ KHAN MADRASA · 阿卜杜拉齐兹汗经学院','A WEALTH OF ORNAMENT · 不肯留白的装饰','请靠近一点。釉砖、彩绘和更复杂的花卉纹样，让这座建筑显得几乎不愿留下空白。它并非“比旧建筑更高级”，只是更愿意把财富说出来。'],
  buk_madrasas_between:['BETWEEN TWO CENTURIES · 两个世纪之间','THE STREET AS A DIALOGUE · 街道也是对话','真正有意思的景点，也许是这段街道。它让两个时代彼此可见：学生进门以前，先经过一场无声的比较。'],
  buk_kalyan_brick:['LOOK CLOSER · 靠近看','BRICK AS ORNAMENT · 砖纹','没有大面积彩釉，砖块本身就靠排列、凸凹和阴影组成一圈圈纹样。太阳移动时，塔的表面也跟着改变。它很高，但并不只靠高度取胜。'],
  buk_kalyan_top:['LOCAL LEGEND · 地方传说','THE TOWER THAT MADE A CONQUEROR BOW · 让征服者低头的塔','传说成吉思汗仰望高塔时帽子落地，他弯腰拾起，像是向塔低头，于是下令保留它。故事无法当作确证，却说明布哈拉人多么需要相信：有些建筑连征服者也会尊重。'],
  buk_kalyan_complex:['A WORKING COMPLEX · 一组运作的空间','MOSQUE & MADRASA · 清真寺与经学院','一侧容纳集体礼拜，一侧安排学习与居住。布哈拉的宗教中心不是一座孤立建筑，而是一套让信仰、教育和城市秩序彼此相连的空间。'],
  buk_ayub_spring:['SACRED WATER · 圣泉','JOB’S SPRING · 约伯之泉','宗教传说中，约伯以手杖唤出泉水。故事把圣人的奇迹与绿洲生活最基本的需求连在了一起，因此比单纯的年代更容易被记住。'],
  buk_ayub_dome:['LOOK UP · 抬头看','THE CONICAL DOME · 锥形穹顶','它和布哈拉常见的圆形蓝顶不同。造型差异提示这座建筑经过多个时期的营建，也保留了更复杂的地方传统。'],
  buk_ayub_channel:['FOLLOW THE WATER · 跟着水走','FROM MIRACLE TO DAILY LIFE · 从奇迹到日常','泉水必须被储存、分配和保护，才能从奇迹变成日常生活。水真正珍贵的地方，是它最后能抵达每条需要它的街巷。'],
  buk_samanid_brick:['LOOK CLOSER · 靠近看','WOVEN BRICK · 编织状砖纹','砖既是结构，也是装饰。工匠没有把墙盖好以后再“加花纹”，而是让砌墙这件事本身变成花纹。'],
  buk_samanid_transition:['GEOMETRY AT WORK · 几何如何工作','FROM SQUARE TO DOME · 方形到穹顶','抬头看墙角。方形空间要托住圆形穹顶，需要一套精巧的过渡。几何在这里不是课本内容，而是会不会塌下来的现实问题。'],
  buk_samanid_light:['WATCH THE SHADOWS · 看影子','SUNLIGHT AS DECORATION · 日光也是装饰','早晨、正午和傍晚的砖墙看起来并不相同。你看到的“装饰”有一部分其实是太阳完成的——它没有署名，工作时间倒很稳定。']
});

const sourceNotes = {
  registan: ['文献依据：三座经学院分阶段建成，兀鲁伯经学院最早。','UNESCO · Samarkand Nomination Dossier, pp. 65–66','https://whc.unesco.org/uploads/nominations/603rev.pdf'],
  gur: ['文献依据：陵墓的委建对象、肋拱穹顶、纪念石棺与地下墓室。','Leiden University · Iran Turan','https://iranturan.leiden.edu/cities/samarqand-2/the-gur-i-amir-mausoleum-late-14th-early-15th-century/'],
  bibi: ['文献依据：1399 年印度远征后的委建背景与建筑的政治雄心。','Manazir Journal · Elena Paskaleva (2023)','https://doi.org/10.36950/manazir.2023.5.4'],
  siyob: ['文献依据：比比哈努姆清真寺与雷吉斯坦之间的市集主街。','Encyclopaedia Iranica · Samarqand: History and Archaeology','https://www.iranicaonline.org/articles/samarqand-i/'],
  shah: ['文献依据：朝圣传统、建筑分期与陵墓长廊的装饰技法。','Leiden University · Iran Turan','https://iranturan.leiden.edu/cities/samarqand-2/the-shah-i-zinda-necropolis-12th-15th-century/'],
  afrasiab: ['文献依据：1965 年意外发现的七世纪粟特壁画及其学术争议。','Encyclopaedia Iranica · Afrasiab Wall Paintings','https://www.iranicaonline.org/articles/afrasiab-ii-wall-paintings-2/'],
  observatory: ['文献依据：约 40 米半径的固定观测仪器与《兀鲁伯星表》。','UNESCO–IAU · Portal to the Heritage of Astronomy','https://web.astronomicalheritage.net/index.php/show-entity?identity=000030&idsubentity=001'],
  rukhabad: ['文献依据：陵墓用途、中央平面、砖结构与无门廊的克制形制。','UNESCO · Samarkand Nomination Dossier, pp. 65–66','https://whc.unesco.org/uploads/nominations/603rev.pdf'],
  chorsu: ['文献依据：Čahār Suq 的十字路口属性及其与雷吉斯坦前身的关系。','Encyclopaedia Iranica · Samarqand: History and Archaeology','https://www.iranicaonline.org/articles/samarqand-i/'],
  khizr: [
    ['文献依据：Getty 建筑档案将现存清真寺主体定年为 1854 年。','Getty CONA · Hazrat-i Khizr Mosque','https://www.getty.edu/cona/CONAFullSubject.aspx?subid=700039167'],
    ['图像档案依据：十九世纪末由此处远眺比比哈努姆清真寺。','Getty Research Institute · Arshaulov Album Finding Aid','https://www.getty.edu/research/collections/static/pdf/2022.R.10.pdf']
  ],
  courtyard_tiles: ['资料摘要：雷吉斯坦广场对中亚伊斯兰建筑的发展具有重要影响。','联合国教科文组织世界遗产中心','https://whc.unesco.org/en/list/603'],
  doorway: ['资料摘要：撒马尔罕在帖木儿时期迎来最显著的发展。','联合国教科文组织城市遗产地图集','https://whc.unesco.org/en/urban-heritage-atlas/samarkand/'],
  afrasiab_discovery: ['导读摘要：发现与破坏几乎同时发生，保护工作因而格外紧迫。','豆瓣高赞书评《重逢》','https://book.douban.com/review/15282840/'],
  afrasiab_ambassadors: ['导读摘要：四壁可被读作七世纪撒马尔罕理解世界的一幅横截面。','豆瓣高赞书评《重逢》','https://book.douban.com/review/15282840/'],
  afrasiab_north: ['导读摘要：北壁的帝后身份与节庆解释仍属于学术推测。','豆瓣书评《阿夫拉西阿卜壁画》','https://book.douban.com/review/15284752/'],
  afrasiab_method: ['导读摘要：释读依靠跨文献与图像比较，也必须保留不确定性。','豆瓣书评《阿夫拉西阿卜壁画》','https://book.douban.com/review/15284752/']
  ,afrasiab_room: ['导读摘要：约 11 平方米的房间可能是高等级的私密空间。','豆瓣书评《方寸见天下，碎隙窥古今》','https://book.douban.com/review/15310776/']
  ,afrasiab_south: ['导读摘要：空鞍马与白鸟让南壁的祭祀含义成为重要线索。','豆瓣书评《阿夫拉西阿卜壁画》','https://book.douban.com/review/15284752/']
  ,afrasiab_animals: ['导读摘要：马、犬与水禽分别提示祭祀、阶层、狩猎与水上场景。','豆瓣书评《小小动物在阿夫拉西阿卜壁画中》','https://book.douban.com/review/15332106/']
  ,sogdian_world: ['导读摘要：四壁把狩猎、节庆、祭祀与使节组织成跨文化世界图景。','豆瓣书评《考古学艺术史的丝路文化》','https://book.douban.com/review/15340129/']
  ,sogdian_trade: ['导读摘要：农业基础与跨帝国商业共同支撑粟特网络。','豆瓣书评《粟特人的荣光》','https://book.douban.com/review/16333656/']
  ,mural_materials: ['导读摘要：矿物颜料和脆弱墙体让保存成为壁画故事的一部分。','豆瓣书评《壁画中的粟特》','https://book.douban.com/review/15530318/']
  ,gur_anecdote: ['内容标签：当地传说；时间巧合不能作为因果证据。','Sidetalk 文稿 · RFE/RL','https://www.rferl.org/a/1342158.html']
  ,registan_tiger: ['内容标签：史实与图像解读。','Sidetalk 文稿 · Archnet','https://www.archnet.org/sites/2146?media_content_id=1430']
  ,ulugh_teacher: ['内容标签：历史记载与传统叙述。','Sidetalk 文稿 · TDV 伊斯兰百科','https://islamansiklopedisi.org.tr/ulug-bey-medresesi']
  ,bibi_kiss: ['内容标签：当地传说；非可靠建造记录。','Sidetalk 文稿 · 伊朗百科','https://www.iranicaonline.org/articles/bibi-khanom-mosque-named-after-bibi-khanom-otherwise-known-as-saray-molk-khanom-chief-wife-of-timur-r/']
  ,siyob_bread: ['内容标签：当地传说与城市食物身份。','Sidetalk 文稿 · Uzbekistan Travel','https://uzbekistan.travel/en/i/samarkand/']
  ,shah_legend: ['内容标签：宗教传说；不作为考古定论。','Sidetalk 文稿 · UNESCO','https://whc.unesco.org/en/list/603']
  ,observatory_story: ['内容标签：天文台重新发现为史实。','Sidetalk 文稿 · 伊朗百科','https://www.iranicaonline.org/articles/samarqand-i/']
};

Object.assign(sourceNotes,{
  bukhara_hauz:['文献依据：水池与周边建筑共同构成布哈拉重要公共空间。','UNESCO · Historic Centre of Bukhara','https://whc.unesco.org/en/list/602'],
  bukhara_domes:['文献依据：古城商业穹顶体现布哈拉的市场组织与商贸功能。','UNESCO · Historic Centre of Bukhara','https://whc.unesco.org/en/list/602'],
  bukhara_madrasas:['文献依据：兀鲁伯经学院与阿卜杜拉齐兹汗经学院的年代和建筑关系。','Archnet · Abdulaziz Khan Madrasa','https://www.archnet.org/sites/2105'],
  bukhara_kalyan:['文献依据：12 世纪宣礼塔与后世宗教建筑共同塑造城市天际线。','UNESCO · Historic Centre of Bukhara','https://whc.unesco.org/en/list/602'],
  bukhara_ark:['文献依据：阿尔克高台城堡的行政、宫廷与防御功能。','Encyclopaedia Iranica · Bukhara v','https://www.iranicaonline.org/articles/bukhara-v/'],
  bukhara_ayub:['文献依据：约伯之泉的宗教传统及建筑多期营建。','UNESCO · Historic Centre of Bukhara','https://whc.unesco.org/en/list/602'],
  bukhara_samanid:['文献依据：萨曼王陵的年代、砖构与早期伊斯兰建筑价值。','Smarthistory · The Samanid Mausoleum','https://smarthistory.org/samanid-mausoleum-bukhara-uzbekistan/'],
  bukhara_magoki:['文献依据：马戈基阿塔里与古城层积及旧市场的关系。','UNESCO · Historic Centre of Bukhara','https://whc.unesco.org/en/list/602'],
  bukhara_bolo:['图像与遗产依据：博洛哈乌兹木柱廊及水池环境。','UNESCO · Historic Centre of Bukhara Gallery','https://whc.unesco.org/en/list/602/gallery/'],
  bukhara_chor:['图像与遗产依据：楚尔小宣礼塔属于布哈拉保存的较晚建筑。','UNESCO · Historic Centre of Bukhara Gallery','https://whc.unesco.org/en/list/602/gallery/'],
  ark_high_ground:['文献依据：高台、城墙与城堡作为城市权力中心的考古描述。','Encyclopaedia Iranica · Bukhara v','https://www.iranicaonline.org/articles/bukhara-v/'],
  ark_gate_legend:['内容标签：地方传说，不作为城堡营建史实。','Uzbekistan Travel · Legend of the Ark Fortress','https://uzbekistan.travel/en/o/the-legend-of-the-construction-of-the-ark-fortress/'],
  ark_court:['文献依据：阿尔克曾集中宫廷、行政、财政与监禁功能。','Encyclopaedia Iranica · Bukhara v','https://www.iranicaonline.org/articles/bukhara-v/'],
  buk_hauz_water:['文献依据：拉比哈乌兹水池与周边建筑共同构成城市公共空间。','UNESCO · Historic Centre of Bukhara','https://whc.unesco.org/en/list/602'],
  buk_hauz_portal:['建筑资料：纳迪尔·迪万别吉经学院门廊的动物图像与装饰。','Uzbekistan Travel · Lyabi-Hauz Ensemble','https://app.uzbekistan.travel/en/o/lyabi-hauz-ensemble/'],
  buk_hauz_nasreddin:['内容标签：城市民间人物与后世纪念形象。','Uzbekistan Travel · Lyabi-Hauz Ensemble','https://app.uzbekistan.travel/en/o/lyabi-hauz-ensemble/'],
  buk_domes_oculus:['文献依据：商业穹顶为布哈拉市场组织与环境调节的一部分。','UNESCO · Historic Centre of Bukhara','https://whc.unesco.org/en/list/602'],
  buk_domes_coins:['文献依据：古城商业穹顶服务于钱币兑换与专业市场。','Uzbekistan Travel · Bukhara','https://uzbekistan.travel/en/i/bukhara/'],
  buk_domes_textiles:['文献依据：布哈拉商业空间连接纺织品、帽饰与手工业交易。','Uzbekistan Travel · Bukhara','https://uzbekistan.travel/en/i/bukhara/'],
  buk_madrasas_ulugh:['建筑档案：布哈拉兀鲁伯经学院的年代与教育功能。','MIT Aga Khan Visual Archive · Madrasa of Ulugh Beg','https://dome.mit.edu/handle/1721.3/172628'],
  buk_madrasas_abdulaziz:['建筑档案：阿卜杜拉齐兹汗经学院的年代与装饰特征。','Archnet · Abdulaziz Khan Madrasa','https://www.archnet.org/sites/2105'],
  buk_madrasas_between:['文献依据：两座不同时代经学院面对面的城市关系。','UNESCO · Historic Centre of Bukhara','https://whc.unesco.org/en/list/602'],
  buk_kalyan_brick:['文献依据：卡扬宣礼塔的砖构、年代与城市地标价值。','UNESCO · Historic Centre of Bukhara','https://whc.unesco.org/en/list/602'],
  buk_kalyan_top:['内容标签：地方传说，不作为蒙古征服史实。','Uzbekistan Travel · Minorai Kalon','https://uzbekistan.travel/en/o/minaret-minorai-kalon-bukhara/'],
  buk_kalyan_complex:['文献依据：宣礼塔、清真寺与经学院共同组成宗教教育中心。','UNESCO · Historic Centre of Bukhara','https://whc.unesco.org/en/list/602'],
  buk_ayub_spring:['内容标签：约伯之泉的宗教传说与绿洲水源记忆。','Bukhara State Museum-Reserve · Chashma-Ayub','https://www.bukharamuseums.uz/uz/katalog/item/chashma-ayub'],
  buk_ayub_dome:['文献依据：建筑经过多个时期营建并保留独特锥形穹顶。','UNESCO · Historic Centre of Bukhara','https://whc.unesco.org/en/list/602'],
  buk_ayub_channel:['文献依据：圣泉与布哈拉城市水文化的联系。','Bukhara State Museum-Reserve · Chashma-Ayub','https://www.bukharamuseums.uz/uz/katalog/item/chashma-ayub'],
  buk_samanid_brick:['建筑史依据：砖砌结构与装饰合一的早期伊斯兰建筑。','Smarthistory · The Samanid Mausoleum','https://smarthistory.org/samanid-mausoleum-bukhara-uzbekistan/'],
  buk_samanid_transition:['建筑史依据：方形主体、穹顶与转角过渡的几何结构。','Encyclopaedia Iranica · Bukhara v','https://www.iranicaonline.org/articles/bukhara-v/'],
  buk_samanid_light:['建筑史依据：砖纹通过凸凹与日照形成持续变化的表面。','Smarthistory · The Samanid Mausoleum','https://smarthistory.org/samanid-mausoleum-bukhara-uzbekistan/']
});
const scenes = {
  plaza: {src:'assets/samarkand-pixel-scene.webp',alt:'夕阳下的撒马尔罕雷吉斯坦广场像素游戏场景',step:'SCENE 01 · REGISTAN SQUARE',title:'REGISTAN',subtitle:'雷吉斯坦广场',hotspots:[['registan','REGISTAN · 雷吉斯坦',43,28,17,34],['registan_tiger','TIGERS & HUMAN SUN · 人面太阳',66,25,15,25],['merchant','MERCHANT · 商人',7,64,10,20],['camel','CARAVAN · 商队',22,58,15,19],['tile','BLUE TILE · 蓝色釉砖',80,45,11,22]],moves:{left:['bazaar','BAZAAR'],forward:['courtyard','COURTYARD'],right:['study','EAST WING'],back:['map','CITY MAP']}},
  courtyard: {src:'assets/samarkand-courtyard.webp',alt:'雷吉斯坦经学院内院像素游戏场景',step:'SCENE 02 · MADRASA COURTYARD',title:'REGISTAN',subtitle:'经学院内院',hotspots:[['courtyard_tiles','TILED IWAN',37,12,26,48],['fountain','SHADE & WATER',27,55,14,22],['doorway','ENTER',47,48,10,25]],moves:{left:['bazaar','BAZAAR'],forward:['study','STUDY ROOM'],right:['study','EAST WING'],back:['plaza','SQUARE']}},
  study: {src:'assets/samarkand-madrasa-interior.webp',alt:'撒马尔罕经学院学习室像素游戏场景',step:'SCENE 03 · STUDY CHAMBER',title:'HOUSE OF KNOWLEDGE',subtitle:'经学院学习室',hotspots:[['astrolabe','ASTROLABE',72,36,15,38],['manuscripts','MANUSCRIPTS',43,58,23,22],['niche','PAINTED NICHE',49,8,22,37],['ulugh_teacher','KING & TEACHER · 国王讲学',14,34,17,30]],moves:{left:['courtyard','COURTYARD'],forward:[null,'—'],right:['plaza','SQUARE'],back:['courtyard','COURTYARD']}},
  bazaar: {src:'assets/samarkand-bazaar.webp',alt:'锡亚布市场巷道像素游戏场景',step:'SCENE 04 · SIYOB BAZAAR',title:'SIYOB BAZAAR',subtitle:'锡亚布市场',hotspots:[['ceramics','CERAMICS · 陶器',2,40,17,44],['spices','SPICES · 香料',28,45,16,28],['siyob_bread','SAMARKAND NON · 撒马尔罕馕',49,58,19,25],['cat','BAZAAR CAT · 市场猫',78,70,10,18]],moves:{left:[null,'—'],forward:['bibi','BIBI-KHANYM'],right:['plaza','REGISTAN'],back:['map','CITY MAP']}},
  gur: {src:'assets/gur-e-amir-panorama.webp',alt:'古尔·埃米尔陵墓庭院与蓝色穹顶像素全景游戏场景',step:'SCENE 05 · GUR-E-AMIR',title:'GUR-E-AMIR',subtitle:'古尔·埃米尔陵墓',hotspots:[['gur_dome','RIBBED DOME · 肋拱穹顶',39,7,22,30],['gur_tombs','DYNASTIC TOMBS · 王朝陵墓',34,60,31,23],['gur_anecdote','ANECDOTE · 逸闻',8,57,17,27]],moves:{left:[null,'—'],forward:['plaza','REGISTAN'],right:['plaza','REGISTAN'],back:['map','CITY MAP']}},
  bibi: {src:'assets/bibi-khanym-scene.webp',alt:'比比哈努姆清真寺宏大庭院与古兰经架像素游戏场景',step:'SCENE 06 · BIBI-KHANYM',title:'BIBI-KHANYM MOSQUE',subtitle:'比比哈努姆清真寺',hotspots:[['bibi_portal','IMPERIAL PORTAL · 帝国门廊',35,6,31,52],['bibi_stand','QURAN STAND · 古兰经架',42,58,18,29],['bibi_scale','LOOK UP · 抬头看',7,27,17,33],['bibi_kiss','LOCAL LEGEND · 王后之吻',75,29,16,27]],moves:{left:['plaza','REGISTAN'],forward:['bazaar','SIYOB BAZAAR'],right:['shah','SHAH-I-ZINDA'],back:['map','CITY MAP']}},
  shah: {src:'assets/shah-i-zinda-scene.webp',alt:'沙赫静达陵墓群蓝色长廊像素游戏场景',step:'SCENE 07 · SHAH-I-ZINDA',title:'SHAH-I-ZINDA',subtitle:'沙赫静达陵墓群',hotspots:[['shah_lane','MAUSOLEUM LANE · 陵墓街',39,18,24,65],['shah_tiles','BLUE TILE · 蓝色釉砖',5,15,21,55],['shah_legend','LIVING KING · 永生之王',74,18,20,48]],moves:{left:['bibi','BIBI-KHANYM'],forward:['afrasiab','AFRASIAB'],right:[null,'—'],back:['map','CITY MAP']}},
  afrasiab: {src:'assets/afrasiab-scene.webp',alt:'阿弗拉西亚卜遗址发掘与粟特壁画像素游戏场景',step:'SCENE 08 · AFRASIAB',title:'AFRASIAB',subtitle:'阿弗拉西亚卜遗址',hotspots:[['afrasiab_discovery','1965 DISCOVERY · 1965 年发现',31,57,25,31],['afrasiab_ambassadors','AMBASSADORS · 万国使节',0,24,20,38],['afrasiab_south','PROCESSION · 南壁队伍',19,24,17,38],['afrasiab_north','CHINA IMAGINED · 想象中的中国',66,25,19,34],['afrasiab_method','HOW DO WE KNOW? · 如何解读',52,57,17,29],['afrasiab_room','PRIVATE ROOM? · 私密空间？',49,24,15,24],['afrasiab_animals','ANIMAL CLUES · 动物线索',82,66,13,20],['sogdian_world','WORLDVIEW · 世界观',77,4,17,16],['sogdian_trade','TRADE NETWORK · 商业网络',62,7,14,15],['mural_materials','PIGMENTS · 壁画颜料',3,68,14,18]],moves:{left:['shah','SHAH-I-ZINDA'],forward:['observatory','OBSERVATORY'],right:['observatory','OBSERVATORY'],back:['map','CITY MAP']}},
  observatory: {src:'assets/ulugh-beg-observatory-scene.webp',alt:'星空下的兀鲁伯天文台与巨型子午仪像素游戏场景',step:'SCENE 09 · ULUGH BEG OBSERVATORY',title:'ULUGH BEG OBSERVATORY',subtitle:'兀鲁伯天文台',hotspots:[['observatory_sextant','MERIDIAN ARC · 子午仪',31,31,41,36],['observatory_catalogue','STAR CATALOGUE · 星表',7,60,28,28],['observatory_story','RULER & ASTRONOMER · 君主与天文学家',72,54,23,35]],moves:{left:['afrasiab','AFRASIAB'],forward:[null,'—'],right:[null,'—'],back:['map','CITY MAP']}}
};
scenes.bukhara_ark={src:'assets/bukhara-ark-scene.webp',alt:'夕阳下的布哈拉阿尔克城堡像素游戏场景，城门、高墙、文书与商旅分布在前庭',step:'SCENE 10 · ARK OF BUKHARA',title:'ARK OF BUKHARA',subtitle:'阿尔克城堡',city:'bukhara',entryStory:'bukhara_ark',hotspots:[['ark_high_ground','HIGH CITADEL · 夯土高台',0,4,36,58],['ark_gate_legend','GATE LEGEND · 城门传说',31,8,25,55],['ark_court','PALACE & LEDGER · 宫廷与账本',5,67,27,27]],moves:{right:['map','PO-I-KALYAN'],back:['map','BOLO HAUZ']}};
Object.assign(scenes,{
  bukhara_hauz:{src:'assets/bukhara-lyabi-hauz-scene.webp',alt:'夕阳下的布哈拉拉比哈乌兹水池、经学院门廊与纳斯列丁骑驴像素场景',title:'LYABI-HAUZ ENSEMBLE',subtitle:'拉比哈乌兹建筑群',city:'bukhara',day:1,entryStory:'bukhara_hauz',hotspots:[['buk_hauz_water','WATER & REFLECTION · 水面与倒影',27,48,42,29],['buk_hauz_portal','BIRD MOSAICS · 门廊上的鸟',60,7,24,45],['buk_hauz_nasreddin','NASREDDIN · 纳斯列丁骑驴',72,56,22,35]]},
  bukhara_domes:{src:'assets/bukhara-trading-domes-scene.webp',alt:'布哈拉穹顶市场内的钱币兑换、秤、布匹与帽商像素场景',title:'TRADING DOMES OF BUKHARA',subtitle:'布哈拉穹顶市场',city:'bukhara',day:1,entryStory:'bukhara_domes',hotspots:[['buk_domes_oculus','OCULUS & AIR · 穹顶开口',43,0,25,30],['buk_domes_coins','COINS & SCALES · 钱币与秤',8,45,28,38],['buk_domes_textiles','TEXTILES & HATS · 布匹与帽商',68,35,30,50]]},
  bukhara_madrasas:{src:'assets/bukhara-kosh-madrasas-scene.webp',alt:'隔街相望的兀鲁伯经学院与阿卜杜拉齐兹汗经学院像素场景',title:'KOSH MADRASAS',subtitle:'兀鲁伯—阿卜杜拉齐兹汗经学院',city:'bukhara',day:1,entryStory:'bukhara_madrasas',hotspots:[['buk_madrasas_ulugh','ULUGH BEG MADRASA · 兀鲁伯经学院',3,12,35,58],['buk_madrasas_abdulaziz','ABDULAZIZ KHAN · 阿卜杜拉齐兹汗经学院',60,9,38,61],['buk_madrasas_between','BETWEEN TWO ERAS · 两院之间',38,50,22,35]]},
  bukhara_kalyan:{src:'assets/bukhara-poi-kalyan-scene.webp',alt:'卡扬宣礼塔、清真寺与米尔阿拉伯经学院构成的布哈拉像素场景',title:'PO-I-KALYAN COMPLEX',subtitle:'波伊卡扬建筑群',city:'bukhara',day:1,entryStory:'bukhara_kalyan',hotspots:[['buk_kalyan_brick','BRICK PATTERNS · 宣礼塔砖纹',50,20,17,48],['buk_kalyan_top','TOWER TOP · 塔顶传说',51,1,16,22],['buk_kalyan_complex','MOSQUE & MADRASA · 清真寺与经学院',70,30,28,45]]},
  bukhara_ayub:{src:'assets/bukhara-chashma-ayub-scene.webp',alt:'查什马阿尤布陵墓、锥形穹顶、泉水与水渠像素场景',title:'CHASHMA-AYUB MAUSOLEUM',subtitle:'查什马阿尤布陵墓',city:'bukhara',day:2,entryStory:'bukhara_ayub',hotspots:[['buk_ayub_spring','JOB’S SPRING · 约伯之泉',1,62,31,33],['buk_ayub_dome','CONICAL DOME · 锥形穹顶',50,3,22,43],['buk_ayub_channel','FOLLOW THE WATER · 水的去向',65,65,33,29]]},
  bukhara_samanid:{src:'assets/bukhara-samanid-mausoleum-scene.webp',alt:'夕阳照亮编织状砖纹的布哈拉萨曼王陵像素场景',title:'SAMANID MAUSOLEUM',subtitle:'萨曼王陵',city:'bukhara',day:2,entryStory:'bukhara_samanid',hotspots:[['buk_samanid_brick','WOVEN BRICK · 编织状砖纹',40,35,37,36],['buk_samanid_transition','SQUARE TO DOME · 方形到穹顶',40,12,36,27],['buk_samanid_light','MOVING LIGHT · 移动的日光',65,42,23,31]]}
});
const sceneDirections = {
  plaza:{west:['gur','古尔·埃米尔陵墓'],north:['bibi','比比哈努姆清真寺'],east:['bazaar','锡亚布市场']},
  courtyard:{west:['bazaar','锡亚布市场'],north:['study','学习室'],south:['plaza','雷吉斯坦广场']},
  study:{south:['courtyard','经学院庭院']},
  bazaar:{west:['plaza','雷吉斯坦广场'],north:['afrasiab','阿弗拉西亚卜遗址'],east:['shah','沙赫静达陵墓群'],south:['bibi','比比哈努姆清真寺']},
  gur:{east:['plaza','雷吉斯坦广场']},
  bibi:{west:['plaza','雷吉斯坦广场'],north:['bazaar','锡亚布市场'],east:['shah','沙赫静达陵墓群']},
  shah:{west:['bazaar','锡亚布市场'],north:['afrasiab','阿弗拉西亚卜遗址'],south:['bibi','比比哈努姆清真寺']},
  afrasiab:{east:['observatory','兀鲁伯天文台'],south:['shah','沙赫静达陵墓群']},
  observatory:{west:['afrasiab','阿弗拉西亚卜遗址'],south:['shah','沙赫静达陵墓群']}
};
Object.assign(sceneDirections,{
  bukhara_hauz:{west:['map','城市地图'],east:['bukhara_domes','布哈拉穹顶市场']},
  bukhara_domes:{west:['bukhara_hauz','拉比哈乌兹建筑群'],north:['bukhara_madrasas','双经学院'],south:['map','城市地图']},
  bukhara_madrasas:{north:['bukhara_kalyan','波伊卡扬建筑群'],south:['bukhara_domes','布哈拉穹顶市场']},
  bukhara_kalyan:{west:['bukhara_ark','阿尔克城堡'],south:['bukhara_madrasas','双经学院'],east:['map','城市地图']},
  bukhara_ark:{north:['bukhara_ayub','查什马阿尤布陵墓'],east:['bukhara_kalyan','波伊卡扬建筑群'],south:['map','城市地图']},
  bukhara_ayub:{east:['bukhara_samanid','萨曼王陵'],south:['bukhara_ark','阿尔克城堡'],west:['map','城市地图']},
  bukhara_samanid:{west:['bukhara_ayub','查什马阿尤布陵墓'],south:['bukhara_ark','阿尔克城堡'],east:['map','城市地图']}
});
const directionNames = {west:'向西',north:'向北',east:'向东',south:'向南'};
const hotspotKinds = {merchant:'person',ulugh_teacher:'person',gur_anecdote:'person',camel:'animal',cat:'animal',afrasiab_animals:'animal',fountain:'plant',ark_court:'person',buk_hauz_nasreddin:'animal',buk_domes_coins:'person',buk_domes_textiles:'person',buk_madrasas_between:'person',buk_ayub_spring:'plant',buk_ayub_channel:'plant'};
const panoramaPositions = {west:'26vw',north:'0px',east:'-26vw',south:'13vw'};
const landmarkSoundZh={gur:'低音都塔尔 · 庭院风声',registan:'都塔尔 · 框鼓',bibi:'奈伊笛 · 远处诵经声',siyob:'市场叫卖 · 达伊拉鼓 · 唆呐伊',shah:'脚步 · 远处诵经声',afrasiab:'沙漠风声 · 弹拨弦乐',observatory:'夜铃 · 高处风声',rukhabad:'轻柔都塔尔 · 花园风声',chorsu:'手鼓 · 街巷人声',khizr:'奈伊笛 · 山坡风声',bukhara_hauz:'流水 · 茶碗 · 轻柔都塔尔',bukhara_domes:'市场人声 · 秤盘 · 达伊拉鼓',bukhara_madrasas:'书页 · 低音都塔尔',bukhara_kalyan:'奈伊笛 · 高塔风声',bukhara_ark:'城门脚步 · 低音鼓',bukhara_ayub:'泉水 · 轻风',bukhara_samanid:'园林风声 · 轻柔弹拨',bukhara_magoki:'街巷回声',bukhara_bolo:'水声 · 木廊风声',bukhara_chor:'铃声 · 小巷人声'};

const soundscapes={map:['城市地图','caravan'],plaza:['雷吉斯坦','plaza'],courtyard:['经学院庭院','quiet'],study:['学习室','quiet'],bazaar:['锡亚布市场','bazaar'],gur:['古尔·埃米尔','memorial'],bibi:['比比哈努姆','sacred'],shah:['沙赫静达','sacred'],afrasiab:['阿弗拉西亚卜','ruins'],observatory:['兀鲁伯天文台','night'],bukhara_hauz:['拉比哈乌兹','quiet'],bukhara_domes:['穹顶市场','bazaar'],bukhara_madrasas:['双经学院','quiet'],bukhara_kalyan:['波伊卡扬','sacred'],bukhara_ark:['阿尔克城堡','memorial'],bukhara_ayub:['查什马阿尤布','quiet'],bukhara_samanid:['萨曼王陵','memorial']};
const soundscapeDetailsZh={map:'都塔尔 · 达伊拉鼓 · 商旅铃声',plaza:'都塔尔 · 框鼓',courtyard:'奈伊笛 · 流水 · 轻柔都塔尔',study:'轻柔都塔尔 · 翻页声',bazaar:'市场叫卖 · 达伊拉鼓 · 唆呐伊',gur:'低音都塔尔 · 庭院风声',bibi:'奈伊笛 · 远处诵经声',shah:'脚步 · 远处诵经声',afrasiab:'沙漠风声 · 弹拨弦乐',observatory:'夜铃 · 高处风声',bukhara_hauz:'水声 · 树叶 · 轻柔都塔尔',bukhara_domes:'市场人声 · 秤盘 · 达伊拉鼓',bukhara_madrasas:'书页 · 脚步 · 低音都塔尔',bukhara_kalyan:'高塔风声 · 奈伊笛',bukhara_ark:'低音都塔尔 · 城门脚步 · 风沙',bukhara_ayub:'泉水 · 轻风',bukhara_samanid:'园林风声 · 轻柔弹拨'};
const sceneStepsZh = {plaza:'场景 01 · 雷吉斯坦广场',courtyard:'场景 02 · 经学院庭院',study:'场景 03 · 学习室',bazaar:'场景 04 · 锡亚布市场',gur:'场景 05 · 古尔·埃米尔陵墓',bibi:'场景 06 · 比比哈努姆清真寺',shah:'场景 07 · 沙赫静达陵墓群',afrasiab:'场景 08 · 阿弗拉西亚卜遗址',observatory:'场景 09 · 兀鲁伯天文台',bukhara_hauz:'场景 10 · 拉比哈乌兹建筑群',bukhara_domes:'场景 11 · 布哈拉穹顶市场',bukhara_madrasas:'场景 12 · 双经学院',bukhara_kalyan:'场景 13 · 波伊卡扬建筑群',bukhara_ark:'场景 14 · 布哈拉阿尔克城堡',bukhara_ayub:'场景 15 · 查什马阿尤布陵墓',bukhara_samanid:'场景 16 · 萨曼王陵'};
const sceneFactsZh={plaza:[['地区','粟特'],['功能','城市中心 · 学术'],['时期','15—17 世纪']],courtyard:[['景点','雷吉斯坦广场'],['功能','经学院'],['时期','帖木儿至昔班尼时期']],study:[['景点','雷吉斯坦广场'],['功能','教学 · 手稿'],['时期','15—17 世纪']],bazaar:[['景点','锡亚布市场'],['功能','贸易 · 日常生活'],['状态','至今活跃']],gur:[['景点','古尔·埃米尔陵墓'],['功能','王朝陵墓'],['时期','15 世纪初']],bibi:[['景点','比比哈努姆清真寺'],['功能','聚礼清真寺'],['时期','约 1399—1405 年']],shah:[['景点','沙赫静达陵墓群'],['功能','朝圣 · 陵墓群'],['时期','11—19 世纪']],afrasiab:[['城市层','蒙古征服前的撒马尔罕'],['功能','城堡 · 粟特中心'],['重点','7 世纪壁画']],observatory:[['景点','兀鲁伯天文台'],['功能','天文学 · 测量'],['时期','1420 年代—1449 年']],bukhara_hauz:[['功能','水池 · 公共生活'],['重点','倒影 · 门廊 · 民间人物'],['城市','布哈拉']],bukhara_domes:[['功能','市场 · 钱币兑换'],['重点','通风 · 秤 · 纺织品'],['城市','布哈拉']],bukhara_madrasas:[['功能','教育 · 建筑对话'],['时期','1417 年 · 17 世纪中叶'],['城市','布哈拉']],bukhara_kalyan:[['功能','礼拜 · 教育 · 地标'],['重点','12 世纪宣礼塔'],['城市','布哈拉']],bukhara_ark:[['景点','阿尔克城堡'],['功能','宫廷 · 行政 · 防御'],['城市','布哈拉']],bukhara_ayub:[['功能','圣泉 · 水文化'],['重点','锥形穹顶 · 多期营建'],['城市','布哈拉']],bukhara_samanid:[['功能','王朝陵墓'],['时期','9 世纪末—10 世纪初'],['重点','砖构 · 几何 · 光影']]};
const hotspotLabelsZh={courtyard_tiles:'釉砖门廊',fountain:'树荫与水',doorway:'进入学习室',astrolabe:'星盘',manuscripts:'手稿',niche:'彩绘壁龛'};
const storyHeadingsZh={registan:['雷吉斯坦广场','15—17 世纪'],gur:['古尔·埃米尔陵墓','路线第 1 站'],bibi:['比比哈努姆清真寺','路线第 3 站'],siyob:['锡亚布市场','路线第 4 站'],shah:['沙赫静达陵墓群','路线第 5 站'],afrasiab:['阿弗拉西亚卜遗址','第 2 天 · 第 6 站'],observatory:['兀鲁伯天文台','第 2 天 · 第 7 站'],rukhabad:['鲁哈巴德陵墓','附近景点'],chorsu:['四顶穹顶建筑','附近景点'],khizr:['哈兹拉特·希兹尔清真寺','附近景点'],tile:['你找到了线索','蓝色釉砖'],merchant:['旅人说……','在找丝绸吗？'],camel:['骆驼说……','哼——'],courtyard_tiles:['靠近观察','釉砖门廊'],fountain:['庭院生活','树荫与水'],doorway:['进入经学院','学习室'],astrolabe:['知识器物','星盘'],manuscripts:['知识器物','手稿'],niche:['建筑细节','彩绘壁龛'],ceramics:['市场货品','釉陶'],spices:['市场货品','香料袋'],cat:['当地专家','市场猫'],bukhara_hauz:['拉比哈乌兹建筑群','第 1 天 · 第 1 站'],bukhara_domes:['布哈拉穹顶市场','第 1 天 · 第 2 站'],bukhara_madrasas:['兀鲁伯—阿卜杜拉齐兹汗经学院','第 1 天 · 第 3 站'],bukhara_kalyan:['波伊卡扬建筑群','第 1 天 · 第 4 站'],bukhara_ark:['布哈拉阿尔克城堡','第 2 天 · 第 5 站'],bukhara_ayub:['查什马阿尤布陵墓','第 2 天 · 第 6 站'],bukhara_samanid:['萨曼王陵','第 2 天 · 第 7 站'],bukhara_magoki:['马戈基阿塔里清真寺','附近景点'],bukhara_bolo:['博洛哈乌兹清真寺','附近景点'],bukhara_chor:['楚尔小宣礼塔','附近景点'],ark_high_ground:['靠近观察','夯土高台'],ark_gate_legend:['地方传说','一张牛皮与一座城'],ark_court:['权力如何工作','宫殿、账本与监狱']};
Object.assign(storyHeadingsZh,{
  registan:['撒马尔罕景点','雷吉斯坦广场'],gur:['撒马尔罕景点','古尔·埃米尔陵墓'],bibi:['撒马尔罕景点','比比哈努姆清真寺'],siyob:['撒马尔罕景点','锡亚布市场'],shah:['撒马尔罕景点','沙赫静达陵墓群'],afrasiab:['撒马尔罕景点','阿弗拉西亚卜遗址'],observatory:['撒马尔罕景点','兀鲁伯天文台'],rukhabad:['撒马尔罕景点','鲁哈巴德陵墓'],chorsu:['撒马尔罕景点','四顶穹顶建筑'],khizr:['撒马尔罕景点','哈兹拉特·希兹尔清真寺'],
  bukhara_hauz:['布哈拉景点','拉比哈乌兹建筑群'],bukhara_domes:['布哈拉景点','布哈拉穹顶市场'],bukhara_madrasas:['布哈拉景点','兀鲁伯—阿卜杜拉齐兹汗经学院'],bukhara_kalyan:['布哈拉景点','波伊卡扬建筑群'],bukhara_ark:['布哈拉景点','布哈拉阿尔克城堡'],bukhara_ayub:['布哈拉景点','查什马阿尤布陵墓'],bukhara_samanid:['布哈拉景点','萨曼王陵'],bukhara_magoki:['布哈拉景点','马戈基阿塔里清真寺'],bukhara_bolo:['布哈拉景点','博洛哈乌兹清真寺'],bukhara_chor:['布哈拉景点','楚尔小宣礼塔']
});
let currentScene = 'plaza';
let activeCity='samarkand';
const cityMapMarkup={samarkand:$('#map-canvas').innerHTML,bukhara:$('#bukhara-map-template').innerHTML};
const cityPlannerMarkup={samarkand:$('#route-planner').innerHTML,bukhara:$('#bukhara-planner-template').innerHTML};
const cityConfigs={
  samarkand:{title:'撒马尔罕 · SAMARKAND',sceneTitle:'撒马尔罕',sceneSubtitle:'撒马尔罕 · 乌兹别克斯坦',previewTitle:'撒马尔罕·城市导览',previewText:'悬浮在景点图标上查看简介，点击进入对应场景。',oneDays:'1 天 · 5 个景点',oneSummary:'适合第一次到访。步行串联市中心五处景点，从帖木儿王朝陵墓走到古城东北部。',twoSummary:'节奏更从容。第一天探索古城核心，第二天串联阿弗拉西亚卜遗址与兀鲁伯天文台。'},
  bukhara:{title:'布哈拉 · BUKHARA',sceneTitle:'布哈拉',sceneSubtitle:'布哈拉 · 乌兹别克斯坦',previewTitle:'布哈拉·城市导览',previewText:'悬浮在景点图标上查看简介，点击进入对应场景。',oneDays:'1 天 · 4 个景点',oneSummary:'从拉比哈乌兹出发，穿过穹顶市场与双经学院，最后在波伊卡扬高塔下收尾。',twoSummary:'第一天从水池穿过市场、经学院与高塔；第二天向西串联城堡、圣泉与萨曼王陵。'}
};

function chineseLabel(value){
  const parts=value.split(' · ');if(parts.length<2)return value;
  return parts.slice(1).join(' · ');
}

function ensureAudio(){
  if(!soundEnabled) return false;
  if(!audioContext){
    const Context = window.AudioContext || window.webkitAudioContext;
    if(!Context) return false;
    audioContext = new Context();
    masterGain = audioContext.createGain();
    masterGain.gain.value = .72;
    masterGain.connect(audioContext.destination);
  }
  if(audioContext.state === 'suspended') audioContext.resume();
  return true;
}

function pluck(frequency, delay=0, duration=.65, level=.038, type='triangle'){
  if(!audioContext || !soundEnabled) return;
  const start=audioContext.currentTime+delay, oscillator=audioContext.createOscillator(), gain=audioContext.createGain(), filter=audioContext.createBiquadFilter();
  oscillator.type=type; oscillator.frequency.setValueAtTime(frequency,start);
  filter.type='lowpass'; filter.frequency.setValueAtTime(1900,start); filter.Q.value=2.4;
  gain.gain.setValueAtTime(.0001,start); gain.gain.exponentialRampToValueAtTime(level,start+.012); gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  oscillator.connect(filter);filter.connect(gain);gain.connect(masterGain);oscillator.start(start);oscillator.stop(start+duration+.03);
}

function noiseBurst(delay=0,duration=.32,level=.018,highpass=180){
  if(!audioContext || !soundEnabled) return;
  const start=audioContext.currentTime+delay, frames=Math.max(1,Math.floor(audioContext.sampleRate*duration)), buffer=audioContext.createBuffer(1,frames,audioContext.sampleRate), data=buffer.getChannelData(0);
  for(let i=0;i<frames;i++) data[i]=(Math.random()*2-1)*(1-i/frames);
  const source=audioContext.createBufferSource(), filter=audioContext.createBiquadFilter(), gain=audioContext.createGain();
  source.buffer=buffer;filter.type='highpass';filter.frequency.value=highpass;gain.gain.value=level;
  source.connect(filter);filter.connect(gain);gain.connect(masterGain);source.start(start);
}

function frameDrum(delay=0,level=.055){
  if(!audioContext || !soundEnabled) return;
  const start=audioContext.currentTime+delay, oscillator=audioContext.createOscillator(), gain=audioContext.createGain();
  oscillator.type='sine';oscillator.frequency.setValueAtTime(118,start);oscillator.frequency.exponentialRampToValueAtTime(52,start+.18);
  gain.gain.setValueAtTime(level,start);gain.gain.exponentialRampToValueAtTime(.0001,start+.22);
  oscillator.connect(gain);gain.connect(masterGain);oscillator.start(start);oscillator.stop(start+.24);noiseBurst(delay,.09,.012,700);
}

function playEntryCue(){
  if(!ensureAudio()) return;
  [220,233.08,277.18,329.63,440].forEach((note,index)=>pluck(note,index*.13,.56,.048,index===4?'sine':'triangle'));
  frameDrum(.02,.07);frameDrum(.53,.045);
}

function playHotspotSound(key='story'){
  if(!ensureAudio()) return;
  const seed=[...key].reduce((sum,char)=>sum+char.charCodeAt(0),0), roots=[196,220,246.94,277.18];
  const root=roots[seed%roots.length];
  pluck(root,0,.35,.04);pluck(root*(seed%2?1.189:1.26),.09,.42,.034,'sine');
  if(/camel|cat|market|spice|ceramic/.test(key)) frameDrum(.02,.035);
}

function playAmbientPhrase(profile){
  if(!audioContext || !soundEnabled) return;
  const sets={caravan:[196,207.65,246.94,293.66],plaza:[220,233.08,277.18,329.63],quiet:[174.61,196,233.08,261.63],bazaar:[246.94,261.63,311.13,369.99],memorial:[146.83,155.56,185,220],sacred:[164.81,174.61,207.65,246.94],ruins:[130.81,155.56,174.61,207.65],night:[329.63,369.99,440,493.88]};
  const notes=sets[profile]||sets.plaza;
  notes.forEach((note,index)=>pluck(note,index*.31,.72,profile==='night'?.021:.026,index%3===0?'sine':'triangle'));
  if(['caravan','plaza','bazaar'].includes(profile)){frameDrum(.1,.032);frameDrum(.72,.025);}
  if(['ruins','sacred','night'].includes(profile)) noiseBurst(.15,1.25,.007,profile==='night'?900:260);
}

function setAudioCaption(title,detail){
  const caption=$('#audio-caption');
  caption.querySelector('b').textContent=title;caption.querySelector('span').textContent=detail;
  caption.classList.add('is-visible');clearTimeout(caption.hideTimer);caption.hideTimer=setTimeout(()=>caption.classList.remove('is-visible'),4200);
}

function stopAmbient(){
  clearInterval(ambientTimer);clearTimeout(marketTimer);ambientTimer=null;marketTimer=null;
}

function fatDuckVoice(){
  const voices=window.speechSynthesis?.getVoices?.()||[];
  const matching=voices.filter(voice=>/^zh/i.test(voice.lang));
  const warm=/xiaoxiao|tingting|meijia|sinji|huihui|female|女/i;
  return matching.find(voice=>warm.test(voice.name))||matching[0]||null;
}

function speakNarration(text,{market=false}={}){
  if(!narrationEnabled||!('speechSynthesis' in window)||!text) return;
  window.speechSynthesis.cancel();lastNarration=text;$('#fat-duck-stage')?.classList.remove('is-speaking');
  const utterance=new SpeechSynthesisUtterance(text),voice=fatDuckVoice(),stage=$('#fat-duck-stage');
  utterance.lang='zh-CN';utterance.rate=1.1;utterance.pitch=market?1.15:1.34;utterance.volume=market?.8:.98;if(voice) utterance.voice=voice;
  utterance.onstart=()=>stage?.classList.add('is-speaking');
  utterance.onend=utterance.onerror=()=>stage?.classList.remove('is-speaking');
  window.speechSynthesis.speak(utterance);
}

function startSoundscape(name='map'){
  stopAmbient();if(!ensureAudio()) return;
  const [title,profile]=soundscapes[name]||soundscapes.map;
  playEntryCue();setAudioCaption(chineseLabel(title),soundscapeDetailsZh[name]);playAmbientPhrase(profile);
  ambientTimer=setInterval(()=>playAmbientPhrase(profile),profile==='night'?7200:5600);
  if(profile==='bazaar') marketTimer=setTimeout(()=>speakNarration('新烤的馕、甜杏干、香料与蓝釉陶器——来看看撒马尔罕的好货。',{market:true}),1450);
}

function toggleNarration(){
  narrationEnabled=!narrationEnabled;
  document.querySelectorAll('[data-action="narration-toggle"]').forEach(button=>{button.setAttribute('aria-pressed',String(narrationEnabled));button.setAttribute('aria-label',narrationEnabled?'关闭胖鸭朗读，场景音效保持开启':'打开胖鸭朗读，场景音效保持开启');});
  if(!narrationEnabled){window.speechSynthesis?.cancel();$('#fat-duck-stage')?.classList.remove('is-speaking');}
  setAudioCaption('胖鸭朗读',narrationEnabled?'朗读已开启，场景音效保持播放。':'朗读已静音，点击与悬浮音效保持播放。');
}

function renderWorldTransform(){
  const map=$('.world-map');map.style.setProperty('--world-zoom',worldZoom);map.style.setProperty('--world-x',`${worldPanX}px`);map.style.setProperty('--world-y',`${worldPanY}px`);
}

function zoomWorld(delta){
  worldZoom=Math.min(2.2,Math.max(.82,worldZoom+delta));stage.dataset.userZoom='true';
  if(worldZoom<=1){worldPanX=0;worldPanY=0;}renderWorldTransform();
}

function resetWorld(){worldZoom=.9;worldPanX=0;worldPanY=0;stage.dataset.userZoom='true';renderWorldTransform();setAudioCaption('丝路全图','西安 → 君士坦丁堡 → 罗马');}

function makeWorldMapDraggable(){
  let drag;
  stage.addEventListener('pointerdown',e=>{if(e.target.closest('button,.timeline,[role="button"]'))return;drag={x:e.clientX,y:e.clientY,panX:worldPanX,panY:worldPanY,id:e.pointerId};stage.setPointerCapture(e.pointerId);stage.classList.add('is-dragging');});
  stage.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const limitX=stage.clientWidth*Math.max(.12,(worldZoom-1)*.58),limitY=stage.clientHeight*Math.max(.06,(worldZoom-1)*.32);worldPanX=Math.max(-limitX,Math.min(limitX,drag.panX+e.clientX-drag.x));worldPanY=Math.max(-limitY,Math.min(limitY,drag.panY+e.clientY-drag.y));renderWorldTransform();});
  const stop=e=>{if(!drag||e.pointerId!==drag.id)return;drag=null;stage.classList.remove('is-dragging');};
  stage.addEventListener('pointerup',stop);stage.addEventListener('pointercancel',stop);
}

function setupLandmarkPreviews(){
  document.querySelectorAll('.route-markers [data-landmark]').forEach(pin=>{
    const play=()=>playHotspotSound(pin.dataset.landmark);
    pin.addEventListener('pointerenter',play);pin.addEventListener('focus',play);
  });
}

function duckStoryMarkup(kicker,title,text,sources=[]){
  const references=sources.map((item,i)=>`<div class="duck-reference"><blockquote>${item[0]}</blockquote><a class="source-link" href="${item[2]}" target="_blank" rel="noreferrer">出处${sources.length>1?` ${i+1}`:''} · ${item[1]} ↗</a></div>`).join('');
  const sourceBlock=references?`<div class="duck-sources">${references}</div>`:'';
  const byline=sources[0]?.[1]?`<p class="duck-byline">——${sources[0][1]}</p>`:'';
  return `<article class="story duck-story"><div class="fat-duck-stage" id="fat-duck-stage"><section class="duck-bubble" aria-live="polite"><span class="kicker">${kicker}</span><h2>${title}</h2><p>${text}</p>${byline}${sourceBlock}</section><span class="fat-duck-portrait" aria-hidden="true"><img src="assets/fat-duck-halfbody.webp" alt=""></span></div></article>`;
}

function openStory(key,narrate=true){
  activeStoryKey=key;
  const [rawKicker,rawTitle,text] = stories[key],zhHeading=storyHeadingsZh[key],kicker=zhHeading?.[0]||chineseLabel(rawKicker),title=zhHeading?.[1]||chineseLabel(rawTitle);
  if(key === 'tile' && !clueFound){clueFound = true; $('#clues').textContent = '1 / 1';}
  const source = sourceNotes[key];
  const sources = source ? (Array.isArray(source[0]) ? source : [source]) : [];
  content.innerHTML = duckStoryMarkup(kicker,title,text,sources);
  window.RegistanQuest?.attachChallenge(key);
  if(!modal.open)modal.showModal();
  lastNarration=`${title}. ${text}`;if(narrate){playHotspotSound(key);speakNarration(lastNarration);}
}

function setupRouteAccessibility(){
  document.querySelectorAll('.route-list [data-landmark]').forEach(item=>{item.tabIndex=0;item.setAttribute('role','button');item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();item.click();}});});
}

function setDays(days){
  const twoDays=String(days)==='2',config=cityConfigs[activeCity];
  document.querySelectorAll('[data-days]').forEach(button=>button.classList.toggle('is-active',button.dataset.days===String(days)));
  $('#city-map').classList.toggle('two-days',twoDays);
  $('#route-days').textContent=twoDays?'2 天 · 7 个景点':config.oneDays;
  $('#route-summary').textContent=twoDays?config.twoSummary:config.oneSummary;
}

function renderCityMap(id){
  const config=cityConfigs[id];if(!config)return;
  activeCity=id;
  $('#city-map').dataset.activeCity=id;
  $('#city-map-title').textContent=config.title;
  $('#map-canvas').innerHTML=cityMapMarkup[id];
  const planner=$('#route-planner');planner.innerHTML=cityPlannerMarkup[id];planner.className='route-planner';planner.removeAttribute('style');
  cityZoom=cityMinZoom;cityPanX=0;cityPanY=0;renderCityTransform();setDays(2);
  setupLandmarkPreviews();setupRouteAccessibility();makePlannerDraggable();
}

function showCityMap(){modal.close();$('#world').classList.remove('is-active');$('#city').classList.remove('is-active');$('#city-map').classList.add('is-active');ensureAudio();startSoundscape('map');}
function enterCity(id){renderCityMap(id);ensureAudio();playHotspotSound(`${id}-click`);showCityMap();}
function enterSamarkand(){enterCity('samarkand');}
function showScene(name='plaza'){modal.close();$('#city-map').classList.remove('is-active');$('#city').classList.add('is-active');ensureAudio();renderScene(name);const entry=scenes[name]?.entryStory;if(entry)setTimeout(()=>openStory(entry),380);}
function showMap(){modal.close();stopAmbient();window.speechSynthesis?.cancel();$('#city-map').classList.remove('is-active');$('#city').classList.remove('is-active');$('#world').classList.add('is-active');focusMap();}
function focusMap(){stage.classList.add('focused');if(!stage.dataset.userZoom){worldZoom=1.55;worldPanX=-stage.clientWidth*.035;worldPanY=stage.clientHeight*.02;renderWorldTransform();}}
function showRouteMap(){modal.close();window.speechSynthesis?.cancel();$('#city').classList.remove('is-active');$('#city-map').classList.add('is-active');startSoundscape('map');}
function renderCityTransform(){const canvas=$('#map-canvas');canvas.style.setProperty('--map-zoom',cityZoom);canvas.style.setProperty('--pan-x',`${cityPanX}px`);canvas.style.setProperty('--pan-y',`${cityPanY}px`);}
function zoomCity(delta){cityZoom=Math.min(2.2,Math.max(cityMinZoom,cityZoom+delta));if(cityZoom===cityMinZoom){cityPanX=0;cityPanY=0;}renderCityTransform();}

function makeCityMapDraggable(){
  const map=$('.local-map'),canvas=$('#map-canvas'); let drag;
  map.addEventListener('pointerdown',e=>{if(e.target.closest('button,aside'))return;drag={x:e.clientX,y:e.clientY,panX:cityPanX,panY:cityPanY,id:e.pointerId};map.setPointerCapture(e.pointerId);map.classList.add('is-dragging');canvas.classList.add('is-dragging');});
  map.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const limitX=map.clientWidth*(.1+Math.max(0,cityZoom-1)*.4),limitY=map.clientHeight*(.1+Math.max(0,cityZoom-1)*.28);cityPanX=Math.max(-limitX,Math.min(limitX,drag.panX+e.clientX-drag.x));cityPanY=Math.max(-limitY,Math.min(limitY,drag.panY+e.clientY-drag.y));renderCityTransform();});
  const stop=e=>{if(!drag||e.pointerId!==drag.id)return;drag=null;map.classList.remove('is-dragging');canvas.classList.remove('is-dragging');};
  map.addEventListener('pointerup',stop);map.addEventListener('pointercancel',stop);
}

function renderSceneTransform(){const canvas=$('#scene-canvas');canvas.style.setProperty('--scene-x',`${scenePanX}px`);canvas.style.setProperty('--scene-y',`${scenePanY}px`);}
function makeSceneDraggable(){
  const scene=$('#game-scene');let drag;
  scene.addEventListener('pointerdown',e=>{if(e.target.closest('button,aside,nav'))return;drag={x:e.clientX,y:e.clientY,panX:scenePanX,panY:scenePanY,id:e.pointerId};scene.setPointerCapture(e.pointerId);scene.classList.add('is-dragging');});
  scene.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const limitX=scene.clientWidth*.06,limitY=scene.clientHeight*.06;scenePanX=Math.max(-limitX,Math.min(limitX,drag.panX+e.clientX-drag.x));scenePanY=Math.max(-limitY,Math.min(limitY,drag.panY+e.clientY-drag.y));renderSceneTransform();});
  const stop=e=>{if(!drag||e.pointerId!==drag.id)return;drag=null;scene.classList.remove('is-dragging');};
  scene.addEventListener('pointerup',stop);scene.addEventListener('pointercancel',stop);
}

function makePlannerDraggable(){
  const planner=$('#route-planner'),handle=planner.querySelector('.planner-handle'),map=$('.local-map');let drag;
  handle.addEventListener('pointerdown',e=>{if(e.target.closest('button')||innerWidth<=700)return;const box=planner.getBoundingClientRect(),parent=map.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:box.left-parent.left,top:box.top-parent.top,id:e.pointerId};handle.setPointerCapture(e.pointerId);planner.classList.add('is-dragging');});
  handle.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const left=Math.max(8,Math.min(map.clientWidth-planner.offsetWidth-8,drag.left+e.clientX-drag.x)),top=Math.max(8,Math.min(map.clientHeight-planner.offsetHeight-8,drag.top+e.clientY-drag.y));planner.style.left=`${left}px`;planner.style.top=`${top}px`;planner.style.right='auto';planner.style.bottom='auto';});
  const stop=e=>{if(!drag||e.pointerId!==drag.id)return;drag=null;planner.classList.remove('is-dragging');};
  handle.addEventListener('pointerup',stop);handle.addEventListener('pointercancel',stop);
}

function renderScene(name,{audio=true}={}){
  const scene = scenes[name]; if(!scene) return;
  currentScene = name;scenePanX=0;scenePanY=0;renderSceneTransform();
  const sceneCity=scene.city||activeCity,config=cityConfigs[sceneCity]||cityConfigs.samarkand;
  const sceneArt=$('#scene-art'),panoramaNav=$('#panorama-nav'),isPanorama=name==='gur';
  sceneArt.src=scene.src;sceneArt.alt=scene.alt;sceneArt.classList.toggle('is-panorama',isPanorama);$('#game-scene').classList.toggle('has-panorama',isPanorama);panoramaNav.hidden=!isPanorama;
  $('#game-scene').style.setProperty('--panorama-x','0px');document.querySelectorAll('[data-panorama]').forEach(button=>button.classList.toggle('is-active',button.dataset.panorama==='north'));
  $('#city-title').textContent=config.sceneTitle;$('#scene-step').textContent = sceneStepsZh[name]; $('#scene-title').textContent = scene.subtitle; $('#scene-subtitle').textContent = config.sceneSubtitle;
  $('#scene-details').innerHTML = sceneFactsZh[name].map(([term,value])=>`<div><dt>${term}</dt><dd>${value}</dd></div>`).join('');
  $('.statusbar span:first-child').textContent = sceneCity==='bukhara'?`第 ${scene.day||2} 天 · 水池、市场、知识与王权`:`${name==='afrasiab'||name==='observatory'?'第 2 天':'第 1 天'} · 文明交汇的十字路口`;
  $('#scene-hotspots').innerHTML = scene.hotspots.map(([key,label,x,y,w,h])=>`<button class="glow-zone" data-kind="${hotspotKinds[key]||'building'}" data-story="${key}" style="--x:${x}%;--y:${y}%;--w:${w}%;--h:${h}%"><span>${hotspotLabelsZh[key]||chineseLabel(label)}</span></button>`).join('');
  document.querySelectorAll('[data-move]').forEach(button=>{const route=sceneDirections[name]?.[button.dataset.move],target=route?.[0],label=route?.[1];button.hidden=!route;button.dataset.target=target||'';button.querySelector('span').textContent=label||'';if(route)button.setAttribute('aria-label',`${directionNames[button.dataset.move]}前往${label}`);});
  if(audio&&audioContext) startSoundscape(name);
  window.RegistanQuest?.updateScene(name);
}

function comingSoon(city){
  activeStoryKey=null;
  content.innerHTML = `<article class="story"><span class="kicker">城市探索</span><h2>${chineseLabel(city)}</h2><p>这座城市已经出现在路线中，完整交互探索将在后续版本开放。当前可先进入撒马尔罕。</p><button class="pixel-button" data-action="close">返回地图</button></article>`;
  modal.showModal();
}

setTimeout(focusMap, 1900);
document.addEventListener('pointerdown',ensureAudio,{once:true});
const samarkandNode=$('#samarkand-node');let cityHoverAt=0;
const playCityHover=()=>{if(Date.now()-cityHoverAt<500||!ensureAudio())return;cityHoverAt=Date.now();pluck(392,0,.2,.025);pluck(523.25,.08,.25,.02,'sine');};
document.querySelectorAll('[data-city-id]').forEach(node=>{node.addEventListener('pointerenter',playCityHover);node.addEventListener('focus',playCityHover);node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();enterCity(node.dataset.cityId);}});});
document.addEventListener('click', e => {
  const story = e.target.closest('[data-story]'); if(story){openStory(story.dataset.story);return;}
  const landmark = e.target.closest('[data-landmark]');
  if(landmark){landmark.dataset.scene ? showScene(landmark.dataset.scene) : openStory(landmark.dataset.landmark);return;}
  const cityId=e.target.closest('[data-city-id]')?.dataset.cityId;if(cityId){enterCity(cityId);return;}
  const city = e.target.closest('[data-city]')?.dataset.city; if(city) comingSoon(city);
  const dayButton=e.target.closest('[data-days]');if(dayButton){setDays(dayButton.dataset.days);return;}
  const action = e.target.closest('[data-action]')?.dataset.action;
  if(action==='skip') focusMap(); if(action==='map') showMap(); if(action==='route-map') showRouteMap();
  if(action==='close')closeModal();
  if(action==='zoom-in') zoomCity(.25); if(action==='zoom-out') zoomCity(-.25);
  if(action==='world-zoom-in') zoomWorld(.25);if(action==='world-zoom-out') zoomWorld(-.25);if(action==='world-reset') resetWorld();
  if(action==='narration-toggle')toggleNarration();if(action==='replay-story')speakNarration(lastNarration);
  if(action==='toggle-planner'){const planner=$('#route-planner'),collapsed=planner.classList.toggle('is-minimized'),button=e.target.closest('[data-action="toggle-planner"]');button.textContent=collapsed?'□':'−';button.setAttribute('aria-expanded',String(!collapsed));button.setAttribute('aria-label',collapsed?'展开路线规划板':'最小化路线规划板');}
  if(action==='about'){activeStoryKey=null;const isBukhara=activeCity==='bukhara',narration=isBukhara?'撒马尔罕喜欢让人抬头，布哈拉更擅长把人留下来坐一会儿。水池、市场穹顶、经学院和宣礼塔让陌生人能在这里喝水、换钱、歇脚和读书。别急着把它叫作安静的小城——一座曾让埃米尔收税、商人算账、苏非念诵的地方，通常只是没有必要高声介绍自己。':'撒马尔罕位于泽拉夫尚河谷，水源与农业支撑了一座大型绿洲城市；向东可通帕米尔与中国，向西连接伊朗和地中海世界。地理位置让这里成为商旅停驻、政权经营与知识交流的节点。';content.innerHTML=duckStoryMarkup('为什么在这里？',isBukhara?'水池边的城市':'十字路口的绿洲',narration);modal.showModal();speakNarration(narration);}
  if(action==='treasures'){content.innerHTML=`<article class="story"><span class="kicker">丝路宝藏</span><h2>${clueFound?'蓝色釉砖':'撒马尔罕 · ?'}</h2><p>${clueFound?'已解锁——丝绸之路真正的宝物，是文明之间交换的知识、技艺与故事。':'在撒马尔罕城中寻找闪光的线索。'}</p><button class="pixel-button" data-action="close">继续探索</button></article>`;modal.showModal();}
});
document.querySelectorAll('[data-move]').forEach(button=>button.addEventListener('click',()=>{const target=button.dataset.target;if(target==='map')showRouteMap();else if(target)renderScene(target);}));
document.querySelectorAll('[data-panorama]').forEach(button=>button.addEventListener('click',()=>{$('#game-scene').style.setProperty('--panorama-x',panoramaPositions[button.dataset.panorama]);document.querySelectorAll('[data-panorama]').forEach(item=>item.classList.toggle('is-active',item===button));playHotspotSound(`panorama-${button.dataset.panorama}`);}));
document.querySelectorAll('[data-era]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-era]').forEach(x=>x.classList.remove('is-active'));button.classList.add('is-active');stage.dataset.era=button.dataset.era;}));
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-mode]').forEach(x=>x.classList.remove('is-on'));button.classList.add('is-on');const mode=button.dataset.mode,titles={time:'时间',trade:'贸易',ideas:'思想'},paragraph=mode==='trade'?'丝绸、马匹、纸张与陶瓷沿着多条路线流动。商品图层将在后续版本加入更完整的路线筛选。':mode==='ideas'?'宗教、技术、艺术与天文学也随旅人跨越大陆。思想图层将在后续版本逐步展开。':'选择一个时期，观察城市在历史网络中的位置。';content.innerHTML=`<article class="story"><span class="kicker">地图图层</span><h2>${titles[mode]}</h2><p>${paragraph}</p><button class="pixel-button" data-action="close">返回地图</button></article>`;modal.showModal();}));
const closeModal=()=>{modal.close();activeStoryKey=null;window.speechSynthesis?.cancel();$('#fat-duck-stage')?.classList.remove('is-speaking');};
modal.addEventListener('click', e => {if(e.target===modal)closeModal();});
modal.addEventListener('cancel', closeModal);
makeCityMapDraggable();
makeSceneDraggable();
makePlannerDraggable();
makeWorldMapDraggable();
setupLandmarkPreviews();
setupRouteAccessibility();
renderWorldTransform();
renderCityTransform();
renderScene(currentScene);
