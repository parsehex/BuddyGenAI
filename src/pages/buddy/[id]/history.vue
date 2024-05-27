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

const buddy = ref(null as BuddyVersionMerged | null);
const versions = ref([] as BuddyVersion[]);

onBeforeMount(async () => {
	//
});

// History Page
// this is for viewing the version history of a buddy
// can view each version
// can revert to a previous version
// can copy a previous version to create a new version from it
// you can fork a previous version to create a new buddy from it
// you can see all threads that use this buddy (with links)
</script>

<template>
	<div class="container flex flex-col items-center">
		<h1 class="text-2xl font-bold">Buddy Version History</h1>
		<div>
			<RouterLink class="ml-4" :to="`/buddy/${id}/view`">View</RouterLink>
			<RouterLink class="ml-4" :to="`/buddy/${id}/edit`">Edit</RouterLink>
		</div>
	</div>
</template>

<style>
/*  */
</style>
