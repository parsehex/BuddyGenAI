<script setup lang="ts">
import { defineProps } from 'vue';

defineProps({
	newHere: Boolean
})
</script>

<template>
	{{ newHere ? 'Welcome to' : '' }}
	<span class=" dark:bg-gray-600 rounded-b px-1 mb-2">
		<div class="underline inline">
			<span style="color: #61dafb">BuddyGen</span>
			<span style="color: #111">AI</span>
		</div>
	</span>
	(Early Release)
</template>
