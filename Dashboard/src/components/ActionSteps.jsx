import { Check, Circle } from 'lucide-react'

const STATUS_STYLES = {
  'In Progress': 'text-orange-400',
  Pending: 'text-white/40',
  Complete: 'text-green-400',
}

const STATUS_CYCLE = ['Pending', 'In Progress', 'Complete']

export default function ActionSteps({ actions, onToggleAction }) {
  return (
    <section
      className="glass-card card-hover animate-fade-slide-up flex h-full flex-col p-5"
      style={{ animationDelay: '400ms' }}
    >
      <h2 className="mb-4 text-base font-semibold text-white">Action Steps</h2>

      <div className="flex-1 space-y-2">
        {actions.map((action) => {
          const isComplete = action.status === 'Complete'
          const isInProgress = action.status === 'In Progress'

          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onToggleAction(action.id)}
              className="flex w-full items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition-colors hover:border-white/15 hover:bg-white/[0.04]"
            >
              <span className="mt-0.5 shrink-0">
                {isComplete ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : isInProgress ? (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-orange-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                  </span>
                ) : (
                  <Circle className="h-4 w-4 text-white/25" />
                )}
              </span>
              <div className="flex-1">
                <p
                  className={`text-sm ${isComplete ? 'text-white/40 line-through' : 'text-white/85'}`}
                >
                  {action.label}
                </p>
                <p className={`mt-0.5 text-xs ${STATUS_STYLES[action.status]}`}>
                  Status: {action.status}
                </p>
              </div>
            </button>
          )
        })}
      </div>

    </section>
  )
}

export { STATUS_CYCLE }
