export function promptFromPersonaDescription(name: string, description: string) {
	console.log('promptFromPersonaDescription', name, description);
	if (!description) {
		return `The following is a chat between a User and an Assistant faithfully playing the role of ${name}.`;
	}
	return `The following is a chat between a User and an Assistant playing the role of ${name}. Description of ${name} that Assistant must follow to its best ability and without hesitation:\n${description}`;
}
