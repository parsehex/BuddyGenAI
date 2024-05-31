<script setup lang="ts">
import { computed, toRefs } from 'vue';
import {
	TagsInput,
	TagsInputItem,
	TagsInputItemText,
	TagsInputItemDelete,
	TagsInputInput,
} from './ui/tags-input';

const props = defineProps<{
	type: 'create' | 'edit';
	buddyName: string;
	buddyKeywords: string;
	updateBuddyKeywords: (keywords: string[]) => void;
}>();
const { type, buddyName, buddyKeywords } = toRefs(props);

const maxLength = 500;

const buddyKeywordsArr = computed({
	get: () => buddyKeywords.value.split(',').filter(Boolean),
	set: (value: string[]) => {
		// convert to string, trun cate if too long
		const str = value.join(',').slice(0, maxLength);
		if (str.length >= maxLength) {
			while (value.join(',').length > maxLength) {
				value.pop();
			}
			console.log('truncated');
		}
		value = value.map((v) => v.trim());
		props.updateBuddyKeywords(value);
	},
});

// if creating, show '{name} is...'
// if editing, show '{name} will be...'
</script>

<template>
	<TagsInput v-model="buddyKeywordsArr" class="w-full mt-2">
		<TagsInputItem v-for="item in buddyKeywordsArr" :key="item" :value="item">
			<TagsInputItemText />
			<TagsInputItemDelete />
		</TagsInputItem>

		<TagsInputInput :placeholder="'Keywords'" />
	</TagsInput>

	<blockquote
		class="text-sm text-gray-400 text-center mt-2 select-none border-l border-gray-300 p-2"
	>
		<i v-if="type === 'create'">{{ buddyName || 'Your Buddy' }} is...</i>
		<i v-else>{{ buddyName || 'Your Buddy' }} will be...</i>
		<br />
		{{ buddyKeywords }}
	</blockquote>
</template>
