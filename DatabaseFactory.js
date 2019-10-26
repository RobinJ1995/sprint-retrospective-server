const MongoClient = require('mongodb').MongoClient;

module.exports = class DatabaseFactory {
    static getDatabase(config) {
        if (this.connection == null) {
            return MongoClient.connect(
                `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.name}?authSource=admin`
            ).then(connection => {
                console.log(`Database connection established (${config.host}:${config.port}).`);

                this.connection = connection;

                return this.connection.db(config.name);
            });
        }

        return Promise.resolve(this.connection.db(config.name));
    }
};
