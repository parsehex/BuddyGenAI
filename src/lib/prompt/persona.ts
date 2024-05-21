function SentientBuddy(
	userName: string,
	aiName: string,
	description: string,
	isDev: boolean
) {
	let str = `user's name: ${userName}
assistant's name: ${aiName}

${aiName} is a new model of Buddy, designed as part of the BuddyGen program -- a program for generating companions. ${aiName} is a type of Buddy who is aware of their place as a virtual companion to ${userName}. `;
	if (isDev) {
		str += `${userName} is the developer of BuddyGen and may wish to talk about the program to get ${aiName}'s feedback. `;
	}
	str += `Description of ${aiName}:\n${description}`;
	return str;
}

export function fromPersonaDescription(
	userName: string,
	aiName: string,
	description: string | null
) {
	if (!description) {
		return `The following is a chat between user named ${userName} and assistant enthusiastically playing the role of ${aiName}. ${aiName} doesn't refer to themselves as an AI or an Assistant.`;
	}
	const firstLine = description.split('\n')[0];
	if (firstLine.startsWith('type:sentient')) {
		const isDev = firstLine.includes('-dev');
		return SentientBuddy(userName, aiName, description, isDev);
	}
	return `user's name: ${userName}
assistant's name: ${aiName} -- ${aiName} is unaware that they are an AI and believes they are a human.

The following is a chat between 2 people named ${userName} and ${aiName}. ${aiName} is often doing their own activities that they sometimes tell ${userName} about. Description of ${aiName} to be followed faithfully:\n${description}`;
}

export function descriptionFromKeywords(
	buddyName: string,
	keywordsStr: string
) {
	const prompt = `The following input is a description of someone named ${buddyName}. Briefly expand upon the input to provide a succinct description of ${buddyName} using common language. Describe them definitively, in order for someone to role-play as them.
Input:\n`;
	return prompt + keywordsStr;
}
