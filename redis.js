const { createClient } = require('redis');

const config = require.main.require('./config').redis;
console.info(`Connecting to Redis at ${config.url}...`);
const redis = createClient({
    url: config.url
});

redis.on('error', (err) => console.error('Redis Client Error', err));
redis.connect();

module.exports = redis;
