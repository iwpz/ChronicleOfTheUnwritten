export type GameState = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';

export type ImageSizeOption = '1K' | '2K' | '4K';

export type OracleModelOption = 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';

export interface ArtStylePreset {
  id: string;
  name: string;
  subtitle: string;
  stylePrompt: string;
  paletteAccent: string;
}

export interface CharacterDNA {
  id: string;
  name: string;
  role: string;
  attitude: string;
  /**
   * 恒定或随剧情演化的角色外观特征描述，每次生成场景插画时自动注入提示词，
   * 确保角色在整个冒险旅程中保持一致的外貌。
   */
  visualDna: string;
  firstMetTurn: number;
  lastSeenTurn: number;
  isProtagonist?: boolean;
}

export type ItemCategory = '兵器' | '圣物' | '消耗品' | '密钥' | '卷宗' | '奇物';

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  description: string;
  visualTag: string;
  acquiredTurn: number;
}

export interface QuestObjective {
  id: string;
  text: string;
  completed: boolean;
}

export type QuestStatus = '进行中' | '已完成' | '已失败';

export interface QuestState {
  id: string;
  title: string;
  summary: string;
  giverOrSource: string;
  status: QuestStatus;
  objectives: QuestObjective[];
  updatedTurn: number;
}

export interface StoryChoice {
  id: string;
  label: string;
  intent: string;
  consequenceHint: string;
  requiredItemName?: string;
}

export interface CausalConsequenceEntry {
  turnNumber: number;
  choiceTaken: string;
  narrativeImpact: string;
  location: string;
}

export interface StoryTurnNode {
  turnNumber: number;
  chapterTitle: string;
  locationName: string;
  timeOfDay: string;
  playerActionLabel?: string;
  narrativeParagraphs: string[];
  causalRippleNote: string;
  visualScenePrompt: string;
  composedImagePrompt: string;
  imageUrl?: string;
  imageResolution?: ImageSizeOption;
  imageModelUsed?: string;
  isGeneratingImage?: boolean;
  presentCharacterIds: string[];
  choices: StoryChoice[];
  sidebarAuditLog: string[];
}

export interface FastInspectResponse {
  subject: string;
  sensoryDetail: string;
  tacticalInsight: string;
  hiddenLore: string;
  latencyMs: number;
  modelUsed: string;
}

export interface OracleMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: OracleModelOption;
  latencyMs?: number;
}

export interface CampaignPreset {
  id: string;
  title: string;
  genre: string;
  tagline: string;
  artStyleId: string;
  protagonist: CharacterDNA;
  initialCompanion: CharacterDNA;
  startingLocation: string;
  startingTime: string;
  openingChapterTitle: string;
  openingParagraphs: string[];
  openingCausalNote: string;
  openingVisualScenePrompt: string;
  initialInventory: InventoryItem[];
  initialQuest: QuestState;
  initialChoices: StoryChoice[];
}
