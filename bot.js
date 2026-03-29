require('dotenv').config();
const axios = require("axios");
const http = require("http"); // keep alive trick

const TOKEN = process.env.TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const SERVER = process.env.SERVER;

let lastStatus = null;
let restarting = false;

function getDateTime() {
    let d = new Date();
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} | ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
}

async function sendMessage(html) {
    await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        chat_id: CHAT_ID,
        text: html,
        parse_mode: "HTML"
    });
}

async function checkServer() {
    try {
        let res = await axios.get(`https://api.mcsrvstat.us/2/${SERVER}`);
        let data = res.data;

        if (data.online) {
            if (lastStatus !== "online") {
                let msg = `
<b>🟢 SERVER ONLINE</b>

📡 <b>Status:</b> Online
👥 <b>Players:</b> ${data.players.online}/${data.players.max}
📦 <b>Version:</b> ${data.version}

🕒 <b>Time:</b> ${getDateTime()}
🎉 <b>Server បានបើកហើយ!</b>
`;
                await sendMessage(msg);
                lastStatus = "online";
                restarting = false;
            }
        } else {
            if (lastStatus === "online" && !restarting) {
                restarting = true;

                let timeout = 30; // seconds
                let msgRestart = `
<b>🔄 SERVER RESTARTING</b>

⚠️ <b>Server នឹង Restart</b>
⏳ <b>ក្នុងរយៈពេល:</b> ${timeout} វិនាទី

🕒 <b>Time:</b> ${getDateTime()}
`;
                await sendMessage(msgRestart);

                setTimeout(async () => {
                    let msgOff = `
<b>🔴 SERVER OFFLINE</b>

❌ <b>Status:</b> Offline
📅 <b>Date:</b> ${getDateTime()}

💤 <b>Server បានបិតហើយ</b>
`;
                    await sendMessage(msgOff);
                    lastStatus = "offline";
                }, timeout * 1000);
            }

            if (lastStatus !== "offline" && !restarting) {
                let msgOff = `
<b>🔴 SERVER OFFLINE</b>

❌ <b>Status:</b> Offline
📅 <b>Date:</b> ${getDateTime()}

💤 <b>Server បានបិតហើយ</b>
`;
                await sendMessage(msgOff);
                lastStatus = "offline";
            }
        }

    } catch (err) {
        console.log("Error:", err.message);
    }
}

// ⏱️ Check every 20 sec
setInterval(checkServer, 20000);

// 🌐 Keep bot alive for Render free plan
http.createServer((req, res) => {
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("Bot is running\n");
}).listen(3000);