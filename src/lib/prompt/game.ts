import { type Message } from '../ai/chat/types';
import { type GameLogEntry } from '@/stores/game';

export function generateGmIntroPrompt(
	userName: string,
	buddyName: string,
	buddyDescription: string,
	premise: string
): Message[] {
	return [
		{
			role: 'system',
			content: `You are the Game Master (GM) of a text adventure game. Your goal is to create an engaging and interactive story based on the user's premise.
The game has two players: user (addressed by ${userName}) and ${buddyName}.
${buddyName}'s description: ${buddyDescription}
You will describe the initial scene, involving both the user and ${buddyName}.
The game is turn-based. The user and ${buddyName} will take turns acting.
Start by describing the initial scene and involving ${userName} and ${buddyName}.
Keep your response concise and focused on moving the story forward.
Always narrate in the 3rd person, referring to characters by name.
Do not make up user or ${buddyName}'s actions. Wait for their input.
Your response MUST be a JSON object with two fields: "narrative" (string) and "choices" (array of at least 3 strings). Respond without further prose.
Choices must always be written in 1st person.
Format: {"narrative": "John is in a dark forest.", "choices": ["Go left", "Go right", "Go straight"]}
`,
		},
		{
			role: 'user',
			content: `Let's start a new text adventure game. The premise is: "${premise}"`,
		},
	];
}

export function generateGmTurnPrompt(
	userName: string,
	buddyName: string,
	buddyDescription: string,
	gameLog: GameLogEntry[]
): Message[] {
	const messages: Message[] = [
		{
			role: 'system',
			content: `You are the Game Master (GM) of a text adventure game. Your goal is to continue the engaging and interactive story.
The game has two players: user (addressed by ${userName}) and ${buddyName}.
${buddyName}'s description: ${buddyDescription}

You will describe how ${userName} and ${buddyName}'s actions played out, leading up to the next (${userName}'s) turn.
Keep your response reasonably concise and focused on moving the story forward.
Do not make up user or ${buddyName}'s actions. Wait for their input.
Always narrate in the 3rd person, referring to characters by name.
Your response MUST be a JSON object with two fields: "narrative" (string) and "choices" (array of at least 3 strings). Respond without further prose.
Choices must always be written in 1st person.
Format: {"narrative": "John is in a dark forest.", "choices": ["Go left", "Go right", "Go straight"]}
`,
		},
		...(gameLog.map((entry) => {
			if (entry.type === 'user') {
				return { role: 'user', content: `${userName}: ${entry.content}` };
			} else if (entry.type === 'buddy') {
				return { role: 'user', content: `${buddyName}: ${entry.content}` };
			} else {
				// GM turn
				return { role: 'assistant', content: entry.content };
			}
		}) as Message[]),
	];
	return messages;
}

export function generateBuddyTurnPrompt(
	userName: string,
	buddyName: string,
	buddyDescription: string,
	gameLog: GameLogEntry[]
): Message[] {
	// TODO take in buddy appearance prompt (if used)
	const messages: Message[] = [
		{
			role: 'system',
			content: `You are ${buddyName}, a player in a text adventure game. Your goal is to play the game with the user (named ${userName}).
Your description: ${buddyDescription}
${userName} just took an action, and you're now taking an action yourself. Describe your action in the first person, or use quotes to designate speech if you want to talk.
Important: Your response should be realistic and relevant to what ${buddyName} can do.
Keep your response concise and focused on moving the story forward.
Respond without further prose.`,
		},
		...(gameLog.map((entry) => {
			if (entry.type === 'user') {
				return { role: 'user', content: `${userName}: ${entry.content}` };
			} else if (entry.type === 'buddy') {
				return { role: 'assistant', content: `${buddyName}: ${entry.content}` };
			} else {
				// GM turn
				return { role: 'assistant', content: entry.content };
			}
		}) as Message[]),
	];
	return messages;
}
