<script setup lang="ts">
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from './ui/context-menu';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useAppStore } from '../stores/main';
import type { ChatThread } from '~/lib/api/types-db';
import api from '~/lib/api/db';
import ChatServerStatus from './ChatServerStatus.vue';

const route = useRoute();
const isThreadSelected = (threadId: string) =>
	route.path.includes(`/chat`) && route.params.id === threadId;

const { updateThreads, isExternalProvider } = useAppStore();
const threads = useAppStore().threads as ChatThread[];

// TODO add option to fork a thread

const newThreadName = ref('');
const editingThreadName = ref('');
const rightClickedId = ref('');

onBeforeMount(async () => {
	await updateThreads();
});

const renameClicked = (threadId: string) => {
	const thread = threads.find((thread) => thread.id === threadId);
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

const doCreateThread = async () => {
	if (!newThreadName.value) return;

	const newThread = await api.thread.createOne({
		name: newThreadName.value,
		mode: 'custom',
	});
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
			navigateTo(`/chat`);
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
		<!-- maybe allow managing external here too -->
		<ChatServerStatus v-if="!isExternalProvider" />
		<div class="flex w-full mb-4">
			<Input
				v-model="newThreadName"
				placeholder="Chat name"
				@keyup.enter="doCreateThread"
			/>
			<Button @click="doCreateThread">+</Button>
		</div>
		<ul>
			<Dialog>
				<ContextMenu>
					<ContextMenuTrigger>
						<li
							v-for="thread in threads"
							:key="thread.id"
							:class="[
								'cursor-pointer',
								'hover:bg-gray-200',
								'rounded',
								'border-b-2',
								isThreadSelected(thread.id) ? 'font-bold bg-gray-200' : '',
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
							<ContextMenuItem>
								<span @click="renameClicked(rightClickedId)">Rename</span>
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
	</div>
</template>
