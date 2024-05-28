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

export function attemptToFixJson(
	json: string,
	type: 'object' | 'array' = 'object'
): string {
	if (!json) {
		return '';
	}

	let openBracket = '{';
	let closeBracket = '}';
	if (type === 'array') {
		openBracket = '[';
		closeBracket = ']';
	}

	json = json.trim();

	const hasOpeningBracket = json.includes(openBracket);
	const hasClosingBracket = json.includes(closeBracket);
	const hasBothBrackets = hasOpeningBracket && hasClosingBracket;
	const firstIsOpeningBracket = json[0] === openBracket;
	const lastIsClosingBracket = json[json.length - 1] === closeBracket;

	if (!hasBothBrackets) {
		// hail mary
		try {
			let tmp = openBracket + json + closeBracket;
			if (tmp.includes('True')) {
				tmp = tmp.replace(/True/g, 'true');
			}
			if (tmp.includes('False')) {
				tmp = tmp.replace(/False/g, 'false');
			}
			const parsed = JSON.parse(tmp);
			console.log('fixed json: hail mary');
			return JSON.stringify(parsed, null, 2);
		} catch (e) {}
	}

	if (firstIsOpeningBracket && !hasClosingBracket) {
		json += closeBracket;
		console.log('fixed json: added closing bracket');
	}

	if (!firstIsOpeningBracket && hasBothBrackets) {
		// truncate outside of brackets
		const firstBracketIndex = json.indexOf(openBracket);
		json = json.slice(firstBracketIndex);

		const lastBracketIndex = json.lastIndexOf(closeBracket);
		json = json.slice(0, lastBracketIndex + 1);
		console.log('fixed json: truncated outside of brackets');
	}

	if (type === 'array') {
		// does it contain { and/or } but no : ?
		const hasColon = json.includes(':');
		const hasCurlyBrackets = json.includes('{') || json.includes('}');
		if (hasCurlyBrackets && !hasColon) {
			// remove curly brackets
			// i THINK this is safe for arrays
			// shouldn't happen right? unless empty object in array?
			json = json.replace(/{/g, '');
			json = json.replace(/}/g, '');
			console.log('fixed array json: removed curly brackets');
		}

		// trim array of strings
		try {
			const parsed = JSON.parse(json);
			if (Array.isArray(parsed)) {
				const isArrayOfStrings = parsed.every((x) => typeof x === 'string');
				if (isArrayOfStrings) {
					json = JSON.stringify(
						parsed.map((x: string) => x.trim()),
						null,
						2
					);
					// console.log('fixed json: trimmed array of strings');
				}
			}
		} catch (e) {}
	}

	return json;
}
