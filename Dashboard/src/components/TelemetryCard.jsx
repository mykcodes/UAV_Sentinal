import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts'

export default function TelemetryCard({
  label,
  value,
  unit,
  color,
  icon: Icon,
  sparklineData,
  delay = 0,
}) {
  return (
    <div
      className="glass-card card-hover group relative overflow-hidden p-3 sm:p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-35"
        style={{ backgroundColor: color }}
      />
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" style={{ color }} />
          <span className="text-[11px] text-white/45">{label}</span>
        </div>
      </div>
      <div className="mb-2 flex items-baseline gap-1">
        <span className="font-mono text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {value}
        </span>
        <span className="text-xs text-white/35">{unit}</span>
      </div>
      <div className="h-8 w-full opacity-70">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData}>
            <Line
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
