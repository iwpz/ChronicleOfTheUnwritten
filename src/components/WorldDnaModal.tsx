import React from 'react';
import { X, Palette, GitBranch, Check } from 'lucide-react';
import {
  ArtStylePreset,
  CausalConsequenceEntry,
  CharacterDNA,
} from '../types/game';
import { ART_STYLE_PRESETS } from '../data/campaigns';

interface WorldDnaModalProps {
  isOpen: boolean;
  initialView: 'dna' | 'ledger';
  onClose: () => void;
  selectedArtStyle: ArtStylePreset;
  onSelectArtStyle: (preset: ArtStylePreset) => void;
  causalLedger: CausalConsequenceEntry[];
  characters: CharacterDNA[];
}

export const WorldDnaModal: React.FC<WorldDnaModalProps> = ({
  isOpen,
  initialView,
  onClose,
  selectedArtStyle,
  onSelectArtStyle,
  causalLedger,
  characters,
}) => {
  const [tab, setTab] = React.useState<'dna' | 'ledger'>(initialView);

  React.useEffect(() => {
    setTab(initialView);
  }, [initialView]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-[#262936] bg-[#13151B] text-[#F3EFE6] shadow-2xl"
        role="dialog"
        aria-label="世界视觉基因与因果剧情账本"
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between border-b border-[#262936] px-6 py-4">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-lg font-semibold text-[#F3EFE6]">
              纪年史引擎中枢
            </h2>
            <div className="flex items-center gap-1 rounded-lg bg-[#0D0E12] p-1">
              <button
                type="button"
                onClick={() => setTab('dna')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  tab === 'dna'
                    ? 'bg-[#1C1F28] text-[#F3EFE6]'
                    : 'text-[#9E988E] hover:text-[#F3EFE6]'
                }`}
              >
                <Palette className="h-3.5 w-3.5 text-[#D4A359]" />
                <span>画风锁定与角色基因</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('ledger')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  tab === 'ledger'
                    ? 'bg-[#1C1F28] text-[#F3EFE6]'
                    : 'text-[#9E988E] hover:text-[#F3EFE6]'
                }`}
              >
                <GitBranch className="h-3.5 w-3.5 text-[#D4A359]" />
                <span>因果剧情账本 ({causalLedger.length})</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#9E988E] hover:bg-[#1C1F28] hover:text-[#F3EFE6]"
            aria-label="关闭窗口"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 主体区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'dna' ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-base font-semibold text-[#F3EFE6]">
                  1. 全局恒定画风锁定（Master Art Style Lock）
                </h3>
                <p className="mt-1 text-xs text-[#9E988E]">
                  所选的美术风格基准会自动注入每一次实时 Gemini 3 Pro Image 场景插画生成中，确保整个冒险旅程的光影、笔触与美学高度统一。
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {ART_STYLE_PRESETS.map((preset) => {
                    const isSelected = preset.id === selectedArtStyle.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => onSelectArtStyle(preset)}
                        className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-colors ${
                          isSelected
                            ? 'border-[#D4A359] bg-[#1C1F2A]'
                            : 'border-[#262936] bg-[#181B24] hover:border-[#3A3F52]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-[#F3EFE6]">
                              {preset.name}
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 shrink-0 text-[#D4A359]" />
                            )}
                          </div>
                          <p className="mt-1.5 text-xs text-[#9E988E] leading-relaxed">
                            {preset.subtitle}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-[#262936] font-mono text-[10px] text-[#9E988E] line-clamp-2">
                          {preset.stylePrompt}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-display text-base font-semibold text-[#F3EFE6]">
                  2. 已锁定的角色视觉基因（Character Visual DNA）
                </h3>
                <p className="mt-1 text-xs text-[#9E988E]">
                  当以下角色出现在场景中时，其专属外观描述词将自动附加至插画提示词末尾，保证角色容貌与衣着前后一致。
                </p>

                <div className="mt-3 space-y-2.5">
                  {characters.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-[#262936] bg-[#181B24] p-3.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#F3EFE6]">{c.name}</span>
                        <span className="text-[#9E988E]">
                          {c.role} · {c.attitude}
                        </span>
                      </div>
                      <p className="mt-1.5 font-mono text-xs text-[#D4A359]/90 leading-relaxed">
                        {c.visualDna}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-base font-semibold text-[#F3EFE6]">
                  因果剧情分支账本
                </h3>
                <p className="mt-1 text-xs text-[#9E988E]">
                  你做出的每一次抉择都被记录在叙事引擎的因果记忆中，确保后续章节真正顺着你的行动衍生演化，而非退回固定剧本。
                </p>
              </div>

              <div className="space-y-3">
                {causalLedger.map((entry, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#262936] bg-[#181B24] p-4"
                  >
                    <div className="flex items-center justify-between text-xs text-[#9E988E]">
                      <span className="font-mono tabular-nums text-[#D4A359]">
                        第 {entry.turnNumber} 回合
                      </span>
                      <span>{entry.location}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-[#F3EFE6]">
                      所选行动：“{entry.choiceTaken}”
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#9E988E]">
                      因果影响：{entry.narrativeImpact}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
