const MongoClient = require('mongodb').MongoClient;
const uuid = require('uuid/v4');
const DatabaseFactory = require('./DatabaseFactory');
const { VOTE_MODES } = require('./constants');
const DuplicateError = require('./error/DuplicateError');

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

    getRetro = () => this.db.collection(COLLECTION).findOne({
        id: this.id
    }).then(retro => ({ ...EMPTY_RETRO, ...retro }));

    setTitle = title => this.db.collection(COLLECTION).update({
        id: this.id
    }, {
        '$set': {
            'title': title
        }
    });

    setVoteMode = voteMode => this.db.collection(COLLECTION).update({
        id: this.id
    }, {
        '$set': {
            'voteMode': voteMode
        }
    });

    addGood = text => this.db.collection(COLLECTION).findOne({
        id: this.id,
        'good.text': text
    }).then(item => {
        if (item) {
            throw new DuplicateError('text', text);
        }

        return this.db.collection(COLLECTION).update({
            id: this.id
        }, {
            '$push': {
                'good': {
                    id: uuid(),
                    text,
                    up: 0,
                    down: 0
                }
            }
        }, { upsert: true });
    });

    addBad = text => this.db.collection(COLLECTION).update({
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
    }, { upsert: true });

    addAction = text => this.db.collection(COLLECTION).update({
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
    }, { upsert: true });

    upvoteGood = id => this.db.collection(COLLECTION).update({
        'good.id': id
    }, {
        '$inc': {
            'good.$.up': 1
        }
    });

    downvoteGood = id => this.db.collection(COLLECTION).update({
        'good.id': id
    }, {
        '$inc': {
            'good.$.down': 1
        }
    });

    upvoteBad = id => this.db.collection(COLLECTION).update({
        'bad.id': id
    }, {
        '$inc': {
            'bad.$.up': 1
        }
    });

    downvoteBad = id => this.db.collection(COLLECTION).update({
        'bad.id': id
    }, {
        '$inc': {
            'bad.$.down': 1
        }
    });

    upvoteAction = id => this.db.collection(COLLECTION).update({
        'actions.id': id
    }, {
        '$inc': {
            'actions.$.up': 1
        }
    });

    downvoteActions = id => this.db.collection(COLLECTION).update({
        'actions.id': id
    }, {
        '$inc': {
            'actions.$.down': 1
        }
    });
};
