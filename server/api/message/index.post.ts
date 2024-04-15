import z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { OpenAIStream } from 'ai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { getDB } from '../../database/knex';
import { promptFromPersonaDescription } from '~/lib/prompt/persona';

// TODO load api from db + figure out all that stuff
// to allow picking 3rd party apis or whatever (like companion server app)

export default defineLazyEventHandler(async () => {
	const openai = new OpenAI({
		apiKey: 'sk-1234',
		baseURL: 'http://localhost:8080',
	});

	return defineEventHandler(async (event) => {
		const db = await getDB();
		const { threadId } = await readBody(event);

		const thread = await db('chat_thread').where({ id: threadId }).first();
		if (!thread) {
			throw createError({ statusCode: 404, statusMessage: 'Thread not found' });
		}

		const { messages } = (await readBody(event)) as {
			messages: ChatCompletionMessageParam[];
		};

		if (thread.mode === 'persona' && thread.persona_mode_use_current) {
			const persona = await db('persona').where({ id: thread.persona_id }).first();
			if (!persona) {
				throw createError({ statusCode: 404, statusMessage: 'Persona not found' });
			}

			const personaVersion = await db('persona_version').where({ id: persona.current_version_id }).first();
			if (!personaVersion) {
				throw createError({ statusCode: 404, statusMessage: 'Persona version not found' });
			}

			messages[0].content = promptFromPersonaDescription(personaVersion.name, personaVersion.description);
		}

		const userMessage = messages[messages.length - 1];
		if (userMessage.role !== 'user') {
			throw createError({ statusCode: 400, statusMessage: 'Expected user message in last place' });
		}

		const userMsgIndex = messages.length - 1;

		const response = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			stream: true,
			temperature: 0.9,
			messages: messages.map((message) => ({
				content: message.content,
				role: message.role,
			})) as ChatCompletionMessageParam[],
		});

		return OpenAIStream(response, {
			onCompletion: async (completion) => {
				await db('chat_message').insert({
					id: uuidv4(),
					created: new Date().getTime(),
					role: 'user',
					content: userMessage.content as string,
					thread_id: thread.id,
					thread_index: userMsgIndex,
				});
				await db('chat_message').insert({
					id: uuidv4(),
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
