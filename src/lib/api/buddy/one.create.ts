import { v4 as uuidv4 } from 'uuid';
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import { insert, select, update } from '@/lib/sql';
import useDB from '@/src/composables/useDB';

const db = useDB();

interface CreateBuddyOptions {
	name: string;
	tts_voice?: string;
	description?: string;
	profile_pic?: string;
	profile_pic_prompt?: string;
	profile_pic_use_prompt?: boolean;
	appearance_options?: string;
	selected_appearance_options?: string;
}

export default async function createOne({
	name,
	tts_voice = '',
	description,
	profile_pic,
	profile_pic_prompt,
	profile_pic_use_prompt = true,
	appearance_options,
	selected_appearance_options,
}: CreateBuddyOptions): Promise<BuddyVersionMerged> {
	if (!name) {
		throw new Error('Name is required');
	}

	const firstVersionId = uuidv4();
	const buddyId = uuidv4();

	const sqlBuddy = insert('persona', {
		id: buddyId,
		created: new Date().getTime(),
		tts_voice,
		profile_pic,
		profile_pic_prompt,
		profile_pic_use_prompt,
		profile_pics: [],
		appearance_options,
		selected_appearance_options,
	});
	await db.run(sqlBuddy[0], sqlBuddy[1]);
	const sqlBuddyGet = select('persona', ['*'], { id: buddyId });
	const buddy = await db.get(sqlBuddyGet[0], sqlBuddyGet[1]);

	const sqlBuddyVersion = insert('persona_version', {
		id: firstVersionId,
		created: new Date().getTime(),
		persona_id: buddyId,
		version: 1,
		name,
		description,
	});
	await db.run(sqlBuddyVersion[0], sqlBuddyVersion[1]);

	const sqlBuddyUpdate = update(
		'persona',
		{ current_version_id: firstVersionId },
		{ id: buddyId }
	);
	await db.run(sqlBuddyUpdate[0], sqlBuddyUpdate[1]);

	return {
		...buddy,
		name,
		description,
	} as BuddyVersionMerged;
}
