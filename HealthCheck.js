const messageQueue = require('./sqs/messageQueue');

module.exports = class HealthCheck {
	constructor(req) {
		this.req = req;
	}

	run = () => Promise.all([
		this.req.database.stats().then(({ ok }) => !!ok).catch(() => false),
		this.req.redis.infoAsync().then(x => x.includes('redis_version')).catch(() => false),
		messageQueue.send('HEALTH').then(() => true).catch(() => false)
	]).then(([ database, redis, message_queue ]) => ({
		database, redis, message_queue
	}));
};
