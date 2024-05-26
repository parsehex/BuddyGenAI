<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useCompletion } from 'ai/vue';
import router from '@/lib/router';
import { useToast } from '@/components/ui/toast';
import { useAppStore } from '@/stores/main';
import urls from '@/lib/api/urls';
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectLabel,
	SelectGroup,
	SelectItem,
} from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';
import { Sparkles } from 'lucide-vue-next';
import BuddyAvatar from './BuddyAvatar.vue';
import { Progress } from '@/components/ui/progress';
import useElectron from '@/composables/useElectron';
import { descriptionFromKeywords } from '@/lib/prompt/persona';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import Spinner from './Spinner.vue';
import {
	genderFromName,
	keywordsFromNameAndDescription,
} from '@/lib/prompt/sd';
import LocalModelSettingsCard from './LocalModelSettingsCard.vue';
import ExternalModelSettingsCard from './ExternalModelSettingsCard.vue';
import ScrollArea from './ui/scroll-area/ScrollArea.vue';
import DevOnly from './DevOnly.vue';
import BuddyAppearanceOptions from './BuddyAppearanceOptions.vue';

// NOTE this component sort of doubles as the First Time Experience and the Buddy Creator

const { openExternalLink } = useElectron();
const { toast } = useToast();
const { complete } = useCompletion({ api: urls.message.completion() });
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

// TODO check if buddy name already exists, add text alerting user
const buddyName = ref('');
const buddyKeywords = ref('');
const createdDescription = ref('');
const profilePicturePrompt = ref('');

const acceptedBuddy = ref('' as '' | 'description' | 'keywords');
const newBuddy = ref(null as BuddyVersionMerged | null);
const updatingProfilePicture = ref(false);

const keywordsPopover = ref(false);
const profilePicPopover = ref(false);
const createdKeywords = ref('');

const acceptedBuddyDesc = ref('');
const acceptBuddy = async (
	descriptionOrKeywords: 'description' | 'keywords'
) => {
	if (!buddyName.value || !buddyKeywords.value) {
		toast({
			variant: 'destructive',
			description: 'Please fill out a Name and Keywords for your Buddy.',
		});
		return;
	}
	let buddyDescription = createdDescription.value;
	if (descriptionOrKeywords === 'keywords') {
		buddyDescription = buddyKeywords.value;
	}
	newBuddy.value = await api.buddy.createOne({
		name: buddyName.value,
		description: buddyDescription,
	});

	acceptedBuddy.value = descriptionOrKeywords;
	acceptedBuddyDesc.value = buddyDescription;
	keywordsPopover.value = false;
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
onMounted(() => {
	if (!settings.local_model_directory) {
		pickModelDirectory();
	}
});

const handleSave = async () => {
	if (store.newHere && !userNameValue.value) {
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
	await api.buddy.updateOne({
		id: newBuddy.value.id,
		profile_pic_prompt: profilePicturePrompt.value,
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

const creatingDescription = ref(false);
const createDescription = async () => {
	if (!buddyName.value || !buddyKeywords.value) {
		toast({
			variant: 'destructive',
			description: 'Please enter a name and some info for your Buddy.',
		});
		return;
	}
	if (!store.chatServerRunning) {
		toast({
			variant: 'destructive',
			description: 'Please start the chat server first.',
		});
		return;
	}
	const promptStr = descriptionFromKeywords(
		buddyName.value,
		buddyKeywords.value
	);
	let value = '';
	try {
		creatingDescription.value = true;
		value = (await complete(promptStr, {
			body: { max_tokens: 175, temperature: 0.25 },
		})) as string;
		creatingDescription.value = false;
	} catch (e) {
		console.error(e);
		value = '';
	}
	value = value || '';
	value = value.trim();
	if (!value) {
		toast({
			variant: 'destructive',
			description: 'Error remixing description. Please try again.',
		});
		return;
	}

	// TODO do better
	// does value end with a period? if not, truncate to last period
	const l = value.length;
	if (value[l - 1] !== '.') {
		const lastPeriod = value.lastIndexOf('.');
		if (lastPeriod !== -1) {
			value = value.slice(0, lastPeriod + 1);
		}
	}
	createdDescription.value = value;
};

const randomizedBuddy = ref(
	null as { name: string; description: string } | null
);
const creatingKeywords = ref(false);
const randomizeKeywords = async () => {
	let promptStr = `Your task is to generate a name and a description for someone${
		buddyName.value ? ' named ' + buddyName.value : ''
	}.\n\nReturn a JSON object with the keys "name" and "description".\n\nRandom seed: ${Math.random()}`;
	let value = '';
	try {
		creatingKeywords.value = true;
		value = (await complete(promptStr, {
			body: { max_tokens: 150, temperature: 0.15 },
		})) as string;
		creatingKeywords.value = false;
	} catch (e) {
		console.error(e);
		value = '';
	}
	console.log(value);
	value = value || '';
	value = value.trim();
	if (!value) {
		toast({
			variant: 'destructive',
			description: 'Error generating keywords. Please try again.',
		});
		return;
	}
	try {
		randomizedBuddy.value = JSON.parse(value);
	} catch (e) {
		console.error(value, e);
		toast({
			variant: 'destructive',
			description: 'Error parsing response. Please try again.',
		});
	}
};

const creatingSuggestKeywords = ref(false);
const suggestKeywords = async () => {
	const descVal = newBuddy.value?.description || acceptedBuddyDesc.value || '';
	const promptStr = keywordsFromNameAndDescription(buddyName.value, descVal);
	let value = '';
	try {
		creatingSuggestKeywords.value = true;
		value = (await complete(promptStr, {
			body: { max_tokens: 75, temperature: 0.75 },
		})) as string;
		creatingSuggestKeywords.value = false;
	} catch (e) {
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

const acceptPicKeywords = () => {
	const existingKeywords = profilePicturePrompt.value;
	if (existingKeywords) {
		profilePicturePrompt.value = `${existingKeywords}, ${createdKeywords.value}`;
	} else {
		profilePicturePrompt.value = createdKeywords.value;
	}
	createdKeywords.value = '';
	profilePicPopover.value = false;

	refreshProfilePicture();
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
				v-if="!store.isModelsSetup"
				:first-time="store.newHere"
				@open-model-directory="openModelDirectory"
			/>

			<Card
				v-if="!store.chatServerStarting && store.isModelsSetup"
				class="whitespace-pre-wrap w-full md:max-w-screen-sm lg:max-w-screen-md xl:max-w-screen-lg p-2 pt-2 mt-4"
			>
				<CardHeader class="pt-0 pb-0">
					<h2 v-if="store.newHere" class="text-lg text-center underline mb-0 pb-3">
						{{ 'What do we call you?' }}
					</h2>
					<Label
						v-if="store.newHere"
						class="mb-0 pb-3 text-center flex items-center justify-center"
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
							<h2 class="text-lg mb-4 text-center underline">
								{{ buddies.length ? 'Create a Buddy' : 'Create your first Buddy' }}
							</h2>
							<!-- TODO untangle this rats nest of a file -->
							<p class="text-sm text-gray-500">
								Choose a name that feels friendly and relatable, like "Alex" or "Sam."
								Your buddy's name helps shape their personality!
							</p>
							<Input
								v-model="buddyName"
								class="my-2 p-2 border border-gray-300 dark:border-gray-700 rounded w-1/2"
								placeholder="Name"
							/>
							<div class="flex flex-col items-center space-x-2 w-full mt-4">
								<!-- add tooltip with tips on good values -->
								<Label
									class="block text-lg text-center font-bold"
									for="persona-keywords"
								>
									Use a few words to describe your Buddy
								</Label>
								<p class="text-sm text-gray-500 text-center mb-1">
									This affects how {{ buddyName || 'your Buddy' }} talks with you.
									<br />
									You can use keywords like
									<b><i>friendly, helpful, funny,</i></b>
									etc.
								</p>
								<div class="flex w-full items-center gap-1.5">
									<Input
										id="persona-keywords"
										v-model="buddyKeywords"
										@keyup.enter="acceptBuddy('keywords')"
										class="p-2 border border-gray-300 dark:border-gray-700 rounded"
									/>

									<Popover
										:open="keywordsPopover"
										@update:open="
											($event) => {
												if (!store.isExternalProvider && !store.chatServerRunning) return;
												keywordsPopover = $event;
											}
										"
									>
										<PopoverTrigger as-child>
											<!-- TODO make component -->
											<Button
												type="button"
												class="magic"
												title="Create a description"
												:disabled="!store.isExternalProvider && !store.chatServerRunning"
											>
												<Sparkles />
											</Button>
										</PopoverTrigger>
										<PopoverContent
											:prioritize-position="true"
											side="left"
											:avoid-collisions="true"
											align="start"
											class="w-96"
										>
											<div class="flex items-center">
												<Button
													@click="createDescription"
													class="p-2 bg-blue-500 text-white rounded"
													v-if="buddyKeywords"
												>
													Create Description
												</Button>
												<Button
													@click="randomizeKeywords"
													class="p-2 bg-blue-500 text-white rounded"
													v-else
												>
													Randomize
												</Button>
												<Spinner v-if="creatingKeywords || creatingDescription" />
											</div>
											<p class="mt-4" v-if="createdDescription">
												Created Description:
												<br />
												<span class="text-lg ml-3">{{ createdDescription }}</span>
											</p>
											<p class="mt-4" v-else-if="randomizedBuddy">
												Randomized Buddy:
												<br />
												<span class="text-lg ml-3">
													{{ randomizedBuddy.name }}
												</span>
												<br />
												<span class="text-lg ml-3">
													{{ randomizedBuddy.description }}
												</span>
											</p>

											<!-- accept/cancel buttons -->
											<div class="flex justify-center mt-4" v-if="createdDescription">
												<Button
													@click="acceptBuddy('description')"
													class="p-2 success text-white rounded"
												>
													Accept
												</Button>
												<Button
													@click="createdDescription = ''"
													class="p-2 bg-blue-500 text-white rounded"
												>
													Cancel
												</Button>
											</div>
											<div class="flex justify-center mt-4" v-else-if="randomizedBuddy">
												<Button
													@click="
														() => {
															if (!randomizedBuddy) return;
															buddyName = randomizedBuddy.name;
															buddyKeywords = randomizedBuddy.description;
															randomizedBuddy = null;
															keywordsPopover = false;
														}
													"
													class="p-2 success text-white rounded"
												>
													Accept
												</Button>
												<Button
													@click="
														() => {
															randomizedBuddy = null;
															keywordsPopover = false;
														}
													"
													class="p-2 bg-blue-500 text-white rounded"
												>
													Cancel
												</Button>
											</div>
										</PopoverContent>
									</Popover>
								</div>

								<div>
									<Button
										@click="acceptBuddy(createdDescription ? 'description' : 'keywords')"
										class="mt-4 p-2 bg-blue-500 text-white rounded"
									>
										Create Buddy
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card v-else class="mt-4 p-2 w-full" id="buddyCard">
						<CardContent>
							<h2 v-if="store.newHere" class="text-lg mt-4 text-center underline">
								Your first Buddy
							</h2>
							<p class="my-2 text-center">
								<span class="text-lg ml-3">{{ buddyName }}</span>
							</p>
							<div class="flex flex-col items-center">
								<BuddyAvatar
									v-if="acceptedBuddy && newBuddy"
									:persona="newBuddy"
									:no-default="true"
									size="lg"
								/>
								<p
									class="text-sm text-gray-500 select-none"
									v-if="acceptedBuddy && newBuddy"
								>
									Images are created using AI and may have unexpected results.
								</p>
								<BuddyAppearanceOptions
									v-if="acceptedBuddy && newBuddy"
									:persona="newBuddy"
									:profile-pic-prompt="profilePicturePrompt"
									@update-profile-pic-prompt="profilePicturePrompt = $event"
									@refresh-profile-picture="refreshProfilePicture"
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
