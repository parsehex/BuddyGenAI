export function posPromptFromName(name: string, extra: string) {
	return `profile picture of ${name}, ${extra}, facing the viewer, centered, thin circle frame`;
}
export function negPromptFromName(name: string) {
	// TODO take extra
	return `drawing, disfigured, distorted, thick frame`;
}
