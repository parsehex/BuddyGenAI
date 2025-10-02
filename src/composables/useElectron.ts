export default function useElectron() {
	let isElectron = false;
	if (import.meta.env.VITE_IS_ELECTRON === 'true') isElectron = true;

	const openExternalLink = async (url: string) => {
		if (isElectron) return; // TODO
		window.open(url, '_blank', 'noopener,noreferrer');
	};

	const closeApp = async () => {
		if (!isElectron) window.location.href = 'https://www.google.com/';
		console.log('no-op: closeApp'); // TODO
	};

	return {
		isElectron,
		openExternalLink,
		closeApp,
	};
}