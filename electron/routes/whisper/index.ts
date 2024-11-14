import { Router } from 'express';
import multer from 'multer';
import fs from 'fs-extra';
import log from 'electron-log/main';
import * as config from '../../config';
import { runFfmpeg } from './run-ffmpeg';
import { runOpenai } from './run-openai';
import { runWhisper } from './run-whisper';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/api/stt/transcribe', upload.single('audio'), async (req, res) => {
	const cfg = config.get();
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No audio file provided' });
		}

		const model = req.body.model || 'base';
		const webmPath = '/tmp/input.webm';
		const wavPath = '/tmp/input.wav';

		await fs.writeFile(webmPath, req.file.buffer);
		await runFfmpeg(webmPath, wavPath);

		const provider = cfg.selected_provider_whisper;

		if (provider === 'openai') {
			const result = runOpenai(wavPath);
			res.json(result);
		} else {
			const result = runWhisper(wavPath, model);
			res.json(result);
		}
	} catch (error: any) {
		log.error('Whisper error:', error);
		res.status(500).json({ error: error.message });
	} finally {
		// Cleanup temp files
		fs.removeSync('/tmp/input.webm');
		fs.removeSync('/tmp/input.wav');
	}
});

export default router;
