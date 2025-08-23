<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAppStore } from '@/stores/main';
import { Button } from '@/components/ui/button';
import DevOnly from '@/components/DevOnly.vue';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@vueuse/core';

import { Settings, Cloud, MessageSquare, Image, Volume2, Menu, CircleHelp } from 'lucide-vue-next';

import GeneralOptions from './GeneralOptions.vue';
import ChatAIOptions from './ChatAIOptions.vue';
import ImageAIOptions from './ImageAIOptions.vue';
import AIProviderOptions from './AIProviderOptions/Main.vue';
import { isFeatureAvailable } from '@/src/lib/ai/support';
import ExportDatabaseButton from '../../ExportDatabaseButton.vue';
import ImportDatabaseButton from '../../ImportDatabaseButton.vue';
import { clearDatabase, db, tableNames } from '@/src/lib/db/schema';
import { Separator } from '../../ui/separator';
import VoiceOptions from './VoiceOptions.vue';
import useElectron from '@/src/composables/useElectron';

const { openExternalLink } = useElectron();
const store = useAppStore();
const chatProvider = computed(() => store.settings.selected_provider_chat);
const imageProvider = computed(() => store.settings.selected_provider_image);
const ttsProvider = computed(() => store.settings.selected_provider_tts);
const sttProvider = computed(() => store.settings.selected_provider_stt);

const error = ref('');
const showLabels = useLocalStorage('settings-show-labels', true);

const reloadPage = () => {
	window.location.reload();
};

const resetApp = async () => {
	await clearDatabase();
	window.location.reload();
}
</script>
<template>
	<div class="flex h-screen">
		<Tabs default-value="general" orientation="vertical" class="flex flex-row w-full">
			<TabsList class="flex flex-col h-full bg-gray-300 dark:bg-gray-700 justify-start border-r">
				<Tooltip>
					<TooltipTrigger as-child>
						<Button variant="ghost" @click="showLabels = !showLabels"
							:class="['flex flex-col items-center justify-center p-2 h-auto w-auto py-2', showLabels ? 'min-w-[80px]' : 'min-w-[50px]']">
							<Menu class="h-6 w-6" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="right">Toggle Labels</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger as-child>
						<TabsTrigger value="general" as-child
							:class="['flex flex-col items-center justify-center p-0 h-auto w-auto', showLabels ? 'min-w-[80px]' : 'min-w-[50px]']">
							<Button variant="ghost" class="py-2">
								<Settings class="h-6 w-6" />
								<div v-if="showLabels" class="text-xs mt-1">General</div>
							</Button>
						</TabsTrigger>
					</TooltipTrigger>
					<TooltipContent side="right">General Settings</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger as-child>
						<TabsTrigger value="ai-providers" as-child
							:class="['flex flex-col items-center justify-center p-0 h-auto w-auto', showLabels ? 'min-w-[80px]' : 'min-w-[50px]']">
							<Button variant="ghost" class="py-2">
								<Cloud class="h-6 w-6" />
								<div v-if="showLabels" class="text-xs mt-1">Providers</div>
							</Button>
						</TabsTrigger>
					</TooltipTrigger>
					<TooltipContent side="right">AI Provider Settings</TooltipContent>
				</Tooltip>
				<Tooltip v-if="chatProvider && chatProvider !== '0'">
					<TooltipTrigger as-child>
						<TabsTrigger value="chat-ai" as-child
							:class="['flex flex-col items-center justify-center p-0 h-auto w-auto', showLabels ? 'min-w-[80px]' : 'min-w-[50px]']">
							<Button variant="ghost" class="py-2">
								<MessageSquare class="h-6 w-6" />
								<div v-if="showLabels" class="text-xs mt-1">Chat</div>
							</Button>
						</TabsTrigger>
					</TooltipTrigger>
					<TooltipContent side="right">Chat Settings</TooltipContent>
				</Tooltip>
				<Tooltip v-if="imageProvider && imageProvider !== '0'">
					<TooltipTrigger as-child>
						<TabsTrigger value="image-ai" as-child
							:class="['flex flex-col items-center justify-center p-0 h-auto w-auto', showLabels ? 'min-w-[80px]' : 'min-w-[50px]']">
							<Button variant="ghost" class="py-2">
								<Image class="h-6 w-6" />
								<div v-if="showLabels" class="text-xs mt-1">Image</div>
							</Button>
						</TabsTrigger>
					</TooltipTrigger>
					<TooltipContent side="right">Image Settings</TooltipContent>
				</Tooltip>
				<Tooltip v-if="ttsProvider && ttsProvider !== '0'">
					<TooltipTrigger as-child>
						<TabsTrigger value="voice" as-child
							:class="['flex flex-col items-center justify-center p-0 h-auto w-auto', showLabels ? 'min-w-[80px]' : 'min-w-[50px]']">
							<Button variant="ghost" class="py-2">
								<Volume2 class="h-6 w-6" />
								<div v-if="showLabels" class="text-xs mt-1">Voice</div>
							</Button>
						</TabsTrigger>
					</TooltipTrigger>
					<TooltipContent side="right">Voice Settings</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger as-child>
						<Button variant="ghost" :class="`mt-2 py-4 flex flex-col min-h-[50px]`"
							@click="openExternalLink('https://docs.buddygenai.com')">
							<CircleHelp class="h-6 w-6" />
							<div v-if="showLabels" class="text-xs mt-1">Help</div>
						</Button>
					</TooltipTrigger>
					<TooltipContent side="right">Go to documentation site</TooltipContent>
				</Tooltip>
			</TabsList>
			<ScrollArea class="h-screen pb-12 flex-grow">
				<Alert v-if="error" variant="destructive">
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{{ error }}</AlertDescription>
				</Alert>
				<div class="px-4 py-2">
					<TabsContent value="general">
						<GeneralOptions />
					</TabsContent>
					<TabsContent value="ai-providers">
						<AIProviderOptions />
					</TabsContent>
					<TabsContent v-if="chatProvider && chatProvider !== '0'" value="chat-ai">
						<ChatAIOptions />
					</TabsContent>
					<TabsContent v-if="imageProvider && imageProvider !== '0'" value="image-ai">
						<ImageAIOptions />
					</TabsContent>
					<TabsContent v-if="(ttsProvider && ttsProvider !== '0') || (sttProvider && sttProvider !== '0')"
						value="voice">
						<VoiceOptions />
					</TabsContent>
				</div>
				<Separator />
				<div class="mt-4 flex flex-col items-center">
					<div class="mb-2 flex items-center">
						<Button type="button" @click="reloadPage" class="px-4 py-2 rounded-md" variant="ghost">Reload Page</Button>
						<ExportDatabaseButton />
						<ImportDatabaseButton />
					</div>
					<RouterLink to="/credits">buddyGenAI Credits / Licenses</RouterLink>
					<DevOnly>
						<Button @click="resetApp" type="button" class="px-4 py-2 mt-2 rounded-md" variant="destructive">Reset &
							Close App</Button>
					</DevOnly>
				</div>
			</ScrollArea>
		</Tabs>
	</div>
</template>
<style lang="scss"></style>
