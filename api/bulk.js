const { GoogleGenerativeAI } = require("@google/generative-ai");

function scoreRow(sender, receiver, amount, txType) {
  let score = 0;
  const suspectRx = /random|mule|temp|bot|test|anon|fake|dummy/i;
  const numSuffix = /@\d{6,}/;
  const amt = parseFloat(amount) || 0;

  if (suspectRx.test(sender) || numSuffix.test(sender)) score += 20;
  if (suspectRx.test(receiver) || numSuffix.test(receiver)) score += 20;
  if (amt > 50000) score += 20;
  else if (amt > 0 && amt < 10) score += 25;
  if ((txType || "").toUpperCase() === "CASH_OUT") score += 15;
  else if ((txType || "").toUpperCase() === "TRANSFER" && amt > 20000) score += 8;

  const h = [...(sender || "x")].reduce((a, c) => a + c.charCodeAt(0), 0);
  if (((h * 137 + amt) % 100) / 100 > 0.7) score += 12;

  score = Math.min(score, 99);
  return { score, level: score >= 60 ? "high" : score >= 28 ? "medium" : "safe" };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { rows } = req.body || {};
    if (!rows || !Array.isArray(rows)) return res.status(400).json({ error: "rows array required" });

    const limited = rows.slice(0, 100);
    const results = limited.map(row => {
      const amt = parseFloat(row.amount) || 0;
      const r = scoreRow(
        row.nameOrig || row.nameorig || row.sender || "",
        row.nameDest || row.namedest || row.receiver || "",
        amt,
        row.type || "TRANSFER"
      );
      return {
        sender: (row.nameOrig || row.nameorig || row.sender || "—").slice(0, 20),
        receiver: (row.nameDest || row.namedest || row.receiver || "—").slice(0, 20),
        amount: amt,
        type: row.type || "TRANSFER",
        score: r.score,
        level: r.level
      };
    });

    const fraudCount = results.filter(r => r.level === "high").length;
    const suspectCount = results.filter(r => r.level === "medium").length;
    const cleanCount = results.length - fraudCount - suspectCount;

    let summary = `${results.length} transactions analyzed: ${fraudCount} high-risk, ${suspectCount} suspicious, ${cleanCount} clean.`;

    if (fraudCount > 0) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const topFraud = results.filter(r => r.level === "high").slice(0, 3);
        const prompt = `UPI batch fraud analysis: ${results.length} transactions checked, ${fraudCount} high-risk flagged. Top flagged: ${topFraud.map(t => `₹${t.amount} from ${t.sender}`).join(", ")}. Write 2 sentences: overall risk level and what fraud pattern these suggest. Under 45 words. Be direct.`;
        const result = await model.generateContent(prompt);
        summary = result.response.text();
      } catch (e) {
        // keep default summary
      }
    }

    return res.status(200).json({
      results,
      summary,
      stats: { total: results.length, fraud: fraudCount, suspect: suspectCount, clean: cleanCount }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Bulk analysis failed", message: err.message });
  }
};
