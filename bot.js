require('dotenv').config();

const { Telegraf } = require('telegraf');
const { createNewPlayer } = require('./server/db-queries');

const bot = new Telegraf(process.env.BOT_TOKEN);

const WEB_APP_URL = process.env.WEB_APP_URL;

bot.start(async ctx => {
  const userId = ctx.message.from.id;

  await ctx.setChatMenuButton(
    JSON.stringify({
      type: 'web_app',
      text: '🕹 Start mining',
      web_app: { url: WEB_APP_URL },
    })
  );

  createNewPlayer(userId);
});

bot.launch();
