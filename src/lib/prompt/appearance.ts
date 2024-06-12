import {
	examples,
	notes,
	type AppearanceCategory,
	type SelectedAppearanceOptions,
} from '../ai/appearance-options';

export function appearanceToPrompt(
	appearance: SelectedAppearanceOptions
): string {
	// {hair style} {hair color} hair
	// {eye color}-colored eyes, {body type} body, {clothing} clothing

	const hairColor = appearance['hair color'];
	const hairStyle = appearance['hair style'];
	const eyeColor = appearance['eye color'];
	const bodyType = appearance['body type'];
	const clothing = appearance['clothing style'];

	let hair = '';
	if (hairStyle?.length > 0) {
		hair += hairStyle + ' ';
	}
	if (hairColor?.length > 0) {
		hair += hairColor + ' ';
	}
	if (hair) {
		hair += 'hair';
	}

	let eyes = '';
	if (eyeColor?.length > 0) {
		eyes += eyeColor + '-colored eyes';
	}

	let body = '';
	if (bodyType?.length > 0) {
		body += bodyType + ' body';
	}

	let clothes = '';
	if (clothing?.length > 0) {
		clothes += clothing;
		if (!clothing.includes('cloth')) {
			clothes += ' clothing';
		}
	}

	let prompt = '';
	if (hair) {
		prompt += hair;
	}
	if (eyes) {
		if (prompt) {
			prompt += ', ';
		}
		prompt += eyes;
	}
	if (body) {
		if (prompt) {
			prompt += ', ';
		}
		prompt += body;
	}
	if (clothes) {
		if (prompt) {
			prompt += ', ';
		}
		prompt += clothes;
	}

	return prompt;
}

export function appearanceOptionsFromNameAndDescription(
	name: string,
	description: string,
	category: AppearanceCategory,
	existingOptions?: string[]
) {
	// ideas:
	// category: face shape, facial hair, glasses, hat, skin color

	const example = examples[category];
	example.sort(() => Math.random() - 0.5);
	const exampleStr = JSON.stringify(example, null, ' ')
		.replace(/[\n\t]/g, '')
		.replace('[ ', '[');
	const existingOptionsStr = JSON.stringify(existingOptions, null, ' ')
		.replace(/[\n\t]/g, '')
		.replace('[ ', '[');

	let prompt = `The following is a name and description of a character. Assistant's task is to generate options for the character's appearance based on the description. Respond with a valid JSON array containing between 5 and 10 strings to represent options that are typical for the specified category. Each option should be simple and visually relevant.${
		existingOptions?.length ? ' Respond with new options only.' : ''
	}

Category: ${category}${
		existingOptions?.length ? '\nExisting options: ' + existingOptionsStr : ''
	}
Short example response: ${exampleStr}

Notes:${notes[category] ? '\n- ' + notes[category] : ''}
- Use the following seed for randomness: ${Math.random()
		.toFixed(10)
		.slice(2, 8)}`;
	prompt += `\n\nName: ${name}`;
	prompt += `\nDescription: ${description}`;
	return prompt;
}
