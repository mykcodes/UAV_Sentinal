import { useState, useEffect, useCallback, useMemo } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import UAVOverview from '../components/UAVOverview'
import TemperatureChart from '../components/TemperatureChart'
import AIInsights from '../components/AIInsights'
import MissionStatus from '../components/MissionStatus'
import PredictiveAlerts from '../components/PredictiveAlerts'
import ActionSteps, { STATUS_CYCLE } from '../components/ActionSteps'
import {
  TELEMETRY_CONFIG,
  jitter,
  generateInitialGraphData,
  appendGraphPoint,
  generateSparkline,
} from '../utils/telemetry'

function buildTelemetryState() {
  return Object.fromEntries(
    Object.entries(TELEMETRY_CONFIG).map(([key, cfg]) => [
      key,
      {
        label: cfg.label,
        unit: cfg.unit,
        value: cfg.base,
        color: cfg.color,
        icon: cfg.icon,
      },
    ]),
  )
}

function buildSparklines() {
  return Object.fromEntries(
    Object.entries(TELEMETRY_CONFIG).map(([key, cfg]) => [
      key,
      generateSparkline(cfg.base, cfg.variance),
    ]),
  )
}

const INITIAL_ALERTS = [
  {
    id: 1,
    type: 'warning',
    title: 'Oil Temperature Rising',
    severity: 'Medium',
    description: 'Oil temperature has been steadily increasing.',
    estimate: 'Est. in 45 min',
  },
  {
    id: 2,
    type: 'info',
    title: 'Maintenance Due Soon',
    severity: 'Low',
    description: 'Next scheduled maintenance in 12 flight hours.',
    estimate: 'Est. in 12 hrs',
  },
]

const INITIAL_ACTIONS = [
  { id: 1, label: 'Monitor oil temperature closely', status: 'In Progress' },
  { id: 2, label: 'Check fuel flow efficiency', status: 'Pending' },
  { id: 3, label: 'Run engine diagnostics', status: 'Pending' },
]

function formatEta(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState(buildTelemetryState)
  const [sparklines, setSparklines] = useState(buildSparklines)
  const [graphData, setGraphData] = useState(generateInitialGraphData)
  const [timeRange, setTimeRange] = useState('Last 30 Minutes')
  const [missionProgress, setMissionProgress] = useState(0)
  const [etaSeconds, setEtaSeconds] = useState(28 * 60 + 15)
  const [pilotName, setPilotName] = useState('Alex Morgan')
  const [alerts] = useState(INITIAL_ALERTS)
  const [actions, setActions] = useState(INITIAL_ACTIONS)
  const [currentTime, setCurrentTime] = useState(() => new Date('2024-05-12T14:32:08Z'))
  const [efficiencyScore] = useState(96)

  // Animate mission progress on mount
  useEffect(() => {
    const timer = setTimeout(() => setMissionProgress(72), 300)
    return () => clearTimeout(timer)
  }, [])

  // Live clock tick
  useEffect(() => {
    const tick = setInterval(() => {
      setCurrentTime((prev) => new Date(prev.getTime() + 1000))
      setEtaSeconds((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  // Telemetry updates every 2–4 seconds
  useEffect(() => {
    let timeoutId

    const update = () => {
      setTelemetry((prev) => {
        const next = { ...prev }
        Object.entries(TELEMETRY_CONFIG).forEach(([key, cfg]) => {
          const decimals = key === 'fuelFlow' ? 1 : 0
          next[key] = {
            ...next[key],
            value: jitter(prev[key].value, cfg.variance, decimals),
          }
        })
        return next
      })

      setSparklines((prev) => {
        const next = { ...prev }
        Object.entries(TELEMETRY_CONFIG).forEach(([key, cfg]) => {
          const history = [...prev[key].slice(1)]
          const lastVal = history[history.length - 1]?.v ?? cfg.base
          history.push({ v: jitter(lastVal, cfg.variance * 0.3, key === 'fuelFlow' ? 1 : 0) })
          next[key] = history
        })
        return next
      })

      setGraphData((prev) => appendGraphPoint(prev))

      const delay = 2000 + Math.random() * 2000
      timeoutId = setTimeout(update, delay)
    }

    timeoutId = setTimeout(update, 2500)
    return () => clearTimeout(timeoutId)
  }, [])

  const handleToggleAction = useCallback((id) => {
    setActions((prev) =>
      prev.map((action) => {
        if (action.id !== id) return action
        const idx = STATUS_CYCLE.indexOf(action.status)
        const nextStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
        return { ...action, status: nextStatus }
      }),
    )
  }, [])

  const eta = useMemo(() => formatEta(etaSeconds), [etaSeconds])

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.06),transparent_50%)]" />

      <div className="relative mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <DashboardHeader pilotName={pilotName} onPilotNameChange={setPilotName} />

        <div className="mt-6 space-y-5">
          <UAVOverview
            telemetry={telemetry}
            sparklines={sparklines}
            currentTime={currentTime}
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <TemperatureChart
                data={graphData}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
              />
            </div>
            <div className="lg:col-span-2">
              <AIInsights efficiencyScore={efficiencyScore} trend="↑ +4%" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            <MissionStatus progress={missionProgress} eta={eta} />
            <PredictiveAlerts alerts={alerts} />
            <ActionSteps actions={actions} onToggleAction={handleToggleAction} />
          </div>
        </div>
      </div>
    </div>
  )
}
