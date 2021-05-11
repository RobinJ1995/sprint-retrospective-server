module.exports = (req, res, next) => {
	if (req.admin) {
		return next();
	}

	res.status(401).send();
};
