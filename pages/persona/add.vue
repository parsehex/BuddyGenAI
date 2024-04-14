<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { getPersona, updatePersona } from '~/lib/api/persona';
import type { Persona, PersonaVersionMerged } from '~/server/database/types';
import Spinner from '~/components/Spinner.vue';

const nameValue = ref('');
const descriptionValue = ref('');

const handleSave = async () => {
	const newPersona = await $fetch(`/api/persona`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			name: nameValue.value,
			description: descriptionValue.value,
		}),
	});
	const id = newPersona.id;
	await navigateTo(`/persona/${id}/view`);
};
</script>

<template>
	<div class="container flex flex-col items-center">
		<h1 class="text-2xl font-bold">Create Persona</h1>
		<div class="w-full md:w-1/2 mb-4">
			<Input v-model="nameValue" placeholder="Persona name" />
		</div>
		<Card class="w-full md:w-1/2">
			<CardHeader class="text-lg">Description</CardHeader>
			<CardContent>
				<Textarea v-model="descriptionValue" placeholder="Persona description" />
			</CardContent>
		</Card>
		<Button @click="handleSave">Create Persona</Button>
	</div>
</template>

<style>
/*  */
</style>
