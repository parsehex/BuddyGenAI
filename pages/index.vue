<script setup lang="ts">
import { fetchThreads } from '@/lib/api/thread';
const threads = await fetchThreads();
await navigateTo(`/chat/${threads[0].id}`);
</script>

<style lang="scss"></style>
