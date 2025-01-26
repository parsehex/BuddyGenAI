import type { PiperOptions } from '@/lib/api/types-api';

export default function usePiper() {
	const runPiper = async (options: PiperOptions) => {
		console.log('no-op: runPiper', options);
		return '';
	};

	return {
		runPiper,
	};
}
