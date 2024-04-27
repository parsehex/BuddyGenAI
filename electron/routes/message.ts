import { Router, json } from 'express';
import OpenAI from 'openai';
import { OpenAIStream, streamToResponse } from 'ai';
import cors from 'cors';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const router = Router();

let currentModel = '';

export function updateModel(modelName: string) {
	currentModel = modelName;
}

const openai = new OpenAI({
	apiKey: 'sk-1234',
	baseURL: 'http://localhost:8080',
});

router.use(json());

router.options('/api/message', cors());
router.post('/api/message', async (req, res) => {
	const { max_tokens, temperature, messages, seed } = req.body;

	if (messages.length === 0) {
		res.status(400).send('No messages provided');
		return;
	}

	const aiResponse = await openai.chat.completions.create({
		model: 'gpt-4',
		stream: true,
		messages,
		max_tokens,
		temperature,
		seed,
	});

	const stream = OpenAIStream(aiResponse);
	streamToResponse(stream, res);
});

router.options('/api/completion', cors());
router.post('/api/completion', async (req, res) => {
	const { prompt, max_tokens, temperature } = req.body;

	const response = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		stream: true,
		messages: [
			{
				role: 'user',
				content: prompt + `\n\nOutput:`,
			},
		],
		max_tokens,
		temperature,
		top_p: 1,
		frequency_penalty: 1,
		presence_penalty: 1,
	});

	const stream = OpenAIStream(response);
	streamToResponse(stream, res);
});

router.get('/health', async (req, res) => {
	try {
		const response = await fetch('http://localhost:8080/health');
		const data = await response.json();
		res.json({ isRunning: true, currentModel });
	} catch (error) {
		res.status(200).json({ isRunning: false, currentModel });
	}
});

export default router;
