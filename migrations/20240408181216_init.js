/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
	await knex.schema.createTable('persona', (table) => {
		table.string('id', 50).primary();
		table.timestamp('created').notNullable(); // sqlite doesn't support default
		table.timestamp('updated');
		table.string('profile_pic');
		table.string('profile_pic_prompt');
		table.boolean('profile_pic_use_prompt').notNullable();

		table.string('current_version_id').notNullable();
		table.foreign('current_version_id').references('persona_version.id');
	});
	await knex.schema.createTable('chat_thread', (table) => {
		table.string('id', 50).primary();
		table.timestamp('created').notNullable();
		table.string('name').notNullable();

		table.string('persona_id').unsigned();
		table.foreign('persona_id').references('persona.id');
		table.string('current_persona_version_id');
		table.foreign('current_persona_version_id').references('persona_version.id');

		table.boolean('persona_mode_use_current');
		table.enum('mode', ['persona', 'custom']).notNullable();
	});
	await knex.schema.createTable('chat_message', (table) => {
		table.string('id', 50).primary();
		table.timestamp('created').notNullable();
		table.timestamp('updated');
		table.enum('role', ['user', 'assistant', 'system']).notNullable();
		table.text('content').notNullable();

		table.string('thread_id').unsigned().notNullable();
		table.foreign('thread_id').references('chat_thread.id');

		table.integer('thread_index').notNullable();
	});
	await knex.schema.createTable('persona_version', (table) => {
		table.string('id', 50).primary();

		table.string('persona_id').notNullable();
		table.foreign('persona_id').references('persona.id');

		table.integer('version').notNullable();
		table.timestamp('created').notNullable();
		table.string('name').notNullable();
		table.string('description').notNullable();

		table.unique(['persona_id', 'version']);
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
	await knex.schema.dropTable('persona_version');
};
