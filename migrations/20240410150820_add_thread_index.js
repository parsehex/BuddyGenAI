/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // add thread_index to chat_message table
	await knex.schema.table('chat_message', (table) => {
		table.integer('thread_index').notNullable();
	});

	// set thread_index to 0 for all existing messages
	await knex('chat_message').update({ thread_index: 0 });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
	await knex.schema.table('chat_message', (table) => {
		table.dropColumn('thread_index');
	});
};
