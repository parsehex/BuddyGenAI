export function posPromptFromName(
	name: string,
	extra: string,
	gender = '',
	animated = false
) {
	// NOTE: profile picture ends up from the side
	let prompt = `picture of ${name}`;
	if (gender) prompt += `, ${gender}`;
	if (extra) prompt += `, ${extra}`;
	prompt += `, facing the viewer, centered, thin circle frame`;
	if (animated) prompt += `, digital art`;
	console.log(prompt);
	return prompt;
}
export function negPromptFromName(name: string) {
	// TODO take extra
	// TODO idea: use more aggressive negative when quality set to low
	return `disfigured, distorted, evil, floating debris, child, kid, children, low quality, square, side-by-side, 2girl`;
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
	return prompt;
}

// maybe break clothing up into top and bottom
const examples = {
	'hair color': ['brown', 'blonde', 'black', 'red'],
	'hair style': ['short', 'long', 'curly'],
	'eye color': ['brown', 'green', 'blue'],
	'body type': ['thin', 'muscular', 'overweight', 'curvy'],
	clothing: ['casual t-shirt', 'sundress', 'sweater', 'gray suit'],
} as Record<string, string[]>;

const notesMap = {
	'hair color': 'Use typical colors',
	'hair style': 'Use typical hair styles',
	'eye color': 'Use typical eye colors for people',
	'body type': '',
	clothing: '',
} as Record<string, string>;
export function appearanceOptionsFromNameAndDescription(
	name: string,
	description: string,
	category: string,
	existingOptions?: string[]
) {
	// TODO have preset categories for ai to choose from
	// hair color, hair style, eyes color, skin color, body type, clothing

	// ideas:
	// category: face shape, facial hair, glasses, hat, skin color

	console.log('category', category);

	const example = examples[category];
	example.sort(() => Math.random() - 0.5);
	const exampleStr = JSON.stringify(example, null, ' ')
		.replace(/[\n\t]/g, '')
		.replace('[ ', '[');
	const existingOptionsStr = JSON.stringify(existingOptions, null, ' ')
		.replace(/[\n\t]/g, '')
		.replace('[ ', '[');

	let prompt = `The following is a name and description of a character. Assistant's task is to generate options for the character's appearance based on the description. Respond with a valid JSON array containing between 5 and 10 strings to represent options that are typical for the specified category. Each option should be simple and visual-based.${
		existingOptions?.length ? ' Respond with new options only.' : ''
	}

Category: ${category}${
		existingOptions?.length ? '\nExisting options: ' + existingOptionsStr : ''
	}
Short example response: ${exampleStr}

Notes:${notesMap[category] ? '\n- ' + notesMap[category] : ''}
- Use the following seed for randomness: ${Math.random()
		.toFixed(10)
		.slice(2, 8)}`;
	prompt += `\n\nName: ${name}`;
	prompt += `\nDescription: ${description}`;
	// console.log(prompt);
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
