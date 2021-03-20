const JWT = require('jsonwebtoken');
const Promise = require('bluebird');
const {v4: uuid} = require('uuid');
const RetrospectiveDao = require('./dao/RetrospectiveDao');
const AuthenticationRequired = require('./error/AuthenticationRequired');
const InvalidAccessKey = require('./error/InvalidAccessKey');
const config = require('./config').jwt;

module.exports = class Authenticator {
	constructor(secret) {
		this.secret = secret;
		this.secret = secret;
	}

	authenticate = (id, accessKey) => {
		return new RetrospectiveDao(id).getRetro()
			.then(retro => {
				if (!retro || !retro.accessKey) {
					return Promise.promisify(JWT.sign)({
						retro_id: id,
						protected: false,
						id: uuid(),
						ttl: config.ttl.insecure,
						expires: new Date().valueOf() + config.ttl.insecure
					}, this.secret, {
						expiresIn: config.ttl.insecure // Use tokens that are valid for a shorter period of time for unprotected retrospectives, as an access key may yet to be set for them.
					});
				} else if (retro.accessKey === accessKey) {
					return Promise.promisify(JWT.sign)({
						retro_id: id,
						protected: true,
						id: uuid(),
						ttl: config.ttl.secure,
						expires: new Date().valueOf() + config.ttl.secure
					}, this.secret, {
						expiresIn: config.ttl.secure
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
