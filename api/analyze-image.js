const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { imageBase64, mediaType } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: "imageBase64 required" });

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const safeType = validTypes.includes(mediaType) ? mediaType : "image/jpeg";

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // gemini-1.5-flash supports vision (images) for free
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are UPI Rakshak, India's UPI fraud detection AI. Analyze this payment screenshot carefully.

Extract all visible information: UPI IDs, amounts, transaction IDs, timestamps, bank names, merchant names, status messages.

Then give a structured fraud analysis with these exact sections:

**What I See**
Brief description of the image content.

**Extracted Transaction Data**
List all visible transaction details clearly.

**Fraud Risk Score**
Give a number 0-100 and level: SAFE / SUSPICIOUS / HIGH RISK

**Red Flags**
List any concerning elements, or write "None detected" if clean.

**Verdict**
2-3 sentence plain English conclusion.

**Action Required**
What should the user do right now?

Be specific and direct. Name exact fraud types if applicable (mule account, phishing, vishing, fake QR, SIM swap, etc.)`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: safeType,
          data: imageBase64
        }
      }
    ]);

    const rawText = result.response.text();

    // Extract risk score
    let score = 20;
    const scoreMatch = rawText.match(/fraud risk score[^0-9]*([0-9]+)/i) || rawText.match(/\b([0-9]{1,2}|100)\s*\/\s*100/);
    if (scoreMatch) score = Math.min(parseInt(scoreMatch[1]), 99);
    else if (/high risk/i.test(rawText)) score = 75;
    else if (/suspicious/i.test(rawText)) score = 45;
    else if (/safe|legitimate|genuine|normal/i.test(rawText)) score = 12;

    return res.status(200).json({
      analysis: rawText,
      score,
      level: score >= 60 ? "high" : score >= 28 ? "medium" : "safe"
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Image analysis failed", message: err.message });
  }
};
