// =============================================
// InputHandler — Keyboard Input Manager
// =============================================

export function createInputHandler() {
  const keys = {};
  let initialized = false;
  let refuelRequested = false;

  function onKeyDown(e) {
    // Intercept Ctrl+F for refuel shortcut
    if (e.ctrlKey && e.code === 'KeyF') {
      e.preventDefault();
      refuelRequested = true;
      return;
    }

    keys[e.code] = true;

    // Prevent arrow keys from scrolling the page
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    keys[e.code] = false;
  }

  function init() {
    if (initialized) return;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    initialized = true;
  }

  function destroy() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    initialized = false;
  }

  function isPressed(code) {
    return !!keys[code];
  }

  /**
   * Returns normalized input values for the physics engine.
   * All values smoothly mapped to [-1, 1] or [0, 1] ranges.
   */
  function getInputs() {
    // ---- Keyboard Inputs ----
    // Throttle: W increases, S decreases (returned as delta direction)
    const throttleUp = isPressed('KeyW') ? 1 : 0;
    const throttleDown = isPressed('KeyS') ? 1 : 0;

    // Roll: A left, D right
    const rollLeft = isPressed('KeyD') ? 1 : 0;
    const rollRight = isPressed('KeyA') ? 1 : 0;

    // Pitch: ArrowUp = pitch up (nose up), ArrowDown = pitch down
    const pitchUp = isPressed('ArrowUp') ? 1 : 0;
    const pitchDown = isPressed('ArrowDown') ? 1 : 0;

    // Brake
    const brake = isPressed('Space');

    const refuel = refuelRequested;
    refuelRequested = false; // Reset after reading

    // ---- Gamepad Inputs ----
    let gpThrottleDelta = 0;
    let gpRoll = 0;
    let gpPitch = 0;
    let gpBrake = false;
    let gpRefuel = false;

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp) {
        const deadzone = 0.15;
        
        // Roll: Left Stick X (Axis 0) - Inverted: stick left (-1) = roll left (+1) to fix steering
        if (gp.axes[0] !== undefined && Math.abs(gp.axes[0]) > deadzone) {
          gpRoll = -gp.axes[0];
        }
        
        // Pitch: Left Stick Y (Axis 1) - Inverted: stick up (-1) = pitch up (+1)
        if (gp.axes[1] !== undefined && Math.abs(gp.axes[1]) > deadzone) {
          gpPitch = -gp.axes[1];
        }

        // Throttle Delta: Right Stick Y (Axis 3) - Inverted: stick up (-1) = throttle up (+1)
        if (gp.axes[3] !== undefined && Math.abs(gp.axes[3]) > deadzone) {
          gpThrottleDelta = -gp.axes[3];
        }

        // Alternative Throttle: Right Trigger (Button 7) and Left Trigger (Button 6)
        if (gp.buttons[7] && gp.buttons[7].pressed) {
          gpThrottleDelta += gp.buttons[7].value !== undefined ? gp.buttons[7].value : 1;
        }
        if (gp.buttons[6] && gp.buttons[6].pressed) {
          gpThrottleDelta -= gp.buttons[6].value !== undefined ? gp.buttons[6].value : 1;
        }

        // Brake: Button 0 (A / Cross)
        if (gp.buttons[0] && gp.buttons[0].pressed) {
          gpBrake = true;
        }

        // Refuel: Button 9 (Start / Options) or Button 3 (Y / Triangle)
        if ((gp.buttons[9] && gp.buttons[9].pressed) || (gp.buttons[3] && gp.buttons[3].pressed)) {
          gpRefuel = true;
        }

        // Only read from the first active gamepad
        break;
      }
    }

    // ---- Merge Inputs ----
    // We add keyboard and gamepad inputs and clamp to [-1, 1]
    const finalThrottleDelta = Math.max(-1, Math.min(1, (throttleUp - throttleDown) + gpThrottleDelta));
    const finalRollInput = Math.max(-1, Math.min(1, (rollRight - rollLeft) + gpRoll));
    const finalPitchInput = Math.max(-1, Math.min(1, (pitchUp - pitchDown) + gpPitch));
    const finalBrake = brake || gpBrake;
    const finalRefuel = refuel || gpRefuel;

    return {
      throttleDelta: finalThrottleDelta,
      rollInput: finalRollInput,
      pitchInput: finalPitchInput,
      brake: finalBrake,
      refuel: finalRefuel,
    };
  }

  // ---- Haptic Feedback ----
  let crashVibrationPlayed = false;
  let lastThrottleRumbleTime = 0;

  function updateHaptics(state) {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let activeGp = null;
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        activeGp = gamepads[i];
        break;
      }
    }

    // Safely exit if no gamepad or if browser doesn't support vibrationActuator
    if (!activeGp || !activeGp.vibrationActuator) return;

    if (state.isCrashed) {
      if (!crashVibrationPlayed) {
        // Impact pulse
        activeGp.vibrationActuator.playEffect("dual-rumble", {
          startDelay: 0,
          duration: 350,
          weakMagnitude: 1.0,
          strongMagnitude: 1.0
        }).catch(() => {}); // Catch promise rejection on unsupported controllers
        crashVibrationPlayed = true;
      }
    } else {
      crashVibrationPlayed = false;

      // High throttle vibration
      if (state.throttle > 50) {
        const now = performance.now();
        // Play effect every 100ms for continuous feel without overlapping aggressively
        if (now - lastThrottleRumbleTime > 100) {
          const magnitude = ((state.throttle - 50) / 50) * 0.4; // 0.0 to 0.4
          activeGp.vibrationActuator.playEffect("dual-rumble", {
            startDelay: 0,
            duration: 150,
            weakMagnitude: magnitude,
            strongMagnitude: magnitude * 0.2
          }).catch(() => {});
          lastThrottleRumbleTime = now;
        }
      }
    }
  }

  return {
    init,
    destroy,
    isPressed,
    getInputs,
    updateHaptics,
  };
}
