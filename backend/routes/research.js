const express = require('express');
const router = express.Router();
const axios = require('axios');
const xml2js = require('xml2js');
const NodeCache = require('node-cache');
const { optionalAuth } = require('../middleware/auth');
const User = require('../models/User');

const cache = new NodeCache({ stdTTL: 600 }); // 10 min cache
const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

const parseXML = (xml) => new Promise((resolve, reject) => {
  xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
    if (err) reject(err);
    else resolve(result);
  });
});

// GET /api/research/search
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { query, page = 1, limit = 10, dateFrom, dateTo, articleType, sort = 'relevance' } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const cacheKey = `pubmed_${query}_${page}_${limit}_${dateFrom}_${dateTo}_${articleType}_${sort}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const retstart = (parseInt(page) - 1) * parseInt(limit);

    // Build date range
    let searchQuery = query;
    if (dateFrom || dateTo) {
      const from = dateFrom || '2000/01/01';
      const to = dateTo || new Date().toISOString().split('T')[0].replace(/-/g, '/');
      searchQuery += ` AND ${from}:${to}[pdat]`;
    }
    if (articleType) {
      searchQuery += ` AND ${articleType}[pt]`;
    }

    const sortParam = sort === 'date' ? 'pub+date' : 'relevance';

    // Step 1: Search for IDs
    const searchRes = await axios.get(`${PUBMED_BASE}/esearch.fcgi`, {
      params: {
        db: 'pubmed',
        term: searchQuery,
        retmax: limit,
        retstart,
        sort: sortParam,
        retmode: 'json',
        usehistory: 'y'
      }
    });

    const searchData = searchRes.data.esearchresult;
    const ids = searchData.idlist;
    const total = parseInt(searchData.count);

    if (!ids || ids.length === 0) {
      return res.json({ publications: [], total: 0, page: parseInt(page), pages: 0 });
    }

    // Step 2: Fetch article details
    const fetchRes = await axios.get(`${PUBMED_BASE}/efetch.fcgi`, {
      params: {
        db: 'pubmed',
        id: ids.join(','),
        retmode: 'xml',
        rettype: 'abstract'
      }
    });

    const parsed = await parseXML(fetchRes.data);
    const articles = parsed?.PubmedArticleSet?.PubmedArticle;
    const articleArray = Array.isArray(articles) ? articles : (articles ? [articles] : []);

    const publications = articleArray.map(article => {
      try {
        const medline = article.MedlineCitation;
        const articleData = medline?.Article;
        const pmid = medline?.PMID?._ || medline?.PMID;
        
        // Authors
        let authors = [];
        const authorList = articleData?.AuthorList?.Author;
        if (authorList) {
          const authArray = Array.isArray(authorList) ? authorList : [authorList];
          authors = authArray.map(a => {
            if (a.CollectiveName) return a.CollectiveName;
            return `${a.LastName || ''} ${a.ForeName || a.Initials || ''}`.trim();
          }).filter(Boolean);
        }

        // Abstract
        let abstract = '';
        const abstractObj = articleData?.Abstract?.AbstractText;
        if (abstractObj) {
          if (typeof abstractObj === 'string') abstract = abstractObj;
          else if (Array.isArray(abstractObj)) {
            abstract = abstractObj.map(a => (typeof a === 'string' ? a : a._ || '')).join(' ');
          } else if (abstractObj._) abstract = abstractObj._;
        }

        // Journal
        const journal = articleData?.Journal?.Title || articleData?.Journal?.ISOAbbreviation || '';
        
        // Published date
        const pubDate = articleData?.Journal?.JournalIssue?.PubDate;
        let publishedDate = '';
        if (pubDate) {
          publishedDate = [pubDate.Year, pubDate.Month, pubDate.Day].filter(Boolean).join(' ');
        }

        // Keywords
        let keywords = [];
        const kwList = medline?.KeywordList?.Keyword;
        if (kwList) {
          keywords = Array.isArray(kwList) ? kwList.map(k => k._ || k).filter(Boolean) : [kwList._ || kwList].filter(Boolean);
        }

        // MeSH terms
        let meshTerms = [];
        const meshList = medline?.MeshHeadingList?.MeshHeading;
        if (meshList) {
          const meshArray = Array.isArray(meshList) ? meshList : [meshList];
          meshTerms = meshArray.map(m => m.DescriptorName?._ || m.DescriptorName).filter(Boolean);
        }

        return {
          pmid: String(pmid),
          title: articleData?.ArticleTitle?._ || articleData?.ArticleTitle || 'No title available',
          authors,
          abstract: abstract || 'No abstract available',
          journal,
          publishedDate,
          keywords,
          meshTerms,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          source: 'PubMed'
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    // Save search to user history
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          searchHistory: {
            $each: [{ query, type: 'pubmed', timestamp: new Date() }],
            $slice: -50
          }
        }
      });
    }

    const result = {
      publications,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      query
    };

    cache.set(cacheKey, result);
    res.json(result);

  } catch (error) {
    console.error('PubMed search error:', error.message);
    res.status(500).json({ error: 'Failed to fetch publications', details: error.message });
  }
});

// GET /api/research/:pmid - Get full article details
router.get('/:pmid', async (req, res) => {
  try {
    const { pmid } = req.params;
    const cacheKey = `pubmed_article_${pmid}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const fetchRes = await axios.get(`${PUBMED_BASE}/efetch.fcgi`, {
      params: { db: 'pubmed', id: pmid, retmode: 'xml', rettype: 'full' }
    });

    const parsed = await parseXML(fetchRes.data);
    const article = parsed?.PubmedArticleSet?.PubmedArticle;

    cache.set(cacheKey, article, 3600);
    res.json({ article, pmid });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

module.exports = router;
