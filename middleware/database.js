const DatabaseFactory = require.main.require('./sys/database/DatabaseFactory');

export default (req, res, next) => {
    DatabaseFactory.getDatabase(req.app.config.db)
        .then(database => {
            req.database = database;

            return next();
        });
};
