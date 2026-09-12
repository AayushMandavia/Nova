import React from 'react'
import { RotateCcw, Mail } from './Icons'

export default function ChatHeader({ onNewChat, onOpenContact, isStreaming }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-transparent">
      {/* Brand & Status */}
      <div>
        <div className="flex items-center gap-2.5">
          <img
            src="/logos/nova_text_transparent.png"
            alt="NOVA"
            className="h-6 sm:h-7 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
          />
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-sky-200/90 font-medium border border-white/10">
            Website Consultant
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] text-slate-300/80 font-normal">Online</span>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenContact}
          title="Contact Development Team"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 active:bg-sky-500/30 border border-sky-400/20 transition-all duration-200 cursor-pointer shadow-sm"
        >
          <Mail className="w-3.5 h-3.5 text-sky-300" />
          <span className="hidden sm:inline">Contact Team</span>
        </button>

        <button
          type="button"
          onClick={onNewChat}
          disabled={isStreaming}
          aria-label="Start a new consultation"
          title="New Consultation"
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.18] border border-white/10 hover:border-white/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-300 group-hover:rotate-[-45deg] transition-transform duration-300" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>
    </header>
  )
}
