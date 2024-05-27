<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router/auto';
import { Plus } from 'lucide-vue-next';
import { formatDistanceToNow } from 'date-fns';
import router from '@/lib/router';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Button from '@/components/ui/button/Button.vue';
import type {
	ChatThread,
	MergedChatThread,
	BuddyVersionMerged,
	ChatMessage,
} from '@/lib/api/types-db';
import { api } from '@/lib/api';
import urls from '@/lib/api/urls';
import BuddyAvatar from '@/components/BuddyAvatar.vue';
import AllThreadsImages from '@/src/components/AllThreadsImages.vue';
import { ScrollArea } from '@/src/components/ui/scroll-area';

const route = useRoute();
const id = route.params.id as string;

const buddy = ref(null as BuddyVersionMerged | null);
const name = ref('');
const description = ref('');
const created = ref(null as number | null);
const updated = ref(null as number | null);
const profilePic = ref('');

const threads = ref([] as MergedChatThread[]);
const threadsMessages = ref([] as ChatMessage[][]);
const threadsNameImages = ref(
	[] as { name: string; images: { url: string }[] }[]
);

const time_label = ref('Created' as 'Created' | 'Updated');
const time_at = ref('');

onBeforeMount(async () => {
	const p = await api.buddy.getOne(id);
	buddy.value = p;
	name.value = p.name;
	description.value = p.description || '';
	created.value = p.created;
	updated.value = p.updated;

	if (p.profile_pic) {
		profilePic.value = urls.buddy.getProfilePic(`${p.id}/${p.profile_pic}`);
	}
	if (updated.value) {
		time_label.value = 'Updated';
		time_at.value = formatDistanceToNow(new Date(updated.value), {
			addSuffix: true,
		});
	} else {
		time_label.value = 'Created';
		time_at.value = formatDistanceToNow(new Date(created.value), {
			addSuffix: true,
		});
	}

	threads.value = await api.thread.getAll(id);
	const msgs = await Promise.all(
		threads.value.map((t) => api.message.getAll(t.id))
	);
	threadsMessages.value = msgs;

	threadsNameImages.value = threads.value.map((t, i) => {
		const msgsWithImages = threadsMessages.value[i].filter((m) => m.image);
		return {
			name: t.name,
			images: msgsWithImages.map((m) => ({ url: m.image || '' })),
		};
	});

	// remove threads with no images
	threadsNameImages.value = threadsNameImages.value.filter(
		(t) => t.images.length > 0
	);

	console.log(threadsNameImages.value);
});

const createThread = async () => {
	const newThread = await api.thread.createOne({
		name: `Chat with ${buddy.value?.name}`,
		persona_id: id,
		mode: 'persona',
	});
	router.push(`/chat/${newThread.id}`);
};
</script>

<template>
	<ScrollArea
		class="flex flex-col items-center text-center justify-center h-screen mb-12"
	>
		<h1 class="text-2xl font-bold">
			<span class="text-blue-500">{{ name }}</span>
		</h1>
		<Button
			type="button"
			@click="router.push(`/buddy/${id}/edit`)"
			variant="outline"
		>
			Edit
		</Button>
		<!-- <RouterLink class="ml-4" :to="`/buddy/${id}/history`">
			Version History
		</RouterLink> -->
		<Card class="w-full md:w-2/3 mx-auto text-left">
			<CardHeader class="text-lg font-bold flex flex-col items-center space-x-2">
				<BuddyAvatar
					v-if="buddy"
					:persona="buddy"
					size="lg"
					class="hover:scale-150"
				/>
			</CardHeader>
			<CardContent class="whitespace-pre-wrap">
				{{ description }}
				<span v-if="description.length === 0" class="text-gray-400 italic">
					No description &nbsp;&mdash;&nbsp;
					<RouterLink class="text-blue-500 underline" :to="`/buddy/${id}/edit`">
						Add description
					</RouterLink>
				</span>
				<br />
				<br />
				<span class="text-xs text-muted-foreground italic">
					{{ time_label }} {{ time_at }}
				</span>
			</CardContent>
		</Card>
		<h2 class="text-xl font-bold mt-4 flex items-center justify-center">
			Chats with {{ name }}
			<Button
				v-if="threads.length > 0"
				type="button"
				size="sm"
				class="ml-4"
				@click="createThread"
			>
				<Plus />
			</Button>
		</h2>
		<div
			v-if="threads.length === 0"
			class="text-gray-400 italic text-center mt-1"
		>
			No threads using this persona.
			<br />
			<Button type="button" class="mt-2" @click="createThread">
				Create Thread
			</Button>
		</div>
		<div v-else>
			<div v-for="thread in threads" :key="thread.id" class="mt-2">
				<RouterLink :to="`/chat/${thread.id}`" class="text-blue-500 underline">
					{{ thread.name }}
				</RouterLink>
			</div>
		</div>

		<AllThreadsImages :threads="threadsNameImages" />
	</ScrollArea>
</template>

<style>
/*  */
</style>
