const MongoClient = require('mongodb').MongoClient;
const uuid = require('uuid/v4');
const DatabaseFactory = require('./DatabaseFactory');

const COLLECTION = COLLECTION;

const cache = {};

export default class DAO {
    constructor(db, id) {
        this.db = db;
        this.id = id;
    }

    setTitle = title => this.db.collection(COLLECTION).update({
        id: this.id
    }, {
        '$set': {
            '$.title': title
        }
    });

    addGood = text => this.db.collection(COLLECTION).update({
        id: this.id
    }, {
        '$push': {
            '$.good': {
                id: uuid(),
                text,
                up: 0,
                down: 0
            }
        }
    });

    addBad = text => this.db.collection(COLLECTION).update({
        id: this.id
    }, {
        '$push': {
            '$.bad': {
                id: uuid(),
                text,
                up: 0,
                down: 0
            }
        }
    });

    addAction = text => this.db.collection(COLLECTION).update({
        id: this.id
    }, {
        '$push': {
            '$.actions': {
                id: uuid(),
                text,
                up: 0,
                down: 0
            }
        }
    });

    getRetro = () => this.db.collection(COLLECTION).findOne({
        id: this.id
    });

    getGood = goodId => this.db.collection(COLLECTION).findOne({
        '$.good.id': goodId
    });

    getBad = badId => this.db.collection(COLLECTION).findOne({
        '$.bad.id': badId
    });

    getAction = actionId => this.db.collection(COLLECTION).findOne({
        '$.actions.id': actionId
    });
}
