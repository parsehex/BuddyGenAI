<script setup lang="ts">
import {
	Dialog,
	DialogContent,
	DialogTrigger,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import { computed, onMounted, ref, toRefs } from 'vue';
import { getImage } from '../lib/api/images';

const props = defineProps<{
	imgUrl: string; // TODO is actually id
	class?: string;
}>();
const { imgUrl, class: cls } = toRefs(props);
const src = ref(imgUrl.value)

const classStr = computed(() => {
	return ['cursor-pointer', cls.value].join(' ');
});

onMounted(async () => {
	src.value = await getImage(src.value);
})
</script>
<template>
	<Dialog>
		<DialogTrigger as-child>
			<!-- todo tooltip -->
			<img :class="classStr" :src="src" title="Click to preview" />
		</DialogTrigger>
		<DialogContent>
			<div class="flex flex-col items-center">
				<!-- TODO what to do with title & desc? -->
				<DialogTitle>Image</DialogTitle>
				<DialogDescription class="mb-4"> </DialogDescription>
				<img :src="src" class="max-h-[75vh]" />
				<p v-if="imgUrl !== 'loading'"
					class="text-md font-bold text-center text-gray-600 dark:text-gray-400 select-none mt-2"> AI-created images may
					have unexpected results and do not depict real people. </p>
			</div>
		</DialogContent>
	</Dialog>
</template>
