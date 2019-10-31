const Validator = require('input-field-validator');
const DAO = require('./DAO');
const { TITLE_MAX_LENGTH, TEXT_MAX_LENGTH, VOTE_MODES } = require('./constants');
const ValidationError = require('./error/ValidationError');

const validate = (input, rules) => {
    const validator = new Validator(input, rules);
    if (validator.validate()) {
        return true;
    }

    throw new ValidationError(validator.errors);
};

const errorHandler = (res, error) => {
    if (error.httpstatus && error.getResponseBody) {
        return res.status(error.httpstatus).send(error.getResponseBody());
    }

    return res.status(500).send({
        message: error.message
    });
};

module.exports = app => {
    app.post('/:id/good', (req, res) => {
        validate(req.body, {
            text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
        });

        new DAO(req.database, req.params.id).addGood(req.body.text)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.patch('/:id/good/:good_id', (req, res) => {
        validate(req.body, {
            text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
        });

        new DAO(req.database, req.params.id).updateGoodText(req.params.good_id, req.body.text)
          .then(x => res.status(200).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.post('/:id/good/:good_id/up', (req, res) => {
        new DAO(req.database, req.params.id).upvoteGood(req.params.good_id)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.post('/:id/good/:good_id/down', (req, res) => {
        new DAO(req.database, req.params.id).downvoteGood(req.params.good_id)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.post('/:id/bad', (req, res) => {
        validate(req.body, {
            text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
        });

        new DAO(req.database, req.params.id).addBad(req.body.text)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.patch('/:id/bad/:bad_id', (req, res) => {
        validate(req.body, {
            text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
        });

        new DAO(req.database, req.params.id).updateBadText(req.params.bad_id, req.body.text)
          .then(x => res.status(200).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.post('/:id/bad/:bad_id/up', (req, res) => {
        new DAO(req.database, req.params.id).upvoteBad(req.params.bad_id)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.post('/:id/bad/:bad_id/down', (req, res) => {
        new DAO(req.database, req.params.id).downvoteBad(req.params.bad_id)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.post('/:id/action', (req, res) => {
        validate(req.body, {
            text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
        });

        new DAO(req.database, req.params.id).addAction(req.body.text)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.patch('/:id/actions/:action_id', (req, res) => {
        validate(req.body, {
            text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
        });

        new DAO(req.database, req.params.id).updateActionText(req.params.action_id, req.body.text)
          .then(x => res.status(200).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.post('/:id/action/:action_id/up', (req, res) => {
        new DAO(req.database, req.params.id).upvoteAction(req.params.action_id)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.post('/:id/action/:action_id/down', (req, res) => {
        new DAO(req.database, req.params.id).downvoteActions(req.params.action_id)
          .then(x => res.status(201).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.put('/:id/title', (req, res) => {
        validate(req.body, {
            title: ['required', 'minlength:1', `maxlength:${TITLE_MAX_LENGTH}`]
        });

        new DAO(req.database, req.params.id).setTitle(req.body.title)
          .then(x => res.status(200).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.put('/:id/voteMode', (req, res) => {
        validate(req.body, {
            voteMode: ['required', `in:${Object.values(VOTE_MODES).join(',')}`]
        });

        new DAO(req.database, req.params.id).setVoteMode(req.body.voteMode)
          .then(x => res.status(200).send(x))
          .catch(err => errorHandler(res, err));
    });
    app.get('/:id/', (req, res) => {
        new DAO(req.database, req.params.id).getRetro()
          .then(retro => res.status(200).send(retro))
          .catch(err => errorHandler(res, err));
    });
};
