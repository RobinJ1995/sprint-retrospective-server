const {v4: uuid} = require('uuid');
const {VOTE_MODES, ACTIONS} = require('../constants');
const DuplicateError = require('../error/DuplicateError');
const messagePublisher = require('../message_publisher');
const database = require('../database');

const COLLECTION = 'retro';

const EMPTY_RETRO = {
	title: null,
	voteMode: VOTE_MODES.UPVOTE,
	good: [],
	bad: [],
	actions: []
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
		() => this._broadcast(ACTIONS.SET_TITLE, null, title));

	setVoteMode = voteMode => collection().then(c => c.update({
		id: this.id
	}, {
		'$set': {
			'voteMode': voteMode
		}
	}, {upsert: true})).then(
		() => this._broadcast(ACTIONS.SET_VOTE_MODE, null, voteMode));

	setAccessKey = accessKey => collection().then(c => c.update({
		id: this.id
	}, {
		'$set': {
			'accessKey': accessKey
		}
	}, {upsert: true})).then(
		() => this._broadcast(ACTIONS.SET_ACCESS_KEY, null, null));

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
			() => this._broadcast(ACTIONS.ADD_GOOD, dbItem.id, dbItem));
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
		() => this._broadcast(ACTIONS.UPDATE_GOOD, id, {id, text}));

	deleteGood = id => collection().then(c => c.updateOne({
		id: this.id
	}, {
		'$pull': {
			'good': {
				id
			}
		}
	})).then(
		() => this._broadcast(ACTIONS.DELETE_GOOD, id));

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
			() => this._broadcast(ACTIONS.ADD_BAD, dbItem.id, dbItem));
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
		() => this._broadcast(ACTIONS.UPDATE_BAD, id, {id, text}));

	deleteBad = id => collection().then(c => c.updateOne({
		id: this.id
	}, {
		'$pull': {
			'bad': {
				id
			}
		}
	})).then(
		() => this._broadcast(ACTIONS.DELETE_BAD, id));

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
			() => this._broadcast(ACTIONS.ADD_ACTION, dbItem.id, dbItem));
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
		() => this._broadcast(ACTIONS.UPDATE_ACTION, id, {id, text}));

	deleteAction = id => collection().then(c => c.updateOne({
		id: this.id
	}, {
		'$pull': {
			'actions': {
				id
			}
		}
	})).then(
		() => this._broadcast(ACTIONS.DELETE_ACTION, id));

	upvoteGood = id => collection().then(c => c.update({
		'good.id': id
	}, {
		'$inc': {
			'good.$.up': 1
		}
	})).then(
		() => this._broadcast(ACTIONS.UPVOTE_GOOD, id));

	downvoteGood = id => collection().then(c => c.update({
		'good.id': id
	}, {
		'$inc': {
			'good.$.down': 1
		}
	})).then(
		() => this._broadcast(ACTIONS.DOWNVOTE_GOOD, id));

	upvoteBad = id => collection().then(c => c.update({
		'bad.id': id
	}, {
		'$inc': {
			'bad.$.up': 1
		}
	})).then(
		() => this._broadcast(ACTIONS.UPVOTE_BAD, id));

	downvoteBad = id => collection().then(c => c.update({
		'bad.id': id
	}, {
		'$inc': {
			'bad.$.down': 1
		}
	})).then(
		() => this._broadcast(ACTIONS.DOWNVOTE_BAD, id));

	upvoteAction = id => collection().then(c => c.update({
		'actions.id': id
	}, {
		'$inc': {
			'actions.$.up': 1
		}
	})).then(
		() => this._broadcast(ACTIONS.UPVOTE_ACTION, id));

	downvoteAction = id => collection().then(c => c.update({
		'actions.id': id
	}, {
		'$inc': {
			'actions.$.down': 1
		}
	})).then(
		() => this._broadcast(ACTIONS.DOWNVOTE_ACTION, id));

	addComment = (section, itemId, commentText) => {
		const commentId = uuid();

		return collection().then(c => c.update({
			id: this.id,
			[`${section}.id`]: itemId
		}, {
			'$push': {
				[`${section}.$.comments`]: {
					id: commentId,
					text: commentText
				}
			}
		})).then(
			() => this._broadcast(ACTIONS.ADD_COMMENT, commentId, { id: commentId, text: commentText }));
	}

	updateComment = (section, commentId, commentText) => collection().then(c => c.updateOne({
		id: this.id,
		[`${section}.comments.id`]: commentId
	}, {
		'$set': {
			[`${section}.$.comments.$[comment].text`]: commentText
		}
	}, {
		arrayFilters: [
			{
				'comment.id': commentId
			}
		]
	})).then(
		() => this._broadcast(ACTIONS.UPDATE_COMMENT, commentId, { id: commentId, text: commentText }));

	deleteComment = (section, commentId) => collection().then(c => c.updateOne({
		id: this.id,
		[`${section}.comments.id`]: commentId
	}, {
		'$pull': {
			[`${section}.$.comments`]: {
				id: commentId
			}
		}
	})).then(
		() => this._broadcast(ACTIONS.DELETE_COMMENT, commentId));
};
