const Validator = require('input-field-validator');
const Promise = require('bluebird');
const RetrospectiveDao = require('./dao/RetrospectiveDao');
const ActionDao = require('./dao/ActionDao');
const { TITLE_MAX_LENGTH, TEXT_MAX_LENGTH, VOTE_MODES, ACTIONS, SECTIONS } = require('./constants');
const ValidationError = require('./error/ValidationError');
const errorHandler = require('./error_handler');
const AuthenticationMiddleware = require('./middleware/authentication');
const AdminRequiredMiddleware = require('./middleware/admin_required');
const Authenticator = require('./Authenticator');
const HealthCheck = require('./HealthCheck');
const redis = require('./redis');

const actionDao = new ActionDao();

const validate = (input, rules) => {
    const validator = new Validator(input, rules);
    if (validator.validate()) {
        return true;
    }

    throw new ValidationError(validator.errors);
};

module.exports = app => {
	app.get('/health', (req, res) =>
		new HealthCheck(req).run()
			.then(results => {
				const allOk = Object.values(results)
					.every(result => !!result);

				return res.status(allOk ? 200 : 503)
					.send(results);
			}));

	app.post('/:id/good', AuthenticationMiddleware, (req, res) => {
		validate(req.body, {
			text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
		});

		new RetrospectiveDao(req.params.id).addGood(req.body.text)
			.then(x => res.status(201).send(x))
			.then(() => actionDao.add({
				retroId: req.params.id,
				itemId: null,
				action: ACTIONS.ADD_GOOD
			}))
			.catch(err => errorHandler(res, err));
	});
	app.patch('/:id/good/:good_id', AuthenticationMiddleware, (req, res) => {
		validate(req.body, {
			text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
		});

		new RetrospectiveDao(req.params.id).updateGood(req.params.good_id, req.body.text)
			.then(x => res.status(200).send(x))
			.then(() => actionDao.add({
				retroId: req.params.id,
				itemId: req.params.good_id,
				action: ACTIONS.UPDATE_GOOD
			}))
			.catch(err => errorHandler(res, err));
	});
	app.delete('/:id/good/:good_id', AuthenticationMiddleware, (req, res) => {
		new RetrospectiveDao(req.params.id).deleteGood(req.params.good_id)
			.then(x => res.status(200).send(x))
			.then(() => actionDao.add({
				retroId: req.params.id,
				itemId: req.params.good_id,
				action: ACTIONS.DELETE_GOOD
			}))
			.catch(err => errorHandler(res, err));
	});
	app.post('/:id/good/:good_id/up', AuthenticationMiddleware, (req, res) => {
		new RetrospectiveDao(req.params.id).upvoteGood(req.params.good_id)
			.then(() => actionDao.add({
				retroId: req.params.id,
				itemId: req.params.good_id,
				action: ACTIONS.UPVOTE_GOOD
			}))
			.then(actionId => res.status(201).send({actionId}))
			.catch(err => errorHandler(res, err));
	});
	app.post('/:id/good/:good_id/down', AuthenticationMiddleware, (req, res) => {
		new RetrospectiveDao(req.params.id).downvoteGood(req.params.good_id)
			.then(() => actionDao.add({
				retroId: req.params.id,
				itemId: req.params.good_id,
				action: ACTIONS.DOWNVOTE_GOOD
			}))
			.then(actionId => res.status(201).send({actionId}))
			.catch(err => errorHandler(res, err));
	});

	Object.values(SECTIONS).forEach(section => {
		app.post(`/:id/${section}/:item_id/comment`, AuthenticationMiddleware, (req, res) => {
			validate(req.body, {
				text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
			});

			new RetrospectiveDao(req.params.id).addComment(section, req.params.item_id, req.body.text)
				.then(() => actionDao.add({
					retroId: req.params.id,
					itemId: req.params.item_id,
					action: ACTIONS.ADD_COMMENT
				}))
				.then(actionId => res.status(201).send({actionId}))
				.catch(err => errorHandler(res, err));
		});
		app.patch(`/:id/${section}/:item_id/comment/:comment_id`, AuthenticationMiddleware, (req, res) => {
			validate(req.body, {
				text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
			});

			new RetrospectiveDao(req.params.id).updateComment(section, req.params.comment_id, req.body.text)
				.then(x => res.status(x ? 200 : 204).send(x))
				.then(() => actionDao.add({
					retroId: req.params.id,
					itemId: req.params.item_id,
					action: ACTIONS.UPDATE_COMMENT
				}))
				.catch(err => errorHandler(res, err));
		});
		app.delete(`/:id/${section}/:item_id/comment/:comment_id`, AuthenticationMiddleware, (req, res) => {
			new RetrospectiveDao(req.params.id).deleteComment(section, req.params.comment_id)
				.then(() => res.status(204).send())
				.then(() => actionDao.add({
					retroId: req.params.id,
					itemId: req.params.item_id,
					action: ACTIONS.DELETE_COMMENT
				}))
				.catch(err => errorHandler(res, err));
		});
	});

	app.post('/:id/bad', AuthenticationMiddleware, (req, res) => {
		validate(req.body, {
			text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
		});

		new RetrospectiveDao(req.params.id).addBad(req.body.text)
			.then(x => res.status(201).send(x))
			.then(() => actionDao.add({
				retroId: req.params.id,
				itemId: null,
				action: ACTIONS.ADD_BAD
			}))
			.catch(err => errorHandler(res, err));
	});
	app.patch('/:id/bad/:bad_id', AuthenticationMiddleware, (req, res) => {
		validate(req.body, {
			text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
		});

		new RetrospectiveDao(req.params.id).updateBad(req.params.bad_id, req.body.text)
			.then(x => res.status(200).send(x))
			.then(() => actionDao.add({
				retroId: req.params.id,
				itemId: req.params.bad_id,
				action: ACTIONS.UPDATE_BAD
			}))
			.catch(err => errorHandler(res, err));
	});
	app.delete('/:id/bad/:bad_id', AuthenticationMiddleware, (req, res) => {
		new RetrospectiveDao(req.params.id).deleteBad(req.params.bad_id)
			.then(x => res.status(200).send(x))
			.then(() => actionDao.add({
				retroId: req.params.id,
				itemId: req.params.bad_id,
				action: ACTIONS.DELETE_BAD
			}))
			.catch(err => errorHandler(res, err));
	});
	app.post('/:id/bad/:bad_id/up', AuthenticationMiddleware, (req, res) => {
		new RetrospectiveDao(req.params.id).upvoteBad(req.params.bad_id)
			.then(() => actionDao.add({
				retroId: req.params.id,
				itemId: req.params.bad_id,
				action: ACTIONS.UPVOTE_BAD
			}))
			.then(actionId => res.status(201).send({actionId}))
			.catch(err => errorHandler(res, err));
	});
	app.post('/:id/bad/:bad_id/down', AuthenticationMiddleware, (req, res) => {
		new RetrospectiveDao(req.params.id).downvoteBad(req.params.bad_id)
			.then(() => actionDao.add({
				retroId: req.params.id,
				itemId: req.params.bad_id,
				action: ACTIONS.DOWNVOTE_BAD
			}))
			.then(actionId => res.status(201).send({actionId}))
			.then(x => res.status(201).send(x))
			.catch(err => errorHandler(res, err));
	});
	app.post('/:id/action', AuthenticationMiddleware, (req, res) => {
		validate(req.body, {
			text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
		});

		new RetrospectiveDao(req.params.id).addAction(req.body.text)
			.then(x => res.status(201).send(x))
			.catch(err => errorHandler(res, err));
	});
	app.patch('/:id/action/:action_id', AuthenticationMiddleware, (req, res) => {
		validate(req.body, {
			text: ['required', 'minlength:1', `maxlength:${TEXT_MAX_LENGTH}`]
		});

		new RetrospectiveDao(req.params.id).updateAction(req.params.action_id, req.body.text)
			.then(x => res.status(200).send(x))
			.catch(err => errorHandler(res, err));
	});
	app.delete('/:id/action/:action_id', AuthenticationMiddleware, (req, res) => {
		new RetrospectiveDao(req.params.id).deleteAction(req.params.action_id)
			.then(x => res.status(200).send(x))
			.then(() => actionDao.add({
				retroId: req.params.id,
				itemId: null,
				action: ACTIONS.ADD_ACTION
			}))
			.catch(err => errorHandler(res, err));
	});
	app.post('/:id/action/:action_id/up', AuthenticationMiddleware, (req, res) => {
		new RetrospectiveDao(req.params.id).upvoteAction(req.params.action_id)
			.then(() => actionDao.add({
				retroId: req.params.id,
				itemId: req.params.action_id,
				action: ACTIONS.UPDATE_ACTION
			}))
			.then(actionId => res.status(201).send({actionId}))
			.catch(err => errorHandler(res, err));
	});
	app.post('/:id/action/:action_id/down', AuthenticationMiddleware, (req, res) => {
		new RetrospectiveDao(req.params.id).downvoteAction(req.params.action_id)
			.then(() => actionDao.add({
				retroId: req.params.id,
				itemId: req.params.action_id,
				action: ACTIONS.DELETE_ACTION
			}))
			.then(actionId => res.status(201).send({actionId}))
			.catch(err => errorHandler(res, err));
	});
	app.put('/:id/title', AuthenticationMiddleware, (req, res) => {
		validate(req.body, {
			title: ['required', 'minlength:1', `maxlength:${TITLE_MAX_LENGTH}`]
		});

		new RetrospectiveDao(req.params.id).setTitle(req.body.title)
			.then(x => res.status(200).send(x))
			.then(() => actionDao.add({
				retroId: req.params.id,
				itemId: null,
				action: ACTIONS.SET_TITLE
			}))
			.catch(err => errorHandler(res, err));
	});
	app.put('/:id/voteMode', AuthenticationMiddleware, (req, res) => {
		validate(req.body, {
			voteMode: ['required', `in:${Object.values(VOTE_MODES).join(',')}`]
		});

		new RetrospectiveDao(req.params.id).setVoteMode(req.body.voteMode)
			.then(x => res.status(200).send(x))
			.then(() => actionDao.add({
				retroId: req.params.id,
				itemId: null,
				action: ACTIONS.SET_VOTE_MODE
			}))
			.catch(err => errorHandler(res, err));
	});
	app.put('/:id/accessKey', AuthenticationMiddleware, (req, res) => {
		validate(req.body, {
			accessKey: ['required', 'minlength:3']
		});

		new RetrospectiveDao(req.params.id).setAccessKey(req.body.accessKey)
			.then(x => res.status(201).send(x))
			.then(() => actionDao.add({
				retroId: req.params.id,
				itemId: null,
				action: ACTIONS.SET_ACCESS_KEY
			}))
			.catch(err => errorHandler(res, err));
	});
	app.post('/:id/authenticate', (req, res) => {
		validate(req.body, {
			accessKey: ['optional']
		});

		return new Authenticator(req.app.config.jwt.secret)
			.authenticate(req.params.id, req.body.accessKey)
			.then(token => res.status(200).send({token}))
			.catch(err => errorHandler(res, err));
	});
	app.get('/:id/', AuthenticationMiddleware, (req, res) => {
		new RetrospectiveDao(req.params.id).getRetro()
			.then(retro => Promise.all([
				retro,
				redis.setAsync(
					req.authentication_token.id,
					JSON.stringify({retro: req.params.id}),
					'PX', req.authentication_token.expires)
					.then(() => req.authentication_token.id)
					.catch(err => {
						console.error(err);
						return false;
					})
			]))
			.then(([retro, websocketToken]) => ({
				...retro,
				accessKey: undefined, // Don't reveal the access key.
				socket: websocketToken ?
					`${app.config.websocket.public_base_url}${websocketToken}` :
					null
			}))
			.then(retro => res.status(200).send(retro))
			.catch(err => errorHandler(res, err));
	});

	app.get('/:id/_actions', AuthenticationMiddleware, AdminRequiredMiddleware,
		(req, res) => actionDao.getForRetro(req.params.id)
			.then(actions => actions.map(({ retroId, itemId, action, timestamp }) => ({
				retroId, itemId, action, timestamp
			})))
			.then(r => res.status(200).send(r))
			.catch(err => errorHandler(res, err)));

	app.get('/:id/_raw', AuthenticationMiddleware, AdminRequiredMiddleware,
		(req, res) => new RetrospectiveDao(req.params.id)._getRetroRaw()
			.then(r => res.status(200).send(r))
			.catch(err => errorHandler(res, err)));
};
