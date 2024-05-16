<script setup lang="ts">
import { useCompletion } from 'ai/vue';
import { useToast } from '@/components/ui/toast';
import { useAppStore } from '~/stores/main';
import urls from '~/lib/api/urls';
import type { BuddyVersionMerged } from '~/lib/api/types-db';
import { api } from '~/lib/api';
import { Sparkles } from 'lucide-vue-next';
import BuddyAvatar from './BuddyAvatar.vue';
import type { ProfilePicQuality } from '~/lib/api/types-api';
import { Progress } from '@/components/ui/progress';
import { descriptionFromKeywords } from '~/lib/prompt/persona';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import Spinner from './Spinner.vue';
import {
	genderFromName,
	keywordsFromNameAndDescription,
} from '~/lib/prompt/sd';
import LocalModelSettingsCard from './LocalModelSettingsCard.vue';
import ExternalModelSettingsCard from './ExternalModelSettingsCard.vue';
import ScrollArea from './ui/scroll-area/ScrollArea.vue';

// NOTE this component sort of doubles as the First Time Experience and the Buddy Creator

const props = defineProps<{
	serverStarting: boolean;
	isModelsSetup: boolean;
	handleModelChange: () => void;
}>();

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

	setTimeout(() => {
		document.getElementById('buddyCard')?.scrollIntoView({ behavior: 'smooth' });
	}, 250);
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

const modelProvider = computed({
	get: () => {
		// should be the same for both
		return settings.selected_provider_chat;
	},
	set: (value) => {
		settings.selected_provider_chat = value;
		settings.selected_provider_image = value;
	},
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

	await navigateTo(`/chat/${newThread.id}`);
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
		<div class="flex flex-col items-center">
			<NuxtLink
				class="text-xl font-bold mb-2 dark:bg-gray-600 p-1 pt-0 rounded-b"
				to="/"
			>
				{{ store.newHere ? 'Welcome to' : '' }}
				<div class="underline inline">
					<span style="color: #61dafb">BuddyGen</span>
					<span style="color: #111">AI</span>
				</div>
			</NuxtLink>

			<Avatar v-if="store.newHere" size="base">
				<!-- idea: pre-generate roster of buddy profile pics and swap their avatar pics -->
				<img src="/assets/logo.png" alt="BuddyGen Logo" />
			</Avatar>

			<p v-if="store.newHere" class="text-center mt-2">
				For setup instructions, please
				<span
					class="text-blue-500 cursor-pointer"
					@click="
						openExternalLink &&
							openExternalLink(
								'https://github.com/parsehex/BuddyGenAI/blob/main/docs/how-to-setup.md'
							)
					"
				>
					go here
				</span>
			</p>

			<!-- Server Starting Spinner -->
			<div
				v-if="serverStarting"
				class="text-center flex flex-col items-center justify-center"
			>
				<Spinner />
				Getting ready...
			</div>

			<!-- TODO implement external models using OpenRouter (idk how for images) -->
			<!-- Model Source -- External or Local -->
			<Card
				v-if="!isModelsSetup"
				class="whitespace-pre-wrap w-full md:w-2/3 p-2 pt-4"
			>
				<CardHeader class="pt-0 pb-0 text-center">
					Please answer some questions before you create your first Buddy.
				</CardHeader>
				<CardContent>
					<div
						class="flex flex-col w-full items-center justify-between gap-1.5 mt-4"
					>
						<h2 class="text-lg text-center underline">
							Where will you get models from?
						</h2>
						<ul class="mb-2">
							<li>
								<b>External</b>
								-- only OpenAI/ChatGPT supported for now
							</li>
							<li>
								<b>Local</b>
								-- uses
								<span
									class="text-blue-500 cursor-pointer"
									@click="
										openExternalLink &&
											openExternalLink('https://github.com/Mozilla-Ocho/llamafile')
									"
								>
									LlamaFile
								</span>
								+
								<span
									class="text-blue-500 cursor-pointer"
									@click="
										openExternalLink &&
											openExternalLink('https://github.com/leejet/stable-diffusion.cpp')
									"
								>
									Stable-Diffusion.cpp
								</span>
							</li>
						</ul>
						<Label for="chat-model-provider" class="w-full">
							Model Provider
							<Select v-model="modelProvider" id="chat-model-provider">
								<SelectTrigger>
									<SelectValue placeholder="Select a chat model provider" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Model Providers</SelectLabel>
										<SelectItem value="external">External</SelectItem>
										<SelectItem value="local">Local (experimental)</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</Label>
					</div>
				</CardContent>
			</Card>

			<ExternalModelSettingsCard
				v-if="!isModelsSetup && modelProvider === 'external'"
				:first-time="store.newHere"
			/>

			<LocalModelSettingsCard
				v-if="!isModelsSetup && modelProvider === 'local'"
				:first-time="store.newHere"
				@open-model-directory="openModelDirectory"
				@model-change="handleModelChange"
			/>

			<Card
				v-if="!serverStarting && isModelsSetup"
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
							class="p-2 border border-gray-300 rounded text-center w-1/2 ml-2"
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
								class="my-2 p-2 border border-gray-300 rounded w-1/2"
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
										class="p-2 border border-gray-300 rounded"
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
								<Label for="profile-picture" class="flex flex-col items-center">
									<span class="text-lg">Appearance</span>
								</Label>
								<p class="text-sm text-gray-500">
									You can use keywords -- e.g.
									<b><i>tan suit, sunglasses,</i></b>
									etc.
								</p>
								<div class="flex w-full items-center gap-1.5">
									<Input
										id="profile-picture"
										v-model="profilePicturePrompt"
										@keyup.enter="refreshProfilePicture"
										class="p-2 border border-gray-300 rounded"
									/>

									<Popover
										:open="profilePicPopover"
										@update:open="
											($event) => {
												if (!store.isExternalProvider && !store.chatServerRunning) return;
												profilePicPopover = $event;
											}
										"
									>
										<PopoverTrigger as-child>
											<Button
												type="button"
												class="magic"
												title="Suggest keywords"
												:disabled="!store.isExternalProvider && !store.chatServerRunning"
											>
												<Sparkles />
											</Button>
										</PopoverTrigger>
										<PopoverContent
											side="top"
											:avoid-collisions="true"
											align="start"
											class="flex flex-col px-2 py-4"
										>
											<Button
												@click="suggestKeywords"
												class="p-2 bg-blue-500 text-white rounded"
											>
												Suggest {{ profilePicturePrompt.length ? 'More' : '' }} Keywords
											</Button>
											<Spinner v-if="creatingSuggestKeywords" />

											<p v-if="createdKeywords" class="my-4">
												<span class="text-sm">AI Suggestion:</span>
												<br />
												<span class="font-bold">{{ createdKeywords }}</span>
											</p>
											<Button
												v-if="createdKeywords"
												class="p-2 success text-white rounded"
												@click="acceptPicKeywords"
											>
												Accept & Make Picture
											</Button>
										</PopoverContent>
									</Popover>
								</div>

								<div
									class="flex flex-col items-center justify-center my-1"
									v-if="!store.isExternalProvider"
								>
									<Label class="text-lg">Picture Quality</Label>
									<Select v-model:model-value="picQuality" class="my-2">
										<SelectTrigger>
											<SelectValue placeholder="Buddy" />
										</SelectTrigger>
										<SelectContent>
											<SelectLabel>Quality</SelectLabel>
											<SelectGroup>
												<SelectItem value="1">Low</SelectItem>
												<SelectItem value="2">Medium</SelectItem>
												<SelectItem value="3">High</SelectItem>
											</SelectGroup>
										</SelectContent>
									</Select>
								</div>
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
					<Alert v-if="store.newHere" class="mt-4 p-2" variant="info">
						<AlertTitle>Tip</AlertTitle>
						<AlertDescription>
							You can make a Custom chat without a Buddy from the sidebar.
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		</div>
	</ScrollArea>
</template>
