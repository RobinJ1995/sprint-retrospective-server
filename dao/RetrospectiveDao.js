const crypto = require('crypto');
const {v4: uuid} = require('uuid');
const {VOTE_MODES, ACTIONS, SECTIONS, SECTION_COLLECTION_MAP} = require('../constants');
const DuplicateError = require('../error/DuplicateError');
const messagePublisher = require('../message_publisher');
const database = require('../database');

const EMPTY_RETRO = {
	title: null,
	voteMode: VOTE_MODES.UPVOTE,
	good: [],
	bad: [],
	actions: [],
	lastUpdate: null
};

// Which column records that a section has been written to at least once. The
// document store only had a key for a section once something had been pushed
// into it, and the raw endpoint exposes that distinction.
const SECTION_FLAG_COLUMN = Object.freeze({
	[SECTIONS.GOOD]: 'has_good',
	[SECTIONS.BAD]: 'has_bad',
	[SECTIONS.ACTION]: 'has_actions'
});

const query = (sql, values) => database().then(pool => pool.query(sql, values));

const transaction = callback => database()
	.then(pool => pool.getConnection())
	.then(connection => connection.beginTransaction()
		.then(() => callback(connection))
		.then(result => connection.commit().then(() => result))
		.catch(err => connection.rollback()
			.catch(() => {})
			.then(() => {
				throw err;
			}))
		.finally(() => connection.release()));

// An identifier in the shape the document store used to hand out, kept so that
// clients that have come to rely on it keep seeing one.
const objectId = () => crypto.randomBytes(12).toString('hex');

// The write endpoints answer with the result of the write, so it is produced in
// the shape clients have always received.
const writeResult = ({
						 modifiedCount = 0,
						 upsertedId = null,
						 upsertedCount = 0,
						 matchedCount = 0
					 } = {}) => ({
	acknowledged: true,
	modifiedCount,
	upsertedId,
	upsertedCount,
	matchedCount
});

const buildRetro = (retro, itemRows, commentRows) => {
	const commentsByItem = commentRows.reduce((acc, comment) => ({
		...acc,
		[comment.item_id]: [...(acc[comment.item_id] || []), {
			id: comment.id,
			text: comment.text
		}]
	}), {});

	const items = section => itemRows
		.filter(item => item.section === section)
		.map(item => ({
			id: item.id,
			text: item.text,
			up: item.up,
			down: item.down,
			...(item.has_comments ? {comments: commentsByItem[item.id] || []} : {})
		}));

	const section = name => (retro[SECTION_FLAG_COLUMN[name]] ||
		itemRows.some(item => item.section === name)) ?
		{[SECTION_COLLECTION_MAP[name]]: items(name)} :
		{};

	return {
		_id: retro.object_id,
		id: retro.id,
		...(retro.title === null ? {} : {title: retro.title}),
		...(retro.vote_mode === null ? {} : {voteMode: retro.vote_mode}),
		...(retro.access_key === null ? {} : {accessKey: retro.access_key}),
		...section(SECTIONS.GOOD),
		...section(SECTIONS.BAD),
		...section(SECTIONS.ACTION),
		...(retro.last_update === null ? {} : {lastUpdate: retro.last_update})
	};
};

module.exports = class RetrospectiveDao {
	constructor(id) {
		this.id = id;
	}

	_broadcast = (action, item, value = null) => {
		const messageBody = {
			retro: this.id,
			action,
			item,
			value
		};

		return messagePublisher.send(messageBody)
			.catch(() => {});
	}

	_getRetroRaw = () => database().then(pool => Promise.all([
		pool.query(`SELECT id, object_id, title, vote_mode, access_key, last_update,
						   has_good, has_bad, has_actions
					FROM retro
					WHERE id = ?`, [this.id]),
		pool.query(`SELECT id, section, text, up, down, has_comments
					FROM retro_item
					WHERE retro_id = ?
					ORDER BY seq`, [this.id]),
		pool.query(`SELECT c.id, c.item_id, c.text
					FROM retro_item_comment c
					JOIN retro_item i ON i.id = c.item_id
					WHERE i.retro_id = ?
					ORDER BY c.seq`, [this.id])
	])).then(([retros, items, comments]) => retros.length ?
		buildRetro(retros[0], items, comments) :
		null);

	getRetro = () => this._getRetroRaw().then(retro => ({...EMPTY_RETRO, ...retro}));

	_setRetroField = (column, value) => query(
		`INSERT INTO retro (id, object_id, ${column}) VALUES (?, ?, ?)
		 ON DUPLICATE KEY UPDATE ${column} = VALUES(${column})`,
		[this.id, objectId(), value]);

	setTitle = title => this._setRetroField('title', title).then(
		() => this._broadcast(ACTIONS.SET_TITLE, null, title))
		.then(() => this._updateRetroLastUpdateTimestamp());

	setVoteMode = voteMode => this._setRetroField('vote_mode', voteMode).then(
		() => this._broadcast(ACTIONS.SET_VOTE_MODE, null, voteMode))
		.then(() => this._updateRetroLastUpdateTimestamp());

	setAccessKey = accessKey => this._setRetroField('access_key', accessKey).then(
		() => this._broadcast(ACTIONS.SET_ACCESS_KEY, null, null))
		.then(() => this._updateRetroLastUpdateTimestamp());

	// Text is compared byte for byte so that the comparison stays case sensitive
	// and does not ignore trailing whitespace.
	_findDuplicate = (connection, section, text) => connection.query(
		`SELECT 1 FROM retro_item
		 WHERE retro_id = ? AND section = ? AND CAST(text AS BINARY) = CAST(? AS BINARY)
		 LIMIT 1`,
		[this.id, section, text]);

	_addItem = (section, text, id) => transaction(connection =>
		this._findDuplicate(connection, section, text).then(duplicates => {
			if (duplicates.length) {
				throw new DuplicateError('text', text);
			}

			return connection.query(
				`INSERT INTO retro (id, object_id, ${SECTION_FLAG_COLUMN[section]}) VALUES (?, ?, 1)
				 ON DUPLICATE KEY UPDATE ${SECTION_FLAG_COLUMN[section]} = 1`,
				[this.id, objectId()]).then(() => connection.query(
				`INSERT INTO retro_item (id, retro_id, section, text, up, down) VALUES (?, ?, ?, ?, 0, 0)`,
				[id, this.id, section, text]));
		}));

	_updateItem = (section, id, text) => transaction(connection =>
		this._findDuplicate(connection, section, text).then(duplicates => {
			if (duplicates.length) {
				throw new DuplicateError('text', text);
			}

			return connection.query(
				`UPDATE retro_item SET text = ? WHERE retro_id = ? AND section = ? AND id = ?`,
				[text, this.id, section, id]);
		}));

	_deleteItem = (section, id) => query(
		`DELETE FROM retro_item WHERE retro_id = ? AND section = ? AND id = ?`,
		[this.id, section, id]);

	// Votes are counted against whichever item carries the id, without checking
	// that it belongs to the retrospective the request was addressed to.
	_vote = (section, id, column) => query(
		`UPDATE retro_item SET ${column} = ${column} + 1
		 WHERE section = ? AND id = ?
		 ORDER BY seq
		 LIMIT 1`,
		[section, id]);

	addGood = text => {
		const dbItem = {
			id: uuid(),
			text,
			up: 0,
			down: 0
		};

		return this._addItem(SECTIONS.GOOD, text, dbItem.id).then(
			() => this._broadcast(ACTIONS.ADD_GOOD, dbItem.id, dbItem))
			.then(() => this._updateRetroLastUpdateTimestamp());
	};

	updateGood = (id, text) => this._updateItem(SECTIONS.GOOD, id, text).then(
		() => this._broadcast(ACTIONS.UPDATE_GOOD, id, {id, text}))
		.then(() => this._updateRetroLastUpdateTimestamp());

	deleteGood = id => this._deleteItem(SECTIONS.GOOD, id).then(
		() => this._broadcast(ACTIONS.DELETE_GOOD, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	addBad = text => {
		const dbItem = {
			id: uuid(),
			text,
			up: 0,
			down: 0
		};

		// The item that is stored gets an id of its own, which is not the one
		// that is broadcast. Kept as it was.
		return this._addItem(SECTIONS.BAD, text, uuid()).then(
			() => this._broadcast(ACTIONS.ADD_BAD, dbItem.id, dbItem))
			.then(() => this._updateRetroLastUpdateTimestamp());
	};

	updateBad = (id, text) => this._updateItem(SECTIONS.BAD, id, text).then(
		() => this._broadcast(ACTIONS.UPDATE_BAD, id, {id, text}))
		.then(() => this._updateRetroLastUpdateTimestamp());

	deleteBad = id => this._deleteItem(SECTIONS.BAD, id).then(
		() => this._broadcast(ACTIONS.DELETE_BAD, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	addAction = text => {
		const dbItem = {
			id: uuid(),
			text,
			up: 0,
			down: 0
		};

		// As with the bad items, the id that is stored is not the one that is
		// broadcast. Kept as it was.
		return this._addItem(SECTIONS.ACTION, text, uuid()).then(
			() => this._broadcast(ACTIONS.ADD_ACTION, dbItem.id, dbItem))
			.then(() => this._updateRetroLastUpdateTimestamp());
	};

	updateAction = (id, text) => this._updateItem(SECTIONS.ACTION, id, text).then(
		() => this._broadcast(ACTIONS.UPDATE_ACTION, id, {id, text}))
		.then(() => this._updateRetroLastUpdateTimestamp());

	deleteAction = id => this._deleteItem(SECTIONS.ACTION, id).then(
		() => this._broadcast(ACTIONS.DELETE_ACTION, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	upvoteGood = id => this._vote(SECTIONS.GOOD, id, 'up').then(
		() => this._broadcast(ACTIONS.UPVOTE_GOOD, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	downvoteGood = id => this._vote(SECTIONS.GOOD, id, 'down').then(
		() => this._broadcast(ACTIONS.DOWNVOTE_GOOD, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	upvoteBad = id => this._vote(SECTIONS.BAD, id, 'up').then(
		() => this._broadcast(ACTIONS.UPVOTE_BAD, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	downvoteBad = id => this._vote(SECTIONS.BAD, id, 'down').then(
		() => this._broadcast(ACTIONS.DOWNVOTE_BAD, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	upvoteAction = id => this._vote(SECTIONS.ACTION, id, 'up').then(
		() => this._broadcast(ACTIONS.UPVOTE_ACTION, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	downvoteAction = id => this._vote(SECTIONS.ACTION, id, 'down').then(
		() => this._broadcast(ACTIONS.DOWNVOTE_ACTION, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	addComment = (section, itemId, commentText) => {
		const commentId = uuid();

		return transaction(connection => connection.query(
			`SELECT id FROM retro_item
			 WHERE retro_id = ? AND section = ? AND id = ?
			 ORDER BY seq
			 LIMIT 1`,
			[this.id, section, itemId]).then(items => {
			if (!items.length) {
				return null;
			}

			return connection.query(
				`INSERT INTO retro_item_comment (id, item_id, text) VALUES (?, ?, ?)`,
				[commentId, items[0].id, commentText]).then(() => connection.query(
				`UPDATE retro_item SET has_comments = 1 WHERE id = ?`,
				[items[0].id]));
		})).then(
			() => this._broadcast(ACTIONS.ADD_COMMENT, commentId, {id: commentId, text: commentText}))
			.then(() => this._updateRetroLastUpdateTimestamp());
	}

	// Comments are addressed by their own id within a section, so the item that
	// carries them has to be looked up first.
	_findCommentItem = (connection, section, commentId) => connection.query(
		`SELECT i.id FROM retro_item i
		 JOIN retro_item_comment c ON c.item_id = i.id
		 WHERE i.retro_id = ? AND i.section = ? AND c.id = ?
		 ORDER BY i.seq
		 LIMIT 1`,
		[this.id, section, commentId]);

	updateComment = (section, commentId, commentText) => transaction(connection =>
		this._findCommentItem(connection, section, commentId).then(items => items.length ?
			connection.query(
				`UPDATE retro_item_comment SET text = ? WHERE item_id = ? AND id = ?`,
				[commentText, items[0].id, commentId]) :
			null)).then(
		() => this._broadcast(ACTIONS.UPDATE_COMMENT, commentId, {id: commentId, text: commentText}))
		.then(() => this._updateRetroLastUpdateTimestamp());

	deleteComment = (section, commentId) => transaction(connection =>
		this._findCommentItem(connection, section, commentId).then(items => items.length ?
			connection.query(
				`DELETE FROM retro_item_comment WHERE item_id = ? AND id = ?`,
				[items[0].id, commentId]) :
			null)).then(
		() => this._broadcast(ACTIONS.DELETE_COMMENT, commentId))
		.then(() => this._updateRetroLastUpdateTimestamp());

	_updateRetroLastUpdateTimestamp = () => {
		const id = objectId();

		return query(
			`INSERT INTO retro (id, object_id, last_update) VALUES (?, ?, ?)
			 ON DUPLICATE KEY UPDATE last_update = VALUES(last_update)`,
			[this.id, id, new Date().getTime()])
			.then(result => result.affectedRows === 1 ?
				writeResult({upsertedId: id, upsertedCount: 1}) :
				writeResult({matchedCount: 1, modifiedCount: 1}));
	};
};
