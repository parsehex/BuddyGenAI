export function shouldSendImg(userName: string, aiName: string) {
	const prompt = `The following is a chat between ${userName} and ${aiName}. The task is to determine whether or not to send an image to ${userName} on behalf of ${aiName}, given the latest message.\nDo not choose to send an image unless prompted by either ${aiName} or ${userName} or by the chat's context.\n\nRespond with a valid JSON object containing the keys "reasoning" with brief reasoning, "send_image" with a boolean, and an optional "description" with a description of the image.\n\nRespond without further prose.`;
	return prompt;
}

export function imgDescriptionFromChat(
	userName: string,
	aiName: string,
	appearance?: string
) {
	let prompt = `The following is a chat between ${userName} and ${aiName}. Given the latest message, Assistant's task is to create a description of a single image involving ${aiName} to send to ${userName}.`;
	if (appearance) {
		prompt += `Incorporate the following description of ${aiName}:\n${appearance}`;
	}
	return (
		prompt.trim() +
		` Respond with a valid JSON object containing the key "description".`
	);
}

export function imgPromptFromDescription(description: string) {
	const prompt = `The following is a description of an image. Assistant's task is to write a relevant keyword-based prompt based on the description. Respond with the prompt in quotes, without further prose.

Description:
${description}

Example prompt for a profile picture:
picture of Olivia, female, long dark brown hair, blue-colored eyes, petite body, casual clothing, facing the viewer, centered, thin circle frame, cartoon, digital art`;
	return prompt;
}
