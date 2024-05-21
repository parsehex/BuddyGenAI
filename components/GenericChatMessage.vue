<script setup lang="ts">
import type { Message } from 'ai/vue';
import useElectron from '@/composables/useElectron';

const { copyToClipboard } = useElectron();

const props = defineProps<{
	authorName: string;
	message: Message;
}>();

const { message } = toRefs(props);

const doCopyMessage = () => {
	if (!message.value.content || !copyToClipboard) return;
	copyToClipboard(message.value.content);
};
</script>

<template>
	<ContextMenu>
		<ContextMenuTrigger>
			<Card
				class="chat-message whitespace-pre-wrap w-full"
				:id="'message-' + message.id"
			>
				<CardHeader class="p-3 font-semibold">
					{{ authorName }}
				</CardHeader>
				<CardContent class="p-3 pl-6 pt-0">{{ message.content }}</CardContent>
			</Card>
		</ContextMenuTrigger>
		<ContextMenuContent>
			<ContextMenuItem @click="doCopyMessage">Copy</ContextMenuItem>
		</ContextMenuContent>
	</ContextMenu>
</template>
