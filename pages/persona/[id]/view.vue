<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Button from '@/components/ui/button/Button.vue';
import type {
	ChatThread,
	MergedChatThread,
	BuddyVersionMerged,
} from '@/lib/api/types-db';
import api from '@/lib/api/db';
import urls from '@/lib/api/urls';
import PersonaAvatar from '@/components/PersonaAvatar.vue';

const route = useRoute();
const id = route.params.id as string;

const persona = ref(null as BuddyVersionMerged | null);
const name = ref('');
const description = ref('');
const created = ref(null as number | null);
const updated = ref(null as number | null);
const profilePic = ref('');

const threads = ref([] as MergedChatThread[]);

const time_label = ref('Created' as 'Created' | 'Updated');
const time_at = ref('');

onBeforeMount(async () => {
	const p = await api.buddy.getOne(id);
	persona.value = p;
	name.value = p.name;
	description.value = p.description || '';
	created.value = p.created;
	updated.value = p.updated;

	if (p.profile_pic) {
		profilePic.value = urls.buddy.getProfilePic(p.profile_pic);
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
});

const createThread = async () => {
	const newThread = await api.thread.createOne({
		name: `Chat with ${persona.value?.name}`,
		persona_id: id,
		mode: 'persona',
	});
	navigateTo(`/chat/${newThread.id}`);
};
</script>

<template>
	<div class="container flex flex-col items-center">
		<h1 class="text-2xl font-bold">Buddy</h1>
		<div>
			<NuxtLink class="ml-4" :to="`/persona/${id}/edit`">Edit</NuxtLink>
			<NuxtLink class="ml-4" :to="`/persona/${id}/history`">
				Version History
			</NuxtLink>
		</div>
		<Card class="w-full md:w-1/2">
			<CardHeader class="text-lg font-bold flex flex-row items-center space-x-2">
				<Avatar size="md">
					<AvatarImage :src="profilePic" />
					<AvatarFallback>
						<img src="/assets/logo.png" alt="Default Buddy icon" />
					</AvatarFallback>
				</Avatar>
				<span class="text-blue-500">{{ name }}</span>
			</CardHeader>
			<CardContent>
				{{ description }}
				<span v-if="description.length === 0" class="text-gray-400 italic">
					No description &nbsp;&mdash;&nbsp;
					<NuxtLink class="text-blue-500 underline" :to="`/persona/${id}/edit`">
						Add description
					</NuxtLink>
				</span>
				<br />
				<br />
				<span class="text-xs text-muted-foreground italic">
					{{ time_label }} {{ time_at }}
				</span>
			</CardContent>
		</Card>
		<h2 class="text-xl font-bold mt-4 flex items-center">
			Chats with {{ name }}
			<Button
				type="button"
				size="sm"
				class="ml-4"
				@click="createThread"
				v-if="threads.length > 0"
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
			<Button type="button" class="mt-1" @click="createThread">
				Create Thread
			</Button>
		</div>
		<div v-else>
			<div v-for="thread in threads" :key="thread.id" class="mt-2">
				<NuxtLink :to="`/chat/${thread.id}`" class="text-blue-500 underline">
					{{ thread.name }}
				</NuxtLink>
			</div>
		</div>
	</div>
</template>

<style>
/*  */
</style>
