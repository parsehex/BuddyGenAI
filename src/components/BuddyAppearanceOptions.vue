<script setup lang="ts">
import { useCompletion } from 'ai/vue';
import { ref, onMounted, toRefs } from 'vue';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectLabel,
	SelectGroup,
	SelectItem,
	SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Spinner from '@/components/Spinner.vue';
import DevOnly from '@/components/DevOnly.vue';
import { appearanceOptionsFromNameAndDescription } from '../lib/prompt/sd';
import urls from '../lib/api/urls';
import type { BuddyVersionMerged } from '../lib/api/types-db';
import { appearanceToPrompt } from '../lib/prompt/appearance';

const props = defineProps<{
	buddy: BuddyVersionMerged;
	profilePicPrompt: string;
}>();
const { buddy, profilePicPrompt } = toRefs(props);

const emit = defineEmits(['updateProfilePicPrompt', 'refreshProfilePic']);

const { complete } = useCompletion({ api: urls.message.completion() });

interface ExpectedAppearanceOptions {
	[key: string]: string[];
}
interface SelectedAppearanceOptions {
	[key: string]: string;
}
interface AppearanceOptionsLoading {
	[key: string]: boolean;
}

const appearanceOptions = ref({} as ExpectedAppearanceOptions);
const loadingAppearanceOptions = ref({} as AppearanceOptionsLoading);

const newAppearanceOptions = async () => {
	// set all appearance options to loading
	// keys: hair color, hair style, eye color, body type, clothing
	loadingAppearanceOptions.value = {
		'hair color': true,
		'hair style': true,
		'eye color': true,
		'body type': true,
		clothing: true,
	};

	appearanceOptions.value = {
		'hair color': [],
		'hair style': [],
		'eye color': [],
		'body type': [],
		clothing: [],
	};

	// for each one, get the prompt for that option
	for (const key in loadingAppearanceOptions.value) {
		const prompt = appearanceOptionsFromNameAndDescription(
			buddy.value?.name || '',
			buddy.value?.description || '',
			key
		);

		// TODO improve prompt to just use llama 3's natural ability to respond with json instead of passing schema
		const res = await complete(prompt, {
			body: {
				temperature: 0.25,
				// json_schema: getPartialSchema(key),
			},
		});

		if (res) {
			console.log(res);
			const options = JSON.parse(res);
			appearanceOptions.value[key] = options;
		}

		loadingAppearanceOptions.value[key] = false;
	}
};

const selectedAppearanceOptions = ref({} as SelectedAppearanceOptions);

// (disjointed) TODO option(s) to change composition of profile pic (e.g. close up, full body, etc.)
//   also want to specifically set a background color + have option to change it
// (even more disjointed) TODO use function calling to write message but also:
//   - function to get budyy's own appearance to include in context
//	I think we would get a function call as the first thing when user submits a message, one of the function is "reply" which can be called to write a response with no function call
// 		otherwise, we feed whatever other function call's result into the context when getting response

// function to set appearance option
const setAppearanceOption = (key: string, value: string) => {
	selectedAppearanceOptions.value[key] = value;

	console.log(JSON.stringify(selectedAppearanceOptions.value));
	const newPrompt = appearanceToPrompt(selectedAppearanceOptions.value);
	console.log(newPrompt);

	if (!newPrompt) {
		return;
	}

	// profilePicturePrompt.value = newPrompt;
	emit('updateProfilePicPrompt', newPrompt);
};

onMounted(() => {
	newAppearanceOptions();
});
</script>

<template>
	<div class="flex flex-col items-center justify-center w-full">
		<!-- appearance options -->
		<div class="flex flex-col items-center justify-center w-full">
			<Label class="text-lg">Appearance Options</Label>
			<div class="flex items-center justify-center w-full">
				<Button type="button" @click="newAppearanceOptions"> New Options </Button>
			</div>
			<div class="flex flex-row items-center justify-center w-full">
				<!--
					TODO improvements:
					- when an option is selected, we should save that set of options to the buddy for reuse later
						- use saved value as initial value for selects
						- easy way: save whole appearance options json
					- maybe keep New Options btn but add buttons to each category:
						- Refresh: generate new set of options for category
						- More: generate more options for category + save to buddy
					- "blue eyes" leads to clothing likely being blue. "blue-colored eyes" may help a little. Also, specifiying some kind of clothing helps a little (even "casual clothing")
					- checkbox options (e.g. glasses, hat, etc.)
				-->
				<div
					v-for="(options, key) in appearanceOptions"
					:key="key"
					class="flex flex-wrap items-center justify-center w-full my-2"
				>
					<Label class="text-lg">{{ key }}</Label>
					<Spinner v-if="loadingAppearanceOptions[key]" class="ml-2" />
					<!-- @vue-ignore -->
					<Select
						class="my-2"
						@update:model-value="setAppearanceOption(key, $event)"
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectLabel>{{ key }}</SelectLabel>
							<SelectGroup>
								<SelectItem v-for="option in options" :key="option" :value="option">
									{{ option }}
								</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>

		<DevOnly class="w-full">
			<Input
				id="profile-picture"
				v-model="profilePicPrompt"
				@blur="emit('updateProfilePicPrompt', $event.target.value)"
				class="p-2 border border-gray-300 dark:border-gray-700 rounded mt-2"
				@keydown.enter="emit('refreshProfilePic')"
			/>
		</DevOnly>
	</div>
</template>
