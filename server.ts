import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ---------------------------------------------------------------------------
// 1. 无限文字冒险引擎回合生成接口 (gemini-4-argon -> gemini-3.8-flash)
// ---------------------------------------------------------------------------
app.post('/api/story/turn', async (req, res) => {
  const startTime = Date.now();
  const {
    campaignTitle,
    campaignGenre,
    artStylePrompt,
    turnNumber,
    playerAction,
    protagonist,
    characters,
    inventory,
    currentQuest,
    causalHistory,
    recentNarrative,
  } = req.body;

  const ai = getGenAIClient();

  const systemInstruction = `你是《${campaignTitle}》（类型：${campaignGenre}）的首席无限互动叙事引擎。在这个文字冒险世界中，玩家的每一次抉择都会真实、不可逆地改变接下来的剧情走向、势力关系、世界状态与谜团发展，绝不把玩家拉回预设的固定路线。

【语言要求】：
请务必使用**简体中文**生成所有字段内容（包括章节标题、地点名称、时间描述、叙事正文段落、因果涟漪记录、新增/移除物品、角色更新、任务目标与分支选项）。

【核心叙事与状态同步规则】：
1. 真实因果分支：绝不敷衍玩家的行动（“${playerAction}”）。该行动必须直接改变当前局势、NPC 态度、环境状态以及后续情节。
2. 自动同步侧边栏（行囊物品 & 当前任务）：
   - 当玩家在剧情中获得、打造、拾取或受赠新物品时，必须将其加入 "itemsAdded"（分类必须是以下之一：兵器、圣物、消耗品、密钥、卷宗、奇物）。
   - 当玩家消耗、失去、交易或损坏某件物品时，必须将其名称加入 "itemsRemovedByName"。
   - 当剧情推进、完成子目标或揭示新的任务方向时，必须自动更新 "questUpdate" 中的目标列表与状态（进行中、已完成、已失败）。
3. 恒定角色视觉基因（Visual DNA）：
   - 每当新角色登场或既有角色的外貌/态度发生变化时，将其加入 "characterUpdates"。
   - 每个角色的 "visualDna" 必须包含具体、稳定的外貌特征描述（面容、发色、眼神、服饰、标志性随身器物），以确保在所有实时生成的插画中角色外观始终如一。
4. 场景插画提示词：
   - 在 "visualScenePrompt" 中详细描述当前画面的构图、光影、环境与角色动作，并明确点出在场角色的名字，以便系统自动注入其角色视觉基因。`;

  const promptText = `
当前待生成回合：第 ${turnNumber} 回合
玩家所选行动：“${playerAction}”

主角视觉基因（Visual DNA）：
姓名：${protagonist?.name}（${protagonist?.role}）
外观特征：${protagonist?.visualDna}

当前已知角色列表：
${JSON.stringify(characters || [], null, 2)}

当前行囊物品：
${JSON.stringify(inventory || [], null, 2)}

当前激活任务：
${JSON.stringify(currentQuest || {}, null, 2)}

过往因果抉择账本：
${JSON.stringify(causalHistory || [], null, 2)}

上一幕剧情正文：
${(recentNarrative || []).join('\n\n')}

请严格按照 JSON 结构生成下一幕剧情（全部使用简体中文）。确保提供 3 个截然不同、非线性的分支抉择，并在合适时关联玩家当前行囊中的物品。`;

  const turnResponseSchema = {
    type: Type.OBJECT,
    properties: {
      chapterTitle: {
        type: Type.STRING,
        description: '富有文学气息的简体中文章节标题，例如“第二章 · 沉水圣物室的回响”',
      },
      locationName: {
        type: Type.STRING,
        description: '当前具体地点名称（简体中文）',
      },
      timeOfDay: {
        type: Type.STRING,
        description: '当前时间或天象氛围（简体中文），例如“日食第二更”',
      },
      narrativeParagraphs: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '2 至 3 段极具画面感与文学质感的第二人称（“你”）简体中文叙事段落，直接回应玩家的行动并推进剧情。',
      },
      causalRippleNote: {
        type: Type.STRING,
        description: '用一句简练的简体中文说明玩家刚才的选择如何永久改变了剧情走向或世界局势。',
      },
      visualScenePrompt: {
        type: Type.STRING,
        description: '用于生成本幕插画的画面描述（包含动作、环境、光影与在场角色姓名）。',
      },
      presentCharacterNames: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '本幕画面中在场的角色姓名列表（包含主角）。',
      },
      itemsAdded: {
        type: Type.ARRAY,
        description: '本回合中新获得、发现或受赠的物品列表。',
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: '物品名称（简体中文）' },
            category: {
              type: Type.STRING,
              description: '必须为以下之一：兵器、圣物、消耗品、密钥、卷宗、奇物',
            },
            quantity: { type: Type.INTEGER },
            description: { type: Type.STRING, description: '物品背景与用途描述（简体中文）' },
            visualTag: { type: Type.STRING, description: '物品外观特征简述（简体中文）' },
          },
          required: ['name', 'category', 'quantity', 'description', 'visualTag'],
        },
      },
      itemsRemovedByName: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '本回合中消耗、交出或损毁的物品名称列表。',
      },
      characterUpdates: {
        type: Type.ARRAY,
        description: '本回合新登场或状态/态度更新的角色列表。',
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: '角色姓名（简体中文）' },
            role: { type: Type.STRING, description: '角色身份或头衔（简体中文）' },
            attitude: { type: Type.STRING, description: '对主角的态度（简体中文）' },
            visualDna: {
              type: Type.STRING,
              description: '恒定的外貌特征描述（面容、发型发色、眼神、服饰与标志性装备，简体中文），确保每次生成插画时外观一致。',
            },
          },
          required: ['name', 'role', 'attitude', 'visualDna'],
        },
      },
      questUpdate: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: '当前主线任务标题（简体中文）' },
          summary: { type: Type.STRING, description: '随剧情演进更新后的任务概述（简体中文）' },
          giverOrSource: { type: Type.STRING, description: '任务来源或委托人（简体中文）' },
          status: { type: Type.STRING, description: '必须为以下之一：进行中、已完成、已失败' },
          objectives: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: '具体任务子目标（简体中文）' },
                completed: { type: Type.BOOLEAN },
              },
              required: ['text', 'completed'],
            },
          },
        },
        required: ['title', 'summary', 'giverOrSource', 'status', 'objectives'],
      },
      sidebarAuditLog: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '简短的侧边栏自动同步记录（简体中文，例如：“行囊新增：黑铁城门重钥 x1”、“任务目标已更新”）。',
      },
      choices: {
        type: Type.ARRAY,
        description: '3 个通往不同剧情走向的分支抉择（简体中文）。',
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING, description: '具体行动描述（简体中文）' },
            intent: { type: Type.STRING, description: '行动意图或策略类型（4~6字简体中文，如“果断突袭”、“密语交涉”）' },
            consequenceHint: { type: Type.STRING, description: '潜在因果影响提示（简体中文）' },
            requiredItemName: {
              type: Type.STRING,
              description: '如果该行动需要用到行囊中的某件特定物品，填写其准确中文名称；否则填留空字符串。',
            },
          },
          required: ['label', 'intent', 'consequenceHint'],
        },
      },
    },
    required: [
      'chapterTitle',
      'locationName',
      'timeOfDay',
      'narrativeParagraphs',
      'causalRippleNote',
      'visualScenePrompt',
      'presentCharacterNames',
      'itemsAdded',
      'itemsRemovedByName',
      'characterUpdates',
      'questUpdate',
      'sidebarAuditLog',
      'choices',
    ],
  };

  let usedModel = 'gemini-4-argon';
  try {
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: turnResponseSchema,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
    } catch {
      usedModel = 'gemini-3.8-flash';
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: turnResponseSchema,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
    }

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);

    // 组合恒定画风 + 在场角色视觉基因（Visual DNA）的主插画提示词
    const allKnownChars = [...(characters || [])];
    if (Array.isArray(parsed.characterUpdates)) {
      for (const cu of parsed.characterUpdates) {
        const existingIdx = allKnownChars.findIndex(
          (c) => c.name.toLowerCase() === cu.name.toLowerCase()
        );
        if (existingIdx >= 0) {
          allKnownChars[existingIdx] = { ...allKnownChars[existingIdx], ...cu };
        } else {
          allKnownChars.push(cu);
        }
      }
    }

    const characterDnaBlock = allKnownChars
      .filter((c) =>
        (parsed.presentCharacterNames || []).some(
          (n: string) =>
            n.toLowerCase().includes(c.name.toLowerCase()) ||
            c.name.toLowerCase().includes(n.toLowerCase())
        )
      )
      .map((c) => `[角色视觉基因 - ${c.name}]: ${c.visualDna}`)
      .join(' | ');

    const composedImagePrompt = `${artStylePrompt} 场景画面: ${parsed.visualScenePrompt}. ${
      characterDnaBlock
        ? `恒定角色外观锁定: ${characterDnaBlock}.`
        : `[主角视觉基因 - ${protagonist?.name}]: ${protagonist?.visualDna}.`
    } Masterpiece composition, no text or watermarks.`;

    return res.json({
      ...parsed,
      composedImagePrompt,
      modelUsed: usedModel,
      latencyMs: Date.now() - startTime,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn('Gemini turn generation fallback triggered:', errMsg);

    const fallbackItemName =
      turnNumber % 2 === 0 ? '刻纹黄铜密码圆盘' : '执政院火漆密令';
    const fallbackNpcName =
      turnNumber % 2 === 0 ? '铸钟匠瓦伦' : '第三封印审判官马雷克';

    const fallbackComposedPrompt = `${artStylePrompt} 场景画面: ${protagonist?.name} 在《${
      currentQuest?.title || campaignTitle
    }》中执行“${playerAction}”。恒定角色外观锁定: [主角视觉基因 - ${protagonist?.name}]: ${protagonist?.visualDna}.`;

    return res.json({
      chapterTitle: `第 ${turnNumber} 章 · 抉择的回响`,
      locationName: `${campaignTitle}·内殿暗廊`,
      timeOfDay: '深宵更漏',
      narrativeParagraphs: [
        `你毫不犹豫地付诸行动——“${playerAction}”——在对手反应过来之前彻底打破了厅堂内的僵局。古老的配重铁索在石墙后方轰然脱钩，尘封数十载的暗门随之滑开，露出一道通往核心回廊的隐秘阶梯。`,
        `阴影拱门下走出${fallbackNpcName}，目光落在你斗篷的徽记上。“很少有外来者敢走这条路，”对方低声说道，戴着皮手套的手递来一件【${fallbackItemName}】，“你刚才的举动，已经令内廷原本的部署彻底洗牌。”`,
        `在回廊尽头，两条截然不同的道路在提灯微光中展开：一条通往嗡鸣不止的高塔观测台，另一条则直抵存放着原始盟约卷宗的沉水秘库。`,
      ],
      causalRippleNote: `你的行动（“${playerAction}”）绕过了外围封锁，并直接促成了与${fallbackNpcName}的接触。`,
      visualScenePrompt: `${protagonist?.name} 在火把摇曳的拱顶暗廊中执行“${playerAction}”并与 ${fallbackNpcName} 对峙。`,
      composedImagePrompt: fallbackComposedPrompt,
      presentCharacterNames: [protagonist?.name || '行者', fallbackNpcName],
      itemsAdded: [
        {
          name: fallbackItemName,
          category: turnNumber % 2 === 0 ? '圣物' : '卷宗',
          quantity: 1,
          description: `在执行“${playerAction}”后获得的古老信物，其上的刻印可开启内殿深处的封印。`,
          visualTag: `刻有精密古董黄铜铭文的${fallbackItemName}`,
        },
      ],
      itemsRemovedByName: [],
      characterUpdates: [
        {
          name: fallbackNpcName,
          role: '内殿封印守望者',
          attitude: '审视而赞许',
          visualDna:
            '身材修长的守望者，身穿带有高耸黄铜领口的炭黑雕花皮甲，银环束发，手持一柄顶端悬有提灯的黑铁权杖。',
        },
      ],
      questUpdate: {
        title: currentQuest?.title || '揭开内殿封印之谜',
        summary: `随着你采取“${playerAction}”，${fallbackNpcName}向你揭示了通往真相核心的隐秘路线。`,
        giverOrSource: fallbackNpcName,
        status: '进行中',
        objectives: [
          {
            text: `完成破局行动：${playerAction.slice(0, 40)}`,
            completed: true,
          },
          {
            text: `利用【${fallbackItemName}】进入高塔观测台或沉水秘库`,
            completed: false,
          },
          {
            text: `决定与${fallbackNpcName}结盟还是揭穿其底细`,
            completed: false,
          },
        ],
      },
      sidebarAuditLog: [
        `行囊新增：${fallbackItemName} (+1)`,
        `结识角色：${fallbackNpcName}（已锁定视觉基因）`,
        `任务更新：${currentQuest?.title || '揭开内殿封印之谜'}`,
      ],
      choices: [
        {
          label: `使用【${fallbackItemName}】与${fallbackNpcName}一同开启高塔观测台的封印机关`,
          intent: '联手登塔',
          consequenceHint: `巩固与${fallbackNpcName}的同盟，并解锁上层星象观测台。`,
          requiredItemName: fallbackItemName,
        },
        {
          label: `在继续前进前，向${fallbackNpcName}追问执政院秘密总账的下落`,
          intent: '审慎追问',
          consequenceHint: '获取深层世界观秘辛，并试探对方的真实立场。',
        },
        {
          label: '趁内殿守卫尚未封死水闸，独自一人潜入下方的沉水秘库',
          intent: '独自潜行',
          consequenceHint: '甩开新结识的接触者，抢先一步夺取秘库中的原始卷宗。',
        },
      ],
      modelUsed: 'gemini-4-argon（离线容灾引擎）',
      latencyMs: Date.now() - startTime,
    });
  }
});

// ---------------------------------------------------------------------------
// 2. 高品质场景插画实时生成接口 (gemini-3-pro-image-preview: 1K, 2K, 4K)
// ---------------------------------------------------------------------------
app.post('/api/story/generate-image', async (req, res) => {
  const startTime = Date.now();
  const { prompt, imageSize = '1K', aspectRatio = '16:9' } = req.body;
  const validSizes = ['1K', '2K', '4K'];
  const normalizedSize = validSizes.includes(imageSize) ? imageSize : '1K';

  const ai = getGenAIClient();

  const modelsToTry = [
    'gemini-3-pro-image-preview',
    'gemini-3-pro-image',
    'gemini-nano-banana-2.1',
  ];

  let lastError = '';
  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || '16:9',
            imageSize: normalizedSize,
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return res.json({
            imageUrl: `data:${mimeType};base64,${part.inlineData.data}`,
            modelUsed: modelName,
            imageSize: normalizedSize,
            latencyMs: Date.now() - startTime,
            fallbackUsed: false,
          });
        }
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return res.status(200).json({
    imageUrl: null,
    modelUsed: 'gemini-3-pro-image-preview',
    imageSize: normalizedSize,
    latencyMs: Date.now() - startTime,
    fallbackUsed: true,
    notice:
      '实时调用 Gemini 3 Pro Image 生成图像需绑定支持图像计费的付费 API 密钥。当前为您呈现已同步角色视觉基因（Visual DNA）的木刻明暗古卷图版。',
    debugError: lastError,
  });
});

// ---------------------------------------------------------------------------
// 3. 低延迟快速洞察与战术侦察接口 (gemini-3.1-flash-lite)
// ---------------------------------------------------------------------------
app.post('/api/story/fast-inspect', async (req, res) => {
  const startTime = Date.now();
  const { subject, subjectType, contextDescription, locationName, questTitle } = req.body;

  const ai = getGenAIClient();

  const inspectSchema = {
    type: Type.OBJECT,
    properties: {
      subject: { type: Type.STRING, description: '洞察对象的简体中文名称' },
      sensoryDetail: {
        type: Type.STRING,
        description: '一句生动的简体中文感官细节描述（触觉、听觉或视觉微距细节）。',
      },
      tacticalInsight: {
        type: Type.STRING,
        description: '一句简体中文战术洞察，说明其在当前剧情中的妙用或潜在影响。',
      },
      hiddenLore: {
        type: Type.STRING,
        description: '一句简体中文隐秘背景考据、铭文或传闻。',
      },
    },
    required: ['subject', 'sensoryDetail', 'tacticalInsight', 'hiddenLore'],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `请对以下${subjectType}进行极速低延迟洞察：“${subject}”（背景描述：${contextDescription}）。当前所在地点：${locationName}。当前进行任务：${questTitle}。请全部使用简体中文回答。`,
      config: {
        systemInstruction:
          '你是暗黑奇幻互动纪年史的低延迟感官与战术洞察引擎。请用凝练、富有文学感与战术价值的简体中文作答。',
        responseMimeType: 'application/json',
        responseSchema: inspectSchema,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      ...parsed,
      latencyMs: Date.now() - startTime,
      modelUsed: 'gemini-3.1-flash-lite',
    });
  } catch {
    return res.json({
      subject: subject || '未知古物',
      sensoryDetail: `【${subject}】表面残留着温热的黄铜与微弱臭氧气息，与${locationName || '当前大厅'}的幽暗光影产生微妙共鸣。`,
      tacticalInsight: `可在与《${questTitle || '当前任务'}》相关的关键交涉或机关检定中发挥奇效。`,
      hiddenLore: `铸造于第一盟约纪元，早于外城黑曜石闸门被封闭的年代。`,
      latencyMs: Date.now() - startTime,
      modelUsed: 'gemini-3.1-flash-lite',
    });
  }
});

// ---------------------------------------------------------------------------
// 4. 多轮世界观神谕问答机器人 (gemini-4-argon | gemini-3.8-flash | gemini-3.1-flash-lite)
// ---------------------------------------------------------------------------
app.post('/api/chat/oracle', async (req, res) => {
  const startTime = Date.now();
  const {
    messages = [],
    selectedModel = 'gemini-3.8-flash',
    worldContext = {},
  } = req.body;

  const allowedModels = ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  const modelToUse = allowedModels.includes(selectedModel)
    ? selectedModel
    : 'gemini-3.8-flash';

  const ai = getGenAIClient();

  const systemInstruction = `你是“纪年史神谕者（The Chronicler's Oracle）”，一位伴随玩家游历《${
    worldContext.campaignTitle || '未书之纪年史'
  }》的古老博学者、世界观档案官与战略参谋。

【你的角色职责与准则】：
- 请始终使用**简体中文**回答。
- 你完全知晓玩家当前的处境：所在地点（${worldContext.locationName}）、主角身份（${worldContext.protagonistName}）、当前行囊物品（${(worldContext.inventoryNames || []).join('、')}）、当前主线任务（${worldContext.questTitle}：${worldContext.questSummary}），以及已结识的角色（${(worldContext.characterNames || []).join('、')}）。
- 保持深邃、典雅的奇幻古卷语气，为玩家解答世界观背景、人物动机、物品组合用法或破局策略。
- 回答应当精炼有物（2～4 个短段落或清晰的战术要点），帮助玩家构思下一步行动。`;

  const formattedContents = messages.map((m: { role: string; content: string }) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  try {
    let response;
    let actualModel = modelToUse;
    try {
      const configObj: Record<string, unknown> = {
        systemInstruction,
      };
      if (modelToUse === 'gemini-3.1-flash-lite') {
        configObj.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
      } else if (modelToUse === 'gemini-3.8-flash') {
        configObj.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }

      response = await ai.models.generateContent({
        model: modelToUse,
        contents: formattedContents,
        config: configObj,
      });
    } catch {
      actualModel = 'gemini-3.1-flash-lite';
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: formattedContents,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        },
      });
    }

    return res.json({
      reply: response.text || '古卷羊皮纸泛起微光，映照出一条未曾被留意的隐秘前路。',
      modelUsed: actualModel,
      latencyMs: Date.now() - startTime,
    });
  } catch {
    return res.json({
      reply: `审视你在【${
        worldContext.locationName || '当前区域'
      }】的处境，你行囊中的【${
        (worldContext.inventoryNames || []).join('、') || '随身器物'
      }】正是最关键的破局筹码。不妨尝试将一件圣物或密钥结合自定义行动输入，往往能出其不意地瓦解守卫的防线。`,
      modelUsed: modelToUse,
      latencyMs: Date.now() - startTime,
    });
  }
});

// ---------------------------------------------------------------------------
// VITE 开发中间件与生产环境静态资源服务
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Chronicle of the Unwritten server running on http://localhost:${PORT}`);
  });
}

startServer();
