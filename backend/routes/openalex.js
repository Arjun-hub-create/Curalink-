const express = require('express');
const router = express.Router();
const axios = require('axios');
const NodeCache = require('node-cache');
const { optionalAuth } = require('../middleware/auth');

const cache = new NodeCache({ stdTTL: 600 });
const OPENALEX_BASE = 'https://api.openalex.org';

// GET /api/openalex/search
// Retrieves 50–300 results from OpenAlex
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const {
      query, page = 1, limit = 50,
      yearFrom, yearTo, type, openAccess
    } = req.query;

    if (!query) return res.status(400).json({ error: 'Query is required' });

    const cacheKey = `openalex_${query}_${page}_${limit}_${yearFrom}_${yearTo}_${type}_${openAccess}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    // Cap between 50 and 300
    const perPage = Math.min(Math.max(parseInt(limit) || 50, 50), 300);

    const params = {
      search: query,
      page: parseInt(page),
      per_page: perPage,
      select: [
        'id', 'doi', 'title', 'display_name', 'publication_year',
        'publication_date', 'type', 'open_access', 'authorships',
        'primary_location', 'abstract_inverted_index', 'cited_by_count',
        'concepts', 'keywords', 'is_retracted', 'referenced_works_count'
      ].join(','),
      mailto: 'curalink@research.ai', // polite pool
      sort: 'relevance_score:desc'
    };

    // Filters
    const filterParts = ['is_retracted:false'];
    if (yearFrom || yearTo) {
      if (yearFrom) filterParts.push(`publication_year:>${parseInt(yearFrom) - 1}`);
      if (yearTo) filterParts.push(`publication_year:<${parseInt(yearTo) + 1}`);
    }
    if (type) filterParts.push(`type:${type}`);
    if (openAccess === 'true') filterParts.push('open_access.is_oa:true');
    if (filterParts.length > 0) params.filter = filterParts.join(',');

    const response = await axios.get(`${OPENALEX_BASE}/works`, { params, timeout: 15000 });
    const data = response.data;
    const results = data.results || [];

    const publications = results.map(work => {
      // Reconstruct abstract from inverted index
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

      // Authors
      const authors = (work.authorships || [])
        .slice(0, 6)
        .map(a => a.author?.display_name)
        .filter(Boolean);

      // Journal/source
      const source = work.primary_location?.source?.display_name || '';
      const isOA = work.open_access?.is_oa || false;
      const oaUrl = work.open_access?.oa_url || '';

      // Concepts/keywords
      const concepts = (work.concepts || [])
        .filter(c => c.score > 0.3)
        .slice(0, 8)
        .map(c => c.display_name);

      const keywords = (work.keywords || []).slice(0, 6).map(k => k.display_name || k);

      const openAlexId = work.id?.replace('https://openalex.org/', '') || '';

      return {
        id: openAlexId,
        doi: work.doi,
        title: work.display_name || work.title || 'No title',
        authors,
        abstract: abstract || 'No abstract available',
        journal: source,
        publishedYear: work.publication_year,
        publishedDate: work.publication_date,
        type: work.type,
        citedByCount: work.cited_by_count || 0,
        referencedWorksCount: work.referenced_works_count || 0,
        isOpenAccess: isOA,
        oaUrl,
        concepts,
        keywords: [...new Set([...keywords, ...concepts])].slice(0, 8),
        url: work.doi ? `https://doi.org/${work.doi}` : `https://openalex.org/${openAlexId}`,
        source: 'OpenAlex'
      };
    }).filter(p => p.title !== 'No title' && p.abstract !== 'No abstract available' || p.citedByCount > 0);

    const result = {
      publications,
      total: data.meta?.count || 0,
      page: parseInt(page),
      perPage,
      pages: Math.ceil((data.meta?.count || 0) / perPage),
      query,
      source: 'OpenAlex'
    };

    cache.set(cacheKey, result);
    res.json(result);

  } catch (error) {
    console.error('OpenAlex error:', error.message);
    res.status(500).json({ error: 'OpenAlex search failed', details: error.message });
  }
});

// GET /api/openalex/:id - Single work detail
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `openalex_work_${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const response = await axios.get(`${OPENALEX_BASE}/works/${id}`, {
      params: { mailto: 'curalink@research.ai' }
    });
    cache.set(cacheKey, response.data, 3600);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch work details' });
  }
});

module.exports = router;
