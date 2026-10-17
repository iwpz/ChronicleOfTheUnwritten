import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Zap,
  MessageSquare,
  Send,
  Volume2,
  VolumeX,
  Eye,
  ChevronRight,
  Compass,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import {
  ArtStylePreset,
  CampaignPreset,
  CausalConsequenceEntry,
  CharacterDNA,
  FastInspectResponse,
  GameState,
  ImageSizeOption,
  InventoryItem,
  ItemCategory,
  OracleMessage,
  OracleModelOption,
  QuestState,
  QuestStatus,
  StoryChoice,
  StoryTurnNode,
} from './types/game';
import { ART_STYLE_PRESETS, CAMPAIGN_PRESETS } from './data/campaigns';
import { buildDynamicSceneSvgDataUri } from './utils/sceneArtworkSvg';
import { soundFx } from './utils/soundEffects';
import { DynamicCodexSidebar } from './components/DynamicCodexSidebar';
import { OracleChatDrawer } from './components/OracleChatDrawer';
import { WorldDnaModal } from './components/WorldDnaModal';

function createInitialTurnFromCampaign(
  campaign: CampaignPreset,
  artStyle: ArtStylePreset
): StoryTurnNode {
  const composedPrompt = `${artStyle.stylePrompt} 场景画面: ${campaign.openingVisualScenePrompt}. 恒定角色外观锁定: [主角视觉基因 - ${campaign.protagonist.name}]: ${campaign.protagonist.visualDna} | [同伴视觉基因 - ${campaign.initialCompanion.name}]: ${campaign.initialCompanion.visualDna}. Masterpiece composition, no text or watermarks.`;

  const initialSvgUri = buildDynamicSceneSvgDataUri({
    locationName: campaign.startingLocation,
    timeOfDay: campaign.startingTime,
    scenePrompt: campaign.openingVisualScenePrompt,
    artStyleId: artStyle.id,
    characterNames: [campaign.protagonist.name, campaign.initialCompanion.name],
    turnNumber: 1,
  });

  return {
    turnNumber: 1,
    chapterTitle: campaign.openingChapterTitle,
    locationName: campaign.startingLocation,
    timeOfDay: campaign.startingTime,
    narrativeParagraphs: campaign.openingParagraphs,
    causalRippleNote: campaign.openingCausalNote,
    visualScenePrompt: campaign.openingVisualScenePrompt,
    composedImagePrompt: composedPrompt,
    imageUrl: initialSvgUri,
    imageResolution: '1K',
    imageModelUsed: '木刻古卷图版 · 就绪 (gemini-3-pro-image-preview)',
    presentCharacterIds: [campaign.protagonist.id, campaign.initialCompanion.id],
    choices: campaign.initialChoices,
    sidebarAuditLog: [
      `已加载 ${campaign.initialInventory.length} 件初始行囊物品`,
      `已激活主线任务：《${campaign.initialQuest.title}》`,
      `已锁定 ${campaign.protagonist.name} 与 ${campaign.initialCompanion.name} 的角色视觉基因`,
    ],
  };
}

export default function App() {
  const defaultCampaign = CAMPAIGN_PRESETS[0];
  const defaultArtStyle =
    ART_STYLE_PRESETS.find((s) => s.id === defaultCampaign.artStyleId) ||
    ART_STYLE_PRESETS[0];

  const [gameState, setGameState] = useState<GameState>('PLAYING');
  const [activeCampaign, setActiveCampaign] =
    useState<CampaignPreset>(defaultCampaign);
  const [selectedArtStyle, setSelectedArtStyle] =
    useState<ArtStylePreset>(defaultArtStyle);

  // 主角自定义状态（在“开启新纪年”面板中可随时编辑）
  const [customProtagonistName, setCustomProtagonistName] = useState(
    defaultCampaign.protagonist.name
  );
  const [customProtagonistRole, setCustomProtagonistRole] = useState(
    defaultCampaign.protagonist.role
  );
  const [customProtagonistDna, setCustomProtagonistDna] = useState(
    defaultCampaign.protagonist.visualDna
  );

  // 核心动态故事状态
  const [characters, setCharacters] = useState<CharacterDNA[]>([
    defaultCampaign.protagonist,
    defaultCampaign.initialCompanion,
  ]);
  const [inventory, setInventory] = useState<InventoryItem[]>(
    defaultCampaign.initialInventory
  );
  const [currentQuest, setCurrentQuest] = useState<QuestState>(
    defaultCampaign.initialQuest
  );
  const [causalLedger, setCausalLedger] = useState<CausalConsequenceEntry[]>([
    {
      turnNumber: 1,
      choiceTaken: '踏入纪年史起点',
      narrativeImpact: defaultCampaign.openingCausalNote,
      location: defaultCampaign.startingLocation,
    },
  ]);
  const [storyTurns, setStoryTurns] = useState<StoryTurnNode[]>([
    createInitialTurnFromCampaign(defaultCampaign, defaultArtStyle),
  ]);

  // 场景插画生成控制 (gemini-3-pro-image-preview: 1K, 2K, 4K)
  const [selectedImageSize, setSelectedImageSize] =
    useState<ImageSizeOption>('1K');
  const [autoGenerateImages, setAutoGenerateImages] = useState<boolean>(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [imageStatusNotice, setImageStatusNotice] = useState<string | null>(null);
  const [showDnaPromptPreview, setShowDnaPromptPreview] =
    useState<boolean>(false);

  // 回合推进与自定义行动控制
  const [isGeneratingTurn, setIsGeneratingTurn] = useState<boolean>(false);
  const [customActionInput, setCustomActionInput] = useState<string>('');
  const [lastTurnLatencyMs, setLastTurnLatencyMs] = useState<number | null>(null);
  const [lastTurnModel, setLastTurnModel] = useState<string>('gemini-4-argon');

  // 低延迟极速洞察状态 (gemini-3.1-flash-lite)
  const [inspectResult, setInspectResult] =
    useState<FastInspectResponse | null>(null);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);

  // 多轮神谕问答机器人状态
  const [isOracleOpen, setIsOracleOpen] = useState<boolean>(false);
  const [oracleModel, setOracleModel] =
    useState<OracleModelOption>('gemini-3.8-flash');
  const [isSendingOracle, setIsSendingOracle] = useState<boolean>(false);
  const [oracleMessages, setOracleMessages] = useState<OracleMessage[]>([
    {
      id: 'msg_welcome',
      role: 'model',
      content:
        '我是执掌未书之叶的“纪年史神谕者”。你可以随时向我询问此地的历史秘辛、在场人物的真实意图，或探讨如何组合行囊中的器物来开辟意想不到的剧情分支。',
      timestamp: '纪年史开启',
      modelUsed: 'gemini-3.8-flash',
    },
  ]);

  // 弹窗与音效控制
  const [worldModalOpen, setWorldModalOpen] = useState<boolean>(false);
  const [worldModalTab, setWorldModalTab] = useState<'dna' | 'ledger'>('dna');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const latestTurn = storyTurns[storyTurns.length - 1];
  const storyBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (storyTurns.length > 1) {
      storyBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [storyTurns.length]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundFx.muted = next;
  };

  // 启动或重置剧本世界
  const handleLaunchCampaign = (campaign: CampaignPreset) => {
    const artPreset =
      ART_STYLE_PRESETS.find((a) => a.id === campaign.artStyleId) ||
      selectedArtStyle;

    const customizedProtagonist: CharacterDNA = {
      ...campaign.protagonist,
      name: customProtagonistName.trim() || campaign.protagonist.name,
      role: customProtagonistRole.trim() || campaign.protagonist.role,
      visualDna: customProtagonistDna.trim() || campaign.protagonist.visualDna,
    };

    const updatedCampaign: CampaignPreset = {
      ...campaign,
      protagonist: customizedProtagonist,
    };

    setActiveCampaign(updatedCampaign);
    setSelectedArtStyle(artPreset);
    setCharacters([customizedProtagonist, updatedCampaign.initialCompanion]);
    setInventory(updatedCampaign.initialInventory);
    setCurrentQuest(updatedCampaign.initialQuest);
    setCausalLedger([
      {
        turnNumber: 1,
        choiceTaken: '踏上新的纪年征途',
        narrativeImpact: updatedCampaign.openingCausalNote,
        location: updatedCampaign.startingLocation,
      },
    ]);
    const firstTurn = createInitialTurnFromCampaign(updatedCampaign, artPreset);
    setStoryTurns([firstTurn]);
    setInspectResult(null);
    setImageStatusNotice(null);
    setGameState('PLAYING');
    soundFx.playChoiceCommit();
  };

  // 触发实时 Gemini 3 Pro Image 场景插画生成 (1K, 2K, 4K)
  const handleGenerateSceneImage = async (
    targetTurnNumber?: number,
    overridePrompt?: string,
    overrideSize?: ImageSizeOption
  ) => {
    const turnToUpdate =
      storyTurns.find((t) => t.turnNumber === targetTurnNumber) || latestTurn;
    if (!turnToUpdate) return;

    const sizeToUse = overrideSize || selectedImageSize;
    const promptToUse = overridePrompt || turnToUpdate.composedImagePrompt;

    setIsGeneratingImage(true);
    setImageStatusNotice(null);

    try {
      const response = await fetch('/api/story/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          imageSize: sizeToUse,
          aspectRatio: '16:9',
        }),
      });
      const data = await response.json();

      if (data.imageUrl) {
        setStoryTurns((prev) =>
          prev.map((t) =>
            t.turnNumber === turnToUpdate.turnNumber
              ? {
                  ...t,
                  imageUrl: data.imageUrl,
                  imageResolution: sizeToUse,
                  imageModelUsed: `${data.modelUsed} (${sizeToUse})`,
                }
              : t
          )
        );
        setImageStatusNotice(null);
      } else if (data.fallbackUsed) {
        setStoryTurns((prev) =>
          prev.map((t) =>
            t.turnNumber === turnToUpdate.turnNumber
              ? {
                  ...t,
                  imageResolution: sizeToUse,
                  imageModelUsed: `木刻古卷图版 (已设为 ${sizeToUse} 规格)`,
                }
              : t
          )
        );
        setImageStatusNotice(data.notice || null);
      }
    } catch {
      setImageStatusNotice(
        '暂时无法连接图像生成服务，当前展示已同步角色基因的木刻古卷图版。'
      );
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 提交玩家的抉择或自定义行动，推进无限剧情
  const handleCommitAction = async (actionLabel: string) => {
    if (!actionLabel.trim() || isGeneratingTurn) return;
    soundFx.playChoiceCommit();
    setIsGeneratingTurn(true);
    setCustomActionInput('');

    const nextTurnNumber = storyTurns.length + 1;
    const protagonist =
      characters.find((c) => c.isProtagonist) || characters[0];

    try {
      const response = await fetch('/api/story/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignTitle: activeCampaign.title,
          campaignGenre: activeCampaign.genre,
          artStylePrompt: selectedArtStyle.stylePrompt,
          turnNumber: nextTurnNumber,
          playerAction: actionLabel,
          protagonist,
          characters,
          inventory,
          currentQuest,
          causalHistory: causalLedger.slice(-6),
          recentNarrative: latestTurn.narrativeParagraphs,
        }),
      });

      const data = await response.json();
      setLastTurnLatencyMs(data.latencyMs || null);
      setLastTurnModel(data.modelUsed || 'gemini-4-argon');

      // 1. 自动同步行囊物品（新增获得物品、扣除消耗物品）
      let updatedInventory = [...inventory];
      if (Array.isArray(data.itemsRemovedByName) && data.itemsRemovedByName.length > 0) {
        const removeSet = new Set(
          data.itemsRemovedByName.map((n: string) => n.toLowerCase())
        );
        updatedInventory = updatedInventory
          .map((item) => {
            if (removeSet.has(item.name.toLowerCase())) {
              return { ...item, quantity: item.quantity - 1 };
            }
            return item;
          })
          .filter((item) => item.quantity > 0);
      }

      if (Array.isArray(data.itemsAdded) && data.itemsAdded.length > 0) {
        soundFx.playItemAcquired();
        for (const added of data.itemsAdded) {
          const existingIdx = updatedInventory.findIndex(
            (i) => i.name.toLowerCase() === added.name.toLowerCase()
          );
          if (existingIdx >= 0) {
            updatedInventory[existingIdx] = {
              ...updatedInventory[existingIdx],
              quantity:
                updatedInventory[existingIdx].quantity + (added.quantity || 1),
              acquiredTurn: nextTurnNumber,
            };
          } else {
            const validCategories: ItemCategory[] = [
              '兵器',
              '圣物',
              '消耗品',
              '密钥',
              '卷宗',
              '奇物',
            ];
            const cat: ItemCategory = validCategories.includes(added.category)
              ? added.category
              : '圣物';
            updatedInventory.unshift({
              id: `item_${nextTurnNumber}_${Math.random().toString(36).slice(2, 7)}`,
              name: added.name,
              category: cat,
              quantity: added.quantity || 1,
              description: added.description,
              visualTag: added.visualTag || added.name,
              acquiredTurn: nextTurnNumber,
            });
          }
        }
      }
      setInventory(updatedInventory);

      // 2. 自动同步角色视觉基因库（Character Visual DNA）
      const updatedChars = [...characters];
      if (Array.isArray(data.characterUpdates)) {
        for (const cu of data.characterUpdates) {
          const existingIdx = updatedChars.findIndex(
            (c) => c.name.toLowerCase() === cu.name.toLowerCase()
          );
          if (existingIdx >= 0) {
            updatedChars[existingIdx] = {
              ...updatedChars[existingIdx],
              role: cu.role || updatedChars[existingIdx].role,
              attitude: cu.attitude || updatedChars[existingIdx].attitude,
              visualDna: cu.visualDna || updatedChars[existingIdx].visualDna,
              lastSeenTurn: nextTurnNumber,
            };
          } else {
            updatedChars.push({
              id: `char_${nextTurnNumber}_${Math.random().toString(36).slice(2, 6)}`,
              name: cu.name,
              role: cu.role || '奇遇人物',
              attitude: cu.attitude || '中立审视',
              visualDna: cu.visualDna,
              firstMetTurn: nextTurnNumber,
              lastSeenTurn: nextTurnNumber,
            });
          }
        }
      }
      setCharacters(updatedChars);

      // 3. 自动同步当前任务与子目标
      if (data.questUpdate && data.questUpdate.title) {
        const validStatuses: QuestStatus[] = ['进行中', '已完成', '已失败'];
        const statusVal: QuestStatus = validStatuses.includes(
          data.questUpdate.status
        )
          ? data.questUpdate.status
          : '进行中';
        setCurrentQuest({
          id: `quest_${nextTurnNumber}`,
          title: data.questUpdate.title,
          summary: data.questUpdate.summary || currentQuest.summary,
          giverOrSource:
            data.questUpdate.giverOrSource || currentQuest.giverOrSource,
          status: statusVal,
          updatedTurn: nextTurnNumber,
          objectives: Array.isArray(data.questUpdate.objectives)
            ? data.questUpdate.objectives.map(
                (o: { text: string; completed: boolean }, idx: number) => ({
                  id: `obj_${nextTurnNumber}_${idx}`,
                  text: o.text,
                  completed: Boolean(o.completed),
                })
              )
            : currentQuest.objectives,
        });
      }

      // 4. 记录因果剧情账本
      setCausalLedger((prev) => [
        ...prev,
        {
          turnNumber: nextTurnNumber,
          choiceTaken: actionLabel,
          narrativeImpact:
            data.causalRippleNote ||
            '改变了当前章节的局势平衡与后续剧情分支。',
          location: data.locationName || latestTurn.locationName,
        },
      ]);

      // 5. 生成本回合即时木刻图版
      const immediateSvgUri = buildDynamicSceneSvgDataUri({
        locationName: data.locationName || latestTurn.locationName,
        timeOfDay: data.timeOfDay || latestTurn.timeOfDay,
        scenePrompt: data.visualScenePrompt || actionLabel,
        artStyleId: selectedArtStyle.id,
        characterNames: data.presentCharacterNames || [protagonist.name],
        turnNumber: nextTurnNumber,
      });

      const formattedChoices: StoryChoice[] = Array.isArray(data.choices)
        ? data.choices.map(
            (
              c: {
                label: string;
                intent: string;
                consequenceHint: string;
                requiredItemName?: string;
              },
              idx: number
            ) => ({
              id: `choice_${nextTurnNumber}_${idx}`,
              label: c.label,
              intent: c.intent || '分支抉择',
              consequenceHint: c.consequenceHint || '将改变后续剧情走向。',
              requiredItemName:
                c.requiredItemName && c.requiredItemName.trim() !== ''
                  ? c.requiredItemName
                  : undefined,
            })
          )
        : [];

      const newTurnNode: StoryTurnNode = {
        turnNumber: nextTurnNumber,
        chapterTitle: data.chapterTitle || `第 ${nextTurnNumber} 章`,
        locationName: data.locationName || latestTurn.locationName,
        timeOfDay: data.timeOfDay || latestTurn.timeOfDay,
        playerActionLabel: actionLabel,
        narrativeParagraphs: Array.isArray(data.narrativeParagraphs)
          ? data.narrativeParagraphs
          : [String(data.narrativeParagraphs || '')],
        causalRippleNote:
          data.causalRippleNote ||
          '你的抉择重塑了接下来的故事走向。',
        visualScenePrompt: data.visualScenePrompt || actionLabel,
        composedImagePrompt:
          data.composedImagePrompt ||
          `${selectedArtStyle.stylePrompt} 场景画面: ${data.visualScenePrompt}`,
        imageUrl: immediateSvgUri,
        imageResolution: selectedImageSize,
        imageModelUsed: '木刻古卷图版 · 已同步角色基因',
        presentCharacterIds: updatedChars.map((c) => c.id),
        choices: formattedChoices,
        sidebarAuditLog: Array.isArray(data.sidebarAuditLog)
          ? data.sidebarAuditLog
          : ['已自动同步行囊物品与任务目标'],
      };

      setStoryTurns((prev) => [...prev, newTurnNode]);

      // 若开启回合自动绘图，则调用 gemini-3-pro-image-preview
      if (autoGenerateImages) {
        handleGenerateSceneImage(
          nextTurnNumber,
          newTurnNode.composedImagePrompt,
          selectedImageSize
        );
      }
    } finally {
      setIsGeneratingTurn(false);
    }
  };

  // 低延迟极速洞察 (gemini-3.1-flash-lite)
  const handleFastInspect = async (
    subject: string,
    subjectType: '物品' | '角色' | '任务',
    contextDescription: string
  ) => {
    soundFx.playInspectPulse();
    setIsInspecting(true);
    try {
      const response = await fetch('/api/story/fast-inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          subjectType,
          contextDescription,
          locationName: latestTurn.locationName,
          questTitle: currentQuest.title,
        }),
      });
      const data = await response.json();
      setInspectResult(data);
    } finally {
      setIsInspecting(false);
    }
  };

  // 将行囊中的某件物品直接填入自定义行动栏
  const handleUseItemInStory = (item: InventoryItem) => {
    const actionString = `取出行囊中的【${item.name}】（${item.category}），在${latestTurn.locationName}加以运用以改变当前局势`;
    setCustomActionInput(actionString);
  };

  // 手动编辑更新角色视觉基因描述
  const handleUpdateCharacterDna = (charId: string, newDna: string) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === charId ? { ...c, visualDna: newDna } : c))
    );
  };

  // 发送消息至多轮神谕问答机器人
  const handleSendOracleMessage = async (
    content: string,
    modelToUse: OracleModelOption
  ) => {
    const userMsg: OracleMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      timestamp: `第 ${latestTurn.turnNumber} 回合`,
    };
    const updatedHistory = [...oracleMessages, userMsg];
    setOracleMessages(updatedHistory);
    setIsSendingOracle(true);

    try {
      const protagonist =
        characters.find((c) => c.isProtagonist) || characters[0];
      const response = await fetch('/api/chat/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          selectedModel: modelToUse,
          worldContext: {
            campaignTitle: activeCampaign.title,
            locationName: latestTurn.locationName,
            protagonistName: protagonist?.name,
            inventoryNames: inventory.map((i) => `${i.name} (x${i.quantity})`),
            questTitle: currentQuest.title,
            questSummary: currentQuest.summary,
            characterNames: characters.map((c) => `${c.name}（${c.role}）`),
          },
        }),
      });
      const data = await response.json();
      const botMsg: OracleMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        content: data.reply,
        timestamp: `第 ${latestTurn.turnNumber} 回合`,
        modelUsed: data.modelUsed || modelToUse,
        latencyMs: data.latencyMs,
      };
      setOracleMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsSendingOracle(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0D0E12] text-[#F3EFE6]">
      {/* 顶部导航栏：严格遵循三区布局契约 */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 border-b border-[#262936] bg-[#0D0E12]/95 px-6 py-4 backdrop-blur-xs">
        {/* 第一区：单行品牌字标 */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setGameState('PLAYING');
          }}
          className="font-display text-lg font-bold tracking-tight text-[#F3EFE6] whitespace-nowrap shrink-0"
        >
          未书之纪年史
        </a>

        {/* 第二区：4 个单行文字导航链接 */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#9E988E]">
          <button
            type="button"
            onClick={() => setGameState('PLAYING')}
            className={`hover:text-[#F3EFE6] transition-colors whitespace-nowrap shrink-0 ${
              gameState === 'PLAYING'
                ? 'text-[#F3EFE6] underline underline-offset-8 decoration-[#D4A359]'
                : ''
            }`}
          >
            当前纪年
          </button>
          <button
            type="button"
            onClick={() => {
              setWorldModalTab('dna');
              setWorldModalOpen(true);
            }}
            className="hover:text-[#F3EFE6] transition-colors whitespace-nowrap shrink-0"
          >
            视觉基因
          </button>
          <button
            type="button"
            onClick={() => {
              setWorldModalTab('ledger');
              setWorldModalOpen(true);
            }}
            className="hover:text-[#F3EFE6] transition-colors whitespace-nowrap shrink-0"
          >
            因果账本
          </button>
          <button
            type="button"
            onClick={() => setIsOracleOpen(true)}
            className="hover:text-[#F3EFE6] transition-colors whitespace-nowrap shrink-0"
          >
            垂询神谕
          </button>
        </nav>

        {/* 第三区：唯一主操作按钮 */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() =>
              setGameState(gameState === 'TITLE_MENU' ? 'PLAYING' : 'TITLE_MENU')
            }
            className="rounded-lg bg-[#D4A359] px-4 py-2 text-xs font-semibold text-[#0D0E12] transition-colors hover:bg-[#E2B56F] whitespace-nowrap shrink-0"
          >
            {gameState === 'TITLE_MENU' ? '返回当前故事' : '开启新纪年'}
          </button>
        </div>
      </header>

      {/* 状态一：剧本世界选择与主角视觉基因定制 */}
      {gameState === 'TITLE_MENU' ? (
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#D4A359]">
              无限互动文字冒险引擎 · 恒定角色视觉基因（Visual DNA）
            </p>
            <h1
              className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#F3EFE6]"
              style={{ textWrap: 'balance' }}
            >
              抉择你的开篇疆域，锁定主角的恒定外貌基因
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#9E988E]">
              你的每一次抉择都将真实重构后续剧情走向，绝无预设固定结局。请在下方选择一处开篇世界，自定义主角的外貌与随身特征，使角色在每一幅实时生成的场景插画中保持统一形象。
            </p>
          </div>

          {/* 剧本卡片列表 */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {CAMPAIGN_PRESETS.map((camp) => {
              const isSelected = camp.id === activeCampaign.id;
              const previewSvg = buildDynamicSceneSvgDataUri({
                locationName: camp.startingLocation,
                timeOfDay: camp.startingTime,
                scenePrompt: camp.openingVisualScenePrompt,
                artStyleId: camp.artStyleId,
                characterNames: [camp.protagonist.name, camp.initialCompanion.name],
                turnNumber: 1,
              });

              return (
                <div
                  key={camp.id}
                  className={`flex flex-col justify-between rounded-2xl border overflow-hidden transition-colors ${
                    isSelected
                      ? 'border-[#D4A359] bg-[#161922]'
                      : 'border-[#262936] bg-[#13151B] hover:border-[#3A3F52]'
                  }`}
                >
                  <div>
                    <div className="relative aspect-video w-full overflow-hidden bg-[#0D0E12]">
                      <img
                        src={previewSvg}
                        alt={camp.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#13151B] via-transparent to-transparent" />
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs text-[#9E988E]">
                        <span>{camp.genre}</span>
                        <span aria-hidden="true">·</span>
                        <span>{camp.startingLocation}</span>
                      </div>

                      <h2 className="mt-1.5 font-display text-xl font-semibold text-[#F3EFE6]">
                        {camp.title}
                      </h2>
                      <p className="mt-2 text-xs leading-relaxed text-[#9E988E]">
                        {camp.tagline}
                      </p>

                      <div className="mt-4 pt-3 border-t border-[#262936] text-xs text-[#9E988E] space-y-1">
                        <div>
                          <strong className="text-[#F3EFE6]">主角：</strong>{' '}
                          {camp.protagonist.name} · {camp.protagonist.role}
                        </div>
                        <div>
                          <strong className="text-[#F3EFE6]">初始同伴：</strong>{' '}
                          {camp.initialCompanion.name} · {camp.initialCompanion.role}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCampaign(camp);
                        setCustomProtagonistName(camp.protagonist.name);
                        setCustomProtagonistRole(camp.protagonist.role);
                        setCustomProtagonistDna(camp.protagonist.visualDna);
                      }}
                      className={`w-full rounded-lg py-2.5 px-4 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'bg-[#D4A359] text-[#0D0E12]'
                          : 'border border-[#262936] bg-[#181B24] text-[#F3EFE6] hover:border-[#D4A359]'
                      }`}
                    >
                      {isSelected ? '当前已选疆域' : '选择此疆域'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 主角视觉基因定制面板 */}
          <div className="mt-8 rounded-2xl border border-[#262936] bg-[#13151B] p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-[#F3EFE6]">
                    定制主角视觉基因（《{activeCampaign.title}》）
                  </h2>
                  <p className="mt-0.5 text-xs text-[#9E988E]">
                    以下外貌与衣着描述将永久锁定在每一幕场景插画提示词中，保证你的角色在整个旅途中形象始终如一。
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-[#9E988E]">
                      主角姓名
                    </label>
                    <input
                      type="text"
                      value={customProtagonistName}
                      onChange={(e) => setCustomProtagonistName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#262936] bg-[#0D0E12] px-3.5 py-2 text-sm text-[#F3EFE6] focus:border-[#D4A359] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#9E988E]">
                      身份头衔
                    </label>
                    <input
                      type="text"
                      value={customProtagonistRole}
                      onChange={(e) => setCustomProtagonistRole(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#262936] bg-[#0D0E12] px-3.5 py-2 text-sm text-[#F3EFE6] focus:border-[#D4A359] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#9E988E]">
                    恒定外貌特征描述（发色、瞳色、服饰、标志性随身器物）
                  </label>
                  <textarea
                    rows={2}
                    value={customProtagonistDna}
                    onChange={(e) => setCustomProtagonistDna(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#262936] bg-[#0D0E12] p-3 font-mono text-xs text-[#F3EFE6] focus:border-[#D4A359] focus:outline-none"
                  />
                </div>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => handleLaunchCampaign(activeCampaign)}
                  className="flex items-center gap-2 rounded-xl bg-[#D4A359] px-6 py-3.5 text-sm font-semibold text-[#0D0E12] hover:bg-[#E2B56F] transition-colors whitespace-nowrap shrink-0"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>正式开启纪年史</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* 状态二：双栏互动古卷主界面 */
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col lg:flex-row">
          {/* 左侧主叙事与场景插画舞台 */}
          <main className="flex-1 px-5 py-6 sm:px-8 lg:max-w-[calc(100%-390px)]">
            {/* 工作区状态与快捷工具条 */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#262936] pb-3.5 text-xs text-[#9E988E]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#F3EFE6]">
                  {activeCampaign.title}
                </span>
                <span aria-hidden="true">·</span>
                <span>{latestTurn.locationName}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  第 {latestTurn.turnNumber} 回合
                </span>
                {lastTurnLatencyMs !== null && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {lastTurnModel} ({lastTurnLatencyMs}ms)
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    handleFastInspect(
                      latestTurn.locationName,
                      '任务',
                      latestTurn.narrativeParagraphs.join(' ')
                    )
                  }
                  className="flex items-center gap-1.5 rounded-lg border border-[#262936] bg-[#13151B] px-3 py-1.5 text-xs font-medium text-[#D4A359] hover:border-[#D4A359]/60 transition-colors whitespace-nowrap shrink-0"
                  title="调用 gemini-3.1-flash-lite 对当前环境进行极速低延迟战术侦察"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>极速侦察环境 (Lite)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOracleOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-[#262936] bg-[#13151B] px-3 py-1.5 text-xs font-medium text-[#F3EFE6] hover:border-[#D4A359]/60 transition-colors whitespace-nowrap shrink-0"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-[#D4A359]" />
                  <span>垂询神谕者</span>
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="rounded-lg border border-[#262936] bg-[#13151B] p-1.5 text-[#9E988E] hover:text-[#F3EFE6]"
                  aria-label={isMuted ? '取消静音' : '静音'}
                  title={isMuted ? '开启古卷音效' : '关闭古卷音效'}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* 场景插画舞台 + GEMINI-3-PRO-IMAGE-PREVIEW 分辨率选择器 (1K, 2K, 4K) */}
            <section
              aria-label="场景插画舞台"
              className="overflow-hidden rounded-2xl border border-[#262936] bg-[#13151B]"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-[#0D0E12]">
                {latestTurn.imageUrl ? (
                  <img
                    src={latestTurn.imageUrl}
                    alt={`${latestTurn.chapterTitle} - ${latestTurn.visualScenePrompt}`}
                    referrerPolicy="no-referrer"
                    className={`h-full w-full object-cover transition-opacity duration-300 ${
                      isGeneratingImage ? 'opacity-50' : 'opacity-100'
                    }`}
                  />
                ) : null}

                {/* 渐变暗角保障文字对比度 */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {isGeneratingImage && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-xs">
                    <Sparkles className="h-7 w-7 text-[#D4A359]" />
                    <p className="mt-2 font-display text-sm font-semibold text-[#F3EFE6]">
                      正在以 {selectedImageSize} 分辨率绘制场景插画...
                    </p>
                    <p className="mt-1 text-xs text-[#9E988E]">
                      gemini-3-pro-image-preview · 已锁定角色视觉基因
                    </p>
                  </div>
                )}

                {/* 画面底部章节铭文 */}
                <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-end justify-between gap-4 p-5">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#F3EFE6]/80">
                      <span>{latestTurn.locationName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{latestTurn.timeOfDay}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11px] text-[#D4A359]">
                        {latestTurn.imageModelUsed}
                      </span>
                    </div>
                    <h1 className="mt-1 font-display text-xl sm:text-2xl font-bold text-[#F3EFE6]">
                      {latestTurn.chapterTitle}
                    </h1>
                  </div>
                </div>
              </div>

              {/* 图像生成工具栏：1K | 2K | 4K 分辨率切换 + 实时生成按钮 + 视觉基因提示词预览 */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#262936] bg-[#151821] px-5 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-medium text-[#9E988E]">
                    画质尺寸 (gemini-3-pro-image-preview)：
                  </span>
                  <div
                    className="inline-flex items-center gap-1 rounded-lg bg-[#0D0E12] p-1"
                    role="group"
                    aria-label="选择插画分辨率尺寸"
                  >
                    {(['1K', '2K', '4K'] as ImageSizeOption[]).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedImageSize(size)}
                        className={`rounded-md px-2.5 py-1 font-mono text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                          selectedImageSize === size
                            ? 'bg-[#D4A359] text-[#0D0E12] font-semibold'
                            : 'text-[#9E988E] hover:text-[#F3EFE6]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={isGeneratingImage}
                    onClick={() =>
                      handleGenerateSceneImage(
                        latestTurn.turnNumber,
                        latestTurn.composedImagePrompt,
                        selectedImageSize
                      )
                    }
                    className="flex items-center gap-1.5 rounded-lg bg-[#D4A359] px-3.5 py-1.5 text-xs font-semibold text-[#0D0E12] hover:bg-[#E2B56F] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>生成 {selectedImageSize} 场景插画</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-[#9E988E]">
                    <input
                      type="checkbox"
                      checked={autoGenerateImages}
                      onChange={(e) => setAutoGenerateImages(e.target.checked)}
                      className="rounded border-[#262936] bg-[#0D0E12] accent-[#D4A359]"
                    />
                    <span className="whitespace-nowrap shrink-0">
                      推进回合时自动绘图
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setShowDnaPromptPreview(!showDnaPromptPreview)
                    }
                    className="flex items-center gap-1 text-xs font-medium text-[#9E988E] hover:text-[#F3EFE6] whitespace-nowrap shrink-0"
                  >
                    <Eye className="h-3.5 w-3.5 text-[#D4A359]" />
                    <span>
                      {showDnaPromptPreview ? '隐藏基因提示词' : '查看视觉基因提示词'}
                    </span>
                  </button>
                </div>
              </div>

              {/* 图像生成状态提示条 */}
              {imageStatusNotice && (
                <div className="border-t border-[#262936] bg-[#191C26] px-5 py-2 text-xs text-[#9E988E] flex items-center justify-between gap-2">
                  <span>{imageStatusNotice}</span>
                  <button
                    type="button"
                    onClick={() => setImageStatusNotice(null)}
                    className="text-[#D4A359] hover:underline whitespace-nowrap shrink-0"
                  >
                    知道了
                  </button>
                </div>
              )}

              {/* 展开查看完整画风与角色基因合成提示词 */}
              {showDnaPromptPreview && (
                <div className="border-t border-[#262936] bg-[#0D0E12] px-5 py-3.5 text-xs">
                  <div className="font-medium text-[#D4A359]">
                    已合成的恒定画风 + 在场角色视觉基因（Visual DNA）完整提示词：
                  </div>
                  <p className="mt-1 font-mono text-[11px] leading-relaxed text-[#9E988E]">
                    {latestTurn.composedImagePrompt}
                  </p>
                </div>
              )}
            </section>

            {/* 纪年史叙事正文流 */}
            <section
              aria-label="纪年史剧情正文"
              className="mt-8 space-y-8"
            >
              {storyTurns.map((turn, index) => {
                const isCurrentTurn = index === storyTurns.length - 1;
                return (
                  <article
                    key={turn.turnNumber}
                    className={`rounded-2xl border p-6 sm:p-8 transition-colors ${
                      isCurrentTurn
                        ? 'border-[#262936] bg-[#13151B]'
                        : 'border-[#262936]/50 bg-[#13151B]/60 opacity-85'
                    }`}
                  >
                    {/* 回合头部元数据 */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262936] pb-3.5">
                      <div className="flex items-center gap-2 text-xs text-[#9E988E]">
                        <span className="font-mono font-semibold text-[#D4A359] tabular-nums">
                          第 {String(turn.turnNumber).padStart(2, '0')} 回合
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{turn.chapterTitle}</span>
                        <span aria-hidden="true">·</span>
                        <span>{turn.locationName}</span>
                      </div>
                      <span className="text-xs text-[#9E988E]">
                        {turn.timeOfDay}
                      </span>
                    </div>

                    {/* 触发本回合的玩家抉择 */}
                    {turn.playerActionLabel && (
                      <div className="mt-4 rounded-xl border border-[#262936] bg-[#0D0E12] px-4 py-3 text-xs">
                        <span className="text-[#9E988E]">你的抉择：</span>
                        <span className="font-medium text-[#D4A359]">
                          “{turn.playerActionLabel}”
                        </span>
                      </div>
                    )}

                    {/* 叙事正文段落 */}
                    <div className="mt-5 max-w-[70ch] space-y-4 font-serif text-[17px] leading-[1.8] text-[#F3EFE6]">
                      {turn.narrativeParagraphs.map((para, pIdx) => (
                        <p key={pIdx}>{para}</p>
                      ))}
                    </div>

                    {/* 因果剧情涟漪记录 */}
                    <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-[#262936] bg-[#171A24] p-3.5 text-xs text-[#9E988E]">
                      <Compass className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A359]" />
                      <div>
                        <strong className="text-[#F3EFE6]">
                          因果剧情涟漪：
                        </strong>{' '}
                        {turn.causalRippleNote}
                      </div>
                    </div>
                  </article>
                );
              })}
              <div ref={storyBottomRef} />
            </section>

            {/* 互动抉择面板与自由行动输入框 */}
            <section
              aria-label="选择你的下一步行动"
              className="mt-8 rounded-2xl border border-[#262936] bg-[#13151B] p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-semibold text-[#F3EFE6]">
                    接下来你将如何抉择？
                  </h2>
                  <p className="mt-0.5 text-xs text-[#9E988E]">
                    从下方分支路径中选择一项，或直接输入任何自定义行动。你的选择将永久改变后续情节，并由 AI 自动更新行囊与当前任务。
                  </p>
                </div>
                {isGeneratingTurn && (
                  <span className="text-xs font-medium text-[#D4A359]">
                    正在推演因果分支并同步世界状态...
                  </span>
                )}
              </div>

              {/* 分支选项列表 */}
              <div className="mt-5 space-y-3">
                {latestTurn.choices.map((choice, cIdx) => {
                  const hasRequiredItem = choice.requiredItemName
                    ? inventory.some(
                        (i) =>
                          i.name.toLowerCase() ===
                          choice.requiredItemName!.toLowerCase()
                      )
                    : true;

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={isGeneratingTurn}
                      onClick={() => handleCommitAction(choice.label)}
                      className="group flex w-full items-start justify-between gap-4 rounded-xl border border-[#262936] bg-[#181B24] p-4 text-left transition-all hover:border-[#D4A359] hover:bg-[#1D212D] disabled:opacity-50"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#9E988E]">
                          <span className="font-mono font-semibold text-[#D4A359]">
                            0{cIdx + 1}. {choice.intent}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{choice.consequenceHint}</span>
                          {choice.requiredItemName && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  hasRequiredItem
                                    ? 'text-[#4A9E7E] font-medium'
                                    : 'text-[#D97757]'
                                }
                              >
                                关联物品：{choice.requiredItemName}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-sm sm:text-[15px] font-medium text-[#F3EFE6] group-hover:text-white leading-snug">
                          {choice.label}
                        </p>
                      </div>

                      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[#9E988E] transition-transform group-hover:translate-x-0.5 group-hover:text-[#D4A359]" />
                    </button>
                  );
                })}
              </div>

              {/* 自由输入自定义行动栏 */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customActionInput.trim()) {
                    handleCommitAction(customActionInput.trim());
                  }
                }}
                className="mt-5 pt-5 border-t border-[#262936]"
              >
                <label className="block text-xs font-medium text-[#9E988E]">
                  或者打破常规，书写你自己的破局行动
                </label>
                <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
                  <input
                    type="text"
                    disabled={isGeneratingTurn}
                    value={customActionInput}
                    onChange={(e) => setCustomActionInput(e.target.value)}
                    placeholder="输入任意行动、对话或物品组合（例如：用提灯照射石壁暗纹）..."
                    className="flex-1 rounded-xl border border-[#262936] bg-[#0D0E12] px-4 py-3 text-sm text-[#F3EFE6] placeholder-[#9E988E]/60 focus:border-[#D4A359] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!customActionInput.trim() || isGeneratingTurn}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#D4A359] px-5 py-3 text-xs font-semibold text-[#0D0E12] transition-colors hover:bg-[#E2B56F] disabled:opacity-40 whitespace-nowrap shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>执行行动</span>
                  </button>
                </div>
              </form>
            </section>

            {/* 底部页脚 */}
            <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#262936] pt-6 pb-8 text-xs text-[#9E988E]">
              <div>
                <span>未书之纪年史</span>
                <span aria-hidden="true"> · </span>
                <span>动态因果分支与恒定视觉基因引擎</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleLaunchCampaign(activeCampaign)}
                  className="flex items-center gap-1.5 text-[#9E988E] hover:text-[#F3EFE6] whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>重置当前篇章</span>
                </button>
              </div>
            </footer>
          </main>

          {/* 右侧常驻动态侧边栏（当前任务、随身行囊、角色视觉基因库） */}
          <div className="w-full lg:w-[390px] lg:shrink-0">
            <div className="lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)]">
              <DynamicCodexSidebar
                currentQuest={currentQuest}
                inventory={inventory}
                characters={characters}
                latestAuditLogs={latestTurn.sidebarAuditLog}
                currentTurn={latestTurn.turnNumber}
                onUseItemInStory={handleUseItemInStory}
                onFastInspect={handleFastInspect}
                inspectResult={inspectResult}
                isInspecting={isInspecting}
                onClearInspect={() => setInspectResult(null)}
                onUpdateCharacterDna={handleUpdateCharacterDna}
              />
            </div>
          </div>
        </div>
      )}

      {/* 多轮神谕问答侧边抽屉 */}
      <OracleChatDrawer
        isOpen={isOracleOpen}
        onClose={() => setIsOracleOpen(false)}
        messages={oracleMessages}
        onSendMessage={handleSendOracleMessage}
        isSending={isSendingOracle}
        selectedModel={oracleModel}
        onSelectModel={setOracleModel}
        worldSummary={{
          campaignTitle: activeCampaign.title,
          locationName: latestTurn.locationName,
          questTitle: currentQuest.title,
          inventoryCount: inventory.reduce((sum, i) => sum + i.quantity, 0),
        }}
      />

      {/* 世界视觉基因与因果剧情账本弹窗 */}
      <WorldDnaModal
        isOpen={worldModalOpen}
        initialView={worldModalTab}
        onClose={() => setWorldModalOpen(false)}
        selectedArtStyle={selectedArtStyle}
        onSelectArtStyle={(preset) => setSelectedArtStyle(preset)}
        causalLedger={causalLedger}
        characters={characters}
      />
    </div>
  );
}
