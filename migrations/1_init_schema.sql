CREATE TABLE persona (
	id TEXT PRIMARY KEY,
	created TIMESTAMP NOT NULL,
	updated TIMESTAMP,
	profile_pic TEXT,
	profile_pic_prompt TEXT,
	profile_pic_use_prompt INTEGER NOT NULL CHECK(profile_pic_use_prompt IN (0, 1)),
	current_version_id TEXT,
	FOREIGN KEY(current_version_id) REFERENCES persona_version(id) ON DELETE CASCADE
);

CREATE TABLE chat_thread (
	id TEXT PRIMARY KEY,
	created TIMESTAMP NOT NULL,
	name TEXT NOT NULL,
	persona_id TEXT,
	current_persona_version_id TEXT,
	persona_mode_use_current INTEGER CHECK(persona_mode_use_current IN (0, 1)),
	mode TEXT NOT NULL CHECK(mode IN ('persona', 'custom')),
	FOREIGN KEY(persona_id) REFERENCES persona(id) ON DELETE CASCADE,
	FOREIGN KEY(current_persona_version_id) REFERENCES persona_version(id) ON DELETE CASCADE
);

CREATE TABLE chat_message (
	id TEXT PRIMARY KEY,
	created TIMESTAMP NOT NULL,
	updated TIMESTAMP,
	role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
	content TEXT NOT NULL,
	image TEXT,
	tts TEXT,
	thread_id TEXT NOT NULL,
	thread_index INTEGER NOT NULL,
	FOREIGN KEY(thread_id) REFERENCES chat_thread(id) ON DELETE CASCADE
);

CREATE TABLE persona_version (
	id TEXT PRIMARY KEY,
	persona_id TEXT NOT NULL,
	version INTEGER NOT NULL,
	created TIMESTAMP NOT NULL,
	name TEXT NOT NULL,
	description TEXT NOT NULL,
	UNIQUE(persona_id, version),
	FOREIGN KEY(persona_id) REFERENCES persona(id) ON DELETE CASCADE
);

CREATE TABLE app_settings (
	name TEXT PRIMARY KEY,
	value TEXT NOT NULL
);
