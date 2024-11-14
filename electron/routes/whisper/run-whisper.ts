import fs from 'fs-extra';
import { execFile } from 'child_process';
import { findBinaryPath } from '../../fs';
import log from 'electron-log/main';
import * as config from '../../config';

export async function runWhisper(wavPath: string, model: string = 'base') {
	const cfg = config.get();
	try {
		const useGpu = cfg.gpu_enabled_whisper;
		const whisperPath = await findBinaryPath('whisper.cpp', 'main', useGpu);

		const result = await new Promise((resolve, reject) => {
			const args = [
				'--model',
				model,
				'--output-json',
				'--output-file',
				'result',
				'--file',
				wavPath,
			];

			const command = execFile(whisperPath, args);

			command.on('error', reject);
			command.on('exit', () => {
				const result = fs.readFileSync('result.json');
				resolve(JSON.parse(result.toString()));
			});
		});

		// res.json(result);
		return result;
	} catch (error: any) {
		log.error('Whisper error:', error);
		// res.status(500).json({ error: error.message });
		throw error;
	} finally {
		// Cleanup temp files
		fs.removeSync('/tmp/input.webm');
		fs.removeSync('/tmp/input.wav');
	}
}
