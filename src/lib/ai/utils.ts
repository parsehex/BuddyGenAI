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
