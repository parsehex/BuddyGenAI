<script setup lang="ts">
import Chatbox from './components/Chatbox.vue';
import Sidebar from './components/Sidebar.vue';
import { useAppStore } from './stores/main';

const store = useAppStore();

const fetchThreads = async () => {
	const res = await fetch('/api/threads');
	const threads = await res.json();
	return threads;
};

if (store.selectedThreadId === '') {
	const threads = await fetchThreads();
	if (threads.length > 0) {
		store.selectedThreadId = threads[0].id;
	}
}
</script>

<template>
	<Suspense>
		<div class="container flex">
			<!-- <p id="electron-status">isElectron: {{ useElectron().isElectron }}</p> -->
			<Sidebar />
			<Chatbox v-if="store.selectedThreadId" :threadId="store.selectedThreadId + ''" />
		</div>
	</Suspense>
</template>

<style>
#electron-status {
	position: absolute;
	font-size: 2rem;
	font: bold;
}
</style>
