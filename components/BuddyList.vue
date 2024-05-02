<script setup lang="ts">
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from './ui/context-menu';
import { useAppStore } from '@/stores/main';
import { Button } from './ui/button';
import BuddyAvatar from './BuddyAvatar.vue';
import api from '~/lib/api/db';

const { updateBuddies } = useAppStore();
const buddies = useAppStore().buddies as BuddyVersionMerged[];

const route = useRoute();

const rightClickedId = ref('');

const isBuddySelected = (id: string | number) =>
	route.path.includes(`/persona`) && route.params.id == id;

// TODO italicize if buddy is selected in chat (still bolded if viewing/editing)

onBeforeMount(async () => {
	await updateBuddies();
});

const removeBuddy = async (id: string) => {
	await api.buddy.removeOne(id);
	await updateBuddies();
};

const editBuddy = (id: string) => {
	navigateTo(`/persona/${id}/edit`);
};

const doRightClick = (id: string) => {
	rightClickedId.value = id;
	// console.log('right clicked', id);
};
</script>

<template>
	<div class="sidebar">
		<div class="flex justify-around">
			<Button type="button" @click="navigateTo('/create-buddy')">
				Create a Buddy
			</Button>
		</div>
		<ul class="mt-2">
			<ContextMenu>
				<ContextMenuTrigger>
					<li
						v-for="persona in buddies"
						:key="persona.id"
						:class="[
							'cursor-pointer hover:bg-gray-200 rounded border-b-2',
							isBuddySelected(persona.id) ? 'font-bold bg-gray-200' : '',
						]"
						@contextmenu="doRightClick(persona.id)"
					>
						<NuxtLink
							class="p-2 flex items-center"
							:to="`/persona/${persona.id}/view`"
						>
							<BuddyAvatar :persona="persona" />
							<span class="ml-1">{{ persona.name }}</span>
						</NuxtLink>
					</li>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem @click="editBuddy(rightClickedId)">Edit</ContextMenuItem>
					<ContextMenuItem @click="removeBuddy(rightClickedId)">
						Delete
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		</ul>
	</div>
</template>
