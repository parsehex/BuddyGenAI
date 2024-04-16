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
	return `drawing, disfigured, distorted, thick frame`;
}
