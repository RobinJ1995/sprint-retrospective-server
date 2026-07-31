# Migrating from MongoDB to MariaDB

The API stores its data in MariaDB. Retrospectives that still live in a MongoDB
instance can be moved across once with `scripts/migrate-mongodb-to-mariadb.js`.

## Before you start

The MongoDB driver is only needed for the migration, so it is a development
dependency and is not present in the Docker image. Install it first:

```sh
npm install --include=dev
```

Stop the API before migrating, so that nothing writes to either database while
the data is being copied.

## Running the migration

The MariaDB connection is taken from the same environment variables the API
uses, and the MongoDB connection from `MONGO_*` variables that default to what
the API used to use:

| Variable                  | Default                | Description                       |
|---------------------------|------------------------|-----------------------------------|
| `DB_HOST`                 | `localhost`            | MariaDB host                      |
| `DB_PORT`                 | `3306`                 | MariaDB port                      |
| `DB_NAME`                 | `sprint-retrospective` | MariaDB database                  |
| `DB_USERNAME`             | `root`                 | MariaDB user                      |
| `DB_PASSWORD`             | `root`                 | MariaDB password                  |
| `DB_CONNECTION_STRING`    | -                      | `mariadb://user:pass@host:port/db`, overrides the five above |
| `MONGO_HOST`              | `DB_HOST`              | MongoDB host                      |
| `MONGO_PORT`              | `27017`                | MongoDB port                      |
| `MONGO_DB`                | `DB_NAME`              | MongoDB database                  |
| `MONGO_USERNAME`          | `root`                 | MongoDB user                      |
| `MONGO_PASSWORD`          | `root`                 | MongoDB password                  |
| `MONGO_CONNECTION_STRING` | -                      | Overrides the five above          |

Check what would happen first:

```sh
MONGO_HOST=old-mongo DB_HOST=new-mariadb npm run migrate -- --dry-run
```

Then run it for real:

```sh
MONGO_HOST=old-mongo DB_HOST=new-mariadb npm run migrate
```

The script creates the tables if they are not there yet, so an empty database is
enough. It reports how many retrospectives, items, comments and action log
entries it moved, and exits with a non-zero status if any retrospective failed.
Failures are reported per retrospective and do not stop the rest of the run.

## What it does

Each retrospective is rewritten from scratch: its items, comments and action log
entries in MariaDB are replaced with the ones found in MongoDB. Retrospectives
that only exist in MariaDB are left alone.

That makes the script safe to re-run, but it also means that anything written to
MariaDB after a migration is lost if the same retrospective is migrated again.
Migrate once, with the API stopped.

Identifiers are carried across unchanged, including the document ids that the
API exposes as `_id`, so links and bookmarks keep working.

## Schema

The tables are created automatically on the first connection, so no manual
schema step is needed:

| Table                | Holds                                                     |
|----------------------|-----------------------------------------------------------|
| `retro`              | one row per retrospective: title, vote mode, access key    |
| `retro_item`         | the good, bad and action items, ordered by `seq`           |
| `retro_item_comment` | the comments on an item, ordered by `seq`                  |
| `retro_action`       | the action log served by the `_actions` admin endpoint     |

Item and comment text is stored with the `utf8mb4_bin` collation and compared
byte for byte, so duplicate detection stays case sensitive and does not ignore
trailing whitespace, exactly as it did before.
