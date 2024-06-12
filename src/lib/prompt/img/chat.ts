export function shouldSendImg(userName: string, aiName: string) {
	const prompt = `The following is a chat between ${userName} and ${aiName}. Given the context of the chat, Assistant's task is to determine whether or not ${aiName} sent or intended to send an image to ${userName}.

Respond with a valid JSON object containing the keys "reasoning" with brief contextual reasoning, a "description" with the description of the image, and "do_send" with a boolean answering whether or not to send the image.\nRespond immediately without further prose.`;
	return prompt;
}

export function imgDescriptionFromChat(
	userName: string,
	aiName: string,
	appearance?: string
) {
	let prompt = `The following is a chat between ${userName} and ${aiName}. Given the most recent message and the surrounding context, the assistant's task is to write the description of a single image involving ${aiName} to send to ${userName}.`;
	if (appearance) {
		prompt += `\nDescription of ${aiName} (retain these details):\n${appearance}`;
	}
	return (
		prompt.trim() +
		`\n\nRespond with a valid JSON object containing a "description" key with a description of the image. Respond without further prose.`
	);
}

export function imgPromptFromDescription(description: string) {
	const prompt = `The following is a description of an image. Assistant's task is to write a relevant keyword-based prompt based on the provided description. The prompt should contain the details from the description. Respond with a single string in quotes. Use the example to understand the format.

Description:
${description}

Example response for a profile picture:
"picture of Olivia posing for a photo, female, long dark brown hair, blue-colored eyes, petite body, casual clothing, facing the viewer, centered, thin circle frame, cartoon, digital art"`;
	console.log(prompt);
	return prompt;
}
