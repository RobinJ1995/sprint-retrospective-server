const Promise = require('bluebird');
const Redis = Promise.promisifyAll(require('redis'));

const config = require.main.require('./config').redis;
const redis = Redis.createClient(config.url);

module.exports = (req, res, next) => {
	req.redis = redis;

	return next();
};
