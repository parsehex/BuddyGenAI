import urls from '../urls';

export async function getAll() {
	const url = urls.setting.getAll();
	return (await useFetch(url)).data as Ref<Record<string, string>>;
}
export async function getDefaults() {
	const url = urls.setting.getDefaults();
	return (await useFetch(url)).data as Ref<Record<string, string>>;
}

export async function get(keys: string[]) {
	const url = urls.setting.get(keys);
	return (await useFetch(url)).data as Ref<Record<string, string>>;
}
export async function update(options: Record<string, string>) {
	const url = urls.setting.update();
	return (await useFetch(url, { method: 'PUT', body: JSON.stringify(options) })).data as Ref<Record<string, string>>;
}
