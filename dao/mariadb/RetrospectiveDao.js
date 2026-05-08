const {v4: uuid} = require('uuid');
const {VOTE_MODES, ACTIONS, SECTION_COLLECTION_MAP} = require('../../constants');
const DuplicateError = require('../../error/DuplicateError');
const messagePublisher = require('../../message_publisher');
const database = require('../../database');

const EMPTY_RETRO = {
	title: null,
	voteMode: VOTE_MODES.UPVOTE,
	good: [],
	bad: [],
	actions: [],
	lastUpdate: null
};

const asRetro = retro => ({...EMPTY_RETRO, ...(retro || {})});
const sectionCollection = section => SECTION_COLLECTION_MAP[section];

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

	_getRetroRaw = () => database().then(db => db.execute(
		'SELECT data FROM retros WHERE id = ?',
		[this.id]
	)).then(([rows]) => {
		if (!rows.length) {
			return null;
		}

		return JSON.parse(rows[0].data);
	});

	_upsertRetro = retro => database().then(db => db.execute(
		'INSERT INTO retros (`id`, `data`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `data` = VALUES(`data`)',
		[this.id, JSON.stringify(retro)]
	)).then(([result]) => result);

	getRetro = () => this._getRetroRaw().then(retro => asRetro(retro));

	_updateRetro = mutator => this.getRetro()
		.then(retro => {
			mutator(retro);

			return this._upsertRetro(retro);
		});

	_validateDuplicateItem = (section, text) => this.getRetro().then(retro => {
		if (retro[section].some(item => item.text === text)) {
			throw new DuplicateError('text', text);
		}

		return retro;
	});

	_addSectionItem = (section, action, text) => this._validateDuplicateItem(section, text)
		.then(retro => {
			const dbItem = {
				id: uuid(),
				text,
				up: 0,
				down: 0
			};

			retro[section].push(dbItem);

			return this._upsertRetro(retro)
				.then(() => dbItem);
		})
		.then(dbItem => this._broadcast(action, dbItem.id, dbItem))
		.then(() => this._updateRetroLastUpdateTimestamp());

	_updateSectionItem = (section, action, id, text) => this._validateDuplicateItem(section, text)
		.then(retro => {
			const item = retro[section].find(x => x.id === id);

			if (item) {
				item.text = text;
			}

			return this._upsertRetro(retro);
		})
		.then(() => this._broadcast(action, id, {id, text}))
		.then(() => this._updateRetroLastUpdateTimestamp());

	_deleteSectionItem = (section, action, id) => this.getRetro()
		.then(retro => {
			retro[section] = retro[section].filter(item => item.id !== id);

			return this._upsertRetro(retro);
		})
		.then(() => this._broadcast(action, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	_voteSectionItem = (section, action, id, voteDirection) => this.getRetro()
		.then(retro => {
			const item = retro[section].find(x => x.id === id);

			if (item) {
				item[voteDirection] += 1;
			}

			return this._upsertRetro(retro);
		})
		.then(() => this._broadcast(action, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	setTitle = title => this._updateRetro(retro => {
		retro.title = title;
	}).then(() => this._broadcast(ACTIONS.SET_TITLE, null, title))
		.then(() => this._updateRetroLastUpdateTimestamp());

	setVoteMode = voteMode => this._updateRetro(retro => {
		retro.voteMode = voteMode;
	}).then(() => this._broadcast(ACTIONS.SET_VOTE_MODE, null, voteMode))
		.then(() => this._updateRetroLastUpdateTimestamp());

	setAccessKey = accessKey => this._updateRetro(retro => {
		retro.accessKey = accessKey;
	}).then(() => this._broadcast(ACTIONS.SET_ACCESS_KEY, null, null))
		.then(() => this._updateRetroLastUpdateTimestamp());

	addGood = text => this._addSectionItem('good', ACTIONS.ADD_GOOD, text);

	updateGood = (id, text) => this._updateSectionItem('good', ACTIONS.UPDATE_GOOD, id, text);

	deleteGood = id => this._deleteSectionItem('good', ACTIONS.DELETE_GOOD, id);

	addBad = text => this._addSectionItem('bad', ACTIONS.ADD_BAD, text);

	updateBad = (id, text) => this._updateSectionItem('bad', ACTIONS.UPDATE_BAD, id, text);

	deleteBad = id => this._deleteSectionItem('bad', ACTIONS.DELETE_BAD, id);

	addAction = text => this._addSectionItem('actions', ACTIONS.ADD_ACTION, text);

	updateAction = (id, text) => this._updateSectionItem('actions', ACTIONS.UPDATE_ACTION, id, text);

	deleteAction = id => this._deleteSectionItem('actions', ACTIONS.DELETE_ACTION, id);

	upvoteGood = id => this._voteSectionItem('good', ACTIONS.UPVOTE_GOOD, id, 'up');

	downvoteGood = id => this._voteSectionItem('good', ACTIONS.DOWNVOTE_GOOD, id, 'down');

	upvoteBad = id => this._voteSectionItem('bad', ACTIONS.UPVOTE_BAD, id, 'up');

	downvoteBad = id => this._voteSectionItem('bad', ACTIONS.DOWNVOTE_BAD, id, 'down');

	upvoteAction = id => this._voteSectionItem('actions', ACTIONS.UPVOTE_ACTION, id, 'up');

	downvoteAction = id => this._voteSectionItem('actions', ACTIONS.DOWNVOTE_ACTION, id, 'down');

	addComment = (section, itemId, commentText) => {
		const commentId = uuid();

		return this.getRetro()
			.then(retro => {
				const items = retro[sectionCollection(section)];
				const item = items.find(x => x.id === itemId);

				if (item) {
					item.comments = item.comments || [];
					item.comments.push({
						id: commentId,
						text: commentText
					});
				}

				return this._upsertRetro(retro);
			})
			.then(() => this._broadcast(ACTIONS.ADD_COMMENT, commentId, { id: commentId, text: commentText }))
			.then(() => this._updateRetroLastUpdateTimestamp());
	}

	updateComment = (section, commentId, commentText) => this.getRetro()
		.then(retro => {
			const items = retro[sectionCollection(section)];

			items.forEach(item => {
				if (!item.comments) {
					return;
				}

				item.comments.forEach(comment => {
					if (comment.id === commentId) {
						comment.text = commentText;
					}
				});
			});

			return this._upsertRetro(retro);
		})
		.then(() => this._broadcast(ACTIONS.UPDATE_COMMENT, commentId, { id: commentId, text: commentText }))
		.then(() => this._updateRetroLastUpdateTimestamp());

	deleteComment = (section, commentId) => this.getRetro()
		.then(retro => {
			const items = retro[sectionCollection(section)];

			items.forEach(item => {
				if (!item.comments) {
					return;
				}

				item.comments = item.comments.filter(comment => comment.id !== commentId);
			});

			return this._upsertRetro(retro);
		})
		.then(() => this._broadcast(ACTIONS.DELETE_COMMENT, commentId))
		.then(() => this._updateRetroLastUpdateTimestamp());

	_updateRetroLastUpdateTimestamp = () => this.getRetro()
		.then(retro => {
			retro.lastUpdate = new Date().getTime();

			return this._upsertRetro(retro);
		});
};
