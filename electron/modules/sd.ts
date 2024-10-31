import { execFile } from 'child_process';
import OpenAI from 'openai';
import { findBinaryPath } from '../fs';
import fs from 'fs-extra';
import path from 'path';
import { BrowserWindow, ipcMain } from 'electron';
import { startGenerating, stopGenerating, updateProgress } from '../sd-state';
import { AppSettings } from '../AppSettings';
import log from 'electron-log/main';
import { getLlamaCppPort } from '../rand';
import axios from 'axios';

// also in @/lib/api/types-api
interface SDOptions {
	model: string;
	pos: string;
	output: string;
	neg?: string;
	size?: number;
	steps?: number;
}

// TODO catch diff errors && bubble them up to the UI
// - invalid API key
// - invalid model
// - content policy violation

function removeAccents(input: string): string {
	return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function runOpenai(
	model: 'dall-e-2' | 'dall-e-3',
	prompt: string,
	output: string
) {
	return new Promise(async (resolve, reject) => {
		const apiKey = (await AppSettings.get('external_api_key')) as string;
		const baseURL = 'https://api.openai.com/v1';
		const openai = new OpenAI({
			apiKey,
			baseURL,
		});

		const size = '1024x1024';
		const quality = 'standard';
		const n = 1;

		try {
			log.debug('Running OpenAI:', model, prompt, output);
			const response = await openai.images.generate({
				model,
				prompt,
				size,
				quality,
				n,
			});
			const image_url = response.data[0].url;

			if (!image_url) {
				reject('No image URL found');
				return;
			}

			const image = await fetch(image_url);
			const buffer = await image.arrayBuffer();
			await fs.writeFile(output, Buffer.from(buffer));

			resolve(output);
		} catch (error) {
			log.error('OpenAI error:', error);
			reject(error);
		}
	});
}

async function runSD(
	model: string,
	pos: string,
	output: string,
	neg?: string,
	size = 256,
	steps = 16
) {
	const platform: 'darwin' | 'win32' | 'linux' = process.platform as any;
	// if platform is linux, instead call kobold api and save img

	if (platform === 'linux' || platform === 'darwin') {
		// TODO: add "external backend" option to specify kobold endpoint
		//   can evolve this into just supporting pointing the app to kobold
		const port = getLlamaCppPort();
		const url = `http://localhost:${port}/sdapi/v1/txt2img`;

		const response = await axios.post(url, {
			prompt: pos,
			negative_prompt: neg,
			width: size,
			height: size,
			steps,
			sampler_name: 'Euler a',
		});

		const img = response.data.images[0]; // base64

		// save to output
		const buffer = Buffer.from(img, 'base64');
		await fs.writeFile(output, buffer, 'base64');
		return output;
	}

	const modelName = model.split('/').pop()?.toLowerCase();
	if (!modelName) {
		throw new Error('Invalid model name (should not be a directory)');
	}

	model = model.replace(/\//g, '\\');

	const isToonifyRemastered =
		modelName.includes('toonify') && modelName.includes('remastered');

	const useGpu = (await AppSettings.get('gpu_enabled_image')) as 0 | 1;
	// @ts-ignore
	const useGpuBool = useGpu === 1 || useGpu === '1.0';
	const sdPath = await findBinaryPath('stable-diffusion.cpp', 'sd', useGpuBool);

	return new Promise((resolve, reject) => {
		let W = size;
		let H = size;
		if (size === 768) {
			W = 512;
			H = 768;
		}

		const args = [
			'--model',
			model,
			'-o',
			output,
			'--seed',
			'-1',
			'--steps',
			`${steps}`,
			// '--cfg-scale',
			// '2.5',
			// '--clip-skip',
			// '2',
			'-W',
			`${W}`,
			'-H',
			`${H}`,
		];

		const loraDir = path.join(path.dirname(sdPath), '../sd-loras');
		const loraFiles = fs.readdirSync(loraDir);
		const lowraFile = loraFiles.find((file) => /lowra/i.test(file));
		let p = removeAccents(pos);
		if (isToonifyRemastered && lowraFile) {
			args.push('--lora-model-dir', loraDir);

			const loraStr = `<lora:${lowraFile.replace('.pt', '')}:0.1>`;
			// args.push('-p', p);
			args.push('-p', `${p}, ${loraStr}`);
			log.info('Using LowRA:', loraStr);
		} else {
			args.push('-p', p);
		}

		if (neg) {
			neg = removeAccents(neg);
			args.push('-n', neg);
		}

		log.info('SD Path:', sdPath, `(GPU: ${useGpuBool})`);
		log.debug('Running SD:', args);
		startGenerating();
		const command = execFile(sdPath, args, { shell: false });

		command.on('error', (error) => {
			log.error(`SD Error: ${error.message}`);
			stopGenerating();
			reject(error);
		});

		command.on('exit', (code, signal) => {
			if (code) log.info(`SD Process exited with code: ${code}`);
			if (signal) log.info(`SD Process killed with signal: ${signal}`);
			stopGenerating();
			resolve(output);
		});

		command.stdout?.on('data', (data: any) => {
			const str = data.toString();
			// console.log('SD stdout:', str);
			let isProgressLine = false;
			isProgressLine = str.match(/(\d+\/\d+)/) !== null;
			if (isProgressLine) {
				const cur = str.match(/(\d+)\/\d+/);
				const total = str.match(/\d+\/(\d+)/);
				const isNotValid = cur[1] === total[1];
				if (!isNotValid && cur && total) {
					const progress = +cur[1] / +total[1];
					updateProgress(progress);
				}
			}
		});

		process.on('exit', () => {
			command.kill();
			stopGenerating();
			resolve(output);
		});
	});
}

export default function sdModule(mainWindow: BrowserWindow) {
	log.log('[-] MODULE::SD Initializing');

	ipcMain.handle('SD/run', async (_, options: SDOptions) => {
		log.log('[-] MODULE::SD Running');

		const isExternal =
			(await AppSettings.get('selected_provider_image')) === 'external';
		const apiKey = (await AppSettings.get('external_api_key')) as string;
		if (isExternal && apiKey) {
			return await runOpenai(
				(await AppSettings.get('selected_model_image')) as 'dall-e-2' | 'dall-e-3',
				options.pos,
				options.output
			);
		}

		return await runSD(
			options.model,
			options.pos,
			options.output,
			options.neg,
			options.size,
			options.steps
		);
	});
}
