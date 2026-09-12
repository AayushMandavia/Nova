import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { handleChatRequest, loadEnvFile } from './server/chatApi.js'

loadEnvFile(process.cwd())

function chatApiPlugin() {
  return {
    name: 'chat-api-middleware',
    configureServer(server) {
      server.middlewares.use('/api/chat', (req, res) => {
        handleChatRequest(req, res)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/chat', (req, res) => {
        handleChatRequest(req, res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), chatApiPlugin()],
})


