import type { PersonaVersionMerged } from '@/server/database/types';
import type { DeleteResponse } from '../types';
import urls from '../urls';

interface CreatePersonaOptions {
	name: string;
	description?: string;
	profile_pic?: string;
	profile_pic_prompt?: string;
	profile_pic_use_prompt?: boolean;
}
interface UpdatePersonaOptions extends Partial<CreatePersonaOptions> {
	id: string;
}

export async function getAll() {
	const url = urls.persona.getAll();
	return (await useFetch(url)).data as Ref<PersonaVersionMerged[]>;
}
export async function get(id: string) {
	const url = urls.persona.get(id);
	if (!id) {
		console.error('No persona id provided, expect errors');
	}
	return (await useFetch(url)).data as Ref<PersonaVersionMerged>;
}

export async function create(options: CreatePersonaOptions) {
	const url = urls.persona.create();
	return (
		await useFetch(url, {
			method: 'POST',
			body: JSON.stringify(options),
		})
	).data as Ref<PersonaVersionMerged>;
}
export async function update(options: UpdatePersonaOptions) {
	const url = urls.persona.update(options.id);
	return (
		await useFetch(url, {
			method: 'PUT',
			body: JSON.stringify(options),
		})
	).data as Ref<PersonaVersionMerged>;
}
export async function remove(id: string) {
	const url = urls.persona.delete(id);
	return (
		await useFetch(url, {
			method: 'DELETE',
		})
	).data as Ref<DeleteResponse>;
}

export async function getProfilePic(personaId: string) {
	const url = urls.persona.getProfilePic(personaId);
	return (await useFetch(url)).data as Ref<string>;
}
export async function createProfilePic(personaId: string) {
	const url = urls.persona.createProfilePic(personaId);
	return (await useFetch(url)).data as Ref<{ output: string }>;
}
