/**
 * UNIFIED SEARCH + LLM FILTERING PIPELINE
 * =========================================
 * This is the core intelligence engine of CuraLink.
 *
 * Flow:
 *  1. Query all 3 APIs in parallel (PubMed, OpenAlex, ClinicalTrials.gov)
 *  2. Each returns 50–300 raw results
 *  3. A custom LLM prompt scores & selects the 8–10 most relevant records
 *  4. Returns ranked, annotated results with AI reasoning
 *
 * GET /api/unified/search?query=...&context=patient|researcher&limit=100
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');
const NodeCache = require('node-cache');
const { optionalAuth } = require('../middleware/auth');

const cache = new NodeCache({ stdTTL: 300 }); // 5-min cache
const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const OPENALEX_BASE = 'https://api.openalex.org';
const CT_BASE = 'https://clinicaltrials.gov/api/v2';
const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const parseXML = (xml) => new Promise((resolve, reject) => {
  xml2js.parseString(xml, { explicitArray: false }, (err, r) => err ? reject(err) : resolve(r));
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Source Fetchers (each returns 50–300 results) ────────────────────────────

async function fetchPubMed(query, count = 100) {
  try {
    const clampedCount = Math.min(Math.max(count, 50), 300);

    // Search for IDs
    const searchRes = await axios.get(`${PUBMED_BASE}/esearch.fcgi`, {
      params: { db: 'pubmed', term: query, retmax: clampedCount, retmode: 'json', sort: 'relevance' },
      timeout: 12000
    });
    const ids = searchRes.data.esearchresult?.idlist || [];
    const total = parseInt(searchRes.data.esearchresult?.count || '0');
    if (!ids.length) return { results: [], total, source: 'PubMed' };

    // Fetch details in batches of 100
    const batches = [];
    for (let i = 0; i < ids.length; i += 100) {
      batches.push(ids.slice(i, i + 100));
    }

    const allArticles = [];
    for (const batch of batches) {
      const fetchRes = await axios.get(`${PUBMED_BASE}/efetch.fcgi`, {
        params: { db: 'pubmed', id: batch.join(','), retmode: 'xml', rettype: 'abstract' },
        timeout: 15000
      });
      const parsed = await parseXML(fetchRes.data);
      const articles = parsed?.PubmedArticleSet?.PubmedArticle;
      const arr = Array.isArray(articles) ? articles : (articles ? [articles] : []);

      arr.forEach(article => {
        try {
          const medline = article.MedlineCitation;
          const ad = medline?.Article;
          const pmid = medline?.PMID?._ || medline?.PMID;

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

          const journal = ad?.Journal?.Title || ad?.Journal?.ISOAbbreviation || '';
          const pubDate = ad?.Journal?.JournalIssue?.PubDate;
          const publishedDate = pubDate ? [pubDate.Year, pubDate.Month, pubDate.Day].filter(Boolean).join(' ') : '';

          let keywords = [];
          const kwList = medline?.KeywordList?.Keyword;
          if (kwList) keywords = Array.isArray(kwList) ? kwList.map(k => k._ || k).filter(Boolean) : [kwList._ || kwList].filter(Boolean);

          if (abstract && pmid) {
            allArticles.push({
              id: `pmid_${pmid}`,
              pmid: String(pmid),
              title: ad?.ArticleTitle?._ || ad?.ArticleTitle || '',
              authors,
              abstract,
              journal,
              publishedDate,
              keywords,
              url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
              source: 'PubMed',
              type: 'publication'
            });
          }
        } catch {}
      });

      if (batches.length > 1) await sleep(300); // Rate limit courtesy
    }

    return { results: allArticles, total, source: 'PubMed' };
  } catch (error) {
    console.error('PubMed fetch error:', error.message);
    return { results: [], total: 0, source: 'PubMed', error: error.message };
  }
}

async function fetchOpenAlex(query, count = 100) {
  try {
    const perPage = Math.min(Math.max(count, 50), 200); // OpenAlex max 200/page

    const response = await axios.get(`${OPENALEX_BASE}/works`, {
      params: {
        search: query,
        per_page: perPage,
        page: 1,
        filter: 'is_retracted:false',
        select: 'id,doi,display_name,publication_year,publication_date,type,open_access,authorships,primary_location,abstract_inverted_index,cited_by_count,concepts,keywords',
        sort: 'relevance_score:desc',
        mailto: 'curalink@research.ai'
      },
      timeout: 15000
    });

    const works = response.data.results || [];
    const total = response.data.meta?.count || 0;

    const results = works.map(work => {
      let abstract = '';
      if (work.abstract_inverted_index) {
        try {
          const wordPositions = [];
          for (const [word, positions] of Object.entries(work.abstract_inverted_index)) {
            positions.forEach(pos => wordPositions.push({ word, pos }));
          }
          wordPositions.sort((a, b) => a.pos - b.pos);
          abstract = wordPositions.map(wp => wp.word).join(' ');
        } catch {}
      }

      const authors = (work.authorships || []).slice(0, 5).map(a => a.author?.display_name).filter(Boolean);
      const concepts = (work.concepts || []).filter(c => c.score > 0.4).slice(0, 6).map(c => c.display_name);
      const oaId = work.id?.replace('https://openalex.org/', '') || '';

      if (!abstract || !work.display_name) return null;

      return {
        id: `oa_${oaId}`,
        openAlexId: oaId,
        doi: work.doi,
        title: work.display_name || '',
        authors,
        abstract,
        journal: work.primary_location?.source?.display_name || '',
        publishedDate: work.publication_date || String(work.publication_year || ''),
        publishedYear: work.publication_year,
        keywords: concepts,
        citedByCount: work.cited_by_count || 0,
        isOpenAccess: work.open_access?.is_oa || false,
        url: work.doi ? `https://doi.org/${work.doi}` : `https://openalex.org/${oaId}`,
        source: 'OpenAlex',
        type: 'publication'
      };
    }).filter(Boolean);

    return { results, total, source: 'OpenAlex' };
  } catch (error) {
    console.error('OpenAlex fetch error:', error.message);
    return { results: [], total: 0, source: 'OpenAlex', error: error.message };
  }
}

async function fetchClinicalTrials(query, count = 50) {
  try {
    const pageSize = Math.min(Math.max(count, 20), 200);

    const response = await axios.get(`${CT_BASE}/studies`, {
      params: {
        format: 'json',
        pageSize,
        'query.term': query,
        countTotal: true,
        'fields': 'NCTId,BriefTitle,OfficialTitle,OverallStatus,Phase,BriefSummary,Condition,InterventionName,LeadSponsorName,StartDate,CompletionDate,EnrollmentCount,EligibilityCriteria,MinimumAge,MaximumAge,Sex,HealthyVolunteers,LocationCity,LocationCountry,LocationFacility'
      },
      timeout: 12000
    });

    const studies = response.data.studies || [];
    const total = response.data.totalCount || 0;

    const results = studies.map(study => {
      const proto = study.protocolSection;
      const id = proto?.identificationModule;
      const status = proto?.statusModule;
      const desc = proto?.descriptionModule;
      const eligibility = proto?.eligibilityModule;
      const design = proto?.designModule;
      const conditions = proto?.conditionsModule;
      const sponsors = proto?.sponsorCollaboratorsModule;

      const nctId = id?.nctId || '';
      const summary = desc?.briefSummary || '';
      if (!nctId || !summary) return null;

      return {
        id: `ct_${nctId}`,
        nctId,
        title: id?.briefTitle || id?.officialTitle || '',
        status: status?.overallStatus || 'Unknown',
        phase: design?.phases?.join(', ') || 'N/A',
        conditions: conditions?.conditions || [],
        abstract: summary,
        sponsors: sponsors?.leadSponsor?.name || '',
        startDate: status?.startDateStruct?.date || '',
        completionDate: status?.completionDateStruct?.date || '',
        enrollment: design?.enrollmentInfo?.count || null,
        eligibility: {
          minAge: eligibility?.minimumAge,
          maxAge: eligibility?.maximumAge,
          sex: eligibility?.sex,
          healthyVolunteers: eligibility?.healthyVolunteers
        },
        contacts: (proto?.contactsLocationsModule?.centralContacts || []).slice(0, 3).map(c => ({
          name: c.name || '',
          role: c.role || '',
          phone: c.phone || '',
          email: c.email || ''
        })),
        url: `https://clinicaltrials.gov/study/${nctId}`,
        source: 'ClinicalTrials.gov',
        type: 'trial'
      };
    }).filter(Boolean);

    return { results, total, source: 'ClinicalTrials.gov' };
  } catch (error) {
    console.error('ClinicalTrials fetch error:', error.message);
    return { results: [], total: 0, source: 'ClinicalTrials.gov', error: error.message };
  }
}

// ─── LLM Filtering Pipeline (Ollama — Open-Source LLM) ──────────────────────

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

async function callOllama(messages, system) {
  const fullMessages = [{ role: 'system', content: system }, ...messages];
  const opts = { temperature: 0.3, top_p: 0.9, num_predict: 800 };

  // Attempt 1: configured model
  try {
    console.log(`[Unified/Ollama] Attempt 1 — model: "${OLLAMA_MODEL}"`);
    const response = await axios.post(`${OLLAMA_BASE}/api/chat`, {
      model: OLLAMA_MODEL, messages: fullMessages, stream: false, options: opts
    }, { timeout: 300000 });
    console.log('[Unified/Ollama] Attempt 1 succeeded');
    return response.data?.message?.content || '';
  } catch (error) {
    console.error('[Unified/Ollama] Attempt 1 failed:', error.code || error.response?.status, error.message);
    if (error.code === 'ECONNREFUSED') throw new Error('OLLAMA_NOT_RUNNING');
  }

  // Wait 2s, then retry with auto-detected model
  await new Promise(r => setTimeout(r, 2000));
  try {
    const detectedModel = await detectAvailableModel();
    const modelToUse = detectedModel || OLLAMA_MODEL;
    console.log(`[Unified/Ollama] Attempt 2 — model: "${modelToUse}"`);
    const response = await axios.post(`${OLLAMA_BASE}/api/chat`, {
      model: modelToUse, messages: fullMessages, stream: false, options: opts
    }, { timeout: 300000 });
    console.log('[Unified/Ollama] Attempt 2 succeeded');
    return response.data?.message?.content || '';
  } catch (error) {
    console.error('[Unified/Ollama] Attempt 2 failed:', error.code || error.response?.status, error.message);
    if (error.code === 'ECONNREFUSED') throw new Error('OLLAMA_NOT_RUNNING');
    throw error;
  }
}

async function llmFilterAndRank(query, allResults, userContext = 'general', targetCount = 10) {
  // Analyze max 10 results to severely reduce LLM token count and avoid timeouts on slow machines
  const resultsSummary = allResults.slice(0, 10).map((r, i) => {
    const abstract = (r.abstract || '').slice(0, 250);
    const meta = r.type === 'trial'
      ? `Status: ${r.status} | Phase: ${r.phase} | Conditions: ${(r.conditions || []).slice(0,3).join(', ')}`
      : `Source: ${r.source} | Journal: ${r.journal || 'N/A'} | Date: ${r.publishedDate || 'N/A'}${r.citedByCount ? ` | Citations: ${r.citedByCount}` : ''}`;
    return `[${i}] ${r.source}|${r.type?.toUpperCase()}\nTITLE: ${(r.title || '').slice(0, 120)}\nMETA: ${meta}\nABSTRACT: ${abstract}`;
  }).join('\n---\n');

  const contextGuide = {
    patient: 'Prioritize clinically actionable results, recruiting trials, clear patient benefits.',
    researcher: 'Prioritize methodological rigor, high citations, RCTs, Phase 2-3 trials.',
    general: 'Balance clinical relevance, scientific quality, and accessibility.'
  };

  const systemPrompt = `You are a medical research curator. Select the ${targetCount} most relevant results. Return ONLY valid JSON, no markdown:\n{"selected":[{"index":<number>,"relevanceScore":<0-100>,"reasoning":"<why relevant>","keyFinding":"<main finding>","patientSummary":"<plain English>"}],"queryAnalysis":"<what user needs>","coverageNotes":"<diversity note>"}`;

  const userPrompt = `QUERY: "${query}"\nCONTEXT: ${userContext} - ${contextGuide[userContext] || contextGuide.general}\nSELECT TOP ${targetCount} FROM:\n${resultsSummary}`;

  try {
    const responseText = await callOllama([{ role: 'user', content: userPrompt }], systemPrompt);
    const clean = responseText.replace(/```json|```/g, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : clean);

    const rankedResults = (parsed.selected || [])
      .filter(s => s.index >= 0 && s.index < allResults.length)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .map(s => ({
        ...allResults[s.index],
        llmRelevanceScore: s.relevanceScore,
        llmReasoning: s.reasoning,
        llmPatientSummary: s.patientSummary,
        llmKeyFinding: s.keyFinding,
        rankedByAI: true
      }));

    return { rankedResults, queryAnalysis: parsed.queryAnalysis || '', coverageNotes: parsed.coverageNotes || '', llmUsed: true, totalAnalyzed: Math.min(allResults.length, 40), model: OLLAMA_MODEL };
  } catch (error) {
    console.error('Ollama LLM filtering error:', error.message);
    return fallbackRanking(query, allResults, targetCount);
  }
}

function fallbackRanking(query, results, targetCount) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  const scored = results.map(r => {
    let score = 0;
    const text = `${r.title} ${r.abstract} ${(r.keywords || []).join(' ')} ${(r.conditions || []).join(' ')}`.toLowerCase();

    queryWords.forEach(word => {
      const matches = (text.match(new RegExp(word, 'g')) || []).length;
      score += matches * 10;
      if ((r.title || '').toLowerCase().includes(word)) score += 30;
    });

    if (r.citedByCount > 100) score += 20;
    else if (r.citedByCount > 20) score += 10;
    if (r.status === 'RECRUITING') score += 15;
    if (r.isOpenAccess) score += 5;
    if (r.publishedDate && r.publishedDate.includes('202')) score += 10;

    return { ...r, llmRelevanceScore: Math.min(score, 100), rankedByAI: false };
  });

  scored.sort((a, b) => b.llmRelevanceScore - a.llmRelevanceScore);

  return {
    rankedResults: scored.slice(0, targetCount),
    queryAnalysis: `Keyword-based ranking for: "${query}"`,
    coverageNotes: 'LLM not configured — using keyword scoring fallback.',
    llmUsed: false,
    totalAnalyzed: results.length
  };
}

// ─── Main Unified Search Endpoint ────────────────────────────────────────────

/**
 * GET /api/unified/search
 * Query params:
 *   query        - search string (required)
 *   context      - patient | researcher | general (default: general)
 *   fetchCount   - how many to retrieve from each source (50–300, default: 80)
 *   topN         - how many to return after LLM filter (8–15, default: 10)
 *   sources      - comma list: pubmed,openalex,trials (default: all)
 *   includeTrials - boolean (default: true)
 */
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const {
      query,
      context = 'general',
      fetchCount = '80',
      topN = '10',
      sources = 'pubmed,openalex,trials',
      includeTrials = 'true'
    } = req.query;

    if (!query?.trim()) return res.status(400).json({ error: 'Query is required' });

    const cacheKey = `unified_${query}_${context}_${fetchCount}_${topN}_${sources}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const count = Math.min(Math.max(parseInt(fetchCount) || 80, 50), 300);
    const topCount = Math.min(Math.max(parseInt(topN) || 10, 5), 15);
    const sourceList = sources.split(',').map(s => s.trim());
    const withTrials = includeTrials !== 'false';

    // ── Step 1: Fetch from all sources in parallel ──
    const fetchPromises = [];
    const sourceLabels = [];

    if (sourceList.includes('pubmed')) {
      fetchPromises.push(fetchPubMed(query, count));
      sourceLabels.push('PubMed');
    }
    if (sourceList.includes('openalex')) {
      fetchPromises.push(fetchOpenAlex(query, count));
      sourceLabels.push('OpenAlex');
    }
    if (sourceList.includes('trials') && withTrials) {
      fetchPromises.push(fetchClinicalTrials(query, Math.floor(count / 2)));
      sourceLabels.push('ClinicalTrials.gov');
    }

    const fetchResults = await Promise.allSettled(fetchPromises);

    // ── Step 2: Aggregate all results ──
    const allResults = [];
    const sourceMeta = {};

    fetchResults.forEach((result, i) => {
      const label = sourceLabels[i];
      if (result.status === 'fulfilled') {
        const { results, total, error } = result.value;
        allResults.push(...results);
        sourceMeta[label] = { count: results.length, total, error: error || null };
      } else {
        sourceMeta[label] = { count: 0, total: 0, error: result.reason?.message };
      }
    });

    const totalFetched = allResults.length;

    if (totalFetched === 0) {
      return res.json({
        results: [],
        totalFetched: 0,
        sourceMeta,
        queryAnalysis: 'No results found across any source.',
        coverageNotes: 'Try broadening your search terms.',
        llmUsed: false
      });
    }

    // ── Step 3: LLM filtering pipeline → top 8–10 ──
    const { rankedResults, queryAnalysis, coverageNotes, llmUsed, totalAnalyzed } =
      await llmFilterAndRank(query, allResults, context, topCount);

    // ── Step 4: Build response ──
    const response = {
      results: rankedResults,
      totalFetched,
      totalAnalyzed,
      totalReturned: rankedResults.length,
      sourceMeta,
      queryAnalysis,
      coverageNotes,
      llmUsed,
      context,
      query,
      pipeline: {
        step1: `Fetched ${totalFetched} results from ${sourceLabels.join(', ')}`,
        step2: `LLM analyzed top ${totalAnalyzed} results`,
        step3: `Selected ${rankedResults.length} most relevant records`,
      }
    };

    cache.set(cacheKey, response);
    res.json(response);

  } catch (error) {
    console.error('Unified search error:', error);
    res.status(500).json({ error: 'Unified search failed', details: error.message });
  }
});

// GET /api/unified/quick — lightweight version without LLM (fast)
router.get('/quick', optionalAuth, async (req, res) => {
  try {
    const { query, count = '50' } = req.query;
    if (!query) return res.status(400).json({ error: 'Query required' });

    const fetchCount = Math.min(parseInt(count), 150);
    const [pubmedData, openAlexData] = await Promise.allSettled([
      fetchPubMed(query, fetchCount),
      fetchOpenAlex(query, fetchCount)
    ]);

    const all = [
      ...(pubmedData.status === 'fulfilled' ? pubmedData.value.results : []),
      ...(openAlexData.status === 'fulfilled' ? openAlexData.value.results : [])
    ];

    const ranked = fallbackRanking(query, all, 10);
    res.json({ results: ranked.rankedResults, totalFetched: all.length, llmUsed: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
