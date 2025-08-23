<script setup lang="ts">
import useMobile from '@/src/composables/useMobile';

const device = useMobile();
</script>
<template>
	<p class="mt-1 text-sm font-semibold text-gray-400 dark:text-gray-600 select-none"
		:class="[device.isMobile.value ? 'pr-14' : '']">
		<u><i>Reminder</i></u> Buddies in this app are AI -- they make mistakes sometimes and they're not real people.
	</p>
</template>
