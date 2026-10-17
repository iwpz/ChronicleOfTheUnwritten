import React, { useState } from 'react';
import {
  Compass,
  Package,
  Users,
  CheckCircle2,
  Circle,
  Zap,
  ArrowUpRight,
  Edit3,
  Check,
} from 'lucide-react';
import {
  CharacterDNA,
  FastInspectResponse,
  InventoryItem,
  QuestState,
} from '../types/game';

interface DynamicCodexSidebarProps {
  currentQuest: QuestState;
  inventory: InventoryItem[];
  characters: CharacterDNA[];
  latestAuditLogs: string[];
  currentTurn: number;
  onUseItemInStory: (item: InventoryItem) => void;
  onFastInspect: (
    subject: string,
    subjectType: '物品' | '角色' | '任务',
    contextDescription: string
  ) => Promise<void>;
  inspectResult: FastInspectResponse | null;
  isInspecting: boolean;
  onClearInspect: () => void;
  onUpdateCharacterDna: (charId: string, newDna: string) => void;
}

export const DynamicCodexSidebar: React.FC<DynamicCodexSidebarProps> = ({
  currentQuest,
  inventory,
  characters,
  latestAuditLogs,
  currentTurn,
  onUseItemInStory,
  onFastInspect,
  inspectResult,
  isInspecting,
  onClearInspect,
  onUpdateCharacterDna,
}) => {
  const [activeTab, setActiveTab] = useState<'codex' | 'characters'>('codex');
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [draftDna, setDraftDna] = useState<string>('');

  const completedCount = currentQuest.objectives.filter((o) => o.completed).length;

  const startEditDna = (char: CharacterDNA) => {
    setEditingCharId(char.id);
    setDraftDna(char.visualDna);
  };

  const saveEditDna = (charId: string) => {
    if (draftDna.trim()) {
      onUpdateCharacterDna(charId, draftDna.trim());
    }
    setEditingCharId(null);
  };

  return (
    <aside className="flex h-full flex-col border-l border-[#262936] bg-[#13151B] text-[#F3EFE6]">
      {/* 侧边栏顶部分段导航按钮 */}
      <div className="border-b border-[#262936] px-5 py-3.5">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#0D0E12] p-1">
          <button
            type="button"
            onClick={() => setActiveTab('codex')}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'codex'
                ? 'bg-[#1C1F28] text-[#F3EFE6] shadow-xs'
                : 'text-[#9E988E] hover:text-[#F3EFE6]'
            }`}
          >
            <Package className="h-3.5 w-3.5 text-[#D4A359]" />
            <span>当前任务与行囊</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('characters')}
            className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'characters'
                ? 'bg-[#1C1F28] text-[#F3EFE6] shadow-xs'
                : 'text-[#9E988E] hover:text-[#F3EFE6]'
            }`}
          >
            <Users className="h-3.5 w-3.5 text-[#D4A359]" />
            <span>角色视觉基因 ({characters.length})</span>
          </button>
        </div>
      </div>

      {/* AI 自动同步状态栏 */}
      {latestAuditLogs.length > 0 && (
        <div className="border-b border-[#262936] bg-[#171A24] px-5 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-[#9E988E]">
            <span>AI 状态自动同步 · 第 {currentTurn} 回合</span>
            <span className="font-mono text-[#D4A359]">已更新</span>
          </div>
          <ul className="mt-1 space-y-0.5 text-xs text-[#F3EFE6]/90">
            {latestAuditLogs.map((entry, idx) => (
              <li key={idx} className="truncate">
                {entry}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 低延迟极速洞察面板 (gemini-3.1-flash-lite) */}
      {(isInspecting || inspectResult) && (
        <div className="border-b border-[#262936] bg-[#0D0E12] px-5 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#D4A359]">
              <Zap className="h-3.5 w-3.5" />
              <span>极速低延迟洞察</span>
            </div>
            {inspectResult && (
              <button
                type="button"
                onClick={onClearInspect}
                className="text-xs text-[#9E988E] hover:text-[#F3EFE6] whitespace-nowrap shrink-0"
              >
                收起
              </button>
            )}
          </div>
          {isInspecting ? (
            <p className="mt-1.5 text-xs text-[#9E988E]">
              正在通过 gemini-3.1-flash-lite 解析感官细节与战术价值...
            </p>
          ) : inspectResult ? (
            <div className="mt-2 space-y-1.5 text-xs">
              <div className="font-semibold text-[#F3EFE6]">{inspectResult.subject}</div>
              <p className="font-serif text-[13px] text-[#F3EFE6]/90 leading-snug">
                {inspectResult.sensoryDetail}
              </p>
              <p className="text-[#9E988E] leading-snug">
                <strong className="text-[#F3EFE6]">战术妙用：</strong> {inspectResult.tacticalInsight}
              </p>
              <p className="text-[#9E988E] leading-snug">
                <strong className="text-[#F3EFE6]">隐秘考据：</strong> {inspectResult.hiddenLore}
              </p>
              <div className="pt-1 text-[11px] text-[#9E988E] font-mono tabular-nums">
                <span>{inspectResult.modelUsed}</span>
                <span aria-hidden="true"> · </span>
                <span>{inspectResult.latencyMs}ms</span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* 主滚动区 */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
        {activeTab === 'codex' ? (
          <>
            {/* 模块一：当前任务 */}
            <section aria-labelledby="sidebar-quest-heading">
              <div className="flex items-center justify-between">
                <h2
                  id="sidebar-quest-heading"
                  className="font-display text-base font-semibold text-[#F3EFE6] flex items-center gap-2"
                >
                  <Compass className="h-4 w-4 text-[#D4A359]" />
                  <span>当前任务</span>
                </h2>
                <div className="text-xs text-[#9E988E] font-mono tabular-nums">
                  <span>{currentQuest.status}</span>
                  <span aria-hidden="true"> · </span>
                  <span>
                    {completedCount}/{currentQuest.objectives.length}
                  </span>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-[#262936] bg-[#181B24] p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-[15px] font-semibold text-[#F3EFE6]">
                    {currentQuest.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      onFastInspect(
                        currentQuest.title,
                        '任务',
                        currentQuest.summary
                      )
                    }
                    className="flex items-center gap-1 rounded-md border border-[#262936] bg-[#13151B] px-2 py-1 text-[11px] font-medium text-[#D4A359] hover:border-[#D4A359]/60 whitespace-nowrap shrink-0"
                    title="通过 gemini-3.1-flash-lite 获取低延迟战术提示"
                  >
                    <Zap className="h-3 w-3" />
                    <span>提示</span>
                  </button>
                </div>

                <p className="mt-1.5 text-xs leading-relaxed text-[#9E988E]">
                  {currentQuest.summary}
                </p>

                <div className="mt-3.5 border-t border-[#262936] pt-3 space-y-2">
                  {currentQuest.objectives.map((obj) => (
                    <div
                      key={obj.id}
                      className="flex items-start gap-2.5 text-xs leading-snug"
                    >
                      {obj.completed ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4A9E7E]" />
                      ) : (
                        <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D4A359]" />
                      )}
                      <span
                        className={
                          obj.completed
                            ? 'line-through text-[#9E988E]/70'
                            : 'text-[#F3EFE6]'
                        }
                      >
                        {obj.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-2 border-t border-[#262936]/60 flex items-center gap-1.5 text-[11px] text-[#9E988E]">
                  <span>来源：{currentQuest.giverOrSource}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    第 {currentQuest.updatedTurn} 回合更新
                  </span>
                </div>
              </div>
            </section>

            {/* 模块二：动态行囊物品 */}
            <section aria-labelledby="sidebar-inventory-heading">
              <div className="flex items-center justify-between">
                <h2
                  id="sidebar-inventory-heading"
                  className="font-display text-base font-semibold text-[#F3EFE6] flex items-center gap-2"
                >
                  <Package className="h-4 w-4 text-[#D4A359]" />
                  <span>随身行囊</span>
                </h2>
                <span className="text-xs text-[#9E988E] font-mono tabular-nums">
                  共 {inventory.reduce((acc, item) => acc + item.quantity, 0)} 件物品
                </span>
              </div>

              {inventory.length === 0 ? (
                <div className="mt-3 rounded-xl border border-[#262936] bg-[#181B24] p-4 text-xs text-[#9E988E]">
                  你的行囊目前空无一物。在旅途中发现或获得的圣物、密钥与卷宗将由 AI 自动同步至此。
                </div>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {inventory.map((item) => {
                    const isNewlyAcquired =
                      item.acquiredTurn === currentTurn && currentTurn > 1;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3.5 transition-colors ${
                          isNewlyAcquired
                            ? 'border-[#D4A359]/70 bg-[#1B1E28]'
                            : 'border-[#262936] bg-[#181B24]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-semibold text-[#F3EFE6]">
                              {item.name}
                            </h3>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#9E988E]">
                              <span>{item.category}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                数量 {item.quantity}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                第 {item.acquiredTurn} 回合获得
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-[#9E988E]">
                          {item.description}
                        </p>

                        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-[#262936]/70">
                          <button
                            type="button"
                            onClick={() => onUseItemInStory(item)}
                            className="flex items-center gap-1 rounded-md bg-[#222634] px-2.5 py-1.5 text-xs font-medium text-[#F3EFE6] hover:bg-[#D4A359] hover:text-[#0D0E12] transition-colors whitespace-nowrap shrink-0"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            <span>置入剧情使用</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onFastInspect(
                                item.name,
                                '物品',
                                `${item.category}：${item.description}`
                              )
                            }
                            className="flex items-center gap-1 rounded-md border border-[#262936] px-2.5 py-1.5 text-xs font-medium text-[#9E988E] hover:border-[#D4A359]/50 hover:text-[#F3EFE6] transition-colors whitespace-nowrap shrink-0"
                          >
                            <Zap className="h-3 w-3 text-[#D4A359]" />
                            <span>极速鉴定</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : (
          /* 模块三：角色视觉基因库（Character Visual DNA） */
          <section aria-labelledby="sidebar-dna-heading">
            <div className="flex items-center justify-between">
              <h2
                id="sidebar-dna-heading"
                className="font-display text-base font-semibold text-[#F3EFE6]"
              >
                角色视觉基因库（Visual DNA）
              </h2>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#9E988E]">
              每位登场角色的面容、服饰与标志性器物均已锁定至图像生成引擎，确保他们在每一幕实时生成的插画中始终保持统一形象。
            </p>

            <div className="mt-4 space-y-3">
              {characters.map((char) => (
                <div
                  key={char.id}
                  className="rounded-xl border border-[#262936] bg-[#181B24] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-[#F3EFE6]">
                        {char.name}
                      </h3>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#9E988E]">
                        <span>{char.role}</span>
                        <span aria-hidden="true">·</span>
                        <span>{char.attitude}</span>
                        {char.isProtagonist && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#D4A359]">主角</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditDna(char)}
                        className="rounded-md p-1.5 text-[#9E988E] hover:bg-[#222634] hover:text-[#F3EFE6]"
                        title="编辑角色视觉基因描述"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onFastInspect(
                            char.name,
                            '角色',
                            `${char.role}（态度：${char.attitude}）。外貌特征：${char.visualDna}`
                          )
                        }
                        className="rounded-md p-1.5 text-[#D4A359] hover:bg-[#222634]"
                        title="极速洞察该角色底细"
                      >
                        <Zap className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {editingCharId === char.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        rows={3}
                        value={draftDna}
                        onChange={(e) => setDraftDna(e.target.value)}
                        className="w-full rounded-lg border border-[#D4A359] bg-[#0D0E12] p-2.5 text-xs text-[#F3EFE6] focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingCharId(null)}
                          className="rounded-md px-2.5 py-1 text-xs text-[#9E988E] hover:text-[#F3EFE6]"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEditDna(char.id)}
                          className="flex items-center gap-1 rounded-md bg-[#D4A359] px-2.5 py-1 text-xs font-semibold text-[#0D0E12]"
                        >
                          <Check className="h-3 w-3" />
                          <span>保存外观基因</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2.5 rounded-lg bg-[#0D0E12]/70 p-2.5 font-mono text-[11px] leading-relaxed text-[#F3EFE6]/85">
                      {char.visualDna}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </aside>
  );
};
