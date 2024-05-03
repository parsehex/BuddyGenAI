export const state = {
	generatingImg: false,
	generationProgress: 0,
};

type ProgressType = 'start' | 'stop' | 'progress';
type Listener = (type: ProgressType) => void;
const listeners = [] as Listener[];

export function startGenerating() {
	state.generatingImg = true;
	listeners.forEach((listener) => listener && listener('start'));
}
export function stopGenerating() {
	state.generatingImg = false;
	listeners.forEach((listener) => listener && listener('stop'));
}

export function updateProgress(progress: number) {
	state.generationProgress = progress;
	listeners.forEach((listener) => listener && listener('progress'));
}
export function listenForProgress(listener: Listener) {
	listeners.push(listener);
}
