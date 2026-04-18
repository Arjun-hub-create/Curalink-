 # CuraLink — AI Medical Research Assistant

A full-stack medical research platform I built for the Humanity Founders Hackathon. The idea was simple — patients and researchers shouldn't have to jump between 5 different websites to find relevant medical studies, clinical trials, and get answers to their questions. CuraLink brings all of that into one place with an AI layer on top that actually makes sense of the data.

---

## What this actually does

You type in a condition or a research question, and the system goes out and pulls data from three different sources simultaneously — PubMed (35M+ papers), OpenAlex (250M+ academic works), and ClinicalTrials.gov (450K+ trials). Instead of dumping all 200+ results on you, an LLM reads through them and picks the 6-10 most relevant ones, explains why each one matters, gives you a plain English summary, and formats everything into a structured research brief.

There's also a conversational AI assistant called Cura that you can ask follow-up questions to, and it remembers the context of the conversation so you don't have to repeat yourself every time.

The LLM setup uses Groq as the primary inference provider — it runs Llama 3.3 (Meta's open-source model) on their custom hardware and gives you responses in 1-3 seconds. Ollama running locally is the fallback if Groq isn't configured. Either way the model is open-source, which is what the spec required.

---

## Tech Stack

**Frontend** — React 18, Vite, Framer Motion, Tailwind CSS, Zustand, React Router v6

**Backend** — Node.js, Express, MongoDB (Mongoose), JWT auth

**LLM — Primary** — Groq API running Llama 3.3 70B (free tier, 1-3 second responses)

**LLM — Fallback** — Ollama running Llama 3.2 locally (no API key, slower)

**Data Sources** — PubMed E-utilities API, OpenAlex API, ClinicalTrials.gov API v2

---

## Prerequisites

Make sure you have these before starting:

- Node.js v18 or higher — https://nodejs.org
- A Groq API key — https://console.groq.com (free, no credit card)
- Ollama installed (optional, only needed if Groq isn't configured) — https://ollama.com/download

MongoDB is already configured and connected to Atlas. You don't need to set that up.

---

## Getting the Groq API Key (takes 3 minutes)

1. Go to https://console.groq.com
2. Sign up with your Google account
3. Click API Keys in the left sidebar
4. Click Create API Key, give it any name
5. Copy the key — it starts with `gsk_`
6. Paste it into `backend/.env` as shown below

That's it. Groq gives you a generous free tier, more than enough for development and demos.

---

## Setup & Running — Do this in order

### Step 1 — Configure your environment

Open `backend/.env` and make sure it looks like this:

```
PORT=5000
MONGODB_URI=<already configured, don't touch>
JWT_SECRET=<already set, don't touch>
JWT_EXPIRE=7d
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
GROQ_API_KEY=gsk_your_actual_key_here
GROQ_MODEL=llama-3.3-70b-versatile
NODE_ENV=development
```

Just add your Groq key. Everything else is already there.

---

### Step 2 — Start the Backend

Open **Terminal 1** and run:

```bash
cd curalink/backend
npm install
npm run dev
```

Wait until you see both of these:

```
🚀 CuraLink Server running on port 5000
✅ MongoDB Connected to CuraLink DB
```

If MongoDB doesn't connect, check your internet. The cluster is on Atlas.

---

### Step 3 — Start the Frontend

Open **Terminal 2** and run:

```bash
cd curalink/frontend
npm install
npm run dev
```

Once you see:

```
➜  Local:   http://localhost:3000/
```

Open your browser and go to **http://localhost:3000**

---

### Step 4 — (Optional) Start Ollama as fallback

Only needed if you want Ollama as a backup or don't have a Groq key. Open **Terminal 3**:

```bash
ollama pull llama3.2
ollama serve
```

The app will use Groq if the key is configured and fall back to Ollama automatically if Groq fails.

---

### Verify everything is working

Open your browser and go to:

```
http://localhost:5000/api/ai/status
```

You should see something like:

```json
{
  "groqConfigured": true,
  "activeLLM": "Groq (Llama 3.3 — fast)",
  "groqModel": "llama-3.3-70b-versatile"
}
```

If `groqConfigured` is true you're good. AI responses will come back in 1-3 seconds.

---

## Pages & Features

### Landing Page

The home page. Animated hero, feature breakdown, how it works section. Has sign in and register buttons.

---

### Smart Search — `/app/structured`

This is the main feature and what most of the pipeline is built around. You fill in four fields:

- **Patient Name** — optional, personalizes the response
- **Disease / Condition** — this is required, e.g. Parkinson's disease
- **Additional Query** — the specific thing you're looking for, e.g. Deep Brain Stimulation
- **Location** — used to filter clinical trials geographically, e.g. Toronto, Canada

As you type the disease and query, there's a live preview showing how the system will expand your search before sending it to the APIs. So instead of just searching "Deep Brain Stimulation" it searches "Parkinson's disease AND Deep Brain Stimulation" — that expansion happens automatically.

When you hit search, the pipeline runs:

1. Query gets expanded
2. PubMed, OpenAlex, and ClinicalTrials.gov all get queried simultaneously
3. 50 to 300 results come back depending on what you configured
4. Top 80 get sent to Llama 3.3 via Groq
5. Model picks the 6-10 most relevant ones and annotates each with a relevance score, key finding, and plain English explanation
6. A structured research brief gets generated covering condition overview, research insights, and trial summary
7. Everything renders on screen

Each result card shows the source it came from, an AI relevance score out of 100, what the key finding is, what it means in plain English, and full source attribution with authors, year, journal, and URL. For clinical trials specifically you also get eligibility criteria (min age, max age, sex requirements) and contact information for the trial coordinators.

---

### AI Search — `/app/unified`

Same pipeline as Smart Search but with a single text box instead of separate fields. Good for quick searches. You can still configure how many records to fetch per source (50 to 300) and how many final results to return (8 to 15). You can also set the context to patient or researcher mode which changes how the model weights and explains results.

---

### PubMed Research — `/app/research`

Direct search into PubMed. Filters for article type (RCT, systematic review, meta-analysis, case reports etc.), date range, and sort by relevance or date. Each result has a one-click AI Summary button that sends the abstract to Groq and gives you a structured plain English breakdown without having to read the whole thing.

---

### Clinical Trials — `/app/trials`

Direct search into ClinicalTrials.gov. Filters for recruiting status (so you can find trials actively looking for participants), trial phase, and location. Full detail pages for each trial with eligibility criteria, study locations, enrollment numbers, and contact info. If a trial has a contact person listed, their name, phone, and email all show up.

---

### Cura AI Chat — `/app/chat`

Conversational assistant powered by Groq running Llama 3.3. Maintains session history so follow-up questions work properly — if you ask about lung cancer treatments and then ask "what about vitamin D for this", it knows the context is still lung cancer without you having to say it again. All sessions get saved to MongoDB. Left sidebar shows your past sessions, click any to continue where you left off.

---

### Bookmarks — `/app/bookmarks`

Save any paper or trial from any page. Everything persists to your account in MongoDB. Organized into tabs — all, papers only, or trials only.

---

### Profile — `/app/profile`

Edit your name, specialization, institution, and bio. The role you chose when registering (patient vs researcher) influences how the AI weights results and how it explains things back to you.

---

## How the LLM Pipeline Actually Works

Here's what happens step by step when you run a search:

**Query expansion first.** The backend takes your disease field and additional query field and combines them with AND logic before sending to any API. "Parkinson's disease" + "Deep Brain Stimulation" becomes "Parkinson's disease AND Deep Brain Stimulation". This is what the spec called for and it makes a real difference in result quality.

**Three API calls in parallel.** PubMed, OpenAlex, and ClinicalTrials.gov all get hit at the same time using Promise.all. Each one returns between 50 and 200 results depending on the config. Combined pool could be 300+ records.

**Compact formatting for the LLM.** You can't send 300 full abstracts to an LLM in one go — that'd blow the context window. So the backend trims each result to its most important fields (title, source, date, first 200 chars of abstract) and formats the top 80 into a compact numbered list.

**Groq processes the ranking.** That formatted list goes to Groq's API with a structured prompt asking it to pick the most relevant results for the user's query, score each one out of 100, extract the key finding, and write a one-sentence plain English explanation. It returns JSON.

**Structured response generation.** In the same or a second call, the model also generates a full research brief — condition overview, bullet point insights from the papers, clinical trials summary, and a standard medical disclaimer.

**JSON parsed and sent to frontend.** Backend maps the model's selections back to the full result objects, attaches all the AI annotations, and sends everything to React.

The whole thing runs in about 5-10 seconds end to end when using Groq. Ollama on CPU takes 2-4 minutes for the same task.

---

## Why Groq Instead of OpenAI or Claude

The hackathon spec said no commercial LLM API calls — specifically called out OpenAI, Gemini. Groq isn't a model, it's infrastructure. The model running on it is Llama 3.3 which is Meta's fully open-source model. So we're using an open-source LLM, just running it on Groq's hardware instead of locally. The spec requirement is about the model being open-source, and Llama 3.3 is.

Groq is also completely free on their dev tier which is more than enough for this use case.

---

## Why Ollama is Still There

Ollama with Llama 3.2 runs as a local fallback. If the Groq key isn't configured or if a Groq API call fails for any reason, the backend automatically retries with Ollama. It's slower but it means the app keeps working even without internet access to Groq's servers.

If you want to run fully locally without any external API dependency, just don't set a GROQ_API_KEY in .env and make sure Ollama is running. Everything works the same way, just takes longer.

---

## API Endpoints

```
POST /api/auth/register          — create account
POST /api/auth/login             — login
GET  /api/auth/me                — get current user
PUT  /api/auth/profile           — update profile

POST /api/structured/search      — main search pipeline (structured input + query expansion)
GET  /api/unified/search         — unified search (single text query)

GET  /api/research/search        — PubMed search with filters
GET  /api/research/:pmid         — single PubMed article

GET  /api/openalex/search        — OpenAlex search
GET  /api/openalex/:id           — single OpenAlex work

GET  /api/trials/search          — ClinicalTrials.gov search
GET  /api/trials/:nctId          — single trial detail

POST /api/ai/chat                — send message to Cura AI
POST /api/ai/summarize           — summarize a paper abstract
POST /api/ai/analyze-results     — LLM ranking endpoint
GET  /api/ai/sessions            — get all chat sessions
GET  /api/ai/sessions/:id        — get single session
DELETE /api/ai/sessions/:id      — delete session
GET  /api/ai/status              — check Groq + Ollama status
GET  /api/ai/test-ollama         — test Ollama connection directly

GET  /api/bookmarks              — get all bookmarks
POST /api/bookmarks              — save a bookmark
DELETE /api/bookmarks/:itemId    — remove a bookmark

GET  /api/history                — get search history
DELETE /api/history              — clear search history
```

---

## Common Issues

**Groq returning errors**

Check your key is correctly set in `backend/.env` with no extra spaces. The key should start with `gsk_`. You can verify it works by going to `http://localhost:5000/api/ai/status` and checking that `groqConfigured` is true.

If Groq is hitting rate limits (unlikely on the free tier for dev usage), the app will automatically fall back to Ollama if it's running.

**Ollama not responding**

First check if it's running:
```bash
curl http://localhost:11434/api/tags
```

If that fails, run `ollama serve` and leave the terminal open.

Check the exact model name you have:
```bash
ollama list
```

If it shows `llama3.2:latest` instead of `llama3.2`, update `OLLAMA_MODEL` in `.env` to match exactly what's shown.

**AI responses are slow**

If Groq is configured and working, responses should be 1-3 seconds. If you're seeing 30-60 second responses, Groq isn't being used — check the status endpoint. If you're intentionally running on Ollama only, that slowness is expected on CPU hardware.

**MongoDB connection fails**

The cluster is on Atlas so you need internet. If you're on a network with strict firewall rules it might block the connection on port 27017. Try from a different network.

**PubMed or OpenAlex returns empty**

Both are public APIs with rate limits. If you search repeatedly in quick succession you'll hit the limit temporarily. Wait about 15 seconds and try again. PubMed specifically allows 3 requests per second without an API key.

**Frontend shows blank page**

Make sure the backend is running first on port 5000. The Vite dev server proxies `/api` requests to `localhost:5000` so if the backend isn't up, nothing loads.

---

## Project Structure

```
curalink/
├── backend/
│   ├── models/
│   │   ├── User.js            — user schema with roles and history
│   │   ├── Bookmark.js        — saved papers and trials
│   │   └── ChatSession.js     — Cura AI conversation history
│   ├── routes/
│   │   ├── ai.js              — Groq + Ollama LLM, chat sessions
│   │   ├── auth.js            — JWT register, login, profile
│   │   ├── bookmarks.js       — save and retrieve bookmarks
│   │   ├── history.js         — search history
│   │   ├── openalex.js        — OpenAlex API integration
│   │   ├── research.js        — PubMed API integration
│   │   ├── structured.js      — main pipeline, query expansion, structured output
│   │   ├── trials.js          — ClinicalTrials.gov API integration
│   │   ├── unified.js         — unified search across all three sources
│   │   └── users.js           — user profile endpoints
│   ├── middleware/
│   │   └── auth.js            — JWT verification middleware
│   ├── server.js              — Express app, route mounting, MongoDB connect
│   └── .env                   — environment variables
└── frontend/
    └── src/
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── Dashboard.jsx
        │   ├── StructuredSearchPage.jsx   — main feature page
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
        │   │   ├── Layout.jsx
        │   │   └── Navbar.jsx
        │   └── animations/
        │       └── FloatingParticles.jsx
        ├── store/
        │   └── authStore.js   — Zustand auth state with persistence
        └── utils/
            └── api.js         — Axios instance with auth interceptors
```

---

Built for the Humanity Founders Hackathon.


<!-- frontend
cd c:\Users\arjun\OneDrive\Documents\RESUME\curalink
npm run dev:frontend -->

<!-- Backend
cd c:\Users\arjun\OneDrive\Documents\RESUME\curalink
npm run dev:backend -->

<!-- Installation
cd c:\Users\arjun\OneDrive\Documents\RESUME\curalink
npm run install:all -->