<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { formatDistanceToNow } from 'date-fns';

const props = defineProps<{
	personaId: string;
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
	if (!props.personaId) return;
	const p = await $fetch(`/api/persona?id=${props.personaId}`);
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
		profilePic.value = `/api/profile-pic?persona_id=${p.id}`;
	} else {
		profilePic.value = 'https://github.com/vuejs.png';
	}
	if (updated.value) {
		time_label.value = 'Updated';
		time_at.value = formatDistanceToNow(new Date(updated.value), { addSuffix: true });
	} else {
		time_label.value = 'Created';
		time_at.value = formatDistanceToNow(new Date(created.value), { addSuffix: true });
	}
};

onBeforeMount(async () => {
	await updatePersona();
});

watch(
	() => props.personaId,
	async () => {
		await updatePersona();
	}
);
</script>

<template>
	<HoverCard>
		<HoverCardTrigger as-child>
			<div class="flex items-center bg-primary-foreground p-2 rounded-lg">
				<Avatar>
					<AvatarImage :src="profilePic" />
					<AvatarFallback>VC</AvatarFallback>
				</Avatar>
				<Button variant="link" size="lg">{{ name }}</Button>
			</div>
		</HoverCardTrigger>
		<HoverCardContent class="w-80">
			<div class="flex items-center space-x-4">
				<Avatar>
					<!-- TODO -->
					<AvatarImage :src="profilePic" />
					<AvatarFallback>VC</AvatarFallback>
				</Avatar>
				<div class="space-y-1">
					<div class="flex justify-around">
						<NuxtLink :to="`/persona/${id}/edit`">Edit</NuxtLink>
						<NuxtLink :to="`/persona/${id}/view`">View</NuxtLink>
					</div>
					<p class="text-sm">{{ description }}</p>
					<div class="flex items-center pt-2">
						<span class="text-xs text-muted-foreground"> {{ time_label }} {{ time_at }} </span>
					</div>
				</div>
			</div>
		</HoverCardContent>
	</HoverCard>
</template>
