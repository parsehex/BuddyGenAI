import createOne from './one.create';
import getAll from './all.get';
import { rpc } from '../../rpc';

export default {
	getAll: rpc.getAllBuddyProfilePics,
	createOne: rpc.createBuddyProfilePic,
};
