import * as THREE from 'three';
import type { MemoryItem, VoucherStatus } from '../data/memories';
import {
  createBrassPlaqueTexture,
  createContactShadowTexture,
  createPolaroidTexture,
  createSnowGroundTexture,
  createWoodBaseTexture,
} from './proceduralTextures';

export const GLOBE_RADIUS = 5.4;
export const GLOBE_CENTER_Y = 6.55;
export const SNOW_FLOOR_BASE_Y = 2.65;

/**
 * Hàm tính độ cao mặt tuyết tại bán kính r tính từ tâm cây thông (để mọi vật thể đặt sát mặt tuyết)
 */
export function getSnowHeightAtRadius(r: number): number {
  const norm = Math.min(r / 4.35, 1);
  return SNOW_FLOOR_BASE_Y + (1 - norm * norm) * 0.42;
}

export interface PolaroidHandle {
  group: THREE.Group;
  hitbox: THREE.Mesh;
  haloMesh: THREE.Mesh;
  photoMaterial: THREE.MeshStandardMaterial;
  memory: MemoryItem;
  orbitRadius: number;
  orbitAngle: number;
  orbitHeight: number;
  orbitSpeed: number;
  bobPhase: number;
}

export interface SnowGlobeSceneRefs {
  globeAssembly: THREE.Group;
  polaroidHandles: PolaroidHandle[];
  fairyLightMeshes: THREE.InstancedMesh;
  fairyLightPositions: Array<{ pos: THREE.Vector3; phase: number; baseColor: THREE.Color }>;
  starTopper: THREE.Mesh;
  treeLight: THREE.PointLight;
  disposables: Array<{ dispose: () => void }>;
}

/**
 * Dựng toàn bộ Quả Cầu Tuyết 3D theo cấu trúc đa thành phần (Composite 3-12 Part Procedural Models)
 */
export function buildSnowGlobeAssembly(
  memories: MemoryItem[],
  voucherStatuses: Record<string, VoucherStatus>,
  secretWishes: Record<string, string>,
  maxAnisotropy: number,
  isSoftwareGl: boolean
): SnowGlobeSceneRefs {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const globeAssembly = new THREE.Group();

  // =========================================================================
  // 1. ĐẾ GỖ ÓC CHÓ & ĐỒNG ÁNH KIM (Composite 7-part Lathe Pedestal)
  // =========================================================================
  const pedestalGroup = new THREE.Group();
  const { map: woodMap, roughnessMap: woodRoughMap } = createWoodBaseTexture(maxAnisotropy);
  track(woodMap);
  track(woodRoughMap);

  const walnutMat = track(
    new THREE.MeshStandardMaterial({
      map: woodMap,
      roughnessMap: woodRoughMap,
      roughness: 0.45,
      metalness: 0.08,
    })
  );

  const brushedGoldMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xe6be53,
      metalness: 0.92,
      roughness: 0.22,
      anisotropy: 0.75,
      clearcoat: 0.35,
    })
  );

  const burgundyVelvetMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x7a0815,
      roughness: 0.88,
      metalness: 0.02,
      sheen: 1.0,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color(0xc93b4b),
    })
  );

  // Thân đế gỗ tiện tròn (LatheGeometry, đáy nằm tại y = 0)
  const woodProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(5.15, 0.0),
    new THREE.Vector2(5.15, 0.32),
    new THREE.Vector2(4.85, 0.56),
    new THREE.Vector2(4.45, 0.85),
    new THREE.Vector2(4.32, 1.75),
    new THREE.Vector2(4.62, 2.08),
    new THREE.Vector2(4.62, 2.38),
    new THREE.Vector2(3.95, 2.65),
    new THREE.Vector2(0.0, 2.65),
  ];
  const pedestalGeo = track(new THREE.LatheGeometry(woodProfile, 64));
  const pedestalMesh = new THREE.Mesh(pedestalGeo, walnutMat);
  pedestalMesh.castShadow = true;
  pedestalMesh.receiveShadow = true;
  pedestalGroup.add(pedestalMesh);

  // Vòng nhung đỏ rượu vang ôm quanh thân đế
  const velvetBandGeo = track(new THREE.CylinderGeometry(4.37, 4.41, 0.72, 64, 1, true));
  const velvetBand = new THREE.Mesh(velvetBandGeo, burgundyVelvetMat);
  velvetBand.position.y = 1.3;
  velvetBand.receiveShadow = true;
  pedestalGroup.add(velvetBand);

  // Hai vòng viền đồng ánh kim kẹp dải nhung
  const lowerGoldRingGeo = track(new THREE.TorusGeometry(4.44, 0.085, 20, 72));
  lowerGoldRingGeo.rotateX(Math.PI / 2);
  const lowerGoldRing = new THREE.Mesh(lowerGoldRingGeo, brushedGoldMat);
  lowerGoldRing.position.y = 0.92;
  pedestalGroup.add(lowerGoldRing);

  const upperGoldRingGeo = track(new THREE.TorusGeometry(4.65, 0.11, 20, 72));
  upperGoldRingGeo.rotateX(Math.PI / 2);
  const upperGoldRing = new THREE.Mesh(upperGoldRingGeo, brushedGoldMat);
  upperGoldRing.position.y = 2.24;
  pedestalGroup.add(upperGoldRing);

  // Vòng cổ ôm khít chân cầu thủy tinh
  const cradleRingGeo = track(new THREE.TorusGeometry(4.06, 0.14, 24, 72));
  cradleRingGeo.rotateX(Math.PI / 2);
  const cradleRing = new THREE.Mesh(cradleRingGeo, brushedGoldMat);
  cradleRing.position.y = 2.65;
  pedestalGroup.add(cradleRing);

  // Bảng đồng khắc chữ phía trước đế (+Z)
  const plaqueShape = new THREE.Shape();
  const pw = 2.55;
  const ph = 0.74;
  const pr = 0.1;
  plaqueShape.moveTo(-pw / 2 + pr, -ph / 2);
  plaqueShape.lineTo(pw / 2 - pr, -ph / 2);
  plaqueShape.quadraticCurveTo(pw / 2, -ph / 2, pw / 2, -ph / 2 + pr);
  plaqueShape.lineTo(pw / 2, ph / 2 - pr);
  plaqueShape.quadraticCurveTo(pw / 2, ph / 2, pw / 2 - pr, ph / 2);
  plaqueShape.lineTo(-pw / 2 + pr, ph / 2);
  plaqueShape.quadraticCurveTo(-pw / 2, ph / 2, -pw / 2, ph / 2 - pr);
  plaqueShape.lineTo(-pw / 2, -ph / 2 + pr);
  plaqueShape.quadraticCurveTo(-pw / 2, -ph / 2, -pw / 2 + pr, -ph / 2);

  const plaqueBackGeo = track(
    new THREE.ExtrudeGeometry(plaqueShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
    })
  );
  const plaqueBack = new THREE.Mesh(plaqueBackGeo, brushedGoldMat);
  plaqueBack.position.set(0, 1.3, 4.38);
  pedestalGroup.add(plaqueBack);

  const plaqueTex = track(createBrassPlaqueTexture(maxAnisotropy));
  const plaqueFaceMat = track(
    new THREE.MeshStandardMaterial({
      map: plaqueTex,
      roughness: 0.28,
      metalness: 0.78,
    })
  );
  const plaqueFaceGeo = track(new THREE.PlaneGeometry(2.38, 0.64));
  const plaqueFace = new THREE.Mesh(plaqueFaceGeo, plaqueFaceMat);
  plaqueFace.position.set(0, 1.3, 4.495);
  pedestalGroup.add(plaqueFace);

  // Bóng tiếp xúc mềm dưới đế gỗ
  const shadowTex = track(createContactShadowTexture());
  const contactShadowGeo = track(new THREE.PlaneGeometry(14.5, 14.5));
  contactShadowGeo.rotateX(-Math.PI / 2);
  const contactShadowMat = track(
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    })
  );
  const contactShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
  contactShadow.position.y = 0.01;
  pedestalGroup.add(contactShadow);

  // Mặt nền tuyết uốn cong tự nhiên bên trong lòng cầu
  const { map: snowMap, bumpMap: snowBump } = createSnowGroundTexture(maxAnisotropy);
  track(snowMap);
  track(snowBump);
  const snowFloorMat = track(
    new THREE.MeshStandardMaterial({
      map: snowMap,
      bumpMap: snowBump,
      bumpScale: 0.04,
      roughness: 0.78,
      metalness: 0.04,
    })
  );
  const snowProfile: THREE.Vector2[] = [];
  for (let i = 0; i <= 16; i++) {
    const r = (i / 16) * 4.35;
    snowProfile.push(new THREE.Vector2(r, getSnowHeightAtRadius(r)));
  }
  snowProfile.push(new THREE.Vector2(4.35, 2.52));
  snowProfile.push(new THREE.Vector2(0, 2.52));
  const snowFloorGeo = track(new THREE.LatheGeometry(snowProfile, 64));
  const snowFloorMesh = new THREE.Mesh(snowFloorGeo, snowFloorMat);
  snowFloorMesh.receiveShadow = true;
  pedestalGroup.add(snowFloorMesh);

  globeAssembly.add(pedestalGroup);

  // =========================================================================
  // 2. CÂY THÔNG NOEL 3D PHÁT SÁNG (Composite 10-part Hero Tree)
  // =========================================================================
  const treeGroup = new THREE.Group();
  const treeBaseY = getSnowHeightAtRadius(0);
  treeGroup.position.set(0, treeBaseY - 0.05, 0);

  // Thân cây thông
  const trunkMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x3b2216,
      roughness: 0.92,
      metalness: 0.02,
    })
  );
  const trunkGeo = track(new THREE.CylinderGeometry(0.18, 0.3, 1.35, 16));
  const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
  trunkMesh.position.y = 0.65;
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  treeGroup.add(trunkMesh);

  // Tán lá thông 5 tầng uốn lượn + tuyết phủ mép lá
  const pineMat = track(
    new THREE.MeshStandardMaterial({
      color: 0x0e4429,
      roughness: 0.82,
      metalness: 0.04,
    })
  );
  const pineSnowRimMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xedf4ff,
      roughness: 0.65,
      metalness: 0.05,
    })
  );

  const tierConfigs = [
    { y: 1.0, r: 1.85, h: 1.45 },
    { y: 1.88, r: 1.54, h: 1.32 },
    { y: 2.68, r: 1.24, h: 1.18 },
    { y: 3.4, r: 0.94, h: 1.04 },
    { y: 4.02, r: 0.62, h: 0.88 },
  ];

  tierConfigs.forEach((tier) => {
    const profile = [
      new THREE.Vector2(0.0, tier.h),
      new THREE.Vector2(tier.r * 0.48, tier.h * 0.56),
      new THREE.Vector2(tier.r * 0.85, tier.h * 0.2),
      new THREE.Vector2(tier.r, 0.02),
      new THREE.Vector2(tier.r * 0.72, 0.08),
      new THREE.Vector2(0.0, 0.14),
    ];
    const geo = track(new THREE.LatheGeometry(profile, 28));
    const tierMesh = new THREE.Mesh(geo, pineMat);
    tierMesh.position.y = tier.y;
    tierMesh.castShadow = true;
    tierMesh.receiveShadow = true;
    treeGroup.add(tierMesh);

    // Viền tuyết mịn đọng quanh mép tầng lá
    const snowRimGeo = track(new THREE.TorusGeometry(tier.r * 0.92, 0.045, 8, 28));
    snowRimGeo.rotateX(Math.PI / 2);
    const snowRim = new THREE.Mesh(snowRimGeo, pineSnowRimMat);
    snowRim.position.y = tier.y + 0.05;
    treeGroup.add(snowRim);
  });

  // Dây kim tuyến vàng uốn xoắn ốc quanh cây (TubeGeometry)
  const garlandPoints: THREE.Vector3[] = [];
  const totalTurns = 4.6;
  const garlandSteps = 96;
  for (let i = 0; i <= garlandSteps; i++) {
    const t = i / garlandSteps;
    const angle = t * Math.PI * 2 * totalTurns;
    const y = 1.12 + t * 3.55;
    const radius = THREE.MathUtils.lerp(1.76, 0.28, t);
    garlandPoints.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
  }
  const garlandCurve = new THREE.CatmullRomCurve3(garlandPoints);
  const garlandGeo = track(new THREE.TubeGeometry(garlandCurve, 120, 0.036, 8, false));
  const garlandMesh = new THREE.Mesh(garlandGeo, brushedGoldMat);
  treeGroup.add(garlandMesh);

  // Hàng loạt bóng đèn nháy ấm áp (InstancedMesh)
  const fairyCount = 56;
  const fairyGeo = track(new THREE.SphereGeometry(0.055, 10, 10));
  const fairyMat = track(
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
    })
  );
  const fairyLightMeshes = new THREE.InstancedMesh(fairyGeo, fairyMat, fairyCount);
  const fairyLightPositions: Array<{ pos: THREE.Vector3; phase: number; baseColor: THREE.Color }> = [];
  const dummy = new THREE.Object3D();
  const paletteHex = [0xffdf7a, 0xffb347, 0xfff3c4, 0xff758f];

  for (let i = 0; i < fairyCount; i++) {
    const t = (i + 0.4) / fairyCount;
    const angle = t * Math.PI * 2 * 5.2 + (i % 2) * 0.4;
    const y = 1.15 + t * 3.5;
    const radius = THREE.MathUtils.lerp(1.78, 0.3, t) + 0.04;
    const pos = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);

    dummy.position.copy(pos);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    fairyLightMeshes.setMatrixAt(i, dummy.matrix);

    const col = new THREE.Color(paletteHex[i % paletteHex.length]);
    fairyLightMeshes.setColorAt(i, col);
    fairyLightPositions.push({ pos, phase: i * 0.72, baseColor: col });
  }
  fairyLightMeshes.instanceMatrix.needsUpdate = true;
  if (fairyLightMeshes.instanceColor) fairyLightMeshes.instanceColor.needsUpdate = true;
  fairyLightMeshes.computeBoundingSphere();
  treeGroup.add(fairyLightMeshes);

  // Trái châu trang trí đỏ rượu & vàng ánh kim (InstancedMesh)
  const baubleCount = 28;
  const baubleGeo = track(new THREE.SphereGeometry(0.095, 16, 16));
  const baubleMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.75,
      roughness: 0.14,
      clearcoat: 1.0,
    })
  );
  const baubleMeshes = new THREE.InstancedMesh(baubleGeo, baubleMat, baubleCount);
  for (let i = 0; i < baubleCount; i++) {
    const t = (i + 0.5) / baubleCount;
    const angle = i * 2.39996; // Góc vàng (golden angle) phân bố đều đẹp mắt
    const y = 1.22 + t * 3.15;
    const radius = THREE.MathUtils.lerp(1.66, 0.36, t);
    dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    dummy.scale.setScalar(0.85 + (i % 3) * 0.15);
    dummy.updateMatrix();
    baubleMeshes.setMatrixAt(i, dummy.matrix);
    baubleMeshes.setColorAt(
      i,
      new THREE.Color(i % 2 === 0 ? 0xa31424 : 0xf2c94c)
    );
  }
  baubleMeshes.instanceMatrix.needsUpdate = true;
  if (baubleMeshes.instanceColor) baubleMeshes.instanceColor.needsUpdate = true;
  baubleMeshes.computeBoundingSphere();
  treeGroup.add(baubleMeshes);

  // Ngôi sao 5 cánh vát cạnh phát sáng trên đỉnh cây (ExtrudeGeometry)
  const starShape = new THREE.Shape();
  const outerR = 0.42;
  const innerR = 0.18;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const sx = Math.cos(a) * r;
    const sy = -Math.sin(a) * r;
    if (i === 0) starShape.moveTo(sx, sy);
    else starShape.lineTo(sx, sy);
  }
  starShape.closePath();

  const starGeo = track(
    new THREE.ExtrudeGeometry(starShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 2,
    })
  );
  starGeo.center();

  const starMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xffdf6b,
      emissive: 0xffb703,
      emissiveIntensity: 1.35,
      metalness: 0.85,
      roughness: 0.18,
    })
  );
  const starTopper = new THREE.Mesh(starGeo, starMat);
  starTopper.position.y = 5.12;
  treeGroup.add(starTopper);

  // Nguồn sáng ấm tỏa ra từ lòng cây thông
  const treeLight = new THREE.PointLight(0xffb84d, 7.5, 11.5, 1.5);
  treeLight.position.set(0, 2.8, 0.35);
  treeGroup.add(treeLight);

  globeAssembly.add(treeGroup);

  // =========================================================================
  // 3. CÁC HỘP QUÀ GIÁNG SINH DƯỚI GỐC CÂY (Composite 4-part Gift Boxes)
  // =========================================================================
  const giftsGroup = new THREE.Group();
  const giftSpecs = [
    { x: -1.15, z: 1.05, w: 0.66, h: 0.52, d: 0.66, boxColor: 0x8b0000, ribbonColor: 0xf5d061, rot: 0.32 },
    { x: 1.18, z: 0.92, w: 0.74, h: 0.44, d: 0.58, boxColor: 0x164e34, ribbonColor: 0xf5d061, rot: -0.45 },
    { x: 0.25, z: 1.48, w: 0.52, h: 0.48, d: 0.52, boxColor: 0xd4a438, ribbonColor: 0x8b0000, rot: 0.18 },
    { x: -1.35, z: -0.68, w: 0.62, h: 0.56, d: 0.62, boxColor: 0x203a60, ribbonColor: 0xf8e5a0, rot: 0.7 },
    { x: 1.02, z: -0.95, w: 0.58, h: 0.42, d: 0.58, boxColor: 0x9b1b30, ribbonColor: 0xffffff, rot: -0.22 },
  ];

  giftSpecs.forEach((spec) => {
    const gift = new THREE.Group();
    const r = Math.hypot(spec.x, spec.z);
    const groundY = getSnowHeightAtRadius(r);

    const bodyMat = track(
      new THREE.MeshStandardMaterial({
        color: spec.boxColor,
        roughness: 0.55,
        metalness: 0.08,
      })
    );
    const ribbonMat = track(
      new THREE.MeshPhysicalMaterial({
        color: spec.ribbonColor,
        roughness: 0.24,
        metalness: 0.65,
        clearcoat: 0.4,
      })
    );

    const bodyGeo = track(new THREE.BoxGeometry(spec.w, spec.h, spec.d));
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = spec.h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    gift.add(body);

    const lidGeo = track(new THREE.BoxGeometry(spec.w + 0.05, 0.1, spec.d + 0.05));
    const lid = new THREE.Mesh(lidGeo, bodyMat);
    lid.position.y = spec.h - 0.02;
    lid.castShadow = true;
    gift.add(lid);

    // Hai dải ruy-băng chữ thập
    const ribXGeo = track(new THREE.BoxGeometry(spec.w + 0.06, spec.h + 0.06, 0.09));
    const ribX = new THREE.Mesh(ribXGeo, ribbonMat);
    ribX.position.y = spec.h / 2 + 0.01;
    gift.add(ribX);

    const ribZGeo = track(new THREE.BoxGeometry(0.09, spec.h + 0.06, spec.d + 0.06));
    const ribZ = new THREE.Mesh(ribZGeo, ribbonMat);
    ribZ.position.y = spec.h / 2 + 0.01;
    gift.add(ribZ);

    // Nơ ruy-băng trên nắp hộp
    const bowLoopGeo = track(new THREE.TorusGeometry(0.085, 0.022, 10, 20));
    const bowLeft = new THREE.Mesh(bowLoopGeo, ribbonMat);
    bowLeft.position.set(-0.075, spec.h + 0.07, 0);
    bowLeft.rotation.set(0.3, 0, Math.PI / 4);
    gift.add(bowLeft);

    const bowRight = new THREE.Mesh(bowLoopGeo, ribbonMat);
    bowRight.position.set(0.075, spec.h + 0.07, 0);
    bowRight.rotation.set(0.3, 0, -Math.PI / 4);
    gift.add(bowRight);

    gift.position.set(spec.x, groundY - 0.02, spec.z);
    gift.rotation.y = spec.rot;
    giftsGroup.add(gift);
  });

  // Đèn lồng cổ điển nhỏ phát sáng ấm bên gốc cây
  const lanternGroup = new THREE.Group();
  const lx = -1.78;
  const lz = 0.42;
  const ly = getSnowHeightAtRadius(Math.hypot(lx, lz));
  lanternGroup.position.set(lx, ly - 0.02, lz);

  const lanternIronMat = track(
    new THREE.MeshStandardMaterial({ color: 0x1b2029, metalness: 0.8, roughness: 0.35 })
  );
  const lanternGlowMat = track(
    new THREE.MeshBasicMaterial({ color: 0xffd27d })
  );
  const lanternPole = new THREE.Mesh(track(new THREE.CylinderGeometry(0.035, 0.055, 1.35, 12)), lanternIronMat);
  lanternPole.position.y = 0.675;
  lanternGroup.add(lanternPole);

  const lanternCap = new THREE.Mesh(track(new THREE.ConeGeometry(0.18, 0.14, 6)), lanternIronMat);
  lanternCap.position.y = 1.56;
  lanternGroup.add(lanternCap);

  const lanternCore = new THREE.Mesh(track(new THREE.CylinderGeometry(0.1, 0.085, 0.22, 6)), lanternGlowMat);
  lanternCore.position.y = 1.4;
  lanternGroup.add(lanternCore);

  giftsGroup.add(lanternGroup);
  globeAssembly.add(giftsGroup);

  // =========================================================================
  // 4. CHÒM SAO KHUNG ẢNH POLAROID BAY LƠ LỬNG THEO QUỸ ĐẠO
  // =========================================================================
  const polaroidHandles: PolaroidHandle[] = [];
  const cardBackMat = track(
    new THREE.MeshStandardMaterial({
      color: 0xf3eee2,
      roughness: 0.72,
      metalness: 0.05,
    })
  );
  const hitboxGeo = track(new THREE.BoxGeometry(1.42, 1.72, 0.36));
  const hitboxMat = track(new THREE.MeshBasicMaterial({ visible: false }));
  const cardBackGeo = track(new THREE.BoxGeometry(1.16, 1.42, 0.04));
  const photoPlaneGeo = track(new THREE.PlaneGeometry(1.12, 1.36));
  const clipGeo = track(new THREE.BoxGeometry(0.24, 0.12, 0.09));
  const haloGeo = track(new THREE.RingGeometry(0.74, 0.82, 32));

  memories.forEach((memory, index) => {
    const group = new THREE.Group();
    const status: VoucherStatus = voucherStatuses[memory.id] ?? 'available';
    const isHighlighted = status !== 'available';

    const cardBack = new THREE.Mesh(cardBackGeo, cardBackMat);
    group.add(cardBack);

    const hasSecretWish = Boolean(secretWishes[memory.id]?.trim());
    const tex = track(createPolaroidTexture(memory, maxAnisotropy, status, hasSecretWish));
    const photoMat = track(
      new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.38,
        metalness: 0.04,
        emissive: new THREE.Color(isHighlighted ? 0x3b2c0a : 0x1e1912),
        emissiveIntensity: status === 'saved' ? 0.55 : status === 'used' ? 0.38 : 0.32,
      })
    );

    // Mặt trước & mặt sau để xoay 360° vẫn nhìn rõ khung ảnh Polaroid
    const frontPhoto = new THREE.Mesh(photoPlaneGeo, photoMat);
    frontPhoto.position.z = 0.023;
    group.add(frontPhoto);

    const backPhoto = new THREE.Mesh(photoPlaneGeo, photoMat);
    backPhoto.rotation.y = Math.PI;
    backPhoto.position.z = -0.023;
    group.add(backPhoto);

    // Kẹp đồng nhỏ gắn trên đỉnh Polaroid
    const clip = new THREE.Mesh(clipGeo, brushedGoldMat);
    clip.position.y = 0.74;
    group.add(clip);

    // Vầng hào quang vàng dịu sau khung ảnh
    const haloMat = track(
      new THREE.MeshBasicMaterial({
        color: isHighlighted ? 0xffd700 : 0xffe49e,
        transparent: true,
        opacity: status === 'saved' ? 0.42 : status === 'used' ? 0.28 : 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.z = -0.04;
    group.add(haloMesh);

    // Hitbox tàng hình ở Layer 1 giúp chạm/click chuẩn xác trên cả mobile & desktop
    const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    hitbox.layers.set(1);
    hitbox.userData.memoryIndex = index;
    group.add(hitbox);

    // Phân bố quỹ đạo xoắn quanh cây thông trong lòng cầu
    const orbitAngle = (index / memories.length) * Math.PI * 2;
    const orbitRadius = index % 2 === 0 ? 3.25 : 2.75;
    const orbitHeight = 4.65 + ((index % 3) - 1) * 1.15 + (index === 6 ? 0.85 : 0);

    group.position.set(
      Math.cos(orbitAngle) * orbitRadius,
      orbitHeight,
      Math.sin(orbitAngle) * orbitRadius
    );

    globeAssembly.add(group);
    polaroidHandles.push({
      group,
      hitbox,
      haloMesh,
      photoMaterial: photoMat,
      memory,
      orbitRadius,
      orbitAngle,
      orbitHeight,
      orbitSpeed: 0.11 + (index % 2) * 0.02,
      bobPhase: index * 1.1,
    });
  });

  // =========================================================================
  // 5. VỎ CẦU THỦY TINH PHA LÊ TRONG SUỐT (Transparent Optical Crystal Dome)
  // =========================================================================
  const glassGeo = track(new THREE.SphereGeometry(GLOBE_RADIUS, 64, 48));
  const glassMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xfff5f9,
      metalness: 0.0,
      roughness: isSoftwareGl ? 0.1 : 0.03,
      transmission: 0,
      transparent: true,
      opacity: isSoftwareGl ? 0.18 : 0.14,
      ior: 1.5,
      reflectivity: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.45,
      depthWrite: false,
    })
  );
  const glassDome = new THREE.Mesh(glassGeo, glassMat);
  glassDome.position.y = GLOBE_CENTER_Y;
  glassDome.renderOrder = 12;
  globeAssembly.add(glassDome);

  return {
    globeAssembly,
    polaroidHandles,
    fairyLightMeshes,
    fairyLightPositions,
    starTopper,
    treeLight,
    disposables,
  };
}
