/**
 * Simple JSON-file database using lowdb.
 *
 * We use lowdb instead of SQLite because SQLite drivers rely on native
 * (compiled) bindings, which don't run inside bolt.new's browser-based
 * WebContainer. lowdb is pure JavaScript, so it works everywhere.
 */

const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const path = require("path");

const file = path.join(__dirname, "eventhub.json");
const adapter = new JSONFile(file);
const defaultData = { attendees: [] };

const db = new Low(adapter, defaultData);

async function initDb() {
  await db.read();
  db.data ||= defaultData;
  await db.write();
}

async function getDb() {
  await db.read();
  db.data ||= defaultData;
  return db;
}

module.exports = { getDb, initDb };
