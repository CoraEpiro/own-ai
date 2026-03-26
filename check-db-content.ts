import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, 'backend/data.db'));
const rows = db.prepare('SELECT id, message FROM conversation_messages WHERE role="assistant" LIMIT 3').all();

rows.forEach((row: any) => {
  console.log('=== MESSAGE ID:', row.id);
  console.log('RAW CONTENT:', row.message.substring(0, 200));
  console.log('---');
});
