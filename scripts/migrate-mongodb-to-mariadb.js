#!/usr/bin/env node
/**
 * One-off migration of retrospective data from MongoDB into MariaDB.
 *
 * Run it manually, once, with the API stopped:
 *
 *     npm install --include=dev
 *     MONGO_HOST=... DB_HOST=... npm run migrate
 *
 * The MariaDB connection is taken from the same environment variables the API
 * uses (DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD or
 * DB_CONNECTION_STRING). The MongoDB connection is taken from MONGO_HOST,
 * MONGO_PORT, MONGO_DB, MONGO_USERNAME, MONGO_PASSWORD or
 * MONGO_CONNECTION_STRING, which default to what the API used to use.
 *
 * Every retrospective that is migrated is rewritten from scratch: its items,
 * comments and action log entries in MariaDB are replaced by the ones found in
 * MongoDB. Retrospectives that only exist in MariaDB are left alone. That makes
 * the script safe to re-run, but it also means anything written to MariaDB
 * after a migration is lost if the same retrospective is migrated again.
 *
 * Flags:
 *   --dry-run   Read everything and report what would happen, write nothing.
 *   --quiet     Only report the summary.
 */

const crypto = require('crypto');
const {v4: uuid} = require('uuid');
const {MongoClient} = require('mongodb');

const database = require('../database');
const {SECTIONS, SECTION_COLLECTION_MAP} = require('../constants');

const RETRO_COLLECTION = 'retro';
const ACTION_COLLECTION = 'actions';
const PROGRESS_INTERVAL = 100;

const DRY_RUN = process.argv.includes('--dry-run');
const QUIET = process.argv.includes('--quiet');

const mongoConfig = {
	host: process.env.MONGO_HOST || process.env.DB_HOST || 'localhost',
	port: process.env.MONGO_PORT || 27017,
	name: process.env.MONGO_DB || process.env.DB_NAME || 'sprint-retrospective',
	username: process.env.MONGO_USERNAME || 'root',
	password: process.env.MONGO_PASSWORD || 'root',
	connectionString: process.env.MONGO_CONNECTION_STRING
};

const mongoConnectionString = mongoConfig.connectionString ||
	`mongodb://${encodeURIComponent(mongoConfig.username)}:${encodeURIComponent(mongoConfig.password)}` +
	`@${mongoConfig.host}:${mongoConfig.port}/${mongoConfig.name}?authSource=admin`;

const log = (...args) => !QUIET && console.log(...args);

const objectId = value => /^[0-9a-f]{24}$/.test(String(value)) ?
	String(value) :
	crypto.randomBytes(12).toString('hex');

const asNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

const asTimestamp = value => {
	if (value instanceof Date) {
		return value;
	}

	const date = new Date(value ?? Date.now());

	return Number.isNaN(date.valueOf()) ? new Date() : date;
};

const itemsOf = (retro, section) => {
	const items = retro[SECTION_COLLECTION_MAP[section]];

	return Array.isArray(items) ? items : [];
};

const hasSection = (retro, section) => Array.isArray(retro[SECTION_COLLECTION_MAP[section]]);

const migrateRetro = (connection, retro, actions) => {
	const rows = {
		items: [],
		comments: []
	};

	Object.values(SECTIONS).forEach(section => itemsOf(retro, section).forEach(item => {
		const itemId = item.id || uuid();

		rows.items.push([
			itemId,
			retro.id,
			section,
			String(item.text ?? ''),
			asNumber(item.up),
			asNumber(item.down),
			Array.isArray(item.comments) ? 1 : 0
		]);

		(Array.isArray(item.comments) ? item.comments : []).forEach(comment => rows.comments.push([
			comment.id || uuid(),
			itemId,
			String(comment.text ?? '')
		]));
	}));

	const actionRows = actions.map(action => [
		action.id || uuid(),
		retro.id,
		action.itemId ?? null,
		String(action.action ?? ''),
		asTimestamp(action.timestamp)
	]);

	if (DRY_RUN) {
		return Promise.resolve({
			items: rows.items.length,
			comments: rows.comments.length,
			actions: actionRows.length
		});
	}

	return connection.beginTransaction()
		.then(() => connection.query(
			`INSERT INTO retro (id, object_id, title, vote_mode, access_key, last_update,
								has_good, has_bad, has_actions)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			 ON DUPLICATE KEY UPDATE object_id = VALUES(object_id),
									 title = VALUES(title),
									 vote_mode = VALUES(vote_mode),
									 access_key = VALUES(access_key),
									 last_update = VALUES(last_update),
									 has_good = VALUES(has_good),
									 has_bad = VALUES(has_bad),
									 has_actions = VALUES(has_actions)`,
			[
				retro.id,
				objectId(retro._id),
				retro.title ?? null,
				retro.voteMode ?? null,
				retro.accessKey ?? null,
				retro.lastUpdate === undefined || retro.lastUpdate === null ?
					null :
					asNumber(retro.lastUpdate, null),
				hasSection(retro, SECTIONS.GOOD) ? 1 : 0,
				hasSection(retro, SECTIONS.BAD) ? 1 : 0,
				hasSection(retro, SECTIONS.ACTION) ? 1 : 0
			]))
		// Comments are removed along with their items by the foreign key.
		.then(() => connection.query(`DELETE FROM retro_item WHERE retro_id = ?`, [retro.id]))
		.then(() => connection.query(`DELETE FROM retro_action WHERE retro_id = ?`, [retro.id]))
		.then(() => rows.items.length && connection.batch(
			`INSERT INTO retro_item (id, retro_id, section, text, up, down, has_comments)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			rows.items))
		.then(() => rows.comments.length && connection.batch(
			`INSERT INTO retro_item_comment (id, item_id, text) VALUES (?, ?, ?)`,
			rows.comments))
		.then(() => actionRows.length && connection.batch(
			`INSERT INTO retro_action (id, retro_id, item_id, action, \`timestamp\`)
			 VALUES (?, ?, ?, ?, ?)`,
			actionRows))
		.then(() => connection.commit())
		.then(() => ({
			items: rows.items.length,
			comments: rows.comments.length,
			actions: actionRows.length
		}))
		.catch(err => connection.rollback().catch(() => {}).then(() => {
			throw err;
		}));
};

const run = () => {
	log(`Reading from MongoDB at ${mongoConfig.host}:${mongoConfig.port}/${mongoConfig.name}.`);

	return Promise.all([
		MongoClient.connect(mongoConnectionString),
		database()
	]).then(([mongoClient, pool]) => {
		const mongo = mongoClient.db(mongoConfig.name);

		return Promise.all([
			mongo.collection(RETRO_COLLECTION).find({}).toArray(),
			mongo.collection(ACTION_COLLECTION).find({}).toArray()
		]).then(([retros, actions]) => {
			const actionsByRetro = actions.reduce((acc, action) => ({
				...acc,
				[action.retroId]: [...(acc[action.retroId] || []), action]
			}), {});

			log(`Found ${retros.length} retrospectives and ${actions.length} action log entries.`);

			if (DRY_RUN) {
				log('Running as a dry run, nothing will be written.');
			}

			const totals = {retros: 0, items: 0, comments: 0, actions: 0};
			const failures = [];

			return pool.getConnection().then(connection => retros.reduce(
				(promise, retro, index) => promise.then(() => {
					if (!retro.id) {
						failures.push({id: String(retro._id), error: 'Retrospective has no id.'});
						return;
					}

					return migrateRetro(connection, retro, actionsByRetro[retro.id] || [])
						.then(counts => {
							totals.retros += 1;
							totals.items += counts.items;
							totals.comments += counts.comments;
							totals.actions += counts.actions;

							if ((index + 1) % PROGRESS_INTERVAL === 0) {
								log(`Migrated ${index + 1}/${retros.length} retrospectives...`);
							}
						})
						.catch(err => failures.push({id: retro.id, error: err.message}));
				}),
				Promise.resolve())
				.finally(() => connection.release())
				.then(() => ({totals, failures, expected: retros.length})))
				.finally(() => mongoClient.close());
		});
	});
};

run().then(({totals, failures, expected}) => {
	console.log(`Migrated ${totals.retros}/${expected} retrospectives, ` +
		`${totals.items} items, ${totals.comments} comments and ${totals.actions} action log entries.`);

	if (failures.length) {
		console.error(`${failures.length} retrospectives could not be migrated:`);
		failures.forEach(({id, error}) => console.error(`  ${id}: ${error}`));
	}

	process.exit(failures.length ? 1 : 0);
}).catch(err => {
	console.error('Migration failed.', err);

	process.exit(1);
});
