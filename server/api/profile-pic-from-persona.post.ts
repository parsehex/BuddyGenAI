import { getDB, getDataPath } from '../database/knex';
import z from 'zod';
import { findBinaryPath } from '~/lib/fs';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import { negPromptFromName, posPromptFromName } from '~/lib/prompt/sd';
import AppSettings from '../AppSettings';

/*
TODO notes about profile pic versioning:
- we would store the profile pic in the version table
- would also keep the pictures themselves
	- need to update naming to include the version id
*/

const querySchema = z.object({
	persona_id: z.string(),
	cache: z.string().optional(),
});

const sdModel = '/media/user/ML/StabilityMatrix/Models/StableDiffusion/juggernaut_reborn.safetensors';

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

	const data = await getValidatedQuery(event, (body) => querySchema.parse(body));

	const db = await getDB();
	const persona = await db('persona').where({ id: data.persona_id }).first();

	if (!persona) {
		throw new Error('Persona not found');
	}

	const currentVersion = await db('persona_version').where({ id: persona.current_version_id }).first();

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

	await db('persona').where({ id: data.persona_id }).update({ profile_pic: output });

	return { output };
});
