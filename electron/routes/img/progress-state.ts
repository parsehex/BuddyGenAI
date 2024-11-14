import { listenForProgress, state } from '../../sd-state';

export const listeners = [] as ((
	type: 'start' | 'stop' | 'progress'
) => void)[];

export function handleUpdate(type: 'start' | 'stop' | 'progress') {
	listeners.forEach((listener) => listener(type));
}
listenForProgress(handleUpdate);
