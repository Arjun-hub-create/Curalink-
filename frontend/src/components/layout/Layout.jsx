import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import FloatingParticles from '../animations/FloatingParticles'

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#030d1a] flex">
      <Navbar />
      <main className="flex-1 lg:ml-64 min-h-screen relative">
        <FloatingParticles />
        <div className="relative z-10 pt-16 lg:pt-0 min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
