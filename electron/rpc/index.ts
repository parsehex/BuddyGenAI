import * as buddy from './buddy';
import { getAllBuddies } from './buddy/get';
import * as message from './message';
import * as model from './model';
import * as thread from './thread';

export const routes = {
	getAllBuddies: getAllBuddies,
	getBuddy: buddy.getBuddy,
	createBuddy: buddy.createBuddy,
	updateBuddy: buddy.updateBuddy,
	removeBuddy: buddy.removeBuddy,
	createBuddyProfilePic: buddy.createBuddyProfilePic,
	getAllBuddyProfilePics: buddy.getAllBuddyProfilePics,
	getAllBuddyVersions: buddy.getAllBuddyVersions,
	getBuddyVersion: buddy.getBuddyVersion,
	removeAllBuddyVersions: buddy.removeAllBuddyVersions,

	getAllMessages: message.getAllMessages,
	createMessage: message.createMessage,
	updateMessage: message.updateMessage,
	removeMessage: message.removeMessage,
	removeAllMessages: message.removeAllMessages,

	getAllModels: model.getAllModels,

	getAllThreads: thread.getAllThreads,
	getThread: thread.getThread,
	createThread: thread.createThread,
	updateThread: thread.updateThread,
	removeThread: thread.removeThread,
	removeAllBuddyThreads: thread.removeAllBuddyThreads,
};

// how can we get this accessible in the renderer? (call this the server)
// - shared types
//   - define api routes as type
//   - server and contextbridge both use routes type
// - server creates handlers from routes
// - server exposes handler to list functions
// - contextbridge gets and exposes functions
