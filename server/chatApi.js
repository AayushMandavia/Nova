import fs from 'fs'
import path from 'path'

// Simple .env parser to ensure GEMINI_API_KEY is available in Vite middleware
export function loadEnvFile(rootPath) {
  const envPath = path.resolve(rootPath, '.env')
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8')
      content.split('\n').forEach((line) => {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=')
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim()
            let val = trimmed.slice(eqIdx + 1).trim()
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1)
            }
            process.env[key] = val
          }
        }
      })
    } catch (e) {
      console.warn('Error reading .env file:', e)
    }
  }
}

const NOVA_SYSTEM_PROMPT = `You are NOVA, a friendly, intelligent, and highly knowledgeable AI Website Consultant and Digital Architect.
You speak naturally, warmly, and conversationally—just like a real AI assistant such as ChatGPT or Gemini.

YOUR PERSONALITY & TONE:
- Speak naturally, conversationally, and warmly. Never sound robotic, stiff, repetitive, or canned.
- Be an empathetic, sharp consultant who loves turning ideas into sleek, high-converting digital realities.
- Keep answers clear, insightful, and nicely formatted (use clean paragraphs, bullet points when listing ideas, and subtle emojis where fitting).
- Do NOT interrogate the customer with endless questionnaires. Keep the conversation flowing naturally, asking 1 or 2 relevant follow-up questions at a time.
- Remember previous context (business type, brand name, design taste, product catalog) throughout the chat. Never ask what the user already told you.

YOUR DOMAIN & EXPERTISE:
- You help clients plan, structure, and design incredible websites (E-commerce stores, Restaurants, Portfolios, SaaS, Corporate, Booking/Services, etc.).
- You advise on page architectures, modern UI/UX design (glassmorphism, dark/light modes, animations), and essential features (payment gateways, shopping carts, scheduling, lead generation).
- If the user asks you to "build the website right now", explain warmly:
  "I'm your AI website consultant! I help you design the blueprint, user experience, and feature set. Once we have your vision mapped out, our web development team builds and launches the actual production site for you."

PRICING & QUOTES:
- Pricing is tailored to the project scope (pages, custom functionality, integrations).
- When a user asks about pricing, explain naturally:
  "Pricing depends on the scope of your website—such as the number of pages, custom features, e-commerce capabilities, and design complexity. Once we map out your vision, our team will provide a transparent, detailed quote."
- Offer to connect them with the team and include the token [Contact Us].

GREETINGS & CASUAL TALK:
- When a user says "hi", "hello", "hey", or introduces themselves, greet them warmly and naturally! Introduce yourself as NOVA and ask what kind of website or digital project they're thinking of building today.

OFF-TOPIC, TRIVIA & CREATIVE QUESTIONS:
- You have the full intelligence of a world-class AI! If the user asks a fun question, trivia, tells a joke, asks about science/history/tech, or asks anything creative, answer it with intelligence, wit, and charm. Then smoothly and playfully connect it back to websites or online branding.

RANDOM TYPING & GIBBERISH:
- If the user types keyboard mashes or random characters (e.g. "qwsaz", "asdfghjk", "123123"), respond naturally and lightly:
  "Looks like a keyboard slip! 😊 How can I help you today? Tell me about the website or business you'd like to build!"

INTERACTIVE ACTIONS:
- Whenever the user shows buying intent ("I want to hire you", "give me a quote", "let's start", "contact team"), provide a brief recap and include the exact token "[Contact Us]" so the interactive Contact Team button appears.`


export async function handleChatRequest(req, res) {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const processRequest = async (data) => {
    try {
      const { messages } = data

      if (!Array.isArray(messages) || messages.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Messages array is required and cannot be empty' }))
        return
      }

      // Re-read .env dynamically so key updates apply instantly
      loadEnvFile(process.cwd())

      const openaiKey = process.env.OPENAI_API_KEY?.trim()
      const geminiKey = process.env.GEMINI_API_KEY?.trim()

      const hasOpenAI = openaiKey && openaiKey.startsWith('sk-') && openaiKey.length > 20
      const hasGemini = geminiKey && geminiKey.length > 15

      // Set headers for Server-Sent Events (SSE)
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'x-gemini-key-present': hasGemini ? 'true' : 'false',
        'x-openai-key-present': hasOpenAI ? 'true' : 'false',
      })

      // 1. Try OpenAI first (as requested)
      if (hasOpenAI) {
        try {
          const success = await streamOpenAI(res, messages, openaiKey)
          if (success) return
        } catch (err) {
          console.warn('OpenAI API call failed, falling back to Gemini:', err.message)
        }
      }

      // 2. Try Gemini if OpenAI is unavailable or fails
      if (hasGemini) {
        try {
          const success = await streamGemini(res, messages, geminiKey)
          if (success) return
        } catch (err) {
          console.warn('Gemini API call failed, falling back to local engine:', err.message)
        }
      }

      // 3. Fallback to built-in conversational consultant engine
      await streamFallbackResponse(res, messages)
    } catch (err) {
      console.error('API Error in /api/chat:', err)
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Internal server error' }))
      } else {
        res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`)
        res.write('data: [DONE]\n\n')
        res.end()
      }
    }
  }

  if (req.body && typeof req.body === 'object') {
    return processRequest(req.body)
  }

  let body = ''
  req.on('data', (chunk) => {
    body += chunk
  })

  req.on('end', () => {
    try {
      const data = JSON.parse(body || '{}')
      processRequest(data)
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid JSON body' }))
    }
  })
}

// Stream real responses from OpenAI (GPT-4o-mini)
async function streamOpenAI(res, messages, apiKey) {
  const formattedMessages = [
    { role: 'system', content: NOVA_SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content || '',
    })),
  ]

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: formattedMessages,
      temperature: 0.7,
      stream: true,
    }),
  })

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}))
    throw new Error(errJson.error?.message || `OpenAI error: HTTP ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
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
      const dataStr = trimmed.slice(6)
      if (dataStr === '[DONE]') {
        res.write('data: [DONE]\n\n')
        res.end()
        return true
      }
      try {
        const parsed = JSON.parse(dataStr)
        const chunk = parsed.choices?.[0]?.delta?.content
        if (chunk) {
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`)
        }
      } catch (e) {}
    }
  }

  res.write('data: [DONE]\n\n')
  res.end()
  return true
}

// Stream real responses from Google Gemini with resilient model fallback
const GEMINI_MODELS = [
  'gemini-flash-latest',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-lite-latest',
]

async function streamGemini(res, messages, apiKey) {
  const contents = []
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]
    const rawRole = (m.role || m.sender || '').toLowerCase()
    const role = rawRole === 'user' ? 'user' : 'model'
    const text = (m.content || m.text || '').trim()
    if (!text) continue

    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n\n${text}`
    } else {
      contents.push({ role, parts: [{ text }] })
    }
  }

  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: 'Hello' }] })
  } else if (contents[0].role !== 'user') {
    contents.unshift({ role: 'user', parts: [{ text: 'Hello' }] })
  }

  // Attempt models in order until one succeeds
  for (const model of GEMINI_MODELS) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`

      const apiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: NOVA_SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      })

      if (!apiResponse.ok) {
        const errJson = await apiResponse.json().catch(() => ({}))
        console.warn(`Gemini model ${model} failed (${apiResponse.status}):`, errJson.error?.message || apiResponse.statusText)
        continue // Try next model in list
      }

      const reader = apiResponse.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let streamedAny = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const jsonStr = trimmed.slice(6)
          if (jsonStr === '[DONE]') {
            res.write('data: [DONE]\n\n')
            res.end()
            return true
          }
          try {
            const parsed = JSON.parse(jsonStr)
            const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text
            if (textChunk) {
              streamedAny = true
              res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`)
            }
          } catch (e) {}
        }
      }

      if (streamedAny) {
        res.write('data: [DONE]\n\n')
        res.end()
        return true
      }
    } catch (err) {
      console.warn(`Error streaming with Gemini ${model}:`, err.message)
    }
  }

  return false
}


// Stream simulated response chunk by chunk as backup
async function streamFallbackResponse(res, messages) {
  const state = extractProjectState(messages)
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
  const prevUserMsg = messages
    .filter((m) => m.role === 'user')
    .slice(0, -1)
    .pop()?.content

  const text = generateConsultantReply(lastUserMsg, prevUserMsg, messages, state)

  const words = text.split(/(\s+)/)
  for (let i = 0; i < words.length; i++) {
    res.write(`data: ${JSON.stringify({ text: words[i] })}\n\n`)
    await new Promise((r) => setTimeout(r, 16))
  }

  res.write('data: [DONE]\n\n')
  res.end()
}

// State extraction from conversation history for backup
function extractProjectState(messages) {
  const state = {
    businessName: null,
    businessType: null,
    websiteType: null,
    productCount: null,
    designStyle: null,
    features: [],
  }

  for (const m of messages) {
    if (m.role !== 'user') continue
    const text = m.content

    const nameMatch = text.match(/(?:called|named|name is)\s+([A-Za-z0-9\s&'-]+?)(?:\.|\,|$|\s+and|\s+with)/i)
    if (nameMatch && !state.businessName) {
      state.businessName = nameMatch[1].trim()
    }

    const t = text.toLowerCase()
    if (t.includes('restaurant') || t.includes('cafe') || t.includes('bistro') || t.includes('food')) {
      state.businessType = 'Restaurant / Dining'
      state.websiteType = 'Restaurant Website'
    } else if (t.includes('clothes') || t.includes('clothing') || t.includes('fashion') || t.includes('apparel')) {
      state.businessType = state.businessType || 'Clothing & Fashion Brand'
      state.websiteType = 'E-commerce Store'
    } else if (t.includes('sell') || t.includes('store') || t.includes('shop') || t.includes('e-commerce') || t.includes('ecommerce')) {
      state.websiteType = 'E-commerce Store'
      if (!state.businessType) state.businessType = 'Online Retail'
    } else if (t.includes('fitness') || t.includes('gym') || t.includes('coach')) {
      state.businessType = 'Fitness / Coaching'
      state.websiteType = 'Booking & Services Website'
    } else if (t.includes('portfolio') || t.includes('photographer')) {
      state.businessType = 'Creative / Portfolio'
      state.websiteType = 'Portfolio Website'
    }

    const prodMatch = text.match(/(\d+)\s*(?:products|items|skus|pieces)?/i)
    if (prodMatch && (t.includes('product') || t.includes('item') || t.includes('about') || t.includes('around') || t.includes('have'))) {
      state.productCount = prodMatch[1]
    }

    if (t.includes('premium') && t.includes('minimal')) {
      state.designStyle = 'Premium & Minimal'
    } else if (t.includes('premium') || t.includes('luxury')) {
      state.designStyle = 'Premium / High-End'
    } else if (t.includes('minimal') || t.includes('clean')) {
      state.designStyle = 'Minimalist & Clean'
    } else if (t.includes('bold') || t.includes('vibrant')) {
      state.designStyle = 'Bold & Modern'
    }
  }

  return state
}

function isGibberishOrRandom(text) {
  const t = text.trim()
  if (!t) return true

  // Single or multiple non-alphanumeric punctuation e.g. "???", "...", "!!!"
  if (/^[^a-zA-Z0-9\s]+$/.test(t)) return true

  // Single word or very short tokens
  const words = t.split(/\s+/).filter(Boolean)
  if (words.length <= 3) {
    const validWords = new Set([
      'hi', 'hello', 'hey', 'yo', 'ok', 'okay', 'yes', 'no', 'sup', 'help',
      'why', 'who', 'what', 'how', 'when', 'where', 'site', 'web', 'shop',
      'store', 'page', 'app', 'ui', 'ux', 'pricing', 'quote', 'cost', 'bye',
      'thanks', 'thank', 'thx', 'cool', 'nice', 'good', 'sure', 'fine', 'yeah',
      'build', 'make', 'create', 'start', 'test', 'demo', 'more', 'info'
    ])

    for (const w of words) {
      const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (!clean) continue
      if (validWords.has(clean)) continue

      // Repeated characters e.g. "aaaaa", "asddddd"
      if (/(.)\1{3,}/.test(clean)) return true

      // Known keyboard mash substrings
      const mashes = ['qwsaz', 'asdf', 'qwer', 'zxcv', 'hjkl', 'dfgh', 'jkl;', 'wsxz', 'qazwsx', 'poiu', 'lkjh', 'tyui']
      if (mashes.some((m) => clean.includes(m))) return true

      // No vowels at all in a word longer than 2 characters (e.g. "qws", "bcdf", "zzzz", "ghjk")
      if (clean.length >= 3 && !/[aeiouy]/.test(clean)) return true

      // 4 or more consonants in a row (e.g. "qwsaz", "fghjkl", "bcdfgh")
      if (/[bcdfghjklmnpqrstvwxz]{4,}/.test(clean)) return true

      // High consonant-to-vowel ratio in short unrecognized tokens (e.g. "qwsaz" has 1 vowel out of 5)
      const vowels = (clean.match(/[aeiouy]/g) || []).length
      const consonants = (clean.match(/[bcdfghjklmnpqrstvwxz]/g) || []).length
      if (clean.length >= 5 && vowels <= 1 && consonants >= 4) {
        return true
      }
    }
  }

  return false
}

function generateConsultantReply(query, prevQuery, allMessages, state) {
  const q = query.trim().toLowerCase()

  // Handle random typing / keyboard mashes / gibberish
  if (isGibberishOrRandom(query)) {
    return `It looks like you might have hit some random keys or tested the keyboard ("${query.trim()}")! 😊

I'm **NOVA**, your AI Website Consultant. How can I actually help you today?

Tell me a bit about what kind of website or project you'd like to build—such as an e-commerce shop, a restaurant website, a creative portfolio, or a business landing page!`
  }

  // Handle greetings e.g. "hi", "hello", "hey", "good morning", "yo"
  const isGreeting =
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q === 'yo' ||
    q === 'hola' ||
    q === 'namaste' ||
    q === 'hii' ||
    q === 'hiii' ||
    q === 'heyy' ||
    q.startsWith('hi ') ||
    q.startsWith('hello ') ||
    q.startsWith('hey ') ||
    q.includes('good morning') ||
    q.includes('good afternoon') ||
    q.includes('good evening')

  if (isGreeting) {
    return `Hello! 👋 I'm **NOVA**, your AI Website Consultant.

I'm here to help you plan, structure, and scope the ideal website for your business or project.

To get started, tell me a bit about what you're looking to build—are you thinking about an e-commerce store, a restaurant website, a service business, or a creative portfolio?`
  }

  if (
    q.includes('talk to someone') ||
    q.includes('hire you') ||
    q.includes('get this built') ||
    q.includes('start the project') ||
    q.includes('start a project') ||
    q.includes('contact you') ||
    q.includes('speak to a person') ||
    q.includes('contact someone')
  ) {
    let summarySnippet = ''
    if (state.businessType || state.websiteType) {
      summarySnippet = `I have captured the key requirements for your **${state.businessName || state.businessType || 'website'}** project${state.productCount ? ` (~${state.productCount} products)` : ''}${state.designStyle ? `, styled in a ${state.designStyle} direction` : ''}.\n\n`
    }
    return `${summarySnippet}Our development team is ready to review your project scope, discuss technical architecture, and provide you with a detailed proposal and timeline.

Would you like to connect with the development team now?

[Contact Us]`
  }

  if (
    q.includes('quote') ||
    q.includes('how much') ||
    q.includes('cost') ||
    q.includes('pricing') ||
    q.includes('price')
  ) {
    return `Pricing depends on the scope of the website, number of pages, custom features, products, and integrations (such as payment gateways, booking tools, or custom animations).

I can help you put together the requirements into a project brief so the development team can provide an accurate quote.

Would you like to discuss this project with the development team to get your tailored quote?

[Contact Us]`
  }

  if (
    q.includes('what did i tell you') ||
    q.includes('summarize') ||
    q.includes('summary') ||
    (q.includes('what do i need') && (state.businessType || state.productCount))
  ) {
    const businessDesc = state.businessName
      ? `${state.businessName} (${state.businessType || 'Business'})`
      : state.businessType || 'General Business'
    const siteType = state.websiteType || 'Custom Modern Website'
    const styleDesc = state.designStyle || 'Modern & Professional'
    const productDesc = state.productCount ? `~${state.productCount} items` : 'N/A (Non-inventory)'

    let featureList = ''
    if (siteType === 'E-commerce Store') {
      featureList = `• Product catalog & categorized collections
• Product details pages with sizing/color options
• Shopping cart & streamlined checkout
• Secure payment gateway integration (Stripe / PayPal)
• Inventory & order management
• Fully responsive mobile-optimized design`
    } else if (siteType === 'Restaurant Website') {
      featureList = `• Interactive digital menu showcase
• Table reservation / booking system
• Location, directions & opening hours
• Photo gallery of ambiance & signature dishes
• Mobile-friendly contact & inquiry form`
    } else {
      featureList = `• Custom branded landing & service pages
• Portfolio & case study showcase
• Contact & lead capture forms
• Mobile responsiveness & search engine optimization`
    }

    return `### Project Summary

**Business:**
${businessDesc}

**Website:**
${siteType}

**Products:**
${productDesc}

**Style:**
${styleDesc}

**Recommended Features:**
${featureList}

Would you like to discuss this project with the development team?

[Contact Us]`
  }

  if (q.includes('what pages') || q.includes('page structure') || q.includes('which pages')) {
    if (state.websiteType === 'E-commerce Store' || state.businessType?.includes('Clothing') || state.productCount) {
      return `For an **e-commerce fashion & apparel website**${state.productCount ? ` with ~${state.productCount} products` : ''}, here is the ideal page structure:

1. **Home Page**: High-impact visual hero, featured collections, best sellers, and brand story highlights.
2. **Shop / Catalog**: All products with category filters (by style, size, color, or price) and search.
3. **Product Details Pages**: High-resolution image zoom, size guides, material specifications, and related items.
4. **Cart & Checkout**: A distraction-free, 1-step or 2-step checkout with guest checkout and secure payment processing.
5. **About the Brand**: The philosophy, craftsmanship, and story behind your collection.
6. **FAQ & Shipping / Returns**: Essential policies that build buyer confidence.
7. **Contact Us**: Customer support email, social links, and contact form.

Would you also like to include a **Lookbook** or style guide gallery to showcase full outfits?`
    } else if (state.websiteType === 'Restaurant Website' || state.businessType?.includes('Restaurant')) {
      return `For your **restaurant website**, we recommend the following key pages:

1. **Home**: Inviting hero visual, welcome note, signature highlights, and instant reservation button.
2. **Menu**: Clean, readable digital menu divided into courses or dietary categories.
3. **Reservations**: Easy date/time booking form or integration with OpenTable/Resy.
4. **Gallery**: Atmospheric photography showcasing your interior, kitchen, and culinary presentations.
5. **About Us**: The chef's philosophy, origin story, and culinary roots.
6. **Location & Contact**: Interactive map, hours of operation, parking guidance, and phone numbers.

Would you like customers to also be able to place takeout or delivery orders directly through the site?`
    } else {
      return `For a professional business website, the standard high-converting structure includes:

1. **Home**: Clear value proposition, core benefits, and strong call to action.
2. **About**: Business background, team, and company mission.
3. **Services / Solutions**: Detailed breakdown of what you offer with client outcomes.
4. **Case Studies / Portfolio**: Proof of past work, client testimonials, and results.
5. **Contact**: Inquiry form, contact details, and location map.

Tell me a little about your specific business so I can customize this list for you!`
    }
  }

  if (q.includes('restaurant') || q.includes('cafe') || q.includes('bistro')) {
    return `Absolutely. A restaurant website is essential for attracting diners and building a loyal local following.

Typically, it includes your menu, location, opening hours, reservations, high-quality food photography, and contact details.

Are you mainly looking for a website that showcases your restaurant and ambiance, or would you also like customers to be able to place online orders or book tables?`
  }

  if (q.includes('sell clothes') || q.includes('clothing') || (q.includes('sell') && q.includes('online'))) {
    return `That sounds like an e-commerce store! Selling apparel online is a great venture, and having the right platform and structure makes all the difference.

Roughly how many products or clothing pieces do you expect to have initially?`
  }

  if (q.includes('100') || q.includes('80') || q.includes('50') || (state.websiteType === 'E-commerce Store' && /\d+/.test(q))) {
    const count = q.match(/\d+/)?.[0] || '100'
    return `Got it, around ${count} products. For a catalog of that size, you'll definitely want:
- Well-organized product categories
- Instant search and filtering (by size, color, or price)
- Detailed product pages with size charts
- A fast, mobile-friendly shopping cart and secure checkout

Do you already have product imagery and branding ready, or what kind of visual style are you looking for?`
  }

  if (q.includes('premium') || q.includes('minimal') || q.includes('modern') || q.includes('luxury')) {
    return `Got it. A **premium and minimal** aesthetic is ideal—it gives the brand an elevated, high-end feel by emphasizing generous whitespace, refined typography, and high-impact photography.

Do you already have brand colors in mind, or would you like recommendations on a palette that fits this look?`
  }

  if (q.includes("don't know") || q.includes('not sure') || q.includes('help me decide')) {
    return `No problem at all—that is exactly what I'm here for!

Tell me a little bit about your business or project, and what you primarily want visitors to do:
1. Learn about your business and contact you for a quote?
2. Book an appointment or reservation?
3. Browse and buy physical or digital products online?
4. View a creative portfolio of your work?`
  }

  if (q.includes('build my website') || q.includes('make my website') || q.includes('code my website')) {
    return `I am your website consultation and planning assistant. I help you map out your website's architecture, pages, features, and design goals.

Once we have your requirements ready, our experienced development team handles the actual coding, design, and launch!

Would you like to review what you have planned so far and connect with the development team?

[Contact Us]`
  }

  if (q.includes('who are you') || q.includes('what do you do') || q.includes('what can you do')) {
    return `I am **NOVA**, an AI Website Consultant. I help business owners, creators, and entrepreneurs plan custom websites.

Here is how I can help you:
• Identify the right type of website for your business goals
• Recommend the exact page structure and user journey you need
• Map out essential features (payments, booking, e-commerce, forms)
• Formulate design and aesthetic directions
• Compile a clear Project Brief and connect you with our web development team for a formal quote

What kind of business or project are you looking to build a website for?`
  }

  if (q.includes('what is html')) {
    return `HTML (HyperText Markup Language) is the foundational building block of every website on the internet. It provides the structure—like headings, paragraphs, buttons, and images—which is then styled with CSS and brought to life with interactive features.

Are you looking to understand the technical stack we would use for your website?`
  }

  if (q.includes('what is an e-commerce website') || q.includes('what is ecommerce')) {
    return `An e-commerce website allows customers to browse products, view details, add items to a digital shopping cart, and securely complete payments online. It includes inventory tracking, order management, and automated receipt emails.

Are you thinking about selling products or services on your website?`
  }

  if (q.includes('joke') || q.includes('make me laugh')) {
    return `Why do web developers prefer dark mode? Because light attracts bugs! 😄
    
Speaking of great design, what kind of website are we looking to bring into focus today?`
  }

  if (q.includes('poem') || q.includes('haiku') || q.includes('rhyme')) {
    return `Pixels align and servers hum,
A modern website soon to come.
Clean and fast, responsive and bright,
Guiding your customers day and night! ✨

If you have a creative project, blog, or brand in mind, I'd love to help you map out the perfect pages and features for it. What are you thinking of building?`
  }

  if (q.includes('weather')) {
    return `Looks like clear skies with a 100% chance of great web design! ☀️

While I'm an AI website consultant rather than a meteorologist, I can definitely help you launch a blazing-fast, modern site. What kind of project are you considering?`
  }

  return `I'm here to help you plan, architect, and scope your website project! 

Tell me a little about your business or project idea, and what you'd like your website to achieve (e.g. online sales, bookings, showcasing work, or generating leads).`
}
