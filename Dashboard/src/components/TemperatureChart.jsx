import { ChevronDown } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const TIME_RANGES = ['Last 15 Minutes', 'Last 30 Minutes', 'Last 1 Hour']

export default function TemperatureChart({ data, timeRange, onTimeRangeChange }) {
  return (
    <section
      className="glass-card card-hover animate-fade-slide-up p-5 sm:p-6"
      style={{ animationDelay: '200ms' }}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-white sm:text-lg">
          Engine Temperature Graphs
        </h2>
        <div className="relative">
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value)}
            className="appearance-none rounded-lg border border-white/10 bg-white/5 py-2 pl-3 pr-9 text-sm text-white/80 outline-none transition-colors hover:border-white/20 focus:border-blue-500/40"
          >
            {TIME_RANGES.map((range) => (
              <option key={range} value={range} className="bg-zinc-900">
                {range}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        </div>
      </div>

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            />
            <YAxis
              domain={[0, 1000]}
              ticks={[0, 250, 500, 750, 1000]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(10,10,10,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
            />
            <Line
              type="monotone"
              dataKey="cht"
              name="CHT"
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive
              animationDuration={800}
            />
            <Line
              type="monotone"
              dataKey="egt"
              name="EGT"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive
              animationDuration={800}
            />
            <Line
              type="monotone"
              dataKey="oilTemp"
              name="Oil Temp"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
