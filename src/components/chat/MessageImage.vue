<script setup lang="ts">
import { ref, computed, toRefs } from 'vue';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/stores/main';
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
		class="mt-2 mx-3 rounded-lg transition-all"
		@contextmenu.prevent
		:style="{
			maxHeight: imgMaximized ? '512px' : '256px',
			maxWidth: '256px',
		}"
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
		<img
			v-if="!imgLoading"
			@click="imgMaximized = !imgMaximized"
			:src="imgValue"
			:class="[
				'shadow-md',
				'cursor-pointer',
				'hover:shadow-lg',
				imgMaximized ? 'hover:scale-95' : 'hover:scale-105',
				imgMaximized ? 'min-w-64' : 'max-w-32',
				'transition-transform',
				'mx-auto',
			]"
			draggable="false"
		/>
		<p v-if="!imgLoading" class="text-sm text-center text-gray-500 select-none">
			AI-created images may have unexpected results
		</p>
	</div>
</template>
