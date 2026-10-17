import { ArtStylePreset, CampaignPreset } from '../types/game';

export const ART_STYLE_PRESETS: ArtStylePreset[] = [
  {
    id: 'chiaroscuro_woodcut',
    name: '明暗木刻与古典油画',
    subtitle: '精细版画墨线与琥珀提灯明暗对比、深邃黑曜石笔触融合',
    stylePrompt:
      'Dark fantasy oil painting with intricate ink woodcut engraving linework, dramatic chiaroscuro warm amber lantern light against obsidian shadows, fine museum parchment texture, consistent dark tabletop RPG book illustration.',
    paletteAccent: '#D4A359',
  },
  {
    id: 'clockwork_engraving',
    name: '以太黄铜铜版蚀刻',
    subtitle: '文艺复兴天体铜版画线条，配以复古焦金与深靛蓝渲染',
    stylePrompt:
      'Intricate Renaissance copperplate etching and oil wash illustration, burnished brass astrolabe geometry, deep midnight indigo shadows, warm golden rim lighting, consistent character proportions, fine archival plate texture.',
    paletteAccent: '#E09F3E',
  },
  {
    id: 'verdant_codex',
    name: '泥金民俗手绘古卷',
    subtitle: '古典手绘钢笔墨线与幽林翠绿、暗金水彩羊皮纸画风',
    stylePrompt:
      'Hand-inked dark folkloric illustration with muted emerald, antique gold, and charcoal watercolor wash, intricate botanical and gothic stonework linework, atmospheric twilight mist, consistent character portrait fidelity.',
    paletteAccent: '#52B788',
  },
];

export const CAMPAIGN_PRESETS: CampaignPreset[] = [
  {
    id: 'ashen_citadel',
    title: '瓦洛尔灰烬堡垒',
    genre: '暗黑奇幻悬疑',
    tagline: '日食凝固在沉没要塞的穹顶之上，凡人的记忆在此被铸造成黄铜钱币。',
    artStyleId: 'chiaroscuro_woodcut',
    protagonist: {
      id: 'char_protagonist',
      name: '凯伦·凡斯',
      role: '誓约行者',
      attitude: '坚毅沉着',
      visualDna:
        '一位三十岁出头的风霜行者，琥珀色瞳孔目光敏锐，夹杂银丝的黑发束在脑后，左眉有一道浅淡旧疤；身披炭黑色粗呢斗篷，领口扣着一枚古董黄铜夜枭胸针，手提一盏散发暖光的八分仪玻璃提灯。',
      firstMetTurn: 1,
      lastSeenTurn: 1,
      isProtagonist: true,
    },
    initialCompanion: {
      id: 'char_seraphina',
      name: '塞拉菲娜·沃斯',
      role: '遭贬黜的守钟人',
      attitude: '警惕的盟友',
      visualDna:
        '身材高挑的女性，灰金色长发编成发辫，深红布面铁甲外覆氧化青铜半身甲，额前架着一副烟色玻璃护目镜，手持一柄刻满符文的调音长戟。',
      firstMetTurn: 1,
      lastSeenTurn: 1,
    },
    startingLocation: '瓦洛尔沉水长堤',
    startingTime: '琥珀日食之时',
    openingChapterTitle: '第一章 · 未铸之时的钟声',
    openingParagraphs: [
      '灰烬从被水淹没的石堤上逆流升腾，无视重力般飘向半空。日食的滚烫铜环悬在瓦洛尔黑曜石城门上方，将幽暗水面染成暗金色。在你身旁，塞拉菲娜·沃斯放低了刻满符文的调音长戟，青铜戟尖正与紧闭的铁闸门产生低沉的共鸣。',
      '“执政院发过毒誓，说这座堡垒早在三个寒冬前就已彻底沉入深渊，”塞拉菲娜压低嗓音，扶了扶额前的烟色玻璃护目镜，“可长堤下的水位正在消退，而且就在刚才——有人从堡垒内部敲响了高塔晚祷钟。”',
      '城门楼基座旁散落着一只刚刚被砸碎的信使铁箱。箱内躺着一封未曾拆封的帝国敕令，以及一把触手尚存余温的黑铁重钥；与此同时，上方的卫戍塔楼里传来了铁弩绞盘缓慢拉紧的刺耳摩擦声。',
    ],
    openingCausalNote:
      '你在执政院清剿队抵达前抢先踏上沉水长堤，这使你既能率先夺取信使铁箱中的遗物，也有机会与塔楼上暗中瞄准的守卫交涉。',
    openingVisualScenePrompt:
      'Kaelen Vance and Seraphina Vos standing on a flooded stone causeway before the towering obsidian gates of the Ashen Citadel of Vaelor under an eclipsed amber sun, a shattered courier chest at their feet glowing with warm brass light.',
    initialInventory: [
      {
        id: 'item_octant_lantern',
        name: '八分仪琉璃提灯',
        category: '圣物',
        quantity: 1,
        description: '一盏黄铜航海家提灯，灯芯火苗会自发偏向隐藏的时间裂隙与空心石墙。',
        visualTag: '散发温暖琥珀光芒的黄铜八分仪提灯',
        acquiredTurn: 1,
      },
      {
        id: 'item_tithe_coin',
        name: '瓦洛尔记忆什一币',
        category: '奇物',
        quantity: 3,
        description: '印有铸钟工坊徽记的沉重八角黄铜币，无论亡魂还是守关人都认可其价值。',
        visualTag: '刻有钟形徽记的八角黄铜古币',
        acquiredTurn: 1,
      },
      {
        id: 'item_iron_blade',
        name: '嵌银护符短剑',
        category: '兵器',
        quantity: 1,
        description: '剑脊嵌有驱散灰烬怨灵银丝的旅人佩剑，重心极为平衡。',
        visualTag: '收纳在旧皮剑鞘中的嵌银短剑',
        acquiredTurn: 1,
      },
    ],
    initialQuest: {
      id: 'quest_citadel_entry',
      title: '突破沉水铁闸门',
      summary:
        '查明究竟是谁在被封锁的瓦洛尔堡垒内部敲响了晚祷钟，并在执政院清剿部队赶到前找回遗失的《铸钟工坊总账》。',
      giverOrSource: '纪年史开篇',
      status: '进行中',
      updatedTurn: 1,
      objectives: [
        {
          id: 'obj_1',
          text: '绕过或设法说服沉水长堤城门塔楼上的暗哨',
          completed: false,
        },
        {
          id: 'obj_2',
          text: '检查破碎的信使铁箱，寻找内部钟声的线索',
          completed: false,
        },
        {
          id: 'obj_3',
          text: '与塞拉菲娜·沃斯一同进入内城瓮城',
          completed: false,
        },
      ],
    },
    initialChoices: [
      {
        id: 'choice_claim_chest',
        label: '在塔楼弩手扣动扳机前，迅速夺取信使铁箱中尚存余温的黑铁重钥与帝国敕令',
        intent: '果断夺取',
        consequenceHint: '立即获得关键任务物品，但会惊动门楼上的守卫。',
      },
      {
        id: 'choice_raise_lantern',
        label: '高举手中的八分仪琉璃提灯，与塞拉菲娜一同向塔楼喊出旧守钟人的密语',
        intent: '交涉谈判',
        consequenceHint: '借助【八分仪琉璃提灯】赢得塔楼守望者的信任。',
        requiredItemName: '八分仪琉璃提灯',
      },
      {
        id: 'choice_flank_sluice',
        label: '潜入长堤拱门下方正在排水的泄水闸道，从内部暗道奇袭塔楼',
        intent: '潜行渗透',
        consequenceHint: '避开正面交锋，并发现一条通往地下铸钟池的隐秘通道。',
      },
    ],
  },
  {
    id: 'clockwork_abyss',
    title: '沉星钟表深渊',
    genre: '以太朋克地底远征',
    tagline: '盐原之下千丈深处，一座由黄铜与星晶构成的巨型天体引擎正在倒转整个世纪。',
    artStyleId: 'clockwork_engraving',
    protagonist: {
      id: 'char_protagonist',
      name: '卡斯帕·索恩',
      role: '深渊制图师',
      attitude: '冷静缜密',
      visualDna:
        '面容削瘦的制图师，佩戴铜框单片眼镜，微乱黑发，身穿扣有黄铜星盘搭扣的深靛蓝勘测长衣，肩挎装满羊皮卷筒的皮囊，手持磷光线圈提灯。',
      firstMetTurn: 1,
      lastSeenTurn: 1,
      isProtagonist: true,
    },
    initialCompanion: {
      id: 'char_automaton_nine',
      name: '晚祷九号（Vesper-IX）',
      role: '白瓷精密计时自动机',
      attitude: '忠诚而神秘',
      visualDna:
        '体态修长的关节机械人偶，微裂的象牙白瓷面甲下闪烁着蓝宝石光学镜头，胸腔显露精密运转的黄铜擒纵齿轮，外披一件陈旧的学者披肩。',
      firstMetTurn: 1,
      lastSeenTurn: 1,
    },
    startingLocation: '巨型钟摆悬空栈桥',
    startingTime: '天底第三响',
    openingChapterTitle: '第一章 · 逆行擒纵器',
    openingParagraphs: [
      '随着六十寻长的陨铁巨摆从深渊下方呼啸掠过，整座黄铜悬空栈桥都在有节奏地震颤。在你身侧，白瓷机械人偶“晚祷九号”微微偏过带有裂纹的象牙面甲，胸腔内的擒纵齿轮发出与大厅节拍截然不同的咔哒声。',
      '“有人将一枚至高纪年滚筒强行楔入了主传动轴，”晚祷九号的蓝宝石镜头聚焦在前方的主控台上，“一旦巨摆再完成三次逆行摆动，地表上城区的过去四十个小时将被彻底抹去重写。”',
      '在狭窄的齿轮桥彼端，一名戴着铁面具的工匠会技师正用共振扳手强行撬开主调节阀，尚未察觉你们的逼近。',
    ],
    openingCausalNote:
      '巨型钟摆距离时间回溯仅剩三次摆动；你如何处置主控台前的蒙面技师，将直接决定钟表深渊是恢复稳定还是发生时空崩解。',
    openingVisualScenePrompt:
      'Caspian Thorne and the porcelain automaton Vesper-IX standing on a suspended brass catwalk overlooking a colossal glowing clockwork astrolabe chasm while a masked artificer tampers with the regulator.',
    initialInventory: [
      {
        id: 'item_astrolabe_key',
        name: '游标校准密钥',
        category: '密钥',
        quantity: 1,
        description: '一把精密的黄铜刻度钥匙，可锁死或逆转钟表深渊内的齿轮栈桥。',
        visualTag: '带有旋转刻度盘的精密黄铜游标钥匙',
        acquiredTurn: 1,
      },
      {
        id: 'item_aether_vial',
        name: '高纯以太晶瓶',
        category: '消耗品',
        quantity: 2,
        description: '闪烁蓝金微光的浓缩流体，可迅速修复自动机核心或令发条机关超载运行。',
        visualTag: '盛有蓝金色发光以太液体的琉璃小瓶',
        acquiredTurn: 1,
      },
    ],
    initialQuest: {
      id: 'quest_stop_retrograde',
      title: '制止逆行钟摆',
      summary: '阻止主调节阀台处的蓄意破坏，并在第三次摆动完成前取出至高纪年滚筒。',
      giverOrSource: '深渊远征宪章',
      status: '进行中',
      updatedTurn: 1,
      objectives: [
        { id: 'obj_h1', text: '在主调节阀台制服或质询戴面具的工匠会技师', completed: false },
        { id: 'obj_h2', text: '在巨摆第三次逆行前拔出至高纪年滚筒', completed: false },
      ],
    },
    initialChoices: [
      {
        id: 'choice_lock_bridge',
        label: '将游标校准密钥插入栈桥立柱锁死齿轮桥，截断蒙面技师的退路并逼问幕后主使',
        intent: '战术封锁',
        consequenceHint: '使用【游标校准密钥】困住破坏者，迫使其交出实情。',
        requiredItemName: '游标校准密钥',
      },
      {
        id: 'choice_overcharge_vesper',
        label: '将一瓶高纯以太注入晚祷九号的核心，令其高速突进夺下调节阀扳手',
        intent: '同伴超载',
        consequenceHint: '消耗 1 瓶【高纯以太晶瓶】，在不损伤精密机关的前提下控制主控台。',
        requiredItemName: '高纯以太晶瓶',
      },
      {
        id: 'choice_sneak_gantry',
        label: '攀上上方的配重锁链，从高处悄然滑落至主调节阀台后方并窃听其通讯',
        intent: '高空奇袭',
        consequenceHint: '高风险潜行动作，可在出手前听清技师与上层的传音密令。',
      },
    ],
  },
  {
    id: 'whispering_mire',
    title: '橡木港根缚修道院',
    genre: '哥特民俗奇谭',
    tagline: '在被淹没的泽国深处，古老的树根铭记着凡人家族背弃的每一句誓言。',
    artStyleId: 'verdant_codex',
    protagonist: {
      id: 'char_protagonist',
      name: '罗恩·艾什克罗夫特',
      role: '泽国巡林客与草药师',
      attitude: '悲悯而警觉',
      visualDna:
        '身形矫健的巡林客，深褐眼眸，赤褐发辫，身着骨扣苔绿涂蜡皮长衣，手持一根顶端镶有发光琥珀树脂提灯的雕花花楸木长杖。',
      firstMetTurn: 1,
      lastSeenTurn: 1,
      isProtagonist: true,
    },
    initialCompanion: {
      id: 'char_briar',
      name: '凯룸修士',
      role: '沉水唱诗班末代抄写员',
      attitude: '谦卑而忧惧',
      visualDna:
        '蓄着银白长须的年迈修士，身穿绣有金色柳叶纹的雨渍亚麻祭袍，胸前紧抱着一部铁扣圣物法典。',
      firstMetTurn: 1,
      lastSeenTurn: 1,
    },
    startingLocation: '圣埃尔德沉水回廊',
    startingTime: '柳月黄昏',
    openingChapterTitle: '第一章 · 树根之下的唱诗班',
    openingParagraphs: [
      '你的木制轻舟悄无声息地滑过橡木港修道院半淹于水中的哥特式尖拱，散发微光的沼泽睡莲在幽暗水面上静静绽放。船头的凯伦修士死死抱紧怀中的铁扣法典，而碗口粗的古老树根正沿着钟楼石壁缓慢搏动。',
      '“看那边，高祭坛旁……”凯伦修士伸出颤抖的手指低声惊呼。一头完全由活体白心木雕琢而成的雄鹿正站在齐膝深的积水中，左肩深深刺入了一柄刻有银色符文的古老猎矛。',
      '上方的暗影回廊深处突然传来沼泽猎人低沉悲凉的号角声——他正循着血迹追猎这头白心木雄鹿，企图夺取它的鹿角王冠。',
    ],
    openingCausalNote:
      '你在沉水大殿中如何对待这头受伤的白心木雄鹿，将永久决定你在古老森林树灵与沼泽猎人之间的立场。',
    openingVisualScenePrompt:
      'Rowan Ashcroft with a glowing amber rowan-staff lantern and Brother Caelum in a wooden skiff inside a flooded gothic abbey overgrown with roots, facing a luminous white heartwood stag by the sunken altar.',
    initialInventory: [
      {
        id: 'item_rowan_lantern',
        name: '琥珀树脂花楸杖',
        category: '圣物',
        quantity: 1,
        description: '冠以远古琥珀的高山花楸木法杖，靠近古老森林契约时会散发出温润金光。',
        visualTag: '顶端镶有发光琥珀树脂提灯的雕花花楸木长杖',
        acquiredTurn: 1,
      },
      {
        id: 'item_silverleaf_salve',
        name: '银叶草疗伤药膏',
        category: '消耗品',
        quantity: 2,
        description: '既能治愈凡人创伤、亦可抚平枯萎灵木的秘制草药敷膏。',
        visualTag: '盛有微光银叶草药膏的粗陶药罐',
        acquiredTurn: 1,
      },
    ],
    initialQuest: {
      id: 'quest_abbey_pact',
      title: '沉水唱诗班的盟约',
      summary: '在沼泽猎人赶到前决定白心木雄鹿的命运，并开启修道院圣物密室。',
      giverOrSource: '凯伦修士',
      status: '进行中',
      updatedTurn: 1,
      objectives: [
        { id: 'obj_m1', text: '处置沉水祭坛旁受伤的白心木雄鹿', completed: false },
        { id: 'obj_m2', text: '应对步步逼近的沼泽猎人', completed: false },
      ],
    },
    initialChoices: [
      {
        id: 'choice_heal_stag',
        label: '拔出银符猎矛，敷上银叶草疗伤药膏为白心木雄鹿治愈肩部创伤',
        intent: '林间慈悲',
        consequenceHint: '消耗 1 份【银叶草疗伤药膏】，赢得雄鹿的赐福并获得【银符猎矛】。',
        requiredItemName: '银叶草疗伤药膏',
      },
      {
        id: 'choice_ward_altar',
        label: '将琥珀树脂花楸杖立于祭坛石缝中，张开庇护结界迫使沼泽猎人停步谈判',
        intent: '结界庇护',
        consequenceHint: '借助【琥珀树脂花楸杖】阻止猎人强攻，开启正面交涉。',
        requiredItemName: '琥珀树脂花楸杖',
      },
      {
        id: 'choice_hide_crypt',
        label: '驾舟驶入圣坛屏风后方的半淹地窖，在暗中观察沼泽猎人的真实身份',
        intent: '隐蔽窥探',
        consequenceHint: '在现身干预前查明猎人与修道院旧贵族的隐秘关联。',
      },
    ],
  },
];
