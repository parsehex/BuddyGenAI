import fs from 'fs-extra';
import { getDataPath } from '@/fs';

export async function getAllBuddyProfilePics(buddyId: string, thread?: string) {
	let p = 'images/' + buddyId;
	if (thread) {
		p += '/' + thread;
	}

	const dataPath = getDataPath(p);
	const files = await fs.readdir(dataPath);
	const images = files.filter((f) => f.endsWith('.png'));

	images.sort((a, b) => b.localeCompare(a));

	return images;
}
