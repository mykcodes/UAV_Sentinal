// =============================================
// UAV Flight Simulator — Main Orchestrator
// =============================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createSimState, getTelemetrySnapshot } from './SimState.js';
import { createInputHandler } from './InputHandler.js';
import { updateEngine } from './EngineModel.js';
import { updatePhysics } from './FlightPhysics.js';
import { buildEnvironment, updateEnvironment } from './Environment.js';

// ---- DOM Elements ----
const canvas = document.getElementById('uav-canvas');

// Telemetry elements
const elSpeed = document.getElementById('tel-speed');
const elAlt = document.getElementById('tel-altitude');
const elHeading = document.getElementById('tel-heading');
const elFuel = document.getElementById('tel-fuel');
const elFuelFill = document.getElementById('fuel-fill');
const elDistance = document.getElementById('tel-distance');
const elTime = document.getElementById('tel-time');
const elStatus = document.getElementById('tel-status');
const elPressure = document.getElementById('tel-pressure');
const elLat = document.getElementById('tel-lat');
const elLon = document.getElementById('tel-lon');
const compassNeedle = document.getElementById('compass-needle');
const gpsCanvas = document.getElementById('gps-canvas');
const gpsCtx = gpsCanvas ? gpsCanvas.getContext('2d') : null;

// Engine telemetry elements
const elRPM = document.getElementById('tel-rpm');
const elCHT = document.getElementById('tel-cht');
const elEGT = document.getElementById('tel-egt');
const elOilPress = document.getElementById('tel-oil-press');
const elOilTemp = document.getElementById('tel-oil-temp');
const elFuelFlow = document.getElementById('tel-fuel-flow');
const elVibration = document.getElementById('tel-vibration');
const elThrottle = document.getElementById('tel-throttle');
const elThrottleBar = document.getElementById('throttle-bar-fill');
const elThrottleBarBg = document.getElementById('throttle-bar-bg');
const elVertSpeed = document.getElementById('tel-vert-speed');

// Controls hint
const controlsHint = document.getElementById('controls-hint');

// ---- State ----
const simState = createSimState();
const inputHandler = createInputHandler();
inputHandler.init();

// ---- Throttle Mouse Interaction ----
let isDraggingThrottle = false;
let displayHeading = 0; // Accumulated heading for smooth compass rotation

if (elThrottleBarBg) {
  const updateThrottleFromMouse = (e) => {
    const rect = elThrottleBarBg.getBoundingClientRect();
    const y = e.clientY - rect.top;
    let pct = 100 - (y / rect.height) * 100;
    pct = Math.max(0, Math.min(100, pct));
    simState.throttle = pct;
  };

  elThrottleBarBg.addEventListener('mousedown', (e) => {
    isDraggingThrottle = true;
    updateThrottleFromMouse(e);
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingThrottle) {
      updateThrottleFromMouse(e);
    }
  });

  window.addEventListener('mouseup', () => {
    isDraggingThrottle = false;
  });
}

// ---- Renderer ----
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// ---- Scene ----
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xc8d6e5, 0.0008);

// ---- Camera ----
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 5000);

// ---- Orbit Camera State ----
const orbitCam = {
  theta: 0,
  phi: 0.3,
  radius: 22,
  minRadius: 6,
  maxRadius: 80,
  minPhi: -0.2,
  maxPhi: 1.35,
  panOffset: new THREE.Vector3(0, 0, 0),
  smoothTheta: 0,
  smoothPhi: 0.3,
  smoothRadius: 22,
  smoothPan: new THREE.Vector3(0, 0, 0),
  damping: 5,
};

const smoothCamPos = new THREE.Vector3();
const smoothLookAt = new THREE.Vector3();
let cameraInitialized = false;

// ---- Mouse Interaction ----
const mouse = {
  isLeftDown: false,
  isRightDown: false,
  prevX: 0,
  prevY: 0,
  orbitSensitivity: 0.004,
  panSensitivity: 0.02,
  zoomSensitivity: 1.5,
};

canvas.addEventListener('pointerdown', (e) => {
  if (e.button === 0) mouse.isLeftDown = true;
  if (e.button === 2) mouse.isRightDown = true;
  mouse.prevX = e.clientX;
  mouse.prevY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointerup', (e) => {
  if (e.button === 0) mouse.isLeftDown = false;
  if (e.button === 2) mouse.isRightDown = false;
  canvas.releasePointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  const dx = e.clientX - mouse.prevX;
  const dy = e.clientY - mouse.prevY;
  mouse.prevX = e.clientX;
  mouse.prevY = e.clientY;

  if (mouse.isLeftDown) {
    orbitCam.theta -= dx * mouse.orbitSensitivity;
    orbitCam.phi += dy * mouse.orbitSensitivity;
    orbitCam.phi = Math.max(orbitCam.minPhi, Math.min(orbitCam.maxPhi, orbitCam.phi));
  }

  if (mouse.isRightDown) {
    orbitCam.panOffset.y += dy * mouse.panSensitivity;
    orbitCam.panOffset.x -= dx * mouse.panSensitivity;
    orbitCam.panOffset.x = THREE.MathUtils.clamp(orbitCam.panOffset.x, -8, 8);
    orbitCam.panOffset.y = THREE.MathUtils.clamp(orbitCam.panOffset.y, -8, 8);
  }
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomDelta = e.deltaY > 0 ? 1 : -1;
  orbitCam.radius += zoomDelta * mouse.zoomSensitivity;
  orbitCam.radius = Math.max(orbitCam.minRadius, Math.min(orbitCam.maxRadius, orbitCam.radius));
}, { passive: false });

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// ---- Lighting ----
const ambient = new THREE.AmbientLight(0xc0d0e0, 0.5);
scene.add(ambient);

const hemi = new THREE.HemisphereLight(0x87CEEB, 0x556B2F, 0.6);
scene.add(hemi);

// Sun
const sun = new THREE.DirectionalLight(0xfff5e6, 1.8);
sun.position.set(60, 100, 40);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 600;
sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80;
sun.shadow.camera.bottom = -80;
sun.shadow.bias = -0.0003;
scene.add(sun);

// Fill light
const fill = new THREE.DirectionalLight(0xa0b0c0, 0.35);
fill.position.set(-40, 30, -50);
scene.add(fill);

// Rim light
const rim = new THREE.DirectionalLight(0xd0d8e0, 0.25);
rim.position.set(0, 40, -70);
scene.add(rim);

// ---- Build Environment ----
const env = buildEnvironment(scene);

// ---- Load UAV Model ----
let uavGroup = null;
let uavMixer = null;
let propellerParts = []; // meshes that look like propellers/rotors
let uavInnerModel = null;

const loader = new GLTFLoader();
loader.load(
  '/models/uav.glb',
  (gltf) => {
    const model = gltf.scene;

    // Measure and scale
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 14;
    const scale = targetSize / maxDim;
    model.scale.setScalar(scale);

    // Re-center
    const newBox = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    newBox.getCenter(center);
    model.position.sub(center);

    // Orient: nose along -Z (forward direction in our coordinate system)
    model.rotation.y = Math.PI / 2;

    // Move model up so it sits ON the ground (not sunk into it)
    const finalBox = new THREE.Box3().setFromObject(model);
    const bottomY = finalBox.min.y;
    model.position.y -= bottomY; // lift so bottom = 0

    // Traverse for materials and find propeller parts
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          const mat = child.material;
          mat.roughness = Math.max(mat.roughness || 0.5, 0.35);
          mat.envMapIntensity = 0.3;
        }

        // Detect propeller/rotor parts by name
        const name = (child.name || '').toLowerCase();
        if (name.includes('prop') || name.includes('rotor') || name.includes('blade') || name.includes('fan')) {
          propellerParts.push(child);
        }
      }
    });

    // Wrap in group for flight transforms
    uavGroup = new THREE.Group();
    uavGroup.add(model);
    uavInnerModel = model;

    // Position UAV at start of runway
    uavGroup.position.set(0, 0, 200); // start near one end of runway
    simState.posX = 0;
    simState.posY = 0;
    simState.posZ = 200;

    scene.add(uavGroup);

    // Sun follows UAV
    sun.target = uavGroup;
    scene.add(sun.target);

    // Play embedded animations if any
    if (gltf.animations && gltf.animations.length > 0) {
      uavMixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        uavMixer.clipAction(clip).play();
      });
    }

    // Initialize camera
    orbitCam.smoothTheta = orbitCam.theta;
    orbitCam.smoothPhi = orbitCam.phi;
    orbitCam.smoothRadius = orbitCam.radius;
    orbitCam.smoothPan.copy(orbitCam.panOffset);

    // Set initial camera position immediately
    const initAzimuth = orbitCam.smoothTheta + simState.yaw;
    const initCosPhi = Math.cos(orbitCam.smoothPhi);
    const initSinPhi = Math.sin(orbitCam.smoothPhi);
    smoothCamPos.set(
      uavGroup.position.x + orbitCam.smoothRadius * Math.sin(initAzimuth) * initCosPhi,
      uavGroup.position.y + orbitCam.smoothRadius * initSinPhi,
      uavGroup.position.z + orbitCam.smoothRadius * Math.cos(initAzimuth) * initCosPhi
    );
    smoothLookAt.copy(uavGroup.position);
    cameraInitialized = true;

    console.log('UAV model loaded. Propeller parts found:', propellerParts.length);

    // Dismiss controls hint after delay
    if (controlsHint) {
      setTimeout(() => {
        controlsHint.classList.add('fade-out');
      }, 8000);
    }
  },
  (progress) => {
    if (progress.total > 0) {
      const pct = Math.round((progress.loaded / progress.total) * 100);
      console.log('Loading UAV:', pct + '%');
    }
  },
  (err) => {
    console.error('Failed to load UAV model:', err);
  }
);

// ---- Clock ----
const clock = new THREE.Clock();

// ---- GPS trail history ----
const gpsTrail = [];
const MAX_TRAIL_POINTS = 300;

// ---- Animation Loop ----
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  // ---- Get inputs ----
  const inputs = inputHandler.getInputs();

  // ---- Handle Refuel Shortcut ----
  if (inputs.refuel) {
    simState.fuel = 100;
    simState.engine.isFuelStarved = false;
    // Optionally recover from crash if on ground (for demo convenience)
    if (simState.isCrashed && simState.isOnGround) {
      simState.isCrashed = false;
      simState.status = 'IDLE';
    }
  }

  // ---- Update engine ----
  updateEngine(simState, delta);

  // ---- Update physics ----
  updatePhysics(simState, inputs, delta, elapsed);

  // ---- Update Haptics ----
  if (inputHandler.updateHaptics) {
    inputHandler.updateHaptics(simState);
  }

  // ---- Update UAV 3D transforms ----
  if (uavGroup) {
    uavGroup.position.set(simState.posX, simState.posY, simState.posZ);

    // Apply rotations: yaw → pitch → roll
    uavGroup.rotation.set(0, 0, 0);
    uavGroup.rotateY(simState.yaw);
    uavGroup.rotateX(simState.pitch);
    uavGroup.rotateZ(simState.roll);

    // ---- Propeller rotation based on RPM ----
    if (propellerParts.length > 0) {
      const propSpeed = (simState.engine.rpm / 5000) * 80 * delta;
      propellerParts.forEach((prop) => {
        prop.rotation.z += propSpeed;
      });
    }

    // ---- Update camera ----
    updateCamera(delta);

    // ---- Move sun with UAV ----
    sun.position.set(
      simState.posX + 60,
      simState.posY + 100,
      simState.posZ + 40
    );

    // ---- Update shadow camera to follow UAV ----
    sun.shadow.camera.updateProjectionMatrix();
  }

  // ---- Update mixer ----
  if (uavMixer) uavMixer.update(delta);

  // ---- Update environment ----
  updateEnvironment(env, simState, delta, elapsed);

  // ---- Update telemetry UI (~10 fps) ----
  if (Math.floor(elapsed * 10) !== Math.floor((elapsed - delta) * 10)) {
    updateTelemetryUI();
    // Add GPS trail point
    if (gpsTrail.length >= MAX_TRAIL_POINTS) gpsTrail.shift();
    gpsTrail.push({ x: simState.posX, z: simState.posZ });
  }

  // ---- Render ----
  renderer.render(scene, camera);
}

function updateCamera(dt) {
  // Smooth orbit parameters
  const dampFactor = 1.0 - Math.exp(-orbitCam.damping * dt);
  orbitCam.smoothTheta += (orbitCam.theta - orbitCam.smoothTheta) * dampFactor;
  orbitCam.smoothPhi += (orbitCam.phi - orbitCam.smoothPhi) * dampFactor;
  orbitCam.smoothRadius += (orbitCam.radius - orbitCam.smoothRadius) * dampFactor;
  orbitCam.smoothPan.lerp(orbitCam.panOffset, dampFactor);

  // Camera position in spherical coords relative to UAV
  const totalAzimuth = orbitCam.smoothTheta + simState.yaw;
  const cosPhi = Math.cos(orbitCam.smoothPhi);
  const sinPhi = Math.sin(orbitCam.smoothPhi);

  const camOffX = orbitCam.smoothRadius * Math.sin(totalAzimuth) * cosPhi;
  const camOffY = orbitCam.smoothRadius * sinPhi;
  const camOffZ = orbitCam.smoothRadius * Math.cos(totalAzimuth) * cosPhi;

  const desiredCamPos = new THREE.Vector3(
    simState.posX + camOffX,
    simState.posY + camOffY + 3, // slightly above UAV center
    simState.posZ + camOffZ
  );

  // Prevent camera from going below ground
  if (desiredCamPos.y < 1.5) desiredCamPos.y = 1.5;

  // Look-at target with pan offset
  const panWorld = orbitCam.smoothPan.clone();
  const cosYaw = Math.cos(simState.yaw);
  const sinYaw = Math.sin(simState.yaw);
  const rotatedPanX = panWorld.x * cosYaw - panWorld.z * sinYaw;
  const rotatedPanZ = panWorld.x * sinYaw + panWorld.z * cosYaw;

  const desiredLookAt = new THREE.Vector3(
    simState.posX + rotatedPanX,
    simState.posY + panWorld.y + 1.5,
    simState.posZ + rotatedPanZ
  );

  // Smooth follow
  const followLerp = 1.0 - Math.pow(0.005, dt);

  if (!cameraInitialized) {
    smoothCamPos.copy(desiredCamPos);
    smoothLookAt.copy(desiredLookAt);
    cameraInitialized = true;
  } else {
    smoothCamPos.lerp(desiredCamPos, followLerp);
    smoothLookAt.lerp(desiredLookAt, followLerp);
  }

  camera.position.copy(smoothCamPos);
  camera.lookAt(smoothLookAt);
}

// ---- Telemetry UI Update ----
function updateTelemetryUI() {
  // Flight telemetry
  if (elSpeed) elSpeed.textContent = Math.round(simState.speed);
  if (elAlt) elAlt.textContent = Math.round(simState.altitude);
  if (elHeading) elHeading.textContent = String(Math.round(simState.heading) % 360).padStart(3, '0');
  if (elPressure) elPressure.textContent = simState.airPressure.toFixed(1);
  
  if (elFuel) elFuel.textContent = Math.round(simState.fuel) + '%';
  if (elFuelFill) {
    elFuelFill.style.width = Math.round(simState.fuel) + '%';
    elFuelFill.classList.remove('fuel-warn', 'fuel-danger');
    if (simState.fuel <= 10) {
      elFuelFill.classList.add('fuel-danger');
    } else if (simState.fuel <= 30) {
      elFuelFill.classList.add('fuel-warn');
    }
  }

  if (elDistance) elDistance.textContent = simState.distance.toFixed(2) + ' km';
  if (elLat) elLat.textContent = simState.lat.toFixed(4) + '°N';
  if (elLon) elLon.textContent = simState.lon.toFixed(4) + '°E';

  // Vertical speed
  if (elVertSpeed) {
    const vs = simState.verticalSpeed;
    elVertSpeed.textContent = (vs >= 0 ? '+' : '') + vs.toFixed(1);
  }

  // Flight time
  const totalSec = Math.floor(simState.flightTime);
  const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const secs = String(totalSec % 60).padStart(2, '0');
  if (elTime) elTime.textContent = mins + ':' + secs;

  // Status
  if (elStatus) {
    let displayStatus = simState.status;
    let statusClass = 'status-normal';

    if (simState.isCrashed) {
      displayStatus = 'CRASH / GROUND CONTACT';
      statusClass = 'status-danger';
    } else if (simState.engine.isFuelStarved) {
      displayStatus = 'FUEL STARVATION';
      statusClass = 'status-danger';
    } else if (simState.fuel <= 20) {
      displayStatus = 'LOW FUEL';
      statusClass = 'status-warning';
    } else {
      if (simState.status === 'TAKEOFF') {
        statusClass = 'status-warning';
      } else if (simState.status === 'IDLE' || simState.status === 'LANDED') {
        statusClass = '';
      }
    }

    elStatus.textContent = displayStatus;
    elStatus.className = 'status-value ' + statusClass;
  }

  // Compass needle (Smooth rotation with fixed origin)
  if (compassNeedle) {
    let currentMod = displayHeading % 360;
    if (currentMod < 0) currentMod += 360;
    let diff = simState.heading - currentMod;
    
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    displayHeading += diff;
    compassNeedle.style.transform = `rotate(${displayHeading}deg)`;
  }

  // Engine telemetry
  if (elRPM) elRPM.textContent = Math.round(simState.engine.rpm);
  if (elCHT) elCHT.textContent = Math.round(simState.engine.cht) + '°C';
  if (elEGT) elEGT.textContent = Math.round(simState.engine.egt) + '°C';
  if (elOilPress) elOilPress.textContent = Math.round(simState.engine.oilPressure) + ' psi';
  if (elOilTemp) elOilTemp.textContent = Math.round(simState.engine.oilTemp) + '°C';
  if (elFuelFlow) elFuelFlow.textContent = simState.engine.fuelFlow.toFixed(1);
  if (elVibration) elVibration.textContent = simState.engine.vibration.toFixed(1);
  if (elThrottle) elThrottle.textContent = Math.round(simState.throttle) + '%';
  if (elThrottleBar) elThrottleBar.style.height = Math.round(simState.throttle) + '%';

  // GPS trail
  drawGPSMap();
}

function drawGPSMap() {
  if (!gpsCtx) return;
  const w = gpsCanvas.width;
  const h = gpsCanvas.height;
  const ctx = gpsCtx;

  ctx.clearRect(0, 0, w, h);

  // Background grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < w; x += 20) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 20) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  const cx = w / 2;
  const cy = h / 2;

  if (gpsTrail.length < 2) {
    // Draw just the UAV dot at center
    ctx.fillStyle = '#22cc77';
    ctx.shadowColor = '#22cc77';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    return;
  }

  // Scale trail to fit canvas
  const latest = gpsTrail[gpsTrail.length - 1];
  const mapScale = 0.15; // world units to pixels

  // Draw trail
  ctx.strokeStyle = 'rgba(34, 204, 119, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < gpsTrail.length; i++) {
    const pt = gpsTrail[i];
    const px = cx + (pt.x - latest.x) * mapScale;
    const py = cy + (pt.z - latest.z) * mapScale;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // UAV dot (at center since we center on latest)
  ctx.fillStyle = '#22cc77';
  ctx.shadowColor = '#22cc77';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Origin marker
  if (gpsTrail.length > 0) {
    const origin = gpsTrail[0];
    const ox = cx + (origin.x - latest.x) * mapScale;
    const oy = cy + (origin.z - latest.z) * mapScale;
    if (ox >= 0 && ox <= w && oy >= 0 && oy <= h) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(ox, oy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = '8px Inter';
      ctx.fillText('HOME', ox + 6, oy + 3);
    }
  }
}

// ---- Resize ----
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ---- Dismiss controls hint on any key ----
window.addEventListener('keydown', () => {
  if (controlsHint && !controlsHint.classList.contains('fade-out')) {
    controlsHint.classList.add('fade-out');
  }
}, { once: true });

// ---- Expose telemetry for Digital Twin integration ----
window.getUAVTelemetry = () => getTelemetrySnapshot(simState);

// ---- Start ----
animate();
