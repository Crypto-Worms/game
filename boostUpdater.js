import { bot, Markup, WEB_APP_URL } from './bot.js';
import db from './backend/db.js';

function logMessageSent(userId, success) {
  const sql = `
    UPDATE boosts SET last_message_date = ?, message_delivered = ?
    WHERE player_id = ?;
  `;
  const now = new Date().toISOString();
  const params = [now, success, userId];
  db.run(sql, params, err => {
    if (err) {
      console.error('Error updating the database:', err);
    }
  });
}

function logBotBlockedByUser(userId) {
  const sql = `
    UPDATE players SET is_deactivated = TRUE
    WHERE player_id = ?;
  `;
  db.run(sql, [userId], err => {
    if (err) {
      console.error('Error updating the database:', err);
    }
  });
}

function getEligibleUsers() {
  return new Promise((resolve, reject) => {
    const sqlSelect = `
      SELECT player_id
      FROM boosts
      WHERE daily_boost_count < 3 AND (julianday('now') - julianday(last_boost_time)) > 0.5;
    `;

    const sqlUpdate = `
      UPDATE boosts
      SET daily_boost_count = 3, last_boost_time = datetime('now')
      WHERE player_id = ?;
    `;

    db.all(sqlSelect, [], (err, rows) => {
      if (err) {
        console.error('Error getting users from the database:', err);
        reject(err);
      } else {
        console.log('Users have been received to update the boosts:', rows);

        const updatePromises = rows.map(
          row =>
            new Promise((resolveUpdate, rejectUpdate) => {
              db.run(sqlUpdate, [row.player_id], updateErr => {
                if (updateErr) {
                  console.error(
                    'Error when updating user boosts:',
                    row.player_id,
                    updateErr
                  );
                  rejectUpdate(updateErr);
                } else {
                  resolveUpdate(row.player_id);
                }
              });
            })
        );

        Promise.all(updatePromises)
          .then(updatedPlayers => {
            resolve(updatedPlayers);
          })
          .catch(updateErr => {
            reject(updateErr);
          });
      }
    });
  });
}

const sendMessageQueue = [];
const MESSAGE_SENDING_INTERVAL = 200;

function sendMessageToUser(userId) {
  return bot.telegram.sendMessage(
    userId,
    'Hey there! Your boost is ready, so get back to the game and claim your $worms!',
    {
      reply_markup: {
        inline_keyboard: [
          [
            Markup.button.webApp(
              'Play 🚀',
              WEB_APP_URL + '/?campaign=boost_ready'
            ),
          ],
        ],
      },
    }
  );
}

function processQueue() {
  if (sendMessageQueue.length > 0) {
    const userId = sendMessageQueue.shift();

    sendMessageToUser(userId)
      .then(() => {
        logMessageSent(userId, true);
      })
      .catch(error => {
        if (error.code === 403) {
          logBotBlockedByUser(userId);
        } else {
          console.error('Error sending message to user:', userId, error);
        }
      })
      .finally(() => {
        setTimeout(processQueue, MESSAGE_SENDING_INTERVAL);
      });
  }
}

getEligibleUsers()
  .then(userIds => {
    console.log(userIds);
    sendMessageQueue.push(...userIds);
    processQueue();
  })
  .catch(error => {
    console.error('Error getting eligible users:', error);
  });
