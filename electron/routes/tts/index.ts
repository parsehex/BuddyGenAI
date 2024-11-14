import { Router } from 'express';
import log from 'electron-log/main';
import * as config from '../../config';
import { runPiper } from './run-piper';
import { runOpenai } from './run-openai';

const router = Router();

router.post('/api/tts/generate', async (req, res) => {
	const cfg = config.get();
	try {
		const text = req.body.text;
		const model = req.body.model;
		const output = req.body.output;
		const provider = cfg.selected_provider_tts;

		if (provider === 'openai') {
			const result = await runOpenai(model, output, text);
			res.json({ output: result });
		} else {
			const result = await runPiper(model, output, text);
			res.json({ output: result });
		}
	} catch (error: any) {
		log.error('TTS error:', error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
