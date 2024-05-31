<script setup lang="ts">
import { useCompletion } from 'ai/vue';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-vue-next';
import { ref, onBeforeMount, watch, computed } from 'vue';
import { useRoute } from 'vue-router/auto';
import router from '@/lib/router';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { Buddy, BuddyVersionMerged } from '@/lib/api/types-db';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import urls from '@/lib/api/urls';
import BuddyAvatar from '@/components/BuddyAvatar.vue';
import Spinner from '@/components/Spinner.vue';
import { useAppStore } from '@/stores/main';
import type { ProfilePicQuality } from '@/lib/api/types-api';
import { descriptionFromKeywords } from '@/src/lib/prompt/buddy';
import {
	genderFromName,
	keywordsFromNameAndDescription,
} from '@/lib/prompt/sd';
import BuddyAvatarSelect from '@/src/components/BuddyAvatarSelect.vue';
import BuddyAppearanceOptions from '@/src/components/BuddyAppearanceOptions.vue';
import { isDescriptionValid, isNameValid } from '@/src/lib/ai/general';
import DevOnly from '@/src/components/DevOnly.vue';
import BuddyTagsInput from '@/src/components/BuddyTagsInput.vue';
import type { AppearanceCategory } from '@/src/lib/ai/appearance-options';

// TODO idea: when remixing, if theres already a description then revise instead of write anew

const { toast } = useToast();
const { complete } = useCompletion({ api: urls.message.completion() });
const { updateBuddies, updateModels, ttsModels } = useAppStore();
const store = useAppStore();

const route = useRoute();
const id = route.params.id as string;

const buddy = ref(null as BuddyVersionMerged | null);

const nameValue = ref('');
const selectedTTSVoice = ref('');
const descriptionValue = ref('');
const profilePictureValue = ref('');
const profilePicturePrompt = ref('');
const generatedAppearanceOptions = ref({
	'hair color': [],
	'hair style': [],
	'eye color': [],
	'body type': [],
	'clothing style': [],
} as Record<AppearanceCategory, string[]>);
const selectedAppearanceOptions = ref({
	'hair color': '',
	'hair style': '',
	'eye color': '',
	'body type': '',
	'clothing style': '',
} as Record<AppearanceCategory, string>);

const wizInput = ref('');

const updatingProfilePicture = ref(false);

const remixedDescription = ref('');

const allProfilePics = ref([] as string[]);
const allPicsOpen = ref(false);

const gen = ref(false);
const prog = ref(0);
watch(
	() => [store.imgGenerating, store.imgProgress],
	() => {
		gen.value = store.imgGenerating;
		prog.value = store.imgProgress;
	}
);

const handleSelectProfilePic = async (pic: string) => {
	await api.buddy.updateOne({
		id,
		profile_pic: pic,
	});
	buddy.value = await api.buddy.getOne(id);
	profilePictureValue.value = urls.buddy.getProfilePic(
		`${buddy.value?.id}/${pic}`
	);

	updateBuddies();
};

// TODO overhaul refreshing profile picture
// basically, allow the user to refresh the pic, but don't update until they save (+ do versioning on pics)
// how it'll actually work:
// page stays like it is until user clicks Refresh, at which point:
// show new elements showing the old avatar and the newly generated one which will get saved onSave
// (possibly have a generation history viewer)
// we can clean up pics that werent used

onBeforeMount(async () => {
	buddy.value = await api.buddy.getOne(id);
	if (buddy.value) {
		nameValue.value = buddy.value.name;
		descriptionValue.value = buddy.value.description || '';
	}
	if (buddy.value?.tts_voice) {
		selectedTTSVoice.value = buddy.value.tts_voice;
	}
	if (buddy.value?.profile_pic) {
		profilePictureValue.value = urls.buddy.getProfilePic(
			`${buddy.value.id}/${buddy.value.profile_pic}`
		);
	}
	if (buddy.value?.profile_pic_prompt) {
		profilePicturePrompt.value = buddy.value.profile_pic_prompt;
	}
	if (buddy.value?.appearance_options) {
		generatedAppearanceOptions.value = JSON.parse(buddy.value.appearance_options);
	}
	if (buddy.value?.selected_appearance_options) {
		selectedAppearanceOptions.value = JSON.parse(
			buddy.value.selected_appearance_options
		);
	}

	allProfilePics.value = await api.buddy.profilePic.getAll(id);

	updateModels('tts');
});

const isLoading = ref(false);

const validateName = async () => {
	const existing = store.buddies.find((b) => b.name === nameValue.value);
	if (existing && existing.id !== id) {
		toast({
			variant: 'destructive',
			description:
				'You have a buddy with that name already, pleaser choose another name.',
		});
		return false;
	}

	const nameIsValid = await isNameValid(nameValue.value, complete);
	if (!nameIsValid) {
		toast({
			variant: 'destructive',
			title: 'Invalid Name',
			description: 'Please enter a valid name for your buddy.',
		});
		isLoading.value = false;
		return false;
	}
	isLoading.value = false;
	return nameIsValid;
};

const validateKeywords = async () => {
	if (!descriptionValue.value) {
		toast({
			variant: 'destructive',
			description: 'Please enter some keywords for your buddy.',
		});
		isLoading.value = false;
		return false;
	}

	const descIsValid = await isDescriptionValid(
		descriptionValue.value,
		nameValue.value,
		complete
	);
	if (!descIsValid) {
		toast({
			variant: 'destructive',
			title: 'Invalid Description',
			description: 'Please enter a valid description for your buddy.',
		});
		isLoading.value = false;
		return false;
	}
	isLoading.value = false;
	return descIsValid;
};

const handleSave = async () => {
	isLoading.value = true;
	if (!(await validateName())) return;
	if (!(await validateKeywords())) return;

	const appOptStr = JSON.stringify(generatedAppearanceOptions.value);
	const selectedAppOptStr = JSON.stringify(selectedAppearanceOptions.value);

	await api.buddy.updateOne({
		id,
		name: nameValue.value,
		description: descriptionValue.value,
		tts_voice: selectedTTSVoice.value,
		appearance_options: appOptStr,
		selected_appearance_options: selectedAppOptStr,
	});
	await router.push(`/buddy/${id}/view`);
	isLoading.value = false;
};

const picQuality = ref(3 as ProfilePicQuality);
const picQual = computed({
	get: () => picQuality.value + '',
	set: (val: string) => {
		picQuality.value = parseInt(val) as ProfilePicQuality;
	},
});

const refreshProfilePicture = async () => {
	if (!buddy.value) {
		return;
	}
	updatingProfilePicture.value = true;
	await api.buddy.updateOne({
		id,
		profile_pic_prompt: profilePicturePrompt.value,
	});
	const genderPrompt = genderFromName(
		buddy.value.name,
		profilePicturePrompt.value
	);
	let gender = '';
	const completion = await complete(genderPrompt, {
		body: { max_tokens: 5, temperature: 0.01 },
	});
	console.log(genderPrompt, completion);
	if (completion) {
		gender = completion;
	}
	const res = await api.buddy.profilePic.createOne(id, picQuality.value, gender);

	buddy.value = await api.buddy.getOne(id);

	profilePictureValue.value = urls.buddy.getProfilePic(
		`${buddy.value?.id}/${res.output}`
	);
	updatingProfilePicture.value = false;

	allProfilePics.value = await api.buddy.profilePic.getAll(id);
	updateBuddies();
};

const generating = ref(false);
const remixDescription = async () => {
	if (!store.chatServerRunning) {
		toast({
			variant: 'destructive',
			description: 'Please go to the Chat tab and start the server first.',
		});
		return;
	}
	const promptStr = descriptionFromKeywords(
		buddy.value?.name || '',
		wizInput.value
	);
	generating.value = true;
	const value = await complete(promptStr, {
		body: { max_tokens: 100, temperature: 1 },
	});
	generating.value = false;
	if (!value) {
		toast({
			variant: 'destructive',
			description: 'Error remixing description. Please try again.',
		});
		return;
	}
	remixedDescription.value = value;
};
const acceptRemixedDescription = () => {
	descriptionValue.value = remixedDescription.value;
	remixedDescription.value = '';
};

let chosenType = 'more';

const keywordsPopover = ref(false);
const createdKeywords = ref('');
const creatingKeywords = ref(false);
const suggestKeywords = async (type: 'more' | 'new') => {
	chosenType = type;
	const descVal = buddy.value?.description || '';
	const promptStr = keywordsFromNameAndDescription(
		buddy.value?.name || '',
		descVal,
		type === 'more' ? profilePicturePrompt.value : undefined
	);
	let value = '';
	try {
		creatingKeywords.value = true;
		value = (await complete(promptStr, {
			body: { max_tokens: 75, temperature: 0.75 },
		})) as string;
		creatingKeywords.value = false;
	} catch (e) {
		creatingKeywords.value = false;
		console.error(e);
		value = '';
	}
	value = value || '';
	value = value.trim();
	if (!value) {
		toast({
			variant: 'destructive',
			description: 'Error generating keywords. Please try again.',
		});
		return;
	}
	createdKeywords.value = value;
};

const acceptKeywords = () => {
	const existingKeywords = profilePicturePrompt.value;
	if (chosenType === 'more') {
		if (existingKeywords) {
			profilePicturePrompt.value = `${existingKeywords}, ${createdKeywords.value}`;
		} else {
			profilePicturePrompt.value = createdKeywords.value;
		}
	} else {
		profilePicturePrompt.value = createdKeywords.value;
	}
	createdKeywords.value = '';
	keywordsPopover.value = false;

	refreshProfilePicture();
};
</script>

<template>
	<ScrollArea class="h-screen flex flex-col items-center">
		<h1 class="text-2xl font-bold text-center">Edit Buddy</h1>
		<div class="flex items-center justify-center mb-2">
			<Button
				type="button"
				@click="router.push(`/buddy/${id}/view`)"
				variant="outline"
			>
				View
			</Button>
			<!-- <RouterLink class="ml-4" :to="`/buddy/${id}/history`">
				Version History
			</RouterLink> -->
		</div>
		<Card class="whitespace-pre-wrap w-full">
			<CardContent>
				<div class="flex flex-col items-center">
					<Input
						v-model="nameValue"
						placeholder="Buddy name"
						size="lg"
						class="my-2 w-2/5"
					/>
					<BuddyAvatar v-if="buddy" :buddy="buddy" size="lg" class="text-3xl" />

					<p
						class="text-sm text-gray-500 select-none"
						v-if="buddy && buddy.profile_pic"
					>
						Images are created using AI and may have unexpected results.
					</p>

					<BuddyAvatarSelect
						v-if="buddy"
						:buddy="buddy"
						:all-profile-pics="allProfilePics"
						@select-profile-pic="handleSelectProfilePic"
					/>

					<BuddyAppearanceOptions
						v-if="buddy"
						:buddy="buddy"
						:profile-pic-prompt="profilePicturePrompt"
						@refresh-profile-pic="refreshProfilePicture"
						@update-profile-pic-prompt="profilePicturePrompt = $event"
						v-model:appearance-options="generatedAppearanceOptions"
						v-model:selected-appearance-options="selectedAppearanceOptions"
					/>

					<div class="flex flex-col items-center justify-center w-full">
						<Progress v-if="gen" :model-value="prog * 100" class="my-2" />
						<Button type="button" @click="refreshProfilePicture" class="mt-2">
							{{ profilePictureValue ? 'Refresh Picture' : 'Create Profile Picture' }}
						</Button>
					</div>

					<Label class="mt-4 flex flex-col items-center">
						<span class="text-xl">{{ buddy?.name }}'s Voice</span>
						<Select
							:default-value="buddy?.tts_voice || ''"
							v-model="selectedTTSVoice"
							class="w-full"
						>
							<SelectTrigger :title="selectedTTSVoice">
								<SelectValue placeholder="Select a TTS voice" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>TTS Voices</SelectLabel>
									<SelectItem v-for="model in ttsModels" :key="model" :value="model">
										{{ model }}
									</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</Label>
				</div>
				<div class="flex flex-col items-center mt-4">
					<label class="text-xl w-full text-center"> Description </label>
					<p>
						<span class="text-sm ml-4 select-none italic">
							{{ buddy?.name }} is...
						</span>
						<br />
						<span class="text-lg">
							{{ buddy?.description }}
						</span>
					</p>
					<BuddyTagsInput
						type="edit"
						:buddyName="buddy?.name || ''"
						:buddyKeywords="descriptionValue"
						:updateBuddyKeywords="
							(keywords) => (descriptionValue = keywords.join(', '))
						"
					/>
					<DevOnly class="w-full">
						<Textarea
							v-model="descriptionValue"
							:placeholder="`${buddy?.name} is...`"
							class="min-h-24"
						/>
					</DevOnly>
					<Button type="button" @click="handleSave" class="mt-4">Save</Button>
					<Spinner v-if="isLoading" class="mt-2" />
				</div>
			</CardContent>
		</Card>
	</ScrollArea>
</template>

<style>
/*  */
</style>
