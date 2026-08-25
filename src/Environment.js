// =============================================
// Environment — 3D Scene Environment
// =============================================
// Creates runway, terrain, sky, clouds, trees, buildings.

import * as THREE from 'three';

/**
 * Creates the runway with markings.
 */
function createRunway(scene) {
  // ---- Runway surface ----
  const runwayLength = 800;
  const runwayWidth = 20;

  // Create canvas texture for runway markings
  const texCanvas = document.createElement('canvas');
  texCanvas.width = 512;
  texCanvas.height = 4096;
  const ctx = texCanvas.getContext('2d');

  // Asphalt base
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, texCanvas.width, texCanvas.height);

  // Add subtle asphalt noise
  for (let i = 0; i < 20000; i++) {
    const x = Math.random() * texCanvas.width;
    const y = Math.random() * texCanvas.height;
    const brightness = 50 + Math.random() * 30;
    ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // Center line (dashed)
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 4;
  ctx.setLineDash([60, 40]);
  ctx.beginPath();
  ctx.moveTo(texCanvas.width / 2, 0);
  ctx.lineTo(texCanvas.width / 2, texCanvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Edge lines (solid)
  ctx.strokeStyle = '#bbbbbb';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(20, 0); ctx.lineTo(20, texCanvas.height);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(texCanvas.width - 20, 0); ctx.lineTo(texCanvas.width - 20, texCanvas.height);
  ctx.stroke();

  // Threshold markings at both ends
  ctx.fillStyle = '#cccccc';
  for (let end = 0; end < 2; end++) {
    const startY = end === 0 ? 80 : texCanvas.height - 350;
    for (let i = 0; i < 8; i++) {
      const x = 60 + i * 50;
      ctx.fillRect(x, startY, 30, 250);
    }
  }

  // Touchdown zone markers
  ctx.fillStyle = '#aaaaaa';
  for (let zone = 0; zone < 2; zone++) {
    const baseY = zone === 0 ? 600 : texCanvas.height - 800;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(150, baseY + i * 80, 80, 50);
      ctx.fillRect(texCanvas.width - 230, baseY + i * 80, 80, 50);
    }
  }

  const runwayTex = new THREE.CanvasTexture(texCanvas);
  runwayTex.wrapS = THREE.ClampToEdgeWrapping;
  runwayTex.wrapT = THREE.ClampToEdgeWrapping;

  const runwayGeo = new THREE.PlaneGeometry(runwayWidth, runwayLength);
  const runwayMat = new THREE.MeshStandardMaterial({
    map: runwayTex,
    roughness: 0.85,
    metalness: 0.05,
  });

  const runway = new THREE.Mesh(runwayGeo, runwayMat);
  runway.rotation.x = -Math.PI / 2;
  runway.position.y = 0.01; // Slightly above ground to prevent z-fighting
  runway.receiveShadow = true;
  scene.add(runway);

  // ---- Runway edge lights ----
  const lightColor = 0xffeedd;
  const lightSpacing = 30;
  const lightCount = Math.floor(runwayLength / lightSpacing);

  for (let i = 0; i < lightCount; i++) {
    const z = -runwayLength / 2 + i * lightSpacing;
    for (let side = -1; side <= 1; side += 2) {
      const lightGeo = new THREE.SphereGeometry(0.15, 6, 4);
      const lightMat = new THREE.MeshStandardMaterial({
        color: lightColor,
        emissive: lightColor,
        emissiveIntensity: 0.4,
      });
      const lightMesh = new THREE.Mesh(lightGeo, lightMat);
      lightMesh.position.set(side * (runwayWidth / 2 + 0.5), 0.15, z);
      scene.add(lightMesh);
    }
  }

  return { length: runwayLength, width: runwayWidth };
}

/**
 * Creates the ground/terrain plane.
 */
function createTerrain(scene) {
  // Large terrain plane
  const terrainSize = 4000;

  // Create a subtle grass texture via canvas
  const texCanvas = document.createElement('canvas');
  texCanvas.width = 512;
  texCanvas.height = 512;
  const ctx = texCanvas.getContext('2d');

  // Base green-brown
  ctx.fillStyle = '#4a6b35';
  ctx.fillRect(0, 0, 512, 512);

  // Add noise for grass feel
  for (let i = 0; i < 30000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const g = 60 + Math.random() * 60;
    const r = 40 + Math.random() * 30;
    const b = 20 + Math.random() * 20;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(x, y, 2, 2);
  }

  const terrainTex = new THREE.CanvasTexture(texCanvas);
  terrainTex.wrapS = THREE.RepeatWrapping;
  terrainTex.wrapT = THREE.RepeatWrapping;
  terrainTex.repeat.set(80, 80);

  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize);
  const terrainMat = new THREE.MeshStandardMaterial({
    map: terrainTex,
    roughness: 0.95,
    metalness: 0.0,
  });

  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -0.01;
  terrain.receiveShadow = true;
  scene.add(terrain);

  return terrain;
}

/**
 * Creates a gradient sky dome.
 */
function createSky(scene) {
  const skyGeo = new THREE.SphereGeometry(1800, 32, 32);

  // Custom shader for sky gradient
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x4a80bd) },
      midColor: { value: new THREE.Color(0x87AECF) },
      bottomColor: { value: new THREE.Color(0xc8d6e5) },
      horizonColor: { value: new THREE.Color(0xd4c9a8) },
      offset: { value: 20 },
      exponent: { value: 0.5 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 bottomColor;
      uniform vec3 horizonColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        // Horizon band
        if (h < 0.05) {
          float t = smoothstep(-0.1, 0.05, h);
          gl_FragColor = vec4(mix(bottomColor, horizonColor, t), 1.0);
        } else if (h < 0.3) {
          float t = smoothstep(0.05, 0.3, h);
          gl_FragColor = vec4(mix(horizonColor, midColor, t), 1.0);
        } else {
          float t = smoothstep(0.3, 0.8, h);
          gl_FragColor = vec4(mix(midColor, topColor, t), 1.0);
        }
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });

  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  return sky;
}

/**
 * Creates cloud groups.
 */
function createClouds(scene) {
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1.0,
    metalness: 0.0,
    transparent: true,
    opacity: 0.7,
  });

  const clouds = [];

  // High clouds
  for (let i = 0; i < 30; i++) {
    const group = new THREE.Group();
    const puffs = 3 + Math.floor(Math.random() * 5);
    for (let j = 0; j < puffs; j++) {
      const r = 8 + Math.random() * 20;
      const geo = new THREE.SphereGeometry(r, 8, 6);
      const mat = cloudMat.clone();
      mat.opacity = 0.4 + Math.random() * 0.3;
      const puff = new THREE.Mesh(geo, mat);
      puff.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 40
      );
      puff.scale.y = 0.3 + Math.random() * 0.15;
      group.add(puff);
    }
    group.position.set(
      (Math.random() - 0.5) * 1200,
      120 + Math.random() * 200,
      (Math.random() - 0.5) * 1200
    );
    group.userData.speed = 1 + Math.random() * 3;
    group.userData.baseX = group.position.x;
    scene.add(group);
    clouds.push(group);
  }

  // Lower wisps
  for (let i = 0; i < 15; i++) {
    const group = new THREE.Group();
    const puffs = 2 + Math.floor(Math.random() * 3);
    for (let j = 0; j < puffs; j++) {
      const r = 4 + Math.random() * 10;
      const geo = new THREE.SphereGeometry(r, 8, 5);
      const mat = cloudMat.clone();
      mat.opacity = 0.2 + Math.random() * 0.2;
      const puff = new THREE.Mesh(geo, mat);
      puff.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 20
      );
      puff.scale.y = 0.25;
      group.add(puff);
    }
    group.position.set(
      (Math.random() - 0.5) * 800,
      40 + Math.random() * 80,
      (Math.random() - 0.5) * 800
    );
    group.userData.speed = 2 + Math.random() * 5;
    group.userData.baseX = group.position.x;
    scene.add(group);
    clouds.push(group);
  }

  return clouds;
}

/**
 * Creates simple low-poly trees.
 */
function createTrees(scene) {
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.9 });
  const foliageGeo = new THREE.ConeGeometry(1.5, 3, 8);
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2d6b30, roughness: 0.8 });
  const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x3a7a3a, roughness: 0.8 });

  const trees = [];

  // Trees alongside runway (not blocking it)
  for (let i = 0; i < 120; i++) {
    const group = new THREE.Group();

    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1;
    trunk.castShadow = true;
    group.add(trunk);

    const foliage = new THREE.Mesh(foliageGeo, Math.random() > 0.5 ? foliageMat : foliageMat2);
    foliage.position.y = 3.2;
    foliage.castShadow = true;
    // Random scale
    const s = 0.6 + Math.random() * 1.0;
    foliage.scale.setScalar(s);
    group.add(foliage);

    // Position trees away from runway
    const side = Math.random() > 0.5 ? 1 : -1;
    const distFromRunway = 20 + Math.random() * 200;
    group.position.set(
      side * distFromRunway,
      0,
      (Math.random() - 0.5) * 600
    );

    scene.add(group);
    trees.push(group);
  }

  return trees;
}

/**
 * Creates simple buildings near the runway.
 */
function createBuildings(scene) {
  const buildings = [];
  const buildingColors = [0x8888888, 0x999999, 0x777777, 0xaaaaaa, 0x888877];

  for (let i = 0; i < 8; i++) {
    const w = 4 + Math.random() * 8;
    const h = 3 + Math.random() * 6;
    const d = 4 + Math.random() * 8;

    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color: buildingColors[i % buildingColors.length],
      roughness: 0.8,
      metalness: 0.1,
    });

    const building = new THREE.Mesh(geo, mat);
    building.castShadow = true;
    building.receiveShadow = true;

    // Place buildings to one side of the runway
    const side = i < 4 ? 1 : -1;
    building.position.set(
      side * (30 + Math.random() * 50),
      h / 2,
      -100 + i * 40 + (Math.random() - 0.5) * 20
    );

    scene.add(building);
    buildings.push(building);
  }

  // Control tower
  const towerGeo = new THREE.BoxGeometry(4, 12, 4);
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x889999, roughness: 0.6, metalness: 0.2 });
  const tower = new THREE.Mesh(towerGeo, towerMat);
  tower.position.set(35, 6, -20);
  tower.castShadow = true;
  scene.add(tower);

  // Tower top (glass box)
  const topGeo = new THREE.BoxGeometry(6, 3, 6);
  const topMat = new THREE.MeshStandardMaterial({
    color: 0x88bbcc,
    roughness: 0.2,
    metalness: 0.4,
    transparent: true,
    opacity: 0.7,
  });
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.set(35, 13.5, -20);
  scene.add(top);

  return buildings;
}

/**
 * Creates atmospheric haze particles.
 */
function createHaze(scene) {
  const count = 200;
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 600;
    positions[i * 3 + 1] = Math.random() * 150;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 600;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xcccccc,
    size: 1.0,
    transparent: true,
    opacity: 0.06,
    sizeAttenuation: true,
    depthWrite: false,
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);
  return particles;
}

/**
 * Main entry point: build the entire environment.
 * Returns an object with references for animation updates.
 */
export function buildEnvironment(scene) {
  const runway = createRunway(scene);
  const terrain = createTerrain(scene);
  const sky = createSky(scene);
  const clouds = createClouds(scene);
  const trees = createTrees(scene);
  const buildings = createBuildings(scene);
  const haze = createHaze(scene);

  return {
    runway,
    terrain,
    sky,
    clouds,
    trees,
    buildings,
    haze,
  };
}

/**
 * Update environment elements each frame.
 * @param {Object} env - environment references from buildEnvironment()
 * @param {Object} state - SimState
 * @param {number} dt - delta time
 * @param {number} elapsed - total elapsed time
 */
export function updateEnvironment(env, state, dt, elapsed) {
  // ---- Clouds drift ----
  if (env.clouds) {
    env.clouds.forEach((cloud) => {
      cloud.position.x += cloud.userData.speed * dt;

      // Wrap clouds around the UAV position
      const relX = cloud.position.x - state.posX;
      if (relX > 600) {
        cloud.position.x = state.posX - 600;
        cloud.position.z = state.posZ + (Math.random() - 0.5) * 1200;
      }
      if (relX < -600) {
        cloud.position.x = state.posX + 600;
        cloud.position.z = state.posZ + (Math.random() - 0.5) * 1200;
      }

      const relZ = cloud.position.z - state.posZ;
      if (relZ > 600) {
        cloud.position.z = state.posZ - 600;
      }
      if (relZ < -600) {
        cloud.position.z = state.posZ + 600;
      }
    });
  }

  // ---- Haze follows UAV ----
  if (env.haze) {
    env.haze.position.set(state.posX, state.posY + 30, state.posZ);
  }
}
