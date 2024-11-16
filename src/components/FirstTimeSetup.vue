<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import router from '@/lib/router';
import { useToast } from '@/components/ui/toast';
import { useAppStore } from '@/stores/main';
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import BuddyAvatar from './BuddyAvatar.vue';
import { Progress } from '@/components/ui/progress';
import useElectron from '@/composables/useElectron';
import Spinner from './Spinner.vue';
import { genderFromName } from '@/lib/prompt/sd';
import LocalModelSettingsCard from './LocalModelSettingsCard.vue';
import ScrollArea from './ui/scroll-area/ScrollArea.vue';
import BuddyAppearanceOptions from './BuddyAppearanceOptions.vue';
import { isDescriptionValid, isNameValid } from '@/lib/ai/general';
import BuddyTagsInput from './BuddyTagsInput.vue';
import type { AppearanceCategory } from '@/lib/ai/appearance-options';
import { complete } from '@/lib/ai/complete';

// NOTE this component sort of doubles as the First Time Experience and the Buddy Creator

const { openExternalLink } = useElectron();
const { toast } = useToast();
const { settings, updateModels, updateSettings, updateThreads } = useAppStore();
const buddies = useAppStore().buddies as BuddyVersionMerged[];
const store = useAppStore();

const gen = ref(false);
const prog = ref(0);
watch(
	() => [store.imgGenerating, store.imgProgress],
	() => {
		gen.value = store.imgGenerating;
		prog.value = store.imgProgress;
	}
);

const userNameValue = ref('');

const buddyName = ref('');
const buddyKeywords = ref('friendly, talkative');
const profilePicturePrompt = ref('');

const buddyKeywordsArr = computed({
	get: () => {
		if (!buddyKeywords.value) return [];
		return buddyKeywords.value.split(',').map((s) => s.trim());
	},
	set: (value: string[]) => {
		buddyKeywords.value = value.join(', ');
	},
});

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

const acceptedBuddy = ref(false);
const newBuddy = ref(null as BuddyVersionMerged | null);
const updatingProfilePicture = ref(false);

const keywordsPopover = ref(false);

const isSaving = ref(false);
const validateName = async () => {
	const existing = store.buddies.find((b) => b.name === buddyName.value);
	if (existing && existing.id !== newBuddy.value?.id) {
		toast({
			variant: 'destructive',
			description:
				'You have a buddy with that name already, pleaser choose another name.',
		});
		isSaving.value = false;
		return false;
	}

	// const nameIsValid = await isNameValid(buddyName.value, complete);
	// if (!nameIsValid) {
	// 	toast({
	// 		variant: 'destructive',
	// 		title: 'Invalid Name',
	// 		description: 'Please enter a valid name for your buddy.',
	// 	});
	// 	isSaving.value = false;
	// 	return false;
	// }
	// return nameIsValid;
	return true;
};
const validateKeywords = async () => {
	if (!buddyKeywordsArr.value.length) {
		toast({
			variant: 'destructive',
			description: 'Please enter some keywords for your buddy.',
		});
		return false;
	}

	const descIsValid = await isDescriptionValid(
		buddyKeywordsArr.value.join(', '),
		buddyName.value,
		complete
	);
	if (!descIsValid) {
		toast({
			variant: 'destructive',
			title: 'Invalid Description',
			description: 'Please enter a valid description for your buddy.',
		});
	}
	return descIsValid;
};

const acceptedBuddyDesc = ref('');
const acceptBuddy = async () => {
	isSaving.value = true;
	// if (!(await validateName())) return;
	// if (!(await validateKeywords())) return;

	const appOptStr = JSON.stringify(generatedAppearanceOptions.value);
	const selectedAppOptStr = JSON.stringify(selectedAppearanceOptions.value);
	const buddyDescription = buddyKeywords.value;
	newBuddy.value = await api.buddy.createOne({
		name: buddyName.value,
		description: buddyDescription,
		appearance_options: appOptStr,
		selected_appearance_options: selectedAppOptStr,
	});

	acceptedBuddy.value = true;
	acceptedBuddyDesc.value = buddyDescription;
	keywordsPopover.value = false;
	isSaving.value = false;
};

const updateName = async () => {
	if (!userNameValue.value) return;
	if (userNameValue.value === settings.user_name) return;
	settings.user_name = userNameValue.value;
};

const { pickDirectory, verifyModelDirectory, openModelsDirectory } =
	useElectron();
const openModelDirectory = () => {
	if (!openModelsDirectory) return console.error('Electron not available');
	openModelsDirectory();
};
const pickModelDirectory = async () => {
	if (!pickDirectory) return console.error('Electron not available');

	const dir = await verifyModelDirectory();
	if (!dir) {
		throw new Error('Invalid model directory');
	}
	settings.local_model_directory = dir;

	await updateModels();
};
// onMounted(() => {
// 	if (!settings.local_model_directory) {
// 		pickModelDirectory();
// 	}
// });

const handleSave = async () => {
	if (
		store.newHere &&
		store.settings.user_name.toLowerCase() === 'user' &&
		!userNameValue.value
	) {
		toast({ variant: 'destructive', description: 'Please fill out your name.' });
		return;
	}
	if (!buddyName.value || !buddyKeywords.value) {
		toast({
			variant: 'destructive',
			description: "Please fill out your Buddy's Name and Keywords.",
		});
		return;
	}
	if (!newBuddy.value) {
		toast({
			variant: 'destructive',
			description: 'Please create a Buddy first.',
		});
		return;
	}
	const updatedSettings = {
		user_name: userNameValue.value,
	};
	await api.setting.update(updatedSettings);
	await updateSettings();

	const { id, name } = newBuddy.value;
	const newThread = await api.thread.createOne({
		name: `Chat with ${name}`,
		mode: 'persona',
		persona_id: id,
	});

	await updateThreads();

	await router.push(`/chat/${newThread.id}`);
};

const picQuality = ref('2');

const refreshProfilePicture = async () => {
	if (!newBuddy.value) {
		toast({
			variant: 'destructive',
			description: 'Please create a Buddy first.',
		});
		return;
	}
	if (updatingProfilePicture.value) {
		return;
	}
	if (profilePicturePrompt.value.split(',').length < 4) {
		toast({
			variant: 'destructive',
			description: 'Please select all appearance options first.',
		});
		return;
	}
	console.log(generatedAppearanceOptions.value);
	const appOptStr = JSON.stringify(generatedAppearanceOptions.value);
	const selectedAppOptStr = JSON.stringify(selectedAppearanceOptions.value);
	await api.buddy.updateOne({
		id: newBuddy.value.id,
		profile_pic_prompt: profilePicturePrompt.value,
		appearance_options: appOptStr,
		selected_appearance_options: selectedAppOptStr,
	});
	const genderPrompt = genderFromName(
		buddyName.value,
		profilePicturePrompt.value
	);
	let gender = '';
	const completion = await complete(genderPrompt);
	console.log(genderPrompt, completion);
	if (completion) {
		gender = completion;
	}
	const id = newBuddy.value.id;
	updatingProfilePicture.value = true;
	const res = await api.buddy.profilePic.createOne(
		id,
		+picQuality.value,
		gender
	);

	newBuddy.value.profile_pic = res.output;
	updatingProfilePicture.value = false;
};
</script>

<template>
	<ScrollArea class="h-screen">
		<div class="flex flex-col items-center w-full md:w-5/6 mx-auto">
			<!-- idea: pre-generate roster of buddy profile pics and swap their avatar pics -->
			<img
				v-if="store.newHere"
				class="w-[50px]"
				src="/assets/logo.png"
				alt="BuddyGen Logo"
			/>
			<RouterLink
				class="text-xl font-bold dark:bg-gray-600 rounded-b px-1 mb-2"
				to="/"
			>
				{{ store.newHere ? 'Welcome to' : '' }}
				<div class="underline inline">
					<span style="color: #61dafb">BuddyGen</span>
					<span style="color: #111">AI</span>
				</div>
			</RouterLink>

			<div
				v-if="store.chatServerStarting"
				class="text-center flex flex-col items-center justify-center gap-y-2"
			>
				<Spinner />
				Getting ready...
			</div>

			<LocalModelSettingsCard
				v-if="!store.proceed"
				:first-time="store.newHere"
				@open-model-directory="openModelDirectory"
			/>

			<Card
				v-if="store.proceed && !store.chatServerStarting && store.isModelsSetup"
				class="whitespace-pre-wrap w-full md:max-w-screen-sm lg:max-w-screen-md xl:max-w-screen-lg p-2 pt-2 mt-4"
			>
				<CardHeader class="pt-0 pb-0">
					<Label
						v-if="store.newHere"
						class="mb-0 pb-3 text-center flex items-center justify-center text-lg"
					>
						Your Name
						<Input
							v-model="userNameValue"
							@blur="updateName"
							autofocus
							class="p-2 border border-gray-300 dark:border-gray-700 rounded text-center w-1/2 ml-2"
							@keyup.enter="handleSave"
						/>
					</Label>
				</CardHeader>
				<CardContent class="flex flex-col items-center">
					<Card v-if="!acceptedBuddy" class="mt-2 p-2 w-full">
						<!-- TODO starters -->
						<!-- TODO when settings change only update the values that changed -->
						<!-- require name first? -->
						<!-- ${userName} would like to talk to a buddy.\n\nYour task is to list names of buddies which the user might want to talk to.\nRespond with a valid JSON array of strings. -->
						<CardContent class="flex flex-col items-center">
							<h2 class="text-2xl text-center font-bold">
								{{ buddies.length ? 'Create a Buddy' : 'Create your first Buddy' }}
							</h2>
							<!-- TODO untangle this rats nest of a file -->
							<p class="text-sm text-gray-300">
								Choose a name that feels friendly and relatable, like "Alex" or "Sam."
							</p>
							<!-- TODO button to randomize -->
							<Input
								v-model="buddyName"
								class="my-4 p-2 border border-gray-300 dark:border-gray-700 rounded w-1/2"
								placeholder="Name"
							/>
							<div class="flex flex-col items-center space-x-2 w-full mt-4">
								<!-- add tooltip with tips on good values -->
								<Label class="block text-lg text-center font-bold" for="buddy-keywords">
									Characteristics
								</Label>
								<p class="text-sm text-gray-300 text-center mb-1">
									These affect how {{ buddyName || 'your Buddy' }} talks with you.
								</p>
								<BuddyTagsInput
									type="create"
									:buddyName="buddyName"
									:buddyKeywords="buddyKeywords"
									:updateBuddyKeywords="
										(keywords) => (buddyKeywords = keywords.join(', '))
									"
								/>

								<div>
									<Button @click="acceptBuddy()" class="mt-4 p-2 rounded">
										Create Buddy
									</Button>
									<Spinner v-if="isSaving" />
								</div>
							</div>
						</CardContent>
					</Card>
					<Card v-else class="mt-4 p-2 w-full">
						<CardContent>
							<h2 v-if="store.newHere" class="text-lg mt-4 text-center">
								{{ `Customize ${buddyName || 'your buddy'}'s appearance` }}
							</h2>
							<p class="my-2 text-center">
								<span class="text-lg">{{ buddyName }}</span>
							</p>
							<div class="flex flex-col items-center">
								<BuddyAvatar
									v-if="acceptedBuddy && newBuddy"
									:buddy="newBuddy"
									:no-default="true"
									size="lg"
									class="text-3xl"
								/>
								<p
									class="text-sm text-gray-500 select-none"
									v-if="acceptedBuddy && newBuddy"
								>
									Images are created using AI and may have unexpected results.
								</p>
								<BuddyAppearanceOptions
									v-if="acceptedBuddy && newBuddy"
									:buddy="newBuddy"
									:profile-pic-prompt="profilePicturePrompt"
									@update-profile-pic-prompt="profilePicturePrompt = $event"
									@refresh-profile-picture="refreshProfilePicture"
									v-model:appearance-options="generatedAppearanceOptions"
									v-model:selected-appearance-options="selectedAppearanceOptions"
								/>

								<Progress v-if="gen" :model-value="prog * 100" class="mt-2" />
								<Button
									@click="refreshProfilePicture"
									class="mt-4 p-2 bg-blue-500 text-white rounded"
								>
									New Profile Picture
								</Button>
							</div>
							<p class="mt-2">
								Description:
								<span class="text-lg ml-3">{{ acceptedBuddyDesc }}</span>
							</p>
						</CardContent>
					</Card>

					<Button
						v-if="acceptedBuddy"
						@click="handleSave"
						class="mt-4 p-2 success rounded"
					>
						Save
					</Button>
				</CardContent>
			</Card>
		</div>
	</ScrollArea>
</template>
