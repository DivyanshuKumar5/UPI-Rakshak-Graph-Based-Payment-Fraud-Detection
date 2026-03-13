const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { imageBase64, mediaType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 required" });
    }

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const safeType = validTypes.includes(mediaType) ? mediaType : "image/jpeg";

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: safeType,
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `You are UPI Rakshak, an expert UPI/digital payment fraud detection AI. Analyze this image which may be a:
- UPI transaction screenshot
- Payment app screen (PhonePe, GPay, Paytm, BHIM, etc.)
- Bank SMS/notification screenshot  
- QR code
- Suspicious message or phishing attempt
- Any payment-related document

Extract ALL visible information: transaction IDs, UPI IDs, amounts, timestamps, merchant names, bank names, status messages.

Then provide a structured fraud analysis:

1. **What I see**: Brief description of the image content
2. **Extracted Data**: List all visible transaction details (amounts, IDs, UPI handles, dates)
3. **Fraud Risk**: Score 0-100 and level (SAFE / SUSPICIOUS / HIGH RISK)
4. **Red Flags**: List any concerning elements (if any)
5. **Verdict**: 2-3 sentence plain English conclusion
6. **Action Required**: What should the user do immediately?

Be specific. If it's a legitimate transaction, say so clearly. If fraudulent, name the exact fraud type.`,
            },
          ],
        },
      ],
    });

    const rawText = message.content[0].text;

    // Extract risk score from response
    const scoreMatch = rawText.match(/\b([0-9]{1,2}|100)\s*\/\s*100|\bscore[:\s]+([0-9]{1,3})/i);
    let score = 0;
    if (scoreMatch) {
      score = parseInt(scoreMatch[1] || scoreMatch[2]) || 0;
    } else if (/high risk/i.test(rawText)) {
      score = 75;
    } else if (/suspicious/i.test(rawText)) {
      score = 45;
    } else if (/safe|legitimate|genuine/i.test(rawText)) {
      score = 15;
    } else {
      score = 30;
    }

    const level = score >= 60 ? "high" : score >= 28 ? "medium" : "safe";

    return res.status(200).json({
      analysis: rawText,
      score,
      level,
    });
  } catch (err) {
    console.error("Image analyze error:", err);
    return res.status(500).json({ error: "Image analysis failed", message: err.message });
  }
};
