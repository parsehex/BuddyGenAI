<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import FirstTimeSetup from '@/components/FirstTimeSetup.vue';
import useLlamaCpp from '@/composables/useLlamaCpp';
import type { MergedChatThread, BuddyVersionMerged } from '@/lib/api/types-db';
import { useAppStore } from '@/stores/main';
import { formatDistanceToNow } from 'date-fns';
import BuddyAvatar from '@/components/BuddyAvatar.vue';
import { useTitle } from '@vueuse/core';

useTitle('BuddyGen');

const store = useAppStore();
const {
	settings,
	updateModels,
	updateBuddies,
	updateSettings,
	updateThreads,
	getChatModelPath,
	getNGpuLayers,
} = useAppStore();
const threads: MergedChatThread[] = useAppStore().threads;
const buddies: BuddyVersionMerged[] = useAppStore().buddies;

// @ts-ignore
const { startServer } = useLlamaCpp();

onMounted(async () => {
	if (
		!store.chatServerRunning &&
		settings.local_model_directory &&
		settings.selected_model_chat
	) {
		await startServer(getChatModelPath(), getNGpuLayers());
	}
});

await updateBuddies();
await updateThreads();

const userNameValue = ref(
	settings.user_name === 'User' ? '' : settings.user_name
);

const newHere = computed(
	() => !!+settings.fresh_db || (!threads.length && !buddies.length)
);

await updateSettings();
if (settings.user_name && settings.user_name !== 'User') {
	userNameValue.value = settings.user_name;
	console.log(settings);
}

const isModelsSetup = ref(false);

const calcIsModelsSetup = computed(() => {
	const hasModelDir = !!settings.local_model_directory;
	const hasChatModel = !!settings.selected_model_chat;
	const hasImageModel = !!settings.selected_model_image;
	return hasModelDir && hasChatModel && hasImageModel;
});

if (settings.local_model_directory) {
	await updateModels();
}
isModelsSetup.value = calcIsModelsSetup.value;

const serverStarting = ref(false);
const handleModelChange = async () => {
	setTimeout(async () => {
		const hasModelDir = !!settings.local_model_directory;
		const hasChatModel = !!settings.selected_model_chat;
		const hasImageModel = !!settings.selected_model_image;
		const isSetup = hasModelDir && hasChatModel && hasImageModel;

		if (isSetup) {
			isModelsSetup.value = true; // hide model setup while waiting
			serverStarting.value = true;
			await startServer(getChatModelPath(), getNGpuLayers());
			serverStarting.value = false;
		} else {
			isModelsSetup.value = false;
		}
	}, 10);
};

watch(
	() => settings.local_model_directory,
	async () => {
		await updateModels();
		await handleModelChange();
	}
);

const getMessageName = (thread: MergedChatThread) => {
	if (thread.latest_message?.role === 'user') {
		return userNameValue.value;
	} else if (thread.latest_message?.role === 'assistant') {
		// console.log(thread.selected_buddy);
		return thread.selected_buddy?.name || 'AI';
	}
};

const MaxMessageLength = 150;
const getMessageContent = (thread: MergedChatThread) => {
	if (thread.latest_message?.content.length > MaxMessageLength) {
		return thread.latest_message?.content.slice(0, MaxMessageLength) + '...';
	}
	return thread.latest_message?.content;
};

const getMessageTime = (thread: MergedChatThread) => {
	if (thread.latest_message) {
		return formatDistanceToNow(new Date(thread.latest_message.created), {
			addSuffix: true,
		});
	}
	return '';
};

const userInitials = computed(() => {
	if (userNameValue.value) {
		return userNameValue.value[0].toUpperCase();
	}
	return '';
});

const sortedThreads = computed(() => {
	return threads.sort((a, b) => {
		if (!a.latest_message || !b.latest_message) {
			return 0;
		}
		return (
			new Date(b.latest_message.created).getTime() -
			new Date(a.latest_message.created).getTime()
		);
	});
});
</script>

<template>
	<!-- TODO remaining FTE -->
	<!-- allow editing description (or something to fix broken generations) -->
	<!-- instructions to acquire models -->

	<div v-if="threads.length" class="flex flex-col items-center cont">
		<!-- replace this with logo + BuddyGen AI in left corner -->
		<h1 class="text-xl font-bold mb-0">
			{{ newHere ? 'Welcome to' : '' }}
			<span class="underline">
				<span style="color: #61dafb">BuddyGen</span>
				<span style="color: #111">AI</span>
			</span>
		</h1>
		<div class="flex flex-col items-center gap-2">
			<h2 class="text-lg">Your Chats</h2>
			<div class="flex flex-col items-center gap-1">
				<Card
					v-for="thread in sortedThreads"
					:key="thread.id"
					class="w-full hover:bg-gray-100"
				>
					<!-- sort by latest first -->
					<NuxtLink
						:to="`/chat/${thread.id}`"
						class="w-full h-full flex items-center justify-center p-4"
					>
						<!-- TODO this is a good idea: show buddy info in thread list -->
						<div v-if="thread.selected_buddy">
							<BuddyAvatar
								:style="{
									visibility:
										thread.latest_message.role !== 'user' ? 'visible' : 'hidden',
								}"
								:persona="thread.selected_buddy"
								size="base"
							/>
							<Avatar v-if="thread.latest_message.role === 'user'">
								<AvatarFallback>{{ userInitials }}</AvatarFallback>
							</Avatar>
						</div>
						<div class="ml-2">
							<p class="flex items-baseline">
								<span>
									{{ thread.name }}
								</span>
								<span class="text-xs text-gray-500 italic ml-2">
									{{ getMessageTime(thread) }}
								</span>
							</p>
							<p
								v-if="thread.latest_message"
								class="text-sm mt-2"
								:style="{
									visibility:
										thread.latest_message.role !== 'system' ? 'visible' : 'hidden',
								}"
							>
								<b>{{ getMessageName(thread) }}</b>
								:
								{{ getMessageContent(thread) }}
							</p>
						</div>
					</NuxtLink>
				</Card>
			</div>
		</div>
	</div>

	<FirstTimeSetup
		v-if="!threads.length && !buddies.length"
		:new-here="newHere"
		:is-models-setup="isModelsSetup"
		:server-starting="serverStarting"
		:handle-model-change="handleModelChange"
	/>
	<p v-if="!threads.length && buddies.length" class="text-center mt-4">
		<!-- TODO improve -->
		You have no chats yet. Create one to get started!
	</p>
</template>

<style lang="scss" scoped>
.cont {
	@apply w-full md:max-w-screen-sm lg:max-w-screen-md xl:max-w-screen-lg mx-auto;
}
</style>
