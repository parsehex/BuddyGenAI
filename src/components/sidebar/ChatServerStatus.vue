<script setup lang="ts">
import { ref, onBeforeMount, watch, computed } from 'vue';
import { Avatar } from '@/components/ui/avatar';
import { useAppStore } from '@/stores/main';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';

const store = useAppStore();
const lastModel = computed(() => store.lastKoboldModelResult);



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
			<div class="flex items-center bg-primary-foreground rounded-b-lg w-full justify-center cursor-pointer">
				<Avatar :class="bgColor" size="xs" :color="color"></Avatar>
				<span class="p-2">Chat {{ store.chatServerRunning ? 'Online' : store.chatServerStarting ? 'Starting' : 'Offline'
				}}</span>
			</div>
		</PopoverTrigger>
		<PopoverContent class="w-72" :hide-when-detached="true" side="right">
			<div class="flex items-center space-x-4">
				<div class="space-y-1">
					<p v-if="lastModel && store.chatServerRunning" class="text-sm text-gray-500 mb-4">
						<span class="font-semibold">Current Model:</span>
						<br /> {{ lastModel }}
					</p>
				</div>
			</div>
		</PopoverContent>
	</Popover>
</template>
