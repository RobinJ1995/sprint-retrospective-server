const TEXT_MAX_LENGTH = 1024;
const TITLE_MAX_LENGTH = 128;
const VOTE_MODES = Object.freeze({
	NONE: 'none',
	UPVOTE: 'up',
	UPVOTE_DOWNVOTE: 'updown'
});
const EXIT_CODES = Object.freeze({
	DATABASE_CONNECTION_FAILED: 3
});
const SECTIONS = Object.freeze({
	GOOD: 'good',
	BAD: 'bad',
	ACTION: 'action'
});
const SECTION_COLLECTION_MAP = Object.freeze({
	'good': 'good',
	'bad': 'bad',
	'action': 'actions'
});
const ACTIONS = Object.freeze({
	SET_TITLE: 'set_title',
	SET_VOTE_MODE: 'set_vote_mode',
	SET_ACCESS_KEY: 'set_access_key',
	
	ADD_GOOD: 'add_good',
	UPDATE_GOOD: 'update_good',
	DELETE_GOOD: 'delete_good',
	UPVOTE_GOOD: 'upvote_good',
	DOWNVOTE_GOOD: 'downvote_good',
	
	ADD_BAD: 'add_bad',
	UPDATE_BAD: 'update_bad',
	DELETE_BAD: 'delete_bad',
	UPVOTE_BAD: 'upvote_bad',
	DOWNVOTE_BAD: 'downvote_bad',
	
	ADD_ACTION: 'add_action',
	UPDATE_ACTION: 'update_action',
	DELETE_ACTION: 'delete_action',
	UPVOTE_ACTION: 'upvote_action',
	DOWNVOTE_ACTION: 'downvote_action',

	ADD_COMMENT: 'add_comment',
	UPDATE_COMMENT: 'update_comment',
	DELETE_COMMENT: 'delete_comment'
})

module.exports = {
	TEXT_MAX_LENGTH,
	TITLE_MAX_LENGTH,
	VOTE_MODES,
	EXIT_CODES,
	SECTIONS,
	ACTIONS,
	SECTION_COLLECTION_MAP
};
