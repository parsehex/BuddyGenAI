import type { Persona, PersonaVersionMerged } from '@/server/database/types';
import type { DeleteResponse } from './types';

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

export async function getPersonas() {
	return (await useFetch('/api/personas')).data as Ref<Persona[]>;
}
export async function getPersona(id: string) {
	if (!id) {
		console.error('No persona id provided, expect errors');
	}
	return (await useFetch(`/api/persona?id=${id}`)).data as Ref<PersonaVersionMerged>;
}

export async function createPersona(options: CreatePersonaOptions) {
	return (
		await useFetch('/api/persona', {
			method: 'POST',
			body: JSON.stringify(options),
		})
	).data as Ref<PersonaVersionMerged>;
}
export async function updatePersona(options: UpdatePersonaOptions) {
	return (
		await useFetch('/api/persona', {
			method: 'PUT',
			body: JSON.stringify(options),
		})
	).data as Ref<PersonaVersionMerged>;
}
export async function deletePersona(id: string) {
	return (
		await useFetch('/api/persona?id=' + id, {
			method: 'DELETE',
		})
	).data as Ref<DeleteResponse>;
}
