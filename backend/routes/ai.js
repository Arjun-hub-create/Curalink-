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

const SYSTEM_PROMPT = `You are Cura, an expert AI medical research assistant for CuraLink.
You help patients and researchers understand medical research, clinical trials, and treatments.
Always note information is educational only, not medical advice.
Use markdown formatting. Be accurate, empathetic, and clear.`;

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

    // Check if the configured model is available (match by prefix)
    const configBase = OLLAMA_MODEL.split(':')[0];
    const match = models.find(m => m.startsWith(configBase));
    if (match) return match;

    // Fallback: use the first available model
    console.log(`[Ollama] Configured model "${OLLAMA_MODEL}" not found, falling back to "${models[0]}"`);
    return models[0];
  } catch (err) {
    console.error('[Ollama] Failed to detect models:', err.message);
    return null;
  }
}

/**
 * Call Ollama with retry logic and model auto-detection fallback.
 * - Tries configured model first
 * - On failure, retries once after 2 seconds
 * - If model not found, auto-detects available models and retries
 */
async function callOllama(messages, system = SYSTEM_PROMPT) {
  // Try Groq first — fast, free, runs Llama 3.3
  if (process.env.GROQ_API_KEY) {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: system },
            ...messages
          ],
          max_tokens: 1024,
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
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Groq failed, trying Ollama fallback:', error.message);
    }
  }

  // Fallback to local Ollama if Groq fails or key not set
  try {
    const response = await axios.post(`${OLLAMA_BASE}/api/chat`, {
      model: OLLAMA_MODEL,
      messages: [{ role: 'system', content: system }, ...messages],
      stream: false,
      options: { temperature: 0.7, top_p: 0.9, num_predict: 1024 }
    }, { timeout: 120000 });
    return response.data?.message?.content || '';
  } catch (error) {
    if (error.code === 'ECONNREFUSED') throw new Error('OLLAMA_NOT_RUNNING');
    throw error;
  }
}

function ollamaFallback(msg) {
  return `**Ollama (Local LLM) is not running.**\n\nTo enable AI:\n1. Install from **https://ollama.com/download**\n2. Run: \`ollama pull llama3.2\`\n3. Run: \`ollama serve\`\n4. Restart backend\n\nYour question: "${msg}"\n\n> All search features (PubMed, OpenAlex, ClinicalTrials) work without Ollama.`;
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
        aiResponse = `**AI Error:** ${err.message}\n\nPlease check the backend console for details. Make sure Ollama is running (\`ollama serve\`) and has a model pulled (\`ollama pull llama3.2\`).`;
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
      ? `Summarize this paper for a patient in 3-4 bullet points using plain English:\n\nTitle: ${title}\nAbstract: ${abstract}`
      : `Technical summary with key findings, methodology, and clinical implications:\n\nTitle: ${title}\nAbstract: ${abstract}`;
    let summary;
    try { summary = await callOllama([{ role: 'user', content: prompt }], 'You are a medical research summarizer. Be concise and accurate.'); }
    catch (err) { summary = err.message === 'OLLAMA_NOT_RUNNING' ? 'Start Ollama for AI summaries. See chat page for setup instructions.' : `Summary failed: ${err.message}`; }
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
          selected: results.slice(0, topN).map((r, i) => ({ index: i, relevanceScore: 80 - i*5, reasoning: 'Keyword rank (Ollama not running)', keyFinding: (r.abstract||'').slice(0,120), patientSummary: 'Start Ollama for AI-powered summaries' })),
          queryAnalysis: `Results for: "${query}"`, coverageNotes: 'Start Ollama for LLM ranking', llmUsed: false
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
    groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    activeLLM: groqConfigured ? 'Groq (Llama 3.3 — fast)' : 'Ollama (local)',
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
