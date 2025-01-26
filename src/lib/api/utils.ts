import type { ChatMessage } from '@/lib/api/types-db';

export function apiMsgsToOpenai(messages: ChatMessage[]) {
	return messages.map((message) => ({
		id: message.id,
		role: message.role,
		content: message.content,
		image: message.image,
		tts: message.tts,
	}));
}

export function generateCodeVerifier() {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function generateCodeChallenge(verifier: string) {
	const encoder = new TextEncoder();
	const data = encoder.encode(verifier);
	const hash = await crypto.subtle.digest('SHA-256', data);
	return btoa(String.fromCharCode(...new Uint8Array(hash)))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');
}
