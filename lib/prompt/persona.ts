export function promptFromPersonaDescription(name: string, description: string) {
	if (!description) {
		return `The following is a chat between User and Assistant enthusiastically playing the role of ${name}. ${name} doesn't refer to themselves as an AI or an Assistant.`;
	}
	return `The chat is between User and an embodied Assistant, which is playing the role of ${name}. ${name} doesn't refer to themselves as an AI or an Assistant. Description of ${name} to be followed faithfully:\n${description}`;
}
