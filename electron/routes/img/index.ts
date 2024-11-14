import { Router, json } from 'express';
import { state } from '../../sd-state';
import * as config from '../../config';
import { runOpenAI } from './run-openai';
import { listeners } from './progress-state';
import { runSD } from './run-sd';

const router = Router();

router.post('/api/img/generate', json(), async (req, res) => {
	const { prompt, output, negative } = req.body;
	const cfg = config.get();

	try {
		let result = '';
		const provider = cfg.selected_provider_image;
		console.log('provider', provider);
		if (provider === 'openai') {
			// maybe use this for openai-type apis, pass in provider name or lookup in the function
			result = await runOpenAI(cfg.selected_model_image, prompt, output);
		} else {
			result = await runSD(cfg.selected_model_image, prompt, output, negative);
		}
		if (!result) throw new Error('No result');
		return res.json({ output: result });
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
});

router.get('/api/img/progress', (req, res) => {
	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');

	const listener = (type: 'start' | 'stop' | 'progress') => {
		res.write(
			`data: ${JSON.stringify({ type, progress: state.generationProgress })}\n\n`
		);

		if (type === 'stop') {
			listeners.splice(listeners.indexOf(listener), 1);
			res?.end();
		}
	};
	listeners.push(listener);
});

export default router;
