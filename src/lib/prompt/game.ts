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
The game has two players: user (goes by ${userName}) and ${buddyName}.
${buddyName}'s description: ${buddyDescription}
You will describe the initial scene, involving both the user and ${buddyName}.
The game is turn-based. The user and ${buddyName} will take turns acting.
Start by describing the initial scene and involving ${userName} and ${buddyName}.
Keep your response concise and focused on moving the story forward.
Always narrate in the 3rd person, referring to characters by name.
Do not make up user or ${buddyName}'s actions. Wait for their input.
Your response MUST be a JSON object with two fields: "narrative" (string) and "choices" (array of at least 3 strings).
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
	const lastTurn = gameLog.findLast((v) => v.type !== 'gm');
	if (!lastTurn) throw new Error();
	const lastPlayer = lastTurn.type as 'user' | 'buddy';
	const lastPlayerName = lastPlayer === 'buddy' ? buddyName : userName;
	const nextPlayer = lastPlayer === 'buddy' ? 'user' : 'buddy';
	const nextPlayerName = nextPlayer === 'buddy' ? buddyName : userName;
	const messages: Message[] = [
		{
			role: 'system',
			content: `You are the Game Master (GM) of a text adventure game. Your goal is to continue the engaging and interactive story.
The game has two players: user (goes by ${userName}) and ${buddyName}.
${buddyName}'s description: ${buddyDescription}

You will describe how ${lastPlayerName}'s action played out, leading up to the next (${nextPlayerName}'s) turn.
Keep your response reasonably concise and focused on moving the story forward.
Do not make up user or ${buddyName}'s actions. Wait for their input.
Always narrate in the 3rd person, referring to characters by name.
Your response MUST be a JSON object with two fields: "narrative" (string) and "choices" (array of at least 3 strings).
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
	const messages: Message[] = [
		{
			role: 'system',
			content: `You are ${buddyName}, a player in a text adventure game. Your goal is to play the game with the user (named ${userName}).
Your description: ${buddyDescription}
The Game Master (GM) just described the scene and offered choices.
You need to react to the GM's narrative and choose an action or make a custom action.
Keep your response concise and focused on moving the story forward.
Simply provide your chosen action or custom action.`,
		},
		...(gameLog.map((entry, i, arr) => {
			if (entry.type === 'user') {
				return { role: 'user', content: `${userName}: ${entry.content}` };
			} else if (entry.type === 'buddy') {
				return { role: 'assistant', content: `${buddyName}: ${entry.content}` };
			} else {
				// GM turn
				const isLast = i === arr.length - 1;
				const choicesStr = `\nChoices for ${buddyName}:\n- ${entry.choices?.join(
					'\n- '
				)}`;
				return {
					role: 'assistant',
					content: `${entry.content}${
						isLast && entry.choices?.length ? choicesStr : ''
					}`,
				};
			}
		}) as Message[]),
	];
	return messages;
}
