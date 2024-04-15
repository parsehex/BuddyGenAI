<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { getPersona, updatePersona } from '~/lib/api/persona';
import type { Persona, PersonaVersionMerged } from '~/server/database/types';
import Spinner from '~/components/Spinner.vue';
import { useToast } from '@/components/ui/toast';

const { toast } = useToast();

const nameValue = ref('');
const descriptionValue = ref('');

const showSpinner = ref(false);

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
	toast({ description: 'Persona created. Generating profile picture. Please wait...' });
	showSpinner.value = true;
	await $fetch(`/api/profile-pic-from-persona?persona_id=${id}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
	});
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
		<Spinner v-if="showSpinner" />
	</div>
</template>

<style>
/*  */
</style>
