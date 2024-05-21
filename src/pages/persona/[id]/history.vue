<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router/auto';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type {
	Buddy,
	BuddyVersionMerged,
	BuddyVersion,
} from '@/lib/api/types-db';

const route = useRoute();
const id = route.params.id as string;

const persona = ref(null as BuddyVersionMerged | null);
const versions = ref([] as BuddyVersion[]);

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
			<RouterLink class="ml-4" :to="`/persona/${id}/view`">View</RouterLink>
			<RouterLink class="ml-4" :to="`/persona/${id}/edit`">Edit</RouterLink>
		</div>
	</div>
</template>

<style>
/*  */
</style>
