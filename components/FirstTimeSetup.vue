<script setup lang="ts">
import { useCompletion } from 'ai/vue';
import { useToast } from '@/components/ui/toast';
import { useAppStore } from '~/stores/main';
import urls from '~/lib/api/urls';
import type { BuddyVersionMerged } from '~/lib/api/types-db';
import { api } from '~/lib/api';
import { AtomIcon } from 'lucide-vue-next';
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
import { keywordsFromNameAndDescription } from '~/lib/prompt/sd';

const props = defineProps<{
	newHere: boolean;
	serverStarting: boolean;
	isModelsSetup: boolean;
	handleModelChange: () => void;
}>();

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

const relationshipToBuddy = ref('');

const keywordsPopover = ref(false);
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
};

const updateName = async () => {
	if (!userNameValue.value) return;
	if (userNameValue.value === settings.user_name) return;
	settings.user_name = userNameValue.value;
};

const { pickDirectory, verifyModelDirectory } = useElectron();
const pickModelDirectory = async () => {
	if (!pickDirectory) return console.error('Electron not available');

	const directory = await pickDirectory();
	if (!directory) return;

	await verifyModelDirectory(directory);
	settings.local_model_directory = directory;

	await updateModels();
};

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
	if (props.newHere && !userNameValue.value) {
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

const picQuality = ref(2 as ProfilePicQuality);

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
	const id = newBuddy.value.id;
	updatingProfilePicture.value = true;
	const res = await api.buddy.profilePic.createOne(id, picQuality.value);

	newBuddy.value.profile_pic = res.output;
	updatingProfilePicture.value = false;
};

const createDescription = async () => {
	if (!buddyName.value || !buddyKeywords.value) {
		toast({
			variant: 'destructive',
			description: 'Please fill out a Name and Keywords for your Buddy.',
		});
		return;
	}
	const promptStr = descriptionFromKeywords(
		buddyName.value,
		buddyKeywords.value
	);
	let value = '';
	try {
		value = (await complete(promptStr, {
			body: { max_tokens: 175, temperature: 0.25 },
		})) as string;
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

const suggestKeywords = async () => {
	const descVal = newBuddy.value?.description || acceptedBuddyDesc.value || '';
	const promptStr = keywordsFromNameAndDescription(buddyName.value, descVal);
	let value = '';
	try {
		value = (await complete(promptStr, {
			body: { max_tokens: 75, temperature: 0.75 },
		})) as string;
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

const acceptKeywords = () => {
	const existingKeywords = profilePicturePrompt.value;
	if (existingKeywords) {
		profilePicturePrompt.value = `${existingKeywords}, ${createdKeywords.value}`;
	} else {
		profilePicturePrompt.value = createdKeywords.value;
	}
	createdKeywords.value = '';
	keywordsPopover.value = false;

	refreshProfilePicture();
};
</script>

<template>
	<div>
		<div class="flex flex-col items-center">
			<NuxtLink class="text-xl font-bold mb-2" to="/">
				{{ newHere ? 'Welcome to' : '' }}
				<span class="underline">
					<span style="color: #61dafb">BuddyGen</span>
					<span style="color: #111">AI</span>
				</span>
			</NuxtLink>

			<!-- Server Starting Spinner -->
			<div
				v-if="serverStarting"
				class="text-center flex flex-col items-center justify-center"
			>
				<Spinner />
				Getting ready...
			</div>

			<!-- Model Source -- External or Local -->
			<Card
				v-if="!isModelsSetup"
				class="whitespace-pre-wrap w-full md:w-2/3 p-2 pt-4"
			>
				<CardHeader class="pt-0 pb-0 text-center">
					We need to answer some questions before we can create your first Buddy.
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
								-- such as ChatGPT
							</li>
							<li>
								<b>Local</b>
								-- your chats never leave your computer
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
										<SelectItem value="local">Local</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</Label>
					</div>
				</CardContent>
			</Card>

			<LocalModelSettingsCard
				v-if="!isModelsSetup && modelProvider === 'local'"
				:first-time="newHere"
				@pick-model-directory="pickModelDirectory"
				@model-change="handleModelChange"
			/>

			<Card
				v-if="!serverStarting && isModelsSetup"
				class="whitespace-pre-wrap w-full md:max-w-screen-sm lg:max-w-screen-md xl:max-w-screen-lg p-2 pt-2"
			>
				<CardHeader class="pt-0 pb-0">
					<h2 v-if="newHere" class="text-lg text-center underline mb-0 pb-3">
						{{ 'What do we call you?' }}
					</h2>
					<Label
						v-if="newHere"
						class="mb-0 pb-3 text-center flex items-center justify-center"
					>
						Your Name
						<Input
							v-model="userNameValue"
							@blur="updateName"
							class="p-2 border border-gray-300 rounded text-center w-1/2 ml-2"
							placeholder="John"
							@keyup.enter="handleSave"
						/>
					</Label>
				</CardHeader>
				<CardContent class="flex flex-col items-center">
					<Card v-if="!acceptedBuddy" class="mt-2 p-2 w-full">
						<CardContent class="flex flex-col items-center">
							<h2 class="text-lg mb-4 text-center underline">
								{{ buddies.length ? 'Create a Buddy' : 'Create your first Buddy' }}
							</h2>
							<!-- TODO untangle this rats nest of a file -->
							<Avatar v-if="newHere && !acceptedBuddy" size="lg">
								<!-- idea: pre-generate roster of buddy profile pics and swap their avatar pics -->
								<img src="/assets/logo.png" alt="BuddyGen Logo" />
							</Avatar>
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
								<p class="text-sm text-gray-500">
									This affects how {{ buddyName || 'your Buddy' }} talks with you.
								</p>
								<div class="flex w-full items-center gap-1.5">
									<Input
										id="persona-keywords"
										v-model="buddyKeywords"
										class="p-2 border border-gray-300 rounded"
										placeholder="friendly, helpful, funny"
									/>

									<Popover>
										<PopoverTrigger>
											<Button type="button" class="info" title="Create a description">
												<AtomIcon />
											</Button>
										</PopoverTrigger>
										<PopoverContent
											:prioritize-position="true"
											side="left"
											:avoid-collisions="true"
											align="start"
										>
											<Button
												@click="createDescription"
												class="p-2 bg-blue-500 text-white rounded"
											>
												Remix Description
											</Button>
											<p class="mt-4">
												Created Description:
												<br />
												<Spinner v-if="!createdDescription" />
												<span class="text-lg ml-3">{{ createdDescription }}</span>
											</p>

											<!-- accept/cancel buttons -->
											<div class="flex justify-center mt-4">
												<Button
													@click="acceptBuddy('description')"
													class="mr-2 p-2 success text-white rounded"
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
					<Card v-else class="mt-4 p-2 w-full">
						<CardContent>
							<h2 v-if="newHere" class="text-lg mt-4 text-center underline">
								Your first Buddy
							</h2>
							<p class="my-2 text-center">
								<span class="text-lg ml-3">{{ buddyName }}</span>
							</p>
							<div class="flex flex-col items-center">
								<BuddyAvatar
									v-if="acceptedBuddy && newBuddy"
									:persona="newBuddy"
									size="lg"
								/>
								<Label for="profile-picture" class="flex flex-col items-center">
									<span class="text-lg">Appearance</span>
								</Label>
								<div class="flex w-full items-center gap-1.5">
									<Input
										id="profile-picture"
										v-model="profilePicturePrompt"
										class="p-2 border border-gray-300 rounded"
										placeholder="tan suit, sunglasses"
									/>

									<Popover
										:open="keywordsPopover"
										@update:open="keywordsPopover = $event"
									>
										<PopoverTrigger>
											<Button type="button" class="info" title="Suggest keywords">
												<AtomIcon />
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

											<p v-if="createdKeywords" class="my-4">
												<span class="text-sm">AI Suggestion:</span>
												<br />
												<span class="font-bold">{{ createdKeywords }}</span>
											</p>
											<Button
												v-if="createdKeywords"
												class="p-2 success text-white rounded"
												@click="acceptKeywords"
											>
												Accept & Make Picture
											</Button>
										</PopoverContent>
									</Popover>
								</div>
								<Label class="mt-2">
									<span class="text-lg">Picture Quality</span>
									<!-- rename Decent/Good/Best -->
									<select v-model="picQuality">
										<option :value="1">Low</option>
										<option :value="2">Medium</option>
										<option :value="3">High</option>
									</select>
								</Label>
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
						class="mt-4 p-2 bg-blue-500 text-white rounded"
					>
						Save
					</Button>
					<Alert v-if="newHere" class="mt-4 p-2" variant="info">
						<AlertTitle>Tip</AlertTitle>
						<AlertDescription>
							You can make a Custom chat without a Buddy from the sidebar.
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		</div>
	</div>
</template>
