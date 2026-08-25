import { CheckCircle2, TrendingUp } from 'lucide-react'

function BrainVisual() {
  return (
    <div className="relative flex h-full min-h-[180px] items-center justify-center">
      <div className="animate-ai-glow absolute h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />
      <svg
        viewBox="0 0 120 120"
        className="relative h-28 w-28 text-blue-400 sm:h-32 sm:w-32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M60 15 C40 15 30 30 28 45 C20 48 15 58 18 68 C15 78 22 88 32 90 C35 102 48 108 60 105 C72 108 85 102 88 90 C98 88 105 78 102 68 C105 58 100 48 92 45 C90 30 80 15 60 15Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="rgba(59,130,246,0.08)"
        />
        <circle cx="45" cy="55" r="4" fill="currentColor" opacity="0.6" />
        <circle cx="75" cy="55" r="4" fill="currentColor" opacity="0.6" />
        <circle cx="60" cy="72" r="3" fill="currentColor" opacity="0.4" />
        <path
          d="M35 65 C45 75 55 78 60 78 C65 78 75 75 85 65"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={30 + i * 15}
            y1={20}
            x2={35 + i * 12}
            y2={35}
            stroke="currentColor"
            strokeWidth="0.8"
            opacity="0.3"
          />
        ))}
      </svg>
    </div>
  )
}

export default function AIInsights({ efficiencyScore, trend }) {
  return (
    <section
      className="glass-card card-hover animate-fade-slide-up relative overflow-hidden p-5 sm:p-6"
      style={{ animationDelay: '250ms' }}
    >
      <div className="pointer-events-none absolute -right-8 top-0 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white sm:text-lg">AI / ML Insights</h2>
        <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-blue-400">
          AI-Powered Predictive Maintenance
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div className="mb-4 flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
            <div>
              <p className="text-sm font-medium text-white/90">
                All systems performing within normal parameters.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-white/50">
                <li>Engine efficiency optimal.</li>
                <li>No anomalies detected.</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-white/35">
                  Efficiency Score
                </p>
                <p className="font-mono text-3xl font-semibold text-blue-400">
                  {efficiencyScore}%
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm text-green-400">
                <TrendingUp className="h-4 w-4" />
                <span className="font-mono">{trend}</span>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000 ease-out"
                style={{ width: `${efficiencyScore}%` }}
              />
            </div>
          </div>
        </div>

        <BrainVisual />
      </div>
    </section>
  )
}
