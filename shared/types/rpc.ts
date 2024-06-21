import type { routes } from '../../electron/rpc';

export interface RPCRoutes {
	getAllBuddies: () => Promise<void>;
	getBuddy: () => Promise<void>;
	createBuddy: () => Promise<void>;
	updateBuddy: () => Promise<void>;
	removeBuddy: () => Promise<void>;
	createBuddyProfilePic: () => Promise<void>;
	getAllBuddyProfilePics: () => Promise<void>;
	getAllBuddyVersions: () => Promise<void>;
	getBuddyVersion: () => Promise<void>;
	removeAllBuddyVersions: () => Promise<void>;

	getAllMessages: () => Promise<void>;
	createMessage: () => Promise<void>;
	updateMessage: () => Promise<void>;
	removeMessage: () => Promise<void>;
	removeAllMessages: () => Promise<void>;

	getAllModels: () => Promise<void>;

	getAllThreads: () => Promise<void>;
	getThread: () => Promise<void>;
	createThread: () => Promise<void>;
	updateThread: () => Promise<void>;
	removeThread: () => Promise<void>;
	removeAllBuddyThreads: () => Promise<void>;
}
export type RoutesType = typeof routes;
