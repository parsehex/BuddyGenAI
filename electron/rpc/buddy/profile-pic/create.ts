import fs from 'fs-extra';
import path from 'path';
import type { Buddy, BuddyVersion, BuddyVersionMerged } from '@/types/db';
import type { CreateBuddyOptions, ProfilePicQuality } from '@/types/api';
import { get, run } from '@/modules/db';
import { AppSettings } from '@/AppSettings';
import { makePicture } from '@/ai/img';
import { posPromptFromName, negPromptFromName } from '@/shared/ai/prompts/sd';
import { insert, select, update } from '@/sql';

interface CreateBuddyProfilePicInput {
	id: string;
	quality?: ProfilePicQuality;
	gender?: string;
}

const colors = [
	'light blue',
	'light red',
	'violet',
	'light green',
	'light yellow',
];

export async function createBuddyProfilePic({
	id,
	quality,
	gender,
}: CreateBuddyProfilePicInput) {
	const isExternal =
		(await AppSettings.get('selected_provider_image')) === 'external';

	const modelDir = (await AppSettings.get('local_model_directory')) as string;
	const selectedImageModel = (await AppSettings.get(
		'selected_model_image'
	)) as string;
	let modelPath = '';

	if (!selectedImageModel) throw new Error('No image model selected');
	if (!isExternal) {
		if (!modelDir) throw new Error('Model directory not set');

		modelPath = path.join(modelDir, selectedImageModel);
		try {
			await fs.access(modelPath);
		} catch (e) {
			throw new Error('Image model file not found');
		}
	}

	const sqlBuddy = select('persona', ['*'], { id });
	const buddy = (await get(sqlBuddy[0], sqlBuddy[1])) as Buddy;

	if (!buddy) {
		throw new Error('Buddy not found');
	}

	const sqlCurrentVersion = select('persona_version', ['*'], {
		id: buddy.current_version_id,
	});
	const currentVersion = (await get(
		sqlCurrentVersion[0],
		sqlCurrentVersion[1]
	)) as BuddyVersion;

	if (!currentVersion) throw new Error('Buddy version not found');

	let extraPrompt = '';
	if (buddy.profile_pic_prompt) {
		extraPrompt = buddy.profile_pic_prompt;
	}

	let animated = false;

	// does model name contain "illuminati"?
	if (selectedImageModel.includes('illuminati')) {
		animated = true;
	}

	const ranColor = colors[Math.floor(Math.random() * colors.length)];

	const posPrompt = posPromptFromName(
		currentVersion.name,
		extraPrompt + `, (${ranColor} background)`,
		gender,
		animated
	);
	const negPrompt = negPromptFromName(currentVersion.name, gender);

	const filename = `${Date.now()}.png`;
	await makePicture({
		absModelPath: modelPath,
		outputSubDir: buddy.id,
		outputFilename: filename,
		posPrompt,
		negPrompt,
		size: 512, // TODO un-hardcode High quality
	});

	const sqlUpdate = update('persona', { profile_pic: filename }, { id });
	await run(sqlUpdate[0], sqlUpdate[1]);

	console.log('created pic', filename);
	return { output: filename };
}
