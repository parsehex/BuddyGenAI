<script setup>
import { isDevMode } from '@/lib/utils';
</script>

<template>
	<div v-if="isDevMode()">
		<slot></slot>
	</div>
</template>
