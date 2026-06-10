import { Leaf } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg group-hover:bg-emerald-400 transition-colors">
            <Leaf className="h-5 w-5 text-white" />
          </span>
          <span className="text-xl font-bold text-white">ThermaMorph</span>
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-xs text-slate-500">
        AI-Powered Carbon Footprint Awareness Platform
      </p>
    </div>
  )
}
