import { Router } from 'express';
import { listenForProgress, state } from '@/sd-state';

const router = Router();

const listeners = [] as ((type: 'start' | 'stop' | 'progress') => void)[];

function handleUpdate(type: 'start' | 'stop' | 'progress') {
	listeners.forEach((listener) => listener(type));
}
listenForProgress(handleUpdate);

router.get('/api/sd/progress', (req, res) => {
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
