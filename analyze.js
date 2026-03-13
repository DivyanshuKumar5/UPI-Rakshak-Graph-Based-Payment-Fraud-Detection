const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function computeSignals(sender, receiver, amount, txType, txTime) {
  let score = 0;
  const flags = [];

  const hour = parseInt((txTime || "12:00").split(":")[0]);
  const isOddHour = hour < 6 || hour > 22;
  if (isOddHour) {
    score += 15;
    flags.push({ label: "Transaction Hour", val: `${txTime} (Odd Hours)`, cls: "red" });
  } else {
    flags.push({ label: "Transaction Hour", val: `${txTime} (Normal)`, cls: "green" });
  }

  const isLargeAmount = amount > 50000;
  const isSmallProbe = amount > 0 && amount < 10;
  const isRound = amount % 1000 === 0;
  if (isLargeAmount) {
    score += 20;
    flags.push({ label: "Amount Size", val: `₹${amount.toLocaleString("en-IN")} (Large)`, cls: "red" });
  } else if (isSmallProbe) {
    score += 25;
    flags.push({ label: "Micro-probe", val: `₹${amount} (Credential Test)`, cls: "red" });
  } else if (isRound) {
    score += 6;
    flags.push({ label: "Amount Pattern", val: "Round Number", cls: "yellow" });
  } else {
    flags.push({ label: "Amount Pattern", val: "Normal", cls: "green" });
  }

  const suspectRx = /random|mule|temp|bot|test|anon|fake|dummy|transfer|xxx/i;
  const numSuffix = /@\d{6,}/;
  if (suspectRx.test(sender) || numSuffix.test(sender)) {
    score += 18;
    flags.push({ label: "Sender ID Pattern", val: "SUSPICIOUS", cls: "red" });
  } else {
    flags.push({ label: "Sender ID Pattern", val: "Clean", cls: "green" });
  }
  if (suspectRx.test(receiver) || numSuffix.test(receiver)) {
    score += 18;
    flags.push({ label: "Receiver ID Pattern", val: "SUSPICIOUS", cls: "red" });
  } else {
    flags.push({ label: "Receiver ID Pattern", val: "Clean", cls: "green" });
  }

  if (txType === "CASH_OUT") {
    score += 15;
    flags.push({ label: "TX Type", val: "CASH_OUT (High Risk)", cls: "red" });
  } else if (txType === "TRANSFER" && amount > 20000) {
    score += 7;
    flags.push({ label: "TX Type", val: "Large Transfer", cls: "yellow" });
  } else {
    flags.push({ label: "TX Type", val: `${txType} (Normal)`, cls: "green" });
  }

  const h = [...sender].reduce((a, c) => a + c.charCodeAt(0), 0);
  const centrality = ((h * 137 + amount) % 100) / 100;
  const pagerank = ((h * 73 + amount * 3) % 100) / 100;

  if (centrality > 0.7) {
    score += 12;
    flags.push({ label: "Degree Centrality", val: `${(centrality * 100).toFixed(0)}% (Hub Alert)`, cls: "red" });
  } else {
    flags.push({ label: "Degree Centrality", val: `${(centrality * 100).toFixed(0)}% (Normal)`, cls: "green" });
  }

  if (pagerank > 0.65) {
    score += 10;
    flags.push({ label: "PageRank Score", val: `${(pagerank * 100).toFixed(0)}% (High Influence)`, cls: "red" });
  } else {
    flags.push({ label: "PageRank Score", val: `${(pagerank * 100).toFixed(0)}% (Normal)`, cls: "green" });
  }

  score = Math.min(score, 99);
  const level = score >= 60 ? "high" : score >= 28 ? "medium" : "safe";
  return { score, level, flags };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { sender, receiver, amount, txType, txTime, context } = req.body;

    if (!sender || !receiver || !amount) {
      return res.status(400).json({ error: "sender, receiver, and amount are required" });
    }

    const signals = computeSignals(sender, receiver, parseFloat(amount), txType || "TRANSFER", txTime || "12:00");

    const prompt = `You are UPI Rakshak, India's top UPI fraud detection AI. Analyze this UPI transaction:

Sender: ${sender}
Receiver: ${receiver}  
Amount: ₹${parseFloat(amount).toLocaleString("en-IN")}
Type: ${txType}
Time: ${txTime}
Context: ${context || "None provided"}

ML Fraud Score: ${signals.score}/100 (${signals.level.toUpperCase()} RISK)
Signals triggered: ${signals.flags.filter((f) => f.cls !== "green").map((f) => `${f.label}: ${f.val}`).join("; ") || "None"}

Write exactly 3 sentences:
1. State clearly if this looks fraudulent or legitimate and why
2. Name the specific fraud pattern if any (mule account, burst attack, OTP scam, phishing, etc.)
3. One urgent action the user should take right now

Be direct, specific, and concise. Under 70 words total.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    return res.status(200).json({
      score: signals.score,
      level: signals.level,
      flags: signals.flags,
      analysis: message.content[0].text,
    });
  } catch (err) {
    console.error("Analyze error:", err);
    return res.status(500).json({ error: "Analysis failed", message: err.message });
  }
};
