interface Persona {
	id: string;
	created: Date;
	updated?: Date;
	profile_pic?: string;
	profile_pic_prompt?: string;
	profile_pic_use_prompt: boolean;
	profile_pics?: string[];
	appearance_options?: string;
	selected_appearance_options?: string;
	tts_voice?: string;
	current_version_id?: string;
}

interface Image {
	id: string;
	data: string;
	timestamp: Date;
}
interface Audio {
	id: string;
	data: string;
	timestamp: Date;
}

interface ChatThread {
	id: string;
	created: Date;
	name: string;
	persona_id?: string;
	current_persona_version_id?: string;
	persona_mode_use_current?: boolean;
	mode: 'persona' | 'custom';
}

interface ChatMessage {
	id: string;
	created: Date;
	updated?: Date;
	role: 'user' | 'assistant' | 'system';
	content: string;
	image?: string;
	tts?: string;
	thread_id: string;
	thread_index: number;
}

interface PersonaVersion {
	id: string;
	persona_id: string;
	version: number;
	created: Date;
	name: string;
	description: string;
}

interface AppSetting {
	name: string;
	value: string;
}

export interface LogEntry {
	id: string;
	timestamp: Date;
	level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
	module: string;
	message: string;
	metadata?: string; // Storing JSON string
}

export interface Game {
	id: string;
	created: Date;
	updated?: Date;
	name: string;
	selected_buddy_id: string;
	premise_description: string;
	game_started: boolean;
}

export interface GameLogEntry {
	id: string;
	game_id: string;
	entry_index: number;
	created: Date;
	type: 'user' | 'buddy' | 'gm';
	content: string;
	choices?: string; // Storing JSON string
	tts?: string;
}

import Dexie from 'dexie';

export const tableNames = [
	'persona',
	'chat_thread',
	'chat_message',
	'persona_version',
	'app_settings',
	'images',
	'audio',
	'logs',
	'game',
	'game_log_entry',
];

class AppDatabase extends Dexie {
	persona!: Dexie.Table<Persona, string>;
	chat_thread!: Dexie.Table<ChatThread, string>;
	chat_message!: Dexie.Table<ChatMessage, string>;
	persona_version!: Dexie.Table<PersonaVersion, string>;
	app_settings!: Dexie.Table<AppSetting, string>;
	images!: Dexie.Table<Image, string>;
	audio!: Dexie.Table<Audio, string>;
	logs!: Dexie.Table<LogEntry, string>;
	game!: Dexie.Table<Game, string>;
	game_log_entry!: Dexie.Table<GameLogEntry, string>;

	constructor() {
		// NOTE don't change name casing here, will clear DB
		super('BuddyGenAI-DB');

		this.version(3).stores({
			persona: 'id, created, updated, current_version_id',
			chat_thread: 'id, created, persona_id, name, current_persona_version_id',
			chat_message: 'id, created, updated, thread_id, thread_index',
			persona_version:
				'id, [persona_id+version], persona_id, name, version, created',
			app_settings: 'name',
			images: 'id, timestamp',
			audio: 'id, timestamp',
			logs: 'id, timestamp, level, module',
			game: 'id, created, updated, selected_buddy_id',
			game_log_entry: 'id, [game_id+entry_index], game_id, created',
		});

		// @ts-ignore
		this.persona.hook('creating', (primKey: string, obj: Persona) => {
			obj.created = obj.created || new Date();
			return obj;
		});

		// @ts-ignore
		this.chat_thread.hook('creating', (primKey: string, obj: ChatThread) => {
			obj.created = obj.created || new Date();
			return obj;
		});

		// @ts-ignore
		this.chat_message.hook('creating', (primKey: string, obj: ChatMessage) => {
			obj.created = obj.created || new Date();
			return obj;
		});

		this.persona_version.hook(
			// @ts-ignore
			'creating',
			(primKey: string, obj: PersonaVersion) => {
				obj.created = obj.created || new Date();
				return obj;
			}
		);

		// @ts-ignore
		this.images.hook('creating', (primKey: string, obj: Image) => {
			obj.timestamp = obj.timestamp || new Date();
			return obj;
		});
		// @ts-ignore
		this.audio.hook('creating', (primKey: string, obj: Audio) => {
			obj.timestamp = obj.timestamp || new Date();
			return obj;
		});

		// @ts-ignore
		this.logs.hook('creating', (primKey: string, obj: LogEntry) => {
			obj.timestamp = obj.timestamp || new Date();
			return obj;
		});

		// @ts-ignore
		this.game.hook('creating', (primKey: string, obj: Game) => {
			obj.created = obj.created || new Date();
			return obj;
		});

		// @ts-ignore
		this.game_log_entry.hook('creating', (primKey: string, obj: GameLogEntry) => {
			obj.created = obj.created || new Date();
			return obj;
		});
	}
}

export const db = new AppDatabase();

export async function clearDatabase() {
	await db.transaction('rw', db.tables, async () => {
		for (const tableName of tableNames) {
			const table = (db as any)[tableName];
			if (table) {
				await table.clear();
				console.log(`Cleared table: ${tableName}`);
			} else {
				console.warn(
					`Table '${tableName}' not found in database schema during clear.`
				);
			}
		}
	});
}
