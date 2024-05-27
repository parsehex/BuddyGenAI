<script setup lang="ts">
import { ref, computed, toRefs } from 'vue';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/stores/main';
import ImageWithPreview from '../ImageWithPreview.vue';
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
	<div
		:class="[
			'rounded-lg',
			'transition-all',
			'md:max-w-[150px]',
			'md:min-w-[150px]',
			'lg:max-w-[250px]',
			'lg:min-w-[250px]',
			'md:mx-0',
		]"
		@contextmenu.prevent
	>
		<Progress
			v-if="imgLoading"
			:model-value="store.imgProgress * 100"
			:style="{
				opacity: store.imgGenerating ? 1 : 0,
			}"
		/>
		<img
			v-if="imgLoading"
			class="shadow-md max-w-32"
			src="/assets/placeholder.png"
		/>
		<ImageWithPreview
			v-if="!imgLoading"
			:img-url="imgValue"
			class="shadow-md cursor-pointer hover:shadow-lg hover:scale-110 transition-transform"
		/>
		<p
			v-if="!imgLoading"
			class="text-sm text-center text-gray-500 select-none mt-1"
		>
			AI-Created Image
		</p>
	</div>
</template>
