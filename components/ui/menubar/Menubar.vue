<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue';
import { MenubarRoot, type MenubarRootEmits, type MenubarRootProps, useForwardPropsEmits } from 'radix-vue';
import { cn } from '@/lib/utils';

const props = defineProps<MenubarRootProps & { class?: HTMLAttributes['class']; size?: 'base' | 'sm' | 'lg' }>();
const emits = defineEmits<MenubarRootEmits>();

const delegatedProps = computed(() => {
	const { class: _, size: __, ...delegated } = props;

	return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const sizeClass = computed(() => {
	switch (props.size) {
		case 'sm':
			return 'h-8';
		case 'lg':
			return 'h-14';
		default:
			return 'h-10';
	}
});
</script>

<template>
	<MenubarRoot v-bind="forwarded" :class="cn('flex items-center gap-x-1 rounded-md border bg-background p-1', props.class, sizeClass)">
		<slot />
	</MenubarRoot>
</template>
