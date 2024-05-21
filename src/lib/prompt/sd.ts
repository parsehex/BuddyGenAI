export function posPromptFromName(name: string, extra: string, gender = '') {
	// NOTE: profile picture ends up from the side
	let prompt = `picture of ${name}`;
	if (gender) prompt += `, ${gender}`;
	if (extra) prompt += `, ${extra}`;
	prompt += `, facing the viewer, centered, thin circle frame`;
	console.log(prompt);
	return prompt;
}
export function negPromptFromName(name: string) {
	// TODO take extra
	// TODO idea: use more aggressive negative when quality set to low
	return `disfigured, distorted, thick frame, floating debris, square, child`;
}

/** Returns prompt for LLM to generate keyword suggestions. */
export function keywordsFromNameAndDescription(
	name: string,
	description: string,
	existingKeywords?: string
) {
	let prompt = `The following is a description of someone named ${name}. Your task is to list visual keywords that would be fitting for ${name} based on their description.
Keywords should be visually descriptive of an individual and be comma-separated. Keywords should NOT be abstract concepts. For example: "brown hair, glasses, smiling".`;
	if (existingKeywords)
		prompt += `\nExisting keywords (do not include):\n${existingKeywords}`;
	prompt += `\n\nInput:\n${description}`;
	console.log(prompt);
	return prompt;
}

/** Returns prompt for LLM to generate gender from name and optional appearance keywords. */
export function genderFromName(name: string, extraPrompt = '') {
	let prompt = `What gender is ${name}? Answer with a single word (e.g. female, male, etc.)`;
	if (extraPrompt) {
		prompt += `\n\nAppearance: ${extraPrompt}`;
	}
	return prompt;
}
