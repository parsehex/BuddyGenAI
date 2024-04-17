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
	return (await $fetch(url)) as PersonaVersionMerged[];
}
export async function get(id: string) {
	if (!id) {
		console.error('No persona id provided, expect errors');
	}
	const url = urls.persona.get(id);
	return (await $fetch(url)) as PersonaVersionMerged;
}

export async function create(options: CreatePersonaOptions) {
	const url = urls.persona.create();
	return (await $fetch(url, {
		method: 'POST',
		body: JSON.stringify(options),
	})) as PersonaVersionMerged;
}
export async function update(options: UpdatePersonaOptions) {
	const url = urls.persona.update(options.id);
	return (await $fetch(url, {
		method: 'PUT',
		body: JSON.stringify(options),
	})) as PersonaVersionMerged;
}
export async function remove(id: string) {
	const url = urls.persona.delete(id);
	return (await $fetch(url, {
		method: 'DELETE',
	})) as DeleteResponse;
}

export async function getProfilePic(personaId: string) {
	const url = urls.persona.getProfilePic(personaId);
	// returns the image read from fs
	return (await $fetch(url)) as string;
}
export async function createProfilePic(personaId: string) {
	const url = urls.persona.createProfilePic(personaId);
	// TODO do something with the output
	return (await $fetch(url, { method: 'POST' })) as { output: string };
}
