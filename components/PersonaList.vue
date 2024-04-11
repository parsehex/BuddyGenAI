<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Persona } from '~/server/database/knex.d';
import { Input } from './ui/input';
import { Button } from './ui/button';
import Textarea from './ui/textarea/Textarea.vue';
import { getPersonas, createPersona } from '@/lib/api/persona';

const personas = ref([] as Persona[]);
const newPersona = ref({ name: '', description: '' });

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
			<li v-for="persona in personas" :key="persona.id" class="cursor-pointer hover:bg-gray-200 p-1 rounded">
				{{ persona.name }}
			</li>
		</ul>
	</div>
</template>
