<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { getPersona, updatePersona } from '~/lib/api/persona';
import type { Persona } from '~/server/database/types';

const route = useRoute();
const id = route.params.id as string;

const persona = ref(null as Persona | null);

const nameValue = ref('');
const descriptionValue = ref('');

onBeforeMount(async () => {
	persona.value = (await getPersona(id)).value;
	nameValue.value = persona.value?.name ?? '';
	descriptionValue.value = persona.value?.description ?? '';
});

const handleSave = async () => {
	await updatePersona({
		id,
		name: nameValue.value,
		description: descriptionValue.value,
	});
	await navigateTo(`./view`);
};
</script>

<template>
	<div class="container flex flex-col items-center">
		<h1 class="text-2xl font-bold">
			Edit Persona
			<NuxtLink class="ml-4" to="./view">View</NuxtLink>
		</h1>
		<div class="w-full md:w-1/2 mb-4">
			<Input v-model="nameValue" placeholder="Persona name" />
		</div>
		<Card class="w-full md:w-1/2">
			<CardHeader class="text-lg">Description</CardHeader>
			<CardContent>
				<Textarea v-model="descriptionValue" placeholder="Persona description" />
			</CardContent>
		</Card>
		<!-- TODO add option whether to update all threads with this persona -->
		<Button @click="handleSave">Save</Button>
	</div>
</template>

<style>
#electron-status {
	position: absolute;
	font-size: 2rem;
	font: bold;
}
</style>
