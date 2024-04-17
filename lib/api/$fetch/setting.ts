import urls from '../urls';
// TODO pull in types from AppSettings

export async function getAll() {
	const url = urls.setting.getAll();
	return (await $fetch(url)) as Record<string, string>;
}
export async function getDefaults() {
	const url = urls.setting.getDefaults();
	return (await $fetch(url)) as Record<string, string>;
}

export async function get(keys: string[]) {
	const url = urls.setting.get(keys);
	return (await $fetch(url)) as Record<string, string>;
}
export async function update(options: Record<string, string>) {
	const url = urls.setting.update();
	return (await $fetch(url, { method: 'PUT', body: JSON.stringify(options) })) as Record<string, string>;
}
