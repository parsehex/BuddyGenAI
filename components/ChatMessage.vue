<script setup lang="ts">
import type { Message } from 'ai/vue';
import type { PersonaVersionMerged } from '~/server/database/types';

const props = defineProps<{
	message: Message;
	threadMode: 'persona' | 'custom';
	currentPersona?: PersonaVersionMerged;
}>();

const { message, threadMode, currentPersona } = toRefs(props);

const { role, content } = message.value;
</script>

<template>
	<Card class="chat-message whitespace-pre-wrap">
		<CardHeader class="p-3" v-if="threadMode === 'persona'">
			{{ role === 'user' ? 'User' : currentPersona?.name }}
		</CardHeader>
		<CardHeader class="p-3" v-else>
			{{ role === 'user' ? 'User' : 'AI' }}
		</CardHeader>
		<CardContent class="p-3 pl-6 pt-0">{{ content }}</CardContent>
	</Card>
</template>
