import React, { useState } from 'react'
import { Sparkles, User, Copy, Check, ArrowRight } from './Icons'

// Lightweight clean markdown formatter for lists, bold, inline code, and code blocks
function MarkdownText({ content }) {
  if (!content) return null

  // Strip [Contact Us] from the raw text display since we render a button for it
  const cleanContent = content.replace(/\[\s*Contact\s+(Us|Development\s+Team)\s*\]/gi, '').trim()

  // Split by code blocks first
  const parts = cleanContent.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-2 text-sm leading-relaxed break-words font-sans">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n')
          let lang = 'code'
          let code = part.slice(3, -3).trim()
          if (lines.length > 0 && !lines[0].includes(' ') && lines[0].length < 15) {
            lang = lines[0] || 'code'
            code = lines.slice(1).join('\n')
          }
          return <CodeBlock key={index} code={code} lang={lang} />
        }

        // Standard text lines
        const paragraphs = part.split('\n\n')
        return paragraphs.map((para, pIdx) => {
          const trimmed = para.trim()
          if (!trimmed) return null

          // Check if markdown heading (### or ##)
          if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
            const hText = trimmed.replace(/^#+\s+/, '')
            return (
              <h4 key={pIdx} className="font-semibold text-white text-sm mt-3 mb-1 tracking-tight">
                <InlineFormatted text={hText} />
              </h4>
            )
          }

          // Check if bullet list
          if (trimmed.split('\n').every((l) => l.trim().startsWith('- ') || l.trim().startsWith('* ') || l.trim().startsWith('• '))) {
            const items = trimmed.split('\n').map((l) => l.replace(/^[-*•]\s+/, ''))
            return (
              <ul key={pIdx} className="list-disc list-inside space-y-1 my-1 pl-1 text-slate-100">
                {items.map((it, iIdx) => (
                  <li key={iIdx} className="leading-relaxed">
                    <InlineFormatted text={it} />
                  </li>
                ))}
              </ul>
            )
          }

          // Check if numbered list (e.g. "1. ", "2. ")
          if (trimmed.split('\n').some((l) => /^\d+\.\s+/.test(l.trim()))) {
            const lines = trimmed.split('\n')
            return (
              <ol key={pIdx} className="list-decimal list-inside space-y-1.5 my-1.5 pl-1 text-slate-100">
                {lines.map((line, lIdx) => {
                  const match = line.match(/^(\d+\.)\s+(.*)$/)
                  if (match) {
                    return (
                      <li key={lIdx} className="leading-relaxed">
                        <InlineFormatted text={match[2]} />
                      </li>
                    )
                  }
                  return (
                    <div key={lIdx} className="pl-4 text-xs text-slate-300">
                      <InlineFormatted text={line} />
                    </div>
                  )
                })}
              </ol>
            )
          }

          return (
            <p key={pIdx} className="leading-relaxed text-slate-100">
              <InlineFormatted text={trimmed} />
            </p>
          )
        })
      })}
    </div>
  )
}

function InlineFormatted({ text }) {
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g)

  return (
    <>
      {tokens.map((token, i) => {
        if (token.startsWith('**') && token.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-white">
              {token.slice(2, -2)}
            </strong>
          )
        }
        if (token.startsWith('`') && token.endsWith('`')) {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 rounded bg-white/10 text-sky-200 text-[13px] font-mono border border-white/10"
            >
              {token.slice(1, -1)}
            </code>
          )
        }
        return <span key={i}>{token}</span>
      })}
    </>
  )
}

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative my-3 rounded-xl overflow-hidden bg-black/25 border border-white/[0.08] backdrop-blur-sm">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-white/[0.03] border-b border-white/[0.06] text-[11px] text-slate-300 font-mono">
        <span className="uppercase tracking-wider">{lang}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3.5 text-xs text-sky-100 font-mono overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function ChatMessage({ message, isThinking = false, onOpenContact }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const hasContactCta = !isUser && message.content && /\[\s*Contact\s+(Us|Development\s+Team)\s*\]/i.test(message.content)

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className={`group relative flex gap-3 my-3 w-full animate-fadeIn ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-white/[0.05] border border-[#327EBD]/30 flex items-center justify-center mt-1 shadow-[0_0_14px_rgba(50,126,189,0.35)] backdrop-blur-sm">
          <img
            src="/logos/nova_red_star.png"
            alt="NOVA"
            className="w-4 h-4 object-contain filter drop-shadow-[0_0_8px_rgba(50,126,189,0.75)]"
          />
        </div>
      )}

      {/* Message Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[78%] px-4 py-3 rounded-2xl transition-all duration-200 ${
          isUser
            ? 'bg-white/[0.08] border border-white/20 text-white rounded-tr-sm shadow-sm'
            : 'bg-white/[0.03] border border-white/10 text-slate-100 rounded-tl-sm shadow-sm'
        }`}
      >
        {/* Message Content or Thinking Dots */}
        {isThinking && !message.content ? (
          <div className="flex items-center gap-1.5 py-1 px-1">
            <span className="w-2 h-2 rounded-full bg-sky-300 animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-sky-300 animate-pulse" style={{ animationDelay: '200ms' }} />
            <span className="w-2 h-2 rounded-full bg-sky-300 animate-pulse" style={{ animationDelay: '400ms' }} />
          </div>
        ) : (
          <MarkdownText content={message.content} />
        )}

        {/* Interactive Contact Us Button when CTA is triggered */}
        {hasContactCta && (
          <div className="mt-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onOpenContact}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-500/80 to-indigo-500/80 hover:from-sky-500 hover:to-indigo-500 border border-sky-300/30 shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all active:scale-95 cursor-pointer"
            >
              <span>Contact Development Team</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        )}

        {/* Copy button on hover */}
        {message.content && (
          <button
            type="button"
            onClick={handleCopy}
            title="Copy message"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white border border-white/10 text-[10px]"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center mt-1 text-slate-200">
          <User className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  )
}
