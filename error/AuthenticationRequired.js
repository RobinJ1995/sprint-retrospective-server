module.exports = class AuthenticationRequired extends Error {
	constructor() {
		super();

		this.message = 'Authentication is required in order to view this retrospective.';
		this.httpstatus = 401;
	}

	getResponseBody = () => ({
		message: this.message,
		key: 'AUTH_REQUIRED'
	});
};
