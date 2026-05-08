const config = require('../config');

const engine = config.db.engine;

if (engine === 'mariadb') {
	module.exports = {
		RetrospectiveDao: require('./mariadb/RetrospectiveDao'),
		ActionDao: require('./mariadb/ActionDao')
	};
} else {
	module.exports = {
		RetrospectiveDao: require('./RetrospectiveDao'),
		ActionDao: require('./ActionDao')
	};
}
