import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  RiBookmarkLine, RiMicroscopeLine, RiTestTubeLine, RiDeleteBinLine,
  RiExternalLinkLine, RiLoader4Line, RiFilterLine
} from 'react-icons/ri'
import api from '../utils/api'
import toast from 'react-hot-toast'

const tabs = [
  { key: '', label: 'All', icon: RiBookmarkLine },
  { key: 'publication', label: 'Papers', icon: RiMicroscopeLine },
  { key: 'trial', label: 'Trials', icon: RiTestTubeLine },
]

function statusBadge(status) {
  const map = { 'RECRUITING': 'badge-recruiting', 'COMPLETED': 'badge-completed', 'NOT_YET_RECRUITING': 'badge-not_yet', 'ACTIVE_NOT_RECRUITING': 'badge-active', 'TERMINATED': 'badge-terminated' }
  return map[status] || 'badge-active'
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')

  useEffect(() => { fetchBookmarks() }, [activeTab])

  const fetchBookmarks = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/bookmarks${activeTab ? `?type=${activeTab}` : ''}`)
      setBookmarks(data.bookmarks || [])
    } catch { toast.error('Failed to load bookmarks') }
    setLoading(false)
  }

  const removeBookmark = async (itemId) => {
    try {
      await api.delete(`/bookmarks/${itemId}`)
      setBookmarks(prev => prev.filter(b => b.itemId !== itemId))
      toast.success('Bookmark removed')
    } catch { toast.error('Failed to remove') }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <RiBookmarkLine className="text-amber-400 text-xl" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">My Bookmarks</h1>
            <p className="text-slate-400 text-sm">{bookmarks.length} saved items</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                activeTab === key
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-300 glass-card'
              }`}
            >
              <Icon className="text-base" />
              {label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <RiLoader4Line className="text-amber-400 text-4xl" />
          </motion.div>
          <p className="text-slate-400 mt-4 text-sm">Loading bookmarks...</p>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-20">
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <RiBookmarkLine className="text-6xl text-amber-500/20 mx-auto mb-4" />
          </motion.div>
          <h3 className="font-display text-xl text-white mb-2">No Bookmarks Yet</h3>
          <p className="text-slate-400 text-sm mb-6">Start saving papers and trials to access them quickly here.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/app/research"><button className="btn-primary text-sm px-5 py-2">Browse Papers</button></Link>
            <Link to="/app/trials"><button className="btn-secondary text-sm px-5 py-2">Browse Trials</button></Link>
          </div>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-4">
            {bookmarks.map((bm, i) => (
              <motion.div
                key={bm._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2 }}
                className="glass-card p-5 group"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    bm.type === 'publication' ? 'bg-sky-500/15 text-sky-400' : 'bg-teal-500/15 text-teal-400'
                  }`}>
                    {bm.type === 'publication' ? <RiMicroscopeLine /> : <RiTestTubeLine />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={bm.type === 'publication' ? `/app/research/${bm.itemId}` : `/app/trials/${bm.itemId}`}
                      className="font-display text-base font-semibold text-white hover:text-sky-300 transition-colors line-clamp-2 block"
                    >
                      {bm.title}
                    </Link>
                    {bm.authors?.length > 0 && (
                      <p className="text-sky-400 text-xs mt-0.5 truncate">{bm.authors.slice(0, 3).join(', ')}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {bm.journal && <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/15 text-xs">{bm.journal}</span>}
                      {bm.publishedDate && <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 text-xs">{bm.publishedDate}</span>}
                      {bm.status && <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(bm.status)}`}>{bm.status?.replace(/_/g, ' ')}</span>}
                      {bm.phase && bm.phase !== 'N/A' && <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-xs">{bm.phase}</span>}
                    </div>
                    {bm.abstract && (
                      <p className="text-slate-400 text-sm mt-2 line-clamp-2">{bm.abstract}</p>
                    )}
                    {bm.notes && (
                      <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/15">
                        <p className="text-amber-300 text-xs">{bm.notes}</p>
                      </div>
                    )}
                    <p className="text-xs text-slate-600 mt-2">Saved {new Date(bm.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {bm.url && (
                      <a href={bm.url} target="_blank" rel="noopener noreferrer">
                        <motion.button whileHover={{ scale: 1.15 }} className="p-2 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 transition-colors">
                          <RiExternalLinkLine />
                        </motion.button>
                      </a>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeBookmark(bm.itemId)}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <RiDeleteBinLine />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
