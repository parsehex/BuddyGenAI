import { AppSettings } from '@/lib/api/AppSettings';
import { negPromptFromName, posPromptFromName } from '@/lib/prompt/sd';
import { insert, select, update } from '@/lib/sql';
import type { Buddy, BuddyVersion } from '@/lib/api/types-db';
import { ProfilePicQuality } from '@/lib/api/types-api';
import useElectron from '@/composables/useElectron';
import { makePicture, makePictureKobold } from '@/src/lib/ai/img';
import { v4 } from 'uuid';

const { dbGet, dbRun, fsAccess, pathJoin } = useElectron();

// TODO handle needing to shut off chat server and restarting after generating image
//   i think this looks like an option to unload chat while generating image

// TODO rewrite

/*
TODO notes about profile pic versioning:
- we would store the profile pic in the version table
- would also keep the pictures themselves
- need to update naming to include the version id
*/

const colors = [
	'light blue',
	'light red',
	'violet',
	'light green',
	'light yellow',
];

export default async function createProfilePic(
	id: string,
	quality?: ProfilePicQuality,
	gender = ''
) {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');

	const isExternal = AppSettings.get('selected_provider_chat') === 'cloud' && AppSettings.get('selected_provider_chat') !== 'local';
	if (isExternal) {
		throw new Error('External image generation not yet supported');
	}

	const sqlBuddy = select('persona', ['*'], { id });
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

	let extraPrompt = '';
	if (buddy.profile_pic_prompt) {
		extraPrompt = buddy.profile_pic_prompt;
	}

	let animated = false;

	const ranColor = colors[Math.floor(Math.random() * colors.length)];
	const posPrompt = posPromptFromName(
		currentVersion.name,
		extraPrompt + `, (${ranColor} background)`,
		gender,
		animated
	);
	const negPrompt = negPromptFromName(currentVersion.name, gender);

	const imgId = v4();
	const filename = imgId;
	const imgData = await makePictureKobold({
		absModelPath: '',
		outputSubDir: '',
		outputFilename: '',
		posPrompt,
		negPrompt,
		size: 512, // TODO un-hardcode High quality
	});

	const sqlImgAdd = insert('images', { id: filename, data: imgData });
	await dbRun(sqlImgAdd[0], sqlImgAdd[1]);

	const currentPics = buddy.profile_pics || [];
	currentPics.push(filename);

	const sqlUpdate = update('persona', { profile_pic: filename, profile_pics: currentPics }, { id });
	await dbRun(sqlUpdate[0], sqlUpdate[1]);

	console.log('created pic', filename);
	return { output: filename };
}
