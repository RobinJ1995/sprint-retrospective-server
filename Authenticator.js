const JWT = require('jsonwebtoken');
const Promise = require('bluebird');
const DAO = require('./DAO');
const AuthenticationRequired = require('./error/AuthenticationRequired');
const InvalidAccessKey = require('./error/InvalidAccessKey');

module.exports = class Authenticator {
  constructor(db, secret) {
    this.db = db;
    this.secret = secret;
  }

  authenticate = (id, accessKey) => {
    return new DAO(this.db, id).getRetro()
      .then(retro => {
        if (!retro || !retro.accessKey) {
          return Promise.promisify(JWT.sign)({
            retro_id: id,
            protected: false
          }, this.secret, {
            expiresIn: '2 minutes' // Use tokens that are valid for a shorter period of time for unprotected retrospectives, as an access key may yet to be set for them.
          });
        } else if (retro.accessKey === accessKey) {
          return Promise.promisify(JWT.sign)({
            retro_id: id,
            protected: true
          }, this.secret, {
            expiresIn: '20 days'
          });
        } else if (!accessKey) {
          throw new AuthenticationRequired();
        }

        throw new InvalidAccessKey();
      })
  };

  verify = (id, token) => {
    return Promise.promisify(JWT.verify)(token, this.secret)
      .then(decoded => {
        if (decoded.retro_id !== id) {
          throw new InvalidAccessKey();
        }

        return decoded;
      }).catch(err => {
        if (err.name === 'TokenExpiredError') {
          throw new AuthenticationRequired();
        }

        throw new InvalidAccessKey();
      });
  }
};
