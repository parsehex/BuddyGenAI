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
		// return;
		return await electron.ipcRenderer.invoke(
			'llamacpp/start',
			modelPath,
			gpuLayers
		);
	};

	const stopServer = async () => {
		console.log('Stopping server');
		// return;
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

	const getBaseUrl = async () => {
		return (await electron.ipcRenderer.invoke('llamacpp/baseUrl')) as string;
	};

	const getServerUrl = async () => {
		return (await electron.ipcRenderer.invoke('llamacpp/serverUrl')) as string;
	};

	return {
		startServer,
		stopServer,
		isServerRunning,
		getLastModel,
		getBaseUrl,
		getServerUrl,
	};
}
