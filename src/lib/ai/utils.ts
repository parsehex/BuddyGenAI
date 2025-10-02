export function cleanTextForTTS(text: string) {
	// remove phrases enclosed in asterisks
	let cleanedText = text.replace(/\*[^*]*\*/g, '');

	// replace ... with . . .
	cleanedText = cleanedText.replace(/\.{3}/g, '. . .');

	// remove urls
	cleanedText = cleanedText.replace(/https?:\/\/[^\s]+/g, '');

	// TODO remove phrases enclosed in [ brackets ]

	return cleanedText;
}
