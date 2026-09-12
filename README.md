# 🌌 NOVA — AI Website Consultant & Digital Architect

> A cinematic, glassmorphic conversational AI assistant designed to help entrepreneurs, businesses, and creators plan, architect, and scope modern websites.

---

## ✨ Highlights & Features

- **Conversational Intelligence**: Powered by Google Gemini and OpenAI with Server-Sent Events (SSE) for fluid, real-time typing streaming.
- **Natural Personality**: Acts as a sharp, consultative partner who gathers project requirements, recommends customized page structures, and discusses design aesthetics.
- **Cinematic Landscape Aesthetic**: High-definition looping video background with crystal-clear glassmorphism container and zero background blur degradation.
- **Interactive Requirement Scoping**: Automatically identifies buying intent and triggers the interactive **Contact Team** modal with pre-filled consultation notes.
- **Strict Data Validation**:
  - Phone validation: Exactly 10 digits numeric only, with real-time feedback.
  - Standard RFC email syntax validation.
- **Dual AI Provider Waterfall**: Resilient fallback across Google Gemini Flash models (`gemini-flash-latest`, `gemini-3.6-flash`, `gemini-3.5-flash`) and OpenAI (`gpt-4o-mini`).
- **Zero-Config Vercel Support**: Ready-to-deploy Vercel Serverless Function architecture in `/api/chat`.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Server-Sent Events (SSE), Vercel Serverless Functions
- **AI Models**: Google Gemini API & OpenAI Chat Completions API
- **Design System**: Glassmorphism, custom typography, cinematic motion

---

## 🚀 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/AayushMandavia/Nova.git
cd Nova
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory (refer to `.env.example`):
```env
# Google Gemini API Key (Get from https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: OpenAI API Key (Get from https://platform.openai.com/)
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Run development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deploying to Vercel

1. Push your code to your GitHub repository.
2. Import the project into your [Vercel Dashboard](https://vercel.com/new).
3. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google AI Studio API key
   - *(Optional)* `OPENAI_API_KEY`: Your OpenAI API key
4. Click **Deploy**. Vercel will automatically build the static assets and deploy `/api/chat` as a serverless function!

---

## 📄 License
This project is licensed under the MIT License.
