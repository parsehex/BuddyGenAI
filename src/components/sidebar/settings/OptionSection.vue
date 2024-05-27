<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { Label } from '../../ui/label';

// props: take optional label and optional labelName
const props = defineProps({
	label: {
		type: String,
		default: '',
	},
	labelName: {
		type: String,
		default: '',
	},
	orientation: {
		type: String,
		default: 'horizontal',
	},
});
const { orientation } = toRefs(props);

const flexLayoutClass = computed(() => {
	return (
		'flex ' + (orientation.value === 'horizontal' ? 'flex-row' : 'flex-col')
	);
});
</script>

<template>
	<div :class="flexLayoutClass + ' w-full justify-between gap-1 my-2'">
		<Label
			v-if="label"
			:for="labelName"
			class="text-sm block font-semibold text-gray-700 dark:text-gray-300"
		>
			{{ label }}
		</Label>
		<slot></slot>
	</div>
</template>
