<script setup lang="ts">
import { useRoute } from 'vue-router/auto';
import Chatbox from '@/components/chat/Chatbox.vue';
import { api } from '@/lib/api';
import { computed } from 'vue';

const route = useRoute();
// const id = route.params.id as string;
const id = computed(() => route.params.id as string);

const getInitialMessages = async () => {
	const messages = await api.message.getAll(id.value);
	return messages;
};
</script>

<template>
	<Chatbox v-if="id" :threadId="id" :initialMessages="getInitialMessages()" />
</template>

<style lang="scss"></style>
