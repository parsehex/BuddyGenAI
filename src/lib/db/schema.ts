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

import Dexie from 'dexie';

class AppDatabase extends Dexie {
  persona!: Dexie.Table<Persona, string>;
  chat_thread!: Dexie.Table<ChatThread, string>;
  chat_message!: Dexie.Table<ChatMessage, string>;
  persona_version!: Dexie.Table<PersonaVersion, string>;
  app_settings!: Dexie.Table<AppSetting, string>;
  images!: Dexie.Table<Image, string>;
  audio!: Dexie.Table<Audio, string>;

  constructor() {
    super('BuddyGenAI-DB');

    this.version(2).stores({
      persona: 'id, created, updated, current_version_id',
      chat_thread: 'id, created, persona_id, name, current_persona_version_id',
      chat_message: 'id, created, updated, thread_id, thread_index',
      persona_version: 'id, [persona_id+version], persona_id, name, version, created',
      app_settings: 'name',
      images: 'id, timestamp',
      audio: 'id, timestamp',
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

    // @ts-ignore
    this.persona_version.hook('creating', (primKey: string, obj: PersonaVersion) => {
      obj.created = obj.created || new Date();
      return obj;
    });

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
  }
}

export const db = new AppDatabase();
