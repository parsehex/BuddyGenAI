<script setup lang="ts">
import { useCompletion } from 'ai/vue';
import { useToast } from '@/components/ui/toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Spinner from '@/components/Spinner.vue';
import LocalModelSettingsCard from '@/components/LocalModelSettingsCard.vue';
import useLlamaCpp from '@/composables/useLlamaCpp';
import type { PersonaVersionMerged } from '@/lib/api/types-db';
import api from '@/lib/api/db';
import urls from '@/lib/api/urls';
import { useAppStore } from '@/stores/main';

const { toast } = useToast();
const { complete } = useCompletion({ api: urls.message.completion() });
const {
	chatServerRunning,
	chatModels,
	imageModels,
	personas,
	settings,
	threads,
	updateModels,
	updatePersonas,
	updateSettings,
	updateThreads,
	getChatModelPath,
} = useAppStore();

// @ts-ignore
const { startServer, stopServer, isServerRunning } = useLlamaCpp();

await updatePersonas();
await updateThreads();

const userNameValue = ref('');
const personaName = ref('');
const personaKeywords = ref('');
const createdDescription = ref('');
const profilePicturePrompt = ref('');

const acceptedPersona = ref('' as '' | 'description' | 'keywords');
const newPersona = ref(null as PersonaVersionMerged | null);
const updatingProfilePicture = ref(false);

const relationshipToBuddy = ref('');

// TODO figure out temporary pics
const profilePictureValue = ref('');

const newHere = ref(false);
if (!threads.length || !personas.length) {
	newHere.value = true;
}

await updateSettings();
if (settings.user_name && settings.user_name !== 'User') {
	userNameValue.value = settings.user_name;
	console.log(settings);
}

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
	if (!userNameValue.value) {
		toast({ variant: 'destructive', description: 'Please fill out your name.' });
		return;
	}
	if (!personaName.value || !personaKeywords.value) {
		toast({
			variant: 'destructive',
			description: "Please fill out your partner's Name and Keywords.",
		});
		return;
	}
	if (!newPersona.value) {
		toast({
			variant: 'destructive',
			description: 'Please create a persona first.',
		});
		return;
	}
	const updatedSettings = {
		user_name: userNameValue.value,
	};
	await api.setting.update(updatedSettings);
	await updateSettings();

	const { id, name } = newPersona.value;
	const newThread = await api.thread.createOne({
		name: `Chat with ${name}`,
		mode: 'persona',
		persona_id: id,
	});

	await updateThreads();

	await navigateTo(`/chat/${newThread.id}`);
};

const refreshProfilePicture = async () => {
	if (!newPersona.value) {
		toast({
			variant: 'destructive',
			description: 'Please create a persona first.',
		});
		return;
	}
	if (updatingProfilePicture.value) {
		return;
	}
	await api.persona.updateOne({
		id: newPersona.value.id,
		profile_pic_prompt: profilePicturePrompt.value,
	});
	const id = newPersona.value.id;
	updatingProfilePicture.value = true;
	toast({ variant: 'info', description: 'Generating new profile picture...' });
	const res = await api.persona.profilePic.createOne(id);

	profilePictureValue.value = urls.persona.getProfilePic(res.output);
	updatingProfilePicture.value = false;
};

const createDescription = async () => {
	if (!personaName.value || !personaKeywords.value) {
		toast({
			variant: 'destructive',
			description: 'Please fill out Name and Keywords.',
		});
		return;
	}
	const relationship = relationshipToBuddy.value
		? `${personaName.value}'s relation to ${userNameValue.value}: ${relationshipToBuddy.value}`
		: '';
	const desc = personaKeywords.value;
	const prompt = `The following input is a description of someone named ${personaName.value}. Briefly expand upon the input to provide a succinct description of ${personaName.value} using common language.
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
const acceptedPersonaDesc = ref('');
const acceptPersona = async (
	descriptionOrKeywords: 'description' | 'keywords'
) => {
	let personaDescription = createdDescription.value;
	if (descriptionOrKeywords === 'keywords') {
		personaDescription = personaKeywords.value;
	}
	newPersona.value = await api.persona.createOne({
		name: personaName.value,
		description: personaDescription,
	});

	acceptedPersona.value = descriptionOrKeywords;
	acceptedPersonaDesc.value = personaDescription;
};

const isModelsSetup = ref(false);

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

	const verified = await verifyModelDirectory(directory);
	if (!verified) {
		toast({
			variant: 'destructive',
			description:
				'Invalid model directory (should contain chat and image folders)',
		});
		return;
	}
	settings.local_model_directory = directory;

	await updateModels();
};

const calcIsModelsSetup = computed(() => {
	const hasModelDir = !!settings.local_model_directory;
	const hasChatModel = !!settings.selected_model_chat;
	const hasImageModel = !!settings.selected_model_image;
	return hasModelDir && hasChatModel && hasImageModel;
});

if (settings.local_model_directory) {
	await updateModels();
}
isModelsSetup.value = calcIsModelsSetup.value;

const serverStarting = ref(false);
const handleModelChange = async () => {
	setTimeout(async () => {
		const hasModelDir = !!settings.local_model_directory;
		const hasChatModel = !!settings.selected_model_chat;
		const hasImageModel = !!settings.selected_model_image;
		const isSetup = hasModelDir && hasChatModel && hasImageModel;

		if (isSetup) {
			isModelsSetup.value = true; // hide model setup while waiting
			serverStarting.value = true;
			await startServer(getChatModelPath());
			serverStarting.value = false;
		} else {
			isModelsSetup.value = false;
		}
	}, 10);
};

watch(
	() => settings.local_model_directory,
	async () => {
		await updateModels();
		await handleModelChange();
	}
);

console.log(modelProvider.value);
</script>

<template>
	<!-- TODO remaining FTE -->
	<!-- allow editing description (or something to fix broken generations) -->
	<!-- instructions to acquire models -->

	<div class="container flex flex-col items-center">
		<h1 class="text-xl font-bold mb-2">
			{{ newHere ? 'Welcome to' : '' }}
			<span class="underline">
				<span style="color: #61dafb">BuddyGen</span>
				<span style="color: #111">AI</span>
			</span>
		</h1>

		<div
			v-if="serverStarting"
			class="text-center flex flex-col items-center justify-center"
		>
			<Spinner />
			Getting ready...
		</div>
		<div v-if="!isModelsSetup" class="text-lg text-center w-96 mb-2">
			We need to answer some questions before we can create your first Buddy.
		</div>

		<Card
			v-if="!isModelsSetup"
			class="whitespace-pre-wrap w-full md:w-1/2 p-2 pt-4"
		>
			<CardContent>
				<div class="flex flex-col w-full items-center justify-between gap-1.5 mt-4">
					<h2 class="text-lg text-center underline">
						Where would you like to get models from?
					</h2>
					<ul class="mb-2">
						<li>
							<b>External</b>
							-- like ChatGPT
						</li>
						<li>
							<b>Local</b>
							-- models you've downloaded and use on your computer
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

		<!-- <p class="text-center">
					<code class="font-bold">Models</code> let your Buddies respond to you with words, and they let you create a face for your Buddy.
					<br />
					You'll need to download these models and tell BuddyGen where to find them.
				</p> -->
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
				<Label v-if="newHere" class="text-lg text-center underline mb-0 pb-3">
					What should we call you?
				</Label>
				<Label v-else for="user-name" class="mb-0 pb-3 text-center">
					Your Name
				</Label>
			</CardHeader>
			<CardContent class="flex flex-col items-center">
				<Input
					v-model="userNameValue"
					@blur="updateName"
					id="user-name"
					class="p-2 border border-gray-300 rounded text-center"
					placeholder="John"
					@keyup.enter="handleSave"
				/>
				<!-- make read only once accepted -->
				<Card v-if="!acceptedPersona" class="mt-4 p-2 w-full">
					<CardContent>
						<h2 class="text-lg mt-4 text-center underline">
							{{ personas.length ? 'Create a Buddy' : 'Create your first Buddy' }}
						</h2>
						<!-- TODO untangle this rats nest of a file -->
						<Avatar v-if="newHere && !acceptedPersona" size="lg" class="ml-28">
							<!-- idea: pre-generate roster of buddy profile pics and swap their avatar pics -->
							<img src="/assets/logo.png" alt="BuddyGen Logo" />
						</Avatar>
						<Input
							v-model="personaName"
							class="my-2 p-2 border border-gray-300 rounded"
							placeholder="Name"
						/>
						<div class="flex flex-row items-center space-x-2 w-full mt-4">
							<!-- add tooltip with tips on good values -->
							<Label class="block grow">
								Describe your Buddy in a few words
								<Input
									id="persona-keywords"
									v-model="personaKeywords"
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
							v-if="createdDescription && !acceptedPersona"
							@click="acceptPersona('description')"
							class="mt-4 mr-2 p-2 bg-blue-500 text-white rounded"
						>
							Accept Description
						</Button>
						<Button
							v-if="createdDescription && !acceptedPersona"
							@click="acceptPersona('keywords')"
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
							<span class="text-lg ml-3">{{ personaName }}</span>
						</p>
						<div class="flex flex-col items-center">
							<Avatar size="lg" class="mt-2">
								<AvatarImage :src="profilePictureValue" />
								<AvatarFallback>
									<img src="/assets/logo.png" alt="Default Buddy icon" />
								</AvatarFallback>
							</Avatar>
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
							<span class="text-lg ml-3">{{ acceptedPersonaDesc }}</span>
						</p>
					</CardContent>
				</Card>

				<Button
					v-if="acceptedPersona"
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
</template>

<style lang="scss"></style>
