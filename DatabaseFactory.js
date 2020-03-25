const MongoClient = require('mongodb').MongoClient;
const { EXIT_CODES } = require('./constants');

module.exports = class DatabaseFactory {
    static getDatabase(config) {
        if (this.connection == null) {
        	const connectionString = config.connectionString ||
	        	`mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.name}?authSource=admin`;
            return MongoClient.connect(connectionString).then(connection => {
                console.log(`Database connection established (${config.host}:${config.port}).`);

                this.connection = connection;

                return this.connection.db(config.name);
            }).catch(ex => {
                console.error('Database connection failed.', ex);

                process.exit(EXIT_CODES.DATABASE_CONNECTION_FAILED);
            });
        }

        return Promise.resolve(this.connection.db(config.name));
    }
};
