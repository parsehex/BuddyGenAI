import useElectron from '@/src/composables/useElectron';
import { select } from '../sql';

const { dbGet } = useElectron();

export async function getImage(id: string) {
	const sqlImage = select('images', ['*'], { id });
	const image = (await dbGet(sqlImage[0], sqlImage[1]));

	if (!image) {
		throw new Error('Image not found');
	}

	const str = 'data:image/png;base64,' + image.data;
	return str;
}
