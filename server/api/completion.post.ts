import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

export default defineLazyEventHandler(async () => {
	const openai = new OpenAI({
		apiKey: 'sk-1234',
		baseURL: 'http://localhost:8080',
	});

	return defineEventHandler(async (event) => {
		const { prompt, max_tokens, temperature } = await readBody(event);

		const response = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			stream: true,
			messages: [
				{
					role: 'user',
					content: prompt,
				},
			],
			max_tokens,
			temperature,
			top_p: 1,
			frequency_penalty: 1,
			presence_penalty: 1,
		});

		const stream = OpenAIStream(response);
		return new StreamingTextResponse(stream);
	});
});
