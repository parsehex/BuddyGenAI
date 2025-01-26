import type { SDOptions } from '@/lib/api/types-api';

export default function useSD() {
	const runSD = async (options: SDOptions) => {
		console.log('no-op: runSD', options);
		return '';
	};

	return {
		runSD,
	};
}
