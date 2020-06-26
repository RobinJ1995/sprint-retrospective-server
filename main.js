const app = require('express')();
const BodyParser = require('body-parser');
const messageQueue = require('./sqs/messageQueue');

app.config = require('./config');

messageQueue.onReceive(x => console.log(x));

app.use(require('./middleware/database'));
app.use(require('./middleware/cors'));
app.use(BodyParser.json());

require('./handlers')(app);

app.listen(app.config.port);
console.log(`Listening on port ${app.config.port}`);
