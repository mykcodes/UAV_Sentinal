import { AlertTriangle, Info } from 'lucide-react'

const SEVERITY_STYLES = {
  Medium: 'border-orange-500/20 bg-orange-500/10 text-orange-400',
  Low: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  High: 'border-red-500/20 bg-red-500/10 text-red-400',
}

export default function PredictiveAlerts({ alerts }) {
  return (
    <section
      className="glass-card card-hover animate-fade-slide-up flex h-full flex-col p-5"
      style={{ animationDelay: '350ms' }}
    >
      <h2 className="mb-4 text-base font-semibold text-white">Predictive Alerts</h2>

      <div className="flex-1 space-y-3">
        {alerts.map((alert, i) => {
          const Icon = alert.type === 'warning' ? AlertTriangle : Info
          const iconColor = alert.type === 'warning' ? 'text-orange-400' : 'text-blue-400'

          return (
            <button
              key={alert.id}
              type="button"
              className="animate-alert-in w-full rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition-colors hover:border-white/15 hover:bg-white/[0.04]"
              style={{ animationDelay: `${400 + i * 100}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-white">{alert.title}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${SEVERITY_STYLES[alert.severity]}`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-white/45">{alert.description}</p>
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-white/35">
                  {alert.estimate}
                </span>
              </div>
            </button>
          )
        })}
      </div>

    </section>
  )
}
