const express = require("express");
const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const mcDataLoader = require("minecraft-data");
const { plugin: collectBlock } = require("mineflayer-collectblock");
const { plugin: toolPlugin } = require("mineflayer-tool");

const app = express();
const PORT = process.env.PORT || 3000;

// Render Web Service କୁ ତୁରନ୍ତ Live କରିବା ପାଇଁ Express ଆଗ ଚାଲିବ
app.get("/", (req, res) => {
  res.send("Project BinZaid AI Master Engine v2.0 is perfectly Live!");
});

app.listen(PORT, () => {
  console.log(`Web server successfully bound to port ${PORT}`);
});

let bot;
let followPlayer = null;
let followInterval = null;
let stayPosition = null;
let homePosition = null;
let isChopping = false;
let conversationHistory = [];

const randomMessages = [
  "Kana karuchha? 😊",
  "Mu ready achhi!",
  "Adventure ku jiba? ⛏️",
  "Mo pakhare nua kama achhi ki? 😄",
  "Mu ethare achhi!"
];

// ବଟ୍ ଷ୍ଟାର୍ଟ କରିବା ଏବଂ ଅଟୋ-ରିକନେକ୍ଟ ପାଇଁ ମେନ୍ ଫଙ୍କସନ୍
function initBot() {
  console.log("Connecting BinZaid to Minecraft server...");
  
  bot = mineflayer.createBot({
    host: "mr_sandip.aternos.me",
    port: 62409, // 👈 ତମ Aternos ର ନୂଆ Port ନମ୍ବର ଏଠାରେ ଲେଖିବ
    username: "BinZaid",
    version: "1.20.1"
  });

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(toolPlugin);
  bot.loadPlugin(collectBlock);

  bot.once("spawn", () => {
    console.log("BinZaid successfully joined the world!");
    bot.waitForChunksToLoad().then(() => {
      console.log("World chunks loaded!");
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

  // --- ୧. ATERNOS SAFE WOOD CUTTING ---
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
  // --- ୩. SMART CHAT & ACTION EXECUTION ---
  bot.on("chat", async (username, message) => {
    if (username === bot.username) return;

    // ❌ ୧. ସର୍ଭରର ଅଟୋମାଟିକ୍ ମେସେଜ୍ (mined, Loaded) କୁ ଇଗ୍ନୋର୍ କରିବା ପାଇଁ
    if (message.includes("mined") || message.includes("Loaded") || message.includes("Block") || message.includes("total")) return;

    // 🔒 ୨. ଖାଲି ତମେ (Sathaxu) ମେସେଜ୍ କଲେ ହିଁ AI ଆକ୍ଟିଭ୍ ହେବ
    if (username !== "Sathaxu") return;

    // AI ରୁ ନାଚୁରାଲ୍ ରେସପନ୍ସ ଏବଂ ଇଣ୍ଟେଣ୍ଟ ମଗାଇବା
    let aiReply = await getAIFriendResponse(message, username);
    if (!aiReply) return;

    // AI Action Parsing & Hidden Execution
    if (aiReply.includes("[ACTION:wood]")) {
      aiReply = aiReply.replace("[ACTION:wood]", "").trim();
      bot.chat(aiReply);
      collectLogs();
      return;
    }

    if (aiReply.includes("[ACTION:come]")) {
      aiReply = aiReply.replace("[ACTION:come]", "").trim();
      bot.chat(aiReply);
      const player = bot.players[username];
      if (player && player.entity) {
        bot.pathfinder.setGoal(new goals.GoalNear(player.entity.position.x, player.entity.position.y, player.entity.position.z, 2));
      }
      return;
    }

    if (aiReply.includes("[ACTION:follow]")) {
      aiReply = aiReply.replace("[ACTION:follow]", "").trim();
      bot.chat(aiReply);
      const player = bot.players[username];
      if (player && player.entity) {
        followPlayer = username;
        if (followInterval) clearInterval(followInterval);
        followInterval = setInterval(() => {
          const p = bot.players[followPlayer];
          if (p && p.entity) bot.pathfinder.setGoal(new goals.GoalNear(p.entity.position.x, p.entity.position.y, p.entity.position.z, 3));
        }, 1000);
      }
      return;
    }

    if (aiReply.includes("[ACTION:stop]")) {
      aiReply = aiReply.replace("[ACTION:stop]", "").trim();
      bot.chat(aiReply);
      if (followInterval) { clearInterval(followInterval); followInterval = null; }
      followPlayer = null;
      bot.pathfinder.setGoal(null);
      return;
    }

    if (aiReply.includes("[ACTION:stay]")) {
      aiReply = aiReply.replace("[ACTION:stay]", "").trim();
      bot.chat(aiReply);
      if (followInterval) { clearInterval(followInterval); followInterval = null; }
      followPlayer = null;
      stayPosition = bot.entity.position.clone();
      bot.pathfinder.setGoal(new goals.GoalNear(stayPosition.x, stayPosition.y, stayPosition.z, 1));
      return;
    }

    if (aiReply.includes("[ACTION:sethome]")) {
      aiReply = aiReply.replace("[ACTION:sethome]", "").trim();
      bot.chat(aiReply);
      homePosition = bot.entity.position.clone();
      return;
    }

    if (aiReply.includes("[ACTION:home]")) {
      aiReply = aiReply.replace("[ACTION:home]", "").trim();
      if (!homePosition) {
        bot.chat("Mu home set karini saanga! 🏡");
        return;
      }
      bot.chat(aiReply);
      if (followInterval) { clearInterval(followInterval); followInterval = null; }
      followPlayer = null;
      bot.pathfinder.setGoal(new goals.GoalNear(homePosition.x, homePosition.y, homePosition.z, 1));
      return;
    }

    // ଯଦି କୌଣସି ଆକ୍ସନ ନଥାଏ, ତେବେ ନର୍ମାଲ୍ ଚାଟ୍ ରିପ୍ଲାଏ କରିବ
    bot.chat(aiReply);
  });
  
  // --- ୨. GEMINI 2.0 FLASH AI FRIEND BRAIN WITH INTENT PARSING ---
  async function getAIFriendResponse(playerMessage, playerName) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return "ମୋ ପାଖରେ AI Brain Key ନାହିଁ ସାଙ୍ଗ! Render Variable ଚେକ୍ କର। 🧠❌";

    conversationHistory.push({ role: "user", parts: [{ text: playerMessage }] });
    if (conversationHistory.length > 10) conversationHistory.shift();

    const systemPrompt = `ତମେ ମାଇନକ୍ରାଫ୍ଟ ଜାଭା ୧.୨୦.୧ ଦୁନିଆରେ ଜଣେ ଅସଲି ମଣିଷ ସାଙ୍ଗ ଭଳି। ତମ ନାଁ 'BinZaid'। ତମେ ତମର ସାଙ୍ଗ '${playerName}' ସହ ୱାନ ବ୍ଲକ୍ ସର୍ଭାଇଭାଲ୍ ଖେଳୁଛ। ତମେ ତାର ସବୁ କଥା ମନେ ରଖି ତା ସହ ଓଡ଼ିଆ ଭାଷାରେ (Casual Odia mixed with English words) ଗପିବ। ଜଣେ ପ୍ରକୃତ ସାଙ୍ଗ ଭଳି ସୁନ୍ଦର ଓ ଛୋଟ ୧-୨ ଲାଇନର ଉତ୍តର ଦିଅ। 

    CRITICAL RULES FOR ACTIONS:
    यदि ପ୍ଲେୟାର୍ କାଠ କାଟିବାକୁ କହେ, ତେବେ ଉତ୍ତର ଶେଷରେ ଲେଖିବ: [ACTION:wood]
    यदि ପ୍ଲେୟାର୍ ତା ପାଖକୁ ଆସିବାକୁ କହେ, ତେବେ ଉତ୍ତର ଶେଷରେ ଲେଖିବ: [ACTION:come]
    यदि ପ୍ଲେୟାର୍ ତାକୁ ଫଲୋ/ପଛରେ ଆସିବାକୁ କହେ, ତେବେ ଉତ୍ତର ଶେଷରେ ଲେଖିବ: [ACTION:follow]
    यदि ପ୍ଲେୟାର୍ କୌଣସି କାମ ବନ୍ଦ କରିବାକୁ କହେ, ତେବେ ଉତ୍ତର ଶେଷରେ ଲେଖିବ: [ACTION:stop]
    यदि ପ୍ଲେୟାର୍ ସେଇଠି ଜଗିବାକୁ/ରହିବାକୁ କହେ, ତେବେ ଉତ୍ତର ଶେଷରେ ଲେଖିବ: [ACTION:stay]
    यदि ପ୍ଲେୟାର୍ ଘର ପୋଜିସନ୍ ସେଟ୍ କରିବାକୁ କହେ, ତେବେ ଉତ୍ତର ଶେଷରେ ଲେଖିବ: [ACTION:sethome]
    यदि ପ୍ଲେୟାର୍ ଘରକୁ ଯିବାକୁ କହେ, ତେବେ ଉତ୍ତର ଶେଷରେ ଲେଖିବ: [ACTION:home]`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: conversationHistory,
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });

      const data = await response.json();
      
      if (data && data.error) {
        return `AI Error: ${data.error.message} 😟`;
      }

      if (data && data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const aiText = data.candidates[0].content.parts[0].text.trim();
        conversationHistory.push({ role: "model", parts: [{ text: aiText }] });
        return aiText;
      }
    } catch (err) {
      return `Fetch Crash Error: ${err.message} 🌐`;
    }
    return "Mu tike bujhiparilini saanga, au thare kahiba? 🤔";
  }

  
                                   
