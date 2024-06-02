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
				<!-- TODO what to do with title & desc? -->
				<DialogTitle>Image</DialogTitle>
				<DialogDescription class="mb-4"> </DialogDescription>

				<img :src="imgUrl" class="max-h-[75vh]" />
				<p
					v-if="imgUrl !== 'loading'"
					class="text-md font-bold text-center text-gray-600 dark:text-gray-400 select-none mt-2"
				>
					AI-created images may have unexpected results and do not depict real
					people.
				</p>
			</div>
		</DialogContent>
	</Dialog>
</template>
