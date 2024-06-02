import type { SDOptions } from '@/lib/api/types-api';

export default function useSD() {
	const isServer =
		process.server ||
		typeof window === 'undefined' ||
		typeof window.require === 'undefined';
	const isElectron =
		!isServer && navigator.userAgent.toLowerCase().includes('electron');

	if (!isElectron || isServer) return;

	const electron = window.require('electron');

	// TODO getProgress

	const runSD = async (options: SDOptions) => {
		console.time('runSD');
		const res = await electron.ipcRenderer.invoke('SD/run', options);
		console.timeEnd('runSD');
		return res;
	};

	return {
		runSD,
	};
}
