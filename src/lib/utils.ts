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
