const Database = require('better-sqlite3');
const path = require('node:path');

const DB_PATH = path.join(process.cwd(), 'data', 'tasks.db');
const db = new Database(DB_PATH);

const id = '1770276477628-n3iz50i';

const row = db.prepare('SELECT id, status, additional_comments FROM tasks WHERE id = ?').get(id);
if (!row) {
  console.error('Task not found');
  process.exit(1);
}

const comment = 'TanStack DataTable is implemented as a reusable component and fully wired into /tasks, with client-side sorting, filtering, and pagination. UI kept compact with status badges and truncated text.';

const stmt = db.prepare('UPDATE tasks SET additional_comments = ? WHERE id = ?');
stmt.run(comment, id);

const updated = db.prepare('SELECT id, status, additional_comments FROM tasks WHERE id = ?').get(id);
console.log(updated);