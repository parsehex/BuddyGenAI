export type AppearanceCategory =
	| 'hair color'
	| 'hair style'
	| 'eye color'
	| 'body type'
	| 'clothing style';

export type SelectedAppearanceOptions = Record<AppearanceCategory, string>;
export type AppearanceOptions = Record<AppearanceCategory, string[]>;

export const categories: AppearanceCategory[] = [
	'hair color',
	'hair style',
	'eye color',
	'body type',
	'clothing style',
];
export const examples = {
	'hair color': ['brown', 'blonde', 'black', 'red'],
	'hair style': ['short', 'long', 'curly'],
	'eye color': ['brown', 'green', 'blue'],
	'body type': ['thin', 'muscular', 'overweight', 'curvy'],
	'clothing style': ['casual', 'formal', 'hipster'],
} as AppearanceOptions;

export const notes = {
	'hair color': 'Use typical colors',
	'hair style': 'Use typical hair styles',
	'eye color': 'Use typical eye colors for people',
	'body type': '',
	'clothing style': 'Use typical styles/types of clothing',
} as Record<AppearanceCategory, string>;
