// import getOne from './one.get';
import createOne from './one.create';
import getAll from './all.get';

export default {
	getAll,
	getOne: (personaId: string) => Promise.resolve(null),
	createOne,
};
