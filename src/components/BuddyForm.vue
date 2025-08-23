<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useToast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Spinner from '@/components/Spinner.vue';
import { useAppStore } from '@/stores/main';
import { api } from '@/lib/api';
import BuddyTagsInput from './BuddyTagsInput.vue';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectGroup,
	SelectLabel,
	SelectItem,
} from '@/components/ui/select';
import BuddyAvatar from './BuddyAvatar.vue';
import BuddyAppearanceOptions from './BuddyAppearanceOptions.vue';
import { Progress } from '@/components/ui/progress';
import type { BuddyVersionMerged } from '@/lib/api/types-db';
import BuddyAvatarSelect from '@/src/components/BuddyAvatarSelect.vue';
import type { AppearanceCategory } from '@/lib/ai/appearance-options';
import { getImage } from '@/lib/api/images';
import { genderFromName } from '@/lib/prompt/sd';
import { complete } from '@/lib/ai/complete';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Separator } from './ui/separator';
import { useTTSAI } from '../composables/ai/useTTSAI';

const props = defineProps({
	initialBuddy: {
		type: Object as () => BuddyVersionMerged | null,
		default: null,
	},
	isNewBuddy: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits(['save', 'update:buddy']);

const store = useAppStore();
const ttsAI = useTTSAI();
const { toast } = useToast();

const buddyName = ref(props.initialBuddy?.name || '');
const buddyKeywords = ref(props.initialBuddy?.description || 'friendly, talkative');
const buddyVoice = ref(props.initialBuddy?.tts_voice || '');
const profilePicturePrompt = ref(props.initialBuddy?.profile_pic_prompt || '');
const profilePictureValue = ref(props.initialBuddy?.profile_pic || '');

const generatedAppearanceOptions = ref(
	props.initialBuddy?.appearance_options
		? JSON.parse(props.initialBuddy.appearance_options)
		: ({
			'hair color': [],
			'hair style': [],
			'eye color': [],
			'body type': [],
			'clothing style': [],
		} as Record<AppearanceCategory, string[]>)
);
const selectedAppearanceOptions = ref(
	props.initialBuddy?.selected_appearance_options
		? JSON.parse(props.initialBuddy.selected_appearance_options)
		: ({
			'hair color': '',
			'hair style': '',
			'eye color': '',
			'body type': '',
			'clothing style': '',
		} as Record<AppearanceCategory, string>)
);

const isSaving = ref(false);
const updatingProfilePicture = ref(false);

const buddyKeywordsArr = computed({
	get: () => {
		if (!buddyKeywords.value) return [];
		return buddyKeywords.value.split(',').map((s) => s.trim());
	},
	set: (value: string[]) => {
		buddyKeywords.value = value.join(', ');
	},
});

const ttsEnabled = computed(() => store.settings.selected_provider_tts === 'koboldcpp');
const availVoices = ref(['']);
onMounted(async () => {
	availVoices.value = [...ttsAI.availVoices.value];
	if (!props.initialBuddy?.id) return;
	allProfilePics.value = await api.buddy.profilePic.getAll(props.initialBuddy?.id);
});

const allProfilePics = ref([] as string[]);
watch(() => props.initialBuddy?.profile_pics, async () => {
	if (!props.initialBuddy?.id) return;
	allProfilePics.value = await api.buddy.profilePic.getAll(props.initialBuddy?.id);
});
const handleSelectProfilePic = async (picData: string) => {
	if (!props.initialBuddy?.id) return;
	await api.buddy.updateOne({
		id: props.initialBuddy?.id,
		profile_pic: picData,
	});
	// props.initialBuddy.value = await api.buddy.getOne(id);
	profilePictureValue.value = await getImage(picData);

	store.updateBuddies();
};

const imgProvider = computed(() => store.settings.selected_provider_image === '0' ? '' : store.settings.selected_provider_image);

const gen = ref(false);
const prog = ref(0);
watch(
	() => [store.imgGenerating, store.imgProgress],
	() => {
		gen.value = store.imgGenerating;
		prog.value = store.imgProgress;
	}
);

const handleProfilePicUpload = (event: Event) => {
	const input = event.target as HTMLInputElement;
	if (input.files && input.files[0]) {
		const reader = new FileReader();
		reader.onload = async (e) => {
			if (!props.initialBuddy) return;
			const base64 = e.target?.result as string;
			const res = await api.buddy.profilePic.addOne(props.initialBuddy.id, base64, true);
			const updatedBuddy = await api.buddy.getOne(props.initialBuddy.id);
			if (updatedBuddy) {
				updatedBuddy.profile_pic = await getImage(res.output);
				emit('update:buddy', updatedBuddy);
			}
			updatingProfilePicture.value = false;
		};
		reader.readAsDataURL(input.files[0]);
	}
};

const refreshProfilePicture = async () => {
	if (!props.initialBuddy) {
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

	const appOptStr = JSON.stringify(generatedAppearanceOptions.value);
	const selectedAppOptStr = JSON.stringify(selectedAppearanceOptions.value);
	await api.buddy.updateOne({
		id: props.initialBuddy.id,
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
	if (completion) {
		gender = completion;
	}
	const id = props.initialBuddy.id;
	updatingProfilePicture.value = true;
	const imgData = await api.buddy.profilePic.createOne(
		id,
		2, // Default quality for now, can be made configurable
		gender
	);
	if (!imgData) throw new Error();
	const res = await api.buddy.profilePic.addOne(
		id,
		imgData
	);

	const updatedBuddy = await api.buddy.getOne(id);
	if (updatedBuddy) {
		updatedBuddy.profile_pic = await getImage(res.output);
		emit('update:buddy', updatedBuddy);
	}
	updatingProfilePicture.value = false;
};

const handleSave = async () => {
	isSaving.value = true;
	if (!buddyName.value || !buddyKeywords.value) {
		toast({
			variant: 'destructive',
			description: "Please fill out your Buddy's Name and Characteristics.",
		});
		isSaving.value = false;
		return;
	}

	const appOptStr = JSON.stringify(generatedAppearanceOptions.value);
	const selectedAppOptStr = JSON.stringify(selectedAppearanceOptions.value);

	const buddyData = {
		name: buddyName.value,
		description: buddyKeywords.value,
		tts_voice: buddyVoice.value,
		profile_pic_prompt: profilePicturePrompt.value,
		appearance_options: appOptStr,
		selected_appearance_options: selectedAppOptStr,
	};

	emit('save', buddyData);
	isSaving.value = false;
};

watch(
	() => props.initialBuddy,
	async (newVal) => {
		if (newVal) {
			buddyName.value = newVal.name;
			buddyKeywords.value = newVal.description || '';
			buddyVoice.value = newVal.tts_voice || '';
			profilePicturePrompt.value = newVal.profile_pic_prompt || '';
			profilePictureValue.value = newVal.profile_pic || '';
			generatedAppearanceOptions.value = newVal.appearance_options
				? JSON.parse(newVal.appearance_options)
				: ({
					'hair color': [],
					'hair style': [],
					'eye color': [],
					'body type': [],
					'clothing style': [],
				} as Record<AppearanceCategory, string[]>);
			selectedAppearanceOptions.value = newVal.selected_appearance_options
				? JSON.parse(newVal.selected_appearance_options)
				: ({
					'hair color': '',
					'hair style': '',
					'eye color': '',
					'body type': '',
					'clothing style': '',
				} as Record<AppearanceCategory, string>);
		}
	},
	{ immediate: true }
);

const basicInfoTitle = computed(() => props.isNewBuddy ? (store.buddies.length ? 'Create a Buddy' : 'Create your first Buddy') : `Edit ${buddyName.value || 'Buddy'}`);
const appearanceTitle = computed(() => `Customize ${buddyName.value || 'your buddy'}'s appearance`);
</script>
<template>
	<ScrollArea class="h-screen pb-6">
		<Card class="whitespace-pre-wrap w-full md:max-w-screen-sm lg:max-w-screen-md xl:max-w-screen-lg p-2 pt-2 mt-2">
			<CardContent class="flex flex-col items-center">
				<!-- Basic Info Section -->
				<Card class="mt-2 p-2 w-full">
					<CardContent class="flex flex-col items-center">
						<h2 class="text-2xl text-center font-bold"> {{ basicInfoTitle }} </h2>
						<Input v-model="buddyName" class="my-4 p-2 border border-gray-300 dark:border-gray-700 rounded w-1/2"
							placeholder="Name" />
						<div class="flex flex-col items-center space-x-2 w-full mt-4">
							<Label class="block text-lg text-center font-bold" for="buddy-keywords"> Characteristics / Description
							</Label>
							<p class="text-sm text-gray-300 text-center mb-1"> These affect how {{ buddyName || 'your Buddy' }} talks
								with you. </p>
							<BuddyTagsInput type="create" :buddyName="buddyName" :buddyKeywords="buddyKeywords"
								:updateBuddyKeywords="(keywords: any) => (buddyKeywords = keywords.join(', '))" />
							<!-- TODO voice selector component with preview -->
							<Select v-if="ttsEnabled" v-model="buddyVoice" id="buddy-voice">
								<SelectTrigger :title="buddyVoice">
									<SelectValue :placeholder="`Select a TTS voice for ${buddyName}`" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectLabel>Voices</SelectLabel>
										<SelectItem v-for="voice in availVoices" :key="voice" :value="voice"> {{ voice }} </SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>
				<!-- Appearance Section -->
				<Card class="mt-4 p-2 w-full">
					<CardContent>
						<h2 class="text-lg my-2 text-center"> {{ appearanceTitle }} </h2>
						<div class="flex flex-col items-center">
							<BuddyAvatar v-if="initialBuddy" :buddy="initialBuddy" :no-default="true" size="lg" class="text-3xl" />
							<p class="mb-2 text-sm text-gray-500 select-none" v-if="initialBuddy && profilePicturePrompt"> Image may
								be created using AI - a real person likely isn't depicted. </p>
							<Spinner v-if="updatingProfilePicture" />
							<BuddyAvatarSelect v-if="initialBuddy" :buddy="initialBuddy" :all-profile-pics="allProfilePics"
								@select-profile-pic="handleSelectProfilePic" />
							<Progress v-if="gen" :model-value="prog * 100" />
							<Button v-if="imgProvider" class="mt-2" @click="refreshProfilePicture" variant="secondary"> New Profile
								Picture </Button>
							<Alert v-if="!initialBuddy && imgProvider" variant="info" class="my-2">
								<AlertTitle>Want to generate a profile image?</AlertTitle>
								<AlertDescription> Edit this Buddy after saving and come back here -- the option "Image AI" will be
									available below. </AlertDescription>
							</Alert>
							<Separator class="my-4" />
							<Tabs default-value="manual" class="w-full">
								<TabsList class="flex w-1/2 mx-auto">
									<TabsTrigger value="manual">Manual Image</TabsTrigger>
									<TabsTrigger v-if="initialBuddy && imgProvider" value="ai">Image AI</TabsTrigger>
								</TabsList>
								<TabsContent value="manual">
									<div class="flex flex-col items-center my-2">
										<Input id="profile-pic-upload" type="file" accept="image/*" @change="handleProfilePicUpload"
											class="w-full max-w-xs" />
									</div>
								</TabsContent>
								<TabsContent v-if="initialBuddy && imgProvider" value="ai" class="pt-2 space-y-2 text-center">
									<BuddyAppearanceOptions :buddy="initialBuddy" :profile-pic-prompt="profilePicturePrompt"
										@update-profile-pic-prompt="profilePicturePrompt = $event"
										@refresh-profile-picture="refreshProfilePicture"
										v-model:appearance-options="generatedAppearanceOptions"
										v-model:selected-appearance-options="selectedAppearanceOptions" />
								</TabsContent>
							</Tabs>
						</div>
					</CardContent>
				</Card>
				<Button @click="handleSave" class="mt-4 p-2 rounded"> Save </Button>
				<Spinner v-if="isSaving" />
			</CardContent>
		</Card>
	</ScrollArea>
</template>
