<script setup lang="ts">
import { ref, computed } from 'vue';
import { type GameLogEntry } from '@/stores/game';
import { Button } from '@/components/ui/button';
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
import BuddyAvatar from '@/src/components/BuddyAvatar.vue';
import { textToHslColor } from '@/src/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Volume2 } from 'lucide-vue-next';
import { useAppStore } from '@/stores/main';
import type { BuddyVersionMerged } from '@/src/lib/api/types-db';

const appStore = useAppStore();

const props = defineProps<{
	entry: GameLogEntry;
	index: number;
	selectedBuddy: BuddyVersionMerged;
	userName: string;
	userInitials: string;
	ttsEnabled: boolean;
	ttsLoading: boolean;
	doTTS: (entry: GameLogEntry) => Promise<void>;
}>();

const emit = defineEmits<{
	(e: 'edit', index: number, newContent: string): void;
}>();

const editingLogEntryContent = ref('');
const isEditingModalOpen = ref(false);

const triggerEdit = () => {
	editingLogEntryContent.value = props.entry.content;
	isEditingModalOpen.value = true;
};

const handleEdit = (e: KeyboardEvent | null, confirm = false) => {
	if (!confirm && e?.key !== 'Enter') return;
	if (!confirm && e?.key === 'Enter' && !e?.ctrlKey) return;

	emit('edit', props.index, editingLogEntryContent.value);
	isEditingModalOpen.value = false;
};

const handleCancelEdit = () => {
	editingLogEntryContent.value = '';
	isEditingModalOpen.value = false;
};

const doCopyMessage = () => {
	if (!props.entry.content) return;
	navigator.clipboard.writeText(props.entry.content);
};

const hasTTS = computed(() => {
	return !!props.entry.tts;
});

</script>
<template>
	<Dialog :modal="true" :open="isEditingModalOpen" @update:open="isEditingModalOpen = $event">
		<ContextMenu>
			<ContextMenuTrigger>
				<div :class="{ 'my-2': true, 'text-right': entry.type !== 'gm', 'text-left': entry.type === 'gm' }">
					<div class="inline-flex items-center p-3 rounded-lg max-w-[70%] break-words" :class="{
						'bg-blue-500 text-white': entry.type === 'user',
						'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100': entry.type === 'gm',
						'bg-green-200 dark:bg-green-700 text-green-900 dark:text-green-100': entry.type === 'buddy'
					}">
						<BuddyAvatar v-if="entry.type === 'buddy'" :buddy="selectedBuddy" />
						<Avatar v-if="entry.type === 'user'" class="text-md font-bold mr-2" :style="{
							backgroundColor: textToHslColor(userName, 60, 80),
						}">
							<AvatarImage v-if="appStore.settings.user_image" :src="appStore.settings.user_image" />
							<AvatarFallback v-else>{{ userInitials }}</AvatarFallback>
						</Avatar>
						<span :class="{ 'ml-2': entry.type !== 'gm' }" v-html="entry.content"></span>
						<Button v-if="ttsEnabled && (entry.type === 'buddy' || entry.type === 'gm')"
							:variant="hasTTS ? 'secondary' : 'ghost'" size="icon" :disabled="ttsLoading" @click="doTTS(entry)"
							class="ml-2">
							<Volume2 class="h-4 w-4" />
						</Button>
					</div>
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem @click="doCopyMessage">Copy</ContextMenuItem>
				<DialogTrigger asChild>
					<ContextMenuItem @click="triggerEdit">Edit</ContextMenuItem>
				</DialogTrigger>
				<!-- TODO: Add delete functionality if needed -->
			</ContextMenuContent>
		</ContextMenu>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Edit Game Log Entry</DialogTitle>
			</DialogHeader>
			<DialogDescription>
				<Textarea v-model="editingLogEntryContent" @keydown.enter="handleEdit" placeholder="Entry content..."
					class="w-full min-h-48" />
			</DialogDescription>
			<DialogFooter>
				<DialogClose as-child>
					<Button @click="handleCancelEdit" type="button" variant="outline">Cancel</Button>
					<Button @click="handleEdit(null, true)" type="button">Confirm</Button>
				</DialogClose>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
