import { useState } from 'react'
import { motion } from 'framer-motion'
import { RiUserLine, RiMailLine, RiHospitalLine, RiStethoscopeLine, RiSaveLine, RiHeartPulseLine } from 'react-icons/ri'
import useAuthStore from '../store/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState({
    name: user?.name || '',
    specialization: user?.specialization || '',
    institution: user?.institution || '',
    bio: user?.bio || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.put('/auth/profile', form)
      updateUser(data.user)
      toast.success('Profile updated!')
    } catch { toast.error('Failed to update profile') }
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
            <RiUserLine className="text-sky-400 text-xl" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">My Profile</h1>
            <p className="text-slate-400 text-sm capitalize">{user?.role} · Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</p>
          </div>
        </div>
      </motion.div>

      {/* Avatar card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 mb-6 flex items-center gap-5"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white text-3xl font-bold font-display shadow-xl shadow-sky-500/30"
        >
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </motion.div>
        <div>
          <h2 className="font-display text-xl font-bold text-white">{user?.name}</h2>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 text-xs capitalize border border-sky-500/25">{user?.role}</span>
            {user?.specialization && <span className="text-slate-500 text-xs">{user.specialization}</span>}
          </div>
        </div>
      </motion.div>

      {/* Edit form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="font-display text-lg font-bold text-white mb-5 flex items-center gap-2">
          <RiHeartPulseLine className="text-sky-400" />
          Edit Profile
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={form.name} onChange={set('name')} className="medical-input pl-10" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <div className="relative">
              <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={user?.email || ''} disabled className="medical-input pl-10 opacity-50 cursor-not-allowed" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Specialization</label>
            <div className="relative">
              <RiStethoscopeLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={form.specialization} onChange={set('specialization')} placeholder="e.g. Oncology, Cardiology, Neurology" className="medical-input pl-10" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Institution</label>
            <div className="relative">
              <RiHospitalLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={form.institution} onChange={set('institution')} placeholder="e.g. Johns Hopkins Hospital" className="medical-input pl-10" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={set('bio')}
              rows={3}
              placeholder="Tell us about your research interests or health journey..."
              className="medical-input resize-none"
            />
          </div>

          <motion.button
            type="submit"
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {saving
              ? <><motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} /> Saving...</>
              : <><RiSaveLine /> Save Changes</>
            }
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
