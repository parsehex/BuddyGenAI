<script setup lang="ts">
import { getThreads, createThread } from '@/lib/api/thread';
const { value: threads } = await getThreads();
let thread = threads[0];
if (!threads.length) {
	// TODO handle this better
	thread = (await createThread({ name: 'First Thread', mode: 'custom' })).value;
	window.location.reload();
}
await navigateTo(`/chat/${thread.id}`);
// @ts-ignore
</script>

<style lang="scss"></style>
