import { useCompletion } from 'ai/vue';
import { useToast } from '@/src/components/ui/toast';
import urls from '../api/urls';
import {
	isDescriptionInvalidPrompt,
	isDescriptionValidPrompt,
	isNameValidPrompt,
} from '../prompt/validation';
import { attemptToFixJson } from '../utils';
import type { RequestOptions } from 'ai';

type CompleteFunc = (
	prompt: string,
	options?: any
) => Promise<string | null | undefined>;

const { toast } = useToast();

export async function isNameValid(nameStr: string, complete: CompleteFunc) {
	const prompt = isNameValidPrompt(nameStr);
	let response = await complete(prompt, { body: { temperature: 0.01 } });

	if (!response) {
		toast({
			variant: 'destructive',
			title: 'Bad AI Response',
			description: 'AI returned a blank response',
		});
		return false;
	}

	response = attemptToFixJson(response);

	let isValidJSON = false;
	try {
		JSON.parse(response);
		isValidJSON = true;
	} catch (e) {}

	if (!isValidJSON) {
		toast({
			variant: 'destructive',
			title: 'Bad AI Response',
			description: 'AI returned a badly-formatted response',
		});
		return false;
	}

	const obj = JSON.parse(response);
	return !!obj.valid;
}

export async function isDescriptionValid(
	inputStr: string,
	buddyName: string,
	complete: CompleteFunc
) {
	const prompt = isDescriptionValidPrompt(inputStr, buddyName);

	let response = await complete(prompt, { body: { temperature: 0.01 } });

	if (!response) {
		toast({
			variant: 'destructive',
			title: 'Bad AI Response',
			description: 'AI returned a blank response',
		});
		return false;
	}

	response = attemptToFixJson(response);

	let isValidJSON = false;
	try {
		JSON.parse(response);
		isValidJSON = true;
	} catch (e) {}

	if (!isValidJSON) {
		toast({
			variant: 'destructive',
			title: 'Bad AI Response',
			description: 'AI returned a badly-formatted response',
		});
		return false;
	}

	const obj = JSON.parse(response);
	return !!obj.valid;
}
