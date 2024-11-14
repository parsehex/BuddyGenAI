import { Router, json } from 'express';
import OpenAI from 'openai';
import { OpenAIStream, streamToResponse, AIStream } from 'ai';
import cors from 'cors';
import * as config from '../../config';
import { getLlamaCppApiKey, getLlamaCppPort } from '../../rand';
import { getProviderKey } from '../../providers/keys';

// TODO
// #. Remove prompt handling
// #. Use lookup function for urls?
// #. This file should use methods of the current-selected chat provider
//   - Use generator function for streaming calls

const chatProviderUrls = {
	external: 'https://api.openai.com/v1',
	local: 'http://localhost:8080/v1',
};

const router = Router();

const stop = ['<|eot_id|>', 'USER:', '<|im_end|>', '<|im_start|>'];
let currentModel = '';

export function updateModel(modelName: string) {
	currentModel = modelName;
}

const openai = new OpenAI({
	apiKey: 'sk-1234',
});

async function updateOpenai() {
	const cfg = config.get();
	const provider = cfg.selected_provider_chat;
	const apiKey = getProviderKey(provider as any);
	const selectedChatModel = cfg.selected_model_chat;

	const llamaCppPort = getLlamaCppPort();
	const llamaCppApiKey = getLlamaCppApiKey();
	const llamaCppUrl = `http://localhost:${llamaCppPort}/v1`;

	// TODO getProviderEndpoint function
	const baseURL = provider !== 'local' ? chatProviderUrls.external : llamaCppUrl;
	openai.baseURL = baseURL;

	if (provider !== 'local') openai.apiKey = apiKey;
	else openai.apiKey = llamaCppApiKey;

	return selectedChatModel;
}

router.use(json());

let openaiModels = [] as OpenAI.Model[];

// route to get openai models
// TODO just make generic
router.get('/api/openai-models', async (req, res) => {
	const cfg = config.get();
	const provider = cfg.selected_provider_chat;
	const apiKey = getProviderKey(provider as any);
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

	console.log('selectedChatModel:', selectedChatModel);

	const aiResponse = await openai.chat.completions.create({
		model: selectedChatModel,
		stream: true,
		messages,
		max_tokens,
		temperature,
		seed,
		stop,
	});

	// const stream = OpenAIStream(aiResponse);
	// streamToResponse(stream, res);

	res.writeHead(200, {
		'Content-Type': 'application/json',
		'Transfer-Encoding': 'chunked',
	});

	console.log('streaming response');
	for await (const chunk of aiResponse) {
		res.write('data:' + JSON.stringify(chunk, null, '') + '\n');
	}
	res.write('data:[DONE]\n');
	res.end();
});

router.options('/api/complete', cors());
router.post('/api/complete', async (req, res) => {
	const llamaCppPort = getLlamaCppPort();
	const llamaCppApiKey = getLlamaCppApiKey();
	const url = `http://localhost:${llamaCppPort}/v1/chat/completions`;

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${llamaCppApiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(req.body),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		// Set headers to match the LCP response
		res.writeHead(response.status, {
			'Content-Type': response.headers.get('Content-Type') || 'application/json',
			'Transfer-Encoding': 'chunked',
		});

		// Stream the response back to the client
		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error('Unable to read response stream');
		}

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			res.write(value);
		}

		res.end();
	} catch (error) {
		console.error('Error in LCP proxy:', error);
		res
			.status(500)
			.json({ error: 'An error occurred while proxying the request' });
	}
});

router.options('/api/completion', cors());
router.post('/api/completion', async (req, res) => {
	const selectedChatModel = await updateOpenai();
	const { prompt, max_tokens, temperature, messages } = req.body;

	const payload = {
		messages,
		max_tokens,
		temperature,
		stream: false,
		stop,
	} as any;

	// const llamaCppPort = getLlamaCppPort();
	// const llamaCppApiKey = getLlamaCppApiKey();
	// const llamaCppUrl = `http://localhost:${llamaCppPort}/v1`;

	// const aiResponse = await fetch(`${llamaCppUrl}/chat/completions`, {
	// 	method: 'POST',
	// 	headers: {
	// 		Authorization: `Bearer ${llamaCppApiKey}`,
	// 		'Content-Type': 'application/json',
	// 	},
	// 	body: JSON.stringify(payload),
	// });
	// const data = await aiResponse.json();
	// res.json(data);

	const aiResponse = await openai.chat.completions.create({
		model: selectedChatModel,
		prompt,
		...payload,
	});

	res.json(aiResponse);
});

router.get('/health', async (req, res) => {
	try {
		const port = getLlamaCppPort();
		const url = `http://localhost:${port}/health`;
		const response = await fetch(url);
		const data = await response.json();
		res.json({ isRunning: data.status === 'ok', currentModel });
	} catch (error) {
		res.status(200).json({ isRunning: false, currentModel });
	}
});

export default router;
