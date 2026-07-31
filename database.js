const mariadb = require('mariadb');
const {EXIT_CODES} = require('./constants');

const config = require('./config').db;

const SCHEMA = [
	`CREATE TABLE IF NOT EXISTS retro (
		id VARCHAR(255) NOT NULL,
		object_id CHAR(24) NOT NULL,
		title TEXT DEFAULT NULL,
		vote_mode VARCHAR(32) DEFAULT NULL,
		access_key TEXT DEFAULT NULL,
		last_update BIGINT DEFAULT NULL,
		has_good TINYINT(1) NOT NULL DEFAULT 0,
		has_bad TINYINT(1) NOT NULL DEFAULT 0,
		has_actions TINYINT(1) NOT NULL DEFAULT 0,
		PRIMARY KEY (id)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`,

	`CREATE TABLE IF NOT EXISTS retro_item (
		seq BIGINT NOT NULL AUTO_INCREMENT,
		id VARCHAR(255) NOT NULL,
		retro_id VARCHAR(255) NOT NULL,
		section ENUM('good', 'bad', 'action') NOT NULL,
		text TEXT NOT NULL,
		up INT NOT NULL DEFAULT 0,
		down INT NOT NULL DEFAULT 0,
		has_comments TINYINT(1) NOT NULL DEFAULT 0,
		PRIMARY KEY (seq),
		UNIQUE KEY uq_retro_item_id (id),
		-- Ordered by seq so that listing a retrospective's items needs no sort.
		KEY ix_retro_item_retro_seq (retro_id, seq),
		CONSTRAINT fk_retro_item_retro FOREIGN KEY (retro_id) REFERENCES retro (id) ON DELETE CASCADE
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`,

	`CREATE TABLE IF NOT EXISTS retro_item_comment (
		seq BIGINT NOT NULL AUTO_INCREMENT,
		id VARCHAR(255) NOT NULL,
		item_id VARCHAR(255) NOT NULL,
		text TEXT NOT NULL,
		PRIMARY KEY (seq),
		KEY ix_retro_item_comment_id (id),
		KEY ix_retro_item_comment_item (item_id, seq),
		CONSTRAINT fk_retro_item_comment_item FOREIGN KEY (item_id) REFERENCES retro_item (id) ON DELETE CASCADE
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`,

	`CREATE TABLE IF NOT EXISTS retro_action (
		seq BIGINT NOT NULL AUTO_INCREMENT,
		id VARCHAR(255) NOT NULL,
		retro_id VARCHAR(255) NOT NULL,
		item_id VARCHAR(255) DEFAULT NULL,
		action VARCHAR(64) NOT NULL,
		\`timestamp\` DATETIME(3) NOT NULL,
		PRIMARY KEY (seq),
		KEY ix_retro_action_id (id),
		KEY ix_retro_action_retro (retro_id, seq)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`
];

// Brings the indexes of a database that was created by an earlier version of
// the schema above into line with it. Both statements are no-ops on a database
// the schema above has just created, and on one that has already been brought
// into line. The index is created before the one it replaces is dropped, so
// that retro_id always stays indexed for the foreign key.
const INDEXES = [
	`CREATE INDEX IF NOT EXISTS ix_retro_item_retro_seq ON retro_item (retro_id, seq)`,
	`DROP INDEX IF EXISTS ix_retro_item_retro ON retro_item`
];

const pool = mariadb.createPool({
	...(config.connectionString ? {
		connectionString: config.connectionString
	} : {
		host: config.host,
		port: Number(config.port),
		user: config.username,
		password: config.password,
		database: config.name
	}),
	// BIGINT columns are handed out as regular numbers so that they serialise to
	// JSON the same way they did when they were stored as BSON numbers.
	bigIntAsNumber: true,
	insertIdAsNumber: true,
	connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
	charset: 'utf8mb4',
	collation: 'utf8mb4_bin'
});

const createSchema = conn => [...SCHEMA, ...INDEXES].reduce(
	(promise, statement) => promise.then(() => conn.query(statement)),
	Promise.resolve());

let connection = null;

module.exports = () => {
	if (connection) {
		return connection;
	}

	connection = pool.getConnection()
		.then(conn => createSchema(conn).finally(() => conn.release()))
		.then(() => {
			console.log(`Database connection established (${config.host}:${config.port}).`);

			return pool;
		}).catch(ex => {
			console.error('Database connection failed.', ex);

			process.exit(EXIT_CODES.DATABASE_CONNECTION_FAILED);
		});

	return connection;
}
