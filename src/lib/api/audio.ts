import useElectron from '@/src/composables/useElectron';
import { select } from '../sql';

const { dbGet } = useElectron();

export async function getAudio(id: string) {
	const sql = select('audio', ['*'], { id });
	const audio = (await dbGet(sql[0], sql[1]));

	if (!audio) {
		throw new Error('Audio not found');
	}

	return blobToBase64(audio.data);
}
