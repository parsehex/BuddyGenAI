<script setup lang="ts">
import { useChat } from 'ai/vue'
import { Card, CardContent, CardHeader } from './ui/card'

const { messages, input, handleSubmit } = useChat()
</script>

<template>
  <div class="flex flex-col w-full max-w-md py-24 mx-auto stretch">
    <Card v-for="m in messages" key="m.id" class="whitespace-pre-wrap">
      <CardHeader>{{ m.role === 'user' ? 'User' : 'AI' }}</CardHeader>
      <CardContent>{{ m.content }}</CardContent>
    </Card>

    <form @submit="handleSubmit">
      <input class="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl" v-model="input" placeholder="Say something..." />
    </form>
  </div>
</template>
