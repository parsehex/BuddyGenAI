<template>
	<div class="spinner mx-2"></div>
</template>

<script setup lang="ts">
//
</script>

<style scoped>
.spinner {
	border: 16px solid #f3f3f3;
	border-radius: 50%;
	border-top: 16px solid #3498db;
	width: 35px;
	height: 35px;
	animation: spin 2s linear infinite;
}

@keyframes spin {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}
</style>
