const express = require("express");
const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const mcDataLoader = require("minecraft-data");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Project BinZaid is running!");
});

app.listen(PORT, () => {
  console.log(`Web server started on port ${PORT}`);
});

const bot = mineflayer.createBot({
  host: "mr_sandip.aternos.me",
  port: 62409,
  username: "BinZaid",
  version: "1.20.1"
});
bot.loadPlugin(pathfinder);

bot.once("spawn", () => {
  console.log("BinZaid joined!");

  bot.waitForChunksToLoad().then(() => {
  console.log("Chunks loaded!");
    const mcData = mcDataLoader("1.20");
const defaultMove = new Movements(bot, mcData);
bot.pathfinder.setMovements(defaultMove);
 });
});

bot.on("error", (err) => {
  console.log("Bot Error:", err.message);
});

let followPlayer = null;
let followInterval = null;

bot.on("chat", (username, message) => {
  if (username === bot.username) return;

  message = message.toLowerCase();

  if (message === "hi") {
    bot.chat("Hello " + username + "! Mu BinZaid 😊");
  }

  if (message === "come") {
  const player = bot.players[username];

  if (!player || !player.entity) {
    bot.chat("Mu tamaku dekhparuni!");
    return;
  }

  bot.chat("Asuchi " + username + "!");
  bot.pathfinder.setGoal(
    new goals.GoalNear(
      player.entity.position.x,
      player.entity.position.y,
      player.entity.position.z,
      1
    )
  );
  }
  
  if (message === "follow") {
  const player = bot.players[username];

  if (!player || !player.entity) {
    bot.chat("Mu tamaku dekhparuni!");
    return;
  }

  followPlayer = username;

  if (followInterval) clearInterval(followInterval);

  bot.chat("Mu ebe tamaku follow karibi!");

  followInterval = setInterval(() => {
    const p = bot.players[followPlayer];

    if (p && p.entity) {
      bot.pathfinder.setGoal(
        new goals.GoalNear(
          p.entity.position.x,
          p.entity.position.y,
          p.entity.position.z,
          1
        )
      );
    }
  }, 1000);
}

if (message === "stop") {
  if (followInterval) {
    clearInterval(followInterval);
    followInterval = null;
  }

  followPlayer = null;
  bot.pathfinder.setGoal(null);

  bot.chat("Thik achhi, follow band karideli.");
}
});

bot.on("kicked", (reason) => {
  console.log("Kicked:", reason);
});
bot.on("end", () => {
  console.log("BinZaid disconnected. Reconnecting...");
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});
bot.on("death", () => {
  console.log("BinZaid died!");
});
bot.on("end", (reason) => {
  console.log("END:", reason);
});

bot.on("close", () => {
  console.log("Connection closed");
});

bot.on("disconnect", (packet) => {
  console.log("DISCONNECT:", packet);
});
