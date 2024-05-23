export const jsonSchema = {
	type: 'object',
	properties: {
		'hair color': {
			type: 'array',
			items: {
				type: 'string',
			},
		},
		'hair style': {
			type: 'array',
			items: {
				type: 'string',
			},
		},
		'eye color': {
			type: 'array',
			items: {
				type: 'string',
			},
		},
		'body type': {
			type: 'array',
			items: {
				type: 'string',
			},
		},
		clothing: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
	},
	required: ['hair color', 'hair style', 'eye color', 'body type', 'clothing'],
} as Record<string, any>;

export function getPartialSchema(key: string) {
	return {
		type: 'object',
		properties: {
			[key]: jsonSchema.properties[key],
		},
		required: [key],
	};
}

interface SelectedAppearanceOptions {
	[key: string]: string;
}

// appearanceToPrompt
export function appearanceToPrompt(
	appearance: SelectedAppearanceOptions
): string {
	// {hair style} {hair color} hair
	// {eye color}-colored eyes, {body type} body, {clothing} clothing

	const hairColor = appearance['hair color'];
	const hairStyle = appearance['hair style'];
	const eyeColor = appearance['eye color'];
	const bodyType = appearance['body type'];
	const clothing = appearance['clothing'];

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
		clothes += clothing + ' clothing';
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
