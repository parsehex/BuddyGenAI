<script setup lang="ts">
import { ref, onBeforeMount, watch, toRefs } from 'vue';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card';
import urls from '@/lib/api/urls';
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import BuddyAvatar from './BuddyAvatar.vue';

const props = defineProps<{
	buddy: BuddyVersionMerged;
}>();
const { buddy } = toRefs(props);

const id = ref('');
const name = ref('');
const description = ref('');
const created = ref(null as number | null);
const updated = ref(null as number | null);
const profilePic = ref('');

const time_label = ref('Created' as 'Created' | 'Updated');
const time_at = ref('');

const descLimit = 250;

const updateBuddy = async () => {
	if (!buddy.value) return;
	const p = buddy.value;
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
};

onBeforeMount(async () => {
	await updateBuddy();
});

watch(
	() => buddy.value,
	async () => {
		await updateBuddy();
	}
);
</script>

<template>
	<HoverCard>
		<HoverCardTrigger as-child>
			<div class="flex items-center bg-primary-foreground rounded-lg">
				<BuddyAvatar :buddy="buddy" size="sm" />
				<Button variant="link" size="lg">{{ name }}</Button>
			</div>
		</HoverCardTrigger>
		<HoverCardContent class="w-96" :hide-when-detached="true">
			<div class="flex items-center space-x-4">
				<BuddyAvatar :buddy="buddy" size="base" />
				<div class="space-y-1">
					<div class="flex justify-around">
						<RouterLink :to="`/buddy/${id}/edit`">Edit</RouterLink>
						<RouterLink :to="`/buddy/${id}/view`">View</RouterLink>
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
