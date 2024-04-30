require('dotenv').config();

const express = require('express');
const app = express();
const { createHmac } = require('crypto');
const bodyParser = require('body-parser');
const { updateScore, getPlayerScore, assignWalletAddress } = require('./db-queries');
const jwt = require('jsonwebtoken');

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect('/public');
});

app.listen(3000, () => {
  console.log('Server running at http://127.0.0.1:3000/');
});

function HMAC_SHA256(key, secret) {
  return createHmac('sha256', key).update(secret);
}

function getCheckString(data) {
  const items = [];

  for (const [k, v] of data.entries()) if (k !== 'hash') items.push([k, v]);

  return items
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

app.use(bodyParser.text());
app.use((req, res, next) => {
  const domain = req.headers.host;
  if (domain !== process.env.WEB_APP_URL_TEST) {
    return res.status(403).json({ error: 'Unauthorized domain' });
  }
  next();
});

app.post('/update-score', (req, res) => {
  const response = JSON.parse(req.body);
  const userData = new URLSearchParams(response.user);

  const data_check_string = getCheckString(userData);
  const secret_key = HMAC_SHA256('WebAppData', process.env.BOT_TOKEN).digest();
  const hash = HMAC_SHA256(secret_key, data_check_string).digest('hex');

  if (hash === userData.get('hash')) {
    const userId = JSON.parse(userData.get('user')).id;

    updateScore(userId)
      .then(() => {
        res.status(200).json({});
      })
      .catch(err => {
        console.error(err.message);
        res.status(500).json({ error: 'Internal server error' });
      });
  } else {
    return res.status(401).json({ 'invalid request': 'invalid hash' });
  }
});

app.get('/player', (req, res) => {
  const userId = req.query.user_id;

  getPlayerScore(userId)
    .then(score => {
      return res.status(200).json({ score: score });
    })
    .catch(err => {
      console.error(err.message);
      res.status(500).json({ error: 'Internal server error' });
    });
});

app.post('/assignWalletAddress', async (req, res) => {
  const result = JSON.parse(req.body);
  const userId = result.user_id;
  const walletAddress = result.address;

  try {
    const db = await assignWalletAddress(userId, walletAddress);
    if (db) {
      const token = jwt.sign({ ton_auth: walletAddress, user_id: userId }, process.env.SECRET_KEY);
      res.status(200).json({ token: token });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
