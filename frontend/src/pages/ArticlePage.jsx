import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  RiArrowLeftLine, RiExternalLinkLine, RiBookmarkLine, RiBookmarkFill,
  RiLoader4Line, RiMicroscopeLine, RiRobot2Line
} from 'react-icons/ri'
import ReactMarkdown from 'react-markdown'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function ArticlePage() {
  const { pmid } = useParams()
  const [pub, setPub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bookmarked, setBookmarked] = useState(false)
  const [summary, setSummary] = useState(null)
  const [summarizing, setSummarizing] = useState(false)

  useEffect(() => {
    // Fetch from search with just the PMID
    const fetchArticle = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/research/search', { params: { query: pmid + '[uid]', page: 1, limit: 1 } })
        if (data.publications?.length > 0) {
          setPub(data.publications[0])
        }
      } catch { toast.error('Failed to load article') }
      setLoading(false)
    }
    const checkBookmark = async () => {
      try {
        const { data } = await api.get('/bookmarks?type=publication')
        setBookmarked(data.bookmarks?.some(b => b.itemId === pmid))
      } catch {}
    }
    fetchArticle()
    checkBookmark()
  }, [pmid])

  const handleBookmark = async () => {
    try {
      if (bookmarked) {
        await api.delete(`/bookmarks/${pmid}`)
        setBookmarked(false)
        toast.success('Removed from bookmarks')
      } else {
        await api.post('/bookmarks', { type: 'publication', itemId: pmid, title: pub?.title, authors: pub?.authors, abstract: pub?.abstract, source: 'PubMed', url: pub?.url, publishedDate: pub?.publishedDate, journal: pub?.journal })
        setBookmarked(true)
        toast.success('Bookmarked!')
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const handleSummarize = async () => {
    setSummarizing(true)
    try {
      const { data } = await api.post('/ai/summarize', { abstract: pub.abstract, title: pub.title, type: 'patient' })
      setSummary(data.summary)
    } catch { toast.error('Failed to summarize') }
    setSummarizing(false)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
        <RiLoader4Line className="text-sky-400 text-4xl" />
      </motion.div>
      <p className="text-slate-400 mt-4">Loading article...</p>
    </div>
  )

  if (!pub) return (
    <div className="p-6 text-center">
      <p className="text-slate-400">Article not found.</p>
      <Link to="/app/research"><button className="btn-primary mt-4 text-sm px-5 py-2">Back to Search</button></Link>
    </div>
  )

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Back */}
        <Link to="/app/research" className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors mb-6 text-sm">
          <RiArrowLeftLine /> Back to Research
        </Link>

        {/* Header card */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0">
              <RiMicroscopeLine className="text-sky-400 text-xl" />
            </div>
            <h1 className="font-display text-xl font-bold text-white leading-snug">{pub.title}</h1>
          </div>

          {pub.authors?.length > 0 && (
            <p className="text-sky-400 text-sm mb-3">{pub.authors.join(', ')}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {pub.journal && <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 text-xs">{pub.journal}</span>}
            {pub.publishedDate && <span className="px-3 py-1 rounded-full bg-slate-700/50 text-slate-300 text-xs">{pub.publishedDate}</span>}
            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs">PMID: {pub.pmid}</span>
          </div>

          <div className="flex gap-3">
            <a href={pub.url} target="_blank" rel="noopener noreferrer" className="flex-1">
              <motion.button whileHover={{ scale: 1.02 }} className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2.5">
                <RiExternalLinkLine /> Open in PubMed
              </motion.button>
            </a>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBookmark}
              className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-sm transition-all ${
                bookmarked ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              {bookmarked ? <RiBookmarkFill /> : <RiBookmarkLine />}
              {bookmarked ? 'Saved' : 'Save'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleSummarize}
              disabled={summarizing}
              className="px-4 py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-300 hover:bg-violet-500/25 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {summarizing ? <motion.div className="w-4 h-4 border-2 border-violet-300/30 border-t-violet-300 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} /> : <RiRobot2Line />}
              AI Summary
            </motion.button>
          </div>
        </div>

        {/* AI Summary */}
        {summary && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 mb-6 border-violet-500/20">
            <h2 className="font-display text-base font-bold text-violet-300 mb-3 flex items-center gap-2">
              <RiRobot2Line /> Cura AI Summary
            </h2>
            <div className="prose-medical text-sm">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          </motion.div>
        )}

        {/* Abstract */}
        <div className="glass-card p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-white mb-4">Abstract</h2>
          <p className="text-slate-300 leading-relaxed text-sm">{pub.abstract}</p>
        </div>

        {/* Keywords */}
        {pub.keywords?.length > 0 && (
          <div className="glass-card p-5 mb-6">
            <h2 className="font-display text-base font-bold text-white mb-3">Keywords</h2>
            <div className="flex flex-wrap gap-2">
              {pub.keywords.map(kw => (
                <span key={kw} className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs">{kw}</span>
              ))}
            </div>
          </div>
        )}

        {/* MeSH */}
        {pub.meshTerms?.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="font-display text-base font-bold text-white mb-3">MeSH Terms</h2>
            <div className="flex flex-wrap gap-2">
              {pub.meshTerms.map(m => (
                <span key={m} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs">{m}</span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
