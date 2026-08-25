import { ChevronDown } from 'lucide-react'

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??'
}

export default function DashboardHeader({ pilotName, onPilotNameChange }) {
  const initials = getInitials(pilotName)

  return (
    <header className="animate-fade-slide-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="mb-1 flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Dashboard
          </h1>
          <span className="hidden rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-blue-400 sm:inline">
            Live Telemetry
          </span>
        </div>
        <p className="text-sm text-white/45">
          Live status and key metrics at a glance
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="glass-card flex items-center gap-3 px-4 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-pulse-online rounded-full bg-green-500/40" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-white/40">
              System Status
            </p>
            <p className="text-sm font-medium text-green-400">All Systems Normal</p>
          </div>
        </div>

        <div className="glass-card flex items-center gap-3 px-3 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600/40 to-blue-900/60 text-sm font-semibold text-blue-200 ring-1 ring-white/10">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-white/40">Pilot</p>
            <input
              type="text"
              value={pilotName}
              onChange={(e) => onPilotNameChange(e.target.value)}
              className="w-full min-w-[100px] max-w-[160px] truncate border-0 bg-transparent p-0 text-sm font-medium text-white outline-none ring-0 placeholder:text-white/40 focus:border-b focus:border-blue-500/50"
              placeholder="Enter pilot name"
              aria-label="Pilot name"
            />
          </div>
          <ChevronDown className="hidden h-4 w-4 shrink-0 text-white/40 sm:block" />
        </div>
      </div>
    </header>
  )
}
