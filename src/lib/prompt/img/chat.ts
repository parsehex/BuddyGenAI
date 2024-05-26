export function shouldSendImg(userName: string, aiName: string) {
	const prompt = `The following is a chat between ${userName} and ${aiName}. Assistant's task is to determine whether or not to send an image to ${userName} on behalf of ${aiName}, given the latest message and the surrounding context.\nDo not choose to send an image unless prompted by either ${aiName} or ${userName}.

Respond with a valid JSON object containing the keys "reasoning" with brief reasoning, a "description" with the contextual description of the image, and "do_send" with a boolean.\nRespond immediately without further prose.`;
	return prompt;
}

export function imgDescriptionFromChat(
	userName: string,
	aiName: string,
	appearance?: string
) {
	let prompt = `The following is a chat between ${userName} and ${aiName}. Given the most recent message and the surrounding context, the assistant's task is to write the description of a single image involving ${aiName} to send to ${userName}.`;
	if (appearance) {
		prompt += `\nDescription of ${aiName} to incorporate in prompt:\n${appearance}`;
	}
	return (
		prompt.trim() +
		`\n\nRespond with a valid JSON object containing a "description" key with a description of the image. Respond without further prose.`
	);
}

export function imgPromptFromDescription(description: string) {
	const prompt = `The following is a description of an image. Assistant's task is to write a relevant keyword-based prompt based on the provided description. The prompt should contain many if not all details from the description. Respond with the prompt in quotes, without further prose. Use the example to understand the format.

Description:
${description}

Example prompt for a profile picture:
picture of Olivia posing for a photo, female, long dark brown hair, blue-colored eyes, petite body, casual clothing, facing the viewer, centered, thin circle frame, cartoon, digital art`;
	return prompt;
}
