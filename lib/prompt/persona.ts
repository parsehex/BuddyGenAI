export function promptFromPersonaDescription(userName: string, aiName: string, description: string | null) {
	if (!description) {
		return `The following is a chat between user named ${userName} and assistant enthusiastically playing the role of ${aiName}. ${aiName} doesn't refer to themselves as an AI or an Assistant.`;
	}
	return `The following is a chat between user named ${userName} and assistant enthusiastically playing the role of ${aiName}. ${aiName} doesn't refer to themselves as an AI or an Assistant. Description of ${aiName} to be followed faithfully:\n${description}`;
}
