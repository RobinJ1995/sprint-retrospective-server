const Promise = require('bluebird');
const Redis = Promise.promisifyAll(require('redis'));

const config = require.main.require('./config').redis;
console.info(`Connecting to Redis at ${config.url}...`);
const redis = Redis.createClient(config.url);

module.exports = redis;
