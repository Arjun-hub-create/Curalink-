import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RiRobot2Line, RiSendPlaneLine, RiLoader4Line,
  RiUserLine, RiDeleteBinLine, RiAddLine, RiHeartPulseLine,
  RiAlertLine, RiCheckboxCircleLine, RiErrorWarningLine
} from 'react-icons/ri'
import ReactMarkdown from 'react-markdown'
import api, { apiAI } from '../utils/api'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const SUGGESTIONS = [
  'Explain what a Phase 3 clinical trial means',
  'What is the PICO framework in research?',
  'Summarize how immunotherapy works for cancer',
  'What are the side effects of metformin?',
  'How do I read a forest plot in a meta-analysis?',
  'What is statistical significance vs clinical significance?',
]

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center mt-1 ${
        isUser
          ? 'bg-gradient-to-br from-sky-500 to-teal-500'
          : 'bg-gradient-to-br from-violet-500 to-purple-600'
      }`}>
        {isUser ? <RiUserLine className="text-white text-sm" /> : <RiRobot2Line className="text-white text-sm" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-gradient-to-br from-sky-500/25 to-teal-500/15 border border-sky-500/25 text-slate-200 rounded-tr-sm'
          : 'glass-card text-slate-300 rounded-tl-sm prose-medical'
      }`}>
        {isUser ? (
          <p>{msg.content}</p>
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="text-sky-300 font-semibold">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc ml-4 space-y-1 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-4 space-y-1 mb-2">{children}</ol>,
              li: ({ children }) => <li className="text-slate-300">{children}</li>,
              code: ({ children }) => <code className="bg-sky-500/15 px-1.5 py-0.5 rounded text-sky-300 text-xs font-mono">{children}</code>,
              h3: ({ children }) => <h3 className="font-display font-bold text-white mt-3 mb-1 text-base">{children}</h3>,
              h2: ({ children }) => <h2 className="font-display font-bold text-white mt-3 mb-1 text-lg">{children}</h2>,
              blockquote: ({ children }) => <blockquote className="border-l-2 border-sky-500 pl-3 italic text-slate-400 my-2">{children}</blockquote>,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        )}
        <p className="text-xs text-slate-600 mt-1.5 text-right">
          {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex gap-3"
    >
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
        <RiRobot2Line className="text-white text-sm" />
      </div>
      <div className="glass-card px-5 py-4 rounded-2xl rounded-tl-sm">
        <div className="flex gap-1.5 items-center">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-violet-400"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.7, repeat: Infinity, delay }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Status Banner ─── */
function StatusBanner({ status, onDismiss }) {
  if (!status || status.ollamaRunning === undefined) return null
  // Everything is good — no banner needed
  if (status.ollamaRunning && status.modelReady) return null

  const isDown = !status.ollamaRunning
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-6 mt-3 rounded-xl px-4 py-3 text-sm border ${
        isDown
          ? 'bg-red-500/10 border-red-500/30 text-red-300'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
      }`}
    >
      <div className="flex items-start gap-2">
        {isDown ? <RiErrorWarningLine className="text-lg flex-shrink-0 mt-0.5" /> : <RiAlertLine className="text-lg flex-shrink-0 mt-0.5" />}
        <div className="flex-1">
          {isDown ? (
            <>
              <p className="font-semibold mb-1">Ollama is not running</p>
              <p className="text-xs opacity-80 leading-relaxed">
                The local AI needs Ollama to be running. Open a terminal and run:
              </p>
              <code className="block mt-1.5 text-xs bg-black/30 rounded px-2 py-1 font-mono">ollama serve</code>
              <p className="text-xs opacity-60 mt-1.5">
                Don't have Ollama? Install from <strong>https://ollama.com/download</strong>
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold mb-1">Model "{status.activeModel}" not found</p>
              <p className="text-xs opacity-80">
                Available models: {status.availableModels?.length > 0
                  ? status.availableModels.join(', ')
                  : 'none installed'}
              </p>
              <p className="text-xs opacity-80 mt-1">Pull the required model:</p>
              <code className="block mt-1 text-xs bg-black/30 rounded px-2 py-1 font-mono">
                ollama pull {status.activeModel}
              </code>
            </>
          )}
        </div>
        <button onClick={onDismiss} className="text-xs opacity-50 hover:opacity-100 px-1">✕</button>
      </div>
    </motion.div>
  )
}

export default function AIChatPage() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [sessions, setSessions] = useState([])
  const [aiStatus, setAiStatus] = useState(null) // null = not checked yet
  const [statusDismissed, setStatusDismissed] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  /* ─── Check Ollama status on mount ─── */
  const checkAIStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/ai/status')
      setAiStatus(data)
      return data
    } catch (err) {
      console.error('Failed to check AI status:', err)
      setAiStatus({ ollamaRunning: false, availableModels: [], modelReady: false, activeModel: 'llama3.2' })
      return null
    }
  }, [])

  useEffect(() => {
    loadSessions()
    checkAIStatus()
    // Welcome message
    setMessages([{
      role: 'assistant',
      content: `Hi, I'm **Cura** 👋 — your AI medical research assistant!\n\nI can help you:\n- **Explain** research papers and clinical trials in plain language\n- **Summarize** complex medical literature\n- **Answer** questions about treatments, conditions, and study designs\n- **Guide** your research using the PICO framework\n\nWhat medical question can I help you with today?`,
      timestamp: new Date()
    }])
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const loadSessions = async () => {
    try {
      const { data } = await api.get('/ai/sessions')
      setSessions(data.sessions || [])
    } catch {}
  }

  const loadSession = async (id) => {
    try {
      const { data } = await api.get(`/ai/sessions/${id}`)
      setMessages(data.session.messages)
      setSessionId(id)
    } catch { toast.error('Failed to load session') }
  }

  const newChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Hi again! What medical research question can I help you with?`,
      timestamp: new Date()
    }])
    setSessionId(null)
    setInput('')
  }

  const deleteSession = async (id, e) => {
    e.stopPropagation()
    try {
      await api.delete(`/ai/sessions/${id}`)
      setSessions(prev => prev.filter(s => s._id !== id))
      if (sessionId === id) newChat()
      toast.success('Session deleted')
    } catch {}
  }

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')

    // Re-check AI status before sending
    const freshStatus = await checkAIStatus()

    const userMsg = { role: 'user', content: msg, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      // Use apiAI with 180s timeout for chat
      const { data } = await apiAI.post('/ai/chat', {
        message: msg,
        sessionId,
        context: 'medical_research'
      })
      const aiMsg = { role: 'assistant', content: data.response, timestamp: new Date() }
      setMessages(prev => [...prev, aiMsg])
      if (data.sessionId) {
        setSessionId(data.sessionId)
        loadSessions()
      }
    } catch (err) {
      // Show the exact error from the server
      const serverError = err.response?.data?.detail
        || err.response?.data?.error
        || err.message
        || 'Unknown error'

      const errorContent = err.code === 'ECONNABORTED'
        ? `**Request timed out** — The AI took too long to respond. This can happen if the model is loading for the first time. Please try again.`
        : `**Error:** ${serverError}\n\nMake sure Ollama is running (\`ollama serve\`) and has a model (\`ollama pull llama3.2\`).`

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      }])
      console.error('[AIChatPage] Send failed:', err)
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  /* ─── Derive status indicator ─── */
  const statusColor = aiStatus === null
    ? 'bg-slate-500'                                    // not checked yet
    : aiStatus.ollamaRunning && aiStatus.modelReady
      ? 'bg-green-400'                                  // all good
      : aiStatus.ollamaRunning
        ? 'bg-amber-400'                                // running but model missing
        : 'bg-red-400'                                  // ollama down

  const statusText = aiStatus === null
    ? 'Checking AI status…'
    : aiStatus.ollamaRunning && aiStatus.modelReady
      ? `Online · ${aiStatus.activeModel}`
      : aiStatus.ollamaRunning
        ? `Model not found`
        : 'Ollama offline'

  return (
    <div className="flex h-screen" style={{ maxHeight: 'calc(100vh - 0px)' }}>
      {/* Sessions sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-[rgba(14,165,233,0.1)] bg-[#020c17] p-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={newChat}
          className="btn-primary flex items-center gap-2 w-full mb-4 py-2.5 text-sm justify-center"
        >
          <RiAddLine /> New Chat
        </motion.button>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 px-2">History</p>
        <div className="flex-1 overflow-y-auto space-y-1">
          {sessions.map(s => (
            <motion.div
              key={s._id}
              whileHover={{ x: 2 }}
              onClick={() => loadSession(s._id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group text-xs transition-colors ${
                sessionId === s._id ? 'bg-violet-500/15 text-violet-300' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <RiRobot2Line className="flex-shrink-0" />
              <span className="truncate flex-1">{s.title}</span>
              <button
                onClick={(e) => deleteSession(s._id, e)}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
              >
                <RiDeleteBinLine />
              </button>
            </motion.div>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs text-slate-600 text-center mt-4">No past sessions</p>
          )}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header with AI Status Indicator */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[rgba(14,165,233,0.1)] flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30"
          >
            <RiRobot2Line className="text-white text-xl" />
          </motion.div>
          <div>
            <h1 className="font-display text-lg font-bold text-white">Cura AI</h1>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${statusColor} ${aiStatus?.ollamaRunning && aiStatus?.modelReady ? 'animate-pulse' : ''}`} />
              <span className="text-xs text-slate-400">{statusText}</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={checkAIStatus}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
              title="Refresh AI status"
            >
              <RiCheckboxCircleLine /> Check Status
            </button>
            <button onClick={newChat} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
              <RiAddLine /> New Chat
            </button>
          </div>
        </div>

        {/* Status Banner — shows if Ollama is down or model is missing */}
        {!statusDismissed && <StatusBanner status={aiStatus} onDismiss={() => setStatusDismissed(true)} />}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <AnimatePresence>
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {loading && <TypingIndicator key="typing" />}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && !loading && (
          <div className="px-6 pb-3">
            <p className="text-xs text-slate-500 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <motion.button
                  key={s}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 hover:bg-violet-500/20 transition-colors text-left"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-[rgba(14,165,233,0.1)]">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask Cura a medical question... (Enter to send)"
                rows={1}
                className="medical-input py-3 pr-4 resize-none text-sm"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {loading
                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}><RiLoader4Line className="text-white text-xl" /></motion.div>
                : <RiSendPlaneLine className="text-white text-lg" />
              }
            </motion.button>
          </div>
          <p className="text-xs text-slate-600 mt-2 text-center">
            Cura provides research information only. Always consult a healthcare professional for medical decisions.
          </p>
        </div>
      </div>
    </div>
  )
}
