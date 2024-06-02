<script setup lang="ts">
import { useCompletion } from 'ai/vue';
import { ref, onMounted, toRefs, type PropType } from 'vue';
import { RefreshCw, Plus } from 'lucide-vue-next';

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
import { appearanceOptionsFromNameAndDescription } from '../lib/prompt/appearance';
import urls from '../lib/api/urls';
import type { BuddyVersionMerged } from '../lib/api/types-db';
import { appearanceToPrompt } from '../lib/prompt/appearance';
import { attemptToFixJson } from '../lib/utils';
import { useAppStore } from '../stores/main';
import { useToast } from './ui/toast';
import {
	categories,
	type AppearanceCategory,
	type SelectedAppearanceOptions,
} from '../lib/ai/appearance-options';

const store = useAppStore();
const { toast } = useToast();

// const props = defineProps<{
// 	buddy: BuddyVersionMerged;
// 	profilePicPrompt: string;
// 	appearanceOptions?: ExpectedAppearanceOptions;
// }>();
const appearanceOptions =
	defineModel<ExpectedAppearanceOptions>('appearanceOptions');
const selectedAppearanceOptions = defineModel<SelectedAppearanceOptions>(
	'selectedAppearanceOptions'
);

console.log(selectedAppearanceOptions.value);
const props = defineProps({
	buddy: {
		type: Object as PropType<BuddyVersionMerged>,
		required: true,
	},
	profilePicPrompt: {
		type: String,
		required: true,
	},
});
const { buddy, profilePicPrompt } = toRefs(props);

const emit = defineEmits(['updateProfilePicPrompt', 'refreshProfilePic']);

const { complete } = useCompletion({ api: urls.message.completion() });

interface ExpectedAppearanceOptions {
	[key: string]: string[];
}
type AppearanceOptionsLoading = Record<AppearanceCategory, boolean>;

if (!appearanceOptions.value) {
	appearanceOptions.value = {
		'hair color': [],
		'hair style': [],
		'eye color': [],
		'body type': [],
		'clothing style': [],
	};
}
const loadingAppearanceOptions = ref({
	'hair color': false,
	'hair style': false,
	'eye color': false,
	'body type': false,
	'clothing style': false,
} as AppearanceOptionsLoading);

const newAppearanceOptions = async (category?: AppearanceCategory) => {
	if (!store.chatServerRunning) {
		toast({
			variant: 'destructive',
			title: 'Chat is offline',
			description: 'Please start the chat server in the sidebar',
		});
		return;
	}
	const toLoad: AppearanceCategory[] = category ? [category] : categories;

	console.log(appearanceOptions.value?.['body type']);

	const existingOptionValues = {
		'hair color': JSON.parse(
			JSON.stringify(appearanceOptions.value?.['hair color'] || '[]')
		),
		'hair style': JSON.parse(
			JSON.stringify(appearanceOptions.value?.['hair style'] || '[]')
		),
		'eye color': JSON.parse(
			JSON.stringify(appearanceOptions.value?.['eye color'] || '[]')
		),
		'body type': JSON.parse(
			JSON.stringify(appearanceOptions.value?.['body type'] || '[]')
		),
		'clothing style': JSON.parse(
			JSON.stringify(appearanceOptions.value?.['clothing style'] || '[]')
		),
	};

	for (const key of toLoad) {
		loadingAppearanceOptions.value[key] = true;
		if (!appearanceOptions.value) continue;
		appearanceOptions.value[key] = [];
	}

	// for each one, get the prompt for that option
	for (const key of toLoad) {
		// TODO update to take existing options into account
		const existing = existingOptionValues[key];
		console.log(existing);
		const prompt = appearanceOptionsFromNameAndDescription(
			buddy.value?.name || '',
			buddy.value?.description || '',
			key,
			existing
		);

		let res = await complete(prompt, {
			body: {
				max_tokens: 75,
				temperature: 0.25,
			},
		});

		if (res) {
			res = attemptToFixJson(res, 'array');
			console.log(prompt);
			console.log(res);
			const options = JSON.parse(res);
			if (appearanceOptions.value) appearanceOptions.value[key] = options;
		}

		loadingAppearanceOptions.value[key] = false;
	}
};

// (disjointed) TODO option(s) to change composition of profile pic (e.g. close up, full body, etc.)
//   also want to specifically set a background color + have option to change it
// (even more disjointed) TODO use function calling to write message but also:
//   - function to get budyy's own appearance to include in context
//	I think we would get a function call as the first thing when user submits a message, one of the function is "reply" which can be called to write a response with no function call
// 		otherwise, we feed whatever other function call's result into the context when getting response

// function to set appearance option
const setAppearanceOption = (key: AppearanceCategory, value: string) => {
	if (!selectedAppearanceOptions.value) return;

	selectedAppearanceOptions.value[key] = value;

	const newPrompt = appearanceToPrompt(selectedAppearanceOptions.value);

	if (!newPrompt) {
		return;
	}

	// profilePicturePrompt.value = newPrompt;
	emit('updateProfilePicPrompt', newPrompt);
};

onMounted(() => {
	let hasGeneratedOptions = false;
	for (const key of categories) {
		if (!appearanceOptions.value) continue;
		if (appearanceOptions.value[key].length > 0) {
			hasGeneratedOptions = true;
			break;
		}
	}
	if (hasGeneratedOptions) return;

	newAppearanceOptions();
});
</script>

<template>
	<div class="flex flex-col items-center justify-center w-full">
		<div class="flex flex-col items-center justify-center w-full">
			<Label class="text-lg">Appearance Options</Label>
			<div class="flex flex-col items-center justify-center w-full">
				<Button type="button" @click="newAppearanceOptions()" variant="outline">
					Refresh All Options
				</Button>
				<p>
					Please select each option below to describe
					{{ buddy?.name || 'your buddy' }}'s appearance.
				</p>
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
					class="flex flex-col flex-wrap items-center justify-center w-full my-2"
				>
					<Label class="text-lg mr-1">
						{{ key }}
					</Label>
					<div>
						<!-- @vue-ignore -->
						<Select
							class="my-2"
							:default-value="selectedAppearanceOptions[key as AppearanceCategory] || ''"
							@update:model-value="setAppearanceOption(key, $event)"
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectLabel>
									<div class="flex gap-2">
										{{ key }}
										<Button
											type="button"
											size="xs"
											variant="secondary"
											@click="newAppearanceOptions(key as AppearanceCategory)"
											title="Refresh options"
										>
											<RefreshCw />
										</Button>
									</div>
									<Spinner v-if="loadingAppearanceOptions[key as AppearanceCategory]" />
								</SelectLabel>
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
	</div>
</template>
