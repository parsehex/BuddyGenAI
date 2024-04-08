<script setup lang="ts">
import Chatbox from './components/Chatbox.vue'
</script>

<template>
  <div>
    <!-- <p id="electron-status">isElectron: {{ useElectron().isElectron }}</p> -->
    <Chatbox />
  </div>
</template>

<style>
#electron-status {
  position: absolute;
  font-size: 2rem;
  font: bold;
}
</style>
