import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getVideoCardInfo() {
	const gl = document.createElement('canvas').getContext('webgl');
	if (!gl) {
		return {
			error: 'no webgl',
		};
	}
	const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
	return debugInfo
		? {
				vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string,
				renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string,
		  }
		: {
				error: 'no WEBGL_debug_renderer_info',
		  };
}

export function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// https://medium.com/@pppped/compute-an-arbitrary-color-for-user-avatar-starting-from-his-username-with-javascript-cd0675943b66
export function textToHslColor(t: string, s: number, l: number) {
	var hash = 0;
	for (var i = 0; i < t.length; i++) {
		hash = t.charCodeAt(i) + ((hash << 5) - hash);
	}

	var h = hash % 360;
	return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
}

export function isDevMode() {
	return process.env.NODE_ENV === 'development' || import.meta.env.DEV;
}

export function playAudio(url: string) {
	const audio = new Audio(url);
	audio.playbackRate = 1.15;
	audio.play();
}

export function blobToArrayBuffer(blob: Blob): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			if (reader.result) {
				resolve(reader.result as Buffer);
			} else {
				reject(new Error('Failed to read blob as array buffer'));
			}
		};
		reader.onerror = reject;
		reader.readAsArrayBuffer(blob);
	});
}

export function attemptToFixJson(json: string): string {
	if (!json) {
		return '';
	}

	json = json.trim();

	const hasOpeningBracket = json.includes('{');
	const hasClosingBracket = json.includes('}');
	const hasBothBrackets = hasOpeningBracket && hasClosingBracket;
	const firstIsOpeningBracket = json[0] === '{';
	const lastIsClosingBracket = json[json.length - 1] === '}';

	if (firstIsOpeningBracket && !hasClosingBracket) {
		json += '}';
	}

	if (!firstIsOpeningBracket && hasBothBrackets) {
		const firstBracketIndex = json.indexOf('{');
		json = json.slice(firstBracketIndex);

		const lastBracketIndex = json.lastIndexOf('}');
		json = json.slice(0, lastBracketIndex + 1);
	}

	return json;
}
