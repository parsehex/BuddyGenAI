export default function useLlamaCpp() {
	const startServer = async (modelPath: string, gpuLayers = 35) => {
		console.log('no-op: startServer', modelPath, gpuLayers);
		return false;
	};

	const stopServer = async () => {
		console.log('no-op: stopServer');
	};

	const isServerRunning = async () => {
		console.log('no-op: isServerRunning');
		return false;
	};

	const getLastModel = async () => {
		console.log('no-op: getLastModel');
		return '';
	};

	const getBaseUrl = async () => {
		console.log('no-op: getBaseUrl');
		return '';
	};

	const getServerUrl = async () => {
		console.log('no-op: getServerUrl');
		return '';
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
