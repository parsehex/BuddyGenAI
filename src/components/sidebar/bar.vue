<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router/auto';
import router from '@/lib/router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/stores/main';
import { useGameStore } from '@/stores/game';
import ThreadsList from './ThreadsList.vue';
import BuddyList from './BuddyList.vue';
import SettingsPanel from './settings/SettingsPanel.vue';
import GameCreationForm from './GameCreationForm.vue';
import GameList from './GameList.vue';
import { useToast } from '../ui/toast';
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import { api } from '@/lib/api';
import AIProviderStatus from './AIProviderStatus.vue';
import BuddySelect from '../BuddySelect.vue';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from '@/components/ui/tooltip'
import useMobile from '@/src/composables/useMobile';
import { useAIStatus } from '@/src/composables/ai/useAIStatus';
import { Gamepad2, MessageSquare, Users, Settings } from 'lucide-vue-next';
import { useLocalStorage } from '@vueuse/core';

const device = useMobile();
const { toast } = useToast();

const useIcons = useLocalStorage('useIconsForTabs', 'true');
const useIconsForTabs = computed(() => useIcons.value === 'true');

const store = useAppStore();
const gameStore = useGameStore();
const route = useRoute();

const aiStatus = useAIStatus();
const glowColor = computed(() => {
	if (aiStatus.overallStatus === 'green') {
		return '0 0 10px #22c55e';
	} else if (aiStatus.overallStatus === 'yellow') {
		return '0 0 10px #eab308';
	} else if (aiStatus.overallStatus === 'red') {
		return '0 0 10px #ef4444';
	}
	return 'none';
});

const modelValue = ref(route.path.includes('/buddy') ? 'buddy' : route.path.includes('/game') ? 'game' : 'chat');

watch(
	() => route.path,
	(path) => {
		if (path.includes('/buddy')) {
			modelValue.value = 'buddy';
		} else if (path.includes('/game')) {
			modelValue.value = 'game';
		} else {
			modelValue.value = 'chat';
		}
	},
	{ immediate: true }
);

const selectedBuddy = ref('');

const doCreateThread = async () => {
	let name = '';
	let mode = '' as 'persona' | 'custom';
	let buddy_id = '';
	console.log('selected buddy', selectedBuddy.value);
	let errorMsg = '';
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
	if (errorMsg) {
		toast({
			variant: 'destructive',
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
	router.push(`/chat/${newThread.id}`);
};

watch(
	() => store.buddies,
	(newVal) => {
		if (selectedBuddy.value) {
			const buddy = newVal.find(
				(buddy: BuddyVersionMerged) => buddy.id === selectedBuddy.value
			);
			if (!buddy) {
				selectedBuddy.value = '';
			}
		}
	}
);
</script>
<template>
	<Tabs v-model:model-value="modelValue">
		<TabsList class="w-full dark:bg-gray-800 rounded-none">
			<Tooltip>
				<TooltipTrigger>
					<div class="relative">
						<AIProviderStatus ref="aiStatusRef" :glow-color="glowColor" :handle-click-chat="() => router.push('/')" />
					</div>
				</TooltipTrigger>
				<TooltipContent> Go to home page </TooltipContent>
			</Tooltip>
			<TabsTrigger value="chat">
				<template v-if="useIconsForTabs">
					<MessageSquare title="Chat" class="h-6 w-6" />
				</template>
				<template v-else> Chat </template>
			</TabsTrigger>
			<TabsTrigger value="buddy">
				<template v-if="useIconsForTabs">
					<Users title="Buddies" class="h-6 w-6" />
				</template>
				<template v-else> Buddy </template>
			</TabsTrigger>
			<TabsTrigger value="game">
				<template v-if="useIconsForTabs">
					<Gamepad2 title="Games" class="h-6 w-6" />
				</template>
				<template v-else> Games </template>
			</TabsTrigger>
			<TabsTrigger value="settings">
				<template v-if="useIconsForTabs">
					<Settings title="Options" class="h-6 w-6" />
				</template>
				<template v-else> Options </template>
			</TabsTrigger>
		</TabsList>
		<div class="h-screen">
			<TabsContent value="chat">
				<div class="bg-background mb-1">
					<div v-if="store.settings.selected_provider_chat" class="flex w-full px-2 my-1 items-end">
						<BuddySelect @select="(id: any) => {
							selectedBuddy = id;
							doCreateThread();
						}" />
					</div>
				</div>
				<ScrollArea :class="[device.isMobile.value ? 'h-[30vh]' : 'h-screen']">
					<ThreadsList />
				</ScrollArea>
			</TabsContent>
			<TabsContent value="buddy">
				<BuddyList />
			</TabsContent>
			<TabsContent value="settings">
				<SettingsPanel />
			</TabsContent>
			<TabsContent value="game">
				<div class="flex flex-col gap-2">
					<div v-if="gameStore.games?.length">
						<h2 class="ml-2 text-xl font-semibold">Active Games</h2>
						<ScrollArea class="h-[calc(100vh-375px)]">
							<GameList />
						</ScrollArea>
					</div>
					<GameCreationForm />
				</div>
			</TabsContent>
		</div>
	</Tabs>
</template>
