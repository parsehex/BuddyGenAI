<script setup lang="ts">
import Chatbox from '@/components/Chatbox.vue';

const route = useRoute();
const id = route.params.id as string;
</script>

<template>
	<Chatbox :threadId="id" />
</template>

<style lang="scss"></style>
