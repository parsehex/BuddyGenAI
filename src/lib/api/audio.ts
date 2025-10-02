import { select } from '../sql';
import { blobToBase64 } from '../utils';
import useDB from '@/src/composables/useDB';

const db = useDB();

export async function getAudio(id: string) {
	if (id.includes('data:')) return id;

	const sql = select('audio', ['*'], { id });
	const audio = (await db.get(sql[0], sql[1]));

	if (!audio) {
		throw new Error('Audio not found');
	}

	return blobToBase64(audio.data);
}
