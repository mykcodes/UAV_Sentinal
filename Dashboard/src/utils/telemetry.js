export const TELEMETRY_CONFIG = {
  rpm: { label: 'RPM', unit: 'RPM', base: 4850, variance: 30, color: '#3b82f6', icon: 'Gauge' },
  cht: { label: 'Cylinder Head Temp', unit: '°C', base: 165, variance: 3, color: '#f97316', icon: 'Thermometer' },
  egt: { label: 'Exhaust Gas Temp', unit: '°C', base: 620, variance: 5, color: '#ef4444', icon: 'Flame' },
  oilPressure: { label: 'Oil Pressure', unit: 'psi', base: 68, variance: 2, color: '#22d3ee', icon: 'Droplets' },
  oilTemp: { label: 'Oil Temp', unit: '°C', base: 93, variance: 1, color: '#f97316', icon: 'ThermometerSun' },
  fuelFlow: { label: 'Fuel Flow', unit: 'L/hr', base: 12.4, variance: 0.3, color: '#22c55e', icon: 'Fuel' },
  // Mock sensor — replace with real fuel-level telemetry from API/sensors
  fuelLevel: {
    label: 'Fuel Level',
    unit: '%',
    base: 62,
    variance: 0.4,
    color: '#22c55e',
    icon: 'Fuel',
    showInGrid: false,
  },
}

/** Total fuel tank capacity in liters — replace with aircraft-specific value */
export const FUEL_TANK_CAPACITY_LITERS = 120

/** Max RPM for engine load calculation */
export const MAX_RPM = 6000

/** Reference max flight duration for endurance ring (hours) */
export const MAX_REFERENCE_FLIGHT_HOURS = 4

export function jitter(value, variance, decimals = 0) {
  const delta = (Math.random() - 0.5) * 2 * variance
  const next = value + delta
  return decimals > 0 ? parseFloat(next.toFixed(decimals)) : Math.round(next)
}

export function generateInitialGraphData() {
  const times = ['14:02', '14:08', '14:14', '14:20', '14:26', '14:32']
  const bases = { cht: 162, egt: 612, oilTemp: 91 }

  return times.map((time, i) => ({
    time,
    cht: bases.cht + Math.sin(i * 0.9) * 4 + (Math.random() - 0.5) * 3,
    egt: bases.egt + Math.cos(i * 0.7) * 8 + (Math.random() - 0.5) * 5,
    oilTemp: bases.oilTemp + Math.sin(i * 1.1) * 1.5 + (Math.random() - 0.5) * 0.8,
  }))
}

export function appendGraphPoint(data) {
  const last = data[data.length - 1]
  const [h, m] = last.time.split(':').map(Number)
  const nextMin = m + 6
  const nextH = h + Math.floor(nextMin / 60)
  const time = `${String(nextH).padStart(2, '0')}:${String(nextMin % 60).padStart(2, '0')}`

  const point = {
    time,
    cht: jitter(last.cht, 2, 1),
    egt: jitter(last.egt, 4, 1),
    oilTemp: jitter(last.oilTemp, 0.6, 1),
  }

  const next = [...data.slice(1), point]
  return next
}

export function generateSparkline(base, variance, points = 12) {
  return Array.from({ length: points }, (_, i) => ({
    v: base + Math.sin(i * 0.8) * variance * 0.5 + (Math.random() - 0.5) * variance * 0.3,
  }))
}

export function formatTelemetryValue(key, value) {
  if (key === 'fuelFlow') return value.toFixed(1)
  if (key === 'rpm') return value.toLocaleString()
  return String(Math.round(value))
}
