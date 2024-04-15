<script setup lang="ts">
import { ref } from 'vue';
import type { PersonaVersionMerged } from '~/server/database/types';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { getPersonas } from '@/lib/api/persona';
import { useToast } from './ui/toast';
import Spinner from '~/components/Spinner.vue';
import { useCompletion } from 'ai/vue';

const { toast } = useToast();
const { complete } = useCompletion();

const route = useRoute();
const personas = ref([] as PersonaVersionMerged[]);
const newPersona = ref({ name: '', description: '' });
const showSpinner = ref(false);

const isPersonaSelected = (id: string | number) => route.path.includes(`/persona`) && route.params.id == id;

onBeforeMount(async () => {
	personas.value = (await getPersonas()).value;
});

const doCreatePersona = async () => {
	if (!newPersona.value?.name) {
		toast({ variant: 'destructive', description: 'Name is required' });
		return;
	}
	const prompt = `Your task is to write a brief description of ${newPersona.value?.name}.`;
	toast({ variant: 'info', description: 'Generating description from name...' });
	const value = await complete(prompt, { body: { max_tokens: 100, temperature: 1 } });
	if (!value) {
		toast({ variant: 'destructive', description: 'Error generating description. Please try again.' });
		return;
	}
	newPersona.value.description = value;

	const newP = await $fetch('/api/persona', {
		method: 'POST',
		body: JSON.stringify(newPersona.value),
	});
	const p = await $fetch('/api/personas');
	// @ts-ignore
	personas.value = p;
	newPersona.value = { name: '', description: '' };
	toast({ variant: 'info', description: `Created ${newP.name}. Generating profile picture...` });
	showSpinner.value = true;
	await $fetch(`/api/profile-pic-from-persona?persona_id=${newP.id}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
	});
	showSpinner.value = false;
	await navigateTo(`/persona/${newP.id}/view`);
};
</script>

<template>
	<div class="sidebar">
		<div class="flex w-full mb-4 px-2">
			<Input v-model="newPersona.name" placeholder="Buddy name" @keydown.enter="doCreatePersona" />
			<Button @click="doCreatePersona">+</Button>
			<Spinner v-if="showSpinner" />
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
