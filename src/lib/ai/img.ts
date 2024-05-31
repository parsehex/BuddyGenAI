import useElectron from '@/composables/useElectron';
import useSD from '@/composables/useSD';
import { verifyFilePath } from './utils';
import type { BuddyVersionMerged } from '../api/types-db';
import { useAppStore } from '@/src/stores/main';
import { useCompletion } from 'ai/vue';
import urls from '../api/urls';
import {
	imgDescriptionFromChat,
	imgPromptFromDescription,
	shouldSendImg,
} from '../prompt/img/chat';
import { attemptToFixJson } from '../utils';
import { useToast } from '@/src/components/ui/toast';

// const store = useAppStore();
// const { toast } = useToast();
// const { complete } = useCompletion({ api: urls.message.completion() });

interface MakePictureOptions {
	absModelPath: string;
	/** e.g. buddy id */
	outputSubDir: string;
	outputFilename?: string;
	posPrompt: string;
	negPrompt: string;
	size?: 512 | 768;
	quality?: 'low' | 'medium' | 'high';
}

const Steps = {
	low: 16,
	medium: 24,
	high: 32,
};

export async function makePicture(options: MakePictureOptions) {
	const electron = useElectron();
	if (!electron.getDataPath) throw new Error('Electron not found');

	const { pathJoin, mkdir, fsUnlink, getDataPath } = electron;

	const sd = useSD();
	if (!sd) throw new Error('useSD not found');

	const {
		absModelPath,
		outputSubDir,
		posPrompt,
		negPrompt,
		size = 512,
		quality = 'medium',
	} = options;

	const modelExists = await verifyFilePath(absModelPath);
	if (!modelExists) throw new Error('Model not found');

	const dataPath = await getDataPath('images/' + outputSubDir);
	await mkdir(dataPath);

	// overwrite existing file
	const filename = options.outputFilename || `${Date.now()}.png`;
	const outputPath = await pathJoin(dataPath, filename);
	const outputExists = await verifyFilePath(outputPath);
	if (outputExists) await fsUnlink(outputPath);

	await sd.runSD({
		model: absModelPath,
		pos: posPrompt,
		output: outputPath,
		neg: negPrompt,
		size,
		steps: Steps[quality],
	});
}

interface HighLevelMakePictureOptions {
	buddy?: BuddyVersionMerged;
	messages: { role: string; content: string }[];
}

// export async function highLevelMakePicture(
// 	options: HighLevelMakePictureOptions
// ) {
// 	// make this function to get the img description and stop there?
// 	// chatbox function would switch image to loading if this function returns a value
// 	// still early return+toast if explicit in here
// 	const chatImages = store.settings.chat_image_enabled;

// 	const chatImagesEnabled =
// 		// @ts-ignore
// 		chatImages && chatImages !== '0.0' && chatImages !== 1;

// 	if (!chatImagesEnabled) return;

// 	const userName = store.settings.user_name;
// 	const assistantName = options.buddy?.name || 'Assistant';

// 	options.messages = options.messages.slice().map((m) => ({
// 		role: m.role === 'user' ? userName : assistantName,
// 		content: m.content,
// 	}));

// 	const last6Messages = options.messages.slice(-6);

// 	let cmd = (await complete(shouldSendImg(userName, assistantName), {
// 		body: {
// 			max_tokens: 512,
// 			temperature: 0.01,
// 			messages: last6Messages,
// 		},
// 	})) as string;

// 	cmd = attemptToFixJson(cmd);

// 	let isValidJSON = false;
// 	try {
// 		JSON.parse(cmd);
// 		isValidJSON = true;
// 	} catch (e) {
// 		isValidJSON = false;
// 	}

// 	let explicit = !isValidJSON && cmd?.includes('explicit');

// 	if (!isValidJSON && !explicit) {
// 		toast({
// 			variant: 'destructive',
// 			title: 'Error',
// 			description: 'AI response error (Invalid JSON)',
// 		});
// 		return;
// 	}
// 	const cmdObj = JSON.parse(cmd);
// 	const buddyAppearance = options.buddy?.profile_pic_prompt || '';

// 	if (cmdObj.description?.length < 25) {
// 		const imgDescPrompt = imgDescriptionFromChat(
// 			userName,
// 			assistantName,
// 			buddyAppearance
// 		);
// 		const res = await complete(imgDescPrompt, {
// 			body: {
// 				max_tokens: 100,
// 				temperature: 0.1,
// 				messages: last6Messages,
// 			},
// 		});
// 		if (res) {
// 			explicit = res?.includes('explicit');
// 			cmdObj.description = res;
// 		}
// 	}

// 	if (explicit) {
// 		toast({
// 			variant: 'destructive',
// 			title: 'Error',
// 			description: 'The requested image was considered explicit',
// 		});
// 		return;
// 	}

// 	// how to set message's image to 'loading'?

// 	let p = (await complete(imgPromptFromDescription(cmdObj.description), {
// 		body: { max_tokens: 125, temperature: 0.1 },
// 	})) as string;
// }
