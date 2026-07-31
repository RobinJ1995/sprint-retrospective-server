const {v4: uuid} = require('uuid');
const database = require('../database');

const query = (sql, values) => database().then(pool => pool.query(sql, values));

const toAction = row => ({
	id: row.id,
	retroId: row.retro_id,
	itemId: row.item_id,
	action: row.action,
	timestamp: row.timestamp
});

module.exports = class ActionDao {
	add = ({
			   retroId,
			   itemId,
			   action,
			   timestamp
		   }) => {
		const id = uuid();

		return query(
			`INSERT INTO retro_action (id, retro_id, item_id, action, \`timestamp\`)
			 VALUES (?, ?, ?, ?, ?)`,
			[id, retroId, itemId ?? null, action, timestamp ?? new Date()]).then(() => id);
	}

	get = id => query(
		`SELECT id, retro_id, item_id, action, \`timestamp\`
		 FROM retro_action
		 WHERE id = ?
		 LIMIT 1`,
		[id]).then(rows => rows.length ? toAction(rows[0]) : null);

	getForRetro = retroId => query(
		`SELECT id, retro_id, item_id, action, \`timestamp\`
		 FROM retro_action
		 WHERE retro_id = ?
		 ORDER BY seq`,
		[retroId]).then(rows => rows.map(toAction));
};
