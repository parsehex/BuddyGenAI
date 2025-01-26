type QueryParams = { [key: string]: any };

interface BaseOperation {
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  conditions?: QueryParams;
}

export interface SelectOperation extends BaseOperation {
  type: 'SELECT';
  fields: string[] | null;
}

export interface InsertOperation extends BaseOperation {
  type: 'INSERT';
  data: QueryParams;
}

export interface UpdateOperation extends BaseOperation {
  type: 'UPDATE';
  data: QueryParams;
}

export interface DeleteOperation extends BaseOperation {
  type: 'DELETE';
}

export type RunOperation = InsertOperation | UpdateOperation | DeleteOperation;

function removeNullUndefined(obj: QueryParams): QueryParams {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== null && value !== undefined)
  );
}

export function select(
  table: string,
  fields: string[] = ['*'],
  conditions: QueryParams = {}
): [SelectOperation, any] {
	const result: SelectOperation = {
    type: 'SELECT',
    table,
    fields: fields.length === 1 && fields[0] === '*' ? null : fields,
    conditions: removeNullUndefined(conditions)
  };
  return [result, null];
}

export function insert(table: string, data: QueryParams): [InsertOperation, any] {
  const result: InsertOperation = {
    type: 'INSERT',
    table,
    data: removeNullUndefined(data)
  };
	return [result, null];
}

export function update(
  table: string,
  data: QueryParams,
  conditions: QueryParams
): [UpdateOperation, any] {
  const result: UpdateOperation = {
    type: 'UPDATE',
    table,
    data: removeNullUndefined(data),
    conditions: removeNullUndefined(conditions)
  };
	return [result, null];
}

export function del(table: string, conditions: QueryParams): [DeleteOperation, any] {
  const result: DeleteOperation = {
    type: 'DELETE',
    table,
    conditions: removeNullUndefined(conditions)
  };
	return [result, null];
}
