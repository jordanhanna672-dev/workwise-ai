'use strict';
/**
 * Very small JSON-file "database".
 *
 * Why not Postgres for the alpha?
 * The team's target stack (see README) is PostgreSQL, but that requires
 * installing and configuring a database server before a grader / teammate
 * can even run the app once. For an alpha whose job is to prove the
 * concept end-to-end, we swap in a zero-install JSON file that has the
 * exact same shape a real "tasks" table would have. Moving to Postgres
 * later means writing a repository with the same function signatures
 * below (getAll, getById, insert, update, remove) backed by SQL instead
 * of a file - nothing above this module has to change.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function readAll() {
  ensureStore();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw || '[]');
  } catch (err) {
    // A corrupted data file shouldn't crash the whole app.
    return [];
  }
}

function writeAll(tasks) {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

let idCounter = null;
function nextId(tasks) {
  if (idCounter === null) {
    idCounter = tasks.reduce((max, t) => Math.max(max, t.id || 0), 0);
  }
  idCounter += 1;
  return idCounter;
}

function getAll() {
  return readAll();
}

function getById(id) {
  return readAll().find((t) => t.id === Number(id)) || null;
}

function insert(task) {
  const tasks = readAll();
  const record = Object.assign({}, task, { id: nextId(tasks) });
  tasks.push(record);
  writeAll(tasks);
  return record;
}

function update(id, patch) {
  const tasks = readAll();
  const idx = tasks.findIndex((t) => t.id === Number(id));
  if (idx === -1) return null;
  tasks[idx] = Object.assign({}, tasks[idx], patch, { id: tasks[idx].id });
  writeAll(tasks);
  return tasks[idx];
}

function remove(id) {
  const tasks = readAll();
  const next = tasks.filter((t) => t.id !== Number(id));
  const changed = next.length !== tasks.length;
  if (changed) writeAll(next);
  return changed;
}

function resetForTests(tasks = []) {
  idCounter = null;
  writeAll(tasks);
}

module.exports = { getAll, getById, insert, update, remove, resetForTests, DATA_FILE };
