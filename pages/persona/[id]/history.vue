<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type {
	Persona,
	PersonaVersionMerged,
	PersonaVersion,
} from '@/lib/api/types-db';

const route = useRoute();
const id = route.params.id as string;

const persona = ref(null as PersonaVersionMerged | null);
const versions = ref([] as PersonaVersion[]);

onBeforeMount(async () => {
	//
});

// History Page
// this is for viewing the version history of a persona
// can view each version
// can revert to a previous version
// can copy a previous version to create a new version from it
// you can fork a previous version to create a new persona from it
// you can see all threads that use this persona (with links)
</script>

<template>
	<div class="container flex flex-col items-center">
		<h1 class="text-2xl font-bold">Persona Version History</h1>
		<div>
			<NuxtLink class="ml-4" :to="`/persona/${id}/view`">View</NuxtLink>
			<NuxtLink class="ml-4" :to="`/persona/${id}/edit`">Edit</NuxtLink>
		</div>
	</div>
</template>

<style>
/*  */
</style>
