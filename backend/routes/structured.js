/**
 * STRUCTURED SEARCH ROUTE
 * ========================
 * Handles the spec's required structured input:
 *   - Patient Name
 *   - Disease of Interest
 *   - Additional Query
 *   - Location
 *
 * Features:
 *   1. Query expansion  → "deep brain stimulation" + "Parkinson's" = combined smart query
 *   2. Parallel fetch from PubMed + OpenAlex + ClinicalTrials
 *   3. Ollama LLM filters to top 6-8 results
 *   4. Returns structured response with:
 *        - Condition Overview
 *        - Research Insights
 *        - Clinical Trials
 *        - Source Attribution
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');
const NodeCache = require('node-cache');
const { optionalAuth } = require('../middleware/auth');
const User = require('../models/User');

const cache = new NodeCache({ stdTTL: 300 });
const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const OPENALEX_BASE = 'https://api.openalex.org';
const CT_BASE = 'https://clinicaltrials.gov/api/v2';
const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

const parseXML = (xml) => new Promise((resolve, reject) => {
  xml2js.parseString(xml, { explicitArray: false }, (err, r) => err ? reject(err) : resolve(r));
});

// ── Query Expansion Logic ─────────────────────────────────────────────────────
// Spec requirement: "deep brain stimulation" → "deep brain stimulation + Parkinson's disease"
function buildExpandedQuery(disease, additionalQuery, location) {
  const parts = [];

  if (disease && disease.trim()) parts.push(disease.trim());
  if (additionalQuery && additionalQuery.trim()) parts.push(additionalQuery.trim());

  // Location added for clinical trials only (not publications)
  const pubQuery = parts.join(' AND ');
  const trialQuery = location && location.trim()
    ? parts.join(' AND ')  // location handled separately via API param
    : pubQuery;

  return {
    pubQuery,        // for PubMed + OpenAlex
    trialQuery,      // for ClinicalTrials
    displayQuery: parts.join(' + ')  // shown to user
  };
}

// ── Ollama call ───────────────────────────────────────────────────────────────
async function detectAvailableModel() {
  try {
    const response = await axios.get(`${OLLAMA_BASE}/api/tags`, { timeout: 5000 });
    const models = response.data?.models?.map(m => m.name) || [];
    if (models.length === 0) return null;
    const configBase = OLLAMA_MODEL.split(':')[0];
    const match = models.find(m => m.startsWith(configBase));
    return match || models[0];
  } catch { return null; }
}

async function callOllama(prompt, system) {
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: prompt }
  ];
  const opts = { temperature: 0.3, top_p: 0.9, num_predict: 3000 };

  // Attempt 1
  try {
    console.log(`[Structured/Ollama] Attempt 1 — model: "${OLLAMA_MODEL}"`);
    const response = await axios.post(`${OLLAMA_BASE}/api/chat`, {
      model: OLLAMA_MODEL, messages, stream: false, options: opts
    }, { timeout: 180000 });
    console.log('[Structured/Ollama] Attempt 1 succeeded');
    return response.data?.message?.content || '';
  } catch (error) {
    console.error('[Structured/Ollama] Attempt 1 failed:', error.code || error.response?.status, error.message);
    if (error.code === 'ECONNREFUSED') throw new Error('OLLAMA_NOT_RUNNING');
  }

  // Wait 2s, retry with auto-detected model
  await new Promise(r => setTimeout(r, 2000));
  try {
    const detectedModel = await detectAvailableModel();
    const modelToUse = detectedModel || OLLAMA_MODEL;
    console.log(`[Structured/Ollama] Attempt 2 — model: "${modelToUse}"`);
    const response = await axios.post(`${OLLAMA_BASE}/api/chat`, {
      model: modelToUse, messages, stream: false, options: opts
    }, { timeout: 180000 });
    console.log('[Structured/Ollama] Attempt 2 succeeded');
    return response.data?.message?.content || '';
  } catch (error) {
    console.error('[Structured/Ollama] Attempt 2 failed:', error.code || error.response?.status, error.message);
    if (error.code === 'ECONNREFUSED') throw new Error('OLLAMA_NOT_RUNNING');
    throw error;
  }
}

// ── Fetch PubMed ──────────────────────────────────────────────────────────────
async function fetchPubMed(query, count = 100) {
  try {
    const searchRes = await axios.get(`${PUBMED_BASE}/esearch.fcgi`, {
      params: { db: 'pubmed', term: query, retmax: Math.min(count, 200), retmode: 'json', sort: 'relevance' },
      timeout: 12000
    });
    const ids = searchRes.data.esearchresult?.idlist || [];
    if (!ids.length) return [];

    const fetchRes = await axios.get(`${PUBMED_BASE}/efetch.fcgi`, {
      params: { db: 'pubmed', id: ids.slice(0, 100).join(','), retmode: 'xml', rettype: 'abstract' },
      timeout: 15000
    });
    const parsed = await parseXML(fetchRes.data);
    const articles = parsed?.PubmedArticleSet?.PubmedArticle;
    const arr = Array.isArray(articles) ? articles : (articles ? [articles] : []);

    return arr.map(article => {
      try {
        const medline = article.MedlineCitation;
        const ad = medline?.Article;
        const pmid = String(medline?.PMID?._ || medline?.PMID || '');

        let authors = [];
        const al = ad?.AuthorList?.Author;
        if (al) {
          const aa = Array.isArray(al) ? al : [al];
          authors = aa.map(a => a.CollectiveName || `${a.LastName || ''} ${a.ForeName || a.Initials || ''}`.trim()).filter(Boolean);
        }

        let abstract = '';
        const abObj = ad?.Abstract?.AbstractText;
        if (abObj) {
          if (typeof abObj === 'string') abstract = abObj;
          else if (Array.isArray(abObj)) abstract = abObj.map(a => typeof a === 'string' ? a : a._ || '').join(' ');
          else if (abObj._) abstract = abObj._;
        }

        const journal = ad?.Journal?.Title || '';
        const pubDate = ad?.Journal?.JournalIssue?.PubDate;
        const publishedDate = pubDate ? [pubDate.Year, pubDate.Month].filter(Boolean).join(' ') : '';

        if (!abstract || !pmid) return null;
        return {
          id: `pmid_${pmid}`, pmid, type: 'publication', source: 'PubMed',
          title: ad?.ArticleTitle?._ || ad?.ArticleTitle || '',
          authors, abstract, journal, publishedDate,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
        };
      } catch { return null; }
    }).filter(Boolean);
  } catch (err) {
    console.error('PubMed fetch error:', err.message);
    return [];
  }
}

// ── Fetch OpenAlex ────────────────────────────────────────────────────────────
async function fetchOpenAlex(query, count = 100) {
  try {
    const response = await axios.get(`${OPENALEX_BASE}/works`, {
      params: {
        search: query, per_page: Math.min(count, 200), page: 1,
        filter: 'is_retracted:false',
        select: 'id,doi,display_name,publication_year,publication_date,authorships,primary_location,abstract_inverted_index,cited_by_count,concepts',
        sort: 'relevance_score:desc',
        mailto: 'curalink@research.ai'
      },
      timeout: 15000
    });

    return (response.data.results || []).map(work => {
      let abstract = '';
      if (work.abstract_inverted_index) {
        try {
          const wp = [];
          for (const [word, positions] of Object.entries(work.abstract_inverted_index)) {
            positions.forEach(pos => wp.push({ word, pos }));
          }
          wp.sort((a, b) => a.pos - b.pos);
          abstract = wp.map(w => w.word).join(' ');
        } catch {}
      }
      if (!abstract || !work.display_name) return null;

      const authors = (work.authorships || []).slice(0, 5).map(a => a.author?.display_name).filter(Boolean);
      const oaId = work.id?.replace('https://openalex.org/', '') || '';
      const concepts = (work.concepts || []).filter(c => c.score > 0.4).slice(0, 5).map(c => c.display_name);

      return {
        id: `oa_${oaId}`, openAlexId: oaId, type: 'publication', source: 'OpenAlex',
        title: work.display_name || '',
        authors, abstract,
        journal: work.primary_location?.source?.display_name || '',
        publishedDate: work.publication_date || String(work.publication_year || ''),
        citedByCount: work.cited_by_count || 0,
        keywords: concepts,
        url: work.doi ? `https://doi.org/${work.doi}` : `https://openalex.org/${oaId}`
      };
    }).filter(Boolean);
  } catch (err) {
    console.error('OpenAlex fetch error:', err.message);
    return [];
  }
}

// ── Fetch ClinicalTrials ──────────────────────────────────────────────────────
async function fetchTrials(query, location, count = 50) {
  try {
    const params = {
      format: 'json', pageSize: Math.min(count, 100),
      'query.term': query, countTotal: true
    };
    if (location && location.trim()) params['query.locn'] = location.trim();

    const response = await axios.get(`${CT_BASE}/studies`, { params, timeout: 12000 });

    return (response.data.studies || []).map(study => {
      const proto = study.protocolSection;
      const id = proto?.identificationModule;
      const status = proto?.statusModule;
      const desc = proto?.descriptionModule;
      const eligibility = proto?.eligibilityModule;
      const design = proto?.designModule;
      const conditions = proto?.conditionsModule;
      const sponsors = proto?.sponsorCollaboratorsModule;
      const contactsMod = proto?.contactsLocationsModule;

      const nctId = id?.nctId || '';
      const summary = desc?.briefSummary || '';
      if (!nctId || !summary) return null;

      // Contacts
      const contacts = (contactsMod?.centralContacts || []).slice(0, 3).map(c => ({
        name: c.name || '', role: c.role || '',
        phone: c.phone || '', email: c.email || ''
      }));

      const locations = (contactsMod?.locations || []).slice(0, 5).map(loc => ({
        facility: loc.facility || '', city: loc.city || '',
        state: loc.state || '', country: loc.country || '',
        status: loc.status || ''
      }));

      return {
        id: `ct_${nctId}`, nctId, type: 'trial', source: 'ClinicalTrials.gov',
        title: id?.briefTitle || '',
        abstract: summary,
        status: status?.overallStatus || 'Unknown',
        phase: design?.phases?.join(', ') || 'N/A',
        conditions: conditions?.conditions || [],
        sponsors: sponsors?.leadSponsor?.name || '',
        eligibility: {
          criteria: eligibility?.eligibilityCriteria || '',
          minAge: eligibility?.minimumAge || '',
          maxAge: eligibility?.maximumAge || '',
          sex: eligibility?.sex || 'All'
        },
        contacts,
        locations,
        enrollment: design?.enrollmentInfo?.count || null,
        startDate: status?.startDateStruct?.date || '',
        completionDate: status?.completionDateStruct?.date || '',
        url: `https://clinicaltrials.gov/study/${nctId}`
      };
    }).filter(Boolean);
  } catch (err) {
    console.error('ClinicalTrials fetch error:', err.message);
    return [];
  }
}

// ── LLM Ranking ───────────────────────────────────────────────────────────────
async function rankWithLLM(query, disease, results, topN = 8) {
  const summary = results.slice(0, 10).map((r, i) => {
    const meta = r.type === 'trial'
      ? `Status:${r.status}|Phase:${r.phase}|Conditions:${(r.conditions||[]).slice(0,2).join(',')}`
      : `Source:${r.source}|Year:${r.publishedDate||'N/A'}|Journal:${(r.journal||'').slice(0,40)}`;
    return `[${i}] ${r.source}|${r.type.toUpperCase()}\nTITLE: ${(r.title||'').slice(0,100)}\n${meta}\nABSTRACT: ${(r.abstract||'').slice(0,200)}`;
  }).join('\n---\n');

  const prompt = `Select the ${topN} most relevant results for:
DISEASE: "${disease}"
QUERY: "${query}"

RESULTS:
${summary}

Return ONLY valid JSON (absolutely no markdown, no text outside JSON):
{"selected":[{"index":<number>,"relevanceScore":<0-100>,"reasoning":"<why relevant>","keyFinding":"<main finding>","patientSummary":"<plain English one sentence>"}],"conditionOverview":"<2-3 sentences about ${disease}>","queryAnalysis":"<what the user needs>"}`;

  try {
    const text = await callOllama(prompt, 'You are a medical research curator. Return only valid JSON. No markdown. No explanation outside the JSON object.');
    const clean = text.replace(/```json|```/g, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : clean);

    const ranked = (parsed.selected || [])
      .filter(s => typeof s.index === 'number' && s.index >= 0 && s.index < results.length)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(s => ({
        ...results[s.index],
        llmRelevanceScore: s.relevanceScore,
        llmReasoning: s.reasoning,
        llmKeyFinding: s.keyFinding,
        llmPatientSummary: s.patientSummary,
        rankedByAI: true
      }));

    return { ranked, conditionOverview: parsed.conditionOverview || '', queryAnalysis: parsed.queryAnalysis || '', llmUsed: true };
  } catch (err) {
    console.error('LLM ranking error:', err.message);
    // Keyword fallback
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const scored = results.map((r, i) => {
      const text = `${r.title} ${r.abstract} ${(r.conditions||[]).join(' ')}`.toLowerCase();
      let score = words.reduce((s, w) => s + (text.includes(w) ? 20 : 0) + ((r.title||'').toLowerCase().includes(w) ? 30 : 0), 0);
      if (r.status === 'RECRUITING') score += 20;
      if (r.citedByCount > 50) score += 15;
      return { ...r, llmRelevanceScore: Math.min(score, 95), rankedByAI: false, index: i };
    }).sort((a, b) => b.llmRelevanceScore - a.llmRelevanceScore);
    return { ranked: scored.slice(0, topN), conditionOverview: '', queryAnalysis: `Results for "${query}"`, llmUsed: false };
  }
}

// ── POST /api/structured/search ───────────────────────────────────────────────
router.post('/search', optionalAuth, async (req, res) => {
  try {
    const {
      patientName = '',
      disease = '',
      additionalQuery = '',
      location = '',
      fetchCount = 80,
      topN = 8
    } = req.body;

    if (!disease && !additionalQuery) {
      return res.status(400).json({ error: 'Please provide at least a disease or query' });
    }

    // Step 1: Query expansion
    const { pubQuery, trialQuery, displayQuery } = buildExpandedQuery(disease, additionalQuery, location);

    const cacheKey = `structured_${pubQuery}_${location}_${fetchCount}_${topN}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      // Personalize cached result with name if provided
      if (patientName) cached.patientName = patientName;
      return res.json(cached);
    }

    const count = Math.min(Math.max(parseInt(fetchCount) || 80, 50), 300);
    const finalTopN = Math.min(Math.max(parseInt(topN) || 8, 5), 15);

    // Step 2: Fetch all 3 sources in parallel
    const [pubmedResults, openAlexResults, trialResults] = await Promise.all([
      fetchPubMed(pubQuery, count),
      fetchOpenAlex(pubQuery, count),
      fetchTrials(trialQuery, location, Math.floor(count / 2))
    ]);

    const totalFetched = pubmedResults.length + openAlexResults.length + trialResults.length;
    const allResults = [...pubmedResults, ...openAlexResults, ...trialResults];

    if (totalFetched === 0) {
      return res.json({
        patientName, disease, expandedQuery: displayQuery,
        results: [], totalFetched: 0,
        conditionOverview: `No results found for "${disease}". Try different search terms.`,
        structuredResponse: null, llmUsed: false
      });
    }

    // Step 3: LLM ranking — top 6-8
    const { ranked, conditionOverview, queryAnalysis, llmUsed } =
      await rankWithLLM(pubQuery, disease || additionalQuery, allResults, finalTopN);

    // Step 4: Build structured response
    const publications = ranked.filter(r => r.type === 'publication');
    const trials = ranked.filter(r => r.type === 'trial');

    // Step 5: Generate structured text response via Ollama
    let structuredText = null;
    try {
      const pubSummaries = publications.slice(0, 4).map((p, i) =>
        `${i+1}. "${p.title}" (${p.source}, ${p.publishedDate || 'N/A'}) - ${(p.abstract||'').slice(0,150)}...`
      ).join('\n');

      const trialSummaries = trials.slice(0, 3).map((t, i) =>
        `${i+1}. "${t.title}" - Status: ${t.status}, Phase: ${t.phase}, Conditions: ${(t.conditions||[]).slice(0,2).join(', ')}`
      ).join('\n');

      const structuredPrompt = `Generate a structured medical research brief for:
${patientName ? `Patient: ${patientName}\n` : ''}Disease: ${disease || 'Not specified'}
Query: ${additionalQuery || 'General research'}
${location ? `Location: ${location}` : ''}

Based on these retrieved results:
PUBLICATIONS:
${pubSummaries || 'None found'}

CLINICAL TRIALS:
${trialSummaries || 'None found'}

Write a structured response with these exact sections:
**Condition Overview**
[2-3 sentences about ${disease || additionalQuery}]

**Key Research Insights**
[3-4 bullet points from the publications above]

**Relevant Clinical Trials**
[Summary of trials found, or "No trials found" if empty]

**Important Note**
[Standard medical disclaimer]

Be concise, accurate, and evidence-based. Reference the actual papers found.`;

      structuredText = await callOllama(structuredPrompt,
        'You are a medical research assistant generating structured research briefs. Be accurate, cite the provided sources, and be helpful.');
    } catch (err) {
      // If Ollama not running, generate a basic structured response without LLM
      if (err.message === 'OLLAMA_NOT_RUNNING') {
        const pubLines = publications.slice(0, 4).map((p, i) =>
          `• ${p.title} (${p.source}, ${p.publishedDate || 'N/A'})`
        ).join('\n');
        const trialLines = trials.slice(0, 3).map((t, i) =>
          `• ${t.title} — Status: ${t.status}`
        ).join('\n');

        structuredText = `**Condition Overview**\nShowing research results for: ${disease || additionalQuery}. Start Ollama for AI-generated overview.\n\n**Key Research Insights**\n${pubLines || '• No publications found'}\n\n**Relevant Clinical Trials**\n${trialLines || '• No trials found'}\n\n**Important Note**\nThis information is for educational purposes only. Consult a healthcare professional for medical decisions.`;
      } else {
        structuredText = null;
      }
    }

    // Save to user history
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          searchHistory: {
            $each: [{ query: pubQuery.substring(0, 100), type: 'pubmed', timestamp: new Date() }],
            $slice: -50
          }
        }
      });
    }

    const result = {
      patientName,
      disease,
      additionalQuery,
      location,
      expandedQuery: displayQuery,
      totalFetched,
      totalReturned: ranked.length,
      sourceMeta: {
        PubMed: pubmedResults.length,
        OpenAlex: openAlexResults.length,
        'ClinicalTrials.gov': trialResults.length
      },
      conditionOverview,
      queryAnalysis,
      structuredResponse: structuredText,
      results: ranked,         // top 6-8 ranked results
      publications,            // publication subset
      trials,                  // trials subset
      llmUsed,
      pipeline: {
        step1: `Query expanded: "${displayQuery}"`,
        step2: `Fetched ${totalFetched} results (PubMed:${pubmedResults.length}, OpenAlex:${openAlexResults.length}, Trials:${trialResults.length})`,
        step3: `LLM ranked top ${ranked.length} results`,
        step4: 'Structured response generated'
      }
    };

    cache.set(cacheKey, result);
    res.json(result);

  } catch (error) {
    console.error('Structured search error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

module.exports = router;
