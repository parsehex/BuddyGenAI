import z from 'zod';
import OpenAI from 'openai';
import { OpenAIStream } from 'ai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { getDB } from '../database/knex';

const querySchema = z.object({
	threadId: z.string(),
});

export default defineLazyEventHandler(async () => {
	const openai = new OpenAI({
		apiKey: 'sk-1234',
		baseURL: 'http://localhost:8080',
	});

	return defineEventHandler(async (event) => {
		const db = await getDB();
		const { threadId } = await getValidatedQuery(event, (query) => querySchema.parse(query));

		const thread = await db('chat_thread').where({ id: +threadId }).first();
		if (!thread) {
			throw createError({ statusCode: 404, statusMessage: 'Thread not found' });
		}

		const { messages } = (await readBody(event)) as {
			messages: ChatCompletionMessageParam[];
		};
		const userMessage = messages[messages.length - 1];
		if (userMessage.role !== 'user') {
			throw createError({ statusCode: 400, statusMessage: 'Expected user message in last place' });
		}

		const userMsgIndex = messages.length - 1;

		await db('chat_message').insert({
			created: new Date().getTime(),
			role: 'user',
			content: userMessage.content as string,
			thread_id: thread.id,
			thread_index: userMsgIndex,
		});

		const response = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			stream: true,
			messages: messages.map((message) => ({
				content: message.content,
				role: message.role,
			})) as ChatCompletionMessageParam[],
		});

		return OpenAIStream(response, {
			onCompletion: async (completion) => {
				await db('chat_message').insert({
					created: new Date().getTime(),
					role: 'assistant',
					content: completion,
					thread_id: thread.id,
					thread_index: userMsgIndex + 1,
				});
			},
		});
	});
});
