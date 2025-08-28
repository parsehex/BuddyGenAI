<script setup lang="ts">
import BuddyCard from '../BuddyCard.vue';
import ThreadImages from './ThreadImages.vue';
import type { BuddyVersionMerged } from '@/src/lib/api/types-db';

defineProps<{
	threadTitle: string;
	threadMode: 'persona' | 'custom';
	threadBuddy?: BuddyVersionMerged;
	threadImages: { url: string }[];
}>();
</script>
<template>
	<div class="flex items-center justify-between py-4 border-b-2 border-gray-100 dark:border-gray-700">
		<h2 class="text-2xl font-bold"> {{ threadTitle }} </h2>
		<ThreadImages v-if="threadImages.length > 0" :images="threadImages.map((m: any) => ({ url: m.image }))" />
		<BuddyCard v-if="threadMode === 'persona' && threadBuddy" :buddy="threadBuddy" />
	</div>
</template>
