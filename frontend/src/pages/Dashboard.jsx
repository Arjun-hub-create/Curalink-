import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  RiMicroscopeLine, RiTestTubeLine, RiRobot2Line, RiBookmarkLine,
  RiHeartPulseLine, RiArrowRightLine, RiSearchLine, RiTimeLine
} from 'react-icons/ri'
import useAuthStore from '../store/authStore'
import api from '../utils/api'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } }

const quickLinks = [
  { to: '/app/research', icon: RiMicroscopeLine, label: 'Search Publications', desc: 'PubMed Database', color: 'from-sky-500 to-blue-600', bg: 'rgba(14,165,233,0.1)' },
  { to: '/app/trials', icon: RiTestTubeLine, label: 'Clinical Trials', desc: 'ClinicalTrials.gov', color: 'from-teal-500 to-emerald-600', bg: 'rgba(20,184,166,0.1)' },
  { to: '/app/chat', icon: RiRobot2Line, label: 'Ask Cura AI', desc: 'Medical AI Assistant', color: 'from-violet-500 to-purple-600', bg: 'rgba(139,92,246,0.1)' },
  { to: '/app/bookmarks', icon: RiBookmarkLine, label: 'My Bookmarks', desc: 'Saved Research', color: 'from-amber-500 to-orange-600', bg: 'rgba(245,158,11,0.1)' },
]

export default function Dashboard() {
  const { user } = useAuthStore()
  const [history, setHistory] = useState([])
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [query, setQuery] = useState('')

  useEffect(() => {
    api.get('/history').then(r => setHistory(r.data.history?.slice(0, 8) || [])).catch(() => {})
    api.get('/bookmarks').then(r => setBookmarkCount(r.data.total || 0)).catch(() => {})
  }, [])

  const greet = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-teal-500/20 border border-sky-500/25 flex items-center justify-center"
          >
            <RiHeartPulseLine className="text-sky-400 text-xl" />
          </motion.div>
          <div>
            <h1 className="font-display text-3xl font-bold text-white">
              {greet()}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400 text-sm capitalize">{user?.role} · {user?.institution || 'CuraLink Member'}</p>
          </div>
        </div>

        {/* Quick search bar */}
        <motion.form
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={(e) => { e.preventDefault(); if (query.trim()) window.location.href = `/app/research?q=${encodeURIComponent(query)}` }}
          className="mt-6 relative max-w-2xl"
        >
          <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search PubMed publications, conditions, authors..."
            className="medical-input pl-12 pr-32 py-4 text-base"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary px-5 py-2 text-sm"
          >
            Search
          </motion.button>
        </motion.form>
      </motion.div>

      {/* Quick links */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {quickLinks.map(({ to, icon: Icon, label, desc, color, bg }) => (
          <motion.div key={to} variants={item}>
            <Link to={to}>
              <motion.div
                whileHover={{ y: -6, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="glass-card p-5 cursor-pointer group h-full"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="text-white text-2xl" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-0.5">{label}</h3>
                <p className="text-slate-500 text-xs">{desc}</p>
                <RiArrowRightLine className="text-slate-600 group-hover:text-sky-400 group-hover:translate-x-1 transition-all mt-3 text-lg" />
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-1 space-y-4">
          <h2 className="font-display text-lg font-bold text-white">Your Stats</h2>
          {[
            { label: 'Saved Bookmarks', value: bookmarkCount, icon: RiBookmarkLine, color: 'text-amber-400' },
            { label: 'Searches Made', value: history.length, icon: RiSearchLine, color: 'text-sky-400' },
            { label: 'Account Type', value: user?.role === 'researcher' ? 'Researcher' : 'Patient', icon: RiHeartPulseLine, color: 'text-teal-400', isText: true },
          ].map(({ label, value, icon: Icon, color, isText }) => (
            <motion.div key={label} whileHover={{ x: 3 }} className="glass-card p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-current/10 flex items-center justify-center ${color}`} style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Icon className={`text-lg ${color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="font-bold text-white">{isText ? value : value.toLocaleString()}</p>
              </div>
            </motion.div>
          ))}

          {/* Platform stats */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform</h3>
            {[
              { label: 'PubMed Articles', value: '35M+' },
              { label: 'Clinical Trials', value: '450K+' },
              { label: 'AI Available', value: '24/7' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">{label}</span>
                <span className="text-sky-300 font-semibold text-sm">{value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent searches */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
            <RiTimeLine className="text-sky-400" />
            Recent Searches
          </h2>
          {history.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <RiSearchLine className="text-4xl text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No searches yet. Start exploring!</p>
              <Link to="/app/research">
                <motion.button whileHover={{ scale: 1.03 }} className="btn-primary mt-4 px-6 py-2 text-sm">
                  Search Publications
                </motion.button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  whileHover={{ x: 4 }}
                >
                  <Link to={`/app/${h.type === 'pubmed' ? 'research' : h.type === 'trials' ? 'trials' : 'chat'}?q=${encodeURIComponent(h.query)}`}>
                    <div className="glass-card p-3 flex items-center gap-3 group cursor-pointer">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                        h.type === 'pubmed' ? 'bg-sky-500/15 text-sky-400' :
                        h.type === 'trials' ? 'bg-teal-500/15 text-teal-400' :
                        'bg-violet-500/15 text-violet-400'
                      }`}>
                        {h.type === 'pubmed' ? <RiMicroscopeLine /> : h.type === 'trials' ? <RiTestTubeLine /> : <RiRobot2Line />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 truncate group-hover:text-white transition-colors">{h.query}</p>
                        <p className="text-xs text-slate-600 capitalize">{h.type === 'pubmed' ? 'Publication' : h.type}</p>
                      </div>
                      <RiArrowRightLine className="text-slate-600 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
