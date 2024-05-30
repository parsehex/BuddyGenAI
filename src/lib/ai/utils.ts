import useElectron from '@/composables/useElectron';

export async function verifyFilePath(p: string) {
	const electron = useElectron();
	if (!electron.fsAccess) throw new Error('Electron not found');

	const { fsAccess } = electron;

	try {
		await fsAccess(p);
		return true;
	} catch (e) {
		return false;
	}
}

export function cleanTextForTTS(text: string) {
	// Remove phrases enclosed in asterisks
	let cleanedText = text.replace(/\*[^*]*\*/g, '');

	// replace ... with . . .
	cleanedText = cleanedText.replace(/\.{3}/g, '. . .');

	// remove urls
	cleanedText = cleanedText.replace(/https?:\/\/[^\s]+/g, '');

	return cleanedText;
}
