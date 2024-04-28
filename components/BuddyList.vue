<script setup lang="ts">
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import { useAppStore } from '@/stores/main';
import { Button } from './ui/button';
import BuddyAvatar from './BuddyAvatar.vue';

const { updateBuddies } = useAppStore();
const buddies = useAppStore().buddies as BuddyVersionMerged[];

const route = useRoute();

const isBuddySelected = (id: string | number) =>
	route.path.includes(`/persona`) && route.params.id == id;

// TODO italicize if buddy is selected in chat (still bolded if viewing/editing)

onBeforeMount(async () => {
	await updateBuddies();
});
</script>

<template>
	<div class="sidebar">
		<div class="flex justify-around">
			<Button type="button" @click="navigateTo('/create-buddy')">
				Create a Buddy
			</Button>
		</div>
		<ul>
			<li
				v-for="persona in buddies"
				:key="persona.id"
				:class="[
					'cursor-pointer hover:bg-gray-200 rounded my-1',
					isBuddySelected(persona.id) ? 'font-bold bg-gray-200' : '',
				]"
			>
				<NuxtLink class="p-1 flex items-center" :to="`/persona/${persona.id}/view`">
					<BuddyAvatar :persona="persona" />
					{{ persona.name }}
				</NuxtLink>
			</li>
		</ul>
	</div>
</template>
