<script setup lang="ts">
import { useRoute } from 'vue-router/auto';
import Chatbox from '@/components/chat/Chatbox.vue';
import { api } from '@/lib/api';
import { computed } from 'vue';

const route = useRoute();
// const id = route.params.id as string;
const id = computed(() => route.params.id as string);

// const messages = await api.message.getAll(id.value);
// console.log(id, 'got thread messages', messages);

const getInitialMessages = async () => {
	const messages = await api.message.getAll(id.value);
	console.log(id.value, 'got thread messages', messages);
	return messages;
};
</script>

<template>
	<div>
		<Chatbox v-if="id" :threadId="id" :initialMessages="getInitialMessages()" />
	</div>
</template>

<style lang="scss"></style>
