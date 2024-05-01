<script setup lang="ts">
import { ref, onBeforeMount, watch } from 'vue';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card';
import { useAppStore } from '~/stores/main';
import urls from '~/lib/api/urls';
import axios from 'axios';

// @ts-ignore
const { startServer, stopServer, getLastModel } = useLlamaCpp();
const { getChatModelPath, chatServerRunning, updateChatServerRunning } =
	useAppStore();

const isRunning = ref(false);
const lastModel = ref<string | null>(null);

const doStartServer = async () => {
	const modelPath = getChatModelPath();
	await startServer(modelPath);

	setTimeout(() => {
		doRefreshServerStatus();
	}, 1500);
	// lastModel.value = modelPath;
};

const doStopServer = async () => {
	await stopServer();

	setTimeout(() => {
		doRefreshServerStatus();
	}, 1000);
	lastModel.value = null;
};

const refreshServerStatus = async (): Promise<boolean> => {
	const url = urls.other.llamacppHealth();
	try {
		const response = await axios.get(url, {
			timeout: 3500,
		});
		return !!response.data.isRunning;
	} catch (error) {
		return false;
	}
};

const intervalIdKey = 'refreshServerStatusIntervalId';

const doRefreshServerStatus = async () => {
	try {
		const isRunningValue = await refreshServerStatus();
		isRunning.value = isRunningValue;
		updateChatServerRunning(isRunning.value);
	} catch (error) {
		console.error('Error refreshing server status:', error);
		if ((window as any)[intervalIdKey]) {
			clearInterval((window as any)[intervalIdKey]);
			(window as any)[intervalIdKey] = null;
		}
	}
};

// Clear any existing interval when the component is loaded
if ((window as any)[intervalIdKey]) {
	clearInterval((window as any)[intervalIdKey]);
	(window as any)[intervalIdKey] = null;
}

doRefreshServerStatus();
(window as any)[intervalIdKey] = setInterval(doRefreshServerStatus, 5000);

onBeforeMount(async () => {
	// lastModel.value = await getLastModel();
});

watch(
	() => isRunning.value,
	async () => {
		lastModel.value = await getLastModel();
		updateChatServerRunning(isRunning.value);
	}
);

const bgColor = computed(() =>
	isRunning.value ? 'bg-green-500' : 'bg-red-500'
);
const color = computed(() => (isRunning.value ? 'green' : 'red'));
</script>

<template>
	<HoverCard :close-delay="250" :open-delay="50">
		<HoverCardTrigger as-child>
			<div
				class="flex items-center bg-primary-foreground rounded-lg w-full justify-center"
			>
				<Avatar :class="bgColor" size="xs" :color="color"></Avatar>
				<Button variant="link">Chat {{ isRunning ? 'Online' : 'Offline' }}</Button>
			</div>
		</HoverCardTrigger>
		<HoverCardContent class="w-40" :hide-when-detached="true" side="right">
			<div class="flex items-center space-x-4">
				<div class="space-y-1">
					<p v-if="lastModel" class="text-sm text-gray-500">
						{{ lastModel }}
					</p>
					<div class="flex justify-around">
						<Button v-if="!isRunning" @click="doStartServer">Start</Button>
						<Button v-else @click="doStopServer">Stop</Button>
					</div>
				</div>
			</div>
		</HoverCardContent>
	</HoverCard>
</template>
