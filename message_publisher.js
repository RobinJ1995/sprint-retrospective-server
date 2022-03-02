const redis = require('./redis');
const config = require.main.require('./config').redis.pubsub;
const SUPPRESS_HEALTHCHECK_LOGGING = require.main.require('./config').suppress_healthcheck_logging;

class MessagePublisher {
	constructor(redisClient, topic) {
		this.client = redisClient;
		this.topic = topic;
	}

	send = message =>
		this.client.publishAsync(this.topic, JSON.stringify(message))
			.then(() => !SUPPRESS_HEALTHCHECK_LOGGING && console.log(`<<<<< ${JSON.stringify(message)}`))
			.catch(err => {
				console.error(`Failed to send message ${JSON.stringify(message)}`, err);
				throw err;
			});
}

const messagePublisher = new MessagePublisher(redis, config.topic);

module.exports = messagePublisher;
