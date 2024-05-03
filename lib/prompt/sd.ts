export function posPromptFromName(name: string, extra: string) {
	// NOTE: profile picture ends up from the side
	let prompt = `picture of ${name}`;
	if (extra) prompt += `, ${extra}`;
	prompt += `, facing the viewer, centered, thin circle frame`;
	console.log(prompt);
	return prompt;
}
export function negPromptFromName(name: string) {
	// TODO take extra
	return `disfigured, distorted, thick frame`;
}

/** Returns prompt for LLM to generate keyword suggestions. */
export function keywordsFromNameAndDescription(
	name: string,
	description: string,
	existingKeywords?: string
) {
	let prompt = `The following is a description of someone named ${name}. Your task is to list visual keywords that would be fitting for ${name} based on their description.
Keywords should be visually descriptive and comma-separated. For example: "brown hair, glasses, smiling".`;
	if (existingKeywords)
		prompt += `\nExisting keywords (do not include):\n${existingKeywords}`;
	prompt += `\n\nInput:\n${description}`;
	console.log(prompt);
	return prompt;
}
