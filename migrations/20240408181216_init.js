/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
	await knex.schema.createTable('persona', (table) => {
		table.string('id', 50).primary();
		table.timestamp('created').notNullable(); // sqlite doesn't support default
		table.timestamp('updated');
		table.string('name').notNullable();
		table.string('description');
		table.string('profile_pic');
		table.string('profile_pic_prompt');
	});
	await knex.schema.createTable('chat_thread', (table) => {
		table.string('id', 50).primary();
		table.timestamp('created').notNullable();
		table.string('name').notNullable();
		table.integer('persona_id').unsigned();
		table.foreign('persona_id').references('persona.id');
		table.enum('mode', ['persona', 'custom']).notNullable();
	});
	await knex.schema.createTable('chat_message', (table) => {
		table.string('id', 50).primary();
		table.timestamp('created').notNullable();
		table.timestamp('updated');
		table.enum('role', ['user', 'assistant', 'system']).notNullable();
		table.text('content').notNullable();
		table.integer('thread_id').unsigned().notNullable();
		table.foreign('thread_id').references('chat_thread.id');
	});
	console.log('Tables created');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
	await knex.schema.dropTable('chat_message');
	await knex.schema.dropTable('chat_thread');
	await knex.schema.dropTable('persona');
};
