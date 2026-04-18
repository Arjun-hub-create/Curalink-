import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react'
import {
  RiHeartPulseLine, RiMicroscopeLine, RiRobot2Line, RiTestTubeLine,
  RiBookmarkLine, RiBrainLine, RiShieldCheckLine, RiArrowRightLine,
  RiGlobalLine, RiSearchLine, RiUserHeartLine, RiFlaskLine
} from 'react-icons/ri'

const FloatingBlob = ({ className, delay = 0, color = '#0ea5e9' }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
    style={{ background: color, opacity: 0.06 }}
    animate={{ y: [0, -30, 0], x: [0, 15, 0], scale: [1, 1.1, 1] }}
    transition={{ duration: 10 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
  />
)

const HeartbeatLine = () => (
  <svg viewBox="0 0 300 60" className="w-full h-12 opacity-30">
    <motion.polyline
      fill="none" stroke="#0ea5e9" strokeWidth="2"
      points="0,30 30,30 45,10 55,50 70,5 85,55 100,30 130,30 145,20 155,40 170,30 300,30"
      strokeDasharray="400"
      initial={{ strokeDashoffset: 400 }}
      animate={{ strokeDashoffset: 0 }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    />
  </svg>
)

const CountUp = ({ end, duration = 2 }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = end / (duration * 60)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [inView, end, duration])

  return <span ref={ref}>{count.toLocaleString()}</span>
}

const features = [
  { icon: RiMicroscopeLine, title: 'PubMed Research', desc: 'Search 35M+ publications with advanced filters and AI-powered summaries', color: 'from-sky-500 to-blue-600' },
  { icon: RiTestTubeLine, title: 'Clinical Trials', desc: 'Discover 450K+ trials from ClinicalTrials.gov matching your condition', color: 'from-teal-500 to-emerald-600' },
  { icon: RiRobot2Line, title: 'Cura AI Assistant', desc: 'Ask medical questions and get evidence-based answers with citations', color: 'from-violet-500 to-purple-600' },
  { icon: RiBookmarkLine, title: 'Smart Bookmarks', desc: 'Save papers and trials with personal notes and custom tags', color: 'from-amber-500 to-orange-600' },
  { icon: RiUserHeartLine, title: 'Patient-Centered', desc: 'Simplified explanations that bridge complex research to patient care', color: 'from-rose-500 to-pink-600' },
  { icon: RiShieldCheckLine, title: 'Verified Sources', desc: 'All data sourced from trusted NIH, FDA, and academic databases', color: 'from-cyan-500 to-sky-600' },
]

const stats = [
  { value: 35000000, label: 'Publications', suffix: '+', prefix: '' },
  { value: 450000, label: 'Clinical Trials', suffix: '+', prefix: '' },
  { value: 24, label: 'Hour AI Support', suffix: '/7', prefix: '' },
  { value: 99, label: 'Data Accuracy', suffix: '%', prefix: '' },
]

const FadeInSection = ({ children, delay = 0 }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, -100])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handle = (e) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    window.addEventListener('mousemove', handle)
    return () => window.removeEventListener('mousemove', handle)
  }, [])

  return (
    <div className="min-h-screen bg-[#030d1a] overflow-x-hidden font-sans">
      {/* Navbar */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(3,13,26,0.85)', borderBottom: '1px solid rgba(14,165,233,0.1)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
            <RiHeartPulseLine className="text-white text-lg" />
          </div>
          <span className="font-display font-bold text-xl gradient-text">CuraLink</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary text-sm px-5 py-2">Sign In</Link>
          <Link to="/register" className="btn-primary text-sm px-5 py-2">Get Started</Link>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg">
        <FloatingBlob className="w-96 h-96 -top-20 -left-20" delay={0} color="#0ea5e9" />
        <FloatingBlob className="w-80 h-80 top-1/3 right-0" delay={3} color="#14b8a6" />
        <FloatingBlob className="w-64 h-64 bottom-0 left-1/3" delay={5} color="#6366f1" />

        {/* Floating medical icons */}
        {[
          { icon: RiMicroscopeLine, top: '15%', left: '8%', delay: 0, size: 'text-3xl' },
          { icon: RiFlaskLine, top: '20%', right: '10%', delay: 1, size: 'text-2xl' },
          { icon: RiBrainLine, bottom: '25%', left: '6%', delay: 2, size: 'text-2xl' },
          { icon: RiTestTubeLine, bottom: '30%', right: '8%', delay: 1.5, size: 'text-3xl' },
          { icon: RiGlobalLine, top: '40%', left: '3%', delay: 0.5, size: 'text-xl' },
        ].map(({ icon: Icon, delay, size, ...pos }, i) => (
          <motion.div
            key={i}
            className={`absolute ${size} text-sky-400/20`}
            style={pos}
            animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6 + i, repeat: Infinity, ease: 'easeInOut', delay }}
          >
            <Icon />
          </motion.div>
        ))}

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-sky-500/20 text-sky-300 text-sm mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
            </span>
            AI-Powered Medical Research Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6"
          >
            <span className="text-white">Bridge the Gap Between</span><br />
            <span className="gradient-text">Patients & Research</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed"
          >
            CuraLink unifies PubMed publications, clinical trials, and AI assistance into one powerful platform for patients, researchers, and clinicians.
          </motion.p>

          <div className="mb-10">
            <HeartbeatLine />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 50px rgba(14,165,233,0.5)' }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary px-8 py-4 text-base rounded-xl flex items-center gap-2"
              >
                Start Researching Free
                <RiArrowRightLine />
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-secondary px-8 py-4 text-base rounded-xl"
              >
                Sign In
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-sky-500/30 flex justify-center pt-2">
            <div className="w-1 h-3 rounded-full bg-sky-400/60" />
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ value, label, suffix, prefix }, i) => (
              <FadeInSection key={label} delay={i * 0.1}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="glass-card p-6 text-center"
                >
                  <p className="font-display text-3xl md:text-4xl font-bold gradient-text">
                    {prefix}<CountUp end={value} />{suffix}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">{label}</p>
                </motion.div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                Everything You Need for <span className="gradient-text">Medical Research</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                A unified platform bringing together the world's leading medical databases with cutting-edge AI
              </p>
            </div>
          </FadeInSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }, i) => (
              <FadeInSection key={title} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="glass-card p-6 group cursor-default"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="text-white text-2xl" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-6 relative overflow-hidden">
        <FloatingBlob className="w-96 h-96 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" color="#14b8a6" />
        <div className="max-w-4xl mx-auto relative z-10">
          <FadeInSection>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-center text-white mb-16">
              How <span className="gradient-text">CuraLink</span> Works
            </h2>
          </FadeInSection>
          <div className="space-y-8">
            {[
              { step: '01', title: 'Search Across Sources', desc: 'Query PubMed, ClinicalTrials.gov, and arXiv simultaneously with one search', icon: RiSearchLine },
              { step: '02', title: 'AI Summarizes & Explains', desc: 'Cura AI distills complex findings into patient-friendly or researcher-grade summaries', icon: RiRobot2Line },
              { step: '03', title: 'Save & Organize', desc: 'Bookmark publications and trials, add personal notes and tags for future reference', icon: RiBookmarkLine },
              { step: '04', title: 'Connect & Collaborate', desc: 'Find relevant trials to participate in or researchers to collaborate with', icon: RiUserHeartLine },
            ].map(({ step, title, desc, icon: Icon }, i) => (
              <FadeInSection key={step} delay={i * 0.15}>
                <motion.div
                  whileHover={{ x: 6 }}
                  className="flex gap-6 items-start glass-card p-6"
                >
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500/20 to-teal-500/20 border border-sky-500/25 flex items-center justify-center">
                    <Icon className="text-sky-400 text-2xl" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-sky-500 mb-1 block">{step}</span>
                    <h3 className="font-display text-xl font-bold text-white mb-1">{title}</h3>
                    <p className="text-slate-400">{desc}</p>
                  </div>
                </motion.div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <FadeInSection>
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="max-w-3xl mx-auto text-center glass-card p-12 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-teal-500/5" />
            <div className="relative z-10">
              <RiHeartPulseLine className="text-5xl text-sky-400 mx-auto mb-4 animate-pulse" />
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Research?
              </h2>
              <p className="text-slate-400 mb-8">Join CuraLink today and access the world's most comprehensive medical research platform.</p>
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 50px rgba(14,165,233,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary px-10 py-4 text-lg rounded-xl"
                >
                  Get Started Free →
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </FadeInSection>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(14,165,233,0.1)] py-8 px-6 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <RiHeartPulseLine className="text-sky-500" />
          <span className="gradient-text font-semibold">CuraLink</span>
        </div>
        <p>© 2024 CuraLink · AI-Powered Medical Research Assistant · Built for Humanity Founders Hackathon</p>
      </footer>
    </div>
  )
}
