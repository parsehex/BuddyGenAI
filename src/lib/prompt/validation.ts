export function isNameValidPrompt(inputStr: string) {
	return `The following is a user's input. Assistant's task is to determine if the input is name-like and valid. Respond with a valid JSON object containing the key "valid" with a boolean value.

Input: ${inputStr}`;
}
