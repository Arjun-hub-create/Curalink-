import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import {
  RiUserHeartLine, RiSearchLine, RiMapPinLine, RiLoader4Line,
  RiMicroscopeLine, RiTestTubeLine, RiGlobalLine, RiBookmarkLine,
  RiBookmarkFill, RiExternalLinkLine, RiSparklingLine, RiBrainLine,
  RiArrowRightLine, RiPhoneLine, RiMailLine, RiGroupLine,
  RiCheckboxCircleLine, RiInformationLine, RiFileTextLine
} from 'react-icons/ri'
import api, { apiAI } from '../utils/api'
import toast from 'react-hot-toast'

const SOURCE_STYLE = {
  PubMed:              { bg: 'bg-sky-500/15',    text: 'text-sky-400',    border: 'border-sky-500/25',    icon: RiMicroscopeLine },
  OpenAlex:            { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/25', icon: RiGlobalLine },
  'ClinicalTrials.gov':{ bg: 'bg-teal-500/15',   text: 'text-teal-400',   border: 'border-teal-500/25',   icon: RiTestTubeLine },
}

const STATUS_BADGE = {
  RECRUITING:              'badge-recruiting',
  COMPLETED:               'badge-completed',
  NOT_YET_RECRUITING:      'badge-not_yet',
  ACTIVE_NOT_RECRUITING:   'badge-active',
  TERMINATED:              'badge-terminated',
  SUSPENDED:               'badge-suspended',
}

// ── Pipeline animation ────────────────────────────────────────────────────────
function PipelineSteps({ step }) {
  const steps = [
    { key: 1, label: 'Expanding query intelligently' },
    { key: 2, label: 'Fetching from PubMed + OpenAlex + Trials' },
    { key: 3, label: 'LLM analyzing & ranking results' },
    { key: 4, label: 'Generating structured response' },
  ]
  return (
    <div className="glass-card p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center">
          <RiBrainLine className="text-white text-xl" />
        </motion.div>
        <div>
          <p className="font-semibold text-white text-sm">AI Research Pipeline Running</p>
          <p className="text-xs text-slate-400">Processing your query...</p>
        </div>
      </div>
      <div className="space-y-3">
        {steps.map((s, i) => {
          const done = step > s.key
          const active = step === s.key
          return (
            <motion.div key={s.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${done ? 'bg-teal-500' : active ? 'bg-sky-500' : 'bg-white/8'}`}>
                {done
                  ? <RiCheckboxCircleLine className="text-white text-xs" />
                  : active
                    ? <motion.div className="w-2 h-2 rounded-full bg-white" animate={{ scale: [1,1.5,1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                    : <div className="w-2 h-2 rounded-full bg-white/20" />}
              </div>
              <span className={`text-sm transition-colors ${done ? 'text-teal-400' : active ? 'text-white font-medium' : 'text-slate-600'}`}>
                {s.label}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
  const color = score >= 80 ? '#14b8a6' : score >= 60 ? '#0ea5e9' : '#8b5cf6'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
      <span className="text-xs font-mono font-bold" style={{ color }}>{score}</span>
    </div>
  )
}

// ── Result card ───────────────────────────────────────────────────────────────
function ResultCard({ result, index, bookmarked, onBookmark }) {
  const style = SOURCE_STYLE[result.source] || SOURCE_STYLE.PubMed
  const Icon = style.icon
  const [showContacts, setShowContacts] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ y: -3 }}
      className="glass-card p-5 group"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-2 items-center">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text} border ${style.border}`}>
            <Icon className="text-xs" /> {result.source}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-500 text-xs">#{index + 1}</span>
          {result.type === 'trial' && result.status && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[result.status] || 'badge-active'}`}>
              {result.status.replace(/_/g, ' ')}
            </span>
          )}
          {result.phase && result.phase !== 'N/A' && result.type === 'trial' && (
            <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-xs">
              {result.phase.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
            onClick={() => onBookmark(result)}
            className={`p-2 rounded-lg transition-colors ${bookmarked ? 'text-amber-400 bg-amber-500/15' : 'text-slate-600 hover:text-amber-400 hover:bg-amber-500/10'}`}>
            {bookmarked ? <RiBookmarkFill className="text-sm" /> : <RiBookmarkLine className="text-sm" />}
          </motion.button>
          <a href={result.url} target="_blank" rel="noopener noreferrer">
            <motion.button whileHover={{ scale: 1.15 }}
              className="p-2 rounded-lg text-slate-600 hover:text-sky-400 hover:bg-sky-500/10 transition-colors">
              <RiExternalLinkLine className="text-sm" />
            </motion.button>
          </a>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-display text-base font-bold text-white leading-snug mb-2 line-clamp-2">
        {result.title}
      </h3>

      {/* Authors / Sponsors */}
      {(result.authors?.length > 0 || result.sponsors) && (
        <p className="text-sky-400 text-xs mb-2 truncate">
          {result.authors?.slice(0, 3).join(', ') || result.sponsors}
          {result.authors?.length > 3 ? ` +${result.authors.length - 3}` : ''}
        </p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-2 mb-3">
        {result.journal && <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-xs">{result.journal}</span>}
        {result.publishedDate && <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-xs">{result.publishedDate}</span>}
        {result.citedByCount > 0 && <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-xs">📊 {result.citedByCount} citations</span>}
        {result.enrollment && <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-xs"><RiGroupLine className="inline mr-1" />{result.enrollment.toLocaleString()} enrolled</span>}
        {result.conditions?.slice(0,2).map(c => (
          <span key={c} className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 text-xs">{c}</span>
        ))}
      </div>

      {/* Abstract */}
      {result.abstract && (
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-3">{result.abstract}</p>
      )}

      {/* AI Score */}
      {result.rankedByAI && typeof result.llmRelevanceScore === 'number' && (
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-slate-500 flex items-center gap-1"><RiSparklingLine className="text-yellow-400" />AI Relevance</span>
          </div>
          <ScoreBar score={result.llmRelevanceScore} />
        </div>
      )}

      {/* Key Finding */}
      {result.llmKeyFinding && (
        <div className="mb-3 p-2.5 rounded-xl bg-sky-500/8 border border-sky-500/15">
          <p className="text-xs text-sky-400 font-semibold mb-0.5 flex items-center gap-1"><RiSparklingLine />Key Finding</p>
          <p className="text-slate-300 text-xs leading-relaxed">{result.llmKeyFinding}</p>
        </div>
      )}

      {/* Patient Summary */}
      {result.llmPatientSummary && (
        <div className="mb-3 p-2.5 rounded-xl bg-teal-500/8 border border-teal-500/15">
          <p className="text-xs text-teal-400 font-semibold mb-0.5">💊 In Plain English</p>
          <p className="text-slate-300 text-xs leading-relaxed">{result.llmPatientSummary}</p>
        </div>
      )}

      {/* AI Reasoning */}
      {result.llmReasoning && (
        <p className="text-xs text-slate-600 italic mb-3 flex gap-1">
          <RiInformationLine className="flex-shrink-0 mt-0.5 text-slate-500" />{result.llmReasoning}
        </p>
      )}

      {/* Eligibility for trials */}
      {result.type === 'trial' && result.eligibility && (
        <div className="mb-3 p-3 rounded-xl bg-white/3 border border-white/5">
          <p className="text-xs font-semibold text-slate-400 mb-2">Eligibility Criteria</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="text-center">
              <p className="text-xs text-slate-500">Min Age</p>
              <p className="text-xs font-semibold text-white">{result.eligibility.minAge || 'N/A'}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Max Age</p>
              <p className="text-xs font-semibold text-white">{result.eligibility.maxAge || 'N/A'}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500">Sex</p>
              <p className="text-xs font-semibold text-white">{result.eligibility.sex || 'All'}</p>
            </div>
          </div>
          {result.eligibility.criteria && (
            <p className="text-xs text-slate-500 line-clamp-2">{result.eligibility.criteria.slice(0, 200)}...</p>
          )}
        </div>
      )}

      {/* Contact Information — spec requirement */}
      {result.type === 'trial' && result.contacts && result.contacts.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowContacts(!showContacts)}
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 mb-2 transition-colors"
          >
            <RiPhoneLine /> Contact Information ({result.contacts.length}) {showContacts ? '▲' : '▼'}
          </button>
          <AnimatePresence>
            {showContacts && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="space-y-2">
                {result.contacts.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-sky-500/8 border border-sky-500/15">
                    {c.name && <p className="text-xs font-semibold text-sky-300">{c.name}{c.role ? ` — ${c.role}` : ''}</p>}
                    {c.facility && <p className="text-xs text-slate-400">{c.facility}{c.city ? `, ${c.city}` : ''}</p>}
                    {c.phone && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <RiPhoneLine className="text-sky-400" />
                        <a href={`tel:${c.phone}`} className="hover:text-sky-400 transition-colors">{c.phone}{c.phoneExt ? ` ext.${c.phoneExt}` : ''}</a>
                      </p>
                    )}
                    {c.email && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <RiMailLine className="text-sky-400" />
                        <a href={`mailto:${c.email}`} className="hover:text-sky-400 transition-colors">{c.email}</a>
                      </p>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Location for trials */}
      {result.type === 'trial' && result.locations?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1"><RiMapPinLine />Study Locations</p>
          <div className="flex flex-wrap gap-1.5">
            {result.locations.slice(0, 4).map((loc, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 text-slate-400 text-xs">
                {[loc.city, loc.country].filter(Boolean).join(', ')}
              </span>
            ))}
            {result.locations.length > 4 && (
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-500 text-xs">+{result.locations.length - 4} more</span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex-1">
          <motion.button whileHover={{ scale: 1.02 }}
            className="w-full flex items-center justify-center gap-1.5 btn-secondary text-xs py-2">
            <RiExternalLinkLine />Open in {result.source}
          </motion.button>
        </a>
        {result.type === 'publication' && result.pmid && (
          <Link to={`/app/research/${result.pmid}`}>
            <motion.button whileHover={{ scale: 1.02 }}
              className="px-3 py-2 rounded-xl bg-sky-500/10 text-sky-400 text-xs border border-sky-500/15 hover:bg-sky-500/20 transition-colors flex items-center gap-1">
              Details <RiArrowRightLine />
            </motion.button>
          </Link>
        )}
        {result.type === 'trial' && result.nctId && (
          <Link to={`/app/trials/${result.nctId}`}>
            <motion.button whileHover={{ scale: 1.02 }}
              className="px-3 py-2 rounded-xl bg-teal-500/10 text-teal-400 text-xs border border-teal-500/15 hover:bg-teal-500/20 transition-colors flex items-center gap-1">
              Details <RiArrowRightLine />
            </motion.button>
          </Link>
        )}
      </div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StructuredSearchPage() {
  const [form, setForm] = useState({ patientName: '', disease: '', additionalQuery: '', location: '' })
  const [fetchCount, setFetchCount] = useState('100')
  const [topN, setTopN] = useState('8')
  const [loading, setLoading] = useState(false)
  const [pipelineStep, setPipelineStep] = useState(0)
  const [result, setResult] = useState(null)
  const [bookmarks, setBookmarks] = useState(new Set())
  const [activeTab, setActiveTab] = useState('all')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!form.disease.trim() && !form.additionalQuery.trim()) {
      toast.error('Please enter a disease or query')
      return
    }

    setLoading(true)
    setResult(null)
    setPipelineStep(1)

    // Animate pipeline steps
    const stepTimer = setInterval(() => {
      setPipelineStep(prev => Math.min(prev + 1, 4))
    }, 2000)

    try {
      const { data } = await apiAI.post('/structured/search', {
        ...form,
        fetchCount: parseInt(fetchCount),
        topN: parseInt(topN)
      })

      clearInterval(stepTimer)
      setPipelineStep(5)
      setResult(data)

      // Load bookmarks
      api.get('/bookmarks').then(r => {
        setBookmarks(new Set(r.data.bookmarks?.map(b => b.itemId) || []))
      }).catch(() => {})
    } catch (err) {
      clearInterval(stepTimer)
      toast.error(err.response?.data?.error || 'Search failed. Check backend is running.')
    }
    setLoading(false)
  }

  const handleBookmark = async (item) => {
    const itemId = item.pmid || item.nctId || item.openAlexId || item.id
    try {
      if (bookmarks.has(itemId)) {
        await api.delete(`/bookmarks/${itemId}`)
        setBookmarks(prev => { const s = new Set(prev); s.delete(itemId); return s })
        toast.success('Removed from bookmarks')
      } else {
        await api.post('/bookmarks', {
          type: item.type === 'trial' ? 'trial' : 'publication',
          itemId, title: item.title, authors: item.authors,
          abstract: item.abstract, source: item.source, url: item.url,
          publishedDate: item.publishedDate, journal: item.journal,
          status: item.status, phase: item.phase, conditions: item.conditions
        })
        setBookmarks(prev => new Set([...prev, itemId]))
        toast.success('Bookmarked!')
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const displayResults = result
    ? activeTab === 'publications' ? result.publications
    : activeTab === 'trials' ? result.trials
    : result.results
    : []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-teal-500/20 border border-sky-500/25 flex items-center justify-center">
            <RiUserHeartLine className="text-sky-400 text-xl" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Structured Research Search</h1>
            <p className="text-slate-400 text-sm">Enter patient context → AI fetches 50–300 results → delivers top 6–8 research-backed answers</p>
          </div>
        </div>

        {/* Input form */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onSubmit={handleSearch}
          className="mt-5 glass-card p-6"
        >
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-4">Patient / Research Context</p>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {/* Patient Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Patient Name <span className="text-slate-600 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <RiUserHeartLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-base" />
                <input
                  value={form.patientName}
                  onChange={set('patientName')}
                  placeholder="e.g. John Smith"
                  className="medical-input pl-9 text-sm"
                />
              </div>
            </div>

            {/* Disease */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Disease / Condition <span className="text-red-400 text-xs">*required</span>
              </label>
              <div className="relative">
                <RiFileTextLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-base" />
                <input
                  value={form.disease}
                  onChange={set('disease')}
                  placeholder="e.g. Parkinson's disease"
                  className="medical-input pl-9 text-sm"
                />
              </div>
            </div>

            {/* Additional Query */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Additional Query
              </label>
              <div className="relative">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-base" />
                <input
                  value={form.additionalQuery}
                  onChange={set('additionalQuery')}
                  placeholder="e.g. Deep Brain Stimulation"
                  className="medical-input pl-9 text-sm"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Location <span className="text-slate-600 font-normal">(for trials)</span>
              </label>
              <div className="relative">
                <RiMapPinLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-base" />
                <input
                  value={form.location}
                  onChange={set('location')}
                  placeholder="e.g. Toronto, Canada"
                  className="medical-input pl-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Query expansion preview */}
          <AnimatePresence>
            {(form.disease || form.additionalQuery) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-xl bg-sky-500/8 border border-sky-500/20"
              >
                <p className="text-xs text-sky-400 font-semibold mb-1 flex items-center gap-1">
                  <RiSparklingLine /> Query Expansion Preview
                </p>
                <p className="text-xs text-slate-300">
                  Will search:{' '}
                  <span className="text-sky-300 font-mono">
                    "{[form.disease, form.additionalQuery].filter(Boolean).join(' AND ')}"
                  </span>
                  {form.location && <span className="text-teal-300"> near <strong>{form.location}</strong> (trials)</span>}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Config row */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Records to fetch</label>
              <select value={fetchCount} onChange={e => setFetchCount(e.target.value)} className="medical-input text-sm py-2 pr-8" style={{ width: '140px' }}>
                <option value="50">50 per source</option>
                <option value="100">100 per source</option>
                <option value="150">150 per source</option>
                <option value="200">200 per source</option>
                <option value="300">300 per source</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Show top results</label>
              <select value={topN} onChange={e => setTopN(e.target.value)} className="medical-input text-sm py-2 pr-8" style={{ width: '120px' }}>
                <option value="6">Top 6</option>
                <option value="8">Top 8</option>
                <option value="10">Top 10</option>
                <option value="12">Top 12</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading || (!form.disease.trim() && !form.additionalQuery.trim())}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6, #14b8a6)' }}
          >
            {loading
              ? <><RiLoader4Line className="animate-spin text-lg" /> Running AI Pipeline...</>
              : <><RiSparklingLine className="text-lg" /> Search & Analyze</>}
          </motion.button>
        </motion.form>
      </motion.div>

      {/* Loading pipeline */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center py-10">
            <PipelineSteps step={pipelineStep} />
            <p className="text-slate-500 text-xs mt-4">
              Fetching up to {fetchCount} records per source · LLM selects top {topN}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* Pipeline summary bar */}
            <div className="glass-card p-4 mb-5">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {result.patientName && (
                  <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 text-xs border border-sky-500/20">
                    👤 {result.patientName}
                  </span>
                )}
                {result.disease && (
                  <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 text-xs border border-violet-500/20">
                    🏥 {result.disease}
                  </span>
                )}
                {result.location && (
                  <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 text-xs border border-teal-500/20">
                    📍 {result.location}
                  </span>
                )}
                {result.llmUsed && (
                  <span className="ml-auto px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs border border-yellow-500/20 flex items-center gap-1">
                    <RiSparklingLine /> AI Ranked
                  </span>
                )}
              </div>

              {/* Expanded query */}
              <div className="p-2.5 rounded-lg bg-sky-500/8 border border-sky-500/15 mb-3">
                <p className="text-xs text-sky-400 font-semibold mb-0.5">Query Expanded To:</p>
                <p className="text-xs text-slate-300 font-mono">"{result.expandedQuery}"</p>
              </div>

              {/* Pipeline stats */}
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="text-slate-400">
                  Fetched: <span className="text-sky-400 font-semibold">{result.totalFetched}</span>
                </span>
                <span className="text-slate-600">→</span>
                <span className="text-slate-400">
                  Selected: <span className="text-teal-400 font-semibold">{result.totalReturned}</span>
                </span>
                {result.sourceMeta && Object.entries(result.sourceMeta).map(([src, count]) => (
                  <span key={src} className="text-slate-500">{src}: {count}</span>
                ))}
              </div>
            </div>

            {/* Structured AI Response — spec requirement */}
            {result.structuredResponse && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 mb-5 border border-sky-500/15">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center">
                    <RiBrainLine className="text-white text-base" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-white">AI Research Brief</h2>
                    <p className="text-xs text-slate-500">Generated by Llama 3.2 (Ollama) · Open-source LLM</p>
                  </div>
                </div>
                <div className="prose-medical text-sm">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 text-slate-300">{children}</p>,
                      strong: ({ children }) => <strong className="text-sky-300 font-semibold">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc ml-4 space-y-1 mb-2">{children}</ul>,
                      li: ({ children }) => <li className="text-slate-300 text-sm">{children}</li>,
                      h2: ({ children }) => <h2 className="font-display font-bold text-white text-base mt-4 mb-2 border-b border-white/8 pb-1">{children}</h2>,
                      h3: ({ children }) => <h3 className="font-semibold text-sky-300 text-sm mt-3 mb-1">{children}</h3>,
                      blockquote: ({ children }) => <blockquote className="border-l-2 border-sky-500 pl-3 italic text-slate-400 my-2">{children}</blockquote>,
                    }}
                  >
                    {result.structuredResponse}
                  </ReactMarkdown>
                </div>
              </motion.div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {[
                { key: 'all', label: `All (${result.results?.length || 0})` },
                { key: 'publications', label: `Papers (${result.publications?.length || 0})` },
                { key: 'trials', label: `Trials (${result.trials?.length || 0})` },
              ].map(tab => (
                <motion.button key={tab.key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-xl text-sm transition-all ${
                    activeTab === tab.key
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-300 glass-card'
                  }`}>
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {/* Result cards */}
            {displayResults.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">No results in this category.</div>
            ) : (
              <div className="space-y-4">
                {displayResults.map((item, i) => {
                  const itemId = item.pmid || item.nctId || item.openAlexId || item.id
                  return (
                    <ResultCard key={item.id || i} result={item} index={i}
                      bookmarked={bookmarks.has(itemId)} onBookmark={handleBookmark} />
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!result && !loading && (
        <div className="text-center py-16">
          <motion.div animate={{ y: [0,-12,0] }} transition={{ duration: 4, repeat: Infinity }}>
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500/15 to-teal-500/15 border border-sky-500/20 flex items-center justify-center mx-auto mb-5">
              <RiUserHeartLine className="text-3xl text-sky-400" />
            </div>
          </motion.div>
          <h3 className="font-display text-xl font-bold text-white mb-3">Structured Research Assistant</h3>
          <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed mb-6">
            Fill in the patient context above. The system will automatically combine your disease + query,
            fetch 50–300 results from 3 APIs, then use <span className="text-sky-400">Llama 3.2</span> to
            select and explain the most relevant findings.
          </p>
          <div className="glass-card p-4 max-w-sm mx-auto text-left">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-semibold">Example Input</p>
            <div className="space-y-1.5 text-xs text-slate-400">
              <p>👤 Patient Name: <span className="text-slate-300">John Smith</span></p>
              <p>🏥 Disease: <span className="text-slate-300">Parkinson's disease</span></p>
              <p>🔍 Query: <span className="text-slate-300">Deep Brain Stimulation</span></p>
              <p>📍 Location: <span className="text-slate-300">Toronto, Canada</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
