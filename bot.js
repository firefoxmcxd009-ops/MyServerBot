import fetch from "node-fetch";
import TelegramBot from "node-telegram-bot-api";

// ====== CONFIG ======
const BOT_TOKEN = "8513075659:AAFz9PjKQZKeA1MTnCSbkWzx57n84XMDDbE"; // paste token from BotFather
const CHAT_ID = "-1003699485147";     // example: -1001234567890
const SERVER_IP = "foxmckingdom.apsara.fun";
const CHECK_INTERVAL = 30 * 1000; // check every 30 sec

// ====== INIT BOT ======
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ====== TRACK SERVER STATUS ======
let lastStatus = null;
let lastPlayers = 0;

async function checkServer() {
  try {
    const res = await fetch(`https://api.mcsrvstat.us/2/${SERVER_IP}`);
    const data = await res.json();

    const online = data.online;
    const players = data.players?.online || 0;
    let status = online ? "online" : "offline";

    // detect status change
    if (status !== lastStatus) {
      lastStatus = status;

      if (status === "online") {
        bot.sendMessage(
          CHAT_ID,
          `✅ Server *${SERVER_IP}* is now ONLINE!\n👥 Players: ${players}`,
          { parse_mode: "Markdown" }
        );
      } else {
        bot.sendMessage(
          CHAT_ID,
          `❌ Server *${SERVER_IP}* is OFFLINE or restarting!`,
          { parse_mode: "Markdown" }
        );
      }
    }

    // detect restart (player drop to 0 while online)
    if (online && lastPlayers > 0 && players === 0) {
      bot.sendMessage(
        CHAT_ID,
        `🔄 Server *${SERVER_IP}* might be restarting...`,
        { parse_mode: "Markdown" }
      );
    }

    lastPlayers = players;

  } catch (err) {
    console.error("Error checking server:", err);
    bot.sendMessage(
      CHAT_ID,
      `⚠️ Error checking server *${SERVER_IP}*: ${err.message}`,
      { parse_mode: "Markdown" }
    );
  }
}

// ====== COMMAND: /status ======
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const res = await fetch(`https://api.mcsrvstat.us/2/${SERVER_IP}`);
    const data = await res.json();

    if (data.online) {
      const players = data.players?.online || 0;
      bot.sendMessage(
        chatId,
        `✅ Server *${SERVER_IP}* is ONLINE!\n👥 Players: ${players}`,
        { parse_mode: "Markdown" }
      );
    } else {
      bot.sendMessage(
        chatId,
        `❌ Server *${SERVER_IP}* is OFFLINE!`,
        { parse_mode: "Markdown" }
      );
    }
  } catch (err) {
    bot.sendMessage(
      chatId,
      `⚠️ Error checking server: ${err.message}`,
      { parse_mode: "Markdown" }
    );
  }
});

// ====== LOOP ======
setInterval(checkServer, CHECK_INTERVAL);
checkServer(); // run immediately
