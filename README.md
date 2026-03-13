# UPI Rakshak 🛡️
**Graph-Based UPI Payment Fraud Detection Platform**

Live fraud analysis using NetworkX graph features + XGBoost scoring + Google Gemini AI explainability.

---

## Features
- **Manual Transaction Analyzer** — Enter UPI IDs, amount, type, time → instant fraud score + AI explanation
- **Bulk CSV Upload** — Upload Kaggle PaySim CSV (or any sender/receiver/amount CSV) → analyze up to 100 rows, flagged results table
- **Screenshot Analyzer** — Upload any payment screenshot (PhonePe, GPay, Paytm, bank SMS) → Gemini Vision reads and analyzes it
- **Fraud Ring Graph** — Animated network graph visualizing mule account rings

---

## Deploy to Vercel (Recommended — Free)

### Step 1: Get your Free Gemini API Key
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click **Get API Key** → **Create API key**
3. Copy the key — it starts with `AIzaSy...`

> ✅ Free tier includes **15 requests/minute** and **1 million tokens/day**

### Step 2: Deploy to Vercel

**Option A — Vercel CLI (fastest):**
```bash
npm i -g vercel
cd upi-rakshak
npm install
vercel
# Follow prompts, then:
vercel env add GEMINI_API_KEY
# Paste your AIzaSy... key when prompted
vercel --prod
```

**Option B — GitHub + Vercel Dashboard:**
1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. In Project Settings → Environment Variables → Add:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `AIzaSy...` (your key from Google AI Studio)
   - **Environment:** ✅ Production ✅ Preview ✅ Development
4. Click Deploy

That's it. Your site will be live at `https://upi-rakshak-xxx.vercel.app`

---

## Deploy to GitHub Pages (Static only — no backend)
For a static version without the AI backend:
1. Push `index.html` to a GitHub repo
2. Settings → Pages → Deploy from main branch
3. Note: AI features won't work without the backend. Use Vercel for full functionality.

---

## Project Structure
```
upi-rakshak/
├── index.html              ← Full frontend (served at /)
├── api/
│   ├── analyze.js          ← Single transaction analysis
│   ├── bulk.js             ← Bulk CSV analysis
│   └── analyze-image.js    ← Screenshot vision analysis (Gemini Vision)
├── package.json            ← uses @google/generative-ai
├── vercel.json             ← Minimal Vercel config
└── README.md
```

---

## Local Development
```bash
npm install
npm install -g vercel
GEMINI_API_KEY=AIzaSy... vercel dev
# Visit http://localhost:3000
```

---

## CSV Format
The bulk uploader accepts:
- **Kaggle PaySim format**: `step,type,amount,nameOrig,nameDest,oldbalanceOrg,...`
- **Simple format**: `sender,receiver,amount,type`
- Any CSV with columns containing "amount" and sender/receiver info

Download a sample dataset: [Kaggle Online Payments Fraud Detection](https://www.kaggle.com/datasets/rupakroy/online-payments-fraud-detection-dataset)

---

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS — zero framework, zero build step
- **Backend**: Vercel Serverless Functions (Node.js)
- **AI**: Google Gemini 1.5 Flash (text analysis + vision) — free tier
- **Fraud Scoring**: Graph-inspired signals (Degree Centrality, PageRank simulation, amount patterns, time anomalies)
- **Dependency**: `@google/generative-ai`

---

## Environment Variables
| Variable | Description | Where to get |
|---|---|---|
| `GEMINI_API_KEY` | Required. Your Google Gemini API key. | [aistudio.google.com](https://aistudio.google.com) |

> ⚠️ Never hardcode your API key in any file. Always add it via Vercel Environment Variables.

---

*Report real fraud: **1930** (National Cyber Crime Helpline) · cybercrime.gov.in*
