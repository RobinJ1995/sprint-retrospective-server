const app = require('express')();
const uuid = require('uuid/v4');
const BodyParser = require('body-parser');

app.config = require.main.require('./config')();

app.use(require('./middleware/database'));
app.use(BodyParser.json());

require('./handlers')(app);

app.listen(app.config.port);
console.log(`Listening on port ${app.config.port}`);
