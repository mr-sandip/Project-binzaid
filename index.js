const express = require("express");
const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const mcDataLoader = require("minecraft-data");
const { plugin: collectBlock } = require("mineflayer-collectblock");
const { plugin: toolPlugin } = require("mineflayer-tool");

const app = express();
const PORT = process.env.PORT || 3000;

// Render କୁ ସଙ୍ଗେ ସଙ୍ଗେ Live କରିବା ପାଇଁ ୱେବ୍ ସର୍ଭର ପ୍ରଥମେ ଚାଲିବ
app.get("/", (req, res) => res.send("Project BinZaid AI is perfectly Live!"));
app.listen(PORT, () => console.log(`Web server successfully bound to port ${PORT}`));

let bot;
let followPlayer = null;
let followInterval = null;
let stayPosition = null;
let homePosition = null;
let isChopping = false;

// AI ବେଷ୍ଟ ଫ୍ରେଣ୍ଡ୍‌ର ଚାଟ୍ ମେମୋରୀ (ପୁରୁଣା କଥା ମନେ ରଖିବା ପାଇଁ)
let conversationHistory = [];

const randomMessages = [
  "Kana karuchha? 😊",
  "Mu ready achhi!",
  "Adventure ku jiba? ⛏️",
  "Mo pakhare nua kama achhi ki? 😄",
  "Mu ethare achhi!"
];

// ସର୍ଭର ଡିସକନେକ୍ଟ ହେଲେ ବଟ୍ କୁ କ୍ରାସ୍ ନକରାଇ ପୁଣି କନେକ୍ଟ କରିବା ପାଇଁ ମେନ୍ ଫଙ୍କସନ୍
function initBot() {
  console.log("Connecting BinZaid to Minecraft server...");
  
  bot = mineflayer.createBot({
    host: "mr_sandip.aternos.me",
    port: 62409, // 👈 ତମର ବର୍ତ୍ତମାନର ପୋର୍ଟ ନମ୍ବର ଏଠାରେ ଲେଖିବ
    username: "BinZaid",
    version: "1.20.1"
  });

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(toolPlugin);
  bot.loadPlugin(collectBlock);

  bot.once("spawn", () => {
    console.log("BinZaid joined the world!");
    bot.waitForChunksToLoad().then(() => {
      console.log("Chunks loaded successfully!");
      const mcData = mcDataLoader("1.20");
      const defaultMove = new Movements(bot, mcData);
      bot.pathfinder.setMovements(defaultMove);
    });
  });

  // ୧୫ ମିନିଟ୍ ରେ ରେଣ୍ଡମ୍ ମେସେଜ୍ ସିଷ୍ଟମ୍
  const msgInterval = setInterval(() => {
    if (!bot || !bot.players) return;
    const players = Object.keys(bot.players).filter(p => p !== bot.username && bot.players[p].entity);
    if (players.length === 0) return;
    const msg = randomMessages[Math.floor(Math.random() * randomMessages.length)];
    bot.chat(msg);
  }, 900000);

  // --- ATERNOS SAFE WOOD CUTTING ---
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
      setTimeout(collectLogs, 300);
    } catch (err) {
      isChopping = false;
      setTimeout(collectLogs, 1000);
    }
  }

  // --- REAL HUMAN AI FRIEND BRAIN (GEMINI 1.5 FLASH WITH HISTORY) ---
  async function getAIFriendResponse(playerMessage, playerName) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    // ମେମୋରୀ ଭିତରକୁ ନୂଆ ୟୁଜର ମେସେଜ୍ ପୁଶ୍ କରିବା
    conversationHistory.push({ role: "user", parts: [{ text: playerMessage }] });
    
    // ମେମୋରୀ ଅଧିକ ବଡ଼ ହେଲେ ଲାଟେଷ୍ଟ ୧୦ଟି ମେସେଜ୍ କୁ ରଖିବା
    if (conversationHistory.length > 10) conversationHistory.shift();

    // AI କୁ ଜଣେ ପ୍ରକୃତ ସାଙ୍ଗର ପର୍ସନାଲିଟି ଦେବା ପାଇଁ ସିଷ୍ଟମ୍ ଇନଷ୍ଟ୍ରକସନ୍
    const systemPrompt = `ତମେ ମାଇନକ୍ରାଫ୍ଟ ଜାଭା ୧.୨୦.୧ ଦୁନିଆରେ ଜଣେ ଅସଲି ମଣିଷ ସାଙ୍ଗ ଭଳି। ତମ ନାଁ 'BinZaid'। ତମେ ତମର ବେଷ୍ଟ ଫ୍ରେଣ୍ଡ୍ '${playerName}' ସହ ୱାନ ବ୍ଲକ୍ ସର୍ଭାଇଭାଲ୍ ଖେଳୁଛ। ତମେ ତାର ସବୁ କଥା ମନେ ରଖି ତା ସହ ଓଡ଼ିଆ ଭାଷାରେ (Casual Odia mixed with English words, like conversational chatting) ଗପିବ। କୌଣସି ରୋବୋଟ୍ ଭଳିଆ ଉତ୍ତର ଦେବନି, ପୂର୍ବ କଥାକୁ ମନେ ପକାଇ ଜଣେ ପ୍ରକୃତ ସାଙ୍ଗ ଭଳି ସୁନ୍ଦର ଓ ଛୋଟ ୧-୨ ଲାଇନର ଉତ୍ତର ଦିଅ।`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: conversationHistory,
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });

      const data = await response.json();
      if (data && data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const aiText = data.candidates[0].content.parts[0].text.trim();
        // AI ର ଉତ୍ତରକୁ ମଧ୍ୟ ମେମୋରୀରେ ସେଭ୍ କରିବା
        conversationHistory.push({ role: "model", parts: [{ text: aiText }] });
        return aiText;
      }
    } catch (err) {
      console.error("AI Error:", err.message);
    }
    return "Tike network issue achhi saanga, puni ଥରେ କୁହ! 😅";
  }

  // --- ଚାଟ୍ ଏବଂ ଗେମ୍ କମାଣ୍ଡ୍ ଲିସନର୍ ---
  bot.on("chat", async (username, message) => {
    if (username === bot.username) return;
    const cleanMessage = message.toLowerCase();

    // ଗେମ୍ କମାଣ୍ଡ୍ ଗୁଡ଼ିକୁ ଚିହ୍ନିବା
    const gameCommands = ["wood", "come", "follow", "stop", "guard", "stay", "sethome", "home", "help"];
    if (!gameCommands.includes(cleanMessage)) {
      const aiReply = await getAIFriendResponse(message, username);
      if (aiReply) {
        bot.chat(aiReply);
        return;
      }
    }

    // ଗେମ୍ କମାଣ୍ଡ୍ ର ଏକ୍ସିକ୍ୟୁସନ୍
    if (cleanMessage === "help") {
      bot.chat("=== BinZaid Commands ===");
      bot.chat("wood | come | follow | stop | guard | stay | sethome | home");
    }
    if (cleanMessage === "wood") {
      bot.chat("Mu kath katibaku jauchi! 🌳");
      collectLogs();
    }
    if (cleanMessage === "come") {
      const player = bot.players[username];
      if (!player || !player.entity) return bot.chat("Mu tamaku dekhparuni!");
      bot.chat("Asuchi " + username + "!");
      bot.pathfinder.setGoal(new goals.GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, 4));
    }
    if (cleanMessage === "follow") {
      const player = bot.players[username];
      if (!player || !player.entity) return bot.chat("Mu tamaku dekhparuni!");
      followPlayer = username;
      if (followInterval) clearInterval(followInterval);
      bot.chat("Mu ebe tamaku follow karibi! 🏃‍♂️");
      followInterval = setInterval(() => {
        const p = bot.players[followPlayer];
        if (p && p.entity) bot.pathfinder.setGoal(new goals.GoalNear(p.entity.position.x, p.entity.position.y, p.entity.position.z, 4));
      }, 1000);
    }
    if (cleanMessage === "stop") {
      if (followInterval) { clearInterval(followInterval); followInterval = null; }
      followPlayer = null; bot.pathfinder.setGoal(null);
      bot.chat("Thik achhi, follow band karideli.");
    }
    if (cleanMessage === "guard") {
      if (followInterval) { clearInterval(followInterval); followInterval = null; }
      followPlayer = null; bot.pathfinder.setGoal(null);
      bot.chat("Guard mode enabled!");
    }
    if (cleanMessage === "stay") {
      if (followInterval) { clearInterval(followInterval); followInterval = null; }
      followPlayer = null; stayPosition = bot.entity.position.clone();
      bot.pathfinder.setGoal(new goals.GoalNear(stayPosition.x, stayPosition.y, stayPosition.z, 1));
      bot.chat("Mu eithi rahibi!");
    }
    if (cleanMessage === "sethome") {
      homePosition = bot.entity.position.clone();
      bot.chat("Home set!");
    }
    if (cleanMessage === "home") {
      if (!homePosition) return bot.chat("Home set hoini!");
      if (followInterval) { clearInterval(followInterval); followInterval = null; }
      followPlayer = null; bot.chat("Home ku asuchi!");
      bot.pathfinder.setGoal(new goals.GoalNear(homePosition.x, homePosition.y, homePosition.z, 1));
    }
  });

  // --- ସୁରକ୍ଷିତ ମେମୋରୀ ଏବଂ ଏରର ହ୍ୟାଣ୍ଡଲିଙ୍ଗ ---
  bot.on("error", (err) => console.log("Mineflayer Error:", err.message));
  bot.on("kicked", (reason) => console.log("Kicked from server:", reason));
  
  bot.on("end", () => {
    console.log("Disconnected. Reconnecting safely in 5 seconds...");
    clearInterval(msgInterval);
    if (followInterval) clearInterval(followInterval);
    setTimeout(initBot, 5000); // Process କୁ exit ନକରି ପୁଣି ଷ୍ଟାର୍ଟ କରାଯିବ
  });
}

// ବଟ୍ ପ୍ରୋସେସ୍ ଚାଲୁ କରିବା
initBot();
      
