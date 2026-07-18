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
  setInterval(() => {
  if (!bot.players) return;

  const players = Object.keys(bot.players).filter(
    p => p !== bot.username && bot.players[p].entity
  );

  if (players.length === 0) return;

  const msg = randomMessages[Math.floor(Math.random() * randomMessages.length)];
  bot.chat(msg);

}, 900000); // 15 minutes
 });
});

bot.on("error", (err) => {
  console.log("Bot Error:", err.message);
});

let followPlayer = null;
let followInterval = null;
let stayPosition = null;
let homePosition = null;
const randomMessages = [
  "Kana karuchha? 😊",
  "Mu ready achhi!",
  "Adventure ku jiba? ⛏️",
  "Mo pakhare nua kama achhi ki? 😄",
  "Mu ethare achhi!"
];

bot.on("chat", (username, message) => {
  if (username === bot.username) return;

  message = message.toLowerCase();

  if (message === "hi") {
  const replies = [
    "Hello " + username + "! 😊",
    "Hi " + username + "! Kemiti achha?",
    "Good to see you, " + username + "! 😄",
    "Mu ethare achhi! Kana kama?",
    "Hey " + username + "! Mu ready achhi!"
  ];

  bot.chat(replies[Math.floor(Math.random() * replies.length)]);
  }

  if (message === "help") {
  bot.chat("=== BinZaid Commands ===");
  bot.chat("hi - Greet BinZaid");
  bot.chat("come - BinZaid will come to you");
  bot.chat("follow - BinZaid will follow you");
  bot.chat("stop - Stop current action");
  bot.chat("guard - Stay at current position");
  bot.chat("stay - Stay at current position");
  bot.chat("sethome - Save current position as home");
  bot.chat("home - Go to saved home");
  bot.chat("thanks / good morning / good night / bye - Friendly chat");
  bot.chat("joke - Hear a random Minecraft joke");
  bot.chat("help - Show all commands");
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
      4
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
          4
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

if (message === "guard") {
  if (followInterval) {
    clearInterval(followInterval);
    followInterval = null;
  }

  followPlayer = null;
  bot.pathfinder.setGoal(null);
  bot.chat("Guard mode enabled!");
}

  if (message === "stay") {
  if (followInterval) {
    clearInterval(followInterval);
    followInterval = null;
  }

  followPlayer = null;

  stayPosition = bot.entity.position.clone();

  bot.pathfinder.setGoal(
    new goals.GoalNear(
      stayPosition.x,
      stayPosition.y,
      stayPosition.z,
      1
    )
  );

  bot.chat("Mu eithi rahibi!");
  }

  if (message === "sethome") {
  homePosition = bot.entity.position.clone();
  bot.chat("Home set!");
  }

  if (message === "home") {
  if (!homePosition) {
    bot.chat("Home set hoini!");
    return;
  }

  if (followInterval) {
    clearInterval(followInterval);
    followInterval = null;
  }

  followPlayer = null;

  bot.chat("Home ku asuchi!");

  bot.pathfinder.setGoal(
    new goals.GoalNear(
      homePosition.x,
      homePosition.y,
      homePosition.z,
      1
    )
  );
  }

  if (message === "thanks" || message === "thank you") {
  bot.chat("welcome, " + username + "! 😊");
}

if (message === "good morning") {
  bot.chat("Good morning, " + username + "! 🌞");
}

if (message === "good night") {
  bot.chat("Good night, " + username + "! 🌙");
}

if (message === "bye") {
  bot.chat("Bye " + username + "! Mu wait karibi. 👋");
}

if (message === "joke") {
  const jokes = [
    "Creeper kahila: Mu surprise gift nei asichi! 💥😂",
    "Zombie gym gala... hele brain khaibaku bhuligala! 😂",
    "Skeleton exam re fail hela, karana target miss karidela! 🎯😂",
    "Enderman selfie neipareni... camera ku dekhile teleport heijae! 😆",
    "Chicken road cross kala... karana anya side re diamond thila! 💎😂",
    "Villager kahila: Hmmm... mane discount nahin! 😂",
    "Steve ra luck ete kharap je lava re diamond khojuthila! 😅"
  ];

  bot.chat(jokes[Math.floor(Math.random() * jokes.length)]);
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
