import React from 'react'
import { Compass, Lightbulb, Code2, BookOpen } from './Icons'

const SUGGESTIONS = [
  {
    icon: Compass,
    title: 'Business Website',
    prompt: 'I need a website for my business.',
  },
  {
    icon: Lightbulb,
    title: 'Sell Online',
    prompt: 'I want to sell clothes online.',
  },
  {
    icon: BookOpen,
    title: 'Explore Options',
    prompt: "I don't know what kind of website I need.",
  },
  {
    icon: Code2,
    title: 'Structure & Pages',
    prompt: 'What pages should my website have?',
  },
]

export default function WelcomeScreen({ onSelectPrompt }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
      {/* Main Greeting */}
      <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2 text-shadow-sm">
        Plan Your Website with NOVA
      </h2>
      <p className="text-sm text-slate-200/80 max-w-md mb-8 leading-relaxed">
        Tell me about your business, products, or ideas. I'll help you map out the pages, features, and design before connecting you with our development team.
      </p>

      {/* Suggested Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl text-left">
        {SUGGESTIONS.map((item, idx) => {
          const IconComponent = item.icon
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className="group relative p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/[0.08] hover:border-white/20 transition-all duration-300 backdrop-blur-sm cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.1)] flex flex-col justify-between"
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-1.5 rounded-lg bg-white/10 group-hover:bg-sky-400/20 text-sky-200 transition-colors">
                  <IconComponent className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
                  {item.title}
                </span>
              </div>
              <p className="text-xs text-slate-200/90 font-normal line-clamp-2 leading-relaxed">
                "{item.prompt}"
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
