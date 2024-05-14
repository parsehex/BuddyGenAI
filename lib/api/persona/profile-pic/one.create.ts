import { useCompletion } from 'ai/vue';
import { AppSettings } from '@/lib/api/AppSettings';
import { negPromptFromName, posPromptFromName } from '@/lib/prompt/sd';
import useSD from '@/composables/useSD';
import { select, update } from '@/lib/sql';
import type { Buddy, BuddyVersion } from '@/lib/api/types-db';
import { ProfilePicQuality } from '@/lib/api/types-api';
import { useAppStore } from '@/stores/main';
import urls from '@/lib/api/urls';

// @ts-ignore
const { runSD } = useSD();
const {
	dbGet,
	dbRun,
	fsAccess,
	pathJoin,
	mkdir,
	basename,
	fsUnlink,
	getDataPath,
} = useElectron();

// TODO rewrite

/*
TODO notes about profile pic versioning:
- we would store the profile pic in the version table
- would also keep the pictures themselves
- need to update naming to include the version id
*/

function getSDProgress() {
	const { imgGenerating, updateImgGenerating, imgProgress, updateImgProgress } =
		useAppStore();
	const eventSource = new EventSource('http://localhost:8079/api/sd/progress');

	eventSource.onmessage = function (event) {
		const data = JSON.parse(event.data);
		if (data.type === 'start') {
			updateImgProgress(0);
			updateImgGenerating(true);
		} else if (data.type === 'stop') {
			updateImgProgress(1);
			updateImgGenerating(false);
			eventSource.close();
		} else if (data.type === 'progress') {
			if (!imgGenerating) updateImgGenerating(true);
			updateImgProgress(data.progress);
		}
	};

	eventSource.onerror = function (error) {
		updateImgGenerating(false);
		updateImgProgress(0);
		eventSource.close();
		// console.error('EventSource failed:', error);
	};
}

export default async function createProfilePic(
	id: string,
	quality?: ProfilePicQuality,
	gender = ''
) {
	if (!dbGet || !dbRun) throw new Error('dbGet or dbRun is not defined');

	const isExternal = AppSettings.get('selected_provider_image') === 'external';

	const modelDir = AppSettings.get('local_model_directory') as string;
	const selectedImageModel = AppSettings.get('selected_model_image') as string;
	let modelPath = '';

	if (!selectedImageModel) {
		throw new Error('No image model selected');
	}
	if (!isExternal) {
		if (!modelDir) {
			throw new Error('Model directory not set');
		}

		modelPath = await pathJoin(modelDir, 'image', selectedImageModel);
		try {
			const exists = await fsAccess(modelPath);
			if (!exists) throw new Error('Image model file not found');
		} catch (e) {
			throw new Error('Image model file not found');
		}
	}

	const sqlPersona = select('persona', ['*'], { id });
	const persona = (await dbGet(sqlPersona[0], sqlPersona[1])) as Buddy;

	if (!persona) {
		throw new Error('Persona not found');
	}

	const sqlCurrentVersion = select('persona_version', ['*'], {
		id: persona.current_version_id,
	});
	const currentVersion = (await dbGet(
		sqlCurrentVersion[0],
		sqlCurrentVersion[1]
	)) as BuddyVersion;

	if (!currentVersion) {
		throw new Error('Persona version not found');
	}

	let extraPrompt = '';
	if (persona.profile_pic_prompt) {
		extraPrompt = persona.profile_pic_prompt;
	}

	const posPrompt = posPromptFromName(currentVersion.name, extraPrompt, gender);
	const negPrompt = negPromptFromName(currentVersion.name);

	// find path to save image
	const dataPath = await getDataPath('images/' + persona.id);
	console.log('profile pic dataPath', dataPath);
	await mkdir(dataPath);

	const now = Date.now();
	const output = await pathJoin(dataPath, `${now}.png`);
	let outputExists = false;
	try {
		await fsAccess(output);
		outputExists = true;
	} catch (e) {}
	if (outputExists) {
		await fsUnlink(output);
	}

	let size = 256;
	if (quality === ProfilePicQuality.LOW) {
		size = 128;
	} else if (quality === ProfilePicQuality.HIGH) {
		size = 512;
	}

	await runSD({
		model: modelPath,
		pos: posPrompt,
		output,
		neg: negPrompt,
		size,
	});

	const filename = `${now}.png`;
	const sqlUpdate = update('persona', { profile_pic: filename }, { id });
	await dbRun(sqlUpdate[0], sqlUpdate[1]);

	console.log('created pic', filename);
	return { output: filename };
}
