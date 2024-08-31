import { Router, json } from 'express';
import OpenAI from 'openai';
import { OpenAIStream, streamToResponse, AIStream } from 'ai';
import cors from 'cors';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { AppSettings } from '../AppSettings';
import { Message } from 'openai/resources/beta/threads/messages/messages';
import { getLlamaCppApiKey, getLlamaCppPort } from '../rand';
import { contextLengthMap } from '../LCPP-const';

const chatProviderUrls = {
	external: 'https://api.openai.com/v1',
	local: 'http://localhost:8080/v1',
};

const router = Router();

const stop = [
	'<|eot_id|>',
	'USER:',
	'user:',
	'</s>',
	'<|end|>',
	'<|im_0|>',
	'<|im_end|>',
	'<|im_start|>',
];
let currentModel = '';

export function updateModel(modelName: string) {
	currentModel = modelName;
}

const openai = new OpenAI({
	apiKey: 'sk-1234',
});

async function updateOpenai() {
	const isExternal =
		(await AppSettings.get('selected_provider_chat')) === 'external';
	const apiKey = (await AppSettings.get('external_api_key')) as string;
	const selectedChatModel = (await AppSettings.get(
		'selected_model_chat'
	)) as string;

	const llamaCppPort = getLlamaCppPort();
	const llamaCppApiKey = getLlamaCppApiKey();
	const llamaCppUrl = `http://localhost:${llamaCppPort}/v1`;

	const baseURL = isExternal ? chatProviderUrls.external : llamaCppUrl;
	openai.baseURL = baseURL;

	if (isExternal) openai.apiKey = apiKey;
	else openai.apiKey = llamaCppApiKey;

	return selectedChatModel;
}

router.use(json());

function convertToPhi3Format(messages: Message[]): string {
	// phi-3 template (may be incorrect):
	// <s><|user|>
	// {system_prompt}<|end|>
	// <|user|>
	// {prompt}<|end|>
	// <|assistant|>

	// might need newlines before <|end|>

	// after {system_prompt}<|end|>, can have pairs of
	//   <|user|>\n{prompt}<|end|> and <|assistant|>\n{response}<|end|>

	// return '';

	let prompt = '';

	// first message is always system (phi3 uses user tag for system prompt)
	prompt += `<|user|>\n${messages[0].content}\n<|end|>\n`;

	for (let i = 1; i < messages.length; i++) {
		const message = messages[i];
		const role = message.role.toLowerCase();
		prompt += `<|${role}|>\n${message.content}\n<|end|>\n`;
	}

	return prompt.trim();
}

async function useAlternateCompletion(options: any, res: any) {
	// POST /completion with the same options
	// include stream: true
	// convert messages to correct format for model (phi3)
	//   pass `prompt` instead of `messages`
	// how does stream work?
	//   when true, returns an event stream
	// as far as the ai sdk stuff,
	//   i think we can do pretty much everything normally
	// maybe follow note below a bit, basically we still end up using streamToResponse

	const { messages, max_tokens, temperature, jsonSchema } = options;

	const payload = {
		// prompt: convertToPhi3Format(messages),
		messages,
		max_tokens,
		temperature,
		stream: true,
		stop,
	} as any;

	if (jsonSchema) {
		payload.json_schema = jsonSchema;
	}

	const llamacppPort = getLlamaCppPort();
	const url = `http://localhost:${llamacppPort}/v1/chat/completions`;
	const apiKey = getLlamaCppApiKey();

	// console.time('tokenizeData');
	// let prompt = '';
	// // construct prompt to get approx token count
	// for (let i = 0; i < messages.length; i++) {
	// 	const message = messages[i];
	// 	prompt += `${message.role}: ${message.content}\n\n`;
	// }

	// this is a bit slow for my liking -- any way to optimize?
	// call /tokenize to get token count
	// const tokenizeResponse = await fetch(
	// 	`http://localhost:${llamacppPort}/tokenize`,
	// 	{
	// 		method: 'POST',
	// 		headers: {
	// 			Authorization: `Bearer ${apiKey}`,
	// 			'Content-Type': 'application/json',
	// 		},
	// 		body: JSON.stringify({ content: prompt }),
	// 	}
	// );
	// const tokenizeData = await tokenizeResponse.json();
	// console.timeEnd('tokenizeData');
	// const tokenCount = tokenizeData.tokens.length * 1.1;
	// console.log('token count:', tokenCount);

	// // is token count within 25% of model's limit?
	// const model = currentModel;
	// const contextLength = contextLengthMap[model];
	// const tokenLimit = contextLength;
	// if (tokenCount > tokenLimit) {
	// 	// remove 2 messages at a time starting from the beginning (leaving 1st msg) until token count is within limit
	// }

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});

	let i = 0;
	const stream = AIStream(response, (data) => {
		// if (i < 15) {
		// 	console.log(data);
		// 	i++;
		// }

		// when using /completion:
		// const parsed = JSON.parse(data);
		// return parsed.content;

		// /v1/chat/completions:
		const parsed = JSON.parse(data);
		// if (parsed.usage) {
		// 	console.log('usage', parsed.usage);
		// }
		return parsed.choices[0].delta.content;
	});
	streamToResponse(stream, res);
}

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

	if (selectedChatModel.toLowerCase().includes('phi-3')) {
		useAlternateCompletion(req.body, res);
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
	const { prompt, max_tokens, temperature, json_schema, messages } = req.body;

	const messagesToComplete: ChatCompletionMessageParam[] = [
		{
			role: 'system',
			content:
				"Assistant's task is to answer the following immediately and without further prose.",
		},
		{
			role: 'user',
			content: prompt,
		},
		{
			role: 'assistant',
			content: 'Response: ',
		},
	];

	let messagesToPass = messagesToComplete;

	if (messages) {
		messagesToPass = messages.slice();
		// set the first/system message to prompt
		messagesToPass[0].content = prompt;
	}

	// console.log('messagesToPass', messagesToPass);

	// if (selectedChatModel.toLowerCase().includes('phi-3')) {
	useAlternateCompletion(
		{
			messages: messagesToPass,
			max_tokens,
			temperature,
			jsonSchema: json_schema,
		},
		res
	);
	return;
	// }

	const response = await openai.chat.completions.create({
		model: selectedChatModel,
		stream: true,
		messages: messagesToComplete,
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
