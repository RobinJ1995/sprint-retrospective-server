module.exports = (req, res, next) => {
	res.once('finish', () => {
		const authId = req.authentication_token?.id || '[Unauthenticated]';
		console.log(`${authId} @ ${req.method} ${req.originalUrl}`);
	});

	return next();
};
