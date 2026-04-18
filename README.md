# CuraLink — AI Medical Research Assistant

A full-stack medical research platform I built for the Humanity Founders Hackathon. The idea was simple — patients and researchers shouldn't have to jump between 5 different websites to find relevant medical studies, clinical trials, and get answers to their questions. CuraLink brings all of that into one place with an AI layer on top that actually makes sense of the data.

---

## What this actually does

You type in a condition or a research question, and the system goes out and pulls data from three different sources simultaneously — PubMed (35M+ papers), OpenAlex (250M+ academic works), and ClinicalTrials.gov (450K+ trials). Instead of dumping all 200+ results on you, a local LLM (Llama 3.2 via Ollama) reads through them and picks the 6-10 most relevant ones, explains why each is relevant, gives you a plain English summary, and formats everything into a structured research brief.

There's also a conversational AI assistant (Cura) that you can ask follow-up questions, and it maintains context across the conversation.

---

## Tech Stack

**Frontend** — React 18, Vite, Framer Motion, Tailwind CSS, Zustand, React Router v6

**Backend** — Node.js, Express, MongoDB (Mongoose), JWT auth

**LLM** — Ollama running Llama 3.2 locally (open-source, no API key needed)

**Data Sources** — PubMed E-utilities API, OpenAlex API, ClinicalTrials.gov API v2

---

## Prerequisites

Before you run anything make sure you have these installed:

- Node.js v18 or higher — https://nodejs.org
- MongoDB Atlas account (already configured, connection string is in .env)
- Ollama — https://ollama.com/download

---

## Setup & Running — Do this in order

### Step 1 — Install Ollama and pull the model

Download Ollama from https://ollama.com/download and install it. Then open a terminal and run:

```bash
ollama pull llama3.2
```

This downloads about 2GB so give it a few minutes. Once it's done, verify it worked:

```bash
ollama list
```

You should see `llama3.2` in the list.

---

### Step 2 — Start Ollama

Open **Terminal 1** and run:

```bash
ollama serve
```

Leave this running. You'll see something like `Listening on 127.0.0.1:11434`. This is your local AI server.

---

### Step 3 — Start the Backend

Open **Terminal 2** and run:

```bash
cd curalink/backend
npm install
npm run dev
```

Wait until you see both of these lines:

```
🚀 CuraLink Server running on port 5000
✅ MongoDB Connected to CuraLink DB
```

If you only see the server line but not the MongoDB line, check your internet connection — the MongoDB cluster is hosted on Atlas.

---

### Step 4 — Start the Frontend

Open **Terminal 3** and run:

```bash
cd curalink/frontend
npm install
npm run dev
```

Once you see this:

```
➜  Local:   http://localhost:3000/
```

Open your browser and go to **http://localhost:3000**

---

## Environment Variables

The `.env` file is already set up in `backend/.env`. You shouldn't need to change anything to get it running locally. Here's what's in there for reference:

```
PORT=5000
MONGODB_URI=<already configured>
JWT_SECRET=<already set>
JWT_EXPIRE=7d
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
NODE_ENV=development
```

If your Ollama is running a different model (check with `ollama list`), update `OLLAMA_MODEL` to match the exact name shown.

---

## Pages & Features

### Landing Page
Marketing page with animations. Has sign up and sign in buttons.

### Smart Search (`/app/structured`) — main feature
This is the core of the app. You fill in:
- Patient name (optional)
- Disease / condition
- Additional query
- Location (used to filter clinical trials by geography)

The system automatically combines disease + query into an expanded search, hits all three APIs in parallel, collects 50-300 results depending on your config, sends them to Llama 3.2 for ranking, and returns the top 6-10 with:
- AI relevance score
- Key finding extracted from the paper
- Plain English explanation
- Source attribution (title, authors, year, journal, URL)
- Contact information for clinical trials
- Eligibility criteria for trials

### AI Search (`/app/unified`)
Similar to Smart Search but with a single text box and more configuration options. Good for quick searches when you already know what you're looking for.

### PubMed Research (`/app/research`)
Direct search into PubMed with filters for article type (RCT, review, meta-analysis etc.), date range, and sort order. Each result has a one-click AI summarize button that sends the abstract to Ollama and gives you a plain English breakdown.

### Clinical Trials (`/app/trials`)
Search ClinicalTrials.gov directly. Filter by recruiting status, phase, and location. Full trial detail pages with eligibility criteria, contact info, and location data.

### Cura AI Chat (`/app/chat`)
Conversational AI assistant powered by Llama 3.2. Maintains session history so you can ask follow-up questions. If you ask about lung cancer treatments and then ask "what about vitamin D", it knows the context is still lung cancer. All sessions are saved to MongoDB so you can come back to them.

### Bookmarks (`/app/bookmarks`)
Save any paper or trial. Organized by type. Bookmarks persist across sessions.

### Profile (`/app/profile`)
Edit your name, specialization, institution, and bio. Role-based (patient vs researcher) which influences how the AI ranks and explains results.

---

## How the LLM Pipeline Works

1. User submits a query with disease + additional context
2. Backend expands the query — combines disease and additional query with AND logic
3. Three API calls fire simultaneously: PubMed, OpenAlex, ClinicalTrials.gov
4. Results aggregate into a pool (50-300 records depending on config)
5. Top 80 results get formatted into a compact summary
6. That summary gets sent to Ollama (Llama 3.2) with a structured prompt asking it to rank the most relevant ones and return JSON
7. Ollama returns ranked results with scores, reasoning, key findings, and plain English summaries
8. Backend also asks Ollama to generate a structured research brief (condition overview, insights, trials, disclaimer)
9. Everything gets sent back to the frontend

The whole thing runs locally. No data leaves your machine except for the three public API calls to fetch research data.

---

## Why Ollama instead of OpenAI/Claude API

The hackathon spec specifically required a custom or open-source LLM, excluding API calls to commercial providers like OpenAI, Gemini, and Anthropic. Ollama lets you run Llama 3.2 (Meta's open-source model) directly on your laptop. No API key, no cost, no data sent to third parties. The tradeoff is it's slower on CPU — expect 15-60 seconds per response depending on your hardware.

---

## API Endpoints

```
POST /api/auth/register         — create account
POST /api/auth/login            — login
GET  /api/auth/me               — get current user
PUT  /api/auth/profile          — update profile

POST /api/structured/search     — main search pipeline (structured input)
GET  /api/unified/search        — unified search (text query)

GET  /api/research/search       — PubMed search
GET  /api/research/:pmid        — single article

GET  /api/trials/search         — ClinicalTrials search
GET  /api/trials/:nctId         — single trial

POST /api/ai/chat               — send message to Cura AI
POST /api/ai/summarize          — summarize a paper abstract
GET  /api/ai/sessions           — get chat history
GET  /api/ai/status             — check if Ollama is running
GET  /api/ai/test-ollama        — test Ollama connection

GET  /api/bookmarks             — get saved items
POST /api/bookmarks             — save item
DELETE /api/bookmarks/:itemId   — remove bookmark

GET  /api/history               — search history
```

---

## Common Issues

**Ollama not responding in the app**

First check if it's actually running:
```bash
curl http://localhost:11434/api/tags
```
If that fails, run `ollama serve` in a terminal and leave it open.

Check what model name you actually have:
```bash
ollama list
```
If it shows `llama3.2:latest` instead of `llama3.2`, update `OLLAMA_MODEL` in `backend/.env` to match exactly.

Test Ollama directly:
```bash
curl http://localhost:11434/api/chat -d '{"model":"llama3.2","messages":[{"role":"user","content":"hello"}],"stream":false}'
```

**AI responses are very slow**

That's normal on CPU. Llama 3.2 takes 15-60 seconds depending on your machine. If you have a GPU, Ollama will use it automatically and it'll be much faster.

**MongoDB connection fails**

Make sure your machine has internet access. The MongoDB cluster is on Atlas (cloud). If you're on a restricted network, the connection might be blocked.

**PubMed or OpenAlex returns no results**

These are public APIs with rate limits. If you search too fast back to back, you might hit the limit. Wait 10-15 seconds and try again.

---

## Project Structure

```
curalink/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Bookmark.js
│   │   └── ChatSession.js
│   ├── routes/
│   │   ├── ai.js          — Ollama LLM integration
│   │   ├── auth.js        — JWT auth
│   │   ├── bookmarks.js
│   │   ├── history.js
│   │   ├── openalex.js    — OpenAlex API
│   │   ├── research.js    — PubMed API
│   │   ├── structured.js  — main search pipeline
│   │   ├── trials.js      — ClinicalTrials.gov API
│   │   ├── unified.js     — unified search
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   └── .env
└── frontend/
    └── src/
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── Dashboard.jsx
        │   ├── StructuredSearchPage.jsx
        │   ├── UnifiedSearchPage.jsx
        │   ├── ResearchPage.jsx
        │   ├── ClinicalTrialsPage.jsx
        │   ├── AIChatPage.jsx
        │   ├── BookmarksPage.jsx
        │   ├── ProfilePage.jsx
        │   ├── ArticlePage.jsx
        │   └── TrialDetailPage.jsx
        ├── components/
        │   ├── layout/
        │   └── animations/
        ├── store/
        │   └── authStore.js
        └── utils/
            └── api.js
```

---

Built for the Humanity Founders Hackathon.