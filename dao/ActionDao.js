const {v4: uuid} = require('uuid');
const database = require('../database');

const COLLECTION = 'actions';

const collection = () => database().then(db => db.collection(COLLECTION));

module.exports = class ActionDao {
	add = ({
			   retroId,
			   itemId,
			   action,
			   timestamp
		   }) => {
		const id = uuid();

		return collection().then(coll => coll.insert({
			id,
			retroId,
			itemId,
			action,
			timestamp: timestamp ?? new Date()
		})).then(() => id);
	}

	get = id => collection().then(coll => coll.findOne({id}));

	getForRetro = retroId => collection()
		.then(coll => coll.find({retroId}).toArray());
};
