import getAll from './all.get';
import getOne from './one.get';
import createOne from './one.create';
import updateOne from './one.update';
import removeOne from './one.remove';

import profilePic from './profile-pic';
import version from './version';
import { rpc } from '../rpc';

export default {
	getAll: rpc.getAllBuddies,
	getOne: rpc.getBuddy,
	createOne: rpc.createBuddy,
	updateOne: rpc.updateBuddy,
	removeOne: rpc.removeBuddy,

	profilePic,
	version,
};
