import { Router, json } from 'express';
import OpenAI from 'openai';
import { OpenAIStream, streamToResponse } from 'ai';
import cors from 'cors';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { AppSettings } from '../AppSettings';

const chatProviderUrls = {
	external: 'https://api.openai.com/v1',
	local: 'http://localhost:8080/v1',
};

const router = Router();

const stop = ['<|eot_id|>', 'USER:', 'user:', '</s>'];
let currentModel = '';

export function updateModel(modelName: string) {
	currentModel = modelName;
}

const openai = new OpenAI({
	apiKey: 'sk-1234',
	// baseURL: 'http://localhost:8080/v1',
});

async function updateOpenai() {
	const isExternal =
		(await AppSettings.get('selected_provider_chat')) === 'external';
	const apiKey = (await AppSettings.get('external_api_key')) as string;
	const selectedChatModel = (await AppSettings.get(
		'selected_model_chat'
	)) as string;

	const baseURL = isExternal
		? chatProviderUrls.external
		: chatProviderUrls.local;
	openai.baseURL = baseURL;
	if (isExternal) openai.apiKey = apiKey;
	else openai.apiKey = 'sk-1234';

	return selectedChatModel;
}

router.use(json());

// long term, i think we need to not use openai pkg with llamafile/local LLMs
//   1. construct prompt from jinja template js-side (llamafile has no templating)
//   2. create & use wrapper to make ReadableStream from response
//   3. use openai pkg for 3rd party apis later (e.g. openrouter)

let openaiModels = [] as OpenAI.Model[];

// route to get openai models
router.get('/api/openai-models', async (req, res) => {
	const apiKey = (await AppSettings.get('external_api_key')) as string;
	if (!apiKey) {
		res.status(400).send('No API key provided');
		res.end();
		return;
	}
	if (openaiModels.length > 0) {
		res.json(openaiModels);
		res.end();
		return;
	}
	await updateOpenai();
	const models = await openai.models.list();
	openaiModels = models.data;
	res.json(models.data);
});

router.options('/api/message', cors());
router.post('/api/message', async (req, res) => {
	const selectedChatModel = await updateOpenai();
	const { max_tokens, temperature, messages, seed } = req.body;

	if (messages.length === 0) {
		res.status(400).send('No messages provided');
		return;
	}

	const aiResponse = await openai.chat.completions.create({
		model: selectedChatModel,
		stream: true,
		messages,
		max_tokens,
		temperature,
		seed,
		stop,
	});

	const stream = OpenAIStream(aiResponse);
	streamToResponse(stream, res);
});

router.options('/api/completion', cors());
router.post('/api/completion', async (req, res) => {
	const selectedChatModel = await updateOpenai();
	const { prompt, max_tokens, temperature } = req.body;

	const response = await openai.chat.completions.create({
		model: selectedChatModel,
		stream: true,
		messages: [
			{
				role: 'system',
				content:
					'Answer the following immediately and without further prose, and write the answer in the third person.',
			},
			{
				role: 'user',
				content: prompt,
			},
			{
				role: 'assistant',
				content: 'Output:',
			},
		],
		max_tokens,
		temperature,
		top_p: 1,
		frequency_penalty: 1,
		presence_penalty: 1,
		stop,
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
