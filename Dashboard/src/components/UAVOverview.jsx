import { ArrowRight, Cloud, Clock, Calendar } from 'lucide-react'
import TelemetryGrid from './TelemetryGrid'

function EngineVisual() {
  return (
    <div className="relative flex h-48 w-full items-center justify-center sm:h-56 lg:h-64">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-radar absolute h-44 w-44 rounded-full border border-blue-500/10" />
        <div className="animate-radar absolute h-36 w-36 rounded-full border border-blue-500/15 [animation-duration:8s]" />
        <div className="absolute h-28 w-28 rounded-full border border-blue-500/20" />
        <div className="absolute h-20 w-20 rounded-full bg-blue-500/5 blur-xl" />
      </div>

      <div className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900 shadow-[0_0_40px_rgba(59,130,246,0.25)] ring-1 ring-white/10 sm:h-36 sm:w-36">
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-zinc-600/50 to-zinc-900/80 ring-1 ring-white/5" />
        <div className="absolute inset-6 rounded-full bg-gradient-to-br from-zinc-500/30 to-zinc-800/60" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 ring-2 ring-blue-500/30">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400/60 to-blue-600/40 shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
        </div>
        {[0, 45, 90, 135].map((deg) => (
          <div
            key={deg}
            className="absolute h-1 w-6 rounded-full bg-zinc-600/80"
            style={{ transform: `rotate(${deg}deg) translateY(-48px)` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function UAVOverview({ telemetry, sparklines, currentTime }) {
  const timeStr = currentTime.toUTCString().slice(17, 25)
  const dateStr = currentTime.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <section
      className="glass-card card-hover animate-fade-slide-up overflow-hidden"
      style={{ animationDelay: '100ms' }}
    >
      <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-12 lg:gap-4 lg:p-6">
        {/* Left — UAV info */}
        <div className="lg:col-span-3">
          <h2 className="mb-4 text-lg font-semibold text-white">SkyEye X7</h2>

          <dl className="space-y-3 text-sm">
            {[
              ['UAV ID', 'UAV-X7-00123'],
              ['Model', 'SkyEye X7'],
              ['Class', 'VTOL Recon'],
              ['Manufactured', 'Feb 2024'],
              ['Total Flight Hours', '128.6 hrs'],
            ].map(([label, val]) => (
              <div key={label}>
                <dt className="text-[11px] uppercase tracking-wide text-white/35">{label}</dt>
                <dd className="font-mono text-sm text-white/85">{val}</dd>
              </div>
            ))}
          </dl>

          {/* <button
            type="button"
            className="btn-glow mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            View Full Details
            <ArrowRight className="h-4 w-4" />
          </button> */}
        </div>

        {/* Middle — Engine visual */}
        <div className="order-first lg:order-none lg:col-span-4">
          <EngineVisual />
        </div>

        {/* Right — Time, weather, telemetry */}
        <div className="lg:col-span-5">
          <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-white/35">
                <Clock className="h-3 w-3" />
                <span className="text-[11px] uppercase tracking-wide">Current time</span>
              </div>
              <p className="font-mono text-lg font-semibold text-white">{timeStr} UTC</p>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-white/35">
                <Calendar className="h-3 w-3" />
                <span className="text-[11px] uppercase tracking-wide">Date</span>
              </div>
              <p className="text-sm text-white/80">{dateStr}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="mb-1 flex items-center gap-1.5 text-white/35">
                <Cloud className="h-3 w-3" />
                <span className="text-[11px] uppercase tracking-wide">Weather</span>
              </div>
              <p className="font-mono text-lg font-semibold text-white">27°C</p>
              <p className="text-xs text-white/45">Partly Cloudy</p>
            </div>
          </div>

          <TelemetryGrid telemetry={telemetry} sparklines={sparklines} />
        </div>
      </div>
    </section>
  )
}
