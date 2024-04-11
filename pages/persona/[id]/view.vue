<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Button from '~/components/ui/button/Button.vue';
import { getPersona } from '~/lib/api/persona';
import type { Persona } from '~/server/database/knex.d';

const route = useRoute();
const id = route.params.id as string;

const persona = ref(null as Persona | null);

onBeforeMount(async () => {
	persona.value = (await getPersona(id)).value;
});
</script>

<template>
	<div class="container flex flex-col items-center">
		<h1 class="text-2xl font-bold">
			Persona: <span class="text-blue-500">{{ persona?.name }}</span>
			<NuxtLink class="ml-4" to="./edit">Edit</NuxtLink>
		</h1>
		<Card class="w-full md:w-1/2">
			<CardHeader class="text-lg"> Description </CardHeader>
			<CardContent>
				{{ persona?.description }}
				<span v-if="`${persona?.description}`.length === 0" class="text-gray-400 italic">No description</span>
			</CardContent>
		</Card>
	</div>
</template>

<style>
/*  */
</style>
