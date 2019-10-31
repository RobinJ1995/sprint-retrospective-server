const uuid = require('uuid/v4');
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
    }, { upsert: true });

    setVoteMode = voteMode => this.db.collection(COLLECTION).update({
        id: this.id
    }, {
        '$set': {
            'voteMode': voteMode
        }
    }, { upsert: true });

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
    });

    deleteGood = id => this.db.collection(COLLECTION).updateOne({
          id: this.id
    }, {
        '$pull': {
            'good': {
                id
            }
        }
    });

    addBad = text => this.db.collection(COLLECTION).findOne({
        id: this.id,
        'bad.text': text
    }).then(item => {
        if (item) {
            throw new DuplicateError('text', text);
        }

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
        }, { upsert: true });
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
    });

    deleteBad = id => this.db.collection(COLLECTION).updateOne({
        id: this.id
    }, {
        '$pull': {
            'bad': {
                id
            }
        }
    });

    addAction = text => this.db.collection(COLLECTION).findOne({
        id: this.id,
        'actions.text': text
    }).then(item => {
        if (item) {
            throw new DuplicateError('text', text);
        }

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
        }, { upsert: true });
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
    });

    deleteAction = id => this.db.collection(COLLECTION).updateOne({
        id: this.id
    }, {
        '$pull': {
            'actions': {
                id
            }
        }
    });

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
