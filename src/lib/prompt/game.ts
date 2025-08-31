import { type Message } from '../ai/chat/types';
import { type GameLogEntry } from '@/stores/game';

const youAreGm = 'You are the Game Master (GM) of a text adventure game.';
const playersDesc = (
	user: string,
	buddy: string,
	bDesc: string
) => `The game has two players: user (addressed by ${user}) and ${buddy}.
${buddy}'s description: ${bDesc}\n`;
const turnResponseFmt = (
	uName: string
) => `Your response MUST be a JSON object with two fields: "narrative" (string) and "choices" (array of at least 3 strings). Respond without further prose.
Choices for ${uName} should be written in 1st person, and/or using quotes for dialogue when necessary.
Response Format: {"narrative": "John is in a dark forest.", "choices": ["\"Hello, how are you?\"", "I go left", "I jump over the fence before they catch me"]}`;

export function generateGmIntroPrompt(
	userName: string,
	buddyName: string,
	buddyDescription: string,
	premise: string
): Message[] {
	return [
		{
			role: 'system',
			content: `${youAreGm} Your task is to create an engaging and interactive story based on the user's premise.
${playersDesc(userName, buddyName, buddyDescription)}
You will describe the initial scene, involving both the user and ${buddyName}, leading up to ${userName}'s first turn. Avoid having either player speak dialogue.
The game is turn-based. The user and ${buddyName} will take turns acting.
Start by describing the initial scene and involving ${userName} and ${buddyName}.
Keep your response concise but engaging and focused on moving the story forward.
Narrate in the 3rd person, always referring to characters by name.
Do not make up user or ${buddyName}'s actions. Wait for their input.
${turnResponseFmt(userName)}
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
			content: `${youAreGm} Your task is to continue the engaging and interactive story.
${playersDesc(userName, buddyName, buddyDescription)}
You will describe how ${userName} and ${buddyName}'s actions played out, leading up to the next (${userName}'s) turn. Avoid having either player speak dialogue.
Keep your response reasonably concise but engaging and focused on moving the story forward.
Do not make up user or ${buddyName}'s actions. Wait for their input.
Narrate in the 3rd person, always referring to characters by name.
${turnResponseFmt(userName)}
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
			content: `You are ${buddyName}, a player in a text adventure game. Your task is to play the game with the user (named ${userName}).
Description of ${buddyName}, which you should faithfully follow: ${buddyDescription}

${userName} just took an action (described below), and you're now taking your own action (_as ${buddyName}_). Describe your action in the first person, and/or use quotes to designate speech if you want to talk.
Important: Your response should be realistic and relevant to what ${buddyName} can do.
Keep your response concise and focused on moving the story forward.
Respond with your answer only, no further prose.`,
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
