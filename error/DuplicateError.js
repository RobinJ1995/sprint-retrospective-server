module.exports = class DuplicateError extends Error {
	constructor(key, val) {
		super();

		this.key = key;
		this.val = val;

		this.httpstatus = 422;
	}

	getResponseBody = () => ({message: `There is already an item with "${this.key}": "${this.val}"`});
};
