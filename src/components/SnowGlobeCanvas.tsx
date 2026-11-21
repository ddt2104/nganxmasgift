import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { MemoryItem, VoucherStatus } from '../data/memories';
import {
  createPolaroidTexture,
  createSnowflakeSpriteTexture,
} from '../three/proceduralTextures';
import {
  buildSnowGlobeAssembly,
  getSnowHeightAtRadius,
  GLOBE_CENTER_Y,
  GLOBE_RADIUS,
  type PolaroidHandle,
} from '../three/snowGlobeModels';

interface SnowGlobeCanvasProps {
  memories: MemoryItem[];
  voucherStatuses: Record<string, VoucherStatus>;
  secretWishes: Record<string, string>;
  shakeSignal: number;
  resetSignal: number;
  isModalOpen: boolean;
  onSelectMemory: (memory: MemoryItem) => void;
}

// Pre-allocated scratch math helpers (Zero GC inside requestAnimationFrame)
const _scratchVec3 = new THREE.Vector3();
const _scratchColor = new THREE.Color();
const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 8.3, 18.2);
const DEFAULT_TARGET_POS = new THREE.Vector3(0, 6.45, 0);

function getDefaultCameraFraming(aspect: number) {
  if (aspect < 1) {
    // Màn hình dọc (điện thoại): lùi camera vừa đủ để quả cầu không bị cắt hai bên và nằm hài hòa bên dưới khuôn mặt
    const z = Math.min(26.5, 18.2 / Math.max(aspect * 1.32, 0.68));
    return {
      pos: new THREE.Vector3(0, 8.9, z),
      target: new THREE.Vector3(0, 7.15, 0),
    };
  }
  return {
    pos: DEFAULT_CAMERA_POS.clone(),
    target: DEFAULT_TARGET_POS.clone(),
  };
}

export function SnowGlobeCanvas({
  memories,
  voucherStatuses,
  secretWishes,
  shakeSignal,
  resetSignal,
  isModalOpen,
  onSelectMemory,
}: SnowGlobeCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglLost, setWebglLost] = useState(false);

  // Refs giữ callback & state mới nhất để không phải khởi tạo lại scene WebGL
  const onSelectRef = useRef(onSelectMemory);
  onSelectRef.current = onSelectMemory;

  const isModalOpenRef = useRef(isModalOpen);
  isModalOpenRef.current = isModalOpen;

  const initialStatusesRef = useRef(voucherStatuses);
  const initialWishesRef = useRef(secretWishes);

  const triggerShakeFnRef = useRef<(() => void) | null>(null);
  const triggerResetFnRef = useRef<(() => void) | null>(null);
  const polaroidsRef = useRef<PolaroidHandle[]>([]);
  const maxAnisotropyRef = useRef<number>(4);

  // Kích hoạt lắc cầu khi prop shakeSignal tăng
  useEffect(() => {
    if (shakeSignal > 0) {
      triggerShakeFnRef.current?.();
    }
  }, [shakeSignal]);

  // Kích hoạt đặt lại góc nhìn camera khi prop resetSignal tăng
  useEffect(() => {
    if (resetSignal > 0) {
      triggerResetFnRef.current?.();
    }
  }, [resetSignal]);

  // Cập nhật hào quang & texture Polaroid khi người dùng lưu/hủy/dùng Voucher hoặc viết lời chúc bí mật
  useEffect(() => {
    const handles = polaroidsRef.current;
    if (!handles.length) return;
    handles.forEach((handle) => {
      const status: VoucherStatus = voucherStatuses[handle.memory.id] ?? 'available';
      const isHighlighted = status !== 'available';
      const hasSecretWish = Boolean(secretWishes[handle.memory.id]?.trim());
      const haloMat = handle.haloMesh.material as THREE.MeshBasicMaterial;
      haloMat.color.setHex(isHighlighted || hasSecretWish ? 0xffd700 : 0xffe49e);
      haloMat.opacity =
        status === 'saved'
          ? 0.44
          : status === 'used'
            ? 0.28
            : hasSecretWish
              ? 0.34
              : 0.16;

      handle.photoMaterial.emissive.setHex(
        isHighlighted || hasSecretWish ? 0x3b2c0a : 0x1e1912
      );
      handle.photoMaterial.emissiveIntensity =
        status === 'saved'
          ? 0.55
          : status === 'used'
            ? 0.38
            : hasSecretWish
              ? 0.44
              : 0.32;

      const oldTex = handle.photoMaterial.map;
      const newTex = createPolaroidTexture(
        handle.memory,
        maxAnisotropyRef.current,
        status,
        hasSecretWish
      );
      handle.photoMaterial.map = newTex;
      handle.photoMaterial.needsUpdate = true;
      oldTex?.dispose();
    });
  }, [voucherStatuses, secretWishes]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Phát hiện Software WebGL (SwiftShader/llvmpipe) chỉ để điều chỉnh chi phí render
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglLost(true);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    maxAnisotropyRef.current = maxAnisotropy;

    // 2. Scene trong suốt để hòa quyện tự nhiên với nền ảnh chân dung hồng phấn
    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = null;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnvTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = roomEnvTexture;
    scene.environmentIntensity = 0.78;
    pmremGenerator.dispose();

    // 3. Camera & Damped OrbitControls (tự cân khung hình trên cả mobile & desktop)
    const initialAspect = width / Math.max(height, 1);
    const initialFraming = getDefaultCameraFraming(initialAspect);
    const camera = new THREE.PerspectiveCamera(44, initialAspect, 0.2, 140);
    camera.position.copy(initialFraming.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(initialFraming.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.055;
    controls.enablePan = false;
    controls.minDistance = 7.8;
    controls.maxDistance = 28;
    controls.minPolarAngle = 0.25;
    controls.maxPolarAngle = Math.PI * 0.56;
    controls.rotateSpeed = 0.72;
    controls.zoomSpeed = 0.85;
    controls.update();

    // 4. Hệ thống ánh sáng studio hồng phấn - vàng ấm đồng bộ với ảnh nền
    const hemiLight = new THREE.HemisphereLight(0xffe8f0, 0x5c3645, 1.25);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.25);
    keyLight.position.set(9, 16, 11);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 36;
    keyLight.shadow.camera.left = -7.5;
    keyLight.shadow.camera.right = 7.5;
    keyLight.shadow.camera.top = 12;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffb4ce, 1.2);
    rimLight.position.set(-10, 10, -11);
    scene.add(rimLight);

    // 5. Hạt tuyết & nhũ lấp lánh trôi lơ lửng quanh quả cầu trong không gian 3D
    const ambientCount = 460;
    const ambientPositions = new Float32Array(ambientCount * 3);
    const ambientColors = new Float32Array(ambientCount * 3);
    for (let i = 0; i < ambientCount; i++) {
      const r = 8.5 + Math.random() * 24;
      const theta = Math.random() * Math.PI * 2;
      const y = -1 + Math.random() * 19;
      ambientPositions[i * 3] = r * Math.cos(theta);
      ambientPositions[i * 3 + 1] = y;
      ambientPositions[i * 3 + 2] = r * Math.sin(theta);

      const tint = Math.random();
      if (tint < 0.35) _scratchColor.setHex(0xffffff);
      else if (tint < 0.72) _scratchColor.setHex(0xffd7e5);
      else _scratchColor.setHex(0xffe49c);

      ambientColors[i * 3] = _scratchColor.r;
      ambientColors[i * 3 + 1] = _scratchColor.g;
      ambientColors[i * 3 + 2] = _scratchColor.b;
    }

    const spriteTex = createSnowflakeSpriteTexture();
    const ambientGeo = new THREE.BufferGeometry();
    ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambientPositions, 3));
    ambientGeo.setAttribute('color', new THREE.BufferAttribute(ambientColors, 3));
    const ambientMat = new THREE.PointsMaterial({
      size: 0.34,
      map: spriteTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.76,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const ambientField = new THREE.Points(ambientGeo, ambientMat);
    scene.add(ambientField);

    // 6. Dựng Quả Cầu Tuyết & Chòm Sao Kỷ Niệm
    const snowGlobe = buildSnowGlobeAssembly(
      memories,
      initialStatusesRef.current,
      initialWishesRef.current,
      maxAnisotropy,
      isSoftwareGl
    );
    scene.add(snowGlobe.globeAssembly);
    polaroidsRef.current = snowGlobe.polaroidHandles;

    // 7. Hệ thống hàng ngàn hạt tuyết rơi & bay cuộn khi lắc cầu
    const snowCount = 2200;
    const snowPositions = new Float32Array(snowCount * 3);
    const snowVelocities = new Float32Array(snowCount * 3);
    const snowSeeds = new Float32Array(snowCount);

    const respawnSnowflake = (i: number, randomHeight = true) => {
      // Tạo vị trí ngẫu nhiên bên trong hình cầu
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const rad = Math.cbrt(Math.random()) * (GLOBE_RADIUS - 0.35);

      const x = rad * Math.sin(phi) * Math.cos(theta);
      let y = GLOBE_CENTER_Y + rad * Math.cos(phi);
      const z = rad * Math.sin(phi) * Math.sin(theta);

      const floorY = getSnowHeightAtRadius(Math.hypot(x, z)) + 0.12;
      if (randomHeight) {
        y = Math.max(y, floorY + Math.random() * 4.5);
      } else {
        y = GLOBE_CENTER_Y + Math.sqrt(Math.max(0.2, (GLOBE_RADIUS - 0.45) ** 2 - x * x - z * z)) * 0.85;
      }

      snowPositions[i * 3] = x;
      snowPositions[i * 3 + 1] = y;
      snowPositions[i * 3 + 2] = z;

      snowVelocities[i * 3] = (Math.random() - 0.5) * 0.25;
      snowVelocities[i * 3 + 1] = -(0.45 + Math.random() * 0.65);
      snowVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
      snowSeeds[i] = Math.random() * Math.PI * 2;
    };

    for (let i = 0; i < snowCount; i++) {
      respawnSnowflake(i, true);
    }

    const snowGeo = new THREE.BufferGeometry();
    const snowPosAttr = new THREE.BufferAttribute(snowPositions, 3);
    snowGeo.setAttribute('position', snowPosAttr);

    const snowMat = new THREE.PointsMaterial({
      color: 0xf4f8ff,
      size: 0.145,
      map: spriteTex,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const snowPoints = new THREE.Points(snowGeo, snowMat);
    snowPoints.renderOrder = 8;
    snowGlobe.globeAssembly.add(snowPoints);

    // Trạng thái vật lý lắc quả cầu tuyết
    let shakeEnergy = 0;
    let globeShakeWobble = 0;

    const triggerShake = () => {
      shakeEnergy = 1.0;
      globeShakeWobble = 1.0;

      // Truyền xung lực bay cuộn dữ dội cho toàn bộ hạt tuyết
      for (let i = 0; i < snowCount; i++) {
        const idx = i * 3;
        const x = snowPositions[idx];
        const z = snowPositions[idx + 2];
        const angle = Math.atan2(z, x);
        const tangentSpeed = 3.2 + Math.random() * 3.8;
        snowVelocities[idx] += -Math.sin(angle) * tangentSpeed + (Math.random() - 0.5) * 2.2;
        snowVelocities[idx + 1] += 2.8 + Math.random() * 4.4;
        snowVelocities[idx + 2] += Math.cos(angle) * tangentSpeed + (Math.random() - 0.5) * 2.2;
      }
    };
    triggerShakeFnRef.current = triggerShake;

    // Đặt lại góc nhìn mượt mà bằng exponential damping
    let resettingCamera = false;
    const triggerResetCamera = () => {
      resettingCamera = true;
    };
    triggerResetFnRef.current = triggerResetCamera;

    const onControlsStart = () => {
      resettingCamera = false;
    };
    controls.addEventListener('start', onControlsStart);

    // 8. Raycasting cho Hover & Click/Tap Polaroid (Layer 1)
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointerNdc = new THREE.Vector2();
    const clickableHitboxes = snowGlobe.polaroidHandles.map((h) => h.hitbox);
    let hoveredIndex: number | null = null;
    let lastHoverRaycast = 0;
    let pointerDownPos = { x: 0, y: 0 };

    const updateNdc = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isModalOpenRef.current) {
        if (hoveredIndex !== null) {
          hoveredIndex = null;
          renderer.domElement.style.cursor = 'grab';
        }
        return;
      }
      const now = performance.now();
      if (now - lastHoverRaycast < 42) return;
      lastHoverRaycast = now;

      updateNdc(e.clientX, e.clientY);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(clickableHitboxes, false);
      if (hits.length > 0) {
        const idx = hits[0].object.userData.memoryIndex as number;
        hoveredIndex = idx;
        renderer.domElement.style.cursor = 'pointer';
      } else {
        hoveredIndex = null;
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isModalOpenRef.current) return;
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      // Chỉ tính là bấm chọn khung ảnh nếu người dùng không đang kéo xoay camera
      if (dist > 8) return;

      updateNdc(e.clientX, e.clientY);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(clickableHitboxes, false);
      if (hits.length > 0) {
        const idx = hits[0].object.userData.memoryIndex as number;
        const selected = snowGlobe.polaroidHandles[idx]?.memory;
        if (selected) {
          onSelectRef.current(selected);
        }
      }
    };

    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // 9. Xử lý resize & mất ngữ cảnh WebGL
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglLost(true);
    };
    const onContextRestored = () => {
      setWebglLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    // Pre-warm shaders trên GPU
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 10. Vòng lặp Animation 60fps (Paced via afterDraw khi Software WebGL)
    let frameId = 0;
    let disposed = false;
    let prevTime = performance.now();
    let elapsed = 0;
    const maxSnowR = GLOBE_RADIUS - 0.25;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;
      elapsed += dt;

      // Damping reset camera theo kích thước khung hình hiện tại
      if (resettingCamera) {
        const currentAspect =
          (container?.clientWidth || window.innerWidth) /
          Math.max(container?.clientHeight || window.innerHeight, 1);
        const goal = getDefaultCameraFraming(currentAspect);
        camera.position.x = THREE.MathUtils.damp(camera.position.x, goal.pos.x, 5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, goal.pos.y, 5, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, goal.pos.z, 5, dt);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, goal.target.x, 5, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, goal.target.y, 5, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, goal.target.z, 5, dt);
        if (camera.position.distanceTo(goal.pos) < 0.03) {
          resettingCamera = false;
        }
      }

      controls.update();

      // Hiệu ứng rung lắc quả cầu nhẹ khi bấm nút lắc
      if (globeShakeWobble > 0.002) {
        snowGlobe.globeAssembly.rotation.z =
          Math.sin(elapsed * 26) * 0.065 * globeShakeWobble;
        snowGlobe.globeAssembly.rotation.x =
          Math.cos(elapsed * 21) * 0.045 * globeShakeWobble;
        globeShakeWobble *= Math.exp(-3.2 * dt);
      } else {
        snowGlobe.globeAssembly.rotation.z = THREE.MathUtils.damp(
          snowGlobe.globeAssembly.rotation.z,
          0,
          8,
          dt
        );
        snowGlobe.globeAssembly.rotation.x = THREE.MathUtils.damp(
          snowGlobe.globeAssembly.rotation.x,
          0,
          8,
          dt
        );
      }

      // Quỹ đạo các khung ảnh Polaroid bay quanh cây thông (tạm chậm lại khi mở Modal)
      const orbitMultiplier = isModalOpenRef.current ? 0.15 : 1.0;
      snowGlobe.polaroidHandles.forEach((handle, idx) => {
        handle.orbitAngle += handle.orbitSpeed * dt * orbitMultiplier;
        const bob = Math.sin(elapsed * 1.45 + handle.bobPhase) * 0.16;

        handle.group.position.set(
          Math.cos(handle.orbitAngle) * handle.orbitRadius,
          handle.orbitHeight + bob,
          Math.sin(handle.orbitAngle) * handle.orbitRadius
        );

        // Khung ảnh luôn khẽ xoay hướng ra phía ngoài/camera
        _scratchVec3.set(camera.position.x, handle.group.position.y, camera.position.z);
        handle.group.lookAt(_scratchVec3);
        handle.group.rotation.z = Math.sin(elapsed * 0.9 + handle.bobPhase) * 0.06;

        // Phóng nhẹ khung ảnh khi rê chuột vào
        const targetScale = hoveredIndex === idx ? 1.18 : 1.0;
        const s = THREE.MathUtils.damp(handle.group.scale.x, targetScale, 10, dt);
        handle.group.scale.setScalar(s);
      });

      // Chuyển động dịu nhẹ của các hạt nhũ tuyết quanh quả cầu
      ambientField.rotation.y = elapsed * 0.024;
      ambientField.position.y = Math.sin(elapsed * 0.45) * 0.35;
      snowGlobe.starTopper.rotation.y = elapsed * 0.55;
      snowGlobe.treeLight.intensity = 7.2 + Math.sin(elapsed * 2.4) * 0.85;

      // Nhấp nháy dịu dàng các bóng đèn trên cây thông
      for (let i = 0; i < snowGlobe.fairyLightPositions.length; i++) {
        const info = snowGlobe.fairyLightPositions[i];
        const flicker = 0.65 + 0.35 * Math.sin(elapsed * 3.1 + info.phase);
        _scratchColor.copy(info.baseColor).multiplyScalar(flicker);
        snowGlobe.fairyLightMeshes.setColorAt(i, _scratchColor);
      }
      if (snowGlobe.fairyLightMeshes.instanceColor) {
        snowGlobe.fairyLightMeshes.instanceColor.needsUpdate = true;
      }

      // Vật lý hàng ngàn hạt tuyết rơi & bay cuộn
      shakeEnergy *= Math.exp(-0.85 * dt);
      for (let i = 0; i < snowCount; i++) {
        const idx = i * 3;
        let x = snowPositions[idx];
        let y = snowPositions[idx + 1];
        let z = snowPositions[idx + 2];

        let vx = snowVelocities[idx];
        let vy = snowVelocities[idx + 1];
        let vz = snowVelocities[idx + 2];

        // Trọng lực kéo tuyết từ từ rơi xuống + lực cản không khí trong quả cầu
        const terminalVy = -(0.5 + (snowSeeds[i] % 1) * 0.55);
        vy = THREE.MathUtils.lerp(vy, terminalVy, dt * 1.15);

        // Xoáy nhẹ theo dòng khí
        const swirl = 0.25 + shakeEnergy * 2.8;
        const targetVx = -z * swirl * 0.22 + Math.sin(elapsed * 1.4 + snowSeeds[i]) * 0.28;
        const targetVz = x * swirl * 0.22 + Math.cos(elapsed * 1.2 + snowSeeds[i]) * 0.28;
        vx = THREE.MathUtils.lerp(vx, targetVx, dt * 1.8);
        vz = THREE.MathUtils.lerp(vz, targetVz, dt * 1.8);

        x += vx * dt;
        y += vy * dt;
        z += vz * dt;

        // Giữ hạt tuyết nằm gọn trong vỏ kính hình cầu
        const dy = y - GLOBE_CENTER_Y;
        const distSq = x * x + dy * dy + z * z;
        if (distSq > maxSnowR * maxSnowR) {
          const dist = Math.sqrt(distSq);
          const scale = (maxSnowR - 0.05) / dist;
          x *= scale;
          y = GLOBE_CENTER_Y + dy * scale;
          z *= scale;
          vx *= -0.35;
          vz *= -0.35;
          if (dy > 0) vy = -Math.abs(vy) * 0.5;
        }

        // Chạm nền tuyết -> tái sinh nhẹ lên đỉnh cầu (hoặc bay lên nếu đang lắc)
        const floorY = getSnowHeightAtRadius(Math.hypot(x, z)) + 0.08;
        if (y <= floorY) {
          if (shakeEnergy > 0.25) {
            y = floorY + 0.08;
            vy = Math.abs(vy) * 0.65 + 1.5;
          } else {
            respawnSnowflake(i, false);
            continue;
          }
        }

        snowPositions[idx] = x;
        snowPositions[idx + 1] = y;
        snowPositions[idx + 2] = z;
        snowVelocities[idx] = vx;
        snowVelocities[idx + 1] = vy;
        snowVelocities[idx + 2] = vz;
      }
      snowPosAttr.needsUpdate = true;

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    if (isSoftwareGl) {
      frameId = window.setTimeout(tick, 16);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.removeEventListener('start', onControlsStart);
      controls.dispose();
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      snowGlobe.disposables.forEach((d) => d.dispose());
      ambientGeo.dispose();
      ambientMat.dispose();
      snowGeo.dispose();
      snowMat.dispose();
      spriteTex.dispose();
      roomEnvTexture.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [memories]);

  return (
    <div className="fixed inset-0 w-full h-full bg-transparent">
      <div ref={mountRef} className="w-full h-full touch-none" />
      {webglLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f8cddb]/88 p-6 text-center">
          <div className="max-w-md rounded-2xl border border-[#ffd700]/35 bg-[#321220]/95 p-6 shadow-2xl">
            <h2 className="font-display text-2xl font-semibold text-[#ffd700]">
              Không gian 3D đang tạm nghỉ
            </h2>
            <p className="mt-2 text-sm text-[#fff0f4]/85 leading-relaxed">
              Trình duyệt tạm thời chưa khởi tạo được WebGL. Em vẫn có thể mở danh sách kỷ niệm
              và sử dụng toàn bộ ví Voucher ở thanh công cụ bên dưới nhé.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
