/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_IS_ELECTRON: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
