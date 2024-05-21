<script setup lang="ts">
import axios from 'axios';
import { ref, onBeforeMount, watch } from 'vue';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/Spinner.vue';
import { useAppStore } from '@/stores/main';
import urls from '@/lib/api/urls';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/components/ui/toast';
import { delay } from '@/lib/utils';

// @ts-ignore
const { startServer, stopServer, getLastModel } = useLlamaCpp();
const { getNGpuLayers, getChatModelPath, updateChatServerRunning } =
	useAppStore();
const store = useAppStore();

const { toast } = useToast();

const lastModel = ref<string | null>(null);

const doStartServer = async () => {
	const modelPath = getChatModelPath();
	const nGpuLayers = getNGpuLayers();
	console.log('Starting server with model:', modelPath, nGpuLayers);
	if (!modelPath) {
		toast({
			variant: 'destructive',
			title: 'No chat model selected',
			description: 'Please select a chat model in the settings panel',
		});
		return;
	}

	store.chatServerStarting = true;
	const result = await startServer(modelPath, nGpuLayers);
	console.log('Server start result:', result);
	store.chatServerRunning = !result.error;
	store.chatServerStarting = false;

	if (result.error) {
		toast({
			variant: 'destructive',
			title: 'Error starting chat server',
			description: result.error,
		});
	}

	// isStarting.value = false;
	// lastModel.value = modelPath;
};

const doStopServer = async () => {
	await stopServer();

	setTimeout(() => {
		doRefreshServerStatus();
	}, 1000);
	lastModel.value = null;
};

const doRestartServer = async () => {
	await doStopServer();
	await delay(1500);
	await doStartServer();
};

const intervalIdKey = 'refreshServerStatusIntervalId';

const doRefreshServerStatus = async () => {
	try {
		if (store.chatServerStarting) {
			return;
		}
		await updateChatServerRunning();
	} catch (error) {
		console.error('Error refreshing server status:', error);
		if ((window as any)[intervalIdKey]) {
			clearInterval((window as any)[intervalIdKey]);
			(window as any)[intervalIdKey] = null;
		}
	}
};

if ((window as any)[intervalIdKey]) {
	clearInterval((window as any)[intervalIdKey]);
	(window as any)[intervalIdKey] = null;
}

doRefreshServerStatus();
(window as any)[intervalIdKey] = setInterval(doRefreshServerStatus, 5000);

watch(
	() => store.chatServerRunning,
	async () => {
		if (store.chatServerStarting && store.chatServerRunning) {
			store.chatServerStarting = false;
		}
		lastModel.value = await getLastModel();
	}
);

const bgColor = computed(() => {
	if (store.chatServerRunning) {
		return 'bg-green-500';
	} else if (store.chatServerStarting) {
		return 'bg-yellow-500';
	} else {
		return 'bg-red-500';
	}
});
const color = computed(() => (store.chatServerRunning ? 'green' : 'red'));
</script>

<template>
	<!-- TODO when server is off, change delay (+ figure out what delay to use) -->
	<Popover>
		<PopoverTrigger as-child>
			<div
				class="flex items-center bg-primary-foreground rounded-lg w-full justify-center cursor-pointer"
			>
				<Avatar :class="bgColor" size="xs" :color="color"></Avatar>
				<span class="p-2"
					>Chat
					{{
						store.chatServerRunning
							? 'Online'
							: store.chatServerStarting
							? 'Starting'
							: 'Offline'
					}}</span
				>
			</div>
		</PopoverTrigger>
		<PopoverContent class="w-72" :hide-when-detached="true" side="right">
			<div class="flex items-center space-x-4">
				<div class="space-y-1">
					<p
						v-if="lastModel && store.chatServerRunning"
						class="text-sm text-gray-500 mb-4"
					>
						<span class="font-semibold">Model:</span>
						{{ lastModel }}
					</p>
					<div class="flex items-center space-x-2">
						<Button
							v-if="!store.chatServerRunning"
							class="success"
							@click="doStartServer"
							:disabled="store.chatServerStarting"
						>
							Start
						</Button>
						<Button v-else variant="destructive" @click="doStopServer">Stop</Button>
						<Button
							class="warning"
							@click="doRestartServer"
							:disabled="store.chatServerStarting || !store.chatServerRunning"
						>
							Restart
						</Button>
						<Spinner v-if="store.chatServerStarting" />
					</div>
				</div>
			</div>
		</PopoverContent>
	</Popover>
</template>
