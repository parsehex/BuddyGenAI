import OpenAI from 'openai';
import fs from 'fs-extra';
import { getProviderKey } from '../../providers/keys';

export async function runOpenai(
	model: string,
	output: string,
	text: string
): Promise<string> {
	const apiKey = getProviderKey('openai');
	if (!apiKey) {
		throw new Error('OpenAI API key not found');
	}
	const openai = new OpenAI({ apiKey });

	if (!model) {
		throw new Error('Model not selected');
	}

	try {
		const mp3 = await openai.audio.speech.create({
			model: 'tts-1',
			voice: model as any,
			input: text,
			response_format: 'mp3',
		});
		const buffer = Buffer.from(await mp3.arrayBuffer());
		await fs.writeFile(output, buffer);
		return output;
	} catch (error: any) {
		throw error;
	}
}
