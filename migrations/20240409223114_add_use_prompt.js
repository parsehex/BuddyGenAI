/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
	// add profile_pic_use_prompt bool to persona table
	// await knex.schema.alterTable('persona', (table) => {

	// });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
	knex.schema.alterTable('persona', (table) => {
		table.dropColumn('profile_pic_use_prompt');
	});
};
