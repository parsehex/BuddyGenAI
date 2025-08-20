import { insert, select, update } from '@/lib/sql';
import type { Buddy, BuddyVersion } from '@/lib/api/types-db';
import useElectron from '@/composables/useElectron';
import { v4 } from 'uuid';

const { dbGet, dbRun, fsAccess, pathJoin } = useElectron();

/*
TODO notes about profile pic versioning:
- we would store the profile pic in the version table
- would also keep the pictures themselves
- need to update naming to include the version id
*/

interface AddImageResponse {
	/** `id` of the image within the DB */
	output: string;
}

/** `imgDataB64` should already be formatted and prefixed with "data:image..." */
export default async function addProfilePic(
	buddyId: string,
	imgDataB64: string,
	isManual = false
): Promise<AddImageResponse> {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');

	const sqlBuddy = select('persona', ['*'], { id: buddyId });
	const buddy = (await dbGet(sqlBuddy[0], sqlBuddy[1])) as Buddy;

	if (!buddy) {
		throw new Error('Buddy not found');
	}

	const sqlCurrentVersion = select('persona_version', ['*'], {
		id: buddy.current_version_id,
	});
	const currentVersion = (await dbGet(
		sqlCurrentVersion[0],
		sqlCurrentVersion[1]
	)) as BuddyVersion;

	if (!currentVersion) throw new Error('Buddy version not found');

	const imgId = v4();
	const filename = imgId;

	const sqlImgAdd = insert('images', { id: filename, data: imgDataB64 });
	await dbRun(sqlImgAdd[0], sqlImgAdd[1]);

	const currentPics = buddy.profile_pics || [];
	currentPics.push(filename);

	const data = { profile_pic: filename, profile_pics: currentPics } as any;
	if (isManual) data.profile_pic_prompt = '';
	const sqlUpdate = update('persona', data, { id: buddyId });
	await dbRun(sqlUpdate[0], sqlUpdate[1]);

	console.log('added pic', filename);
	return { output: filename };
}
