const {v4: uuid} = require('uuid');
const {VOTE_MODES, ACTIONS, SECTION_COLLECTION_MAP} = require('../constants');
const DuplicateError = require('../error/DuplicateError');
const messagePublisher = require('../message_publisher');
const database = require('../database');

const COLLECTION = 'retro';

const EMPTY_RETRO = {
	title: null,
	voteMode: VOTE_MODES.UPVOTE,
	good: [],
	bad: [],
	actions: [],
	lastUpdate: null
};

const collection = () => database().then(db => db.collection(COLLECTION));

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

	_getRetroRaw = () => collection().then(c => c.findOne({
		id: this.id
	}));

	getRetro = () => this._getRetroRaw().then(retro => ({...EMPTY_RETRO, ...retro}));

	setTitle = title => collection().then(c => c.update({
		id: this.id
	}, {
		'$set': {
			'title': title
		}
	}, {upsert: true})).then(
		() => this._broadcast(ACTIONS.SET_TITLE, null, title))
		.then(() => this._updateRetroLastUpdateTimestamp());

	setVoteMode = voteMode => collection().then(c => c.update({
		id: this.id
	}, {
		'$set': {
			'voteMode': voteMode
		}
	}, {upsert: true})).then(
		() => this._broadcast(ACTIONS.SET_VOTE_MODE, null, voteMode))
		.then(() => this._updateRetroLastUpdateTimestamp());

	setAccessKey = accessKey => collection().then(c => c.update({
		id: this.id
	}, {
		'$set': {
			'accessKey': accessKey
		}
	}, {upsert: true})).then(
		() => this._broadcast(ACTIONS.SET_ACCESS_KEY, null, null))
		.then(() => this._updateRetroLastUpdateTimestamp());

	addGood = text => collection().then(c => c.findOne({
		id: this.id,
		'good.text': text
	})).then(item => {
		if (item) {
			throw new DuplicateError('text', text);
		}

		const dbItem = {
			id: uuid(),
			text,
			up: 0,
			down: 0
		};

		return collection().then(c => c.update({
			id: this.id
		}, {
			'$push': {
				'good': dbItem
			}
		}, {upsert: true})).then(
			() => this._broadcast(ACTIONS.ADD_GOOD, dbItem.id, dbItem))
			.then(() => this._updateRetroLastUpdateTimestamp());
	});

	updateGood = (id, text) => collection().then(c => c.findOne({
		id: this.id,
		'good.text': text
	})).then(item => {
		if (item) {
			throw new DuplicateError('text', text);
		}

		return collection().then(c => c.updateOne({
			id: this.id,
			'good.id': id
		}, {
			'$set': {
				'good.$.text': text
			}
		}));
	}).then(
		() => this._broadcast(ACTIONS.UPDATE_GOOD, id, {id, text}))
		.then(() => this._updateRetroLastUpdateTimestamp());

	deleteGood = id => collection().then(c => c.updateOne({
		id: this.id
	}, {
		'$pull': {
			'good': {
				id
			}
		}
	})).then(
		() => this._broadcast(ACTIONS.DELETE_GOOD, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	addBad = text => collection().then(c => c.findOne({
		id: this.id,
		'bad.text': text
	})).then(item => {
		if (item) {
			throw new DuplicateError('text', text);
		}

		const dbItem = {
			id: uuid(),
			text,
			up: 0,
			down: 0
		};

		return collection().then(c => c.update({
			id: this.id
		}, {
			'$push': {
				'bad': {
					id: uuid(),
					text,
					up: 0,
					down: 0
				}
			}
		}, {upsert: true})).then(
			() => this._broadcast(ACTIONS.ADD_BAD, dbItem.id, dbItem))
			.then(() => this._updateRetroLastUpdateTimestamp());
	});

	updateBad = (id, text) => collection().then(c => c.findOne({
		id: this.id,
		'bad.text': text
	})).then(item => {
		if (item) {
			throw new DuplicateError('text', text);
		}

		return collection().then(c => c.updateOne({
			id: this.id,
			'bad.id': id
		}, {
			'$set': {
				'bad.$.text': text
			}
		}));
	}).then(
		() => this._broadcast(ACTIONS.UPDATE_BAD, id, {id, text}))
		.then(() => this._updateRetroLastUpdateTimestamp());

	deleteBad = id => collection().then(c => c.updateOne({
		id: this.id
	}, {
		'$pull': {
			'bad': {
				id
			}
		}
	})).then(
		() => this._broadcast(ACTIONS.DELETE_BAD, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	addAction = text => collection().then(c => c.findOne({
		id: this.id,
		'actions.text': text
	})).then(item => {
		if (item) {
			throw new DuplicateError('text', text);
		}

		const dbItem = {
			id: uuid(),
			text,
			up: 0,
			down: 0
		};

		return collection().then(c => c.update({
			id: this.id
		}, {
			'$push': {
				'actions': {
					id: uuid(),
					text,
					up: 0,
					down: 0
				}
			}
		}, {upsert: true})).then(
			() => this._broadcast(ACTIONS.ADD_ACTION, dbItem.id, dbItem))
			.then(() => this._updateRetroLastUpdateTimestamp());
	});

	updateAction = (id, text) => collection().then(c => c.findOne({
		id: this.id,
		'actions.text': text
	})).then(item => {
		if (item) {
			throw new DuplicateError('text', text);
		}

		return collection().then(c => c.updateOne({
			id: this.id,
			'actions.id': id
		}, {
			'$set': {
				'actions.$.text': text
			}
		}));
	}).then(
		() => this._broadcast(ACTIONS.UPDATE_ACTION, id, {id, text}))
		.then(() => this._updateRetroLastUpdateTimestamp());

	deleteAction = id => collection().then(c => c.updateOne({
		id: this.id
	}, {
		'$pull': {
			'actions': {
				id
			}
		}
	})).then(
		() => this._broadcast(ACTIONS.DELETE_ACTION, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	upvoteGood = id => collection().then(c => c.update({
		'good.id': id
	}, {
		'$inc': {
			'good.$.up': 1
		}
	})).then(
		() => this._broadcast(ACTIONS.UPVOTE_GOOD, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	downvoteGood = id => collection().then(c => c.update({
		'good.id': id
	}, {
		'$inc': {
			'good.$.down': 1
		}
	})).then(
		() => this._broadcast(ACTIONS.DOWNVOTE_GOOD, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	upvoteBad = id => collection().then(c => c.update({
		'bad.id': id
	}, {
		'$inc': {
			'bad.$.up': 1
		}
	})).then(
		() => this._broadcast(ACTIONS.UPVOTE_BAD, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	downvoteBad = id => collection().then(c => c.update({
		'bad.id': id
	}, {
		'$inc': {
			'bad.$.down': 1
		}
	})).then(
		() => this._broadcast(ACTIONS.DOWNVOTE_BAD, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	upvoteAction = id => collection().then(c => c.update({
		'actions.id': id
	}, {
		'$inc': {
			'actions.$.up': 1
		}
	})).then(
		() => this._broadcast(ACTIONS.UPVOTE_ACTION, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	downvoteAction = id => collection().then(c => c.update({
		'actions.id': id
	}, {
		'$inc': {
			'actions.$.down': 1
		}
	})).then(
		() => this._broadcast(ACTIONS.DOWNVOTE_ACTION, id))
		.then(() => this._updateRetroLastUpdateTimestamp());

	addComment = (section, itemId, commentText) => {
		const commentId = uuid();

		return collection().then(c => c.update({
			id: this.id,
			[`${SECTION_COLLECTION_MAP[section]}.id`]: itemId
		}, {
			'$push': {
				[`${SECTION_COLLECTION_MAP[section]}.$.comments`]: {
					id: commentId,
					text: commentText
				}
			}
		})).then(
			() => this._broadcast(ACTIONS.ADD_COMMENT, commentId, { id: commentId, text: commentText }))
			.then(() => this._updateRetroLastUpdateTimestamp());
	}

	updateComment = (section, commentId, commentText) => collection().then(c => c.updateOne({
		id: this.id,
		[`${SECTION_COLLECTION_MAP[section]}.comments.id`]: commentId
	}, {
		'$set': {
			[`${SECTION_COLLECTION_MAP[section]}.$.comments.$[comment].text`]: commentText
		}
	}, {
		arrayFilters: [
			{
				'comment.id': commentId
			}
		]
	})).then(
		() => this._broadcast(ACTIONS.UPDATE_COMMENT, commentId, { id: commentId, text: commentText }))
		.then(() => this._updateRetroLastUpdateTimestamp());

	deleteComment = (section, commentId) => collection().then(c => c.updateOne({
		id: this.id,
		[`${SECTION_COLLECTION_MAP[section]}.comments.id`]: commentId
	}, {
		'$pull': {
			[`${SECTION_COLLECTION_MAP[section]}.$.comments`]: {
				id: commentId
			}
		}
	})).then(
		() => this._broadcast(ACTIONS.DELETE_COMMENT, commentId))
		.then(() => this._updateRetroLastUpdateTimestamp());

	_updateRetroLastUpdateTimestamp = () => collection().then(c => c.update({
		id: this.id
	}, {
		'$set': {
			'lastUpdate': new Date().getTime()
		}
	}, {upsert: true}));
};
