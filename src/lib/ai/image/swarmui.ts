import { useAppStore } from '@/src/stores/main';
import { AppSettings, type ImgProvider } from '../../api/AppSettings';
import type { ImageRequest } from './types';
import type { ModelObject } from '../chat';

let abortCtlr: AbortController | null = null;
let sessionId: string | null = null;

async function getSession(host: string, signal: AbortSignal) {
	const res = await fetch(`${host}/API/GetNewSession`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'user-agent': 'buddyGenAI',
		},
		body: '{}',
		signal,
	});
	const data = await res.json();
	if (data.session_id) {
		sessionId = data.session_id;
	} else {
		throw new Error('Failed to get SwarmUI session ID');
	}
}

async function runWithSession<T>(
	host: string,
	signal: AbortSignal,
	call: () => Promise<T>
): Promise<T> {
	if (!sessionId) {
		await getSession(host, signal);
	}
	try {
		return await call();
	} catch (error: any) {
		if (error.message === 'invalid_session_id') {
			await getSession(host, signal);
			return await call();
		}
		throw error;
	}
}

async function imageUrlToBase64(
	url: string,
	signal: AbortSignal
): Promise<string> {
	const response = await fetch(url, { signal });
	if (!response.ok) {
		throw new Error(
			`Failed to download image from ${url}: ${response.statusText}`
		);
	}
	const blob = await response.blob();
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

export async function makeImage(req: ImageRequest) {
	abortCtlr = new AbortController();
	const signal = abortCtlr.signal;

	const provider = AppSettings.get('selected_provider_image') as ImgProvider;
	if (provider !== 'swarmui') throw new Error('Called wrong provider');
	const model = AppSettings.get('selected_model_image') as string;

	const store = useAppStore();
	const host = store.settings.swarmui_host;

	req = JSON.parse(JSON.stringify(req));
	const { posPrompt, negPrompt, size, steps } = req;
	const height = size;
	let width = size;
	if (size === 768) width = 512;

	return await runWithSession(host, signal, async () => {
		const requestBody = {
			images: 1,
			session_id: sessionId,
			donotsave: true,
			prompt: posPrompt,
			negativeprompt: negPrompt,
			model: model || 'OfficialStableDiffusion/sd_xl_base_1.0',
			width,
			height,
			cfgscale: 7.5,
			steps,
			seed: -1,
		};

		const res = await fetch(`${host}/API/GenerateText2Image`, {
			signal,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'user-agent': 'buddyGenAI',
			},
			body: JSON.stringify(requestBody),
		});

		const data = await res.json();

		if (data.error_id === 'invalid_session_id') {
			throw new Error('invalid_session_id');
		} else if (data.error) {
			throw new Error(`Swarm API error: ${data.error}`);
		}

		const hasImages = Array.isArray(data.images) && data.images.length;
		if (!hasImages) throw new Error('No images returned from SwarmUI');

		const imageUrl = data.images[0];
		return await imageUrlToBase64(imageUrl, signal);
	});
}

export function stop() {
	if (!abortCtlr) return false;
	abortCtlr.abort();
	abortCtlr = null;
	return true;
}

export async function getModels(): Promise<ModelObject[]> {
	abortCtlr = new AbortController();
	const signal = abortCtlr.signal;

	const store = useAppStore();
	const host = store.settings.swarmui_host;

	return await runWithSession(host, signal, async () => {
		const res = await fetch(`${host}/API/ListModels`, {
			signal,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'user-agent': 'buddyGenAI',
			},
			body: JSON.stringify({ session_id: sessionId, path: '', depth: 3 }),
		});

		const data = await res.json();

		if (data.error_id === 'invalid_session_id') {
			throw new Error('invalid_session_id');
		} else if (data.error) {
			throw new Error(`Swarm API error: ${data.error}`);
		}

		return data.files.map((v: any) => ({ model_id: v.name, model_url: v.name }));
	});
}
