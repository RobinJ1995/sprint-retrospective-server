const DatabaseFactory = require.main.require('./DatabaseFactory');

module.exports = (req, res, next) => {
  DatabaseFactory.getDatabase(req.app.config.db)
    .then(database => {
      req.database = database;

      return next();
    });
};
