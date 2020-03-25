module.exports = (res, error) => {
  if (error.httpstatus && error.getResponseBody) {
    return res.status(error.httpstatus).send(error.getResponseBody());
  }

  return res.status(500).send({
    message: error.message
  });
};