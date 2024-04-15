<script lang="ts" setup>
import Toaster from '@/components/ui/toast/Toaster.vue';
import Sidebar from '@/components/Sidebar.vue';
import AppMenubar from '@/components/AppMenubar.vue';
</script>

<template>
	<Body class="antialiased duration-300 transition-colors text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-950 h-screen">
		<AppMenubar />
		<Sidebar />
		<NuxtLayout>
			<NuxtLoadingIndicator />
			<NuxtPage id="page-container" />
		</NuxtLayout>
		<Toaster />
	</Body>
</template>

<style>
/* #page-container {
	padding-left: 15%;
} */
</style>
