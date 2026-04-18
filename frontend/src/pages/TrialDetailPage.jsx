import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  RiArrowLeftLine, RiExternalLinkLine, RiBookmarkLine, RiBookmarkFill,
  RiLoader4Line, RiTestTubeLine, RiMapPinLine, RiGroupLine, RiCalendarLine
} from 'react-icons/ri'
import api from '../utils/api'
import toast from 'react-hot-toast'

function statusBadge(status) {
  const map = { 'RECRUITING': 'badge-recruiting', 'COMPLETED': 'badge-completed', 'NOT_YET_RECRUITING': 'badge-not_yet', 'ACTIVE_NOT_RECRUITING': 'badge-active', 'TERMINATED': 'badge-terminated', 'SUSPENDED': 'badge-suspended' }
  return map[status] || 'badge-active'
}

export default function TrialDetailPage() {
  const { nctId } = useParams()
  const [trial, setTrial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    const fetchTrial = async () => {
      setLoading(true)
      try {
        // search by nctId
        const { data } = await api.get('/trials/search', { params: { query: nctId, page: 1, limit: 1 } })
        if (data.trials?.length > 0) setTrial(data.trials[0])
      } catch { toast.error('Failed to load trial') }
      setLoading(false)
    }
    const checkBookmark = async () => {
      try {
        const { data } = await api.get('/bookmarks?type=trial')
        setBookmarked(data.bookmarks?.some(b => b.itemId === nctId))
      } catch {}
    }
    fetchTrial()
    checkBookmark()
  }, [nctId])

  const handleBookmark = async () => {
    if (!trial) return
    try {
      if (bookmarked) {
        await api.delete(`/bookmarks/${nctId}`)
        setBookmarked(false)
        toast.success('Removed from bookmarks')
      } else {
        await api.post('/bookmarks', { type: 'trial', itemId: nctId, title: trial.title, source: 'ClinicalTrials.gov', url: trial.url, status: trial.status, phase: trial.phase, conditions: trial.conditions, abstract: trial.brief_summary })
        setBookmarked(true)
        toast.success('Bookmarked!')
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
        <RiLoader4Line className="text-teal-400 text-4xl" />
      </motion.div>
      <p className="text-slate-400 mt-4">Loading trial details...</p>
    </div>
  )

  if (!trial) return (
    <div className="p-6 text-center">
      <p className="text-slate-400">Trial not found.</p>
      <Link to="/app/trials"><button className="btn-primary mt-4 text-sm px-5 py-2" style={{ background: 'linear-gradient(135deg,#14b8a6,#0ea5e9)' }}>Back to Trials</button></Link>
    </div>
  )

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/app/trials" className="inline-flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors mb-6 text-sm">
          <RiArrowLeftLine /> Back to Trials
        </Link>

        {/* Header */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center flex-shrink-0">
              <RiTestTubeLine className="text-teal-400 text-xl" />
            </div>
            <h1 className="font-display text-xl font-bold text-white leading-snug">{trial.title}</h1>
          </div>

          {trial.sponsors && <p className="text-teal-400 text-sm mb-3">{trial.sponsors}</p>}

          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge(trial.status)}`}>{trial.status?.replace(/_/g, ' ')}</span>
            {trial.phase && trial.phase !== 'N/A' && <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 text-xs">{trial.phase.replace(/_/g, ' ')}</span>}
            <span className="px-3 py-1 rounded-full bg-slate-700/50 text-slate-300 text-xs">{nctId}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { icon: RiGroupLine, label: 'Enrollment', value: trial.enrollment ? trial.enrollment.toLocaleString() : 'N/A' },
              { icon: RiCalendarLine, label: 'Start Date', value: trial.startDate || 'N/A' },
              { icon: RiCalendarLine, label: 'Completion', value: trial.completionDate || 'N/A' },
              { icon: RiMapPinLine, label: 'Locations', value: `${trial.locations?.length || 0} sites` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="glass-card p-3 text-center">
                <Icon className="text-teal-400 text-lg mx-auto mb-1" />
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <a href={trial.url} target="_blank" rel="noopener noreferrer" className="flex-1">
              <motion.button whileHover={{ scale: 1.02 }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 text-white text-sm font-semibold flex items-center justify-center gap-2">
                <RiExternalLinkLine /> View on ClinicalTrials.gov
              </motion.button>
            </a>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleBookmark}
              className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-sm transition-all ${
                bookmarked ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              {bookmarked ? <RiBookmarkFill /> : <RiBookmarkLine />}
              {bookmarked ? 'Saved' : 'Save'}
            </motion.button>
          </div>
        </div>

        {/* Conditions */}
        {trial.conditions?.length > 0 && (
          <div className="glass-card p-5 mb-6">
            <h2 className="font-display text-base font-bold text-white mb-3">Conditions Studied</h2>
            <div className="flex flex-wrap gap-2">
              {trial.conditions.map(c => (
                <span key={c} className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs">{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="glass-card p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-white mb-3">Study Summary</h2>
          <p className="text-slate-300 text-sm leading-relaxed">{trial.brief_summary}</p>
          {trial.detailed_description && (
            <>
              <h3 className="font-display text-base font-bold text-white mt-4 mb-2">Detailed Description</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{trial.detailed_description.slice(0, 1000)}{trial.detailed_description.length > 1000 ? '...' : ''}</p>
            </>
          )}
        </div>

        {/* Eligibility */}
        {trial.eligibility && (
          <div className="glass-card p-6 mb-6">
            <h2 className="font-display text-lg font-bold text-white mb-3">Eligibility</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: 'Min Age', value: trial.eligibility.minAge || 'N/A' },
                { label: 'Max Age', value: trial.eligibility.maxAge || 'N/A' },
                { label: 'Sex', value: trial.eligibility.sex || 'All' },
              ].map(({ label, value }) => (
                <div key={label} className="text-center glass-card p-3">
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
            {trial.eligibility.criteria && (
              <div className="mt-3">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Criteria</h3>
                <pre className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap font-sans">{trial.eligibility.criteria.slice(0, 1500)}</pre>
              </div>
            )}
          </div>
        )}

        {/* Locations */}
        {trial.locations?.length > 0 && (
          <div className="glass-card p-6">
            <h2 className="font-display text-lg font-bold text-white mb-3 flex items-center gap-2">
              <RiMapPinLine className="text-teal-400" /> Study Locations
            </h2>
            <div className="space-y-2">
              {trial.locations.slice(0, 10).map((loc, i) => (
                <motion.div key={i} whileHover={{ x: 3 }} className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
                  <RiMapPinLine className="text-teal-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-200">{loc.facility}</p>
                    <p className="text-xs text-slate-500">{[loc.city, loc.state, loc.country].filter(Boolean).join(', ')}</p>
                  </div>
                  {loc.status && <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${statusBadge(loc.status)}`}>{loc.status?.replace(/_/g, ' ')}</span>}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
