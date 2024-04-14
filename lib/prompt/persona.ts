export function promptFromPersonaDescription(name: string, description: string) {
	if (!description) {
		return `The following is a chat between a User and an Assistant dilligantly playing the role of ${name}.`;
	}
	return `The following is a chat between a User and an Assistant playing the role of ${name}. Description of ${name} that Assistant dilligantly follows to its best ability and without hesitation:\n${description}`;
}
