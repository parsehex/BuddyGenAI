<script setup lang="ts">
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
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
			<img :class="classStr" :src="imgUrl" />
		</DialogTrigger>
		<DialogContent>
			<div class="p-2">
				<img :src="imgUrl" />
			</div>
		</DialogContent>
	</Dialog>
</template>
