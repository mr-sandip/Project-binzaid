const express = require("express");
const mineflayer = require("mineflayer");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Project BinZaid is running!");
});

app.listen(PORT, () => {
  console.log(`Web server started on port ${PORT}`);
});

const bot = mineflayer.createBot({
  host: "BinZaid.aternos.me",
  port: 33268,
  username: "BinZaid",
  version: "1.20.1"
});

bot.once("spawn", () => {
  console.log("BinZaid joined!");

  bot.waitForChunksToLoad().then(() => {
  console.log("Chunks loaded!");
 });
});

bot.on("error", (err) => {
  console.log("Bot Error:", err.message);
});

bot.on("kicked", (reason) => {
  console.log("Kicked:", reason);
});
