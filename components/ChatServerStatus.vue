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

// @ts-ignore
const { startServer, stopServer, getLastModel } = useLlamaCpp();
const { getChatModelPath, chatServerRunning } = useAppStore();

const lastModel = ref<string | null>(null);

const doStartServer = async () => {
	const modelPath = getChatModelPath();
	await startServer(modelPath);
	// lastModel.value = modelPath;
};

const doStopServer = async () => {
	await stopServer();
	lastModel.value = null;
};

onBeforeMount(async () => {
	// lastModel.value = await getLastModel();
});

watch(
	() => chatServerRunning,
	async (running) => {
		if (running) {
			lastModel.value = await getLastModel();
		}
	}
);
</script>

<template>
	<HoverCard :open-delay="1000" :close-delay="250">
		<HoverCardTrigger as-child>
			<div
				class="flex items-center bg-primary-foreground rounded-lg w-full justify-center"
			>
				<Avatar
					:class="chatServerRunning ? 'bg-green-500' : 'bg-red-500'"
					size="xs"
					:color="chatServerRunning ? 'green' : 'red'"
				></Avatar>
				<Button variant="link">
					Chat {{ chatServerRunning ? 'Online' : 'Offline' }}
				</Button>
			</div>
		</HoverCardTrigger>
		<HoverCardContent class="w-40" :hide-when-detached="true" side="right">
			<div class="flex items-center space-x-4">
				<div class="space-y-1">
					<p v-if="lastModel" class="text-sm text-gray-500">
						{{ lastModel }}
					</p>
					<div class="flex justify-around">
						<Button v-if="!chatServerRunning" @click="doStartServer">Start</Button>
						<Button v-else @click="doStopServer">Stop</Button>
					</div>
				</div>
			</div>
		</HoverCardContent>
	</HoverCard>
</template>
