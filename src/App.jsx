import React, { useState, useEffect, useRef } from 'react'
import ChatHeader from './components/ChatHeader'
import WelcomeScreen from './components/WelcomeScreen'
import ChatMessage from './components/ChatMessage'
import ChatInput from './components/ChatInput'
import ContactModal from './components/ContactModal'
import { AlertCircle, X } from './components/Icons'

const STORAGE_KEY = 'nova_chat_history'

export default function App() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState(null)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  const messagesEndRef = useRef(null)
  const abortControllerRef = useRef(null)

  // Persist conversation to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch (e) {
      console.warn('Could not save conversation to localStorage:', e)
    }
  }, [messages])

  // Smooth scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  // Handle New Chat / Reset
  const handleNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setMessages([])
    setInput('')
    setError(null)
    setIsStreaming(false)
    setIsThinking(false)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.warn(e)
    }
  }

  // Stop Generation
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
    setIsThinking(false)
  }

  // Send Message
  const handleSend = async (messageText = input) => {
    const textToSend = messageText.trim()
    if (!textToSend || isStreaming) return

    setError(null)
    setInput('')

    const userMessage = {
      role: 'user',
      content: textToSend,
      id: `usr_${Date.now()}`,
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)

    // Prepare assistant placeholder message
    const assistantId = `ast_${Date.now()}`
    const placeholderAssistant = {
      role: 'assistant',
      content: '',
      id: assistantId,
    }

    setMessages([...updatedMessages, placeholderAssistant])
    setIsStreaming(true)
    setIsThinking(true)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      // Server-side API call
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.error || `Server responded with status ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let accumulatedText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          const payload = trimmed.slice(6)
          if (payload === '[DONE]') {
            break
          }

          try {
            const data = JSON.parse(payload)
            if (data.error) {
              throw new Error(data.error)
            }
            if (data.text) {
              setIsThinking(false)
              accumulatedText += data.text
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: accumulatedText } : msg
                )
              )
            }
          } catch (jsonErr) {
            // Ignore partial SSE chunk parse issues
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Stream generation aborted by user.')
      } else {
        console.error('Chat error:', err)
        setError(err.message || 'Unable to complete request. Please try again.')
        // If assistant had no content, remove placeholder
        setMessages((prev) =>
          prev.filter((m) => !(m.id === assistantId && !m.content.trim()))
        )
      }
    } finally {
      setIsStreaming(false)
      setIsThinking(false)
      abortControllerRef.current = null
    }
  }

  const isExpanded = messages.length > 0

  return (
    <main className="relative w-full h-[100svh] overflow-hidden bg-black select-none font-sans">
      {/* 1. Full-Screen Cinematic Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-100 z-0 pointer-events-none"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260801_001207_ec20d138-aa45-4b2b-ab8c-bdc71607f240.mp4"
      />

      {/* Atmospheric Subtle Vignette */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/10 via-transparent to-black/15 pointer-events-none" />

      {/* Hero Sky Logo (Perfect Top Center) */}
      <div
        className={`absolute top-7 sm:top-9 md:top-11 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isExpanded || isContactModalOpen
            ? 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
            : 'opacity-100 translate-y-0 scale-100'
        }`}
      >
        <img
          src="/logos/nova_text_transparent.png"
          alt="NOVA"
          className="h-10 sm:h-12 md:h-14 w-auto object-contain filter drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)] select-none"
        />
      </div>

      {/* 2. Floating Glass Chat Container (Smoothly expands from valley starter box into full conversation card) */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 z-10 w-[calc(100%-2rem)] flex flex-col overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isContactModalOpen
            ? 'opacity-0 pointer-events-none scale-[0.97] invisible'
            : 'opacity-100 pointer-events-auto scale-100 visible'
        } ${
          isExpanded
            ? 'top-1/2 -translate-y-1/2 max-w-2xl h-[92vh] sm:h-[82vh] min-h-[480px] max-h-[820px] rounded-3xl border border-white/20 bg-white/[0.04] backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]'
            : 'top-[72%] sm:top-[74%] -translate-y-1/2 max-w-xl h-[58px] min-h-0 max-h-[58px] rounded-2xl border border-white/[0.16] bg-black/20 hover:bg-black/25 focus-within:bg-black/30 focus-within:border-sky-300/45 backdrop-blur-[10px] shadow-[0_12px_40px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.12)]'
        }`}
      >
        {/* Header (Fades in smoothly when expanded) */}
        <div
          className={`transition-all duration-500 overflow-hidden flex-shrink-0 ${
            isExpanded
              ? 'opacity-100 max-h-20 delay-200'
              : 'opacity-0 max-h-0 pointer-events-none'
          }`}
        >
          <ChatHeader
            onNewChat={handleNewChat}
            onOpenContact={() => setIsContactModalOpen(true)}
            messageCount={messages.length}
            isStreaming={isStreaming}
          />
        </div>

        {/* Error Notification Banner */}
        {error && isExpanded && (
          <div className="mx-4 mt-3 px-3.5 py-2.5 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs flex items-center justify-between backdrop-blur-md animate-fadeIn flex-shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="p-1 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Conversation Messages Area */}
        <div
          className={`overflow-y-auto px-4 sm:px-6 custom-scrollbar transition-all duration-500 ${
            isExpanded
              ? 'flex-1 py-4 opacity-100 delay-150'
              : 'flex-none h-0 p-0 opacity-0 overflow-hidden pointer-events-none'
          }`}
        >
          <div className="flex flex-col justify-end min-h-full">
            {messages.map((msg, index) => {
              const isLast = index === messages.length - 1
              const msgThinking = isLast && msg.role === 'assistant' && isThinking
              return (
                <ChatMessage
                  key={msg.id || index}
                  message={msg}
                  isThinking={msgThinking}
                  onOpenContact={() => setIsContactModalOpen(true)}
                />
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar (Adaptive: compact starter in ss1, footer bar in chat) */}
        <div className="flex-shrink-0 w-full">
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={() => handleSend()}
            isStreaming={isStreaming}
            onStop={handleStop}
            isExpanded={isExpanded}
          />
        </div>
      </div>

      {/* Quick Starter Suggestions (Positioned directly below the starter box in valley; smoothly fades out when expanded or modal is open) */}
      <div
        className={`absolute top-[72%] sm:top-[74%] left-1/2 -translate-x-1/2 z-10 w-full max-w-xl px-4 pt-16 flex flex-wrap items-center justify-center gap-2 text-xs transition-all duration-400 ease-out ${
          isExpanded || isContactModalOpen
            ? 'opacity-0 -translate-y-2 pointer-events-none'
            : 'opacity-100 translate-y-0 pointer-events-auto'
        }`}
      >
        <button
          type="button"
          onClick={() => handleSend('I need a website for my business.')}
          className="px-3.5 py-1.5 rounded-full bg-black/20 hover:bg-black/35 active:bg-black/50 border border-white/15 hover:border-white/30 text-slate-200 hover:text-white backdrop-blur-md transition-all cursor-pointer shadow-sm text-xs"
        >
          "I need a website for my business"
        </button>
        <button
          type="button"
          onClick={() => handleSend('I want to sell clothes online.')}
          className="px-3.5 py-1.5 rounded-full bg-black/20 hover:bg-black/35 active:bg-black/50 border border-white/15 hover:border-white/30 text-slate-200 hover:text-white backdrop-blur-md transition-all cursor-pointer shadow-sm text-xs"
        >
          "I want to sell clothes online"
        </button>
        <button
          type="button"
          onClick={() => handleSend("I don't know what kind of website I need.")}
          className="px-3.5 py-1.5 rounded-full bg-black/20 hover:bg-black/35 active:bg-black/50 border border-white/15 hover:border-white/30 text-slate-200 hover:text-white backdrop-blur-md transition-all cursor-pointer shadow-sm text-xs"
        >
          "I don't know what kind of website I need"
        </button>
      </div>

      {/* Contact Development Team Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        messages={messages}
      />
    </main>
  )
}
