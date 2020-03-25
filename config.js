const Uuid = require('uuid/v4');

module.exports = config = {
    port: 5432,
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 27017,
        name: process.env.DB_NAME || 'sprint-retrospective',
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || 'root'
    },
    jwt: {
        secret: process.env.JWT_SECRET || Uuid()
    }
};
