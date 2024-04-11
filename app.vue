<script lang="ts" setup>
import Sidebar from '@/components/Sidebar.vue';
</script>

<template>
	<Body class="antialiased duration-300 transition-colors text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-950 h-screen">
		<Sidebar />
		<NuxtLayout>
			<NuxtLoadingIndicator />
			<NuxtPage id="page-container" />
		</NuxtLayout>
	</Body>
</template>

<style>
/* #page-container {
	padding-left: 15%;
} */
</style>
