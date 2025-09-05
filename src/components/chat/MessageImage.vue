<script setup lang="ts">
import { ref, computed, toRefs } from 'vue';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/stores/main';
import ImageWithPreview from '../ImageWithPreview.vue';
import Spinner from '../Spinner.vue';
const store = useAppStore();

const props = defineProps<{
	imgValue: string;
}>();
const { imgValue } = toRefs(props);

const imgMaximized = ref(false);

const imgLoading = computed(() => {
	return imgValue.value === 'loading';
});
</script>
<template>
	<div :class="[
		'flex justify-center',
		'rounded-lg',
		'transition-all',
		'md:max-w-[150px]',
		'md:min-w-[100px]',
		'lg:max-w-[250px]',
		'lg:min-w-[200px]',
		'md:mx-0',
		'relative',
	]" @contextmenu.prevent>
		<Progress v-if="imgLoading && store.imgProgress > 0" :model-value="store.imgProgress * 100" :style="{
			opacity: store.imgGenerating ? 1 : 0,
		}" />
		<div v-else-if="imgLoading && store.imgProgress === 0"
			class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
			<Spinner />
		</div>
		<img v-if="imgLoading" class="shadow-md max-w-32" src="/assets/placeholder.png" />
		<ImageWithPreview v-if="!imgLoading" :img-url="imgValue"
			class="shadow-md cursor-pointer hover:shadow-lg hover:scale-110 transition-transform" />
	</div>
</template>
