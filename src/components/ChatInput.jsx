import React, { useRef, useEffect } from 'react'
import { ArrowUp, Square } from './Icons'

export default function ChatInput({
  input,
  setInput,
  onSend,
  isStreaming,
  onStop,
  disabled = false,
  isExpanded = true,
}) {
  const textareaRef = useRef(null)

  // Auto-resize textarea based on scrollHeight
  useEffect(() => {
    if (textareaRef.current) {
      if (!isExpanded) {
        textareaRef.current.style.height = 'auto'
        return
      }
      textareaRef.current.style.height = 'auto'
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 140)
      textareaRef.current.style.height = `${Math.max(44, nextHeight)}px`
    }
  }, [input, isExpanded])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isStreaming && input.trim()) {
        onSend()
      }
    }
  }

  const canSend = input.trim().length > 0 && !isStreaming && !disabled

  return (
    <div
      className={`w-full transition-all duration-500 flex flex-col justify-center ${
        isExpanded
          ? 'p-3 sm:p-4 border-t border-white/10 bg-transparent'
          : 'h-[58px] p-1.5 pl-4 pr-1.5 border-t-0 bg-transparent'
      }`}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (isStreaming) {
            onStop()
          } else if (canSend) {
            onSend()
          }
        }}
        className={`w-full transition-all duration-300 ${
          isExpanded
            ? 'relative flex items-end gap-2 p-1.5 rounded-2xl bg-white/[0.03] focus-within:bg-white/[0.06] border border-white/10 focus-within:border-sky-300/35 shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]'
            : 'relative flex items-center justify-between gap-2 w-full h-full bg-transparent border-0 shadow-none'
        }`}
      >
        {/* Normal Input in Starter State, Textarea with hidden scrollbar in Expanded State */}
        {!isExpanded ? (
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message to get started with your website..."
            disabled={disabled}
            autoFocus
            className="flex-1 min-w-0 w-full py-2.5 px-2 bg-transparent text-sm text-white placeholder-slate-300/75 focus:outline-none font-sans"
          />
        ) : (
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask NOVA anything about your website..."
            disabled={disabled}
            autoFocus
            className="flex-1 min-w-0 w-full max-h-[140px] px-3.5 py-2.5 bg-transparent text-sm text-white placeholder-slate-400/80 focus:outline-none resize-none overflow-y-auto leading-relaxed font-sans [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          />
        )}

        {/* Action Button: Send or Stop */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            title="Stop generating"
            aria-label="Stop generating response"
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95 cursor-pointer ml-auto"
          >
            <Square className="w-4 h-4 fill-amber-300" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            title="Send message (Enter)"
            aria-label="Send message"
            className={`flex-shrink-0 rounded-xl flex items-center justify-center transition-all duration-200 ml-auto ${
              isExpanded ? 'w-9 h-9' : 'w-10 h-10'
            } ${
              canSend
                ? 'bg-gradient-to-tr from-sky-400 to-indigo-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.35)] hover:brightness-110 active:scale-95 cursor-pointer'
                : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </form>

      {/* Keyboard Shortcut Hint (rendered only in expanded state) */}
      {isExpanded && (
        <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-slate-400/70 select-none animate-fadeIn">
          <span>
            Press{' '}
            <kbd className="font-sans px-1 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
              Enter
            </kbd>{' '}
            to send
          </span>
          <span>
            <kbd className="font-sans px-1 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
              Shift + Enter
            </kbd>{' '}
            for new line
          </span>
        </div>
      )}
    </div>
  )
}
