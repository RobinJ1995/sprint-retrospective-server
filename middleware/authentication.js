const Authenticator = require('../Authenticator');
const AuthenticationRequired = require('../error/AuthenticationRequired');
const InvalidAccessKey = require('../error/InvalidAccessKey');
const errorHandler = require('../error_handler');
const config = require('../config');

module.exports = (req, res, next) => {
	const token = req.get('x-token');
	const adminKey = req.get('x-admin-key');

	if (!token) {
		return res.status(401).send(new AuthenticationRequired().getResponseBody());
	}

	new Authenticator(req.app.config.jwt.secret)
		.verify(req.params.id, token)
		.then(data => {
			if (!data) {
				throw new InvalidAccessKey();
			}

			req.authentication_token = data;

			if (adminKey === config.admin_key) {
				req.admin = true;
			}

			next();
		})
		.catch(err => errorHandler(res, err));
};
