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
The game has two players: user/${userName} and ${buddyName}.
${buddyName}'s description: ${buddyDescription}
You will describe the initial scene, involving both the user and ${buddyName}, and offer them choices or ask for their first actions.
The game is turn-based. The user and ${buddyName} will take turns acting.
Start by describing the initial scene and offering the user and ${buddyName} some choices or asking for their first actions.
Keep your responses concise and focused on moving the story forward.
Do not make up user or ${buddyName}'s actions. Wait for their input.
Always provide choices or ask for the next actions at the end of your turn.
Your response MUST be a JSON object with two fields: "narrative" (string) and "choices" (array of strings).
Example: {"narrative": "You are in a dark forest. What do you do?", "choices": ["Go left", "Go right", "Go straight"]}
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
	gameLog: GameLogEntry[],
	lastPlayerAction: string // This could be user or buddy action
): Message[] {
	const messages: Message[] = [
		{
			role: 'system',
			content: `You are the Game Master (GM) of a text adventure game. Your goal is to continue the engaging and interactive story.
The game has two players: user/${userName} and ${buddyName}.
${buddyName}'s description: ${buddyDescription}
You will describe what happens next based on the last player's action (either the user or ${buddyName}).
If the last action was by the user, you will offer new choices or ask for ${buddyName}'s next action.
If the last action was by ${buddyName}, you will offer new choices or ask for ${userName}'s next action.
The game is turn-based.
Keep your responses concise and focused on moving the story forward.
Do not make up user or ${buddyName}'s actions. Wait for their input.
Always provide choices or ask for the next actions at the end of your turn.
Your response MUST be a JSON object with two fields: "narrative" (string) and "choices" (array of strings).
Example: {"narrative": "You are in a dark forest. What do you do?", "choices": ["Go left", "Go right", "Go straight"]}
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
		{
			role: 'user',
			content: lastPlayerAction,
		},
	];
	return messages;
}

export function generateBuddyTurnPrompt(
	userName: string,
	buddyName: string,
	buddyDescription: string,
	gameLog: GameLogEntry[],
	gmNarrative: string
): Message[] {
	const messages: Message[] = [
		{
			role: 'system',
			content: `You are ${buddyName}, a player in a text adventure game. Your goal is to play the game with the user (named ${userName}).
Your description: ${buddyDescription}
The Game Master (GM) just described the scene and offered choices.
You need to react to the GM's narrative and choose an action or make a custom action.
Keep your responses concise and focused on moving the story forward.
Do not make up GM actions.
Always provide your chosen action or custom action at the end of your turn.`,
		},
		...(gameLog.map((entry) => {
			if (entry.type === 'user') {
				return { role: 'user', content: `${userName}: ${entry.content}` };
			} else if (entry.type === 'buddy') {
				return { role: 'assistant', content: `${buddyName}: ${entry.content}` }; // Buddy's previous action is an assistant message to the GM
			} else {
				// GM turn
				return { role: 'assistant', content: entry.content };
			}
		}) as Message[]),
		{
			role: 'assistant', // The GM's last turn is the assistant's message to the buddy
			content: gmNarrative,
		},
	];
	return messages;
}
