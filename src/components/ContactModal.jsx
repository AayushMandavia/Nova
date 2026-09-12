import React, { useState, useEffect } from 'react'
import { X, Mail, Phone, Building, User, Check, CheckCircle, Sparkles, Copy } from './Icons'

export default function ContactModal({ isOpen, onClose, messages = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    businessName: '',
  })
  const [phoneError, setPhoneError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showBrief, setShowBrief] = useState(false)

  // Extract user requirements summary from messages
  const userMessages = messages.filter((m) => m.role === 'user').map((m) => m.content)
  const assistantSummaries = messages
    .filter((m) => m.role === 'assistant' && m.content.includes('PROJECT SUMMARY'))
    .map((m) => m.content)

  const summaryText =
    assistantSummaries.length > 0
      ? assistantSummaries[assistantSummaries.length - 1].replace(/\[\s*Contact\s+Us\s*\]/gi, '').trim()
      : userMessages.length > 0
      ? userMessages.map((msg, i) => `• ${msg}`).join('\n')
      : 'New custom website consultation inquiry.'

  // Auto-detect business name from messages if available
  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false)
      setPhoneError('')
      setEmailError('')
      const allText = userMessages.join(' ')
      const match = allText.match(/(?:called|named|brand is|business is|company is)\s+([A-Za-z0-9\s&'-]+?)(?:\.|\,|$|\s+and)/i)
      if (match && !formData.businessName) {
        setFormData((prev) => ({ ...prev, businessName: match[1].trim() }))
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      // Only allow digits and limit to 10 characters
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10)
      setFormData((prev) => ({ ...prev, phone: digitsOnly }))
      if (digitsOnly.length === 10) {
        setPhoneError('')
      }
      return
    }
    if (name === 'email') {
      setEmailError('')
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    let hasError = false

    if (!formData.name.trim()) {
      hasError = true
    }

    // Require exactly 10 digits for mobile number
    if (!formData.phone || formData.phone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number')
      hasError = true
    } else {
      setPhoneError('')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      setEmailError('Please enter a valid email address')
      hasError = true
    } else {
      setEmailError('')
    }

    if (hasError) return

    setIsSubmitted(true)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/30 animate-fadeIn select-none">
      {/* Click outside to close (crisp unblurred background) */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Transparent Glassmorphic Modal Card */}
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/20 bg-white/[0.04] backdrop-blur-xl p-6 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] text-white overflow-hidden">
        {/* Subtle ambient light accents */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-400/20 to-indigo-500/20 text-sky-300 border border-white/15 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <Sparkles className="w-4 h-4 text-sky-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold tracking-tight text-white">
                Contact Web Development Team
              </h3>
              <p className="text-xs text-slate-300">
                Share your details for an accurate quote & project discussion
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: Form or Success Screen */}
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="pt-4 space-y-3.5 relative">
            {/* 1. Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-300" />
                <span>Your Name <span className="text-sky-400">*</span></span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Alex Morgan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.12] border border-white/15 focus:border-sky-300/60 text-sm text-white placeholder-slate-300/60 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.06)] font-sans"
              />
            </div>

            {/* 2. Mobile Number & Email Address (2-column layout on sm) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-sky-300" />
                    <span>Mobile Number <span className="text-sky-400">*</span></span>
                  </span>
                  {formData.phone.length > 0 && (
                    <span className={`text-[10px] font-mono ${
                      formData.phone.length === 10 ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      {formData.phone.length}/10
                    </span>
                  )}
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.12] border text-sm text-white placeholder-slate-400/60 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.06)] font-sans ${
                    phoneError
                      ? 'border-rose-400/80 focus:border-rose-400 text-rose-100'
                      : 'border-white/15 focus:border-sky-300/60'
                  }`}
                />
                {phoneError && (
                  <p className="mt-1 text-[11px] text-rose-300 leading-tight">
                    {phoneError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-300" />
                  <span>Email Address <span className="text-sky-400">*</span></span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex@example.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.12] border text-sm text-white placeholder-slate-400/60 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.06)] font-sans ${
                    emailError
                      ? 'border-rose-400/80 focus:border-rose-400 text-rose-100'
                      : 'border-white/15 focus:border-sky-300/60'
                  }`}
                />
                {emailError && (
                  <p className="mt-1 text-[11px] text-rose-300 leading-tight">
                    {emailError}
                  </p>
                )}
              </div>
            </div>

            {/* 3. Business Name */}
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-sky-300" />
                <span>Business / Brand Name</span>
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="e.g. Apex Apparel / Nova Studio"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.12] border border-white/15 focus:border-sky-300/60 text-sm text-white placeholder-slate-300/60 focus:outline-none transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.06)] font-sans"
              />
            </div>

            {/* Collapsible Project Brief Accordion */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowBrief(!showBrief)}
                className="text-xs text-sky-300 hover:text-sky-200 flex items-center gap-1.5 transition-colors cursor-pointer py-1"
              >
                <span>{showBrief ? '▾ Hide Consultation Notes' : '▸ Attach NOVA Consultation Notes'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-slate-300">Auto-Attached</span>
              </button>

              {showBrief && (
                <div className="mt-2 p-3 rounded-2xl bg-white/[0.04] border border-white/15 text-xs text-slate-300 max-h-36 overflow-y-auto custom-scrollbar font-mono leading-relaxed">
                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200">
                    {summaryText}
                  </pre>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500 hover:brightness-110 active:scale-[0.98] text-white font-semibold text-sm shadow-[0_0_25px_rgba(56,189,248,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Submit Details to Development Team</span>
              </button>
            </div>
          </form>
        ) : (
          /* Success Screen */
          <div className="py-8 px-2 text-center space-y-4 animate-fadeIn">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-400/20 to-teal-400/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.3)]">
              <CheckCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-lg font-semibold text-white tracking-tight">
                Inquiry Received!
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                Thank you, <span className="text-white font-medium">{formData.name}</span>. Your project details{formData.businessName ? ` for ${formData.businessName}` : ''} have been sent to our development team.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/15 text-xs text-slate-200 max-w-sm mx-auto space-y-1 text-left backdrop-blur-sm">
              <div className="flex justify-between py-0.5">
                <span className="text-slate-400">Mobile:</span>
                <span className="text-white font-mono">{formData.phone}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-400">Email:</span>
                <span className="text-white font-mono">{formData.email}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-400">Estimated Response:</span>
                <span className="text-sky-300">Within 24 hours</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2.5 max-w-sm mx-auto">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Brief' : 'Copy Brief'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-medium text-xs shadow-sm hover:brightness-110 transition-all cursor-pointer"
              >
                Back to Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
