// =============================================
// SimState — Central Simulation State
// =============================================
// All telemetry values live here. The UI reads from this object.
// The physics engine and engine model write to it each frame.
// This object can be serialized to JSON for Digital Twin integration.

export function createSimState() {
  return {
    // ---- Flight State ----
    speed: 0,            // km/h — forward speed
    altitude: 0,         // m — height above ground
    heading: 0,          // degrees 0-360
    pitch: 0,            // radians — nose angle
    roll: 0,             // radians — bank angle
    throttle: 0,         // 0-100 percent
    verticalSpeed: 0,    // m/s — climb/descent rate

    // ---- Position (world coords) ----
    posX: 0,
    posY: 0,             // Y = altitude in world space
    posZ: 0,
    yaw: 0,              // radians — heading as rotation

    // ---- Velocity components ----
    velocityX: 0,
    velocityY: 0,
    velocityZ: 0,
    forwardSpeed: 0,     // m/s — scalar forward speed

    // ---- Engine Parameters ----
    engine: {
      rpm: 0,            // 0-5000
      cht: 85,           // °C — Cylinder Head Temperature (ambient start)
      egt: 250,          // °C — Exhaust Gas Temperature (ambient start)
      oilPressure: 0,    // psi
      oilTemp: 40,       // °C
      fuelFlow: 0,       // L/hr
      vibration: 0,      // arbitrary 0-100
      isRunning: false,
      performanceFactor: 1.0, // 0.0 to 1.0 based on fuel
      isFuelStarved: false,
    },

    // ---- Fuel ----
    fuel: 100,           // percent 0-100
    fuelCapacity: 50,    // liters (nominal)

    // ---- Environment ----
    airPressure: 101.3,  // kPa

    // ---- Flight Status ----
    isAirborne: false,
    isOnGround: true,
    isBraking: false,

    // ---- Meta ----
    battery: 100,        // percent
    distance: 0,         // km — total distance traveled
    flightTime: 0,       // seconds since engine first started
    engineStartTime: -1, // timestamp when engine first started (-1 = not started)
    lat: 28.6139,        // simulated GPS latitude
    lon: 77.2090,        // simulated GPS longitude
    status: 'IDLE',      // IDLE | TAXIING | TAKEOFF | AIRBORNE | LANDING | LANDED

    // ---- Input state (for UI display) ----
    inputThrottle: 0,    // raw throttle input 0-1
    inputPitch: 0,       // -1 to 1
    inputRoll: 0,        // -1 to 1
    inputBrake: false,
  };
}

/**
 * Returns a serializable telemetry snapshot for Digital Twin integration.
 */
export function getTelemetrySnapshot(state) {
  return {
    speed: state.speed,
    altitude: state.altitude,
    heading: state.heading,
    pitch: state.pitch,
    roll: state.roll,
    throttle: state.throttle,
    verticalSpeed: state.verticalSpeed,
    engineRPM: state.engine.rpm,
    fuel: state.fuel,
    fuelFlow: state.engine.fuelFlow,
    airPressure: state.airPressure,
    cht: state.engine.cht,
    egt: state.engine.egt,
    oilPressure: state.engine.oilPressure,
    oilTemperature: state.engine.oilTemp,
    fuelFlow: state.engine.fuelFlow,
    vibration: state.engine.vibration,
    battery: state.battery,
    latitude: state.lat,
    longitude: state.lon,
    flightTime: state.flightTime,
    distance: state.distance,
    status: state.status,
  };
}
