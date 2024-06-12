<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

const props = defineProps<{
	class?: HTMLAttributes['class'];
}>();
</script>

<template>
	<h5 :class="cn('mb-1 font-bold leading-none tracking-tight text-center', props.class)">
		<slot />
	</h5>
</template>
