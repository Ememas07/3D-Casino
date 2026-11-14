import * as THREE from 'three';
import type { SlotThemeId } from '../casino/slots';
import type { MaterialLibrary } from './materials';

export interface RouletteRig {
  group: THREE.Group;
  rotor: THREE.Group;
  ballPivot: THREE.Group;
  ball: THREE.Mesh;
  chipsGroup: THREE.Group;
}

export interface BlackjackRig {
  group: THREE.Group;
  dealerCardsGroup: THREE.Group;
  playerCardsGroup: THREE.Group;
  chipStackGroup: THREE.Group;
}

export interface PokerRig {
  group: THREE.Group;
  communityCardsGroup: THREE.Group;
  playerHoleGroup: THREE.Group;
  dealerHoleGroup: THREE.Group;
  potChipsGroup: THREE.Group;
}

export interface SlotMachineRig {
  themeId: SlotThemeId;
  group: THREE.Group;
  reels: THREE.Mesh[];
  leverPivot: THREE.Group;
  winBeaconMat: THREE.MeshStandardMaterial;
  topper: THREE.Object3D;
  trayCoinsGroup: THREE.Group;
}

export interface BarRig {
  group: THREE.Group;
  shakerGroup: THREE.Group;
  servedGlass: THREE.Mesh;
  glowBackMat: THREE.MeshStandardMaterial;
}

export interface SalonArchitectureRig {
  group: THREE.Group;
  chandelier: THREE.Group;
  chandelierInnerRing: THREE.Mesh;
  palmCrowns: THREE.Group[];
  dustMotes: THREE.Points;
  dustMaterial: THREE.PointsMaterial;
}

export function buildChipMesh(colorHex: number, radius = 0.075): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.02, 18),
    new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4, metalness: 0.1 }),
  );
  body.castShadow = true;
  const inlay = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, 0.022, 14),
    new THREE.MeshStandardMaterial({ color: 0xf6f2e9, roughness: 0.5 }),
  );
  g.add(body, inlay);
  return g;
}

function buildBarstool(mats: MaterialLibrary, cushionMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.04, 16), mats.brushedBrass);
  base.position.y = 0.02;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.62, 12), mats.brushedBrass);
  stem.position.y = 0.34;
  const footRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 8, 20), mats.brushedBrass);
  footRing.rotation.x = Math.PI / 2;
  footRing.position.y = 0.24;
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.21, 0.1, 18), cushionMat);
  seat.position.y = 0.68;
  seat.castShadow = true;
  g.add(base, stem, footRing, seat);
  return g;
}

export function buildRouletteTable(mats: MaterialLibrary): RouletteRig {
  const group = new THREE.Group();
  group.userData.station = 'roulette';

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.8), mats.contactShadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  [-1.55, 1.45].forEach((xOffset) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.48, 0.82, 20), mats.mahogany);
    leg.position.set(xOffset, 0.41, 0);
    leg.castShadow = true;
    group.add(leg);

    const brassBase = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.56, 0.08, 20), mats.brushedBrass);
    brassBase.position.set(xOffset, 0.04, 0);
    group.add(brassBase);
  });

  const tableApron = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.24, 2.5), mats.mahogany);
  tableApron.position.set(0, 0.88, 0);
  tableApron.castShadow = true;
  group.add(tableApron);

  const railLong1 = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.14, 0.2), mats.espressoLeather);
  railLong1.position.set(0, 1.04, 1.24);
  const railLong2 = railLong1.clone();
  railLong2.position.set(0, 1.04, -1.24);
  const railEnd1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 2.68), mats.espressoLeather);
  railEnd1.position.set(2.7, 1.04, 0);
  const railEnd2 = railEnd1.clone();
  railEnd2.position.set(-2.7, 1.04, 0);
  group.add(railLong1, railLong2, railEnd1, railEnd2);

  const feltBed = new THREE.Mesh(new THREE.BoxGeometry(5.15, 0.04, 2.3), mats.emeraldFelt);
  feltBed.position.set(0, 1.01, 0);
  feltBed.receiveShadow = true;
  group.add(feltBed);

  const layoutPlane = new THREE.Mesh(new THREE.PlaneGeometry(3.25, 1.78), mats.rouletteLayout);
  layoutPlane.rotation.x = -Math.PI / 2;
  layoutPlane.position.set(0.85, 1.035, 0);
  layoutPlane.receiveShadow = true;
  group.add(layoutPlane);

  const bowlProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.88, 0.02),
    new THREE.Vector2(0.95, 0.18),
    new THREE.Vector2(0.99, 0.26),
    new THREE.Vector2(0.92, 0.28),
    new THREE.Vector2(0.82, 0.16),
    new THREE.Vector2(0.75, 0.06),
  ];
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlProfile, 36), mats.mahogany);
  bowl.position.set(-1.55, 1.02, 0);
  bowl.castShadow = true;
  group.add(bowl);

  const brassRim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.035, 12, 44), mats.brushedBrass);
  brassRim.rotation.x = Math.PI / 2;
  brassRim.position.set(-1.55, 1.29, 0);
  group.add(brassRim);

  const rotor = new THREE.Group();
  rotor.position.set(-1.55, 1.09, 0);
  const rotorPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.04, 36), mats.rotorDisc);
  rotor.add(rotorPlate);

  const turret = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.22, 20), mats.brushedBrass);
  turret.position.y = 0.12;
  rotor.add(turret);

  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 14), mats.brushedBrass);
  finial.position.y = 0.25;
  rotor.add(finial);

  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 8), mats.brushedBrass);
    spoke.rotation.z = Math.PI / 2;
    spoke.rotation.y = (i * Math.PI) / 4;
    spoke.position.y = 0.16;
    rotor.add(spoke);
  }
  group.add(rotor);

  const ballPivot = new THREE.Group();
  ballPivot.position.set(-1.55, 1.13, 0);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.042, 16, 16), mats.ivoryBall);
  ball.position.set(0, 0.11, -0.84);
  ballPivot.add(ball);
  group.add(ballPivot);

  const chipsGroup = new THREE.Group();
  chipsGroup.position.set(0, 1.04, 0);
  group.add(chipsGroup);

  return { group, rotor, ballPivot, ball, chipsGroup };
}

export function buildBlackjackTable(mats: MaterialLibrary): BlackjackRig {
  const group = new THREE.Group();
  group.userData.station = 'blackjack';

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 4.4), mats.contactShadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  [-1.0, 1.0].forEach((x) => {
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.38, 0.84, 16), mats.mahogany);
    ped.position.set(x, 0.42, 0);
    ped.castShadow = true;
    group.add(ped);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.07, 16), mats.brushedBrass);
    foot.position.set(x, 0.035, 0);
    group.add(foot);
  });

  const shape = new THREE.Shape();
  shape.moveTo(-2.1, -0.95);
  shape.lineTo(2.1, -0.95);
  shape.absarc(0, -0.95, 2.1, 0, Math.PI, false);
  shape.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3,
  });
  bodyGeo.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, mats.mahogany);
  body.position.y = 1.02;
  body.castShadow = true;
  group.add(body);

  const railArc = new THREE.Mesh(
    new THREE.TorusGeometry(2.08, 0.11, 12, 32, Math.PI),
    mats.espressoLeather,
  );
  railArc.rotation.x = Math.PI / 2;
  railArc.position.set(0, 1.07, -0.95);
  group.add(railArc);

  const feltGeo = new THREE.CylinderGeometry(1.94, 1.94, 0.04, 32, 1, false, -Math.PI / 2, Math.PI);
  const felt = new THREE.Mesh(feltGeo, mats.emeraldFelt);
  felt.position.set(0, 1.02, -0.95);
  felt.receiveShadow = true;
  group.add(felt);

  const layoutPlane = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.65), mats.blackjackLayout);
  layoutPlane.rotation.x = -Math.PI / 2;
  layoutPlane.position.set(0, 1.045, 0.02);
  group.add(layoutPlane);

  const shoeGroup = new THREE.Group();
  shoeGroup.position.set(1.25, 1.12, -0.58);
  shoeGroup.rotation.y = -0.35;
  const shoeBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.56), mats.mahogany);
  const shoeBrass = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.04, 0.57), mats.brushedBrass);
  shoeBrass.position.y = -0.065;
  shoeGroup.add(shoeBase, shoeBrass);
  group.add(shoeGroup);

  const discard = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.34), mats.chrome);
  discard.position.set(-1.25, 1.11, -0.58);
  group.add(discard);

  // Player stools
  [-1.35, 0, 1.35].forEach((sx, i) => {
    const stool = buildBarstool(mats, mats.espressoLeather);
    stool.position.set(sx, 0, i === 1 ? 1.72 : 1.48);
    group.add(stool);
  });

  const dealerCardsGroup = new THREE.Group();
  dealerCardsGroup.position.set(0, 1.055, -0.36);
  const playerCardsGroup = new THREE.Group();
  playerCardsGroup.position.set(0, 1.055, 0.42);
  const chipStackGroup = new THREE.Group();
  chipStackGroup.position.set(0, 1.05, 0.8);

  group.add(dealerCardsGroup, playerCardsGroup, chipStackGroup);

  return { group, dealerCardsGroup, playerCardsGroup, chipStackGroup };
}

export function buildPokerTable(mats: MaterialLibrary): PokerRig {
  const group = new THREE.Group();
  group.userData.station = 'poker';

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 4.2), mats.contactShadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  // Twin oval pedestals
  [-1.15, 1.15].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.38, 0.84, 16), mats.mahogany);
    leg.position.set(x, 0.42, 0);
    leg.castShadow = true;
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.07, 16), mats.brushedBrass);
    foot.position.set(x, 0.035, 0);
    group.add(leg, foot);
  });

  // Oval mahogany body (scaled cylinder)
  const apron = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.2, 32), mats.mahogany);
  apron.scale.set(1.65, 1, 1);
  apron.position.y = 0.92;
  apron.castShadow = true;
  group.add(apron);

  // Padded leather rail
  const rail = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.11, 12, 36), mats.espressoLeather);
  rail.rotation.x = Math.PI / 2;
  rail.scale.set(1.65, 1, 1);
  rail.position.y = 1.04;
  group.add(rail);

  // Poker felt surface
  const layout = new THREE.Mesh(new THREE.PlaneGeometry(4.1, 2.25), mats.pokerLayout);
  layout.rotation.x = -Math.PI / 2;
  layout.position.y = 1.03;
  group.add(layout);

  // Dealer button puck
  const dealerBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.025, 16), mats.ivoryBall);
  dealerBtn.position.set(-0.9, 1.045, 0.45);
  group.add(dealerBtn);

  // 4 player chairs around poker table
  const chairAngles = [Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75, -Math.PI * 0.5];
  chairAngles.forEach((a) => {
    const stool = buildBarstool(mats, mats.velvetTeal);
    stool.position.set(Math.cos(a) * 2.55, 0, Math.sin(a) * 1.68);
    group.add(stool);
  });

  const communityCardsGroup = new THREE.Group();
  communityCardsGroup.position.set(0, 1.045, 0);
  const playerHoleGroup = new THREE.Group();
  playerHoleGroup.position.set(0, 1.045, 0.76);
  const dealerHoleGroup = new THREE.Group();
  dealerHoleGroup.position.set(0, 1.045, -0.76);
  const potChipsGroup = new THREE.Group();
  potChipsGroup.position.set(-1.35, 1.045, 0);

  group.add(communityCardsGroup, playerHoleGroup, dealerHoleGroup, potChipsGroup);

  return { group, communityCardsGroup, playerHoleGroup, dealerHoleGroup, potChipsGroup };
}

export function buildThemedSlotMachine(
  mats: MaterialLibrary,
  themeId: SlotThemeId,
): SlotMachineRig {
  const group = new THREE.Group();
  group.userData.station = 'slots';
  group.userData.slotTheme = themeId;

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.3), mats.contactShadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  group.add(shadow);

  const bodyMat =
    themeId === 'classic'
      ? mats.mahogany
      : themeId === 'treasure'
        ? mats.sandstone
        : mats.gunmetal;
  const trimMat =
    themeId === 'classic'
      ? mats.brushedBrass
      : themeId === 'treasure'
        ? mats.brushedBrass
        : mats.chrome;
  const knobColor =
    themeId === 'classic' ? 0xb91c1c : themeId === 'treasure' ? 0x0ea5e9 : 0x38bdf8;

  const stand = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.85, 1.08), bodyMat);
  stand.position.y = 0.425;
  stand.castShadow = true;
  group.add(stand);

  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.36, 1.45, 0.96), bodyMat);
  cabinet.position.y = 1.56;
  cabinet.castShadow = true;
  group.add(cabinet);

  const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.74, 0.12), trimMat);
  bezel.position.set(0, 1.62, 0.46);
  group.add(bezel);

  // Theme-distinct crown topper
  const marqueeBox = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.4, 0.2), trimMat);
  marqueeBox.position.set(0, 2.48, 0.4);
  group.add(marqueeBox);

  let topper: THREE.Object3D;
  if (themeId === 'treasure') {
    const pyramid = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.36, 4), mats.brushedBrass);
    pyramid.rotation.y = Math.PI / 4;
    pyramid.position.set(0, 2.86, 0.38);
    group.add(pyramid);
    topper = pyramid;
  } else if (themeId === 'futuristic') {
    const finL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.12), mats.cyanNeon);
    finL.position.set(-0.68, 1.65, 0.46);
    const finR = finL.clone();
    finR.position.set(0.68, 1.65, 0.46);
    group.add(finL, finR);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.032, 10, 28), mats.cyanNeon);
    halo.position.set(0, 2.94, 0.4);
    group.add(halo);
    topper = halo;
  } else {
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.14, 16, 1, false, 0, Math.PI), mats.brushedBrass);
    arch.rotation.z = Math.PI / 2;
    arch.rotation.y = Math.PI / 2;
    arch.position.set(0, 2.68, 0.4);
    group.add(arch);

    const crownStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), mats.brushedBrass);
    crownStar.position.set(0, 2.96, 0.4);
    group.add(crownStar);
    topper = crownStar;
  }

  const marqueeFace = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 0.32), mats.slotMarquees[themeId]);
  marqueeFace.position.set(0, 2.48, 0.51);
  group.add(marqueeFace);

  // Win celebration beacon strip
  const winBeaconMat = new THREE.MeshStandardMaterial({
    color: themeId === 'futuristic' ? 0x38bdf8 : 0xfbbf24,
    emissive: themeId === 'futuristic' ? 0x0ea5e9 : 0xf59e0b,
    emissiveIntensity: 0.25,
    roughness: 0.2,
  });
  const winBeacon = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.07, 0.08), winBeaconMat);
  winBeacon.position.set(0, 2.24, 0.48);
  group.add(winBeacon);

  const reels: THREE.Mesh[] = [];
  const reelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.3, 32, 1, false);
  reelGeo.rotateZ(Math.PI / 2);

  [-0.36, 0, 0.36].forEach((rx) => {
    const reel = new THREE.Mesh(reelGeo, mats.slotReels[themeId]);
    reel.position.set(rx, 1.62, 0.4);
    group.add(reel);
    reels.push(reel);
  });

  const payline = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.018, 0.03), trimMat);
  payline.position.set(0, 1.62, 0.56);
  group.add(payline);

  const tray = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.28), trimMat);
  tray.position.set(0, 0.96, 0.58);
  group.add(tray);

  // Payout coins inside tray for win cascade animation
  const trayCoinsGroup = new THREE.Group();
  trayCoinsGroup.position.set(0, 1.05, 0.6);
  const coinGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.016, 14);
  for (let c = 0; c < 6; c++) {
    const coin = new THREE.Mesh(coinGeo, mats.brushedBrass);
    coin.position.set(-0.34 + c * 0.135, 0, (c % 2) * 0.04 - 0.02);
    coin.rotation.x = Math.PI * 0.42;
    trayCoinsGroup.add(coin);
  }
  group.add(trayCoinsGroup);

  const leverPivot = new THREE.Group();
  leverPivot.position.set(0.74, 1.52, 0.1);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 16), trimMat);
  hub.rotation.z = Math.PI / 2;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.72, 12), trimMat);
  arm.position.set(0.06, 0.34, 0);
  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 16, 16),
    new THREE.MeshStandardMaterial({ color: knobColor, roughness: 0.2, metalness: 0.15 }),
  );
  knob.position.set(0.06, 0.7, 0);
  leverPivot.add(hub, arm, knob);
  group.add(leverPivot);

  return { themeId, group, reels, leverPivot, winBeaconMat, topper, trayCoinsGroup };
}

export function buildBarArea(mats: MaterialLibrary): BarRig {
  const group = new THREE.Group();
  group.userData.station = 'bar';

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 3.6), mats.contactShadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.015, 0.2);
  group.add(shadow);

  // Main bar counter base
  const counterBase = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.02, 0.85), mats.mahogany);
  counterBase.position.set(0, 0.51, 0.5);
  counterBase.castShadow = true;
  group.add(counterBase);

  // Honed marble bar top
  const barTop = new THREE.Mesh(new THREE.BoxGeometry(6.45, 0.09, 1.05), mats.barMarble);
  barTop.position.set(0, 1.065, 0.52);
  barTop.castShadow = true;
  group.add(barTop);

  // Brass footrail
  const footRail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 6.1, 12), mats.brushedBrass);
  footRail.rotation.z = Math.PI / 2;
  footRail.position.set(0, 0.18, 1.04);
  group.add(footRail);

  // 4 leather barstools along front
  [-2.1, -0.7, 0.7, 2.1].forEach((bx) => {
    const stool = buildBarstool(mats, mats.espressoLeather);
    stool.position.set(bx, 0, 1.48);
    group.add(stool);
  });

  // Back-bar bottle cabinet & glowing amber backdrop
  const backCab = new THREE.Mesh(new THREE.BoxGeometry(6.0, 2.8, 0.45), mats.mahogany);
  backCab.position.set(0, 1.4, -0.95);
  group.add(backCab);

  const glowBackMat = new THREE.MeshStandardMaterial({
    color: 0x3b1d0c,
    emissive: 0x92400e,
    emissiveIntensity: 0.9,
    roughness: 0.4,
  });
  const glowBack = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 1.45), glowBackMat);
  glowBack.position.set(0, 1.85, -0.71);
  group.add(glowBack);

  const bottleMats = [mats.amberGlass, mats.emeraldGlass, mats.rubyGlass];
  const bottleGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.28, 10);
  const neckGeo = new THREE.CylinderGeometry(0.02, 0.03, 0.1, 8);

  [1.35, 1.95].forEach((shelfY) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.04, 0.28), mats.brushedBrass);
    shelf.position.set(0, shelfY, -0.62);
    group.add(shelf);

    for (let i = 0; i < 10; i++) {
      const bMat = bottleMats[(i + Math.round(shelfY)) % bottleMats.length];
      const bottle = new THREE.Group();
      bottle.position.set(-2.25 + i * 0.5, shelfY + 0.16, -0.62);
      const body = new THREE.Mesh(bottleGeo, bMat);
      const neck = new THREE.Mesh(neckGeo, bMat);
      neck.position.y = 0.18;
      bottle.add(body, neck);
      group.add(bottle);
    }
  });

  // Cocktail shaker & glasses on bar top
  const shakerGroup = new THREE.Group();
  shakerGroup.position.set(-0.9, 1.22, 0.5);
  const shaker = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.042, 0.22, 12), mats.chrome);
  const shakerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.045, 0.07, 12), mats.brushedBrass);
  shakerCap.position.y = 0.14;
  shakerGroup.add(shaker, shakerCap);
  group.add(shakerGroup);

  [-0.5, 0.8, 1.2].forEach((gx) => {
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.11, 12), mats.amberGlass);
    glass.position.set(gx, 1.165, 0.62);
    group.add(glass);
  });

  const servedGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.035, 0.13, 14), mats.rubyGlass);
  servedGlass.position.set(0, 1.175, 0.25);
  group.add(servedGlass);

  return { group, shakerGroup, servedGlass, glowBackMat };
}

function buildPalmPlanter(mats: MaterialLibrary): { group: THREE.Group; crown: THREE.Group } {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.72, 14), mats.brushedBrass);
  pot.position.y = 0.36;
  pot.castShadow = true;
  g.add(pot);

  const crown = new THREE.Group();
  crown.position.y = 0.68;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.35, 5), mats.palmFoliage);
    frond.position.set(Math.cos(a) * 0.24, 0.52, Math.sin(a) * 0.24);
    frond.rotation.z = -Math.cos(a) * 0.52;
    frond.rotation.x = Math.sin(a) * 0.52;
    crown.add(frond);
  }
  g.add(crown);
  return { group: g, crown };
}

function buildLoungeBooth(mats: MaterialLibrary): THREE.Group {
  const g = new THREE.Group();
  const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.85), mats.velvetRope);
  sofaBase.position.y = 0.225;
  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.75, 0.22), mats.velvetRope);
  sofaBack.position.set(0, 0.65, -0.32);
  const table = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.05, 18), mats.barMarble);
  table.position.set(0, 0.48, 0.92);
  const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 0.46, 12), mats.brushedBrass);
  tableLeg.position.set(0, 0.23, 0.92);
  g.add(sofaBase, sofaBack, table, tableLeg);
  return g;
}

export function buildSalonArchitecture(mats: MaterialLibrary): SalonArchitectureRig {
  const group = new THREE.Group();

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(42, 42), mats.marbleFloor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  const carpet = new THREE.Mesh(new THREE.CylinderGeometry(10.8, 10.8, 0.02, 8), mats.carpetIsland);
  carpet.position.y = 0.01;
  carpet.receiveShadow = true;
  group.add(carpet);

  const border = new THREE.Mesh(new THREE.TorusGeometry(10.8, 0.06, 10, 8), mats.brushedBrass);
  border.rotation.x = Math.PI / 2;
  border.rotation.z = Math.PI / 8;
  border.position.y = 0.025;
  group.add(border);

  const wallRadius = 16.5;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(14.0, 9.0, 0.5), mats.wallPanel);
    wall.position.set(Math.sin(angle) * wallRadius, 4.5, Math.cos(angle) * wallRadius);
    wall.rotation.y = angle;
    group.add(wall);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.12, 0.56), mats.brushedBrass);
    trim.position.set(Math.sin(angle) * wallRadius, 1.5, Math.cos(angle) * wallRadius);
    trim.rotation.y = angle;
    group.add(trim);

    // Art-deco wall sconce
    const sconce = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.55, 0.18), mats.crystalBulb);
    sconce.position.set(Math.sin(angle) * (wallRadius - 0.35), 3.6, Math.cos(angle) * (wallRadius - 0.35));
    sconce.rotation.y = angle;
    group.add(sconce);
  }

  // 8 Fluted Columns with brass capitals
  const colShaftGeo = new THREE.CylinderGeometry(0.42, 0.48, 8.2, 16);
  const colCapGeo = new THREE.CylinderGeometry(0.68, 0.44, 0.32, 16);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 8;
    const cx = Math.sin(a) * 12.6;
    const cz = Math.cos(a) * 12.6;
    const colGroup = new THREE.Group();
    colGroup.position.set(cx, 0, cz);
    const shaft = new THREE.Mesh(colShaftGeo, mats.mahogany);
    shaft.position.y = 4.1;
    shaft.castShadow = true;
    const base = new THREE.Mesh(colCapGeo, mats.brushedBrass);
    base.position.y = 0.16;
    const cap = new THREE.Mesh(colCapGeo, mats.brushedBrass);
    cap.rotation.x = Math.PI;
    cap.position.y = 8.05;
    colGroup.add(shaft, base, cap);
    group.add(colGroup);
  }

  // Grand Suspended Brass Ring Chandelier
  const chandelier = new THREE.Group();
  chandelier.position.set(0, 6.4, 0);
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.08, 12, 48), mats.brushedBrass);
  outerRing.rotation.x = Math.PI / 2;
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.06, 12, 36), mats.brushedBrass);
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.y = -0.4;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 12), mats.brushedBrass);
  stem.position.y = 1.3;
  chandelier.add(outerRing, innerRing, stem);

  const bulbGeo = new THREE.SphereGeometry(0.11, 10, 10);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const bulb = new THREE.Mesh(bulbGeo, mats.crystalBulb);
    bulb.position.set(Math.cos(a) * 2.7, -0.14, Math.sin(a) * 2.7);
    chandelier.add(bulb);
  }
  group.add(chandelier);

  // Floating warm golden dust motes beneath chandelier
  const moteCount = 64;
  const motePositions = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    const angle = (i / moteCount) * Math.PI * 2 * 3.7;
    const radius = 0.6 + ((i * 19) % 100) / 14;
    motePositions[i * 3] = Math.cos(angle) * radius;
    motePositions[i * 3 + 1] = 1.2 + ((i * 29) % 48) / 10;
    motePositions[i * 3 + 2] = Math.sin(angle) * radius - 1.2;
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
  const dustMaterial = new THREE.PointsMaterial({
    color: 0xfde68a,
    size: 0.06,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const dustMotes = new THREE.Points(moteGeo, dustMaterial);
  group.add(dustMotes);

  // Decorative Corner Planters
  const planterCoords: [number, number][] = [
    [-9.5, -8.5],
    [9.5, -8.5],
    [-9.5, 7.5],
    [9.5, 7.5],
  ];
  const palmCrowns: THREE.Group[] = [];
  planterCoords.forEach(([px, pz]) => {
    const palm = buildPalmPlanter(mats);
    palm.group.position.set(px, 0, pz);
    group.add(palm.group);
    palmCrowns.push(palm.crown);
  });

  // VIP Lounge Booths flanking the rear
  const boothL = buildLoungeBooth(mats);
  boothL.position.set(-8.6, 0, 2.8);
  boothL.rotation.y = Math.PI / 2;
  const boothR = buildLoungeBooth(mats);
  boothR.position.set(8.6, 0, 2.8);
  boothR.rotation.y = -Math.PI / 2;
  group.add(boothL, boothR);

  // Velvet Stanchions at front entrance
  [
    [-2.4, 7.6],
    [2.4, 7.6],
  ].forEach(([sx, sz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.95, 12), mats.brushedBrass);
    post.position.set(sx, 0.475, sz);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.06, 16), mats.brushedBrass);
    base.position.set(sx, 0.03, sz);
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), mats.brushedBrass);
    finial.position.set(sx, 0.98, sz);
    group.add(post, base, finial);
  });

  const ropeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.4, 0.88, 7.6),
    new THREE.Vector3(0, 0.62, 7.6),
    new THREE.Vector3(2.4, 0.88, 7.6),
  ]);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(ropeCurve, 16, 0.03, 8, false), mats.velvetRope));

  return { group, chandelier, chandelierInnerRing: innerRing, palmCrowns, dustMotes, dustMaterial };
}
