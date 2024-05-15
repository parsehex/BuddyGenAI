<script setup lang="ts">
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppStore } from '../../stores/main';
import type { BuddyVersionMerged, ChatThread } from '~/lib/api/types-db';
import { api } from '~/lib/api';
import ChatServerStatus from './ChatServerStatus.vue';

const route = useRoute();
const isThreadSelected = (threadId: string) =>
	route.path.includes(`/chat`) && route.params.id === threadId;

const { updateThreads } = useAppStore();
const store = useAppStore();

// TODO add option to fork a thread

const editingThreadName = ref('');
const rightClickedId = ref('');

onBeforeMount(async () => {
	await updateThreads();
});

const renameClicked = (threadId: string) => {
	const thread = store.threads.find(
		(thread: ChatThread) => thread.id === threadId
	);
	if (!thread) {
		console.error(`Couldn't find thread with id ${threadId} to rename`);
		editingThreadName.value = '';
		return;
	}
	editingThreadName.value = thread.name;
};
const handleRename = async () => {
	if (!editingThreadName.value) return;

	await api.thread.updateOne(rightClickedId.value, {
		name: editingThreadName.value,
	});
	editingThreadName.value = '';

	await updateThreads();
};

const selectedBuddy = ref('');

const doCreateThread = async () => {
	let name = '';
	let mode = '' as 'persona' | 'custom';
	let buddy_id = '';
	console.log('selected buddy', selectedBuddy.value);
	if (selectedBuddy.value) {
		const buddy = store.buddies.find(
			(buddy: BuddyVersionMerged) => buddy.id === selectedBuddy.value
		);
		if (buddy) {
			name = `Chat with ${buddy.name}`;
			mode = 'persona';
			buddy_id = buddy.id;
		}
	} else {
		name = 'Custom Chat';
		mode = 'custom';
	}

	const options = {
		name,
		mode,
	} as any;
	if (mode === 'persona') {
		options.persona_id = buddy_id;
	}

	const newThread = await api.thread.createOne(options);
	await updateThreads();
	navigateTo(`/chat/${newThread.id}`);
};

const shouldRedirect = (deletedThreadId: string) => {
	return route.params.id === deletedThreadId;
};

const doDeleteThread = async (threadId: string) => {
	console.log('deleting thread', threadId);
	await api.thread.removeOne(threadId);

	const newThreads = await updateThreads();
	if (shouldRedirect(threadId)) {
		const newThread = newThreads[0];
		if (newThread) {
			navigateTo(`/chat/${newThread.id}`);
		} else {
			navigateTo(`/`);
		}
	}
};

// TODO this is a bandaid fix
watch(route, async () => {
	await updateThreads();
});
</script>

<template>
	<div class="sidebar">
		<ChatServerStatus v-if="!store.isExternalProvider" />
		<div class="flex w-full px-2 mb-2 items-end">
			<BuddySelect v-model="selectedBuddy" />
			<Button class="ml-1" @click="doCreateThread">+</Button>
		</div>
		<ScrollArea class="h-screen">
			<ul>
				<Dialog>
					<ContextMenu>
						<ContextMenuTrigger>
							<li
								v-for="thread in store.threads"
								:key="thread.id"
								:class="[
									'cursor-pointer',
									'hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
									'rounded',
									'border-b-2',
									isThreadSelected(thread.id)
										? 'font-bold bg-gray-200 dark:bg-gray-800'
										: '',
								]"
								@contextmenu="rightClickedId = thread.id"
							>
								<NuxtLink :to="`/chat/${thread.id}`" class="block p-2">
									{{ thread.name }}
								</NuxtLink>
							</li>
						</ContextMenuTrigger>
						<ContextMenuContent>
							<!-- TODO fix to not use selected thread -->
							<DialogTrigger asChild>
								<ContextMenuItem @click="renameClicked(rightClickedId)">
									Rename
								</ContextMenuItem>
							</DialogTrigger>
							<ContextMenuItem @click="doDeleteThread(rightClickedId)">
								Delete
							</ContextMenuItem>
						</ContextMenuContent>
					</ContextMenu>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>New Name</DialogTitle>
						</DialogHeader>
						<DialogDescription>
							<Input v-model="editingThreadName" placeholder="Thread name" />
						</DialogDescription>
						<DialogFooter>
							<DialogClose as-child>
								<Button @click="handleRename" type="button">Confirm</Button>
							</DialogClose>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</ul>
		</ScrollArea>
	</div>
</template>
