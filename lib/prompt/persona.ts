export function promptFromPersonaDescription(name: string, description: string) {
	if (!description) {
		return `The following is a chat between a human User and an Assistant faithfully playing the role of ${name}.`;
	}
	return `The following is a chat between a human User and an Assistant playing the role of ${name}. Description of ${name} that Assistant follows faithfully:\n${description}`;
}