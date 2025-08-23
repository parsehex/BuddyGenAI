<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Spinner from '@/components/Spinner.vue';
import { useAppStore } from '@/stores/main';
import { api } from '@/lib/api';
import BuddyTagsInput from '../BuddyTagsInput.vue';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectGroup,
	SelectLabel,
	SelectItem,
} from '@/components/ui/select';
import { useTTSAI } from '@/src/composables/ai/useTTSAI';

const store = useAppStore();
const ttsAI = useTTSAI();
const { toast } = useToast();

const buddyName = ref('');
const buddies = store.buddies;
const buddyKeywords = ref('friendly, talkative');
const isSaving = ref(false);

const buddyVoice = ref('');
const ttsEnabled = computed(() => store.settings.selected_provider_tts === 'koboldcpp');

const buddyKeywordsArr = computed({
	get: () => buddyKeywords.value.split(',').map((s) => s.trim()),
	set: (value: string[]) => {
		buddyKeywords.value = value.join(', ');
	},
});

const emit = defineEmits(['complete']);

const createBuddy = async () => {
	if (!buddyName.value || !buddyKeywords.value) {
		toast({
			variant: 'destructive',
			description: "Please fill out your Buddy's Name and Keywords.",
		});
		return;
	}

	const newBuddy = await api.buddy.createOne({
		name: buddyName.value,
		description: buddyKeywords.value,
		tts_voice: buddyVoice.value
	});

	emit('complete', newBuddy);
};
</script>
<template>
	<Card class="mt-2 p-2 w-full">
		<!-- TODO starters -->
		<!-- require name first? to get buddy suggestions -->
		<!-- ${userName} would like to talk to a buddy.\n\nYour task is to list names of buddies which the user might want to talk to.\nRespond with a valid JSON array of strings. -->
		<CardContent class="flex flex-col items-center">
			<h2 class="text-2xl text-center font-bold"> {{ buddies.length ? 'Create a Buddy' : 'Create your first Buddy' }}
			</h2>
			<!-- TODO untangle this rats nest of a file -->
			<p class="text-sm text-gray-300"> Choose a name that feels friendly and relatable, like "Alex" or "Sam." </p>
			<!-- TODO button to randomize -->
			<Input v-model="buddyName" class="my-4 p-2 border border-gray-300 dark:border-gray-700 rounded w-1/2"
				placeholder="Name" />
			<div class="flex flex-col items-center space-x-2 w-full mt-4">
				<!-- add tooltip with tips on good values -->
				<Label class="block text-lg text-center font-bold" for="buddy-keywords"> Characteristics </Label>
				<p class="text-sm text-gray-300 text-center mb-1"> These affect how {{ buddyName || 'your Buddy' }} talks with
					you. </p>
				<BuddyTagsInput type="create" :buddyName="buddyName" :buddyKeywords="buddyKeywords" :updateBuddyKeywords="(keywords) => (buddyKeywords = keywords.join(', '))
					" />
				<Select v-if="ttsEnabled" v-model="buddyVoice" id="buddy-voice">
					<SelectTrigger :title="buddyVoice">
						<SelectValue :placeholder="`Select a TTS voice for ${buddyName}`" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Voices</SelectLabel>
							<SelectItem v-for="voice in ttsAI.availVoices.value" :key="voice" :value="voice"> {{ voice }}
							</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
				<div>
					<Button @click="createBuddy()" class="mt-4 p-2 rounded"> Create Buddy </Button>
					<Spinner v-if="isSaving" />
				</div>
			</div>
		</CardContent>
	</Card>
</template>
