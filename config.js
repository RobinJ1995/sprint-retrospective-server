const Uuid = require('uuid/v4');

module.exports = config = {
    port: 5432,
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 27017,
        name: process.env.DB_NAME || 'sprint-retrospective',
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || 'root',
        connectionString: process.env.DB_CONNECTION_STRING
    },
    jwt: {
        secret: process.env.JWT_SECRET || Uuid()
    },
    sqs: {
        queue: process.env.SQS_QUEUE_NAME,
        endpoint: process.env.SQS_ENDPOINT,
        access_key_id: process.env.SQS_ACCESS_KEY_ID || '*',
        secret_access_key: process.env.SQS_SECRET_ACCESS_KEY || '*'
    }
};
