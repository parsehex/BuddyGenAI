<script setup lang="ts">
import { ref } from 'vue';
import type { PersonaVersionMerged } from '~/server/database/types';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { getPersonas } from '@/lib/api/persona';

const route = useRoute();
const personas = ref([] as PersonaVersionMerged[]);
const newPersona = ref({ name: '', description: '' });

const isPersonaSelected = (id: string | number) => route.path.includes(`/persona`) && route.params.id == id;

onBeforeMount(async () => {
	personas.value = (await getPersonas()).value;
});

const doCreatePersona = async () => {
	const newId = (
		await $fetch('/api/persona', {
			method: 'POST',
			body: JSON.stringify(newPersona.value),
		})
	).id;
	const p = await $fetch('/api/personas');
	personas.value = p;
	newPersona.value = { name: '', description: '' };

	await navigateTo(`/persona/${newId}/view`);
};
</script>

<template>
	<div class="sidebar">
		<div class="flex w-full mb-4 px-2">
			<Input v-model="newPersona.name" placeholder="Persona name" @keydown.enter="doCreatePersona" />
			<Button @click="doCreatePersona">+</Button>
		</div>
		<ul>
			<li
				v-for="persona in personas"
				:key="persona.id"
				:class="['cursor-pointer', 'hover:bg-gray-200', 'p-1', 'rounded', isPersonaSelected(persona.id) ? 'font-bold bg-gray-200' : '']"
			>
				<NuxtLink class="block p-1" :to="`/persona/${persona.id}/view`">{{ persona.name }}</NuxtLink>
			</li>
		</ul>
	</div>
</template>
