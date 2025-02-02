<script setup lang="ts">
import { ref } from 'vue';
import { useAppStore } from '@/stores/main';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const { toast } = useToast();
const store = useAppStore();
const userNameValue = ref('');

const updateName = async () => {
  if (!userNameValue.value) return;
  if (userNameValue.value === store.settings.user_name) return;
  store.settings.user_name = userNameValue.value;
};

const emit = defineEmits(['complete']);

const handleComplete = async () => {
  if (
    store.newHere &&
    store.settings.user_name.toLowerCase() === 'user' &&
    !userNameValue.value
  ) {
    toast({ variant: 'destructive', description: 'Please fill out your name.' });
    return;
  }

  await updateName();
  emit('complete');
};

const Names = ['John', 'Alex', 'Kate', 'Phil', 'Eric'];
const randomName = () => Names[Math.floor(Math.random() * Names.length)];
</script>

<template>
  <Card class="w-full md:max-w-screen-sm">
    <CardHeader>
      <Label class="text-lg">
        Your Name
        <Input
          v-model="userNameValue"
          @blur="updateName"
          autofocus
          class="p-2 border rounded text-center w-1/2 ml-2"
          @keyup.enter="handleComplete"
          :placeholder="randomName()"
        />
      </Label>
      <p class="text-muted">
        (it can be anything!)
      </p>
    </CardHeader>
    <CardContent>
      Your buddies will use your name while chatting
    </CardContent>
    <CardFooter>
      <Button v-if="userNameValue" type="button" @click="handleComplete" >Continue</Button>
    </CardFooter>
  </Card>
</template>
