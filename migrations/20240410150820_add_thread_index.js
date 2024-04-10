/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // add thread_index to chat_message table
	await knex.schema.alterTable('chat_message', (table) => {
		table.integer('thread_index').notNullable();
	});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
	await knex.schema.alterTable('chat_message', (table) => {
		table.dropColumn('thread_index');
	});
};
