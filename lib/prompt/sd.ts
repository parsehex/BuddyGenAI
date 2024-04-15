export function posPromptFromName(name: string) {
	return `picture of ${name}, facing the viewer, centered, thin circle frame`;
}
export function negPromptFromName(name: string) {
	return `drawing, disfigured, distorted, thick frame`;
}
