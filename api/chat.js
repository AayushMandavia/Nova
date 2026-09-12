import { handleChatRequest } from '../server/chatApi.js'

export default async function handler(req, res) {
  return handleChatRequest(req, res)
}
