// =============================================
// FlightPhysics — Simple Flight Physics Engine
// =============================================
// Updates SimState based on input and current state.
// Ground mode ↔ Airborne mode with natural transitions.

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * Math.min(t, 1);
}

// ---- Physics Constants ----
const PHYS = {
  GRAVITY: 9.81,             // m/s²

  // Throttle
  THROTTLE_RATE: 35,         // percent/sec when holding W/S
  THROTTLE_MIN: 0,
  THROTTLE_MAX: 100,

  // Ground
  GROUND_ACCEL: 12,          // m/s² at full throttle on ground
  GROUND_FRICTION: 2.5,      // m/s² base friction
  GROUND_BRAKE: 18,          // m/s² braking deceleration
  GROUND_STEER_RATE: 0.8,    // rad/s steering rate at low speed
  GROUND_Y: 0.0,             // ground level Y

  // Takeoff
  TAKEOFF_SPEED: 33,         // m/s (~120 km/h)
  TAKEOFF_PITCH_THRESHOLD: 0.05, // radians — minimum pitch to lift off

  // Air
  THRUST_FORCE: 16,          // m/s² at full throttle
  DRAG_COEFF: 0.015,         // quadratic drag coefficient
  PARASITIC_DRAG: 0.8,       // m/s² constant drag
  LIFT_FACTOR: 1.2,          // vertical speed from pitch * speed

  // Rotation rates
  PITCH_RATE: 0.8,           // rad/s pitch change rate
  ROLL_RATE: 1.5,            // rad/s roll change rate
  ROLL_RETURN_RATE: 2.0,     // rad/s roll centering when no input
  PITCH_RETURN_RATE: 0.6,    // rad/s pitch centering when no input
  MAX_PITCH: 0.6,            // radians (~34°)
  MAX_ROLL: 0.8,             // radians (~46°)

  // Turn from roll
  ROLL_YAW_FACTOR: 0.6,      // how much roll affects yaw rate

  // Ground-mode pitch (limited on ground)
  GROUND_PITCH_RATE: 0.5,
  GROUND_MAX_PITCH: 0.15,    // limited nose-up on ground

  // Speed conversion
  MS_TO_KMH: 3.6,
  KMH_TO_MS: 1 / 3.6,

  // Max speed
  MAX_SPEED: 80,             // m/s (~288 km/h)

  // Landing
  LANDING_VERTICAL_THRESHOLD: -0.5, // m/s — gentle enough to land
  LANDING_BOUNCE_DAMPING: 0.3,
};

/**
 * Update flight physics for one frame.
 * @param {Object} state - SimState
 * @param {Object} inputs - from InputHandler.getInputs()
 * @param {number} dt - delta time in seconds
 * @param {number} elapsed - total elapsed time
 */
export function updatePhysics(state, inputs, dt, elapsed) {
  // ---- 1. Throttle ----
  if (inputs.throttleDelta !== 0) {
    state.throttle += inputs.throttleDelta * PHYS.THROTTLE_RATE * dt;
    state.throttle = clamp(state.throttle, PHYS.THROTTLE_MIN, PHYS.THROTTLE_MAX);
  }
  state.inputThrottle = state.throttle / 100;

  // Track engine start time
  if (state.throttle > 0 && state.engineStartTime < 0) {
    state.engineStartTime = elapsed;
  }

  // Flight time
  if (state.engineStartTime >= 0) {
    state.flightTime = elapsed - state.engineStartTime;
  }

  const throttle01 = state.throttle / 100;

  // ---- 2. Determine flight phase ----
  if (state.isCrashed) {
    // If crashed, just slide to a halt
    state.forwardSpeed = lerp(state.forwardSpeed, 0, 2 * dt);
    const sinYaw = Math.sin(state.yaw);
    const cosYaw = Math.cos(state.yaw);
    state.posX -= sinYaw * state.forwardSpeed * dt;
    state.posZ -= cosYaw * state.forwardSpeed * dt;
    state.speed = state.forwardSpeed * PHYS.MS_TO_KMH;
    state.status = 'CRASH / GROUND CONTACT';
  } else if (state.isOnGround) {
    updateGround(state, inputs, dt, throttle01);
  } else {
    updateAirborne(state, inputs, dt, throttle01);
  }

  // ---- 3. Common updates ----
  if (!state.isCrashed) {
    // Speed in km/h
    state.speed = state.forwardSpeed * PHYS.MS_TO_KMH;

    // Altitude
    state.altitude = Math.max(0, state.posY);

    // Air Pressure (Standard Atmosphere: P0=101.325 kPa, L=0.0065 K/m, T0=288.15 K)
    // P = P0 * (1 - L*h/T0)^5.25588
    state.airPressure = 101.325 * Math.pow(Math.max(0, 1 - 0.0065 * state.altitude / 288.15), 5.25588);

    // Heading in degrees (0-360)
    state.heading = ((state.yaw * 180 / Math.PI) % 360 + 360) % 360;

    // Status update (overridden in main.js for fuel alerts)
    if (state.isOnGround) {
      if (state.forwardSpeed < 0.5) {
        state.status = state.throttle > 0 ? 'IDLE' : 'IDLE';
      } else if (state.forwardSpeed > PHYS.TAKEOFF_SPEED * 0.7) {
        state.status = 'TAKEOFF';
      } else {
        state.status = 'TAXIING';
      }
    } else {
      if (state.verticalSpeed < -2) {
        state.status = 'DESCENDING';
      } else if (state.verticalSpeed > 2) {
        state.status = 'CLIMBING';
      } else {
        state.status = 'AIRBORNE';
      }
    }
  }

  // Distance (accumulate in km)
  state.distance += state.forwardSpeed * dt / 1000;

  // GPS drift based on actual position
  state.lat = 28.6139 + state.posZ * 0.00001;
  state.lon = 77.2090 + state.posX * 0.00001;

  // Battery drain (very slow)
  if (state.throttle > 0) {
    state.battery = Math.max(0, state.battery - 0.003 * dt * throttle01);
  }
}

function updateGround(state, inputs, dt, throttle01) {
  // ---- Pitch (limited on ground) ----
  if (inputs.pitchInput !== 0) {
    state.pitch += inputs.pitchInput * PHYS.GROUND_PITCH_RATE * dt;
    state.pitch = clamp(state.pitch, -0.05, PHYS.GROUND_MAX_PITCH);
  } else {
    // Return pitch to zero on ground
    state.pitch = lerp(state.pitch, 0, PHYS.PITCH_RETURN_RATE * dt);
  }
  state.inputPitch = inputs.pitchInput;

  // ---- Roll (no roll on ground, return to zero) ----
  state.roll = lerp(state.roll, 0, 5 * dt);
  state.inputRoll = inputs.rollInput;

  // ---- Steering (yaw) on ground ----
  if (state.forwardSpeed > 0.5) {
    const steerFactor = Math.min(state.forwardSpeed / 10, 1); // more responsive at speed
    state.yaw += inputs.rollInput * PHYS.GROUND_STEER_RATE * steerFactor * dt;
  }

  // ---- Forward acceleration ----
  // Degrade acceleration if engine is struggling (e.g. low fuel)
  const perfFactor = (state.engine.performanceFactor !== undefined) ? state.engine.performanceFactor : 1.0;
  let accel = throttle01 * PHYS.GROUND_ACCEL * perfFactor;

  // Friction
  if (state.forwardSpeed > 0.1) {
    accel -= PHYS.GROUND_FRICTION;
  }

  // Braking
  if (inputs.brake && state.forwardSpeed > 0.1) {
    accel -= PHYS.GROUND_BRAKE;
    state.isBraking = true;
  } else {
    state.isBraking = false;
  }

  // Update forward speed
  state.forwardSpeed += accel * dt;
  state.forwardSpeed = clamp(state.forwardSpeed, 0, PHYS.MAX_SPEED);

  // Prevent negative speed (no reverse)
  if (state.forwardSpeed < 0) state.forwardSpeed = 0;

  // ---- Position update ----
  const sinYaw = Math.sin(state.yaw);
  const cosYaw = Math.cos(state.yaw);

  state.velocityX = -sinYaw * state.forwardSpeed;
  state.velocityZ = -cosYaw * state.forwardSpeed;
  state.velocityY = 0;

  state.posX += state.velocityX * dt;
  state.posZ += state.velocityZ * dt;
  state.posY = PHYS.GROUND_Y; // Pinned to ground
  state.verticalSpeed = 0;

  // ---- Takeoff check ----
  if (state.forwardSpeed >= PHYS.TAKEOFF_SPEED && state.pitch > PHYS.TAKEOFF_PITCH_THRESHOLD) {
    state.isOnGround = false;
    state.isAirborne = true;
    // Give a small initial climb rate
    state.velocityY = state.forwardSpeed * Math.sin(state.pitch) * 0.5;
  }
}

function updateAirborne(state, inputs, dt, throttle01) {
  // ---- Pitch ----
  if (inputs.pitchInput !== 0) {
    state.pitch += inputs.pitchInput * PHYS.PITCH_RATE * dt;
    state.pitch = clamp(state.pitch, -PHYS.MAX_PITCH, PHYS.MAX_PITCH);
  } else {
    // Slowly return pitch toward zero
    state.pitch = lerp(state.pitch, 0, PHYS.PITCH_RETURN_RATE * dt);
  }
  state.inputPitch = inputs.pitchInput;

  // ---- Roll ----
  if (inputs.rollInput !== 0) {
    state.roll += inputs.rollInput * PHYS.ROLL_RATE * dt;
    state.roll = clamp(state.roll, -PHYS.MAX_ROLL, PHYS.MAX_ROLL);
  } else {
    // Return roll toward zero
    state.roll = lerp(state.roll, 0, PHYS.ROLL_RETURN_RATE * dt);
  }
  state.inputRoll = inputs.rollInput;

  // ---- Yaw from roll (banked turn) ----
  state.yaw += state.roll * PHYS.ROLL_YAW_FACTOR * dt;

  // ---- Thrust ----
  // Thrust is affected by engine performance (which drops on low fuel)
  const perfFactor = (state.engine.performanceFactor !== undefined) ? state.engine.performanceFactor : 1.0;
  const thrust = throttle01 * PHYS.THRUST_FORCE * perfFactor;

  // ---- Drag (quadratic) ----
  const drag = PHYS.DRAG_COEFF * state.forwardSpeed * state.forwardSpeed + PHYS.PARASITIC_DRAG;

  // ---- Forward speed update ----
  const netAccel = thrust - drag;
  state.forwardSpeed += netAccel * dt;
  state.forwardSpeed = clamp(state.forwardSpeed, 0, PHYS.MAX_SPEED);

  // ---- Vertical speed from pitch ----
  const liftVertical = state.pitch * state.forwardSpeed * PHYS.LIFT_FACTOR;
  // Gravity always pulls down
  state.velocityY = liftVertical - PHYS.GRAVITY * dt * 0.3;

  // Smooth the vertical speed
  state.verticalSpeed = lerp(state.verticalSpeed, state.velocityY, 3 * dt);

  // ---- Position update ----
  const sinYaw = Math.sin(state.yaw);
  const cosYaw = Math.cos(state.yaw);

  state.velocityX = -sinYaw * state.forwardSpeed;
  state.velocityZ = -cosYaw * state.forwardSpeed;

  state.posX += state.velocityX * dt;
  state.posZ += state.velocityZ * dt;
  state.posY += state.verticalSpeed * dt;

  // ---- Landing check ----
  if (state.posY <= PHYS.GROUND_Y) {
    state.posY = PHYS.GROUND_Y;
    state.verticalSpeed = 0;
    state.velocityY = 0;

    // Check for crash (hard landing or low forward speed)
    if (state.verticalSpeed < -4 || (state.pitch < -0.1 && state.forwardSpeed > 20)) {
       state.isCrashed = true;
       state.throttle = 0;
       state.engine.isRunning = false;
       state.status = 'CRASH / GROUND CONTACT';
    } else {
       state.isOnGround = true;
       state.isAirborne = false;
       state.status = 'LANDED';
    }

    // Dampen pitch on landing
    state.pitch *= PHYS.LANDING_BOUNCE_DAMPING;
    state.roll *= PHYS.LANDING_BOUNCE_DAMPING;
  }

  // ---- Stall behavior (if speed too low while airborne) ----
  if (state.forwardSpeed < PHYS.TAKEOFF_SPEED * 0.5 && state.posY > PHYS.GROUND_Y + 1) {
    // Nose drops in a stall
    state.pitch = lerp(state.pitch, -0.3, 1.5 * dt);
  }
}
