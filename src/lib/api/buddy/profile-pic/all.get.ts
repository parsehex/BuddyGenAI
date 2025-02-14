import useElectron from '@/composables/useElectron';
import { select } from '@/src/lib/sql';
import type { Buddy, BuddyVersion } from '../../types-db';

const { dbGet, dbAll } = useElectron();

export default async function getAllProfilePics(
	buddyId: string,
	thread?: string
) {
	const sqlBuddy = select('persona', ['*'], { id: buddyId });
	const buddy = (await dbGet(sqlBuddy[0], sqlBuddy[1])) as Buddy;

	if (!buddy) {
		throw new Error('Buddy not found');
	}

	const imageIDs = buddy.profile_pics;

	const sqlImages = select('images', ['*']);
	const images = (await dbAll(sqlImages[0], sqlImages[1])).filter((img: any) => imageIDs?.includes(img.id));

	images.sort((a: any, b: any) => a.timestamp - b.timestamp);

	return images;
}
