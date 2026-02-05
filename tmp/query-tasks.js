const Database = require('better-sqlite3');
const path = require('node:path');

const DB_PATH = path.join(process.cwd(), 'data', 'tasks.db');
const db = new Database(DB_PATH);

const rows = db.prepare("SELECT id, project, category, status, summary FROM tasks ORDER BY created_at DESC LIMIT 50").all();
for (const row of rows) {
  console.log(`${row.id}\t${row.project || ''}\t${row.category}\t${row.status}\t${row.summary}`);
}
