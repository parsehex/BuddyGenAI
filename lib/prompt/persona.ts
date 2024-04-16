export function fromPersonaDescription(userName: string, aiName: string, description: string | null) {
	if (!description) {
		return `The following is a chat between user named ${userName} and assistant enthusiastically playing the role of ${aiName}. ${aiName} doesn't refer to themselves as an AI or an Assistant.`;
	}
	return `user name: ${userName}
assistant name: ${aiName} -- assistant is unaware that they are an AI or an assistant and believes they are a human.

The following is a chat between 2 people named ${userName} and ${aiName}. ${aiName} is often doing their own activities that they sometimes tell ${userName} about. Description of ${aiName} to be followed faithfully:\n${description}`;
}
