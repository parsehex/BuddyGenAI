<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router/auto';
import router from '@/lib/router';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/main';
import BuddyForm from '@/components/BuddyForm.vue';
import { Button } from '@/components/ui/button';

const { toast } = useToast();
const { updateBuddies } = useAppStore();

const route = useRoute();
// @ts-ignore
const id = (route.params as RouteParams).id as string;

const buddy = ref(null as BuddyVersionMerged | null);

onBeforeMount(async () => {
	buddy.value = await api.buddy.getOne(id);
});

const handleSave = async (buddyData: any) => {
	if (!buddy.value) {
		toast({
			variant: 'destructive',
			description: 'Buddy not found for editing.',
		});
		return;
	}
	await api.buddy.updateOne({
		id: buddy.value.id,
		...buddyData,
	});
	await updateBuddies();
	await router.push(`/buddy/${id}/view`);
};

const updateBuddy = (updatedBuddy: BuddyVersionMerged) => {
	buddy.value = updatedBuddy;
};
</script>
<template>
	<div class="flex items-center justify-center mt-2">
		<Button type="button" @click="router.push(`/buddy/${id}/view`)" variant="outline"> View </Button>
	</div>
	<BuddyForm :initial-buddy="buddy" @save="handleSave" @update:buddy="updateBuddy" />
</template>
<style>
/*  */
</style>
