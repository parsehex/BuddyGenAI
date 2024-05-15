export default function useLlamaCpp() {
	const isServer =
		process.server ||
		typeof window === 'undefined' ||
		typeof window.require === 'undefined';
	const isElectron =
		!isServer && navigator.userAgent.toLowerCase().includes('electron');

	if (!isElectron || isServer) return;

	const electron = window.require('electron');

	const startServer = async (modelPath: string, gpuLayers = 35) => {
		console.log('Starting server', modelPath);
		return await electron.ipcRenderer.invoke(
			'llamacpp/start',
			modelPath,
			gpuLayers
		);
	};

	const stopServer = async () => {
		await electron.ipcRenderer.invoke('llamacpp/stop');
	};

	const isServerRunning = async () => {
		return await electron.ipcRenderer.invoke('llamacpp/status');
	};

	const getLastModel = async () => {
		const p = await electron.ipcRenderer.invoke('llamacpp/lastModel');
		const slash = p.lastModel.includes('\\') ? '\\' : '/';
		const filename = p.lastModel.split(slash).pop();
		return filename;
	};

	return {
		startServer,
		stopServer,
		isServerRunning,
		getLastModel,
	};
}
