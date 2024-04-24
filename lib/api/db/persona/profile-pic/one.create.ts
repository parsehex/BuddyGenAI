import z from 'zod';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import AppSettings from '../../../AppSettings';
// import { getDB, getDataPath } from '~/server/database/knex';
import { findBinaryPath } from '~/lib/fs';
import { negPromptFromName, posPromptFromName } from '~/lib/prompt/sd';

// TODO rewrite

/*
TODO notes about profile pic versioning:
- we would store the profile pic in the version table
- would also keep the pictures themselves
	- need to update naming to include the version id
*/

async function getDB() {
	return null as any;
}
function getDataPath() {
	return null as any;
}

const urlSchema = z.object({
	id: z.string(),
});

async function runSD(model: string, pos: string, output: string, neg?: string) {
	const sdPath = await findBinaryPath('stable-diffusion.cpp', 'sd');
	return new Promise((resolve, reject) => {
		const args = ['-m', model, '-p', pos, '-o', output, '--seed', '-1'];
		if (neg) {
			args.push('-n', neg);
		}
		const command = spawn(sdPath, args, { stdio: 'inherit' });

		command.on('error', (error) => {
			console.error(`Error: ${error.message}`);
			reject(error);
		});

		command.on('exit', (code, signal) => {
			if (code) console.log(`Process exited with code: ${code}`);
			if (signal) console.log(`Process killed with signal: ${signal}`);
			resolve(output);
		});

		// Prevent the script from exiting until the child process exits
		process.on('exit', () => {
			command.kill();
			resolve(output);
		});
	});
}

export default defineEventHandler(async (event) => {
	const modelDir = AppSettings.get('local_model_directory');
	if (!modelDir) {
		throw new Error('Model directory not set');
	}

	const selectedImageModel = AppSettings.get('selected_model_image');
	if (!selectedImageModel) {
		throw new Error('No image model selected');
	}

	const modelPath = path.join(modelDir, 'image', selectedImageModel);
	try {
		await fs.access(modelPath);
	} catch (e) {
		throw new Error('Image model file not found');
	}

	const { id: persona_id } = await getValidatedRouterParams(event, (params) =>
		urlSchema.parse(params)
	);

	const db = await getDB();
	const persona = await db('persona').where({ id: persona_id }).first();

	if (!persona) {
		throw new Error('Persona not found');
	}

	const currentVersion = await db('persona_version')
		.where({ id: persona.current_version_id })
		.first();

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
	let dataPath = getDataPath();
	dataPath = path.join(dataPath, 'images');
	await fs.mkdir(dataPath, { recursive: true });

	const output = path.join(dataPath, `${persona.id}.png`);
	let outputExists = false;
	try {
		await fs.access(output);
		outputExists = true;
	} catch (e) {}
	if (outputExists) {
		await fs.unlink(output);
	}

	await runSD(modelPath, posPrompt, output, negPrompt);

	await db('persona').where({ id: persona.id }).update({ profile_pic: output });

	return { output };
});
