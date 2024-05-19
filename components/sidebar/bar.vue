<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/stores/main';
import ThreadsList from './ThreadsList.vue';
import BuddyList from './BuddyList.vue';
import SettingsPanel from './SettingsPanel.vue';
import ColorMode from './ColorMode.vue';
import { useToast } from '../ui/toast';
import type { BuddyVersionMerged } from '~/lib/api/types-db';
import { api } from '~/lib/api';
import ChatServerStatus from './ChatServerStatus.vue';

const { toast } = useToast();

const store = useAppStore();
const route = useRoute();

const modelValue = ref(route.path.includes('/persona') ? 'buddy' : 'chat');

watch(
	() => route.path,
	(path) => {
		if (path.includes('/persona')) {
			modelValue.value = 'buddy';
		} else {
			modelValue.value = 'chat';
		}
	}
);

const selectedBuddy = ref('');

const doCreateThread = async () => {
	let name = '';
	let mode = '' as 'persona' | 'custom';
	let buddy_id = '';
	console.log('selected buddy', selectedBuddy.value);
	let errorMsg = '';
	if (selectedBuddy.value) {
		const buddy = store.buddies.find(
			(buddy: BuddyVersionMerged) => buddy.id === selectedBuddy.value
		);
		if (buddy) {
			name = `Chat with ${buddy.name}`;
			mode = 'persona';
			buddy_id = buddy.id;
		} else if (selectedBuddy.value === 'ai') {
			name = 'Chat with AI';
			mode = 'custom';
		} else {
			errorMsg = 'Could not find buddy' + selectedBuddy.value;
		}
	} else {
		errorMsg = 'Please select a buddy';
	}
	if (errorMsg) {
		toast({
			variant: 'destructive',
			title: 'Error creating thread',
			description: errorMsg,
		});
		return;
	}

	const options = {
		name,
		mode,
	} as any;
	if (mode === 'persona') {
		options.persona_id = buddy_id;
	}

	const newThread = await api.thread.createOne(options);
	await store.updateThreads();
	navigateTo(`/chat/${newThread.id}`);
};
</script>

<template>
	<Tabs v-model:model-value="modelValue">
		<TabsList class="w-full dark:bg-gray-800">
			<TabsTrigger value="chat">Chat</TabsTrigger>
			<TabsTrigger value="buddy">Buddy</TabsTrigger>
			<TabsTrigger v-if="!store.isModelsSetup" value="settings"
				>Settings</TabsTrigger
			>
			<ColorMode />
		</TabsList>
		<div class="h-screen">
			<TabsContent value="chat">
				<div class="bg-background my-1">
					<ChatServerStatus v-if="!store.isExternalProvider" />
					<div class="flex w-full px-2 mb-2 items-end">
						<BuddySelect v-model="selectedBuddy" include-ai />
						<Button class="ml-1" @click="doCreateThread">+</Button>
					</div>
				</div>
				<ScrollArea class="h-screen">
					<ThreadsList />
				</ScrollArea>
			</TabsContent>
			<TabsContent value="buddy">
				<BuddyList />
			</TabsContent>
			<TabsContent v-if="!store.newHere" value="settings">
				<SettingsPanel />
			</TabsContent>
		</div>
	</Tabs>
</template>

<style></style>
