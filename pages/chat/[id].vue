<script setup lang="ts">
import Chatbox from '@/components/Chatbox.vue';
import { useTitle } from '@vueuse/core';
import { api } from '~/lib/api';
import type { MergedChatThread } from '~/lib/api/types-db';
import { useAppStore } from '~/stores/main';

const threads = useAppStore().threads as MergedChatThread[];

const route = useRoute();
const id = route.params.id as string;

const thread = threads.find((t) => t.id === id);

useTitle(thread?.name ? `${thread.name} | BuddyGen` : 'BuddyGen');
</script>

<template>
	<div>
		<Chatbox v-if="id" :threadId="id" />
	</div>
</template>

<style lang="scss"></style>
