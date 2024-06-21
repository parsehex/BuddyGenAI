import { rpc } from '../rpc';
import getAll from './all.get';
import removeAll from './all.remove';
import createOne from './one.create';
import removeOne from './one.remove';
import updateOne from './one.update';

export default {
	getAll: rpc.getAllMessages,
	removeAll: rpc.removeAllMessages,
	createOne: rpc.createMessage,
	removeOne: rpc.removeMessage,
	updateOne: rpc.updateMessage,
};
