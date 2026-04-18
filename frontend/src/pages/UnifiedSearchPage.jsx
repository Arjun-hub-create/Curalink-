import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  RiSearchLine, RiRobot2Line, RiLoader4Line, RiMicroscopeLine,
  RiTestTubeLine, RiGlobalLine, RiBookmarkLine, RiBookmarkFill,
  RiExternalLinkLine, RiSparklingLine, RiBarChart2Line,
  RiCheckboxCircleLine, RiInformationLine, RiArrowRightLine,
  RiBrainLine, RiFilterLine
} from 'react-icons/ri'
import ReactMarkdown from 'react-markdown'
import api, { apiAI } from '../utils/api'
import toast from 'react-hot-toast'

const SOURCE_COLORS = {
  PubMed: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/25', icon: RiMicroscopeLine },
  OpenAlex: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/25', icon: RiGlobalLine },
  'ClinicalTrials.gov': { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/25', icon: RiTestTubeLine },
}

const STATUS_BADGE = {
  RECRUITING: 'badge-recruiting',
  COMPLETED: 'badge-completed',
  NOT_YET_RECRUITING: 'badge-not_yet',
  ACTIVE_NOT_RECRUITING: 'badge-active',
  TERMINATED: 'badge-terminated',
}

const CONTEXTS = [
  { value: 'patient', label: 'Patient', desc: 'Plain-language, actionable results' },
  { value: 'researcher', label: 'Researcher', desc: 'Technical depth, citations, methods' },
  { value: 'general', label: 'General', desc: 'Balanced mix' },
]

const FETCH_COUNTS = [
  { value: '50', label: '50 results' },
  { value: '100', label: '100 results' },
  { value: '150', label: '150 results' },
  { value: '200', label: '200 results' },
  { value: '300', label: '300 results' },
]

const TOP_N = [
  { value: '8', label: 'Top 8' },
  { value: '10', label: 'Top 10' },
  { value: '12', label: 'Top 12' },
  { value: '15', label: 'Top 15' },
]

function ScoreBar({ score }) {
  const color = score >= 80 ? '#14b8a6' : score >= 60 ? '#0ea5e9' : '#8b5cf6'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-xs font-mono font-bold" style={{ color }}>{score}</span>
    </div>
  )
}

function PipelineStatus({ status }) {
  const steps = [
    { key: 'fetching', label: 'Fetching from 3 APIs' },
    { key: 'aggregating', label: 'Aggregating results' },
    { key: 'analyzing', label: 'LLM analyzing records' },
    { key: 'ranking', label: 'Ranking top results' },
  ]
  return (
    <div className="glass-card p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center"
        >
          <RiBrainLine className="text-white text-xl" />
        </motion.div>
        <div>
          <p className="font-semibold text-white text-sm">AI Research Pipeline</p>
          <p className="text-xs text-slate-400">Processing your query...</p>
        </div>
      </div>
      <div className="space-y-3">
        {steps.map((step, i) => {
          const stepIndex = ['fetching', 'aggregating', 'analyzing', 'ranking'].indexOf(status)
          const currentIndex = i
          const done = currentIndex < stepIndex
          const active = currentIndex === stepIndex

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex items-center gap-3"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                done ? 'bg-teal-500' : active ? 'bg-sky-500' : 'bg-white/10'
              }`}>
                {done
                  ? <RiCheckboxCircleLine className="text-white text-xs" />
                  : active
                    ? <motion.div className="w-2 h-2 rounded-full bg-white" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                    : <div className="w-2 h-2 rounded-full bg-white/20" />
                }
              </div>
              <span className={`text-sm ${done ? 'text-teal-400' : active ? 'text-white' : 'text-slate-600'}`}>
                {step.label}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function ResultCard({ result, index, bookmarked, onBookmark }) {
  const sourceStyle = SOURCE_COLORS[result.source] || SOURCE_COLORS['PubMed']
  const Icon = sourceStyle.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card p-5 group relative overflow-hidden"
    >
      {/* Rank badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500/20 to-teal-500/20 border border-sky-500/20 flex items-center justify-center">
          <span className="text-xs font-bold text-sky-300">#{index + 1}</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onBookmark(result)}
          className={`p-1.5 rounded-lg transition-colors ${bookmarked ? 'text-amber-400 bg-amber-500/15' : 'text-slate-600 hover:text-amber-400 hover:bg-amber-500/10'}`}
        >
          {bookmarked ? <RiBookmarkFill className="text-sm" /> : <RiBookmarkLine className="text-sm" />}
        </motion.button>
      </div>

      {/* Source badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${sourceStyle.bg} ${sourceStyle.text} border ${sourceStyle.border}`}>
          <Icon className="text-xs" />
          {result.source}
        </span>
        {result.type === 'trial' && result.status && (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[result.status] || 'badge-active'}`}>
            {result.status?.replace(/_/g, ' ')}
          </span>
        )}
        {result.isOpenAccess && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20">Open Access</span>
        )}
        {result.phase && result.phase !== 'N/A' && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-violet-500/10 text-violet-400">{result.phase}</span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-display text-base font-bold text-white leading-snug mb-2 pr-16 line-clamp-2">
        {result.title}
      </h3>

      {/* Authors / Sponsors */}
      {(result.authors?.length > 0 || result.sponsors) && (
        <p className="text-sky-400 text-xs mb-2 truncate">
          {result.authors?.slice(0, 3).join(', ') || result.sponsors}
          {result.authors?.length > 3 ? ` +${result.authors.length - 3} more` : ''}
        </p>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-2 mb-3">
        {result.journal && <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-xs">{result.journal}</span>}
        {result.publishedDate && <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-xs">{result.publishedDate}</span>}
        {result.citedByCount > 0 && <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-xs">📊 {result.citedByCount} citations</span>}
        {result.enrollment && <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-xs">👥 {result.enrollment.toLocaleString()} enrolled</span>}
        {result.conditions?.length > 0 && result.conditions.slice(0, 2).map(c => (
          <span key={c} className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-xs">{c}</span>
        ))}
      </div>

      {/* Abstract preview */}
      {result.abstract && result.abstract !== 'No abstract available' && (
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-3">{result.abstract}</p>
      )}

      {/* AI Relevance Score */}
      {result.rankedByAI && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500 flex items-center gap-1"><RiSparklingLine className="text-yellow-400" /> AI Relevance Score</span>
          </div>
          <ScoreBar score={result.llmRelevanceScore || 0} />
        </div>
      )}

      {/* AI Key Finding */}
      {result.llmKeyFinding && (
        <div className="mb-3 p-2.5 rounded-xl bg-sky-500/8 border border-sky-500/15">
          <p className="text-xs text-sky-400 font-semibold mb-0.5 flex items-center gap-1">
            <RiSparklingLine /> Key Finding
          </p>
          <p className="text-slate-300 text-xs leading-relaxed">{result.llmKeyFinding}</p>
        </div>
      )}

      {/* AI Patient Summary */}
      {result.llmPatientSummary && (
        <div className="mb-3 p-2.5 rounded-xl bg-teal-500/8 border border-teal-500/15">
          <p className="text-xs text-teal-400 font-semibold mb-0.5">💊 In Plain English</p>
          <p className="text-slate-300 text-xs leading-relaxed">{result.llmPatientSummary}</p>
        </div>
      )}

      {/* AI Reasoning */}
      {result.llmReasoning && (
        <p className="text-xs text-slate-600 italic mb-3 flex gap-1">
          <RiInformationLine className="flex-shrink-0 mt-0.5 text-slate-500" />
          {result.llmReasoning}
        </p>
      )}

      {/* Keywords */}
      {result.keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {result.keywords.slice(0, 5).map(k => (
            <span key={k} className="px-1.5 py-0.5 rounded bg-white/5 text-slate-500 text-xs">{k}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1">
        <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex-1">
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="w-full flex items-center justify-center gap-1.5 btn-secondary text-xs py-2"
          >
            <RiExternalLinkLine /> Open in {result.source}
          </motion.button>
        </a>
        {result.type === 'publication' && (
          <Link to={result.pmid ? `/app/research/${result.pmid}` : '#'}>
            <motion.button whileHover={{ scale: 1.02 }} className="px-3 py-2 rounded-xl bg-sky-500/10 text-sky-400 text-xs border border-sky-500/15 hover:bg-sky-500/20 transition-colors flex items-center gap-1">
              Details <RiArrowRightLine />
            </motion.button>
          </Link>
        )}
        {result.type === 'trial' && (
          <Link to={`/app/trials/${result.nctId}`}>
            <motion.button whileHover={{ scale: 1.02 }} className="px-3 py-2 rounded-xl bg-teal-500/10 text-teal-400 text-xs border border-teal-500/15 hover:bg-teal-500/20 transition-colors flex items-center gap-1">
              Details <RiArrowRightLine />
            </motion.button>
          </Link>
        )}
      </div>
    </motion.div>
  )
}

const SAMPLE_QUERIES = [
  'CRISPR gene therapy cancer treatment',
  'metformin longevity diabetes type 2',
  'immunotherapy checkpoint inhibitors melanoma',
  'alzheimer disease prevention early detection',
  'COVID-19 long-term effects treatment',
]

export default function UnifiedSearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [pipelineStatus, setPipelineStatus] = useState('fetching')
  const [meta, setMeta] = useState(null)
  const [bookmarks, setBookmarks] = useState(new Set())
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState({
    context: 'general',
    fetchCount: '100',
    topN: '10',
    sources: { pubmed: true, openalex: true, trials: true }
  })

  const search = useCallback(async (q = query) => {
    if (!q.trim()) return
    setLoading(true)
    setResults([])
    setMeta(null)

    const sourcesParam = Object.entries(config.sources)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(',')

    // Animate pipeline steps
    const steps = ['fetching', 'aggregating', 'analyzing', 'ranking']
    let stepIdx = 0
    const interval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1)
      setPipelineStatus(steps[stepIdx])
    }, 1800)

    try {
      const { data } = await apiAI.get('/unified/search', {
        params: {
          query: q,
          context: config.context,
          fetchCount: config.fetchCount,
          topN: config.topN,
          sources: sourcesParam,
        }
      })

      clearInterval(interval)
      setResults(data.results || [])
      setMeta(data)

      // Load bookmarks
      api.get('/bookmarks').then(r => {
        setBookmarks(new Set(r.data.bookmarks?.map(b => b.itemId) || []))
      }).catch(() => {})
    } catch (err) {
      clearInterval(interval)
      toast.error(err.response?.data?.error || 'Search failed. Please try again.')
    }
    setLoading(false)
  }, [query, config])

  const handleBookmark = async (result) => {
    const itemId = result.pmid || result.nctId || result.openAlexId || result.id
    try {
      if (bookmarks.has(itemId)) {
        await api.delete(`/bookmarks/${itemId}`)
        setBookmarks(prev => { const s = new Set(prev); s.delete(itemId); return s })
        toast.success('Removed from bookmarks')
      } else {
        await api.post('/bookmarks', {
          type: result.type === 'trial' ? 'trial' : 'publication',
          itemId,
          title: result.title,
          authors: result.authors,
          abstract: result.abstract,
          source: result.source,
          url: result.url,
          publishedDate: result.publishedDate,
          journal: result.journal,
          status: result.status,
          phase: result.phase,
          conditions: result.conditions,
        })
        setBookmarks(prev => new Set([...prev, itemId]))
        toast.success('Bookmarked!')
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const sourceCounts = results.reduce((acc, r) => {
    acc[r.source] = (acc[r.source] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 via-violet-500 to-teal-500 flex items-center justify-center shadow-xl shadow-sky-500/30"
          >
            <RiBrainLine className="text-white text-xl" />
          </motion.div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              AI-Powered Unified Search
            </h1>
            <p className="text-slate-400 text-sm">Fetches 50–300 records from PubMed + OpenAlex + ClinicalTrials.gov → LLM selects best 8–10</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-5">
          <form onSubmit={(e) => { e.preventDefault(); search() }} className="flex gap-3">
            <div className="relative flex-1">
              <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. CRISPR cancer therapy clinical trials 2024..."
                className="medical-input pl-11 pr-4 py-4 text-sm"
              />
            </div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              onClick={() => setShowConfig(!showConfig)}
              className={`btn-secondary px-4 flex items-center gap-2 text-sm ${showConfig ? 'border-sky-500/50 text-sky-300' : ''}`}
            >
              <RiFilterLine /> Config
            </motion.button>
            <motion.button
              type="submit"
              disabled={loading || !query.trim()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary px-7 text-sm flex items-center gap-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6, #14b8a6)' }}
            >
              {loading ? <RiLoader4Line className="animate-spin" /> : <RiSparklingLine />}
              {loading ? 'Analyzing...' : 'Search'}
            </motion.button>
          </form>

          {/* Config panel */}
          <AnimatePresence>
            {showConfig && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 glass-card p-5"
              >
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <RiBarChart2Line className="text-sky-400" /> Pipeline Configuration
                </h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
                  {/* Context */}
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">User Context</label>
                    <div className="space-y-1.5">
                      {CONTEXTS.map(c => (
                        <label key={c.value} className="flex items-start gap-2 cursor-pointer">
                          <input type="radio" name="context" value={c.value} checked={config.context === c.value}
                            onChange={() => setConfig(f => ({...f, context: c.value}))} className="mt-0.5 accent-sky-500" />
                          <div>
                            <span className="text-xs text-slate-300 font-medium">{c.label}</span>
                            <p className="text-xs text-slate-600">{c.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Fetch count */}
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">Records to Fetch (per source)</label>
                    <select value={config.fetchCount} onChange={e => setConfig(f => ({...f, fetchCount: e.target.value}))}
                      className="medical-input text-sm py-2">
                      {FETCH_COUNTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <p className="text-xs text-slate-600 mt-1">50–300 per API source</p>
                  </div>

                  {/* Top N */}
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">AI Selects Top N</label>
                    <select value={config.topN} onChange={e => setConfig(f => ({...f, topN: e.target.value}))}
                      className="medical-input text-sm py-2">
                      {TOP_N.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <p className="text-xs text-slate-600 mt-1">LLM picks best 8–15</p>
                  </div>

                  {/* Sources */}
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">Data Sources</label>
                    <div className="space-y-1.5">
                      {[
                        { key: 'pubmed', label: 'PubMed', icon: '🔬' },
                        { key: 'openalex', label: 'OpenAlex', icon: '🌐' },
                        { key: 'trials', label: 'ClinicalTrials.gov', icon: '🧪' },
                      ].map(s => (
                        <label key={s.key} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={config.sources[s.key]}
                            onChange={e => setConfig(f => ({...f, sources: {...f.sources, [s.key]: e.target.checked}}))}
                            className="accent-sky-500" />
                          <span className="text-xs text-slate-300">{s.icon} {s.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sample queries */}
          {!loading && results.length === 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-slate-500 self-center">Try:</span>
              {SAMPLE_QUERIES.map(q => (
                <motion.button
                  key={q}
                  whileHover={{ scale: 1.04 }}
                  onClick={() => { setQuery(q); search(q) }}
                  className="text-xs px-3 py-1.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
                >
                  {q}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Loading pipeline visualization */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center py-12"
          >
            <PipelineStatus status={pipelineStatus} />
            <p className="text-slate-500 text-xs mt-4">
              Fetching up to {config.fetchCount} records per source · LLM will select top {config.topN}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {!loading && results.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Meta bar */}
          <div className="mb-5 glass-card p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Pipeline Result</p>
                <p className="text-sm font-semibold text-white">
                  <span className="text-sky-400">{meta?.totalFetched}</span> fetched →{' '}
                  <span className="text-violet-400">{meta?.totalAnalyzed}</span> analyzed →{' '}
                  <span className="text-teal-400">{results.length}</span> selected
                </p>
              </div>
              <div className="flex gap-3 ml-auto flex-wrap">
                {Object.entries(sourceCounts).map(([source, count]) => {
                  const style = SOURCE_COLORS[source] || {}
                  return (
                    <span key={source} className={`px-2.5 py-1 rounded-full text-xs ${style.bg} ${style.text} border ${style.border}`}>
                      {source}: {count}
                    </span>
                  )
                })}
                {meta?.llmUsed && (
                  <span className="px-2.5 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
                    <RiSparklingLine /> AI Ranked
                  </span>
                )}
              </div>
            </div>

            {/* AI Query Analysis */}
            {meta?.queryAnalysis && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><RiBrainLine className="text-violet-400" /> AI Query Analysis</p>
                <p className="text-xs text-slate-300">{meta.queryAnalysis}</p>
              </div>
            )}
            {meta?.coverageNotes && (
              <p className="text-xs text-slate-600 mt-1 italic">{meta.coverageNotes}</p>
            )}

            {/* Source meta */}
            {meta?.sourceMeta && (
              <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-3 gap-3">
                {Object.entries(meta.sourceMeta).map(([source, info]) => (
                  <div key={source} className="text-center">
                    <p className="text-xs text-slate-500">{source}</p>
                    <p className="text-xs font-semibold text-slate-300">{info.count} retrieved</p>
                    {info.error && <p className="text-xs text-red-400 truncate">{info.error}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Result cards */}
          <div className="space-y-4">
            {results.map((result, i) => {
              const itemId = result.pmid || result.nctId || result.openAlexId || result.id
              return (
                <ResultCard
                  key={result.id || i}
                  result={result}
                  index={i}
                  bookmarked={bookmarks.has(itemId)}
                  onBookmark={handleBookmark}
                />
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && query && (
        <div className="text-center py-20">
          <RiSearchLine className="text-4xl text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No results. Try different keywords or enable more sources.</p>
        </div>
      )}

      {/* Landing state */}
      {!loading && results.length === 0 && !query && (
        <div className="text-center py-16">
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity }}>
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-sky-500/20 to-teal-500/20 border border-sky-500/20 flex items-center justify-center mx-auto mb-5">
              <RiBrainLine className="text-4xl text-sky-400" />
            </div>
          </motion.div>
          <h3 className="font-display text-2xl font-bold text-white mb-3">Unified AI Research Engine</h3>
          <p className="text-slate-400 max-w-lg mx-auto leading-relaxed mb-6">
            The only search that queries <span className="text-sky-400">PubMed</span>, <span className="text-violet-400">OpenAlex</span>, and <span className="text-teal-400">ClinicalTrials.gov</span> simultaneously — then uses Claude AI to rank the most relevant results just for you.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { icon: RiMicroscopeLine, label: 'PubMed', sub: '35M+ articles', color: 'text-sky-400', bg: 'bg-sky-500/10' },
              { icon: RiGlobalLine, label: 'OpenAlex', sub: '250M+ works', color: 'text-violet-400', bg: 'bg-violet-500/10' },
              { icon: RiTestTubeLine, label: 'ClinicalTrials', sub: '450K+ trials', color: 'text-teal-400', bg: 'bg-teal-500/10' },
            ].map(({ icon: Icon, label, sub, color, bg }) => (
              <div key={label} className={`glass-card p-4 text-center ${bg}`}>
                <Icon className={`text-2xl ${color} mx-auto mb-2`} />
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-slate-500">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
