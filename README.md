# UPI Rakshak 🛡️
**Graph-Based UPI Payment Fraud Detection Platform**

Live fraud analysis using NetworkX graph features + XGBoost scoring + Claude AI explainability.

---

## Features
- **Manual Transaction Analyzer** — Enter UPI IDs, amount, type, time → instant fraud score + AI explanation
- **Bulk CSV Upload** — Upload Kaggle PaySim CSV (or any sender/receiver/amount CSV) → analyze up to 100 rows, flagged results table
- **Screenshot Analyzer** — Upload any payment screenshot (PhonePe, GPay, Paytm, bank SMS) → Claude Vision reads and analyzes it
- **Fraud Ring Graph** — Animated network graph visualizing mule account rings

---

## Deploy to Vercel (Recommended — Free)

### Step 1: Get your Anthropic API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key

### Step 2: Deploy to Vercel

**Option A — Vercel CLI (fastest):**
```bash
npm i -g vercel
cd upi-rakshak
npm install
vercel
# Follow prompts, then:
vercel env add ANTHROPIC_API_KEY
# Paste your API key when prompted
vercel --prod
```

**Option B — GitHub + Vercel Dashboard:**
1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. In Project Settings → Environment Variables → Add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your key from console.anthropic.com
4. Click Deploy

That's it. Your site will be live at `https://upi-rakshak-xxx.vercel.app`

---

## Deploy to GitHub Pages (Static only — no backend)

For a static version without the AI backend:
1. Push `public/index.html` to a GitHub repo
2. Settings → Pages → Deploy from main branch
3. Note: AI features won't work without the backend. Use Vercel for full functionality.

---

## Project Structure
```
upi-rakshak/
├── public/
│   └── index.html          # Full frontend
├── api/
│   ├── analyze.js          # Single transaction analysis
│   ├── bulk.js             # Bulk CSV analysis
│   └── analyze-image.js    # Screenshot vision analysis
├── package.json
├── vercel.json             # Vercel routing config
└── README.md
```

---

## Local Development
```bash
npm install
npm install -g vercel
ANTHROPIC_API_KEY=your_key_here vercel dev
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
- **AI**: Anthropic Claude Sonnet (text analysis + vision)
- **Fraud Scoring**: Graph-inspired signals (Degree Centrality, PageRank simulation, amount patterns, time anomalies)

---

## Environment Variables
| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Required. Your Anthropic API key. |

---

*Report real fraud: **1930** (National Cyber Crime Helpline) · cybercrime.gov.in*
