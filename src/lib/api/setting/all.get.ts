import appConfig from '@/src/composables/useConfig';

export default async function getAll() {
	// TODO this isnt used right?
	return appConfig?.config.value;
}
