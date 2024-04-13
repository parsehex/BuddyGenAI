<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Button from '~/components/ui/button/Button.vue';
import { getPersona } from '~/lib/api/persona';
import { getThreadsByPersona } from '~/lib/api/thread';
import type { ChatThread, Persona, PersonaVersionMerged } from '~/server/database/types';

const route = useRoute();
const id = route.params.id as string;

const persona = ref(null as PersonaVersionMerged | null);
const threads = ref([] as ChatThread[]);

onBeforeMount(async () => {
	persona.value = (await getPersona(id)).value;
	threads.value = (await getThreadsByPersona(id)).value;
});
</script>

<template>
	<div class="container flex flex-col items-center">
		<h1 class="text-2xl font-bold">
			Persona - <span class="text-blue-500">{{ persona?.name }}</span>
		</h1>
		<div>
			<NuxtLink class="ml-4" to="./edit">Edit</NuxtLink>
			<NuxtLink class="ml-4" to="./history">Version History</NuxtLink>
		</div>
		<Card class="w-full md:w-1/2">
			<CardHeader class="text-lg"> Description </CardHeader>
			<CardContent>
				{{ persona?.description }}
				<span v-if="`${persona?.description}`.length === 0" class="text-gray-400 italic">No description</span>
			</CardContent>
		</Card>
		<h2 class="text-xl font-bold mt-4"> Threads Using Persona </h2>
		<div v-if="threads.length === 0" class="text-gray-400 italic"> No threads using this persona </div>
		<div v-else>
			<div v-for="thread in threads" :key="thread.id" class="mt-2">
				<NuxtLink :to="`/chat/${thread.id}`" class="text-blue-500 underline">{{ thread.name }}</NuxtLink>
			</div>
		</div>
	</div>
</template>

<style>
/*  */
</style>
