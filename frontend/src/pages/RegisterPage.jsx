import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RiHeartPulseLine, RiMailLine, RiLockLine, RiUserLine, RiHospitalLine, RiStethoscopeLine } from 'react-icons/ri'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient', specialization: '', institution: '' })
  const { register, loading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    const result = await register(form)
    if (result.success) {
      toast.success('Account created! Welcome to CuraLink 🎉')
      navigate('/app')
    } else {
      toast.error(result.error)
    }
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div className="min-h-screen bg-[#030d1a] grid-bg flex items-center justify-center px-4 py-12">
      <motion.div className="absolute w-96 h-96 rounded-full blur-3xl top-0 right-0 pointer-events-none" style={{ background: '#0ea5e9', opacity: 0.05 }} animate={{ y: [0,-20,0] }} transition={{ duration:8, repeat:Infinity }} />
      <motion.div className="absolute w-80 h-80 rounded-full blur-3xl bottom-0 left-0 pointer-events-none" style={{ background: '#14b8a6', opacity: 0.05 }} animate={{ y: [0,20,0] }} transition={{ duration:10, repeat:Infinity }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <motion.div
              animate={{ y: [0,-8,0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 items-center justify-center mb-4 shadow-xl shadow-sky-500/30"
            >
              <RiHeartPulseLine className="text-white text-3xl" />
            </motion.div>
            <h1 className="font-display text-3xl font-bold gradient-text">Join CuraLink</h1>
            <p className="text-slate-400 mt-1">Create your free research account</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'patient', label: 'Patient / Caregiver', icon: RiHeartPulseLine },
              { value: 'researcher', label: 'Researcher / Clinician', icon: RiStethoscopeLine },
            ].map(({ value, label, icon: Icon }) => (
              <motion.button
                key={value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setForm(f => ({ ...f, role: value }))}
                className={`p-4 rounded-xl border text-left transition-all ${
                  form.role === value
                    ? 'bg-sky-500/15 border-sky-500/50 text-sky-300'
                    : 'bg-sky-500/5 border-sky-500/10 text-slate-400 hover:border-sky-500/25'
                }`}
              >
                <Icon className="text-xl mb-1" />
                <p className="text-xs font-medium">{label}</p>
              </motion.button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" required value={form.name} onChange={set('name')} placeholder="Dr. Jane Smith" className="medical-input pl-10" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" required value={form.email} onChange={set('email')} placeholder="you@hospital.com" className="medical-input pl-10" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="password" required value={form.password} onChange={set('password')} placeholder="Min. 6 characters" className="medical-input pl-10" />
              </div>
            </div>

            {form.role === 'researcher' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Specialization</label>
                  <div className="relative">
                    <RiStethoscopeLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" value={form.specialization} onChange={set('specialization')} placeholder="e.g. Oncology, Cardiology" className="medical-input pl-10" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Institution</label>
                  <div className="relative">
                    <RiHospitalLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" value={form.institution} onChange={set('institution')} placeholder="e.g. Johns Hopkins University" className="medical-input pl-10" />
                  </div>
                </div>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full py-3.5 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                  Creating Account...
                </span>
              ) : 'Create Free Account'}
            </motion.button>
          </form>

          <p className="text-center text-slate-400 mt-6 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
