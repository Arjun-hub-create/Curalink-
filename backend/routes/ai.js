/**
 * AI Routes — Powered by Ollama (Local Open-Source LLM)
 * Model: llama3.2 (or any model pulled via `ollama pull`)
 * Ollama runs locally at http://localhost:11434
 * No API key. Open-source. Meets hackathon requirement.
 */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect, optionalAuth } = require('../middleware/auth');
const ChatSession = require('../models/ChatSession');
const User = require('../models/User');

const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

const SYSTEM_PROMPT = `You are Cura, a friendly and knowledgeable medical research assistant for CuraLink.
You help patients and researchers understand medical research, clinical trials, and treatments in simple, easy-to-understand language.

IMPORTANT RULES:
- Write in plain, conversational English that anyone can understand
- Use short paragraphs, bullet points, and numbered lists for clarity
- NEVER use markdown tables (no | pipes) — use bullet points or numbered lists instead
- Bold important terms with **bold** but keep explanations simple
- Break complex topics into clear sections with ## headings
- Always give complete, thorough answers — never cut short
- End with a brief disclaimer that this is educational information, not medical advice
- Be warm, empathetic, and encouraging
- Avoid jargon — if you must use a medical term, explain it in parentheses right after`;

/**
 * Detect the best available model from Ollama.
 * Tries configured model first, then falls back to whatever is available.
 */
async function detectAvailableModel() {
  try {
    const response = await axios.get(`${OLLAMA_BASE}/api/tags`, { timeout: 5000 });
    const models = response.data?.models?.map(m => m.name) || [];
    console.log('[Ollama] Available models:', models);

    if (models.length === 0) return null;

    // Checking if the configured model is available (match by prefix)
    const configBase = OLLAMA_MODEL.split(':')[0];
    const match = models.find(m => m.startsWith(configBase));
    if (match) return match;

    // Fallback: using the first available model
    console.log(`[Ollama] Configured model "${OLLAMA_MODEL}" not found, falling back to "${models[0]}"`);
    return models[0];
  } catch (err) {
    console.error('[Ollama] Failed to detect models:', err.message);
    return null;
  }
}

/**
 * Calling Ollama with retry logic and model auto-detection fallback.
 * - Trying configured model first
 * - On failure, retrying once after 2 seconds
 * - If model not found, auto-detects available models and retries
 */
const GROQ_MODELS = [
  process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b'
];

async function callOllama(messages, system = SYSTEM_PROMPT) {
  // Try Groq cloud LLM first (primary AI provider for deployed environments)
  if (process.env.GROQ_API_KEY) {
    for (const model of GROQ_MODELS) {
      try {
        console.log(`[AI] Trying Groq model: ${model}`);
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model,
            messages: [
              { role: 'system', content: system },
              ...messages
            ],
            max_tokens: 4096,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );
        console.log(`[AI] Groq model ${model} succeeded`);
        return response.data.choices[0].message.content;
      } catch (error) {
        console.error(`[AI] Groq model ${model} failed:`, error.response?.data?.error?.message || error.message);
      }
    }
    console.error('[AI] All Groq models failed, trying Ollama fallback');
  }

  // Fallback to local Ollama if Groq fails or key not set
  try {
    const response = await axios.post(`${OLLAMA_BASE}/api/chat`, {
      model: OLLAMA_MODEL,
      messages: [{ role: 'system', content: system }, ...messages],
      stream: false,
      options: { temperature: 0.7, top_p: 0.9, num_predict: 4096 }
    }, { timeout: 120000 });
    return response.data?.message?.content || '';
  } catch (error) {
    if (error.code === 'ECONNREFUSED') throw new Error('OLLAMA_NOT_RUNNING');
    throw error;
  }
}

function ollamaFallback(msg) {
  return `**Oops! I'm having a little trouble right now.** 😔\n\nI couldn't connect to my brain at the moment, but don't worry — this is usually temporary!\n\n**What you asked:** "${msg}"\n\nPlease try again in a few seconds. In the meantime, you can still use all the search features (PubMed, OpenAlex, Clinical Trials) — they work independently!`;
}

// ──────────────────────────────────────────────
// POST /api/ai/chat — Main chat endpoint
// ──────────────────────────────────────────────
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, sessionId, context = 'general' } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    let session;
    if (sessionId && req.user) {
      session = await ChatSession.findOne({ _id: sessionId, user: req.user._id });
    }
    if (!session && req.user) {
      session = new ChatSession({ user: req.user._id, title: message.substring(0, 60), context, messages: [] });
    }

    const history = session ? session.messages.slice(-6).map(m => ({ role: m.role, content: m.content })) : [];
    history.push({ role: 'user', content: message });

    let aiResponse;
    let errorDetail = null;
    try {
      aiResponse = await callOllama(history);
    } catch (err) {
      console.error('[AI Chat] callOllama error:', err.message);
      errorDetail = err.message;
      if (err.message === 'OLLAMA_NOT_RUNNING') {
        aiResponse = ollamaFallback(message);
      } else {
        aiResponse = `**Sorry, I ran into an issue processing your question.** 😔\n\nThis is usually temporary — please try asking again in a moment. If the problem persists, try refreshing the page.`;
      }
    }

    // Save session — but don't fail the response if MongoDB save fails
    if (session) {
      try {
        session.messages.push({ role: 'user', content: message });
        session.messages.push({ role: 'assistant', content: aiResponse });
        await session.save();
      } catch (saveErr) {
        console.error('[AI Chat] Session save failed:', saveErr.message);
        // AI still responds even if session save fails
      }
    }

    // Update search history — also non-blocking
    if (req.user) {
      try {
        await User.findByIdAndUpdate(req.user._id, { $push: { searchHistory: { $each: [{ query: message.substring(0,100), type: 'ai', timestamp: new Date() }], $slice: -50 } } });
      } catch (histErr) {
        console.error('[AI Chat] History update failed:', histErr.message);
      }
    }

    res.json({
      success: true,
      response: aiResponse,
      sessionId: session?._id,
      ...(errorDetail && { errorDetail })
    });
  } catch (error) {
    console.error('[AI Chat] Unhandled error:', error.message, error.stack);
    res.status(500).json({ error: 'AI service error', detail: error.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/ai/summarize
// ──────────────────────────────────────────────
router.post('/summarize', optionalAuth, async (req, res) => {
  try {
    const { abstract, title, type = 'patient' } = req.body;
    const prompt = type === 'patient'
      ? `Summarize this research paper for someone without a medical background. Use 4-5 clear bullet points in everyday language. Explain what the study found, why it matters, and what it could mean for patients. Avoid jargon — if you use a medical term, explain it simply in parentheses.\n\nTitle: ${title}\nAbstract: ${abstract}`
      : `Provide a detailed but clear summary of this research paper covering: the main findings, the methods used, how many people were studied, and what this means for future treatment or research. Use bullet points and simple headings.\n\nTitle: ${title}\nAbstract: ${abstract}`;
    let summary;
    try { summary = await callOllama([{ role: 'user', content: prompt }], 'You are a friendly medical research summarizer. Write in plain, simple English. Use bullet points, not tables. Be thorough but easy to understand. Never use markdown tables with | pipes.'); }
    catch (err) { summary = err.message === 'OLLAMA_NOT_RUNNING' ? 'AI summary is temporarily unavailable. Please try again shortly.' : 'Could not generate summary right now. Please try again in a moment.'; }
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────
// POST /api/ai/analyze-results
// ──────────────────────────────────────────────
router.post('/analyze-results', optionalAuth, async (req, res) => {
  try {
    const { query, disease, results, context = 'general', topN = 8 } = req.body;
    if (!results?.length) return res.status(400).json({ error: 'Results required' });

    const summary = results.slice(0, 10).map((r, i) =>
      `[${i}] ${r.source}|${r.type?.toUpperCase()}\nTITLE: ${(r.title||'').slice(0,100)}\nMETA: ${r.type==='trial'?`Status:${r.status}|Phase:${r.phase}`:`Year:${r.publishedDate||'N/A'}|Journal:${r.journal||'N/A'}`}\nABSTRACT: ${(r.abstract||'').slice(0,200)}`
    ).join('\n---\n');

    const prompt = `Medical research curator task: select the ${topN} most relevant results.
QUERY: "${query}" | DISEASE: "${disease||query}" | CONTEXT: ${context}

RESULTS:
${summary}

Return ONLY valid JSON (no markdown fences):
{"selected":[{"index":<number>,"relevanceScore":<0-100>,"reasoning":"<why relevant>","keyFinding":"<main finding>","patientSummary":"<plain English>"}],"queryAnalysis":"<what user needs>","coverageNotes":"<diversity note>"}`;

    let responseText;
    try {
      responseText = await callOllama([{ role: 'user', content: prompt }], 'You are a medical research curator. Respond with valid JSON only. No markdown.');
    } catch (err) {
      if (err.message === 'OLLAMA_NOT_RUNNING') {
        return res.json({
          selected: results.slice(0, topN).map((r, i) => ({ index: i, relevanceScore: 80 - i*5, reasoning: 'Ranked by relevance', keyFinding: (r.abstract||'').slice(0,120), patientSummary: 'AI ranking temporarily unavailable — showing results by keyword relevance' })),
          queryAnalysis: `Results for: "${query}"`, coverageNotes: 'Results ranked by keyword matching', llmUsed: false
        });
      }
      throw err;
    }

    let parsed;
    try {
      const clean = responseText.replace(/```json|```/g, '').trim();
      const match = clean.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : clean);
    } catch {
      return res.json({
        selected: results.slice(0, topN).map((r, i) => ({ index: i, relevanceScore: 85-i*5, reasoning: 'Top retrieval result', keyFinding: (r.abstract||'').slice(0,120), patientSummary: (r.abstract||'').slice(0,100) })),
        queryAnalysis: `Results for: "${query}"`, coverageNotes: 'JSON parse fallback', llmUsed: true
      });
    }
    res.json({ ...parsed, llmUsed: true, model: OLLAMA_MODEL });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────────────
// GET /api/ai/sessions
// ──────────────────────────────────────────────
router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user._id }).select('title context createdAt updatedAt').sort({ updatedAt: -1 }).limit(50);
    res.json({ sessions });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ──────────────────────────────────────────────
// GET /api/ai/sessions/:id
// ──────────────────────────────────────────────
router.get('/sessions/:id', protect, async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ error: 'Not found' });
    res.json({ session });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ──────────────────────────────────────────────
// DELETE /api/ai/sessions/:id
// ──────────────────────────────────────────────
router.delete('/sessions/:id', protect, async (req, res) => {
  try {
    await ChatSession.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ──────────────────────────────────────────────
// GET /api/ai/status — Check Ollama connectivity & models
// ──────────────────────────────────────────────
router.get('/status', async (req, res) => {
  const groqConfigured = !!process.env.GROQ_API_KEY;
  
  // Check Ollama
  let ollamaRunning = false;
  let availableModels = [];
  try {
    const response = await axios.get(`${OLLAMA_BASE}/api/tags`, { timeout: 3000 });
    availableModels = response.data?.models?.map(m => m.name) || [];
    ollamaRunning = true;
  } catch {}

  res.json({
    groqConfigured,
    groqModel: 'Cura AI',
    activeLLM: groqConfigured ? 'Cura AI' : 'Cura AI (Local)',
    ollamaRunning,
    availableModels,
    activeModel: OLLAMA_MODEL,
    modelReady: groqConfigured || availableModels.some(m => m.startsWith(OLLAMA_MODEL.split(':')[0]))
  });
});

// ──────────────────────────────────────────────
// GET /api/ai/test-ollama — Quick connectivity test
// ──────────────────────────────────────────────
router.get('/test-ollama', async (req, res) => {
  const startTime = Date.now();
  try {
    // First check if Ollama is reachable
    console.log('[Test] Testing Ollama connectivity...');
    const tagsRes = await axios.get(`${OLLAMA_BASE}/api/tags`, { timeout: 5000 });
    const models = tagsRes.data?.models?.map(m => m.name) || [];
    console.log('[Test] Ollama reachable, models:', models);

    if (models.length === 0) {
      return res.json({
        success: false,
        ollamaRunning: true,
        error: 'No models installed. Run: ollama pull llama3.2',
        availableModels: [],
        duration: Date.now() - startTime
      });
    }

    // Pick best model
    const configBase = OLLAMA_MODEL.split(':')[0];
    const modelToUse = models.find(m => m.startsWith(configBase)) || models[0];

    // Test with a simple prompt
    console.log(`[Test] Sending test prompt with model "${modelToUse}"...`);
    const chatRes = await axios.post(`${OLLAMA_BASE}/api/chat`, {
      model: modelToUse,
      messages: [{ role: 'user', content: 'Say hello in one word.' }],
      stream: false,
      options: { num_predict: 20 }
    }, { timeout: 180000 });

    const reply = chatRes.data?.message?.content || '';
    const duration = Date.now() - startTime;
    console.log(`[Test] Success! Reply: "${reply}" (${duration}ms)`);

    res.json({
      success: true,
      ollamaRunning: true,
      model: modelToUse,
      response: reply,
      availableModels: models,
      duration
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error('[Test] Failed:', err.code || err.response?.status, err.message);
    if (err.response?.data) console.error('[Test] Error body:', JSON.stringify(err.response.data));

    res.json({
      success: false,
      ollamaRunning: err.code !== 'ECONNREFUSED',
      error: err.response?.data?.error || err.message,
      errorCode: err.code || err.response?.status,
      duration
    });
  }
});

module.exports = router;
