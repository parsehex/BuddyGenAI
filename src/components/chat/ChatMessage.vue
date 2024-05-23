<script setup lang="ts">
import { ref, computed, toRefs, watch } from 'vue';
import type { Message } from 'ai/vue';
import type { BuddyVersionMerged, ChatMessage } from '@/lib/api/types-db';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import BuddyAvatar from '@/components/BuddyAvatar.vue';
import useElectron from '@/composables/useElectron';
import { api } from '@/lib/api';
import urls from '@/lib/api/urls';
import { useAppStore } from '@/stores/main';

const { copyToClipboard } = useElectron();
const store = useAppStore();

const props = defineProps<{
	threadId: string;
	message: Message | ChatMessage;
	threadMode: 'persona' | 'custom';
	currentPersona?: BuddyVersionMerged;
}>();

const emit = defineEmits<{
	(e: 'edit', id: string): void;
	(e: 'delete', id: string): void;
	(e: 'clearThread'): void;
}>();

const { threadId, message, threadMode, currentPersona } = toRefs(props);
const isUser = computed(() => message.value.role === 'user');

// @ts-ignore
const imgValue = ref(message.value.image || '');
watch(
	() => message.value,
	async (newVal) => {
		// @ts-ignore
		if (!newVal.image) return;
		console.log('newVal', newVal);
		// @ts-ignore
		imgValue.value = newVal.image;
	}
);
// console.log(message.value);

const editingMessageTitle = ref('');
const editingMessage = ref('');

const userName = ref('User');

if (isUser.value) {
	userName.value = store.settings.user_name;
}

const triggerEdit = async () => {
	editingMessageTitle.value = `Editing Message`;
	editingMessage.value = message.value.content;
};
const handleEdit = async () => {
	await api.message.updateOne(message.value.id, editingMessage.value);
	editingMessage.value = '';
	emit('edit', message.value.id);
};

const doDelete = async () => {
	if (message.value.role !== 'user') return;
	await api.message.removeOne(message.value.id);
	emit('delete', message.value.id);
};
const doCopyMessage = () => {
	if (!message.value.content || !copyToClipboard) return;
	copyToClipboard(message.value.content);
};
const doClearThread = async () => {
	if (!threadId) return;
	await api.message.removeAll(threadId.value);
	emit('clearThread');
};

const msgInitials = computed(() => {
	if (isUser.value) return userName.value[0];
	if (!currentPersona.value) return '';

	const firstName = currentPersona.value.name.split(' ')[0];
	return firstName[0];
});

// https://medium.com/@pppped/compute-an-arbitrary-color-for-user-avatar-starting-from-his-username-with-javascript-cd0675943b66
function textToHslColor(t: string, s: number, l: number) {
	var hash = 0;
	for (var i = 0; i < t.length; i++) {
		hash = t.charCodeAt(i) + ((hash << 5) - hash);
	}

	var h = hash % 360;
	return 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
}

const imgMaximized = ref(false);

const imgLoading = computed(() => {
	return imgValue.value === 'loading';
});
</script>

<template>
	<Dialog :modal="true">
		<ContextMenu>
			<ContextMenuTrigger>
				<Card
					class="chat-message whitespace-pre-wrap"
					:id="'message-' + message.id"
				>
					<CardHeader
						v-if="threadMode === 'persona'"
						class="p-3 flex flex-row items-center space-x-2 pt-1 pb-2"
					>
						<!-- would be good ux to have an option or a link to option to update user name -->
						<Avatar
							v-if="isUser"
							class="text-lg mt-2"
							:style="{
								backgroundColor: textToHslColor(userName, 60, 80),
							}"
						>
							<AvatarFallback>{{ msgInitials }}</AvatarFallback>
						</Avatar>
						<span v-if="isUser">
							{{ userName }}
						</span>
						<span v-else>
							<RouterLink
								:to="`/persona/${currentPersona?.id}/view`"
								class="flex items-center hover:bg-primary-foreground hover:text-primary-background p-1 rounded-lg"
							>
								<BuddyAvatar
									v-if="!isUser && currentPersona"
									:persona="currentPersona"
								/>
								{{ currentPersona?.name }}
							</RouterLink>
						</span>
					</CardHeader>
					<CardHeader class="p-3" v-else>
						{{ message.role === 'user' ? userName : 'AI' }}
					</CardHeader>
					<CardContent class="p-3 pl-6 pt-0 flex items-center justify-between">
						<div class="">
							{{ message.content }}
						</div>
						<!-- img is 512x768, so aspect ratio is 2:3
						 -->
						<div
							v-if="imgValue"
							class="mt-2 mx-3 rounded-lg transition-all"
							:style="{
								maxHeight: imgMaximized ? '512px' : '256px',
							}"
						>
							<Progress
								v-if="imgLoading"
								:model-value="store.imgProgress * 100"
								:style="{
									// visibility: store.imgGenerating ? 'visible' : 'hidden',
									opacity: store.imgGenerating ? 1 : 0,
								}"
								class="mt-2"
							/>
							<img v-if="imgLoading" class="shadow-md" src="/assets/placeholder.png" />
							<img
								v-if="!imgLoading"
								@click="imgMaximized = !imgMaximized"
								:src="imgValue"
								:class="[
									'shadow-md',
									'cursor-pointer',
									'hover:shadow-lg',
									imgMaximized ? 'hover:scale-95' : 'hover:scale-105',
									'transition-all',
								]"
							/>
						</div>
					</CardContent>
				</Card>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem @click="doCopyMessage">Copy</ContextMenuItem>
				<DialogTrigger asChild>
					<ContextMenuItem
						@click="triggerEdit"
						v-if="isUser || threadMode === 'custom'"
					>
						Edit
					</ContextMenuItem>
				</DialogTrigger>
				<ContextMenuItem @click="doDelete" v-if="isUser">Delete</ContextMenuItem>
				<!-- TODO confirm (reuse same dialog) -->
				<!-- <ContextMenuSeparator />
				<ContextMenuItem @click="doClearThread">
					Delete All Messages
				</ContextMenuItem> -->
			</ContextMenuContent>
		</ContextMenu>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>{{ editingMessageTitle }}</DialogTitle>
			</DialogHeader>
			<DialogDescription>
				<!-- TODO how to programmatically close dialog? (i.e. on ctrl+enter) -->
				<Textarea
					v-model="editingMessage"
					placeholder="Message content..."
					class="w-full min-h-48"
				/>
			</DialogDescription>
			<DialogFooter>
				<DialogClose as-child>
					<Button @click="handleEdit" type="button">Confirm</Button>
				</DialogClose>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
