<script setup lang="ts">
import { getThreads, createThread } from '@/lib/api/thread';
const { value: threads } = await getThreads();
let thread = threads[0];
if (!threads.length) {
	// TODO handle this better
	// have a "What should we call you?" to get rid of the User label
	thread = (await createThread({ name: 'First Thread', mode: 'custom' })).value;
	window.location.reload();
}
await navigateTo(`/chat/${thread.id}`);
// @ts-ignore
</script>

<style lang="scss"></style>
