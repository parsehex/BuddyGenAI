import { rpc } from '../../rpc';
import getAll from './all.get';
import removeAll from './all.remove';
import getCurrent from './current.get';
import getOne from './one.get';

export default {
	getAll: rpc.getAllBuddyVersions,
	removeAll: rpc.removeAllBuddyVersions,
	getCurrent: rpc.getBuddyVersion,
	getOne: rpc.getBuddyVersion,
};
