<script setup lang="ts">
import Chatbox from '@/components/Chatbox.vue';

const route = useRoute();
const id = route.params.id as string;
</script>

<template>
	<div class="container flex">
		<Chatbox :threadId="id" />
	</div>
</template>

<style lang="scss"></style>
