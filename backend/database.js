const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the main database with questions
const dbPath = path.join(__dirname, 'quizifycs.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    db.run('PRAGMA foreign_keys = ON;', [], (fkErr) => {
      if (fkErr) {
        console.error('Failed to enable foreign key enforcement:', fkErr);
      } else {
        db.get('PRAGMA foreign_keys;', [], (checkErr, row) => {
          if (checkErr) {
            console.error('Error checking foreign key status:', checkErr);
          } else {
            ('SQLite foreign key enforcement is', row.foreign_keys ? 'ON' : 'OFF');
          }
        });
      }
    });
  }
});

module.exports = db;
