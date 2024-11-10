import type { PiperOptions } from '@/lib/api/types-api';

export default function usePiper() {
	const isServer =
		process.server ||
		typeof window === 'undefined' ||
		typeof window.require === 'undefined';
	const isElectron =
		!isServer && navigator.userAgent.toLowerCase().includes('electron');

	if (!isElectron || isServer) return;

	const electron = window.require('electron');

	const runPiper = async (options: PiperOptions) => {
		console.time('runPiper');
		const res = await electron.ipcRenderer.invoke('piper/run', options);
		console.timeEnd('runPiper');
		return res as string;
	};

	return {
		runPiper,
	};
}
