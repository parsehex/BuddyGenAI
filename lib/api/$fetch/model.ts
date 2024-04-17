import urls from '../urls';

export async function get(type: 'chat' | 'image') {
	const url = urls.model.getAvailableModels(type);
	return (await $fetch(url)) as string[];
}
