import type { Persona } from '@/server/database/knex.d';
import type { DeleteResponse } from './types';

// const bodySchema = z.object({
// 	name: z.string(),
// 	description: z.string().optional(),
// 	profile_pic: z.string().optional(),
// 	profile_pic_prompt: z.string().optional(),
// 	profile_pic_use_prompt: z.boolean().default(true),
// });
interface CreatePersonaOptions {
	name: string;
	description?: string;
	profile_pic?: string;
	profile_pic_prompt?: string;
	profile_pic_use_prompt?: boolean;
}
interface UpdatePersonaOptions extends Partial<CreatePersonaOptions> {
	id: number;
}

export async function getPersonas() {
	return (await useFetch('/api/personas')).data as Ref<Persona[]>;
}
export async function getPersona(id: string | number) {
	if (!id) {
		console.error('No persona id provided, expect errors');
	}
	return (await useFetch(`/api/persona?id=${id}`)).data as Ref<Persona>;
}

export async function createPersona(options: CreatePersonaOptions) {
	return (
		await useFetch('/api/persona', {
			method: 'POST',
			body: JSON.stringify(options),
		})
	).data as Ref<Persona>;
}
export async function updatePersona(options: UpdatePersonaOptions) {
	return (
		await useFetch('/api/persona', {
			method: 'PUT',
			body: JSON.stringify(options),
		})
	).data as Ref<Persona>;
}
export async function deletePersona(id: string | number) {
	return (
		await useFetch('/api/persona?id=' + id, {
			method: 'DELETE',
		})
	).data as Ref<DeleteResponse>;
}
