<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import urls from '@/lib/api/urls';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const props = defineProps<{
	persona: BuddyVersionMerged;
	size?: 'xs' | 'sm' | 'base' | 'md' | 'lg';
	noDefault?: boolean;
}>();

const initials = computed(() => {
	if (props.persona.name) {
		return props.persona.name
			.split(' ')
			.map((n) => n[0])
			.join('');
	}
	return '';
});

const profilePicValue = ref('');
onMounted(() => {
	if (props.persona.profile_pic) {
		profilePicValue.value = urls.buddy.getProfilePic(
			`${props.persona.id}/${props.persona.profile_pic}`
		);
	}
});
watch(
	() => props.persona.profile_pic,
	() => {
		if (props.persona.profile_pic) {
			profilePicValue.value = urls.buddy.getProfilePic(
				`${props.persona.id}/${props.persona.profile_pic}`
			);
		} else {
			profilePicValue.value = '';
		}
	}
);
</script>

<template>
	<Avatar class="mr-1" :size="size">
		<AvatarImage :src="profilePicValue" draggable="false" />
		<AvatarFallback>
			<img
				v-if="!profilePicValue && !noDefault"
				src="/assets/logo.png"
				alt="Default Buddy icon"
			/>
			<span v-else>{{ initials }}</span>
		</AvatarFallback>
	</Avatar>
</template>
