import type { WhisperOptions } from '@/lib/api/types-api';

export default function useWhisper() {
	const runWhisper = async (options: WhisperOptions) => {
		console.log('no-op: runWhisper', options);
		return '';
	};

	return {
		runWhisper,
	};
}
