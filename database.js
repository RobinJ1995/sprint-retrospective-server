const MongoClient = require('mongodb').MongoClient;
const mysql = require('mysql2/promise');
const {EXIT_CODES} = require('./constants');

const config = require('./config').db;
const isMariaDb = config.engine === 'mariadb';

let connection = null;
let schemaInitialized = false;

const createMongoConnection = () => {
	const connectionString = config.connectionString ||
		`mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.name}?authSource=admin`;

	return MongoClient.connect(connectionString)
		.then(conn => {
			console.log(`Database connection established (${config.host}:${config.port}).`);

			connection = conn.db(config.name);
			return connection;
		});
};

const initializeMariaDbSchema = () => {
	if (schemaInitialized) {
		return Promise.resolve(connection);
	}

	return Promise.all([
		connection.execute('CREATE TABLE IF NOT EXISTS retros (id CHAR(36) PRIMARY KEY, data JSON NOT NULL)'),
		connection.execute(`
			CREATE TABLE IF NOT EXISTS actions (
				id CHAR(36) PRIMARY KEY,
				retro_id CHAR(36) NOT NULL,
				item_id CHAR(36) NULL,
				action VARCHAR(64) NOT NULL,
				timestamp DATETIME(3) NOT NULL,
				INDEX idx_actions_retro_timestamp (retro_id, timestamp)
			)
		`)
	]).then(() => {
		schemaInitialized = true;
		return connection;
	});
};

const createMariaDbConnection = () => {
	connection = mysql.createPool({
		host: config.host,
		port: config.port,
		user: config.username,
		password: config.password,
		database: config.name,
		waitForConnections: true,
		connectionLimit: 10
	});

	return initializeMariaDbSchema().then(db => {
		console.log(`Database connection established (${config.host}:${config.port}).`);
		return db;
	});
};

const connect = () => {
	if (connection) {
		return Promise.resolve(connection);
	}

	if (isMariaDb) {
		return createMariaDbConnection();
	}

	return createMongoConnection();
};

const getConnection = () => connect().catch(ex => {
	console.error('Database connection failed.', ex);

	process.exit(EXIT_CODES.DATABASE_CONNECTION_FAILED);
	return null;
	});

getConnection.engine = config.engine;

module.exports = getConnection;
