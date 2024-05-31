<script setup>
import { isDevMode } from '@/lib/utils';
</script>

<template>
	<div
		v-if="isDevMode()"
		class="opacity-75 hover:opacity-100 p-2 m-2 bg-orange-200 rounded-md border border-orange-400 font-mono"
		title="This component is only visible in development mode."
	>
		<span class="text-black font-bold select-none">🛠️ Developer-Mode Only:</span>
		<slot></slot>
	</div>
</template>
