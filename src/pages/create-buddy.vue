<script setup lang="ts">
import { ref } from 'vue';
import router from '@/lib/router';
import { useToast } from '@/components/ui/toast';
import { useAppStore } from '@/stores/main';
import { api } from '@/lib/api';
import BuddyForm from '@/components/BuddyForm.vue';
import type { BuddyVersionMerged } from '@/lib/api/types-db';

const { toast } = useToast();
const { updateThreads } = useAppStore();

const newBuddy = ref(null as BuddyVersionMerged | null);

const handleSave = async (buddyData: any) => {
	const createdBuddy = await api.buddy.createOne(buddyData);
	newBuddy.value = createdBuddy;

	if (newBuddy.value) {
		const { id, name } = newBuddy.value;
		const newThread = await api.thread.createOne({
			name: `Chat with ${name}`,
			mode: 'persona',
			persona_id: id,
		});
		await updateThreads();
		await router.push(`/chat/${newThread.id}`);
	} else {
		toast({
			variant: 'destructive',
			description: 'Failed to create buddy.',
		});
	}
};
</script>
<template>
	<div class="flex flex-col items-center w-full md:w-5/6 mx-auto">
		<h1 class="text-2xl font-bold text-center">Create Buddy</h1>
		<BuddyForm :is-new-buddy="true" @save="handleSave" v-model:initial-buddy="newBuddy" />
	</div>
</template>
<style lang="scss"></style>
