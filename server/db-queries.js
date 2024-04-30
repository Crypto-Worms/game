const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = 'db/snake-game.db';
const db = new sqlite3.Database(dbPath);

function updateScore(userId) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE players SET score = score + 1 WHERE player_id = ?', [userId], function (err) {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log(`Score updated successfully for player with ID: ${userId}`);
        resolve();
      }
    });
  });
}

function getPlayerScore(userId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT score FROM players WHERE player_id = ?', [userId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.score);
      }
    });
  });
  0;
}

function assignWalletAddress(userId, walletAddress) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.get(
        'SELECT * FROM ton_wallets WHERE ton_auth = ? and user_id = ?',
        [walletAddress, userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            db.run('COMMIT');
            resolve(true);
          } else {
            db.run(
              'INSERT INTO ton_wallets (user_id, ton_auth) VALUES (?, ?)',
              [userId, walletAddress],
              err => {
                if (err) {
                  reject(err);
                } else {
                  db.run('COMMIT');

                  resolve(true);
                }
              }
            );
          }
        }
      );
    });
  });
}

function createNewPlayer(userId) {
  db.run(
    'INSERT INTO players (player_id) SELECT (?) WHERE NOT EXISTS (SELECT 1 FROM players WHERE player_id = ?)',
    [userId, userId],
    err => {
      if (err) {
        console.error('Error inserting user ID:', err.message);
      } else {
        console.log('User ID inserted successfully');
      }
    }
  );
}

process.on('SIGINT', () => {
  db.close(err => {
    if (err) {
      console.error('Ошибка при закрытии базы данных:', err.message);
    } else {
      console.log('Соединение с базой данных закрыто');
    }
    process.exit();
  });
});

module.exports = {
  updateScore,
  getPlayerScore,
  assignWalletAddress,
  createNewPlayer,
};
