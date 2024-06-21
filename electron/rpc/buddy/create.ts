import { v4 as uuidv4 } from 'uuid';
import type { Buddy, BuddyVersionMerged } from '@/types/db';
import { insert, select, update } from '@/sql';
import type { CreateBuddyOptions } from '@/types/api';
import { get, run } from '@/modules/db';

export async function createBuddy({
	name,
	tts_voice = '',
	description,
	profile_pic,
	profile_pic_prompt,
	profile_pic_use_prompt = true,
	appearance_options,
	selected_appearance_options,
}: CreateBuddyOptions): Promise<BuddyVersionMerged> {
	const firstVersionId = uuidv4();
	const buddyId = uuidv4();

	const sqlBuddy = insert('persona', {
		id: buddyId,
		created: new Date().getTime(),
		tts_voice,
		profile_pic,
		profile_pic_prompt,
		profile_pic_use_prompt,
		appearance_options,
		selected_appearance_options,
	});
	await run(sqlBuddy[0], sqlBuddy[1]);
	const sqlBuddyGet = select('persona', ['*'], { id: buddyId });
	const buddy = (await get(sqlBuddyGet[0], sqlBuddyGet[1])) as Buddy;

	const sqlBuddyVersion = insert('persona_version', {
		id: firstVersionId,
		created: new Date().getTime(),
		persona_id: buddyId,
		version: 1,
		name,
		description,
	});
	await run(sqlBuddyVersion[0], sqlBuddyVersion[1]);

	const sqlBuddyUpdate = update(
		'persona',
		{ current_version_id: firstVersionId },
		{ id: buddyId }
	);
	await run(sqlBuddyUpdate[0], sqlBuddyUpdate[1]);

	// TODO this is actually just a Buddy
	return {
		...buddy,
		name,
		description,
	} as BuddyVersionMerged;
}
