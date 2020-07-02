const Amqplib = require('amqplib');
const Promise = require('bluebird');

module.exports = class MessagePublisher {
	constructor(url, queueName) {
		this.client = Amqplib.connect(url)
		this.queue = queueName;
	}

	send = message => {
		return this.client.then(connection => connection.createChannel())
			.then(ch => ch.assertExchange(this.queue, 'fanout', {durable: false})
				.then(() => ch))
			.then(ch => ch.publish(
				this.queue, '', Buffer.from(JSON.stringify(message))))
			.then(() => console.log(`<<<<< ${JSON.stringify(message)}`))
			.catch(err => {
				console.error(`Failed to send message ${JSON.stringify(message)}`, err);
				throw err;
			});
	}
}
