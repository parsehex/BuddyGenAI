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
		<div class="flex flex-col w-full mb-4">
			<Input v-model="newPersona.name" placeholder="Persona name" @keydown.enter="doCreatePersona" />
			<Button @click="doCreatePersona">Create</Button>
		</div>
		<ul>
			<li v-for="persona in personas" :key="persona.id" :class="{ 'bg-gray-200 font-bold': isPersonaSelected(persona.id), 'p-1': true, rounded: true, 'cursor-pointer': true }">
				<NuxtLink class="block" :to="`/persona/${persona.id}/view`">{{ persona.name }}</NuxtLink>
			</li>
		</ul>
	</div>
</template>
