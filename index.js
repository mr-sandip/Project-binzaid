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
    const mcData = mcDataLoader(bot.version);
const defaultMove = new Movements(bot, mcData);
bot.pathfinder.setMovements(defaultMove);
 });
});

bot.on("error", (err) => {
  console.log("Bot Error:", err.message);
});
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
});

bot.on("kicked", (reason) => {
  console.log("Kicked:", reason);
});
bot.on("death", () => {
  console.log("BinZaid died!");
});
