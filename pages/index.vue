<script setup lang="ts">
import { getThreads } from '@/lib/api/thread';
const { value: threads } = await getThreads();
await navigateTo(`/chat/${threads[0].id}`);
</script>

<style lang="scss"></style>
