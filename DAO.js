const uuid = require('uuid/v4');
const { VOTE_MODES } = require('./constants');
const DuplicateError = require('./error/DuplicateError');
const messageQueue = require('./sqs/messageQueue');

const COLLECTION = 'retro';

const EMPTY_RETRO = {
    title: null,
    voteMode: VOTE_MODES.UPVOTE,
    good: [],
    bad: [],
    actions: []
};

module.exports = class DAO {
    constructor(db, id) {
        this.db = db;
        this.id = id;
    }

    _broadcast = (action, item, value = null) => {
    	const messageBody = {
			retro: this.id,
			action,
			item,
			value
		};

    	return messageQueue.send(messageBody);
	}

    getRetro = () => this.db.collection(COLLECTION).findOne({
        id: this.id
    }).then(retro => ({ ...EMPTY_RETRO, ...retro }));

    setTitle = title => this.db.collection(COLLECTION).update({
        id: this.id
    }, {
        '$set': {
            'title': title
        }
    }, { upsert: true }).then(
    	() => this._broadcast('set_title', null, title));

    setVoteMode = voteMode => this.db.collection(COLLECTION).update({
        id: this.id
    }, {
        '$set': {
            'voteMode': voteMode
        }
    }, { upsert: true }).then(
		() => this._broadcast('set_vote_mode', null, voteMode));

    setAccessKey = accessKey => this.db.collection(COLLECTION).update({
        id: this.id
    }, {
        '$set': {
            'accessKey': accessKey
        }
    }, { upsert: true }).then(
		() => this._broadcast('set_access_key', null, null));

    addGood = text => this.db.collection(COLLECTION).findOne({
        id: this.id,
        'good.text': text
    }).then(item => {
        if (item) {
            throw new DuplicateError('text', text);
        }

        const dbItem = {
			id: uuid(),
			text,
			up: 0,
			down: 0
		};

        return this.db.collection(COLLECTION).update({
            id: this.id
        }, {
            '$push': {
                'good': dbItem
            }
        }, { upsert: true }).then(
			() => this._broadcast('add_good', dbItem.id, dbItem));
    });

    updateGood = (id, text) => this.db.collection(COLLECTION).findOne({
        id: this.id,
        'good.text': text
    }).then(item => {
        if (item) {
            throw new DuplicateError('text', text);
        }

        return this.db.collection(COLLECTION).updateOne({
            id: this.id,
            'good.id': id
        }, {
            '$set': {
                'good.$.text': text
            }
        });
    }).then(
		() => this._broadcast('update_good', id, { id, text }));

    deleteGood = id => this.db.collection(COLLECTION).updateOne({
          id: this.id
    }, {
        '$pull': {
            'good': {
                id
            }
        }
    }).then(
		() => this._broadcast('delete_good', id));

    addBad = text => this.db.collection(COLLECTION).findOne({
        id: this.id,
        'bad.text': text
    }).then(item => {
        if (item) {
            throw new DuplicateError('text', text);
        }

		const dbItem = {
			id: uuid(),
			text,
			up: 0,
			down: 0
		};

        return this.db.collection(COLLECTION).update({
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
        }, { upsert: true }).then(
			() => this._broadcast('add_bad', dbItem.id, dbItem));
    });

    updateBad = (id, text) => this.db.collection(COLLECTION).findOne({
        id: this.id,
        'bad.text': text
    }).then(item => {
        if (item) {
            throw new DuplicateError('text', text);
        }

        return this.db.collection(COLLECTION).updateOne({
            id: this.id,
            'bad.id': id
        }, {
            '$set': {
                'bad.$.text': text
            }
        });
    }).then(
		() => this._broadcast('update_bad', id, { id, text }));

    deleteBad = id => this.db.collection(COLLECTION).updateOne({
        id: this.id
    }, {
        '$pull': {
            'bad': {
                id
            }
        }
    }).then(
		() => this._broadcast('delete_bad', id));

    addAction = text => this.db.collection(COLLECTION).findOne({
        id: this.id,
        'actions.text': text
    }).then(item => {
        if (item) {
            throw new DuplicateError('text', text);
        }

		const dbItem = {
			id: uuid(),
			text,
			up: 0,
			down: 0
		};

        return this.db.collection(COLLECTION).update({
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
        }, { upsert: true }).then(
			() => this._broadcast('add_action', dbItem.id, dbItem));
    });

    updateAction = (id, text) => this.db.collection(COLLECTION).findOne({
        id: this.id,
        'actions.text': text
    }).then(item => {
        if (item) {
            throw new DuplicateError('text', text);
        }

        return this.db.collection(COLLECTION).updateOne({
            id: this.id,
            'actions.id': id
        }, {
            '$set': {
                'actions.$.text': text
            }
        });
    }).then(
		() => this._broadcast('update_action', id, { id, text }));

    deleteAction = id => this.db.collection(COLLECTION).updateOne({
        id: this.id
    }, {
        '$pull': {
            'actions': {
                id
            }
        }
    }).then(
		() => this._broadcast('delete_action', id));

    upvoteGood = id => this.db.collection(COLLECTION).update({
        'good.id': id
    }, {
        '$inc': {
            'good.$.up': 1
        }
    }).then(
		() => this._broadcast('upvote_good', id));

    downvoteGood = id => this.db.collection(COLLECTION).update({
        'good.id': id
    }, {
        '$inc': {
            'good.$.down': 1
        }
    }).then(
		() => this._broadcast('downvote_good', id));

    upvoteBad = id => this.db.collection(COLLECTION).update({
        'bad.id': id
    }, {
        '$inc': {
            'bad.$.up': 1
        }
    }).then(
		() => this._broadcast('upvote_bad', id));

    downvoteBad = id => this.db.collection(COLLECTION).update({
        'bad.id': id
    }, {
        '$inc': {
            'bad.$.down': 1
        }
    }).then(
		() => this._broadcast('downvote_bad', id));

    upvoteAction = id => this.db.collection(COLLECTION).update({
        'actions.id': id
    }, {
        '$inc': {
            'actions.$.up': 1
        }
    }).then(
		() => this._broadcast('upvote_action', id));

    downvoteAction = id => this.db.collection(COLLECTION).update({
        'actions.id': id
    }, {
        '$inc': {
            'actions.$.down': 1
        }
    }).then(
		() => this._broadcast('downvote_action', id));
};
