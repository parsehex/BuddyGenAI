<script setup lang="ts">
import { useCompletion } from 'ai/vue';
import type { PersonaVersionMerged } from '@/lib/api/types-db';
import api from '@/lib/api/db';
import { useAppStore } from '@/stores/main';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useToast } from './ui/toast';

const { toast } = useToast();
const { complete } = useCompletion();
const { personas, updatePersonas } = useAppStore();

const route = useRoute();
const newPersona = ref({ name: '', description: '' });
const showSpinner = ref(false);

const isPersonaSelected = (id: string | number) =>
	route.path.includes(`/persona`) && route.params.id == id;

// TODO italicize if persona is selected in chat (still bolded if viewing/editing)

onBeforeMount(async () => {
	await updatePersonas();
});

const doCreatePersona = async () => {
	if (!newPersona.value?.name) {
		toast({ variant: 'destructive', description: 'Name is required' });
		return;
	}
	const prompt = `Your task is to write a brief description of ${newPersona.value?.name}.`;
	toast({ variant: 'info', description: 'Generating description from name...' });
	const value = await complete(prompt, {
		body: { max_tokens: 100, temperature: 1 },
	});
	if (!value) {
		toast({
			variant: 'destructive',
			description: 'Error generating description. Please try again.',
		});
		return;
	}
	newPersona.value.description = value;

	const newP = await api.persona.createOne(newPersona.value);
	await updatePersonas();
	newPersona.value = { name: '', description: '' };
	toast({
		variant: 'info',
		description: `Created ${newP.name}. Generating profile picture...`,
	});
	showSpinner.value = true;
	await api.persona.profilePic.createOne(newP.id);
	showSpinner.value = false;
	await navigateTo(`/persona/${newP.id}/view`);
};
</script>

<template>
	<div class="sidebar">
		<div class="flex justify-around">
			<Button type="button" @click="navigateTo('/')">Create a Buddy</Button>
		</div>
		<ul>
			<li
				v-for="persona in personas"
				:key="persona.id"
				:class="[
					'cursor-pointer',
					'hover:bg-gray-200',
					'p-1',
					'rounded',
					isPersonaSelected(persona.id) ? 'font-bold bg-gray-200' : '',
				]"
			>
				<NuxtLink class="block p-1" :to="`/persona/${persona.id}/view`">
					{{ persona.name }}
				</NuxtLink>
			</li>
		</ul>
	</div>
</template>
