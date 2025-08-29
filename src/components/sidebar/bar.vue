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
import ColorMode from './ColorMode.vue';
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
import { Gamepad2 } from 'lucide-vue-next';

const device = useMobile();
const { toast } = useToast();

const store = useAppStore();
const gameStore = useGameStore();
const route = useRoute();

const aiStatus = useAIStatus();
const glowColor = computed(() => {
	if (aiStatus.overallStatus.value === 'green') {
		return '0 0 10px #22c55e';
	} else if (aiStatus.overallStatus.value === 'yellow') {
		return '0 0 10px #eab308';
	} else if (aiStatus.overallStatus.value === 'red') {
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
			<TabsTrigger value="chat">Chat</TabsTrigger>
			<TabsTrigger value="buddy">Buddy</TabsTrigger>
			<TabsTrigger v-if="store.settings.games_tab" value="game">
				<Gamepad2 class="h-6 w-6" />
			</TabsTrigger>
			<TabsTrigger value="settings">Options</TabsTrigger>
			<!-- <RouterLink class="mx-1 font-bold" to="/credits">About</RouterLink> -->
			<ColorMode />
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
				<div class="flex flex-col gap-2 p-2">
					<GameCreationForm />
					<h2 class="text-xl font-semibold mt-4 mb-2">Active Games</h2>
					<ScrollArea class="h-[calc(100vh-200px)]">
						<div v-if="gameStore.games.length === 0" class="text-gray-500 dark:text-gray-400"> No active games yet.
							Start a new one! </div>
						<div v-else class="space-y-2">
							<RouterLink v-for="game in gameStore.games" :key="game.id" :to="`/game/${game.id}`"
								class="block p-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
								:class="{ 'bg-blue-100 dark:bg-blue-900': game.id === (route.params as any).id }"> {{ game.name }}
							</RouterLink>
						</div>
					</ScrollArea>
				</div>
			</TabsContent>
		</div>
	</Tabs>
</template>
