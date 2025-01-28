<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import FirstTimeSetup from '@/components/FirstTimeSetup.vue';
import useLlamaCpp from '@/composables/useLlamaCpp';
import type { MergedChatThread, BuddyVersionMerged } from '@/lib/api/types-db';
import { useAppStore } from '@/stores/main';
import { formatDistanceToNow } from 'date-fns';
import BuddyAvatar from '@/components/BuddyAvatar.vue';
import { AppSettings } from '@/lib/api/AppSettings';
import { useToast } from '@/components/ui/toast';
import { delay } from '@/lib/utils';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { storeToRefs } from 'pinia';
import { api } from '@/lib/api';
import router from '@/lib/router';
import AppTitle from '@/components/AppTitle.vue';

const { toast } = useToast();

const store = useAppStore();
const {
	updateModels,
	updateBuddies,
	updateSettings,
	updateThreads,
	getChatModelPath,
	getNGpuLayers,
} = useAppStore();
const { buddies, settings, threads } = storeToRefs(store);

await updateBuddies();
await updateThreads();

const userNameValue = ref(
	settings.value.user_name === 'User' ? '' : settings.value.user_name
);

await updateSettings();
if (settings.value.user_name && settings.value.user_name !== 'User') {
	userNameValue.value = settings.value.user_name;
	console.log(settings.value);
}

if (settings.value.local_model_directory) {
	await updateModels();
}

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
	return threads.value.sort((a, b) => {
		if (!a.latest_message || !b.latest_message) {
			return 0;
		}
		return (
			new Date(b.latest_message.created).getTime() -
			new Date(a.latest_message.created).getTime()
		);
	});
});

const startChat = async (id: string) => {
	let name = '';
	let mode = '' as 'persona' | 'custom';
	let buddy_id = '';
	console.log('selected buddy', id);
	let errorMsg = '';
	const buddy = store.buddies.find(
		(buddy: BuddyVersionMerged) => buddy.id === id
	);
	if (buddy) {
		name = `Chat with ${buddy.name}`;
		mode = 'persona';
		buddy_id = buddy.id;
	} else if (id === 'ai') {
		name = 'Chat with AI';
		mode = 'custom';
	} else {
		errorMsg = 'Could not find buddy' + id;
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
</script>

<template>
	<div v-if="threads.length" class="flex flex-col items-center px-4">
		<!-- replace this with logo + BuddyGen AI in left corner -->
		<h1 class="text-xl font-bold mb-2">
			<AppTitle :new-here="store.newHere" />
		</h1>
		<div class="flex flex-col items-center gap-2">
			<h2 class="text-lg">Your Chats</h2>
			<div class="flex flex-col items-center gap-1">
				<ScrollArea class="h-screen pb-20">
					<Card
						v-for="thread in sortedThreads"
						:key="thread.id"
						class="w-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mb-1"
					>
						<!-- sort by latest first -->
						<RouterLink
							:to="`/chat/${thread.id}`"
							class="w-full h-full flex items-center justify-start p-4"
						>
							<!-- TODO this is a good idea: show buddy info in thread list -->
							<div>
								<BuddyAvatar
									v-if="thread.selected_buddy"
									:style="{
										visibility:
											thread.latest_message?.role !== 'user' ? 'visible' : 'hidden',
									}"
									:buddy="thread.selected_buddy"
									size="base"
								/>
								<Avatar v-else size="base">
									<AvatarFallback>AI</AvatarFallback>
								</Avatar>
								<Avatar v-if="thread.latest_message?.role === 'user'">
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
									{{ getMessageContent(thread) }}
								</p>
							</div>
						</RouterLink>
					</Card>
				</ScrollArea>
			</div>
		</div>
	</div>

	<!-- TODO if there are no threads or buddies, offer to chat with AI Assistant or create a buddy -->
	<p v-if="buddies.length && !threads.length" class="text-center mt-4">
		You have no chats yet.
	</p>
	<div v-if="buddies.length && !threads.length" class="mt-4 flex items-center">
		<p>Click to</p>
		<Button class="mx-3" @click="startChat('ai')"> Chat with AI Assistant </Button>
		<Select
			v-if="store.buddies.length > 0"
			class="my-2"
			@update:modelValue="
				(id) => {
					startChat(id);
				}
			"
		>
			<SelectTrigger class="max-w-[10vw]">
				<SelectValue placeholder="Chat with..." />
			</SelectTrigger>
			<SelectContent>
				<SelectLabel>Buddy</SelectLabel>
				<SelectGroup>
					<SelectItem
						v-for="buddy in store.buddies"
						:key="buddy.id"
						:value="buddy.id"
						@click="startChat(buddy.id)"
					>
						{{ buddy.name }}
					</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
		<Button v-else type="button" @click="$router.push('/create-buddy')" class="mt-2">
			Create a Buddy
		</Button>
	</div>
	<FirstTimeSetup v-else-if="!buddies.length && !threads.length" />
</template>

<style lang="scss" scoped>
//
</style>
