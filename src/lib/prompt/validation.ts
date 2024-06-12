export function isNameValidPrompt(inputStr: string) {
	return `The following is a user's input. Assistant's task is to determine whether the input is name-like and valid. Respond with a valid JSON object containing the key "valid" with a boolean value.

Input: ${inputStr}`;
}

export function isDescriptionValidPrompt(inputStr: string, buddyName: string) {
	return `Assistant is an expert at moderation. The following input is a user's description of a character. Assistant's task is to determine whether the input is valid as in it is not explicit. The task is not to judge the descriptiveness of the content.
Respond with a valid JSON object containing the keys "reasoning" with logical reasoning as a string and "valid" with a boolean value indicating whether all of the content of the description meets moderation standards.

User Input: ${inputStr}`;
}

export function isDescriptionInvalidPrompt(
	inputStr: string,
	buddyName: string
) {
	return `The following input is a user's description of a character. Assistant's task is to determine whether the input contains anything inappropriate for a character or not.
Respond with a valid JSON object containing the keys "reasoning" with logical reasoning as a string and "appropriate" with a boolean value indicating whether the content of the description meets moderation standards.

Input: ${inputStr}`;
}
