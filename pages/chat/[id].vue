<script setup lang="ts">
import Chatbox from '@/components/Chatbox.vue';

const route = useRoute();
const id = route.params.id as string;
</script>

<template>
	<Suspense>
		<div class="container flex">
			<Chatbox :threadId="id" />
		</div>
	</Suspense>
</template>

<style lang="scss"></style>
