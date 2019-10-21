module.exports = class ValidationError extends Error {
  constructor(errors) {
    super();

    this.errors = errors;
    this.httpstatus = 400;
  }

  getResponseBody = () => this.errors;
};