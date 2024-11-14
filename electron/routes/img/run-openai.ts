import OpenAI from 'openai';
import { state } from '../../sd-state';
import * as config from '../../config';
import * as fs from 'fs-extra';
import { handleUpdate } from './progress-state';
import { getProviderKey } from '../../providers/keys';

export async function runOpenAI(model: string, prompt: string, output: string) {
	const cfg = config.get();
	const apiKey = getProviderKey('openai');

	if (!apiKey) throw new Error('No image API key');
	if (!cfg.selected_model_image) throw new Error('No selected model');
	if (!prompt || !output) throw new Error('Missing prompt or output');

	state.generationProgress = 0;
	handleUpdate('start');

	const openai = new OpenAI({
		apiKey,
	});

	const completion = await openai.images.generate({
		model,
		prompt,
		size: '1024x1024',
		quality: 'standard',
		n: 1,
	});
	const image_url = completion.data[0].url;

	if (!image_url) throw new Error('No image URL found');

	const image = await fetch(image_url);
	const buffer = await image.arrayBuffer();
	await fs.writeFile(output, Buffer.from(buffer));

	handleUpdate('stop');
	return output;
}
