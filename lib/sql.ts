type QueryParams = { [key: string]: any };

export function select(
	table: string,
	fields: string[] = ['*'],
	conditions: QueryParams = {}
): [string, any[]] {
	const query = `SELECT ${fields.join(', ')} FROM ${table} ${buildWhereClause(
		conditions
	)}`;
	const params = Object.values(conditions);
	return [query, params];
}

export function insert(table: string, data: QueryParams): [string, any[]] {
	const entries = Object.entries(data).filter(
		([key, value]) => value !== undefined
	);
	const fields = entries.map(([key, value]) => key);
	const values = entries.map(([key, value]) => value);
	const placeholders = fields.map((_, i) => `?`);
	const query = `INSERT INTO ${table} (${fields.join(
		', '
	)}) VALUES (${placeholders.join(', ')})`;
	return [query, values];
}

export function update(
	table: string,
	data: QueryParams,
	conditions: QueryParams
): [string, any[]] {
	const setClause = Object.keys(data)
		.map((field, i) => `${field} = ?`)
		.join(', ');
	const whereClause = buildWhereClause(conditions, Object.keys(data).length);
	const query = `UPDATE ${table} SET ${setClause} ${whereClause}`;
	const params = [...Object.values(data), ...Object.values(conditions)];
	return [query, params];
}

export function del(table: string, conditions: QueryParams): [string, any[]] {
	const query = `DELETE FROM ${table} ${buildWhereClause(conditions)}`;
	const params = Object.values(conditions);
	return [query, params];
}

function buildWhereClause(conditions: QueryParams, offset: number = 0): string {
	if (Object.keys(conditions).length === 0) return '';
	const clause = Object.keys(conditions)
		.map((field, i) => `${field} = ?`)
		.join(' AND ');
	return `WHERE ${clause}`;
}
