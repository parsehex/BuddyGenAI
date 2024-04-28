<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card';
import api from '~/lib/api/db';
import urls from '~/lib/api/urls';
import type { BuddyVersionMerged } from '~/lib/api/types-db';
import BuddyAvatar from './BuddyAvatar.vue';

const props = defineProps<{
	persona: BuddyVersionMerged;
}>();

const id = ref('');
const name = ref('');
const description = ref('');
const created = ref(null as number | null);
const updated = ref(null as number | null);
const profilePic = ref('');

const time_label = ref('Created' as 'Created' | 'Updated');
const time_at = ref('');

const descLimit = 250;

const updatePersona = async () => {
	if (!props.persona) return;
	// const p = await api.persona.getOne(props.persona.id);
	const p = props.persona;
	id.value = p.id;
	name.value = p.name;
	if (p.description) {
		if (p.description.length > descLimit) {
			description.value = p.description.slice(0, descLimit) + '...';
		} else {
			description.value = p.description;
		}
	}
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
};

onBeforeMount(async () => {
	await updatePersona();
});

watch(
	() => props.persona,
	async () => {
		await updatePersona();
	}
);
</script>

<template>
	<HoverCard :open-delay="1000" :close-delay="250">
		<HoverCardTrigger as-child>
			<div class="flex items-center bg-primary-foreground rounded-lg">
				<BuddyAvatar :persona="props.persona" size="sm" />
				<Button variant="link" size="lg">{{ name }}</Button>
			</div>
		</HoverCardTrigger>
		<HoverCardContent class="w-80" :hide-when-detached="true">
			<div class="flex items-center space-x-4">
				<BuddyAvatar :persona="props.persona" size="base" />
				<div class="space-y-1">
					<div class="flex justify-around">
						<NuxtLink :to="`/persona/${id}/edit`">Edit</NuxtLink>
						<NuxtLink :to="`/persona/${id}/view`">View</NuxtLink>
					</div>
					<p class="text-sm">{{ description }}</p>
					<div class="flex items-center pt-2">
						<span class="text-xs text-muted-foreground">
							{{ time_label }} {{ time_at }}
						</span>
					</div>
				</div>
			</div>
		</HoverCardContent>
	</HoverCard>
</template>
