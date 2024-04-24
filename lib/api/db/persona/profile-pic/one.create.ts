import AppSettings from '../../../AppSettings';
import { negPromptFromName, posPromptFromName } from '~/lib/prompt/sd';
import useSD from '~/composables/useSD';
import { select, update } from '~/lib/sql';
import { getDataPath } from '~/lib/fs';

// @ts-ignore
const { runSD } = useSD();
const { dbGet, dbRun, fsAccess, pathJoin, mkdir, basename, fsUnlink } =
	useElectron();

// TODO rewrite

/*
TODO notes about profile pic versioning:
- we would store the profile pic in the version table
- would also keep the pictures themselves
	- need to update naming to include the version id
*/

// 	}


	const modelDir = AppSettings.get('local_model_directory');
	if (!modelDir) {
		throw new Error('Model directory not set');
	}

	const selectedImageModel = AppSettings.get('selected_model_image');
	if (!selectedImageModel) {
		throw new Error('No image model selected');
	}

	const modelPath = await pathJoin(modelDir, 'image', selectedImageModel);
	try {
		const exists = await fsAccess(modelPath);
		if (!exists) throw new Error('Image model file not found');
	} catch (e) {
		throw new Error('Image model file not found');
	}

	const sqlPersona = select('persona', ['*'], { id });
	const persona = await dbGet(sqlPersona[0], sqlPersona[1]);

	if (!persona) {
		throw new Error('Persona not found');
	}

	const sqlCurrentVersion = select('persona_version', ['*'], {
		id: persona.current_version_id,
	});
	const currentVersion = await dbGet(sqlCurrentVersion[0], sqlCurrentVersion[1]);

	if (!currentVersion) {
		throw new Error('Persona version not found');
	}

	let extraPrompt = '';
	if (persona.profile_pic_prompt) {
		extraPrompt = persona.profile_pic_prompt;
	}

	const posPrompt = posPromptFromName(currentVersion.name, extraPrompt);
	const negPrompt = negPromptFromName(currentVersion.name);

	// find path to save image
	const dataPath = await getDataPath('images');
	await mkdir(dataPath);

	const output = await pathJoin(dataPath, `${persona.id}.png`);
	let outputExists = false;
	try {
		await fsAccess(output);
		outputExists = true;
	} catch (e) {}
	if (outputExists) {
		await fsUnlink(output);
	}

	await runSD(modelPath, posPrompt, output, negPrompt);

	const filename = await basename(output);
	const sqlUpdate = update('persona', { profile_pic: filename }, { id });
	await dbRun(sqlUpdate[0], sqlUpdate[1]);

	console.log('created pic', filename);
	return { output: filename };
}
