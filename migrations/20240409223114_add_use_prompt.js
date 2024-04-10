/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
	// add profile_pic_use_prompt bool to persona table
	knex.schema.table('persona', (table) => {
		table.boolean('profile_pic_use_prompt').notNullable();
	});

	// set profile_pic_use_prompt to true for all existing personas
	knex('persona').update({ profile_pic_use_prompt: true });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
	knex.schema.table('persona', (table) => {
		table.dropColumn('profile_pic_use_prompt');
	});
};
