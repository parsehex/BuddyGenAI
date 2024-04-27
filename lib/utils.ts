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
