const MessagePublisher = require('./MessagePublisher');

const config = require('../config').mq;

module.exports = new MessagePublisher(config.url, config.queue);
