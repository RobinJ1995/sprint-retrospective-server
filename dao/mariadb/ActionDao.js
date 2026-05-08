const {v4: uuid} = require('uuid');
const database = require('../../database');

module.exports = class ActionDao {
	add = ({retroId, itemId, action, timestamp = new Date()}) => {
		const id = uuid();

		return database().then(db => db.execute(
			'INSERT INTO actions (`id`, `retro_id`, `item_id`, `action`, `timestamp`) VALUES (?, ?, ?, ?, ?)',
			[id, retroId, itemId, action, timestamp]
		)).then(() => id);
	}

	get = id => database().then(db => db.execute(
		'SELECT id, retro_id AS retroId, item_id AS itemId, action, timestamp FROM actions WHERE id = ?',
		[id]
	)).then(([rows]) => rows[0] || null)

	getForRetro = retroId => database().then(db => db.execute(
		'SELECT id, retro_id AS retroId, item_id AS itemId, action, timestamp FROM actions WHERE retro_id = ? ORDER BY timestamp ASC',
		[retroId]
	)).then(([rows]) => rows)
};
