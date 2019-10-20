var MongoClient = require('mongodb').MongoClient;

export default class DatabaseFactory {
    static getDatabase(config) {
        if (this.connection == null) {
            return MongoClient.connect(
                'mongodb://' + config.host + ':' + config.port + '/' + config.name
            ).then(connection => {
                console.log('Database connection established.');

                this.connection = connection;

                return this.connection;
            });
        }

        return Promise.resolve(this.connection);
    }
};
