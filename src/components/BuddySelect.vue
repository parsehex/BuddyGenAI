<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card';
import { ChevronDown } from 'lucide-vue-next';
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import { useAppStore } from '@/stores/main';
import { Label } from './ui/label';
import BuddyAvatar from './BuddyAvatar.vue';

const selectedBuddy = ref('');

const store = useAppStore();

const emit = defineEmits(['select']);

const props = defineProps({
	includeAi: {
		type: Boolean,
		default: true,
	},
});

const startChat = (id: string | null) => {
	emit('select', id);
};

const truncateDescription = (description: string, maxLength: number) => {
	if (description.length <= maxLength) {
		return description;
	}
	return description.substring(0, maxLength) + '...';
};
</script>
<template>
	<div class="flex items-center space-x-2 justify-around w-full">
		<Label>Chat with:</Label>
		<Button v-if="includeAi" @click="startChat('ai')"> AI Assistant </Button>
		<Select v-if="store.buddies.length > 0" class="my-2" @update:modelValue="
			(id) => {
				startChat(id);
				selectedBuddy = '';
			}
		" v-model="selectedBuddy">
			<SelectTrigger>
				<SelectValue placeholder="Buddy" />
			</SelectTrigger>
			<SelectContent>
				<SelectLabel>Buddies</SelectLabel>
				<SelectGroup>
					<HoverCard v-for="buddy in store.buddies" :key="buddy.id" :open-delay="200">
						<HoverCardTrigger as-child>
							<SelectItem :value="buddy.id" @click="startChat(buddy.id)"> {{ buddy.name }} </SelectItem>
						</HoverCardTrigger>
						<HoverCardContent class="w-80" side="right">
							<div class="flex justify-around space-x-4">
								<BuddyAvatar :buddy="buddy" class="h-12 w-12" />
								<div class="space-y-1 grow">
									<h4 class="text-sm font-semibold">{{ buddy.name }}</h4>
									<p class="text-sm"> {{ truncateDescription(buddy.description || '', 150) }} </p>
								</div>
							</div>
						</HoverCardContent>
					</HoverCard>
				</SelectGroup>
			</SelectContent>
		</Select>
	</div>
</template>
