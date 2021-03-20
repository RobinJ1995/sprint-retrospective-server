const app = require('express')();
const BodyParser = require('body-parser');

app.config = require('./config');

app.use(require('./middleware/cors'));
app.use(require('./middleware/log'));
app.use(BodyParser.json());

require('./handlers')(app);

app.listen(app.config.port);
console.log(`Listening on port ${app.config.port}`);
