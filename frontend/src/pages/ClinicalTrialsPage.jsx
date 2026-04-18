import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import {
  RiSearchLine, RiFilterLine, RiBookmarkLine, RiBookmarkFill,
  RiExternalLinkLine, RiLoader4Line, RiTestTubeLine,
  RiArrowLeftLine, RiArrowRightLine, RiMapPinLine, RiGroupLine
} from 'react-icons/ri'
import api from '../utils/api'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['RECRUITING', 'NOT_YET_RECRUITING', 'ACTIVE_NOT_RECRUITING', 'COMPLETED', 'SUSPENDED', 'TERMINATED']
const PHASE_OPTIONS = ['PHASE1', 'PHASE2', 'PHASE3', 'PHASE4']

function statusBadge(status) {
  const map = {
    'RECRUITING': 'badge-recruiting',
    'COMPLETED': 'badge-completed',
    'NOT_YET_RECRUITING': 'badge-not_yet',
    'ACTIVE_NOT_RECRUITING': 'badge-active',
    'TERMINATED': 'badge-terminated',
    'SUSPENDED': 'badge-suspended',
  }
  return map[status] || 'badge-active'
}

function TrialCard({ trial, bookmarked, onBookmark }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="glass-card p-6 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <Link to={`/app/trials/${trial.nctId}`} className="font-display text-base font-semibold text-white hover:text-teal-300 transition-colors leading-snug line-clamp-2 block">{trial.title}</Link>
          {trial.sponsors && <p className="text-teal-400 text-xs mt-1 truncate">{trial.sponsors}</p>}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => onBookmark(trial)} className={`p-2 rounded-lg transition-colors ${bookmarked ? 'text-amber-400 bg-amber-500/15' : 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10'}`}>
            {bookmarked ? <RiBookmarkFill /> : <RiBookmarkLine />}
          </motion.button>
          <a href={trial.url} target="_blank" rel="noopener noreferrer">
            <motion.button whileHover={{ scale: 1.15 }} className="p-2 rounded-lg text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 transition-colors">
              <RiExternalLinkLine />
            </motion.button>
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(trial.status)}`}>
          {trial.status?.replace(/_/g, ' ')}
        </span>
        {trial.phase && trial.phase !== 'N/A' && (
          <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs">{trial.phase.replace(/_/g, ' ')}</span>
        )}
        <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 text-xs">{trial.nctId}</span>
      </div>

      {trial.conditions?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {trial.conditions.slice(0, 4).map(c => (
            <span key={c} className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/15 text-xs">{c}</span>
          ))}
        </div>
      )}

      {trial.brief_summary && trial.brief_summary !== 'No summary available' && (
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-3">{trial.brief_summary}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-slate-500">
        {trial.enrollment && (
          <span className="flex items-center gap-1"><RiGroupLine /> {trial.enrollment.toLocaleString()} enrolled</span>
        )}
        {trial.locations?.length > 0 && (
          <span className="flex items-center gap-1"><RiMapPinLine /> {trial.locations[0].city}, {trial.locations[0].country}</span>
        )}
        {trial.startDate && <span>Started: {trial.startDate}</span>}
      </div>

      <div className="mt-3">
        <Link to={`/app/trials/${trial.nctId}`}>
          <button className="btn-secondary w-full text-xs py-1.5">View Full Details</button>
        </Link>
      </div>
    </motion.div>
  )
}

export default function ClinicalTrialsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [bookmarks, setBookmarks] = useState(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ status: '', phase: '', location: '' })

  useEffect(() => {
    api.get('/bookmarks?type=trial').then(r => {
      setBookmarks(new Set(r.data.bookmarks?.map(b => b.itemId) || []))
    }).catch(() => {})
  }, [])

  const search = useCallback(async (q = query, p = 1) => {
    if (!q.trim()) return
    setLoading(true)
    setSearchParams({ q })
    try {
      const { data } = await api.get('/trials/search', {
        params: { query: q, page: p, limit: 10, ...filters }
      })
      setResults(data.trials || [])
      setTotal(data.total || 0)
      setPage(p)
      setPages(data.pages || 1)
    } catch { toast.error('Search failed') }
    setLoading(false)
  }, [query, filters, setSearchParams])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) { setQuery(q); search(q, 1) }
  }, [])

  const handleBookmark = async (trial) => {
    try {
      if (bookmarks.has(trial.nctId)) {
        await api.delete(`/bookmarks/${trial.nctId}`)
        setBookmarks(prev => { const s = new Set(prev); s.delete(trial.nctId); return s })
        toast.success('Removed from bookmarks')
      } else {
        await api.post('/bookmarks', { type: 'trial', itemId: trial.nctId, title: trial.title, source: 'ClinicalTrials.gov', url: trial.url, status: trial.status, phase: trial.phase, conditions: trial.conditions, abstract: trial.brief_summary })
        setBookmarks(prev => new Set([...prev, trial.nctId]))
        toast.success('Bookmarked!')
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to bookmark') }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center">
            <RiTestTubeLine className="text-teal-400 text-xl" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Clinical Trials</h1>
            <p className="text-slate-400 text-sm">Search 450K+ trials from ClinicalTrials.gov</p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); search(query, 1) }} className="mt-4 flex gap-3">
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by condition, drug, or sponsor..." className="medical-input pl-11 pr-4 py-3.5 text-sm" />
          </div>
          <motion.button type="button" whileHover={{ scale: 1.03 }} onClick={() => setShowFilters(!showFilters)} className={`btn-secondary px-4 flex items-center gap-2 text-sm ${showFilters ? 'border-teal-500/50 text-teal-300' : ''}`}>
            <RiFilterLine /> Filters
          </motion.button>
          <motion.button type="submit" whileHover={{ scale: 1.03 }} className="btn-primary px-6 text-sm" style={{ background: 'linear-gradient(135deg, #14b8a6, #0ea5e9)' }}>Search</motion.button>
        </form>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 glass-card p-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Status</label>
                  <select value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value}))} className="medical-input text-sm py-2">
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Phase</label>
                  <select value={filters.phase} onChange={e => setFilters(f => ({...f, phase: e.target.value}))} className="medical-input text-sm py-2">
                    <option value="">All Phases</option>
                    {PHASE_OPTIONS.map(p => <option key={p} value={p}>{p.replace('PHASE', 'Phase ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Location</label>
                  <input value={filters.location} onChange={e => setFilters(f => ({...f, location: e.target.value}))} placeholder="e.g. New York, USA" className="medical-input text-sm py-2" />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button onClick={() => search(query, 1)} className="btn-primary text-xs px-4 py-1.5" style={{ background: 'linear-gradient(135deg, #14b8a6, #0ea5e9)' }}>Apply Filters</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {total > 0 && (
          <p className="text-slate-400 text-sm mt-3">
            Found <span className="text-teal-400 font-semibold">{total.toLocaleString()}</span> trials
          </p>
        )}
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <RiLoader4Line className="text-teal-400 text-4xl" />
          </motion.div>
          <p className="text-slate-400 mt-4 text-sm">Searching ClinicalTrials.gov...</p>
        </div>
      ) : results.length === 0 && query ? (
        <div className="text-center py-20">
          <RiTestTubeLine className="text-4xl text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No trials found. Try different search terms.</p>
        </div>
      ) : !query ? (
        <div className="text-center py-20">
          <motion.div animate={{ y: [0,-10,0] }} transition={{ duration: 3, repeat: Infinity }}>
            <RiTestTubeLine className="text-6xl text-teal-500/20 mx-auto mb-4" />
          </motion.div>
          <h3 className="font-display text-xl text-white mb-2">Find Clinical Trials</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">Search for recruiting clinical trials that match your condition or research interest.</p>
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {['breast cancer', 'type 2 diabetes', 'alzheimer disease', 'hypertension'].map(s => (
              <motion.button key={s} whileHover={{ scale: 1.05 }} onClick={() => { setQuery(s); search(s, 1) }} className="px-3 py-1.5 rounded-full text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition-colors">{s}</motion.button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {results.map(trial => (
              <TrialCard key={trial.nctId} trial={trial} bookmarked={bookmarks.has(trial.nctId)} onBookmark={handleBookmark} />
            ))}
          </div>
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
