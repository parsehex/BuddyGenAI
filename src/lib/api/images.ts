import { select } from '../sql';
import useDB from '@/src/composables/useDB';

const db = useDB();

export async function getImage(id: string) {
	if (id.includes('data:')) return id;

	const sqlImage = select('images', ['*'], { id });
	const image = (await db.get(sqlImage[0], sqlImage[1]));

	if (!image) {
		throw new Error('Image not found');
	}

	let str = image.data as string;

	if (!str.includes('data:') && !str.includes('base64')) str = 'data:image/png;base64,' + str;

	return str;
}
