<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Persona } from '~/server/database/knex.d';
import { Input } from './ui/input';
import { Button } from './ui/button';
import Textarea from './ui/textarea/Textarea.vue';
import { getPersonas, createPersona } from '@/lib/api/persona';

const route = useRoute();
const personas = ref([] as Persona[]);
const newPersona = ref({ name: '', description: '' });

const isPersonaSelected = (id: string | number) => route.path.includes(`/persona`) && route.params.id == id;

onBeforeMount(async () => {
	personas.value = (await getPersonas()).value;
});

const doCreatePersona = async () => {
	await createPersona(newPersona.value);
	personas.value = (await getPersonas()).value;
	newPersona.value = { name: '', description: '' };
};
</script>

<template>
	<div class="sidebar">
		<div class="flex flex-col w-full mb-4">
			<Input v-model="newPersona.name" placeholder="Persona name" />
			<Textarea v-model="newPersona.description" placeholder="Persona description" />
			<Button @click="doCreatePersona">Create</Button>
		</div>
		<ul>
			<!-- cursor-pointer hover:bg-gray-200 p-1 rounded -->
			<li v-for="persona in personas" :key="persona.id" :class="{ 'bg-gray-200 font-bold': isPersonaSelected(persona.id), 'p-1': true, rounded: true, 'cursor-pointer': true }">
				<NuxtLink class="block" :to="`/persona/${persona.id}/view`">{{ persona.name }}</NuxtLink>
			</li>
		</ul>
	</div>
</template>
