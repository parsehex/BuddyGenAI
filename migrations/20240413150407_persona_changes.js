/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // add persona_mode_use_current to chat_thread table
	// await knex.schema.alterTable('chat_thread', (table) => {

	// });

	// add persona_version table
	// await knex.schema.createTable('persona_version', (table) => {
	// 	table.string('id', 50).primary();
	// 	table.string('persona_id').notNullable();
	// 	table.increments('version').notNullable();
	// 	table.timestamp('created').notNullable();
	// 	table.string('name').notNullable();
	// 	table.string('description').notNullable();
	// 	table.unique(['persona_id', 'version']);
	// });

	// drop name and description from persona table + add current_version_id
	// await knex.schema.alterTable('persona', (table) => {
	// 	table.dropColumn('name');
	// 	table.dropColumn('description');
	// 	table.string(50, 'current_version_id').notNullable();
	// });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
	await knex.schema.alterTable('chat_thread', (table) => {
		table.dropColumn('persona_mode_use_current');
	});

	await knex.schema.dropTable('persona_version');

	await knex.schema.alterTable('persona', (table) => {
		table.string('name').notNullable();
		table.string('description');
	});
};
