import dotenv from 'dotenv';

import express from 'express';
import jwt from 'jsonwebtoken';
import { bot, sqids } from '../bot.js';
import bodyParser from 'body-parser';
import { checkTonProof } from './utils/ton-proof.js';
import { HMAC_SHA256, getCheckString } from './utils/telegramProcessing.js';
import db from './db.js';
import {
  updatePlayerScore,
  getPlayer,
  assignWalletAddress,
  claimedBonus,
  getUserBoost,
  updateUserBoost,
} from './db-queries.js';

dotenv.config();

const app = express();

app.disable('x-powered-by');

app.use(express.static('public'));
app.listen(3000, () => {
  console.log('Server running at http://127.0.0.1:3000/');
});

const webhook = await bot.createWebhook({
  domain: process.env.WEB_APP_URL,
  drop_pending_updates: true,
});
app.post(`/telegraf/${bot.secretPathComponent()}`, webhook);

app.use(bodyParser.text());
app.use((req, res, next) => {
  const domain = req.headers.host;

  if (domain !== process.env.WEB_APP_URL) {
    return res.status(403).json({ error: 'Unauthorized domain' });
  }
  next();
});

app.post('/generatePayload', async (req, res) => {
  try {
    const userId = req.body.user_id;

    const payload = jwt.sign({ user_id: userId }, process.env.SECRET_KEY);

    res.status(200).json({ payload: payload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/check-proof', async (req, res) => {
  try {
    const { wallet, proof, user_id } = JSON.parse(req.body);

    const proofChecked = await checkTonProof(proof, wallet);

    if (proofChecked.status) {
      await assignWalletAddress(user_id, proofChecked.walletAddress);
      const token = jwt.sign({ user_id: user_id }, process.env.SECRET_KEY);
      res.status(200).json({ token: token });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((req, res, next) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1] || null;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
});

app.post('/activate-boost', async (req, res) => {
  const userId = req.user.user_id;

  try {
    const row = await getUserBoost(userId);

    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (row.daily_boost_count > 0) {
      const currentTime = new Date();
      await updateUserBoost(userId, currentTime);

      const { daily_boost_count } = await getUserBoost(userId);

      return res.json({ boost: true, boost_count: daily_boost_count });
    } else {
      return res.json({ boost: false, boost_count: 0 });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-score', async (req, res) => {
  const response = JSON.parse(req.body);
  const userData = new URLSearchParams(response.user);
  const isReferral = response.is_referral;
  const isBoost = response.boost;

  const data_check_string = getCheckString(userData);
  const secret_key = HMAC_SHA256('WebAppData', process.env.BOT_TOKEN).digest();
  const hash = HMAC_SHA256(secret_key, data_check_string).digest('hex');

  if (userData.get('hash') !== hash) {
    return res.status(401).json({ 'invalid request': 'invalid hash' });
  }

  const userId = JSON.parse(userData.get('user'))?.id;

  let scoreRate = 1;

  if (isBoost) {
    const { last_boost_time } = await getUserBoost(userId);
    const currentTime = new Date();
    const lastBoostTime = new Date(last_boost_time);
    const timeDifference = currentTime - lastBoostTime;

    const fifteenSeconds = 15 * 1000;

    if (timeDifference >= fifteenSeconds) {
      scoreRate = 1;
    } else {
      scoreRate = 5;
    }
  }

  const score = await updatePlayerScore(userId, scoreRate);

  if (isReferral && score === 200) {
    const data = await claimedBonus(userId);
    const referralUser = await getPlayer(userId);

    const bonusAmountForReferral = 2500;
    await updatePlayerScore(data.ReferrerUserID, bonusAmountForReferral);

    bot.telegram.sendMessage(
      data.ReferrerUserID,
      `🎁 Congratulations! You've just earned ${bonusAmountForReferral} $worm! Congratulations! Thanks to your friend ${referralUser.player_name}`
    );

    const bonusAmountForReferred = 2500;
    await updatePlayerScore(userId, bonusAmountForReferred);
    bot.telegram.sendMessage(
      userId,
      `🎁 Congratulations! You've just earned ${bonusAmountForReferred} $worm for reaching 200 points!`
    );
  }

  return res.status(200).json({ score: score });
});

app.post('/player', async (req, res) => {
  const userId = req.user.user_id;
  const { user, auth_date } = JSON.parse(req.body);

  if (!userId) {
    res.status(404).json({ error: 'User not found' });
  }

  await getPlayer(
    userId,
    user.first_name,
    user.username,
    user.language_code,
    auth_date
  )
    .then(data => {
      return res
        .status(200)
        .json(Object.assign({}, { referral_id: sqids.encode([userId]) }, data));
    })
    .catch(err => {
      console.error(err.message);
      res.status(500).json({ error: 'Internal server error' });
    });
});

process.once('SIGINT', () => {
  console.log('SIGINT received. Stopping the server...');
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
});

process.once('SIGTERM', () => {
  console.log('SIGTERM received. Stopping the server...');
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
