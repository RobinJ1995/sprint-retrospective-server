const Messenger = require('./Messenger');

module.exports = new Messenger(require('../config').sqs);
