import { MapPin } from 'lucide-react'

export default function MissionStatus({ progress, eta }) {
  const circumference = 2 * Math.PI * 42
  const offset = circumference - (progress / 100) * circumference

  return (
    <section
      className="glass-card card-hover animate-fade-slide-up flex h-full flex-col p-5"
      style={{ animationDelay: '300ms' }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Mission Status</h2>
        <span className="rounded-md border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
          Active
        </span>
      </div>

      <div className="mb-1 text-sm text-white/50">Mission</div>
      <p className="mb-3 font-medium text-white">Surveillance Mission</p>

      <div className="mb-4 flex items-center gap-1.5 text-sm text-white/50">
        <MapPin className="h-3.5 w-3.5" />
        <span>Location:</span>
        <span className="text-white/75">Northern Sector</span>
      </div>

      <div className="mb-4 flex items-center gap-5">
        <div className="relative h-24 w-24 shrink-0">
          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r="42"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="6"
            />
            <circle
              cx="48"
              cy="48"
              r="42"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
              style={{ filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.5))' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-xl font-semibold text-white">{progress}%</span>
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-white/35">Mission Progress</p>
          <div className="mt-2 h-2 w-32 overflow-hidden rounded-full bg-white/5 sm:w-36">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-wide text-white/35">ETA</p>
        <p className="font-mono text-lg font-semibold text-white">{eta}</p>
      </div>

    </section>
  )
}
