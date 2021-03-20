const MongoClient = require('mongodb').MongoClient;
const {EXIT_CODES} = require('./constants');

const config = require('./config').db;

const connectionString = config.connectionString ||
	`mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.name}?authSource=admin`;
let connection = null;

module.exports = () => {
	if (connection) {
		return Promise.resolve(connection);
	}

	return MongoClient.connect(connectionString).then(conn => {
		console.log(`Database connection established (${config.host}:${config.port}).`);
		
		connection = conn.db(config.name);
		return connection;
	}).catch(ex => {
		console.error('Database connection failed.', ex);

		process.exit(EXIT_CODES.DATABASE_CONNECTION_FAILED);
	});
}
