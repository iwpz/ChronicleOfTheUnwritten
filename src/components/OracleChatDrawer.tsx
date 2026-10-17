import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Zap, Brain, Compass } from 'lucide-react';
import { OracleMessage, OracleModelOption } from '../types/game';

interface OracleChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: OracleMessage[];
  onSendMessage: (content: string, model: OracleModelOption) => Promise<void>;
  isSending: boolean;
  selectedModel: OracleModelOption;
  onSelectModel: (model: OracleModelOption) => void;
  worldSummary: {
    campaignTitle: string;
    locationName: string;
    questTitle: string;
    inventoryCount: number;
  };
}

export const OracleChatDrawer: React.FC<OracleChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isSending,
  selectedModel,
  onSelectModel,
  worldSummary,
}) => {
  const [input, setInput] = useState('');
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    setInput('');
    await onSendMessage(trimmed, selectedModel);
  };

  const handleQuickPrompt = async (promptText: string) => {
    if (isSending) return;
    await onSendMessage(promptText, selectedModel);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-xs">
      <div
        className="relative flex h-full w-full max-w-lg flex-col border-l border-[#262936] bg-[#13151B] text-[#F3EFE6] shadow-2xl"
        role="dialog"
        aria-label="垂询纪年史神谕者"
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between border-b border-[#262936] px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#F3EFE6]">
              纪年史神谕者 · 多轮智库问答
            </h2>
            <p className="mt-0.5 text-xs text-[#9E988E]">
              <span>{worldSummary.locationName}</span>
              <span aria-hidden="true"> · </span>
              <span className="font-mono tabular-nums">行囊 {worldSummary.inventoryCount} 件物品</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#9E988E] transition-colors hover:bg-[#1C1F28] hover:text-[#F3EFE6]"
            aria-label="关闭神谕对话"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 模型选择栏 (gemini-4-argon, gemini-3.8-flash, gemini-3.1-flash-lite) */}
        <div className="border-b border-[#262936] bg-[#0D0E12] px-6 py-3">
          <div className="mb-2 flex items-center justify-between text-xs text-[#9E988E]">
            <span>神谕推演模型层级</span>
            <span className="font-mono text-[11px] text-[#D4A359]">{selectedModel}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-[#161820] p-1">
            <button
              type="button"
              onClick={() => onSelectModel('gemini-4-argon')}
              className={`flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                selectedModel === 'gemini-4-argon'
                  ? 'bg-[#D4A359] text-[#0D0E12] font-semibold'
                  : 'text-[#9E988E] hover:text-[#F3EFE6]'
              }`}
            >
              <Brain className="h-3.5 w-3.5 shrink-0" />
              <span>深度推演 (Argon)</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectModel('gemini-3.8-flash')}
              className={`flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                selectedModel === 'gemini-3.8-flash'
                  ? 'bg-[#D4A359] text-[#0D0E12] font-semibold'
                  : 'text-[#9E988E] hover:text-[#F3EFE6]'
              }`}
            >
              <Compass className="h-3.5 w-3.5 shrink-0" />
              <span>均衡叙事 (Flash)</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectModel('gemini-3.1-flash-lite')}
              className={`flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'bg-[#D4A359] text-[#0D0E12] font-semibold'
                  : 'text-[#9E988E] hover:text-[#F3EFE6]'
              }`}
            >
              <Zap className="h-3.5 w-3.5 shrink-0" />
              <span>极速低延迟 (Lite)</span>
            </button>
          </div>
        </div>

        {/* 可滚动多轮对话列表 */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#D4A359] text-[#0D0E12] font-medium'
                    : 'border border-[#262936] bg-[#181B24] text-[#F3EFE6] font-serif text-[15px]'
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#9E988E]">
                <span>{msg.role === 'user' ? '你' : '神谕者'}</span>
                <span aria-hidden="true">·</span>
                <span>{msg.timestamp}</span>
                {msg.modelUsed && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{msg.modelUsed}</span>
                  </>
                )}
                {msg.latencyMs !== undefined && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{msg.latencyMs}ms</span>
                  </>
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-[#9E988E]">
              <Sparkles className="h-4 w-4 text-[#D4A359]" />
              <span>正在通过 {selectedModel} 翻阅古老卷宗...</span>
            </div>
          )}
          <div ref={threadEndRef} />
        </div>

        {/* 快捷提问按钮 */}
        <div className="border-t border-[#262936] bg-[#0D0E12]/60 px-6 py-2.5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isSending}
              onClick={() =>
                handleQuickPrompt(
                  '我该如何巧妙结合当前行囊里的物品来破解眼前的局面？'
                )
              }
              className="rounded-md border border-[#262936] bg-[#161820] px-2.5 py-1 text-xs text-[#9E988E] transition-colors hover:border-[#D4A359]/50 hover:text-[#F3EFE6] whitespace-nowrap shrink-0"
            >
              行囊物品组合妙用
            </button>
            <button
              type="button"
              disabled={isSending}
              onClick={() =>
                handleQuickPrompt(
                  '当前场景中的人物各自怀有什么隐秘动机或潜在威胁？'
                )
              }
              className="rounded-md border border-[#262936] bg-[#161820] px-2.5 py-1 text-xs text-[#9E988E] transition-colors hover:border-[#D4A359]/50 hover:text-[#F3EFE6] whitespace-nowrap shrink-0"
            >
              剖析人物动机与危机
            </button>
            <button
              type="button"
              disabled={isSending}
              onClick={() =>
                handleQuickPrompt(
                  '除了常规选项外，我现在可以输入什么出人意料的自定义行动？'
                )
              }
              className="rounded-md border border-[#262936] bg-[#161820] px-2.5 py-1 text-xs text-[#9E988E] transition-colors hover:border-[#D4A359]/50 hover:text-[#F3EFE6] whitespace-nowrap shrink-0"
            >
              推演出奇制胜的第四路径
            </button>
          </div>
        </div>

        {/* 底部输入框 */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-[#262936] bg-[#13151B] px-6 py-4"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="向神谕者询问世界观秘辛、角色底细或破局策略..."
              className="flex-1 rounded-lg border border-[#262936] bg-[#0D0E12] px-3.5 py-2.5 text-sm text-[#F3EFE6] placeholder-[#9E988E]/60 focus:border-[#D4A359] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="flex items-center gap-1.5 rounded-lg bg-[#D4A359] px-4 py-2.5 text-xs font-semibold text-[#0D0E12] transition-colors hover:bg-[#E2B56F] disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              <span>发送</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
