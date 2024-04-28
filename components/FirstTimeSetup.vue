<script setup lang="ts">
import { useCompletion } from 'ai/vue';
import { useToast } from '@/components/ui/toast';
import { useAppStore } from '~/stores/main';
import urls from '~/lib/api/urls';
import type { BuddyVersionMerged } from '~/lib/api/types-db';
import api from '~/lib/api/db';
import PersonaAvatar from './PersonaAvatar.vue';

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

const userNameValue = ref('');
const buddyName = ref('');
const buddyKeywords = ref('');
const createdDescription = ref('');
const profilePicturePrompt = ref('');

const acceptedBuddy = ref('' as '' | 'description' | 'keywords');
const newBuddy = ref(null as BuddyVersionMerged | null);
const updatingProfilePicture = ref(false);

const relationshipToBuddy = ref('');

// TODO figure out temporary pics
const profilePictureValue = ref('');

const acceptedBuddyDesc = ref('');
const acceptBuddy = async (
	descriptionOrKeywords: 'description' | 'keywords'
) => {
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
	toast({ variant: 'info', description: 'Generating new profile picture...' });
	const res = await api.buddy.profilePic.createOne(id);

	profilePictureValue.value = urls.buddy.getProfilePic(res.output);
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
	const relationship = relationshipToBuddy.value
		? `${buddyName.value}'s relation to ${userNameValue.value}: ${relationshipToBuddy.value}`
		: '';
	const desc = buddyKeywords.value;
	const prompt = `The following input is a description of someone named ${buddyName.value}. Briefly expand upon the input to provide a succinct description of ${buddyName.value} using common language.
${relationship}\nInput:\n`;
	let value = '';
	try {
		value = (await complete(prompt + desc, {
			body: { max_tokens: 100, temperature: 0.75 },
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
</script>

<template>
	<div>
		<div class="container flex flex-col items-center">
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
				class="whitespace-pre-wrap w-full md:w-1/2 p-2 pt-4"
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
				class="whitespace-pre-wrap w-full md:w-1/2 p-2 pt-6"
			>
				<CardHeader class="pt-0 pb-0">
					<h2 v-if="newHere" class="text-lg text-center underline mb-0 pb-3">
						What should we call you?
					</h2>
					<Label
						v-if="newHere"
						class="mb-0 pb-3 text-center flex items-center justify-center"
					>
						Your Name
						<Input
							v-model="userNameValue"
							@blur="updateName"
							class="p-2 border border-gray-300 rounded text-center w-2/3 ml-2"
							placeholder="John"
							@keyup.enter="handleSave"
						/>
					</Label>
				</CardHeader>
				<CardContent class="flex flex-col items-center">
					<!-- make read only once accepted -->
					<Card v-if="!acceptedBuddy" class="mt-2 p-2 w-full">
						<CardContent>
							<h2 class="text-lg mt-4 text-center underline">
								{{ buddies.length ? 'Create a Buddy' : 'Create your first Buddy' }}
							</h2>
							<!-- TODO untangle this rats nest of a file -->
							<Avatar v-if="newHere && !acceptedBuddy" size="lg" class="ml-28">
								<!-- idea: pre-generate roster of buddy profile pics and swap their avatar pics -->
								<img src="/assets/logo.png" alt="BuddyGen Logo" />
							</Avatar>
							<Input
								v-model="buddyName"
								class="my-2 p-2 border border-gray-300 rounded"
								placeholder="Name"
							/>
							<div class="flex flex-row items-center space-x-2 w-full mt-4">
								<!-- add tooltip with tips on good values -->
								<Label class="block grow">
									Describe your Buddy in a few words
									<Input
										id="persona-keywords"
										v-model="buddyKeywords"
										class="mt-2 p-2 border border-gray-300 rounded"
										placeholder="friendly, helpful, funny"
										@keyup.enter="createDescription"
									/>
								</Label>

								<Button
									@click="createDescription"
									class="mt-4 p-2 bg-blue-500 text-white rounded"
								>
									Create
								</Button>
							</div>
							<p class="mt-4" v-if="createdDescription">
								Created Description:
								<br />
								<span class="text-lg ml-3">{{ createdDescription }}</span>
							</p>
							<Button
								v-if="createdDescription && !acceptedBuddy"
								@click="acceptBuddy('description')"
								class="mt-4 mr-2 p-2 bg-blue-500 text-white rounded"
							>
								Accept Description
							</Button>
							<Button
								v-if="createdDescription && !acceptedBuddy"
								@click="acceptBuddy('keywords')"
								class="mt-4 p-2 bg-blue-500 text-white rounded"
							>
								Use Keywords
							</Button>
						</CardContent>
					</Card>
					<Card v-else class="mt-4 p-2 w-full">
						<CardContent>
							<h2 class="text-lg mt-4 text-center underline">Your first Buddy</h2>
							<p class="mt-3 text-center">
								<span class="text-lg ml-3">{{ buddyName }}</span>
							</p>
							<div class="flex flex-col items-center">
								<PersonaAvatar
									v-if="acceptedBuddy && newBuddy"
									:persona="newBuddy"
									size="lg"
								/>
								<Label>
									<!-- TODO describe better -->
									<span class="text-lg">Extra keywords for picture</span>
									<Input
										v-model="profilePicturePrompt"
										@keyup.enter="refreshProfilePicture"
										placeholder="tan suit, sunglasses"
									/>
								</Label>
								<Spinner v-if="updatingProfilePicture" class="mt-2" />
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
					<Alert class="mt-4 p-2" variant="info">
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
