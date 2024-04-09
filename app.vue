<script setup lang="ts">
import Chatbox from './components/Chatbox.vue';
import Sidebar from './components/Sidebar.vue';
</script>

<template>
	<Suspense>
		<div class="container flex">
			<!-- <p id="electron-status">isElectron: {{ useElectron().isElectron }}</p> -->
			<Sidebar />
			<Chatbox />
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
