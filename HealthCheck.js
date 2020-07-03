const messageQueue = require('./sqs/messageQueue');

module.exports = class HealthCheck {
	constructor(req) {
		this.req = req;
	}

	run = () => Promise.all([
		this._database(),
		this._redis(),
		this._message_queue()
	]).then(([ database, redis, message_queue ]) => ({
		database, redis, message_queue
	}));

	_database = () => this.req.database.stats()
		.then(({ ok }) => !!ok)
		.catch(err => {
			console.log('Database health check failed.', err);

			return false;
		});

	_redis = () => this.req.redis.infoAsync()
		.then(x => x.includes('redis_version'))
		.catch(err => {
			console.log('Redis health check failed.', err);

			return false;
		});

	_message_queue = () => messageQueue.send('HEALTH')
		.then(() => true)
		.catch(err => {
			console.log('Message queue health check failed.', err);

			return false;
		});
};
