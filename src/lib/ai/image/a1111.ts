import { useAppStore } from '@/src/stores/main';
import { AppSettings, type ImgProvider } from '../../api/AppSettings';
import type { ImageRequest } from './types';

let abortCtlr: AbortController | null = null;

export async function makeImage(req: ImageRequest) {
	abortCtlr = new AbortController();
	const provider = AppSettings.get('selected_provider_image') as ImgProvider;
	if (provider !== 'koboldcpp') throw new Error('Called wrong provider');
	const model = AppSettings.get('selected_model_image') as string;

	const store = useAppStore();
	const host = store.settings.koboldcpp_host;
	req = JSON.parse(JSON.stringify(req));
	const { posPrompt, negPrompt, size, steps } = req;
	const height = size;
	let width = size;
	if (size === 768) width = 512;

	const res = await fetch(`${host}/sdapi/v1/txt2img`, {
		signal: abortCtlr.signal,
		method: 'POST',
		body: JSON.stringify({
			model,
			prompt: posPrompt,
			negative_prompt: negPrompt,
			width,
			height,
			steps,
		}),
	});
	const data = await res.json();
	const hasImages = Array.isArray(data.images) && data.images.length;
	if (!hasImages) throw new Error('No images returned from koboldcpp');
	return ('data:image/png;base64,' + data.images[0]) as string;
}

export function stop() {
	if (!abortCtlr) return false;
	abortCtlr.abort();
	abortCtlr = null;
	return true;
}
