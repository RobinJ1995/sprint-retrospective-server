const Validator = require('input-field-validator');
const DAO = require('./DAO');
const { TITLE_MAX_LENGTH, TEXT_MAX_LENGTH, VOTE_MODES } = require('./constants');
const ValidationError = require('./error/ValidationError');
const errorHandler = require('./error_handler');
const AuthenticationMiddleware = require('./middleware/authentication');
const Authenticator = require('./Authenticator');

const validate = (input, rules) => {
    const validator = new Validator(input, rules);
    if (validator.validate()) {
        return true;
    }

    throw new ValidationError(validator.errors);
};

module.exports = app => {
    app.get('/health', (req, res) => {
        const checks = {
            'database': () => !!req.database
        };

        const results = Object.fromEntries(Object.entries(checks)
            .map(([key, check]) => [key, check()]));
        const allOk = Object.values(results)
            .every(result => !!result);
        
        return res.status(allOk ? 200 : 503)
            .send(results);
    });

    app.post('/:id/good', AuthenticationMiddleware, (req, res) => {
        validate(req.body, {
            text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
        });

        new DAO(req.database, req.params.id).addGood(req.body.text)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.patch('/:id/good/:good_id', AuthenticationMiddleware, (req, res) => {
        validate(req.body, {
            text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
        });

        new DAO(req.database, req.params.id).updateGood(req.params.good_id, req.body.text)
          .then(x => res.status(200).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.delete('/:id/good/:good_id', AuthenticationMiddleware, (req, res) => {
        new DAO(req.database, req.params.id).deleteGood(req.params.good_id)
          .then(x => res.status(200).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.post('/:id/good/:good_id/up', AuthenticationMiddleware, (req, res) => {
        new DAO(req.database, req.params.id).upvoteGood(req.params.good_id)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.post('/:id/good/:good_id/down', AuthenticationMiddleware, (req, res) => {
        new DAO(req.database, req.params.id).downvoteGood(req.params.good_id)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.post('/:id/bad', AuthenticationMiddleware, (req, res) => {
        validate(req.body, {
            text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
        });

        new DAO(req.database, req.params.id).addBad(req.body.text)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.patch('/:id/bad/:bad_id', AuthenticationMiddleware, (req, res) => {
        validate(req.body, {
            text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
        });

        new DAO(req.database, req.params.id).updateBad(req.params.bad_id, req.body.text)
          .then(x => res.status(200).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.delete('/:id/bad/:bad_id', AuthenticationMiddleware, (req, res) => {
        new DAO(req.database, req.params.id).deleteBad(req.params.bad_id)
          .then(x => res.status(200).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.post('/:id/bad/:bad_id/up', AuthenticationMiddleware, (req, res) => {
        new DAO(req.database, req.params.id).upvoteBad(req.params.bad_id)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.post('/:id/bad/:bad_id/down', AuthenticationMiddleware, (req, res) => {
        new DAO(req.database, req.params.id).downvoteBad(req.params.bad_id)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.post('/:id/action', AuthenticationMiddleware, (req, res) => {
        validate(req.body, {
            text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
        });

        new DAO(req.database, req.params.id).addAction(req.body.text)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.patch('/:id/action/:action_id', AuthenticationMiddleware, (req, res) => {
        validate(req.body, {
            text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
        });

        new DAO(req.database, req.params.id).updateAction(req.params.action_id, req.body.text)
          .then(x => res.status(200).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.delete('/:id/action/:action_id', AuthenticationMiddleware, (req, res) => {
        new DAO(req.database, req.params.id).deleteAction(req.params.action_id)
          .then(x => res.status(200).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.post('/:id/action/:action_id/up', AuthenticationMiddleware, (req, res) => {
        new DAO(req.database, req.params.id).upvoteAction(req.params.action_id)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.post('/:id/action/:action_id/down', AuthenticationMiddleware, (req, res) => {
        new DAO(req.database, req.params.id).downvoteActions(req.params.action_id)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.put('/:id/title', AuthenticationMiddleware, (req, res) => {
        validate(req.body, {
            title: ['required', 'minlength:1', `maxlength:${TITLE_MAX_LENGTH}`]
        });

        new DAO(req.database, req.params.id).setTitle(req.body.title)
          .then(x => res.status(200).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.put('/:id/voteMode', AuthenticationMiddleware, (req, res) => {
        validate(req.body, {
            voteMode: ['required', `in:${Object.values(VOTE_MODES).join(',')}`]
        });

        new DAO(req.database, req.params.id).setVoteMode(req.body.voteMode)
          .then(x => res.status(200).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.put('/:id/accessKey', AuthenticationMiddleware, (req, res) => {
        validate(req.body, {
            accessKey: ['required', 'minlength:3']
        });

        new DAO(req.database, req.params.id).setAccessKey(req.body.accessKey)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.post('/:id/authenticate', (req, res) => {
        validate(req.body, {
            accessKey: ['optional']
        });

        return new Authenticator(req.database, req.app.config.jwt.secret)
          .authenticate(req.params.id, req.body.accessKey)
          .then(token => res.status(200).send({ token }))
          .catch(err => errorHandler(res, err));
    });
    app.get('/:id/', AuthenticationMiddleware, (req, res) => {
        new DAO(req.database, req.params.id).getRetro()
          .then(retro => ({
              ...retro,
              accessKey: null // Don't reveal the access key.
          }))
          .then(retro => res.status(200).send(retro))
          .catch(err => errorHandler(res, err));
    });
};
