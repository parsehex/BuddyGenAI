<script setup lang="ts">
import {
	Dialog,
	DialogContent,
	DialogTrigger,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { computed, toRefs } from 'vue';

const props = defineProps<{
	imgUrl: string;
	class?: string;
}>();
const { imgUrl, class: cls } = toRefs(props);

const classStr = computed(() => {
	return ['cursor-pointer', cls.value].join(' ');
});
</script>

<template>
	<Dialog>
		<DialogTrigger as-child>
			<!-- todo tooltip -->
			<img :class="classStr" :src="imgUrl" title="Click to preview" />
		</DialogTrigger>
		<DialogContent>
			<div class="flex flex-col items-center">
				<!-- TODO title & desc? -->
				<DialogTitle>Image Preview</DialogTitle>
				<DialogDescription class="mb-2">
					Click the image to close the preview
				</DialogDescription>

				<img :src="imgUrl" class="max-h-[75vh]" />
				<p
					v-if="imgUrl !== 'loading'"
					class="text-sm text-center text-gray-500 select-none mt-2"
				>
					AI-created images may have unexpected results
				</p>
			</div>
		</DialogContent>
	</Dialog>
</template>
