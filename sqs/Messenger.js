const SQS = require('sqs');
const Promise = require('bluebird');

module.exports = class Messenger {
	constructor(sqsConfig) {
		if (!sqsConfig?.queue) {
			console.log('No SQS queue configured. Not using message queue.');
			return;
		}

		this.sqsClient = new SQS({
			access: sqsConfig.access_key_id,
			secret: sqsConfig.secret_access_key,
			proxy: sqsConfig.endpoint
		});
		this.queue = sqsConfig.queue;
	}

	send = message => new Promise((resolve, reject) => {
		try {
			console.log(`<<<<< ${JSON.stringify(message)}`);
			this.sqsClient.push(this.queue, message, resolve);
		} catch (ex) {
			return reject(ex);
		}
	});

	onReceive = callback => this.sqsClient.pull(this.queue,
		(message, acknowledge) => {
			const strMessage = JSON.stringify(message);
			console.log(`>>>>> ${strMessage}`);

			return Promise.resolve(callback(message))
				.then(() => acknowledge())
				.then(() => console.log(`>ACK> ${strMessage}`))
				.catch(console.error);
		});
}
