import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import {
  RiSearchLine, RiFilterLine, RiBookmarkLine, RiBookmarkFill,
  RiExternalLinkLine, RiCloseLine, RiLoader4Line, RiMicroscopeLine,
  RiArrowLeftLine, RiArrowRightLine, RiRobot2Line
} from 'react-icons/ri'
import api from '../utils/api'
import toast from 'react-hot-toast'

const ARTICLE_TYPES = ['Review', 'Clinical Trial', 'Randomized Controlled Trial', 'Meta-Analysis', 'Systematic Review', 'Case Reports', 'Observational Study']
const SORT_OPTIONS = [{ value: 'relevance', label: 'Relevance' }, { value: 'date', label: 'Most Recent' }]

function ArticleCard({ pub, bookmarked, onBookmark }) {
  const [summarizing, setSummarizing] = useState(false)
  const [summary, setSummary] = useState(null)

  const handleSummarize = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setSummarizing(true)
    try {
      const { data } = await api.post('/ai/summarize', { abstract: pub.abstract, title: pub.title, type: 'patient' })
      setSummary(data.summary)
    } catch { toast.error('Summarize failed') }
    setSummarizing(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -3 }}
      className="glass-card p-6 group"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <Link to={`/app/research/${pub.pmid}`} className="font-display text-base font-semibold text-white hover:text-sky-300 transition-colors leading-snug line-clamp-2">
            {pub.title}
          </Link>
          {pub.authors?.length > 0 && (
            <p className="text-sky-400 text-xs mt-1 truncate">{pub.authors.slice(0, 3).join(', ')}{pub.authors.length > 3 ? ` +${pub.authors.length - 3}` : ''}</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => onBookmark(pub)} className={`p-2 rounded-lg transition-colors ${bookmarked ? 'text-amber-400 bg-amber-500/15' : 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10'}`}>
            {bookmarked ? <RiBookmarkFill /> : <RiBookmarkLine />}
          </motion.button>
          <a href={pub.url} target="_blank" rel="noopener noreferrer">
            <motion.button whileHover={{ scale: 1.15 }} className="p-2 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 transition-colors">
              <RiExternalLinkLine />
            </motion.button>
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {pub.journal && <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs">{pub.journal}</span>}
        {pub.publishedDate && <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 text-xs">{pub.publishedDate}</span>}
        <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs">PMID: {pub.pmid}</span>
      </div>

      {pub.abstract && pub.abstract !== 'No abstract available' && (
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 mb-3">{pub.abstract}</p>
      )}

      {pub.keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {pub.keywords.slice(0, 5).map(kw => (
            <span key={kw} className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-xs">{kw}</span>
          ))}
        </div>
      )}

      {/* AI Summary */}
      <AnimatePresence>
        {summary && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <p className="text-xs text-violet-400 font-semibold mb-1 flex items-center gap-1"><RiRobot2Line /> Cura AI Summary</p>
            <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">{summary}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 mt-3">
        <Link to={`/app/research/${pub.pmid}`} className="flex-1">
          <button className="btn-secondary w-full text-xs py-1.5">View Details</button>
        </Link>
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={handleSummarize}
          disabled={summarizing}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs hover:bg-violet-500/20 transition-colors"
        >
          {summarizing ? <RiLoader4Line className="animate-spin" /> : <RiRobot2Line />}
          {summarizing ? 'Summarizing...' : 'AI Summary'}
        </motion.button>
      </div>
    </motion.div>
  )
}

export default function ResearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [bookmarks, setBookmarks] = useState(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ sort: 'relevance', articleType: '', dateFrom: '', dateTo: '' })

  useEffect(() => {
    api.get('/bookmarks?type=publication').then(r => {
      setBookmarks(new Set(r.data.bookmarks?.map(b => b.itemId) || []))
    }).catch(() => {})
  }, [])

  const search = useCallback(async (q = query, p = 1) => {
    if (!q.trim()) return
    setLoading(true)
    setSearchParams({ q })
    try {
      const { data } = await api.get('/research/search', {
        params: { query: q, page: p, limit: 10, sort: filters.sort, articleType: filters.articleType, dateFrom: filters.dateFrom, dateTo: filters.dateTo }
      })
      setResults(data.publications || [])
      setTotal(data.total || 0)
      setPage(p)
      setPages(data.pages || 1)
    } catch (err) {
      toast.error('Search failed. Please try again.')
    }
    setLoading(false)
  }, [query, filters, setSearchParams])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) { setQuery(q); search(q, 1) }
  }, [])

  const handleBookmark = async (pub) => {
    try {
      if (bookmarks.has(pub.pmid)) {
        await api.delete(`/bookmarks/${pub.pmid}`)
        setBookmarks(prev => { const s = new Set(prev); s.delete(pub.pmid); return s })
        toast.success('Removed from bookmarks')
      } else {
        await api.post('/bookmarks', { type: 'publication', itemId: pub.pmid, title: pub.title, authors: pub.authors, abstract: pub.abstract, source: 'PubMed', url: pub.url, publishedDate: pub.publishedDate, journal: pub.journal })
        setBookmarks(prev => new Set([...prev, pub.pmid]))
        toast.success('Bookmarked!')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to bookmark')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
            <RiMicroscopeLine className="text-sky-400 text-xl" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">PubMed Research</h1>
            <p className="text-slate-400 text-sm">Search 35M+ medical publications</p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={(e) => { e.preventDefault(); search(query, 1) }} className="mt-4 flex gap-3">
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search conditions, drugs, authors, journals..." className="medical-input pl-11 pr-4 py-3.5 text-sm" />
          </div>
          <motion.button type="button" whileHover={{ scale: 1.03 }} onClick={() => setShowFilters(!showFilters)} className={`btn-secondary px-4 flex items-center gap-2 text-sm ${showFilters ? 'border-sky-500/50 text-sky-300' : ''}`}>
            <RiFilterLine />
            Filters
          </motion.button>
          <motion.button type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-primary px-6 text-sm">Search</motion.button>
        </form>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 glass-card p-4">
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Sort By</label>
                  <select value={filters.sort} onChange={e => setFilters(f => ({...f, sort: e.target.value}))} className="medical-input text-sm py-2">
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Article Type</label>
                  <select value={filters.articleType} onChange={e => setFilters(f => ({...f, articleType: e.target.value}))} className="medical-input text-sm py-2">
                    <option value="">All Types</option>
                    {ARTICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Date From</label>
                  <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({...f, dateFrom: e.target.value}))} className="medical-input text-sm py-2" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Date To</label>
                  <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({...f, dateTo: e.target.value}))} className="medical-input text-sm py-2" />
                </div>
              </div>
              <div className="flex justify-between mt-3">
                <button onClick={() => setFilters({ sort: 'relevance', articleType: '', dateFrom: '', dateTo: '' })} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"><RiCloseLine /> Clear Filters</button>
                <button onClick={() => search(query, 1)} className="btn-primary text-xs px-4 py-1.5">Apply</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {total > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-400 text-sm mt-3">
            Found <span className="text-sky-400 font-semibold">{total.toLocaleString()}</span> publications for "{query}"
          </motion.p>
        )}
      </motion.div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <RiLoader4Line className="text-sky-400 text-4xl" />
          </motion.div>
          <p className="text-slate-400 mt-4 text-sm">Searching PubMed...</p>
        </div>
      ) : results.length === 0 && query ? (
        <div className="text-center py-20">
          <RiMicroscopeLine className="text-4xl text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No results found. Try different keywords.</p>
        </div>
      ) : !query ? (
        <div className="text-center py-20">
          <motion.div animate={{ y: [0,-10,0] }} transition={{ duration: 3, repeat: Infinity }}>
            <RiMicroscopeLine className="text-6xl text-sky-500/20 mx-auto mb-4" />
          </motion.div>
          <h3 className="font-display text-xl text-white mb-2">Search Medical Literature</h3>
          <p className="text-slate-400 max-w-md mx-auto text-sm">Enter a condition, drug, or research topic to search through millions of peer-reviewed publications from PubMed.</p>
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {['diabetes treatment', 'cancer immunotherapy', 'alzheimer prevention', 'COVID-19 vaccines'].map(s => (
              <motion.button key={s} whileHover={{ scale: 1.05 }} onClick={() => { setQuery(s); search(s, 1) }} className="px-3 py-1.5 rounded-full text-xs bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors">{s}</motion.button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
              {results.map((pub, i) => (
                <ArticleCard key={pub.pmid} pub={pub} bookmarked={bookmarks.has(pub.pmid)} onBookmark={handleBookmark} />
              ))}
            </div>
          </AnimatePresence>

          {/* Pagination */}
          {pages > 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-3 mt-8">
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => search(query, page - 1)} disabled={page === 1} className="btn-secondary flex items-center gap-2 text-sm px-4 py-2 disabled:opacity-40">
                <RiArrowLeftLine /> Prev
              </motion.button>
              <span className="text-slate-400 text-sm">Page {page} of {pages}</span>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => search(query, page + 1)} disabled={page === pages} className="btn-secondary flex items-center gap-2 text-sm px-4 py-2 disabled:opacity-40">
                Next <RiArrowRightLine />
              </motion.button>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
