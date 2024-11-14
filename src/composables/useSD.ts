import type { SDOptions } from '@/lib/api/types-api';

export default function useSD() {
	const isServer =
		// @ts-ignore
		process.server ||
		typeof window === 'undefined' ||
		typeof window.require === 'undefined';
	const isElectron =
		!isServer && navigator.userAgent.toLowerCase().includes('electron');

	if (!isElectron || isServer) return;

	// TODO getProgress

	const runSD = async (options: SDOptions) => {
		// call /api/img/generate
		const url = 'http://localhost:8079/api/img/generate';
		const body = {
			prompt: options.pos,
			output: options.output,
			negative: options.neg,
		};
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});
		const data = await response.json();
		return data.output;
	};

	return {
		runSD,
	};
}
