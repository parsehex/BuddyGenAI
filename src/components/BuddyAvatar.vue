<script setup lang="ts">
import { computed, ref, watch, onMounted, toRefs } from 'vue';
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import urls from '@/lib/api/urls';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const props = defineProps<{
	buddy: BuddyVersionMerged;
	size?: 'xs' | 'sm' | 'base' | 'md' | 'lg';
	noDefault?: boolean;
}>();
const { buddy, size = 'base', noDefault = false } = toRefs(props);

const initials = computed(() => {
	if (buddy.value.name) {
		return buddy.value.name
			.split(' ')
			.map((n) => n[0])
			.join('');
	}
	return '';
});

const profilePicValue = ref('');
onMounted(() => {
	if (buddy.value.profile_pic) {
		profilePicValue.value = urls.buddy.getProfilePic(
			`${buddy.value.id}/${buddy.value.profile_pic}`
		);
	}
});
watch(
	() => buddy.value.profile_pic,
	() => {
		if (buddy.value.profile_pic) {
			profilePicValue.value = urls.buddy.getProfilePic(
				`${buddy.value.id}/${buddy.value.profile_pic}`
			);
		} else {
			profilePicValue.value = '';
		}
	}
);
</script>

<template>
	<Avatar class="mr-1 text-md font-bold" :size="size">
		<AvatarImage :src="profilePicValue" draggable="false" />
		<AvatarFallback>
			<span>{{ initials }}</span>
		</AvatarFallback>
	</Avatar>
</template>
