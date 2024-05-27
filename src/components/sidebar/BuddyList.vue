<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router/auto';
import router from '@/lib/router';
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useAppStore } from '@/stores/main';
import { Button } from '@/components/ui/button';
import BuddyAvatar from '@/components/BuddyAvatar.vue';
import { api } from '@/lib/api';

const { updateBuddies } = useAppStore();
const buddies = useAppStore().buddies as BuddyVersionMerged[];

const route = useRoute();

const rightClickedId = ref('');

const isBuddySelected = (id: string | number) =>
	route.path.includes(`/buddy`) && route.params.id == id;

// TODO italicize if buddy is selected in chat (still bolded if viewing/editing)

onBeforeMount(async () => {
	await updateBuddies();
});

const removeBuddy = async (id: string) => {
	const shouldRedirect = isBuddySelected(id);
	await api.buddy.removeOne(id);
	await updateBuddies();
	if (shouldRedirect) {
		router.push('/');
	}
};

const editBuddy = (id: string) => {
	router.push(`/buddy/${id}/edit`);
};
</script>

<template>
	<div class="sidebar">
		<div class="flex justify-around">
			<Button type="button" @click="$router.push('/create-buddy')" class="mt-2">
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
							'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded border-b-2',
							isBuddySelected(persona.id)
								? 'font-bold bg-gray-200 dark:bg-gray-800'
								: '',
						]"
						@contextmenu="rightClickedId = persona.id"
					>
						<RouterLink
							class="p-2 flex items-center"
							:to="`/buddy/${persona.id}/view`"
						>
							<BuddyAvatar :persona="persona" />
							<span class="ml-1">{{ persona.name }}</span>
						</RouterLink>
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
