import * as config from '../../config';
import * as fs from 'fs-extra';
import { execFile } from 'child_process';
import { findBinaryPath } from '../../fs';
import path from 'path';
import {
	startGenerating,
	stopGenerating,
	updateProgress,
} from '../../sd-state';
import log from 'electron-log/main';
import { removeAccents } from '../../utils';

export async function runSD(
	model: string,
	pos: string,
	output: string,
	neg?: string,
	size = 256,
	steps = 16
): Promise<string> {
	const modelName = model.split('/').pop()?.toLowerCase();
	if (!modelName) {
		throw new Error('Invalid model name (should not be a directory)');
	}

	model = model.replace(/\//g, '\\');

	const isToonifyRemastered =
		modelName.includes('toonify') && modelName.includes('remastered');

	const cfg = config.get();
	const useGpuBool = cfg.gpu_enabled_image;
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
