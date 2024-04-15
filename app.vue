<script lang="ts" setup>
import Toaster from '@/components/ui/toast/Toaster.vue';
import Sidebar from '@/components/Sidebar.vue';
import AppMenubar from '@/components/AppMenubar.vue';
</script>

<template>
	<Body class="antialiased duration-300 transition-colors text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-950 h-screen">
		<div class="fixed top-0 left-0 w-full z-50">
			<AppMenubar />
		</div>
		<div class="pt-8">
			<Sidebar />
			<NuxtLayout>
				<NuxtLoadingIndicator />
				<NuxtPage id="page-container" />
			</NuxtLayout>
			<Toaster />
		</div>
	</Body>
</template>

<style>
.info {
	@apply bg-blue-400 text-white font-bold;
}
.border-info {
	@apply border-blue-700;
}
.info-foreground {
	@apply text-blue-400 bg-white;
}

.success {
	@apply bg-green-400 text-white font-bold;
}
.border-success {
	@apply border-green-700;
}
.success-foreground {
	@apply text-green-400 bg-white;
}
</style>
