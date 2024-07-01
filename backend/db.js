import sqlite3 from 'sqlite3';

sqlite3.verbose();

const dbPath = 'db/game.db';

const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error('Error opening the database:', err.message);
  } else {
    console.log('The database is connected');
    db.run('PRAGMA journal_mode=WAL;');
  }
});

export default db;
