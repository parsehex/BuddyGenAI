<script setup lang="ts">
import type { BuddyVersionMerged } from '~/lib/api/types-db';
import urls from '~/lib/api/urls';

const props = defineProps<{
	persona: BuddyVersionMerged;
	size?: 'xs' | 'sm' | 'base' | 'md' | 'lg';
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

// TODO store each pic, watch for change
const profilePicValue = computed(() => {
	if (props.persona.profile_pic) {
		return urls.buddy.getProfilePic(props.persona.profile_pic);
	}
	return '';
});
</script>

<template>
	<Avatar class="mr-1" :size="size">
		<AvatarImage :src="profilePicValue" />
		<AvatarFallback>
			<img
				v-if="!profilePicValue"
				src="/assets/logo.png"
				alt="Default Buddy icon"
			/>
			<span v-else>{{ initials }}</span>
		</AvatarFallback>
	</Avatar>
</template>
