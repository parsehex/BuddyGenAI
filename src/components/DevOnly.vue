<script setup>
import { ref } from 'vue';

const isDevMode = ref(process.env.NODE_ENV === 'development');
</script>

<template>
	<div v-if="!isDevMode">
		<slot></slot>
	</div>
</template>
