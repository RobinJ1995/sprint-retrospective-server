module.exports = class InvalidAccessKey extends Error {
  constructor() {
    super();

    this.message = 'The provided access key is not valid for this retrospective.';
    this.httpstatus = 401;
  }

  getResponseBody = () => ({
    message: this.message,
    key: 'INVALID_AUTH'
  });
};