// Script to initialize quizifycs.db using init_db.sql
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../quizifycs.db');
const sqlPath = path.resolve(__dirname, 'init_db.sql');

const schema = fs.readFileSync(sqlPath, 'utf8');
const db = new sqlite3.Database(dbPath);

db.exec(schema, (err) => {
  if (err) {
    console.error('Failed to initialize database:', err.message);
  } else {
    ('Database initialized successfully from init_db.sql.');
  }
  db.close();
});
