import OpenAI from 'openai';
import fs from 'fs-extra';
import log from 'electron-log/main';
import { getProviderKey } from '../../providers/keys';

export async function runOpenai(wavPath: string) {
	const apiKey = getProviderKey('openai');
	const openai = new OpenAI({ apiKey });

	try {
		const transcription = await openai.audio.transcriptions.create({
			file: fs.createReadStream(wavPath),
			model: 'whisper-1',
			response_format: 'text',
		});

		return transcription;
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
