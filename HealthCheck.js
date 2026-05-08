const redis = require('./redis');
const messagePublisher = require('./message_publisher');
const database = require('./database');

module.exports = class HealthCheck {
	constructor(req) {
		this.req = req;
	}

	run = () => Promise.all([
		this._database(),
		this._redis(),
		this._message_queue()
	]).then(([database, redis, message_queue]) => ({
		database, redis, message_queue
	}));

	_database = () => {
		const check = database.engine === 'mariadb' ?
			database().then(db => db.query('SELECT 1 AS ok')).then(([rows]) => rows[0].ok === 1) :
			database().then(db => db.stats()).then(({ok}) => !!ok);

		return check.catch(err => {
			console.log('Database health check failed.', err);

			return false;
		});
	};

	_redis = () => redis.infoAsync()
		.then(x => x.includes('redis_version'))
		.catch(err => {
			console.log('Redis health check failed.', err);

			return false;
		});

	_message_queue = () => messagePublisher.send('HEALTH')
		.then(() => true)
		.catch(err => {
			console.log('Message queue health check failed.', err);

			return false;
		});
};
