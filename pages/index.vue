<script setup lang="ts">
import { useCompletion } from 'ai/vue';
import { useToast } from '~/components/ui/toast';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import type { PersonaVersionMerged } from '~/server/database/types';
import Spinner from '~/components/Spinner.vue';
import uF from '~/lib/api/useFetch';
import $f from '~/lib/api/$fetch';
import urls from '~/lib/api/urls';

const serverStarting = ref(false);

const startServer = async () => {
	serverStarting.value = true;
	await $fetch('/api/llama.cpp/start', { method: 'POST' });
	serverStarting.value = false;
};
const stopServer = async () => {
	await $fetch('/api/llama.cpp/stop', { method: 'POST' });
};
const isServerRunning = async () => {
	return await $fetch('/api/llama.cpp/status', { method: 'GET' });
};

const { toast } = useToast();
const { complete } = useCompletion();

const t = await uF.thread.getAll();
const p = await uF.persona.getAll();
const threads = t.value;
const personas = p.value;

const userNameValue = ref('');
const personaName = ref('');
const personaKeywords = ref('');
const createdDescription = ref('');
const profilePicturePrompt = ref('');

const acceptedPersona = ref(false);
const newPersona = ref(null as PersonaVersionMerged | null);
const updatingProfilePicture = ref(false);

const relationshipToBuddy = ref('');

// TODO figure out temporary pics
const profilePictureValue = ref('');

const newHere = ref(false);
if (!threads.length || !personas.length) {
	newHere.value = true;
}

const settings = await uF.setting.getAll();
if (settings.value.user_name && settings.value.user_name !== 'User') {
	userNameValue.value = settings.value.user_name;
}

const modelProvider = computed({
	get: () => {
		// should be the same for both
		return settings.value.selected_provider_chat;
	},
	set: (value) => {
		settings.value.selected_provider_chat = value;
		settings.value.selected_provider_image = value;
		saveSettings();
	},
});

const handleSave = async () => {
	if (!userNameValue.value) {
		toast({ variant: 'destructive', description: 'Please fill out your name.' });
		return;
	}
	if (!personaName.value || !personaKeywords.value) {
		toast({ variant: 'destructive', description: "Please fill out your partner's Name and Keywords." });
		return;
	}
	if (!newPersona.value) {
		toast({ variant: 'destructive', description: 'Please create a persona first.' });
		return;
	}
	const updatedSettings = {
		user_name: userNameValue.value,
	};
	await $f.setting.update(updatedSettings);
	settings.value = await $f.setting.getAll();

	const { id, name } = newPersona.value;
	const newThread = await $f.thread.create({
		name: `Chat with ${name}`,
		mode: 'persona',
		persona_id: id,
	});

	await navigateTo(`/chat/${newThread.id}`);
};

const refreshProfilePicture = async () => {
	if (!newPersona.value) {
		toast({ variant: 'destructive', description: 'Please create a persona first.' });
		return;
	}
	if (updatingProfilePicture.value) {
		return;
	}
	await $f.persona.update({
		id: newPersona.value.id,
		profile_pic_prompt: profilePicturePrompt.value,
	});
	const id = newPersona.value.id;
	updatingProfilePicture.value = true;
	toast({ variant: 'info', description: 'Generating new profile picture...' });
	await $f.persona.createProfilePic(id);

	// TODO fix other occurrences of hardcoded url
	// profilePictureValue.value = `/api/profile-pic?persona_id=${id}&cache=${cacheVal}`;
	profilePictureValue.value = urls.persona.getProfilePic(id);
	updatingProfilePicture.value = false;
};

const createDescription = async () => {
	if (!personaName.value || !personaKeywords.value) {
		toast({ variant: 'destructive', description: 'Please fill out Name and Keywords.' });
		return;
	}
	const relationship = relationshipToBuddy.value ? `${personaName.value}'s relation to ${userNameValue.value}: ${relationshipToBuddy.value}` : '';
	const desc = personaKeywords.value;
	const prompt = `The following input is a description of someone named ${personaName.value}. Briefly expand upon the input to provide a succinct description of ${personaName.value} using common language.
${relationship}\nInput:\n`;
	let value = await complete(prompt + desc, { body: { max_tokens: 100, temperature: 0.75 } });
	value = value || '';
	value = value.trim();
	if (!value) {
		toast({ variant: 'destructive', description: 'Error remixing description. Please try again.' });
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

const acceptPersona = async (descriptionOrKeywords: 'description' | 'keywords') => {
	let personaDescription = createdDescription.value;
	if (descriptionOrKeywords === 'keywords') {
		personaDescription = personaKeywords.value;
	}
	newPersona.value = await $f.persona.create({
		name: personaName.value,
		description: personaDescription,
	});

	acceptedPersona.value = true;
};

const isModelsSetup = ref(false);

const chatModels = ref([] as string[]);
const imageModels = ref([] as string[]);

const refreshModels = async (useUF = false) => {
	const provider = useUF ? uF : $f;
	let c = await provider.model.get('chat');
	if (Array.isArray(c)) chatModels.value = c;
	else chatModels.value = c.value;

	let i = await provider.model.get('image');
	if (Array.isArray(i)) imageModels.value = i;
	else imageModels.value = i.value;
};

const saveSettings = async () => {
	await $f.setting.update(settings.value);
};

const updateName = async () => {
	if (!userNameValue.value) return;
	if (userNameValue.value === settings.value.user_name) return;
	settings.value.user_name = userNameValue.value;
	await saveSettings();
};

const { pickDirectory, verifyModelDirectory } = useElectron();
const pickModelDirectory = async () => {
	if (!pickDirectory) return console.error('Electron not available');

	const directory = await pickDirectory();
	if (!directory) return;

	const verified = await verifyModelDirectory(directory);
	if (!verified) {
		toast({ variant: 'destructive', description: 'Invalid model directory (should contain chat and image folders)' });
		return;
	}
	settings.value.local_model_directory = directory;

	await saveSettings();
	await refreshModels();
};

const calcIsModelsSetup = () => {
	const hasModelDir = !!settings.value.local_model_directory;
	const hasChatModel = !!settings.value.selected_model_chat;
	const hasImageModel = !!settings.value.selected_model_image;
	return hasModelDir && hasChatModel && hasImageModel;
};

if (settings.value.local_model_directory) {
	await refreshModels();
}
isModelsSetup.value = calcIsModelsSetup();

const handleModelChange = async () => {
	await saveSettings();
	const hasModelDir = !!settings.value.local_model_directory;
	const hasChatModel = !!settings.value.selected_model_chat;
	const hasImageModel = !!settings.value.selected_model_image;
	const isSetup = hasModelDir && hasChatModel && hasImageModel;
	if (isSetup) {
		isModelsSetup.value = true;
		await startServer();
	} else {
		isModelsSetup.value = false;
	}
};

console.log(modelProvider.value);
</script>

<template>
	<!-- TODO remaining FTE -->
	<!-- allow editing description (or something to fix broken generations) -->

	<!-- show settings stuff if nothing is setup -->

	<!-- ui messages/flow -->
	<!-- Hey there, welcome to BuddyGen! Before we get started, you'll need to do some setup. Then we'll create your first Buddy. -->
	<!-- First, what should we call you? -->

	<!-- for the models: -->
	<!-- You'll need to download "models" which make it possible for Buddies to respond to you as well as to give them a face -- these are called "chat" and "image" models.  -->
	<!-- Where should we save the models? -->
	<div class="container flex flex-col items-center">
		<h1 class="text-xl font-bold">
			Welcome to
			<span class="underline"><span style="color: #61dafb">BuddyGen</span> <span style="color: #111">AI</span></span>
		</h1>

		<div v-if="serverStarting" class="text-center flex flex-col items-center justify-center">
			<Spinner />
			Getting ready...
		</div>
		<div v-if="!isModelsSetup" class="text-lg text-center w-96 mb-2"> We need to answer some questions before we can create your first Buddy. </div>
		<!-- Do you want to use a local model or an external model? -->
		<Card v-if="!isModelsSetup" class="whitespace-pre-wrap w-full md:w-1/2 p-2 pt-4">
			<CardContent>
				<!-- <p class="text-center">
					<code class="font-bold">Models</code> let your Buddies respond to you with words, and they let you create a face for your Buddy.
					<br />
					You'll need to download these models and tell BuddyGen where to find them.
				</p> -->
				<!-- option for either external or local provider -->
				<div class="flex flex-col w-full items-center justify-between gap-1.5 mt-4">
					<!-- You can use models from an external provider or use models on your computer. -->
					<!-- ask as a question -->
					<!-- Where would you like to get models from? -->
					<h2 class="text-lg text-center underline">Where would you like to get models from?</h2>
					<ul class="mb-2">
						<li>Your choices:</li>
						<li><b>External</b> -- like ChatGPT</li>
						<li><b>Local</b> -- models you've downloaded and use on your computer</li>
					</ul>
					<Label for="chat-model-provider" class="w-full">
						Model Provider
						<Select v-model="modelProvider" id="chat-model-provider">
							<SelectTrigger>
								<SelectValue placeholder="Select a chat model provider" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel> Model Providers </SelectLabel>
									<SelectItem value="external"> External </SelectItem>
									<SelectItem value="local"> Local </SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</Label>
				</div>
			</CardContent>
		</Card>
		<Card v-if="!isModelsSetup && modelProvider === 'local'" class="whitespace-pre-wrap w-full md:w-1/2 p-2 pt-4">
			<CardHeader class="pt-0 pb-2"> Local Model Setup </CardHeader>
			<CardContent>
				<p class="text-center">
					<code class="font-bold">Models</code> let your Buddies respond to you with words, and they let you create a face for your Buddy.
					<br />
					You'll need to download these models and tell BuddyGen where to find them.
				</p>
				<div class="flex w-full items-center justify-between gap-1.5 mt-4">
					<Label for="local_model_directory" class="w-full">
						Local Model Directory
						<Input
							v-model="settings.local_model_directory"
							type="text"
							id="local_model_directory"
							name="local_model_directory"
							class="w-full border border-gray-300 rounded-md p-2 mt-1"
							disabled
						/>
					</Label>
					<Button @click="pickModelDirectory" class="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md"> Pick Directory </Button>
				</div>

				<div class="mt-4">
					<Label for="chat-model" class="mb-1"> Chat Model </Label>
					<Select v-model="settings.selected_model_chat" @update:model-value="handleModelChange" id="chat-model">
						<SelectTrigger>
							<SelectValue placeholder="Select a chat model" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel> Chat Models </SelectLabel>
								<SelectItem v-for="model in chatModels" :key="model" :value="model"> {{ model }} </SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<div class="mt-4">
					<Label for="image-model" class="mb-1"> Image Model </Label>
					<Select v-model="settings.selected_model_image" @update:model-value="handleModelChange" id="image-model">
						<SelectTrigger>
							<SelectValue placeholder="Select an image model" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectLabel> Image Models </SelectLabel>
								<SelectItem v-for="model in imageModels" :key="model" :value="model"> {{ model }} </SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
			</CardContent>
		</Card>

		<Card v-if="!serverStarting && isModelsSetup" class="whitespace-pre-wrap w-full md:w-1/2 p-2 pt-6">
			<CardHeader v-if="newHere" class="pt-0 pb-2">
				<h2 class="text-lg text-center underline">What should we call you?</h2>
			</CardHeader>
			<CardContent class="flex flex-col items-center">
				<Input v-model="userNameValue" @blur="updateName" class="mt-3 p-2 border border-gray-300 rounded text-center" placeholder="John" @keyup.enter="handleSave" />
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
						<Input v-model="personaName" class="my-2 p-2 border border-gray-300 rounded" placeholder="Name" />
						<div class="flex flex-row items-center space-x-2 w-full">
							<!-- add tooltip with tips on good values -->
							<Label class="block grow">
								Keywords
								<Input
									id="persona-keywords"
									v-model="personaKeywords"
									class="mt-2 p-2 border border-gray-300 rounded"
									placeholder="friendly, helpful, funny"
									@keyup.enter="createDescription"
								/>
							</Label>
							<Label class="block">
								Relationship To Buddy
								<Input v-model="relationshipToBuddy" class="w-40 mt-2 p-2 border border-gray-300 rounded" placeholder="friend" />
							</Label>

							<Button @click="createDescription" class="mt-4 p-2 bg-blue-500 text-white rounded">Create</Button>
						</div>
						<p class="mt-4" v-if="createdDescription">
							Created Description:
							<br />
							<span class="text-lg ml-3">{{ createdDescription }}</span>
						</p>
						<Button v-if="createdDescription && !acceptedPersona" @click="acceptPersona('description')" class="mt-4 mr-2 p-2 bg-blue-500 text-white rounded">Accept Description</Button>
						<Button v-if="createdDescription && !acceptedPersona" @click="acceptPersona('keywords')" class="mt-4 p-2 bg-blue-500 text-white rounded">Use Keywords</Button>
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
								<span class="text-lg"> Extra keywords for picture </span>
								<Input v-model="profilePicturePrompt" placeholder="tan suit, sunglasses" />
							</Label>
							<Spinner v-if="updatingProfilePicture" class="mt-2" />
							<Button @click="refreshProfilePicture" class="mt-4 p-2 bg-blue-500 text-white rounded">New Profile Picture</Button>
						</div>
						<p class="mt-2">
							Description:
							<span class="text-lg ml-3">{{ createdDescription }}</span>
						</p>
					</CardContent>
				</Card>

				<Button v-if="acceptedPersona" @click="handleSave" class="mt-4 p-2 bg-blue-500 text-white rounded">Save</Button>
				<Alert class="mt-4 p-2" variant="info">
					<AlertTitle>Tip</AlertTitle>
					<AlertDescription> You can make a Custom chat without a Buddy from the sidebar. </AlertDescription>
				</Alert>
			</CardContent>
		</Card>
	</div>
</template>

<style lang="scss"></style>
