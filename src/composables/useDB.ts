import { db } from '@/lib/db/schema';
import type { RunOperation, SelectOperation } from '../lib/sql';

export default function useDB() {
	async function get(query: SelectOperation, params: any[]) {
		const { type, table, conditions } = query;
		const dbTable = (db as any)[table];

		if (type === 'SELECT') {
			if (conditions && Object.keys(conditions).length > 0) {
				return await dbTable.where(conditions).first();
			}
			return await dbTable.toCollection().first();
		}

		throw new Error(`Unsupported operation for dbGet: ${type}`);
	}

	async function all(query: SelectOperation, params: any[]) {
		const { type, table, conditions } = query;
		const dbTable = (db as any)[table];

		if (type === 'SELECT') {
			if (conditions && Object.keys(conditions).length > 0) {
				return await dbTable.where(conditions).toArray();
			}
			return await dbTable.toArray();
		}

		throw new Error(`Unsupported operation for dbAll: ${type}`);
	}

	async function run(query: RunOperation, params: any[]) {
		const { type, table, conditions } = query;
		const dbTable = (db as any)[table];

		switch (type) {
			case 'INSERT':
				return await dbTable.add(query.data);

			case 'UPDATE':
				if (conditions && Object.keys(conditions).length > 0) {
					return await dbTable.where(conditions).modify(query.data);
				}
				throw new Error('Update requires conditions');

			case 'DELETE':
				if (conditions && Object.keys(conditions).length > 0) {
					return await dbTable.where(conditions).delete();
				}
				throw new Error('Delete requires conditions');

			default:
				throw new Error(`Unsupported operation: ${type}`);
		}
	}

	return {
		run,
		get,
		all,
	};
}