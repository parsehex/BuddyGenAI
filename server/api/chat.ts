import OpenAI from 'openai'
import { OpenAIStream } from 'ai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

export default defineLazyEventHandler(async () => {
  const openai = new OpenAI({
    apiKey: 'sk-1234',
    baseURL: 'http://localhost:8080'
  })

  return defineEventHandler(async (event) => {
    const { messages } = (await readBody(event)) as {
      messages: ChatCompletionMessageParam[]
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages: messages.map((message) => ({
        content: message.content,
        role: message.role
      })) as ChatCompletionMessageParam[]
    })

    return OpenAIStream(response)
  })
})
