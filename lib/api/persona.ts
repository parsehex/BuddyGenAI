import type { Persona } from '~/server/database/knex.d';

export async function getPersonas(): Promise<Persona[]> {
	const res = await fetch('/api/personas');
	return await res.json();
}
export async function getPersona(id: string | number): Promise<Persona> {
	const res = await fetch(`/api/persona?id=${id}`);
	return await res.json();
}
