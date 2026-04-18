import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
  RiDashboardLine, RiMicroscopeLine, RiTestTubeLine,
  RiRobot2Line, RiBookmarkLine, RiUserLine,
  RiMenuLine, RiCloseLine, RiHeartPulseLine, RiLogoutBoxLine,
  RiBrainLine, RiUserHeartLine
} from 'react-icons/ri'
import useAuthStore from '../../store/authStore'

const navItems = [
  { to: '/app', label: 'Dashboard', icon: RiDashboardLine, exact: true },
  { to: '/app/structured', label: 'Smart Search', icon: RiUserHeartLine, badge: 'NEW' },
  { to: '/app/unified', label: 'AI Search', icon: RiBrainLine },
  { to: '/app/research', label: 'PubMed', icon: RiMicroscopeLine },
  { to: '/app/trials', label: 'Trials', icon: RiTestTubeLine },
  { to: '/app/chat', label: 'Cura AI', icon: RiRobot2Line },
  { to: '/app/bookmarks', label: 'Bookmarks', icon: RiBookmarkLine },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (to, exact) => exact ? location.pathname === to : location.pathname.startsWith(to)

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen bg-[#030d1a] border-r border-[rgba(14,165,233,0.12)] fixed left-0 top-0 z-40">
        <div className="p-6 border-b border-[rgba(14,165,233,0.1)]">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:shadow-sky-500/40 transition-shadow">
                <RiHeartPulseLine className="text-white text-xl" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 blur-md opacity-0 group-hover:opacity-40 transition-opacity" />
            </div>
            <div>
              <span className="font-display font-bold text-xl gradient-text">CuraLink</span>
              <p className="text-xs text-slate-500 -mt-0.5">AI Research</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, exact, badge }) => {
            const active = isActive(to, exact)
            return (
              <Link key={to} to={to}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer relative ${
                    active
                      ? 'bg-gradient-to-r from-sky-500/20 to-teal-500/10 text-sky-300 border border-sky-500/25 shadow-lg shadow-sky-500/10'
                      : 'text-slate-400 hover:text-sky-300 hover:bg-sky-500/8'
                  }`}
                >
                  <Icon className={`text-xl ${active ? 'text-sky-400' : ''}`} />
                  <span className="font-medium text-sm">{label}</span>
                  {badge && (
                    <span className="ml-auto px-1.5 py-0.5 rounded text-xs bg-gradient-to-r from-sky-500 to-violet-500 text-white font-bold">
                      {badge}
                    </span>
                  )}
                  {active && !badge && (
                    <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400" />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[rgba(14,165,233,0.1)]">
          <Link to="/app/profile">
            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-sky-500/8 transition-colors cursor-pointer mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/30 to-teal-500/30 border border-sky-500/25 flex items-center justify-center text-sky-300 text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
              </div>
            </motion.div>
          </Link>
          <motion.button
            whileHover={{ x: 2 }}
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/8 transition-colors text-sm"
          >
            <RiLogoutBoxLine />
            <span>Logout</span>
          </motion.button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#030d1a]/95 backdrop-blur-xl border-b border-[rgba(14,165,233,0.12)] px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center">
            <RiHeartPulseLine className="text-white text-base" />
          </div>
          <span className="font-display font-bold text-lg gradient-text">CuraLink</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg text-slate-400 hover:text-sky-300 transition-colors">
          {mobileOpen ? <RiCloseLine className="text-xl" /> : <RiMenuLine className="text-xl" />}
        </button>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="lg:hidden fixed inset-0 z-40 bg-[#030d1a]/98 pt-16 px-4 py-6"
          >
            <nav className="space-y-2">
              {navItems.map(({ to, label, icon: Icon, exact, badge }) => {
                const active = isActive(to, exact)
                return (
                  <Link key={to} to={to} onClick={() => setMobileOpen(false)}>
                    <div className={`flex items-center gap-3 px-4 py-4 rounded-xl ${active ? 'bg-sky-500/20 text-sky-300 border border-sky-500/25' : 'text-slate-400'}`}>
                      <Icon className="text-xl" />
                      <span className="font-medium">{label}</span>
                      {badge && <span className="ml-auto px-1.5 py-0.5 rounded text-xs bg-gradient-to-r from-sky-500 to-violet-500 text-white font-bold">{badge}</span>}
                    </div>
                  </Link>
                )
              })}
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-red-400">
                <RiLogoutBoxLine className="text-xl" />
                <span>Logout</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
