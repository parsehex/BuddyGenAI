export function debounce(func: (...args: any[]) => void, wait: number) {
	let timeout: NodeJS.Timeout;

	return function executedFunction(...args: any[]) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};

		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

export function removeAccents(input: string): string {
	return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
export function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
