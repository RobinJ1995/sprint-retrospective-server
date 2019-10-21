const TEXT_MAX_LENGTH = 1024;
const TITLE_MAX_LENGTH = 128;
const VOTE_MODES = Object.freeze({
  NONE: 'none',
  UPVOTE: 'up',
  UPVOTE_DOWNVOTE: 'updown'
});

module.exports = {
  TEXT_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  VOTE_MODES
};
