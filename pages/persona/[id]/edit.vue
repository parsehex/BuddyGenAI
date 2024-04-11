<script setup lang="ts">
const route = useRoute();
const id = route.params.id as string;
</script>

<template>
	<Suspense>
		<div class="container flex">
			{{ id }}
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
