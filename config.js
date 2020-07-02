const Uuid = require('uuid/v4');
const ms = require('ms');

module.exports = config = {
    port: process.env.PORT || 5432,
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 27017,
        name: process.env.DB_NAME || 'sprint-retrospective',
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || 'root',
        connectionString: process.env.DB_CONNECTION_STRING
    },
    jwt: {
        secret: process.env.JWT_SECRET || Uuid(),
		ttl: {
			secure: ms(process.env.JWT_TTL_SECURE || process.env.JWT_TTL || '20 days'),
			insecure: ms(process.env.JWT_TTL_INSECURE || process.env.JWT_TTL || '2 minutes'),
		}
    },
    mq: {
        url: process.env.MQ_CONNECTION_URL,
        queue: process.env.MQ_QUEUE_NAME
    },
	redis: {
    	url: process.env.REDIS_URL || 'redis://localhost'
	},
	websocket: {
    	public_base_url: process.env.WEBSOCKET_PUBLIC_BASE_URL || 'ws://localhost:5433/'
	}
};
