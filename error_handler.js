module.exports = (res, error) => {
	console.error(error);
	
	if (res.headersSent) {
		console.warn('Headers already sent.');
		return;
	}

	if (error.httpstatus && error.getResponseBody) {
		return res.status(error.httpstatus).send(error.getResponseBody());
	}

	return res.status(500).send({
		message: error.message
	});
};
