import db from './db.js';

function updatePlayerScore(userId, score) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT score FROM players WHERE player_id = ?',
      [userId],
      function (err, row) {
        if (err) {
          console.error(err.message);
          reject(err);
          return;
        }

        if (row) {
          db.run(
            'UPDATE players SET score = score + ? WHERE player_id = ?',
            [score, userId],
            function (err) {
              if (err) {
                console.error(err.message);
                reject(err);
              } else {
                db.get(
                  'SELECT score FROM players WHERE player_id = ?',
                  [userId],
                  function (err, updatedRow) {
                    if (err) {
                      console.error(err.message);
                      reject(err);
                    } else {
                      console.log(
                        `Player with ID: ${userId} now has a score of ${updatedRow.score}`
                      );
                      resolve(updatedRow.score);
                    }
                  }
                );
              }
            }
          );
        } else {
          console.error(`Player with ID: ${userId} not found.`);
          reject(new Error(`Player not found.`));
        }
      }
    );
  });
}
function getPlayer(userId, username, firstName, languageCode, last_auth_date) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE players SET player_name = ?, first_name = ?, language_code = ?, last_login_at = ? WHERE player_id = ?',
      [username, firstName, languageCode, last_auth_date, userId],
      function (updateErr) {
        if (updateErr) {
          console.log(updateErr);
          return reject(updateErr);
        }
        db.get(
          `SELECT p.score, p.is_referral, p.player_name, p.first_name, b.daily_boost_count 
           FROM players AS p
           LEFT JOIN boosts AS b ON p.player_id = b.player_id
           WHERE p.player_id = ?`,
          [userId],
          (selectErr, updatedRow) => {
            if (selectErr) {
              console.log(selectErr);
              return reject(selectErr);
            }

            console.log(`Player data updated: ${JSON.stringify(updatedRow)}`);
            resolve(updatedRow);
          }
        );
      }
    );
  });
}

function addPlayerToBoostsTableIfNotExists(playerId) {
  return new Promise((resolve, reject) => {
    const insertQuery = `
      INSERT INTO boosts (player_id)
      VALUES (?);
    `;

    db.run(insertQuery, [playerId], function (err) {
      if (err) {
        console.log(err);
        return reject(err);
      }

      resolve();
    });
  });
}
function checkReferralExists(referrerUserId, referredUserId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM referrals WHERE ReferrerUserID = ? AND ReferredUserID = ?`,
      [referrerUserId, referredUserId],
      (err, row) => {
        if (err) {
          reject(err);
        }
        if (row) {
          reject(new Error('There is already this referral.'));
        }
        resolve();
      }
    );
  });
}

function getReferralList(referrerUserId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT ReferredUserID FROM referrals WHERE ReferrerUserID = ?`,
      [referrerUserId],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

function getReferredData(userIds) {
  return new Promise((resolve, reject) => {
    const placeholders = userIds.map(() => '?').join(',');
    const query = `SELECT * FROM players WHERE player_id IN (${placeholders})`;

    db.all(query, userIds, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function insertReferral(referrerUserId, referredUserId, referralCode) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO referrals (ReferrerUserID, ReferredUserID, InitialReferralBonus, ReferralCode) VALUES (?, ?, ?, ?)',
      [referrerUserId, referredUserId, 2500, referralCode],
      function (insertErr) {
        if (insertErr) {
          reject(insertErr);
        } else {
          db.run(
            'UPDATE players SET is_referral = 1 WHERE player_id = ?',
            [referredUserId],
            function (updateErr) {
              if (updateErr) {
                reject(updateErr);
              } else {
                resolve(`A row has been inserted with rowid ${referredUserId}`);
              }
            }
          );
        }
      }
    );
  });
}

function getStats() {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT  COUNT(id) AS count_players,  MAX(score) AS max_score, (SELECT COUNT(*) FROM players WHERE DATE(created_at) = DATE('now')) AS registered_today  FROM  players;",
      (err, row) => {
        if (err) {
          reject(err);
        }
        resolve(row);
      }
    );
  });
}

function claimedBonus(referredUserId) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE referrals SET BonusClaimed = 1, BonusClaimedDate = CURRENT_TIMESTAMP WHERE ReferredUserID = ?',
      [referredUserId],
      function (updateErr) {
        if (updateErr) {
          reject(updateErr);
        } else {
          db.get(
            'SELECT ReferrerUserID FROM referrals WHERE ReferredUserID = ?',
            [referredUserId],
            function (err, row) {
              if (err) {
                console.error(err.message);
                reject(err);
              } else {
                console.log(`Refferer updatedRow: ${row}`);
                resolve(row);
              }
            }
          );
        }
      }
    );
  });
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

function checkPlayerExists(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT 1 FROM players WHERE player_id = ?',
      [userId],
      (err, row) => {
        if (err) {
          reject(err);
        }
        if (row) {
          resolve(true);
        }
        resolve(false);
      }
    );
  });
}

function insertPlayer(userId, username, firstName, language_code) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO players (player_id, player_name, first_name, language_code) VALUES (?, ?, ?, ?)',
      [userId, username, firstName, language_code],
      err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

function beginTransaction() {
  return new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION;', err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function getUserBoost(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT daily_boost_count, last_boost_time FROM boosts WHERE player_id = ?',
      [userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

function updateUserBoost(userId, currentTime) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE boosts 
       SET last_boost_time = ?, 
           daily_boost_count = daily_boost_count - 1
       WHERE player_id = ?`,
      [currentTime.toISOString(), userId],
      function (row, err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

function commitTransaction() {
  return new Promise((resolve, reject) => {
    db.run('COMMIT;', err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function rollbackTransaction() {
  return new Promise((resolve, reject) => {
    db.run('ROLLBACK;', err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export {
  updatePlayerScore,
  getPlayer,
  assignWalletAddress,
  checkPlayerExists,
  insertPlayer,
  checkReferralExists,
  insertReferral,
  claimedBonus,
  getReferralList,
  getReferredData,
  getStats,
  addPlayerToBoostsTableIfNotExists,
  beginTransaction,
  getUserBoost,
  updateUserBoost,
  commitTransaction,
  rollbackTransaction,
};

process.on('SIGINT', () => {
  db.close(err => {
    if (err) {
      console.error('Error closing the database:', err.message);
    } else {
      console.log('The connection to the database is closed');
    }
    process.exit();
  });
});
