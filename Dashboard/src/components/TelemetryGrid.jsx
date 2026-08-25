import {
  Droplets,
  Flame,
  Fuel,
  Gauge,
  Thermometer,
  ThermometerSun,
} from 'lucide-react'
import TelemetryCard from './TelemetryCard'
import { formatTelemetryValue } from '../utils/telemetry'

const ICON_MAP = {
  Gauge,
  Thermometer,
  Flame,
  Droplets,
  ThermometerSun,
  Fuel,
}

export default function TelemetryGrid({ telemetry, sparklines }) {
  const metrics = [
    { key: 'rpm', ...telemetry.rpm },
    { key: 'cht', ...telemetry.cht },
    { key: 'egt', ...telemetry.egt },
    { key: 'oilPressure', ...telemetry.oilPressure },
    { key: 'oilTemp', ...telemetry.oilTemp },
    { key: 'fuelFlow', ...telemetry.fuelFlow },
  ]

  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/35">
        Key Numerical Readings
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {metrics.map((metric, i) => (
          <TelemetryCard
            key={metric.key}
            label={metric.label}
            value={formatTelemetryValue(metric.key, metric.value)}
            unit={metric.unit}
            color={metric.color}
            icon={ICON_MAP[metric.icon]}
            sparklineData={sparklines[metric.key]}
            delay={i * 80}
          />
        ))}
      </div>
    </div>
  )
}
