<script setup lang="ts">
import { TooltipRoot, type TooltipRootEmits, type TooltipRootProps, useForwardPropsEmits } from 'radix-vue';

const props = defineProps<TooltipRootProps>();
const emits = defineEmits<TooltipRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
	<TooltipRoot v-bind="forwarded" class="bg-white shadow-md rounded-md p-2">
		<slot />
	</TooltipRoot>
</template>
