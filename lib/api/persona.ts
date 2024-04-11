import type { Persona } from '@/server/database/knex.d';

export async function getPersonas() {
	return (await useFetch('/api/personas')).data as Ref<Persona[]>;
}
export async function getPersona(id: string | number) {
	if (!id) {
		console.error('No persona id provided, expect errors');
	}
	return (await useFetch(`/api/persona?id=${id}`)).data as Ref<Persona>;
}
