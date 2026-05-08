const {v4: uuid} = require('uuid');
const ms = require('ms');

const dbEngine = (process.env.DB_ENGINE || 'mongodb').toLowerCase();
const defaultPort = dbEngine === 'mariadb' ? 3306 : 27017;

module.exports = config = {
	port: process.env.PORT || 5432,
	db: {
		engine: dbEngine,
		host: process.env.DB_HOST || 'localhost',
		port: process.env.DB_PORT || defaultPort,
		name: process.env.DB_NAME || 'sprint-retrospective',
		username: process.env.DB_USERNAME || 'root',
		password: process.env.DB_PASSWORD || 'root',
		connectionString: process.env.DB_CONNECTION_STRING
	},
	jwt: {
		secret: process.env.JWT_SECRET || uuid(),
		ttl: {
			secure: ms(process.env.JWT_TTL_SECURE || process.env.JWT_TTL || '20 days'),
			insecure: ms(process.env.JWT_TTL_INSECURE || process.env.JWT_TTL || '2 minutes'),
		}
	},
	redis: {
		url: process.env.REDIS_URL || 'redis://localhost',
		pubsub: {
			topic: process.env.REDIS_PUBSUB_TOPIC || 'updates'
		}
	},
	websocket: {
		public_base_url: process.env.WEBSOCKET_PUBLIC_BASE_URL || 'ws://localhost:5433/'
	},
	admin_key: process.env.ADMIN_KEY || uuid(),
	suppress_healthcheck_logging: (process.env.SUPPRESS_HEALTHCHECK_LOGGING || 'false').toLowerCase() === 'true'
};
