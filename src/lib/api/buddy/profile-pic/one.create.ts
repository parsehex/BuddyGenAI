import { AppSettings } from '@/lib/api/AppSettings';
import { negPromptFromName, posPromptFromName } from '@/lib/prompt/sd';
import { select } from '@/lib/sql';
import type { Buddy, BuddyVersion } from '@/lib/api/types-db';
import { ProfilePicQuality } from '@/lib/api/types-api';
import useElectron from '@/composables/useElectron';
import { makePicture, makePictureKobold } from '@/src/lib/ai/img';
import { popError } from '@/src/lib/utils';
import { isFeatureAvailable } from '@/src/lib/ai/support';

const { dbGet, dbRun } = useElectron();

const colors = [
	'light blue',
	'light red',
	'violet',
	'light green',
	'light yellow',
];

export default async function createProfilePic(
	buddyId: string,
	quality?: ProfilePicQuality,
	gender = ''
) {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');

	if (!isFeatureAvailable('image')) {
		popError('External image generation not yet supported, please use KoboldCpp');
		throw new Error();
	}

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

	const imgData = await makePictureKobold({
		absModelPath: '',
		outputSubDir: '',
		outputFilename: '',
		posPrompt,
		negPrompt,
		size: 512, // TODO un-hardcode High quality
	});

	return imgData;
}
