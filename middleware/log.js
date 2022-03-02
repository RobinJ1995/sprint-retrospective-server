module.exports = (req, res, next) => {
	res.once('finish', () => {
		const isHealthCheck = String(req?.method).toUpperCase() === 'GET' && String(req?.originalUrl) === '/health';

		if (!(req?.app?.config?.suppress_healthcheck_logging && isHealthCheck)) {
			const authId = req.authentication_token?.id || '[Unauthenticated]';
			console.log(`${authId} @ ${req.method} ${req.originalUrl}`);
		}
	});

	return next();
};
