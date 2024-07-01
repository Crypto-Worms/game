import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Sqids from 'sqids';

import { Telegraf, Markup } from 'telegraf';

import {
  checkPlayerExists,
  insertPlayer,
  getPlayer,
  checkReferralExists,
  insertReferral,
  getReferralList,
  getReferredData,
  getStats,
  addPlayerToBoostsTableIfNotExists,
} from './backend/db-queries.js';

dotenv.config();

const sqids = new Sqids();

const bot = new Telegraf(process.env.BOT_TOKEN);

const WEB_APP_URL = `https://${process.env.WEB_APP_URL}`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imageUrl = path.resolve(__dirname, process.env.START_IMG_PATH);

const START_PREFIX = 'r_';

const inlineKeyboardItems = [
  [
    Markup.button.url('WormsMap', 'https://telegra.ph/WormsMap-05-07'),
    Markup.button.url(
      'How to Play',
      'https://telegra.ph/How-to-Play-CryptoWorms-05-07'
    ),
  ],
  [Markup.button.url('Join community', 'https://t.me/cryptowormslive')],
  [Markup.button.webApp('Play 🚀', WEB_APP_URL + '/?campaign=menu')],
];

const menu = {
  config: { type: 'commands', text: 'Menu' },
  commands: [
    { command: 'menu', description: 'Show menu' },
    { command: 'score', description: 'Show score' },
    { command: 'invite', description: 'Invite a friend to play' },
    { command: 'frend', description: 'List of friends' },
  ],
};

await bot.telegram.setMyCommands(menu.commands);
await bot.telegram.setChatMenuButton(menu.config);

async function sendMenuContent(ctx, userId) {
  const updatedItems = admins.includes(userId)
    ? [...inlineKeyboardItems, [Markup.button.callback('Stats', 'stats')]]
    : inlineKeyboardItems;

  ctx.replyWithPhoto({ source: imageUrl }, Markup.inlineKeyboard(updatedItems));
}

async function fetchReferralDataAndReply(ctx, userId) {
  try {
    const usersIdList = await getReferralList(userId);
    if (usersIdList.length === 0) {
      ctx.reply("You don't have any friends yet");
      return;
    }
    const userDataList = await getReferredData(
      usersIdList.map(user => user.ReferredUserID)
    );

    ctx.reply(
      `Your friends:\n ${userDataList
        .map(user => `${user.player_name}: ${user.score}`)
        .join('\n ')}`
    );
  } catch (err) {
    console.error(err);
    ctx.reply('Sorry, there was an error processing your request.');
  }
}

const admins = process.env.ADMINS;

async function fetchStatsAndReply(ctx) {
  const userId = ctx.from.id;

  const { count_players, max_score, registered_today } = await getStats();

  if (admins.includes(userId)) {
    ctx.reply(
      `Players: ${count_players}\nMax score: ${max_score}\nRegistered today: ${registered_today}`
    );
  }
}

bot.start(async ctx => {
  const userId = ctx.message.from.id;
  const username = ctx.message.from.username;
  const firstName = ctx.message.from.first_name;
  const language_code = ctx.message.from.language_code;

  if (ctx.message.is_bot) return;

  const playerExists = await checkPlayerExists(userId);

  if (!playerExists) {
    const payload = ctx.payload || '';
    const referralCode = payload.startsWith(START_PREFIX)
      ? payload.slice(START_PREFIX.length, payload.length)
      : null;
    const referrerUserId = referralCode && sqids.decode(referralCode)[0];

    await insertPlayer(userId, username, firstName, language_code);
    await addPlayerToBoostsTableIfNotExists(userId);

    if (referrerUserId) {
      const referralExists = await checkReferralExists(referrerUserId, userId);
      if (!referralExists) {
        await insertReferral(referrerUserId, userId, referralCode);
      }
    }
  }

  await sendMenuContent(ctx);
});

bot.on('inline_query', ctx => {
  const userId = ctx.from.id;
  const encode = sqids.encode([userId]);
  const results = [
    {
      type: 'article',
      id: uuidv4(),
      title: 'Invite to play',
      thumb_url: `${WEB_APP_URL}/images/start_background_thumb.webp`,
      description: 'Tap to invite a friend to play the game!',
      input_message_content: {
        message_text:
          "Hey! Let's play with me a CryptoWorms!\n🎁 +2.5k $worm as a first-time gift",
      },
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Join the game 🚀',
              url: `${process.env.BOT_URL}?start=r_${encode}`,
            },
          ],
        ],
      },
    },
  ];
  ctx.answerInlineQuery(results);
});

bot.action('stats', async ctx => {
  const userId = ctx.from.id;
  const callbackQueryId = ctx.callbackQuery.id;

  const { count_players, max_score, registered_today } = await getStats();

  if (admins.includes(userId)) {
    const message = `Players: ${count_players}\nMax score: ${max_score}\nRegistered today: ${registered_today}`;
    ctx.reply(message);
  }

  ctx.telegram
    .answerCbQuery(callbackQueryId, '', {
      show_alert: false,
    })
    .catch(console.error);
});

bot.command('stats', async ctx => {
  await fetchStatsAndReply(ctx);
});

bot.command('frend', async ctx => {
  const userId = ctx.message.from.id;

  await fetchReferralDataAndReply(ctx, userId);
});
bot.command('menu', ctx => {
  const userId = ctx.message.from.id;
  sendMenuContent(ctx, userId);
});

bot.command('score', async ctx => {
  const userId = ctx.message.from.id;
  const data = await getPlayer(userId);

  ctx.reply(`Your score: ${data.score}`);
});

bot.command('invite', ctx => {
  const userId = ctx.message.from.id;
  const encode = sqids.encode([userId]);

  const shareButton = Markup.button.switchToChat('Invite a friend', '');

  ctx.replyWithHTML(
    `Your personal invite link:\n<code>${process.env.BOT_URL}?start=r_${encode}</code>\n\nInvite friend and get 2500 $worm\n\nHave your friends join the game fun!`,
    Markup.inlineKeyboard([shareButton])
  );
});

export { bot, sqids, Markup, WEB_APP_URL };
