const express = require("express");
const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const mcDataLoader = require("minecraft-data");
const { plugin: collectBlock } = require("mineflayer-collectblock");
const { plugin: toolPlugin } = require("mineflayer-tool");

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
bot.loadPlugin(toolPlugin);
bot.loadPlugin(collectBlock);

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

// --- ୧. ATERNOS SAFE WOOD CUTTING SYSTEM ---
let isChopping = false;
async function collectLogs() {
  if (isChopping) return;
  isChopping = true;

  const log = bot.findBlock({
    matching: block => block.name.includes("log") || block.name.includes("wood"),
    maxDistance: 12
  });

  if (!log) {
    bot.chat("Mu sabu kath kati sarichi! 🌳");
    isChopping = false;
    return;
  }

  try {
    await bot.collectBlock.collect(log);
    isChopping = false;
    setTimeout(collectLogs, 300); // Kick ନହେବା ପାଇଁ ୩୦୦ms ର safe gap
  } catch (err) {
    console.log("Chopping error:", err.message);
    isChopping = false;
    setTimeout(collectLogs, 1000);
  }
}

// --- FIXED AI BRAIN (V1BETA ENDPOINT) ---
async function getAIFriendResponse(playerMessage, playerName) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return "ମୋ ପାଖରେ AI Brain Key ନାହିଁ ସାଙ୍ଗ! Render Variable ଚେକ୍ କର। 🧠❌";
  }

  try {
    // URL ରେ v1 ଜାଗାରେ v1beta କରାଯାଇଛି, ଯାହା ଦ୍ୱାରା gemini-1.5-flash ସଫଳତାର ସହ ଚାଲିବ
    
   const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ 
            text: `ତମେ ମାଇନକ୍ରାଫ୍ଟ ଗେମ୍‌ରେ ଜଣେ AI ସାଙ୍ଗ ଅଟ। ତମ ନାଁ 'BinZaid'। ତମେ ତମର ସାଙ୍ଗ '${playerName}' ସହ ଓଡ଼ିଆ ଭାଷାରେ (Odia language) କଥା ହେଉଛ। ୧ ରୁ ୨ ଧାଡ଼ି ଭିତରେ ଛୋଟ ଓ ସୁନ୍ଦର ଉତ୍ତର ଦିଅ। ପ୍ଲେୟାର୍ କହିଲା: "${playerMessage}"` 
          }] 
        }]
      })
    });

    const data = await response.json();
    
    if (data && data.error) {
      return `AI Error: ${data.error.message} 😟`;
    }

    if (data && data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    }
  } catch (err) {
    console.error("Gemini AI Error:", err.message);
    return "ସର୍ଭର କନେକ୍ସନ୍ ପ୍ରୋବ୍ଲେମ୍ ହେଉଛି ସାଙ୍ଗ! 🌐";
  }
  return "ମୁଁ ବୁଝିପାରିଲିନି, ଆଉଥରେ କହିବ କି? 🤔";
}



// --- ୩. CHAT & GAME COMMAND LISTENER ---
bot.on("chat", async (username, message) => {
  if (username === bot.username) return;

  const cleanMessage = message.toLowerCase();

  // ପ୍ରଥମେ ଚେକ୍ ହେବ ଏହା ଗେମ୍ କମାଣ୍ଡ କି ନୁହେଁ, ନହୋଇଥିଲେ AI ଉତ୍ତର ଦେବ
  const gameCommands = ["wood", "come", "follow", "stop", "guard", "stay", "sethome", "home", "help"];
  if (!gameCommands.includes(cleanMessage)) {
    const aiReply = await getAIFriendResponse(message, username);
    if (aiReply) {
      bot.chat(aiReply);
      return;
    }
  }

  // ତମର ସବୁଯାକ ପୁରୁଣା ଗେମ୍ କମାଣ୍ଡ୍
  if (cleanMessage === "hi") {
    const replies = [
      "Hello " + username + "! 😊",
      "Hi " + username + "! Kemiti achha?",
      "Good to see you, " + username + "! 😄",
      "Mu ethare achhi! Kana kama?",
      "Hey " + username + "! Mu ready achhi!"
    ];
    bot.chat(replies[Math.floor(Math.random() * replies.length)]);
  }

  if (cleanMessage === "help") {
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

  if (cleanMessage === "wood") {
    bot.chat("Mu kath katibaku jauchi! 🌳");
    collectLogs();
  }

  if (cleanMessage === "come") {
    const player = bot.players[username];
    if (!player || !player.entity) {
      bot.chat("Mu tamaku dekhparuni!");
      return;
    }
    bot.chat("Asuchi " + username + "!");
    bot.pathfinder.setGoal(new goals.GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, 4));
  }
  
  if (cleanMessage === "follow") {
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
        bot.pathfinder.setGoal(new goals.GoalNear(p.entity.position.x, p.entity.position.y, p.entity.position.z, 4));
      }
    }, 1000);
  }

  if (cleanMessage === "stop") {
    if (followInterval) { clearInterval(followInterval); followInterval = null; }
    followPlayer = null;
    bot.pathfinder.setGoal(null);
    bot.chat("Thik achhi, follow band karideli.");
  }

  if (cleanMessage === "guard") {
    if (followInterval) { clearInterval(followInterval); followInterval = null; }
    followPlayer = null;
    bot.pathfinder.setGoal(null);
    bot.chat("Guard mode enabled!");
  }

  if (cleanMessage === "stay") {
    if (followInterval) { clearInterval(followInterval); followInterval = null; }
    followPlayer = null;
    stayPosition = bot.entity.position.clone();
    bot.pathfinder.setGoal(new goals.GoalNear(stayPosition.x, stayPosition.y, stayPosition.z, 1));
    bot.chat("Mu eithi rahibi!");
  }

  if (cleanMessage === "sethome") {
    homePosition = bot.entity.position.clone();
    bot.chat("Home set!");
  }

  if (cleanMessage === "home") {
    if (!homePosition) { bot.chat("Home set hoini!"); return; }
    if (followInterval) { clearInterval(followInterval); followInterval = null; }
    followPlayer = null;
    bot.chat("Home ku asuchi!");
    bot.pathfinder.setGoal(new goals.GoalNear(homePosition.x, homePosition.y, homePosition.z, 1));
  }

  if (cleanMessage === "thanks" || cleanMessage === "thank you") {
    bot.chat("welcome, " + username + "! 😊");
  }

  if (cleanMessage === "good morning") {
    bot.chat("Good morning, " + username + "! 🌞");
  }

  if (cleanMessage === "good night") {
    bot.chat("Good night, " + username + "! 🌙");
  }

  if (cleanMessage === "bye") {
    bot.chat("Bye " + username + "! Mu wait karibi. 👋");
  }

  if (cleanMessage === "joke") {
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

bot.on("kicked", (reason) => { console.log("Kicked:", reason); });
bot.on("end", () => {
  console.log("BinZaid disconnected. Reconnecting...");
  setTimeout(() => { process.exit(1); }, 1000);
});
bot.on("death", () => { console.log("BinZaid died!"); });
bot.on("close", () => { console.log("Connection closed"); });
bot.on("disconnect", (packet) => { console.log("DISCONNECT:", packet); });
