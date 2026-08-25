// =============================================
// EngineModel — Aero-Piston Engine Simulation
// =============================================
// Simulates engine parameters based on throttle input.
// All values are written to SimState.engine each frame.

// ---- Engine Constants ----
const ENGINE = {
  RPM_MIN: 0,
  RPM_IDLE: 900,
  RPM_MAX: 5000,
  RPM_SPOOL_UP: 2800,    // RPM/sec spool-up rate
  RPM_SPOOL_DOWN: 2200,  // RPM/sec spool-down rate

  // CHT (Cylinder Head Temperature)
  CHT_AMBIENT: 85,       // °C at rest
  CHT_MAX: 220,          // °C at max RPM
  CHT_RISE_RATE: 8,      // °C/sec (slow thermal mass)
  CHT_COOL_RATE: 4,      // °C/sec cooling rate

  // EGT (Exhaust Gas Temperature)
  EGT_AMBIENT: 250,      // °C at idle
  EGT_MAX: 750,          // °C at max RPM
  EGT_RISE_RATE: 40,     // °C/sec (fast response)
  EGT_COOL_RATE: 25,     // °C/sec

  // Oil
  OIL_PRESS_MIN: 0,      // psi at rest
  OIL_PRESS_IDLE: 30,    // psi at idle
  OIL_PRESS_MAX: 75,     // psi at max RPM
  OIL_TEMP_AMBIENT: 40,  // °C
  OIL_TEMP_MAX: 120,     // °C
  OIL_TEMP_RATE: 3,      // °C/sec

  // Fuel flow
  FUEL_IDLE: 5,           // L/hr at idle
  FUEL_MAX: 45,           // L/hr at max RPM

  // Vibration
  VIB_IDLE: 5,
  VIB_MAX: 35,
  VIB_HIGH_RPM_BONUS: 20, // extra vibration near redline
  VIB_HIGH_RPM_THRESHOLD: 4200,
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Update engine parameters based on current throttle.
 * @param {Object} state - SimState object
 * @param {number} dt - delta time in seconds
 */
export function updateEngine(state, dt) {
  const throttle01 = state.throttle / 100; // 0–1
  const eng = state.engine;

  // ---- 1. Fuel State & Performance Degradation ----
  eng.isFuelStarved = (state.fuel <= 0);

  if (eng.isFuelStarved) {
    eng.performanceFactor = 0.0;
  } else if (state.fuel > 30) {
    eng.performanceFactor = 1.0;
  } else if (state.fuel > 20) {
    eng.performanceFactor = 1.0; // Warning only
  } else if (state.fuel > 10) {
    eng.performanceFactor = lerp(0.8, 1.0, (state.fuel - 10) / 10);
  } else {
    eng.performanceFactor = lerp(0.2, 0.8, state.fuel / 10);
  }

  // ---- 2. Determine if running ----
  // Runs if there's throttle AND fuel AND not crashed
  eng.isRunning = state.throttle > 0 && !eng.isFuelStarved && !state.isCrashed;

  // ---- 3. Spool up/down based on state ----
  let targetRPM = 0;
  let targetFuel = 0;

  if (eng.isRunning) {
    targetRPM = (ENGINE.RPM_IDLE + (ENGINE.RPM_MAX - ENGINE.RPM_IDLE) * throttle01) * eng.performanceFactor;
    targetFuel = (ENGINE.FUEL_IDLE + (ENGINE.FUEL_MAX - ENGINE.FUEL_IDLE) * throttle01) * eng.performanceFactor;
  }

  // Update RPM
  if (eng.rpm < targetRPM) {
    eng.rpm = Math.min(targetRPM, eng.rpm + ENGINE.RPM_SPOOL_UP * dt);
  } else {
    eng.rpm = Math.max(targetRPM, eng.rpm - ENGINE.RPM_SPOOL_DOWN * dt);
  }
  eng.rpm = clamp(eng.rpm, 0, ENGINE.RPM_MAX);

  // Update Fuel Flow
  if (eng.isRunning) {
    eng.fuelFlow = lerp(eng.fuelFlow, targetFuel, 5 * dt);
  } else {
    eng.fuelFlow = 0; // Immediate shutoff of fuel injection if not running
  }
  eng.fuelFlow = clamp(eng.fuelFlow, 0, ENGINE.FUEL_MAX);

  // ---- 4. Drain Fuel Tank ----
  if (eng.fuelFlow > 0) {
    const flowRatio = eng.fuelFlow / ENGINE.FUEL_MAX;
    const drainRatePercentPerSec = 0.33 * flowRatio; 
    state.fuel = Math.max(0, state.fuel - drainRatePercentPerSec * dt);
  }

  // ---- 5. Thermal & Vibration ----
  // We use actual current RPM so these gradually drop as engine spools down
  const rpmRatio = (eng.rpm - ENGINE.RPM_IDLE) / (ENGINE.RPM_MAX - ENGINE.RPM_IDLE);
  const rpmRatioClamped = clamp(rpmRatio, 0, 1);

  // CHT
  const targetCHT = eng.rpm > 10 ? (ENGINE.CHT_AMBIENT + (ENGINE.CHT_MAX - ENGINE.CHT_AMBIENT) * rpmRatioClamped) : ENGINE.CHT_AMBIENT;
  const chtRate = (targetCHT > eng.cht) ? ENGINE.CHT_RISE_RATE : ENGINE.CHT_COOL_RATE;
  eng.cht = lerp(eng.cht, targetCHT, chtRate * dt * 0.02);
  eng.cht = clamp(eng.cht, ENGINE.CHT_AMBIENT, ENGINE.CHT_MAX);

  // EGT
  const targetEGT = eng.rpm > 10 ? (ENGINE.EGT_AMBIENT + (ENGINE.EGT_MAX - ENGINE.EGT_AMBIENT) * rpmRatioClamped) : 200;
  const egtRate = (targetEGT > eng.egt) ? ENGINE.EGT_RISE_RATE : ENGINE.EGT_COOL_RATE;
  eng.egt = lerp(eng.egt, targetEGT, egtRate * dt * 0.05);
  eng.egt = clamp(eng.egt, 200, ENGINE.EGT_MAX);

  // Oil Pressure
  const targetOilPress = eng.rpm > 10 ? (ENGINE.OIL_PRESS_IDLE + (ENGINE.OIL_PRESS_MAX - ENGINE.OIL_PRESS_IDLE) * rpmRatioClamped) : 0;
  eng.oilPressure = lerp(eng.oilPressure, targetOilPress, 3 * dt);
  eng.oilPressure = clamp(eng.oilPressure, 0, ENGINE.OIL_PRESS_MAX);

  // Oil Temp
  const targetOilTemp = eng.rpm > 10 ? (ENGINE.OIL_TEMP_AMBIENT + (ENGINE.OIL_TEMP_MAX - ENGINE.OIL_TEMP_AMBIENT) * rpmRatioClamped * 0.8) : ENGINE.OIL_TEMP_AMBIENT;
  eng.oilTemp = lerp(eng.oilTemp, targetOilTemp, ENGINE.OIL_TEMP_RATE * dt * 0.015);
  eng.oilTemp = clamp(eng.oilTemp, ENGINE.OIL_TEMP_AMBIENT, ENGINE.OIL_TEMP_MAX);

  // Vibration
  if (eng.rpm < 10) {
    eng.vibration = Math.max(0, eng.vibration - 20 * dt);
  } else {
    let targetVib = ENGINE.VIB_IDLE + (ENGINE.VIB_MAX - ENGINE.VIB_IDLE) * rpmRatioClamped;
    if (eng.rpm > ENGINE.VIB_HIGH_RPM_THRESHOLD) {
      const overRatio = (eng.rpm - ENGINE.VIB_HIGH_RPM_THRESHOLD) / (ENGINE.RPM_MAX - ENGINE.VIB_HIGH_RPM_THRESHOLD);
      targetVib += ENGINE.VIB_HIGH_RPM_BONUS * overRatio;
    }
    targetVib += (Math.random() - 0.5) * 3;
    eng.vibration = lerp(eng.vibration, targetVib, 8 * dt);
  }
  eng.vibration = clamp(eng.vibration, 0, 100);
}
