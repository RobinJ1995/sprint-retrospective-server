const app = require('express')();
const Validator = require('input-field-validator');
const uuid = require('uuid/v4');
const BodyParser = require('body-parser');

const TEXT_MAX_LENGTH = 1024;
const TITLE_MAX_LENGTH = 128;

app.config = require.main.require('./config')();

app.use(require('./middleware/database'))
app.use(BodyParser.json());

require('./handlers')(app);

const data = {};
const getData = id => {
  if (!data[id]) {
    data[id] = {
      title: null,
      good: [],
      bad: [],
      actions: []
    }
  }

  return data[id];
}

const validate = (input, rules) => {
  const validator = new Validator(input, rules);
  if (validator.validate()) {
    return true;
  }

  throw new Error(validator.errors.join(', '));
};


app.listen(app.config.port);
console.log(`Listening on port ${app.config.port}`);
