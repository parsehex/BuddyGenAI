<script setup lang="ts">
import axios from 'axios';
import { ref, onBeforeMount, watch } from 'vue';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card';
import Spinner from '@/components/Spinner.vue';
import { useAppStore } from '@/stores/main';
import urls from '@/lib/api/urls';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/components/ui/toast';

// @ts-ignore
const { startServer, stopServer, getLastModel } = useLlamaCpp();
const { getNGpuLayers, getChatModelPath, updateChatServerRunning } =
	useAppStore();
const store = useAppStore();

const { toast } = useToast();

const isRunning = ref(false);
const isStarting = ref(false);
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
	isStarting.value = true;
	const result = await startServer(modelPath, nGpuLayers);
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
		await updateChatServerRunning();
		isRunning.value = store.chatServerRunning;
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
		if (isStarting.value && isRunning.value) {
			isStarting.value = false;
		}
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
	<!-- TODO when server is off, change delay (+ figure out what delay to use) -->
	<Popover>
		<PopoverTrigger as-child>
			<div
				class="flex items-center bg-primary-foreground rounded-lg w-full justify-center"
			>
				<Avatar :class="bgColor" size="xs" :color="color"></Avatar>
				<Button variant="link">Chat {{ isRunning ? 'Online' : 'Offline' }}</Button>
			</div>
		</PopoverTrigger>
		<PopoverContent class="w-72" :hide-when-detached="true" side="right">
			<div class="flex items-center space-x-4">
				<div class="space-y-1">
					<p v-if="lastModel" class="text-sm text-gray-500">
						<span class="font-semibold">Model:</span>
						{{ lastModel }}
					</p>
					<div class="flex items-center space-x-2">
						<Button
							v-if="!isRunning"
							class="success"
							@click="doStartServer"
							:disabled="isStarting"
						>
							Start
						</Button>
						<Button v-else variant="destructive" @click="doStopServer">Stop</Button>
						<Spinner v-if="isStarting" />
					</div>
				</div>
			</div>
		</PopoverContent>
	</Popover>
</template>
