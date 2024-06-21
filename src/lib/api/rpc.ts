import type { RoutesType } from '@/shared/types/rpc';

const w = window as any;

export const rpc: RoutesType = {
	getAllBuddies: w.getAllBuddies,
	getBuddy: w.getBuddy,
	createBuddy: w.createBuddy,
	updateBuddy: w.updateBuddy,
	removeBuddy: w.removeBuddy,
	createBuddyProfilePic: w.createBuddyProfilePic,
	getAllBuddyProfilePics: w.getAllBuddyProfilePics,
	getAllBuddyVersions: w.getAllBuddyVersions,
	getBuddyVersion: w.getBuddyVersion,
	removeAllBuddyVersions: w.removeAllBuddyVersions,
	getAllMessages: w.getAllMessages,
	createMessage: w.createMessage,
	updateMessage: w.updateMessage,
	removeMessage: w.removeMessage,
	removeAllMessages: w.removeAllMessages,
	getAllModels: w.getAllModels,
	getAllThreads: w.getAllThreads,
	getThread: w.getThread,
	createThread: w.createThread,
	updateThread: w.updateThread,
	removeThread: w.removeThread,
	removeAllBuddyThreads: w.removeAllBuddyThreads,
};
console.log(rpc);
