import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { Card } from '../casino/blackjack';
import { getWheelAngleForNumber, type RouletteBet } from '../casino/roulette';
import { SLOT_THEMES, type SlotThemeId } from '../casino/slots';
import { casinoAudio } from '../audio/casinoAudio';
import { createMaterialLibrary, type MaterialLibrary } from './materials';
import {
  buildBarArea,
  buildBlackjackTable,
  buildChipMesh,
  buildPokerTable,
  buildRouletteTable,
  buildSalonArchitecture,
  buildThemedSlotMachine,
  type BarRig,
  type BlackjackRig,
  type PokerRig,
  type RouletteRig,
  type SalonArchitectureRig,
  type SlotMachineRig,
} from './models';

export type CasinoStation = 'overview' | 'roulette' | 'blackjack' | 'poker' | 'slots' | 'bar';
export type SceneMode = 'title' | 'playing';

const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _pointerNdc = new THREE.Vector2();
const _moveForward = new THREE.Vector3();
const _moveRight = new THREE.Vector3();
const _moveDelta = new THREE.Vector3();

const CAMERA_PRESETS: Record<
  CasinoStation,
  { pos: [number, number, number]; look: [number, number, number] }
> = {
  overview: { pos: [0, 7.4, 12.2], look: [0, 1.1, -1.6] },
  roulette: { pos: [0.15, 3.65, 3.85], look: [-0.25, 1.06, 0.45] },
  blackjack: { pos: [-4.1, 3.15, 2.35], look: [-5.6, 1.06, -0.85] },
  poker: { pos: [-3.2, 3.4, -2.5], look: [-4.6, 1.05, -5.8] },
  slots: { pos: [3.8, 2.15, 2.1], look: [5.4, 1.62, -0.8] },
  bar: { pos: [0, 2.7, -4.6], look: [0, 1.5, -8.8] },
};

const SLOT_CAMERA_PRESETS: Record<
  SlotThemeId,
  { pos: [number, number, number]; look: [number, number, number] }
> = {
  classic: { pos: [2.6, 2.1, 1.3], look: [4.2, 1.62, -1.7] },
  treasure: { pos: [3.8, 2.1, 2.1], look: [5.4, 1.62, -0.8] },
  futuristic: { pos: [5.0, 2.1, 2.9], look: [6.6, 1.62, 0.1] },
};

export function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class CasinoSceneEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private mats: MaterialLibrary;
  private isSoftwareGl: boolean;

  private salonRig: SalonArchitectureRig;
  private rouletteRig: RouletteRig;
  private blackjackRig: BlackjackRig;
  private pokerRig: PokerRig;
  private slotRigs: Record<SlotThemeId, SlotMachineRig>;
  private barRig: BarRig;
  private interactables: THREE.Object3D[] = [];

  private chandelierLight!: THREE.PointLight;
  private westSpotLight!: THREE.PointLight;
  private eastSpotLight!: THREE.PointLight;
  private barSpotLight!: THREE.PointLight;

  private mode: SceneMode = 'title';
  private activeStation: CasinoStation = 'overview';
  private activeSlotTheme: SlotThemeId = 'classic';
  private cameraTransitionActive = false;
  private onStationSelect?: (station: CasinoStation, slotTheme?: SlotThemeId) => void;
  private onContextIssue?: (lost: boolean) => void;

  private raycaster = new THREE.Raycaster();
  private keysHeld = new Set<string>();
  private lastTimeMs = performance.now();
  private totalElapsed = 0;
  private frameId = 0;
  private disposed = false;

  private rouletteSpin = {
    active: false,
    elapsed: 0,
    duration: 4.0,
    startRotorAngle: 0,
    targetRotorAngle: 0,
    startBallAngle: 0,
    targetBallAngle: 0,
    lastTickStep: 0,
    onDone: null as (() => void) | null,
  };

  private slotSpin = {
    active: false,
    themeId: 'classic' as SlotThemeId,
    elapsed: 0,
    reelStopTimes: [1.3, 1.9, 2.5],
    reelStopped: [false, false, false],
    startAngles: [0, 0, 0],
    targetAngles: [0, 0, 0],
    leverElapsed: 0,
    winCelebration: 0,
    celebrateTheme: 'classic' as SlotThemeId,
    onDone: null as (() => void) | null,
  };

  private barServe = {
    active: false,
    elapsed: 0,
    duration: 2.1,
  };

  private tableCelebrate = {
    station: null as 'roulette' | 'blackjack' | 'poker' | null,
    remaining: 0,
  };

  private cardAnims: Array<{
    mesh: THREE.Object3D;
    elapsed: number;
    duration: number;
    fromX: number;
    fromY: number;
    fromZ: number;
    toX: number;
    toY: number;
    toZ: number;
    flip: boolean;
  }> = [];

  private chipAnims: Array<{
    mesh: THREE.Object3D;
    elapsed: number;
    duration: number;
    targetY: number;
  }> = [];

  private prevRouletteChipCount = 0;
  private prevBlackjackCounts = { player: 0, dealer: 0, dealerFaceUp: 0, chips: 0 };
  private prevPokerCounts = { community: 0, player: 0, dealer: 0, dealerFaceUp: 0, chips: 0 };

  constructor(
    container: HTMLElement,
    options: {
      onStationSelect?: (station: CasinoStation, slotTheme?: SlotThemeId) => void;
      onContextIssue?: (lost: boolean) => void;
    } = {},
  ) {
    this.container = container;
    this.onStationSelect = options.onStationSelect;
    this.onContextIssue = options.onContextIssue;
    this.isSoftwareGl = detectSoftwareWebGL();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b080f);
    this.scene.fog = new THREE.FogExp2(0x0b080f, 0.022);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 80);
    this.camera.position.set(...CAMERA_PRESETS.overview.pos);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(...CAMERA_PRESETS.overview.look);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.07;
    this.controls.maxPolarAngle = Math.PI * 0.46;
    this.controls.minPolarAngle = Math.PI * 0.12;
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 16.5;
    this.controls.addEventListener('start', () => {
      this.cameraTransitionActive = false;
    });

    this.setupLighting();
    this.mats = createMaterialLibrary(this.renderer);

    this.salonRig = buildSalonArchitecture(this.mats);
    this.scene.add(this.salonRig.group);

    this.rouletteRig = buildRouletteTable(this.mats);
    this.rouletteRig.group.position.set(0, 0, 0.45);
    this.scene.add(this.rouletteRig.group);

    this.blackjackRig = buildBlackjackTable(this.mats);
    this.blackjackRig.group.position.set(-5.6, 0, -0.85);
    this.blackjackRig.group.rotation.y = 0.48;
    this.scene.add(this.blackjackRig.group);

    this.pokerRig = buildPokerTable(this.mats);
    this.pokerRig.group.position.set(-4.6, 0, -5.8);
    this.pokerRig.group.rotation.y = 0.35;
    this.scene.add(this.pokerRig.group);

    const classicRig = buildThemedSlotMachine(this.mats, 'classic');
    classicRig.group.position.set(4.2, 0, -1.7);
    classicRig.group.rotation.y = -0.5;

    const treasureRig = buildThemedSlotMachine(this.mats, 'treasure');
    treasureRig.group.position.set(5.4, 0, -0.8);
    treasureRig.group.rotation.y = -0.5;

    const futuristicRig = buildThemedSlotMachine(this.mats, 'futuristic');
    futuristicRig.group.position.set(6.6, 0, 0.1);
    futuristicRig.group.rotation.y = -0.5;

    this.slotRigs = {
      classic: classicRig,
      treasure: treasureRig,
      futuristic: futuristicRig,
    };
    this.scene.add(classicRig.group, treasureRig.group, futuristicRig.group);

    this.barRig = buildBarArea(this.mats);
    this.barRig.group.position.set(0, 0, -8.8);
    this.scene.add(this.barRig.group);

    this.interactables = [
      this.rouletteRig.group,
      this.blackjackRig.group,
      this.pokerRig.group,
      classicRig.group,
      treasureRig.group,
      futuristicRig.group,
      this.barRig.group,
    ];

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.startLoop();
  }

  private setupLighting() {
    const hemi = new THREE.HemisphereLight(0xa3b8e8, 0x261510, 0.72);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffe7bd, 1.9);
    keyLight.position.set(5.0, 11.5, 6.5);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -11;
    keyLight.shadow.camera.right = 11;
    keyLight.shadow.camera.top = 11;
    keyLight.shadow.camera.bottom = -11;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    this.chandelierLight = new THREE.PointLight(0xffcb78, 14, 22, 1.5);
    this.chandelierLight.position.set(0, 5.4, 0);
    this.scene.add(this.chandelierLight);

    this.westSpotLight = new THREE.PointLight(0xffdfb0, 8, 13, 1.5);
    this.westSpotLight.position.set(-4.8, 4.0, -3.2);
    this.scene.add(this.westSpotLight);

    this.eastSpotLight = new THREE.PointLight(0xffd28a, 8, 13, 1.5);
    this.eastSpotLight.position.set(5.2, 3.8, -0.8);
    this.scene.add(this.eastSpotLight);

    this.barSpotLight = new THREE.PointLight(0xffb86c, 9, 12, 1.5);
    this.barSpotLight.position.set(0, 3.2, -8.2);
    this.scene.add(this.barSpotLight);
  }

  private handleResize = () => {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.render(this.scene, this.camera);
  };

  private pointerDownPos = { x: 0, y: 0 };

  private handlePointerDown = (e: PointerEvent) => {
    this.pointerDownPos.x = e.clientX;
    this.pointerDownPos.y = e.clientY;
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (this.mode !== 'playing') return;
    const dx = e.clientX - this.pointerDownPos.x;
    const dy = e.clientY - this.pointerDownPos.y;
    if (Math.hypot(dx, dy) > 6) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(_pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactables, true);
    if (hits.length > 0) {
      let obj: THREE.Object3D | null = hits[0].object;
      while (obj && !obj.userData.station) {
        obj = obj.parent;
      }
      const station = obj?.userData.station as CasinoStation | undefined;
      const slotTheme = obj?.userData.slotTheme as SlotThemeId | undefined;
      if (station) {
        this.focusStation(station, slotTheme);
        this.onStationSelect?.(station, slotTheme);
      }
    }
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
      return;
    }
    this.keysHeld.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysHeld.delete(e.code);
  };

  private handleBlur = () => {
    this.keysHeld.clear();
  };

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.onContextIssue?.(true);
  };

  private handleContextRestored = () => {
    this.onContextIssue?.(false);
  };

  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  public setMode(mode: SceneMode) {
    this.mode = mode;
    if (mode === 'playing') {
      this.focusStation(this.activeStation, this.activeSlotTheme);
    }
  }

  public focusStation(station: CasinoStation, slotTheme?: SlotThemeId) {
    this.activeStation = station;
    if (slotTheme) {
      this.activeSlotTheme = slotTheme;
    }
    this.cameraTransitionActive = true;
  }

  public syncRouletteChips(bets: RouletteBet[]) {
    while (this.rouletteRig.chipsGroup.children.length > 0) {
      this.rouletteRig.chipsGroup.remove(this.rouletteRig.chipsGroup.children[0]);
    }
    const maxChips = Math.min(bets.length, 14);
    for (let i = 0; i < maxChips; i++) {
      const bet = bets[i];
      const color =
        bet.amount >= 500
          ? 0xd4af37
          : bet.amount >= 100
            ? 0x18181b
            : bet.amount >= 25
              ? 0x15803d
              : 0xb91c1c;
      const chip = buildChipMesh(color);
      const col = i % 5;
      const row = Math.floor(i / 5);
      const targetY = 0.015;
      const isNew = i >= this.prevRouletteChipCount;
      chip.position.set(0.15 + col * 0.34, isNew ? targetY + 0.32 : targetY, -0.35 + row * 0.35);
      this.rouletteRig.chipsGroup.add(chip);
      if (isNew) {
        this.chipAnims.push({
          mesh: chip,
          elapsed: 0,
          duration: 0.34,
          targetY,
        });
      }
    }
    this.prevRouletteChipCount = maxChips;
  }

  private renderCardStack(
    cards: Card[],
    targetGroup: THREE.Group,
    spread: number,
    prevCount: number,
    prevFaceUpCount: number,
    dealOrigin: [number, number, number],
  ) {
    while (targetGroup.children.length > 0) {
      targetGroup.remove(targetGroup.children[0]);
    }
    const cardGeo = new THREE.BoxGeometry(0.28, 0.008, 0.4);
    const startX = -((cards.length - 1) * spread) / 2;
    cards.forEach((card, idx) => {
      const topMat = card.faceUp ? this.mats.getCardFaceMaterial(card) : this.mats.cardBack;
      const sideMat = this.mats.ivoryBall;
      const mesh = new THREE.Mesh(cardGeo, [
        sideMat,
        sideMat,
        topMat,
        this.mats.cardBack,
        sideMat,
        sideMat,
      ]);
      const toX = startX + idx * spread;
      const toY = idx * 0.004;
      const toZ = idx * 0.02;
      mesh.rotation.y = (idx - (cards.length - 1) / 2) * 0.04;
      mesh.castShadow = true;

      const isNewCard = idx >= prevCount;
      const justFlipped = !isNewCard && card.faceUp && idx >= prevFaceUpCount;

      if (isNewCard) {
        mesh.position.set(dealOrigin[0], dealOrigin[1], dealOrigin[2]);
        this.cardAnims.push({
          mesh,
          elapsed: -(idx - prevCount) * 0.09,
          duration: 0.38,
          fromX: dealOrigin[0],
          fromY: dealOrigin[1],
          fromZ: dealOrigin[2],
          toX,
          toY,
          toZ,
          flip: false,
        });
      } else if (justFlipped) {
        mesh.position.set(toX, toY, toZ);
        this.cardAnims.push({
          mesh,
          elapsed: 0,
          duration: 0.36,
          fromX: toX,
          fromY: toY,
          fromZ: toZ,
          toX,
          toY,
          toZ,
          flip: true,
        });
      } else {
        mesh.position.set(toX, toY, toZ);
      }
      targetGroup.add(mesh);
    });
  }

  public syncBlackjackTable(playerHand: Card[], dealerHand: Card[], bet: number) {
    const dealerFaceUp = dealerHand.filter((c) => c.faceUp).length;
    this.renderCardStack(
      dealerHand,
      this.blackjackRig.dealerCardsGroup,
      0.24,
      this.prevBlackjackCounts.dealer,
      this.prevBlackjackCounts.dealerFaceUp,
      [1.2, 0.14, -0.2],
    );
    this.renderCardStack(
      playerHand,
      this.blackjackRig.playerCardsGroup,
      0.24,
      this.prevBlackjackCounts.player,
      playerHand.length,
      [1.2, 0.18, -0.8],
    );
    this.prevBlackjackCounts.dealer = dealerHand.length;
    this.prevBlackjackCounts.dealerFaceUp = dealerFaceUp;
    this.prevBlackjackCounts.player = playerHand.length;

    while (this.blackjackRig.chipStackGroup.children.length > 0) {
      this.blackjackRig.chipStackGroup.remove(this.blackjackRig.chipStackGroup.children[0]);
    }
    const stacks = bet > 0 ? Math.min(6, Math.max(1, Math.ceil(bet / 50))) : 0;
    for (let i = 0; i < stacks; i++) {
      const chip = buildChipMesh(i % 2 === 0 ? 0xd4af37 : 0xb91c1c, 0.08);
      const targetY = i * 0.022;
      const isNew = i >= this.prevBlackjackCounts.chips;
      chip.position.y = isNew ? targetY + 0.28 : targetY;
      this.blackjackRig.chipStackGroup.add(chip);
      if (isNew) {
        this.chipAnims.push({ mesh: chip, elapsed: -i * 0.04, duration: 0.3, targetY });
      }
    }
    this.prevBlackjackCounts.chips = stacks;
  }

  public syncPokerTable(
    community: Card[],
    playerHole: Card[],
    dealerHole: Card[],
    potAmount: number,
  ) {
    const dealerFaceUp = dealerHole.filter((c) => c.faceUp).length;
    this.renderCardStack(
      community,
      this.pokerRig.communityCardsGroup,
      0.34,
      this.prevPokerCounts.community,
      community.length,
      [0, 0.18, -0.6],
    );
    this.renderCardStack(
      playerHole,
      this.pokerRig.playerHoleGroup,
      0.3,
      this.prevPokerCounts.player,
      playerHole.length,
      [0, 0.18, -1.2],
    );
    this.renderCardStack(
      dealerHole,
      this.pokerRig.dealerHoleGroup,
      0.3,
      this.prevPokerCounts.dealer,
      this.prevPokerCounts.dealerFaceUp,
      [0, 0.14, 0.1],
    );
    this.prevPokerCounts.community = community.length;
    this.prevPokerCounts.player = playerHole.length;
    this.prevPokerCounts.dealer = dealerHole.length;
    this.prevPokerCounts.dealerFaceUp = dealerFaceUp;

    while (this.pokerRig.potChipsGroup.children.length > 0) {
      this.pokerRig.potChipsGroup.remove(this.pokerRig.potChipsGroup.children[0]);
    }
    const stacks = potAmount > 0 ? Math.min(7, Math.max(1, Math.ceil(potAmount / 50))) : 0;
    for (let i = 0; i < stacks; i++) {
      const chip = buildChipMesh(i % 2 === 0 ? 0x0ea5e9 : 0xd4af37, 0.08);
      const targetY = i * 0.022;
      const isNew = i >= this.prevPokerCounts.chips;
      chip.position.y = isNew ? targetY + 0.28 : targetY;
      this.pokerRig.potChipsGroup.add(chip);
      if (isNew) {
        this.chipAnims.push({ mesh: chip, elapsed: -i * 0.04, duration: 0.3, targetY });
      }
    }
    this.prevPokerCounts.chips = stacks;
  }

  public triggerBarServe() {
    this.barServe.active = true;
    this.barServe.elapsed = 0;
  }

  public triggerTableCelebration(station: 'roulette' | 'blackjack' | 'poker') {
    this.tableCelebrate.station = station;
    this.tableCelebrate.remaining = 2.0;
  }

  public triggerRouletteSpin(winningNumber: number, onDone: () => void) {
    const pocketAngle = getWheelAngleForNumber(winningNumber);
    const currentRotor = this.rouletteRig.rotor.rotation.y;
    const targetRotor = currentRotor + Math.PI * 6;
    const finalWorldPocketAngle = targetRotor + pocketAngle;
    const startBall = this.rouletteRig.ballPivot.rotation.y;
    const targetBall =
      finalWorldPocketAngle - Math.PI * 10 - (finalWorldPocketAngle % (Math.PI * 2)) +
      (finalWorldPocketAngle % (Math.PI * 2));

    this.rouletteSpin = {
      active: true,
      elapsed: 0,
      duration: 4.0,
      startRotorAngle: currentRotor,
      targetRotorAngle: targetRotor,
      startBallAngle: startBall,
      targetBallAngle: targetBall,
      lastTickStep: 0,
      onDone,
    };
  }

  public triggerSlotSpin(
    themeId: SlotThemeId,
    indices: [number, number, number],
    isWin: boolean,
    onDone: () => void,
  ) {
    const rig = this.slotRigs[themeId];
    const stopCount = SLOT_THEMES[themeId].strip.length;
    const step = (Math.PI * 2) / stopCount;

    this.slotSpin.active = true;
    this.slotSpin.themeId = themeId;
    this.slotSpin.elapsed = 0;
    this.slotSpin.leverElapsed = 0;
    this.slotSpin.reelStopped = [false, false, false];
    this.slotSpin.onDone = () => {
      if (isWin) {
        this.slotSpin.winCelebration = 2.4;
        this.slotSpin.celebrateTheme = themeId;
      }
      onDone();
    };

    indices.forEach((stopIdx, r) => {
      const current = rig.reels[r].rotation.x;
      const desiredMod = (stopIdx + 0.5) * step;
      const baseTurns = Math.ceil(current / (Math.PI * 2)) * (Math.PI * 2);
      const extraTurns = (4 + r * 2) * Math.PI * 2;
      this.slotSpin.startAngles[r] = current;
      this.slotSpin.targetAngles[r] = baseTurns + extraTurns + desiredMod;
    });
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    if (!sync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const poll = () => {
      if (this.disposed) {
        gl.deleteSync(sync);
        return;
      }
      const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private startLoop() {
    const tick = () => {
      if (this.disposed) return;
      const now = performance.now();
      const rawDt = (now - this.lastTimeMs) / 1000;
      this.lastTimeMs = now;
      const maxDt = this.isSoftwareGl ? 0.25 : 0.05;
      const dt = Math.min(Math.max(rawDt, 0.001), maxDt);
      const animDt = Math.min(Math.max(rawDt, 0.001), 1.5);
      this.totalElapsed += dt;

      this.updateScene(dt, animDt, this.totalElapsed);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    // Render frame 1 immediately so Title / Overview appears on first paint
    tick();
  }

  private updateScene(dt: number, animDt: number, elapsed: number) {
    // 1. Ambient salon architecture motion (chandelier, palms, dust motes, neon & bar glow)
    this.salonRig.chandelier.rotation.y += dt * 0.14;
    this.salonRig.chandelier.rotation.z = Math.sin(elapsed * 0.45) * 0.012;
    this.salonRig.chandelierInnerRing.rotation.y -= dt * 0.28;

    for (let i = 0; i < this.salonRig.palmCrowns.length; i++) {
      this.salonRig.palmCrowns[i].rotation.z = Math.sin(elapsed * 1.15 + i * 1.4) * 0.032;
      this.salonRig.palmCrowns[i].rotation.x = Math.cos(elapsed * 0.9 + i * 1.1) * 0.024;
    }

    const moteAttr = this.salonRig.dustMotes.geometry.getAttribute('position') as THREE.BufferAttribute;
    const moteArr = moteAttr.array as Float32Array;
    for (let i = 0; i < moteArr.length; i += 3) {
      moteArr[i + 1] += dt * (0.14 + (i % 5) * 0.025);
      if (moteArr[i + 1] > 6.1) {
        moteArr[i + 1] = 1.15;
      }
    }
    moteAttr.needsUpdate = true;

    this.mats.cyanNeon.emissiveIntensity = 0.85 + Math.sin(elapsed * 2.4) * 0.3;
    this.barRig.glowBackMat.emissiveIntensity = 0.82 + Math.sin(elapsed * 1.4) * 0.16;

    // Slot idle topper choreography
    this.slotRigs.classic.topper.rotation.y += dt * 0.9;
    this.slotRigs.treasure.topper.rotation.y += dt * 0.5;
    this.slotRigs.treasure.topper.position.y = 2.86 + Math.sin(elapsed * 1.8) * 0.04;
    this.slotRigs.futuristic.topper.rotation.y += dt * 1.4;
    this.slotRigs.futuristic.topper.rotation.x = Math.sin(elapsed * 1.6) * 0.28;

    // 2. Bar cocktail shake & counter slide animation
    if (this.barServe.active) {
      const b = this.barServe;
      b.elapsed += animDt;
      const bt = Math.min(1, b.elapsed / b.duration);

      if (bt < 0.55) {
        const shakeT = bt / 0.55;
        this.barRig.shakerGroup.position.y = 1.22 + Math.sin(shakeT * Math.PI) * 0.34;
        this.barRig.shakerGroup.rotation.z = Math.sin(shakeT * Math.PI * 10) * 0.42;
        this.barRig.servedGlass.position.set(0, 1.175, 0.25);
      } else {
        this.barRig.shakerGroup.position.y = 1.22;
        this.barRig.shakerGroup.rotation.z = 0;
        const slideT = (bt - 0.55) / 0.45;
        const easeSlide = 1 - Math.pow(1 - slideT, 3);
        this.barRig.servedGlass.position.z = THREE.MathUtils.lerp(0.25, 0.88, easeSlide);
        this.barRig.servedGlass.position.y = 1.175 + Math.sin(slideT * Math.PI) * 0.02;
      }
      if (bt >= 1) {
        b.active = false;
      }
    }

    // 3. Active card deal & flip animations
    for (let i = this.cardAnims.length - 1; i >= 0; i--) {
      const ca = this.cardAnims[i];
      ca.elapsed += animDt;
      if (ca.elapsed < 0) continue;
      const t = Math.min(1, ca.elapsed / ca.duration);
      const ease = 1 - Math.pow(1 - t, 3);
      ca.mesh.position.x = THREE.MathUtils.lerp(ca.fromX, ca.toX, ease);
      ca.mesh.position.z = THREE.MathUtils.lerp(ca.fromZ, ca.toZ, ease);
      ca.mesh.position.y = THREE.MathUtils.lerp(ca.fromY, ca.toY, ease) + Math.sin(t * Math.PI) * 0.16;
      if (ca.flip) {
        ca.mesh.rotation.z = (1 - ease) * Math.PI;
      }
      if (t >= 1) {
        ca.mesh.position.set(ca.toX, ca.toY, ca.toZ);
        ca.mesh.rotation.z = 0;
        this.cardAnims.splice(i, 1);
      }
    }

    // 4. Active chip drop-bounce animations
    for (let i = this.chipAnims.length - 1; i >= 0; i--) {
      const ch = this.chipAnims[i];
      ch.elapsed += animDt;
      if (ch.elapsed < 0) continue;
      const t = Math.min(1, ch.elapsed / ch.duration);
      const bounce = Math.abs(Math.sin(t * Math.PI * 2.2)) * (1 - t) * 0.09;
      ch.mesh.position.y = THREE.MathUtils.lerp(ch.targetY + 0.3, ch.targetY, t) + bounce;
      if (t >= 1) {
        ch.mesh.position.y = ch.targetY;
        this.chipAnims.splice(i, 1);
      }
    }

    // 5. Table celebration lighting pulse
    let chandelierBase = 13.8 + Math.sin(elapsed * 2.1) * 1.1;
    let westBase = 8.0;
    let eastBase = 8.0;
    if (this.tableCelebrate.remaining > 0) {
      this.tableCelebrate.remaining = Math.max(0, this.tableCelebrate.remaining - animDt);
      const pulse = Math.abs(Math.sin(elapsed * 14)) * 7.5 * (this.tableCelebrate.remaining / 2.0);
      if (this.tableCelebrate.station === 'roulette') {
        chandelierBase += pulse;
      } else {
        westBase += pulse;
      }
    }
    this.chandelierLight.intensity = chandelierBase;
    this.westSpotLight.intensity = westBase;

    // 6. Roulette wheel animation
    if (!this.rouletteSpin.active) {
      this.rouletteRig.rotor.rotation.y += dt * 0.25;
      this.rouletteRig.ballPivot.rotation.y += dt * 0.25;
      this.rouletteRig.ball.position.set(0, 0.04, -0.58);
    } else {
      const s = this.rouletteSpin;
      s.elapsed += animDt;
      const t = Math.min(1, s.elapsed / s.duration);
      const easeOut = 1 - Math.pow(1 - t, 3);

      this.rouletteRig.rotor.rotation.y = THREE.MathUtils.lerp(
        s.startRotorAngle,
        s.targetRotorAngle,
        easeOut,
      );
      this.rouletteRig.ballPivot.rotation.y = THREE.MathUtils.lerp(
        s.startBallAngle,
        s.targetBallAngle,
        easeOut,
      );

      const dropT = THREE.MathUtils.smoothstep(t, 0.52, 0.92);
      const bounce = t > 0.72 && t < 0.96 ? Math.abs(Math.sin(t * 42)) * 0.045 * (1 - t) : 0;
      const radius = THREE.MathUtils.lerp(0.84, 0.58, dropT);
      const height = THREE.MathUtils.lerp(0.11, 0.04, dropT) + bounce;
      this.rouletteRig.ball.position.set(0, height, -radius);

      const tickStep = Math.floor(t * 28);
      if (tickStep > s.lastTickStep && t < 0.92) {
        s.lastTickStep = tickStep;
        casinoAudio.playWheelTick(1 - t);
      }

      if (t >= 1) {
        s.active = false;
        const done = s.onDone;
        s.onDone = null;
        done?.();
      }
    }

    // 7. Slot reels & lever animation (with realistic mechanical detent overshoot)
    if (this.slotSpin.active) {
      const s = this.slotSpin;
      const rig = this.slotRigs[s.themeId];
      s.elapsed += animDt;
      s.leverElapsed += animDt;

      const leverT = Math.min(1, s.leverElapsed / 0.65);
      rig.leverPivot.rotation.x = Math.sin(leverT * Math.PI) * 1.1;

      let allDone = true;
      for (let r = 0; r < 3; r++) {
        const dur = s.reelStopTimes[r];
        const rt = Math.min(1, s.elapsed / dur);
        const c1 = 0.65;
        const c3 = c1 + 1;
        const ease = rt >= 1 ? 1 : 1 + c3 * Math.pow(rt - 1, 3) + c1 * Math.pow(rt - 1, 2);
        rig.reels[r].rotation.x = THREE.MathUtils.lerp(
          s.startAngles[r],
          s.targetAngles[r],
          ease,
        );
        if (rt >= 1 && !s.reelStopped[r]) {
          s.reelStopped[r] = true;
          casinoAudio.playReelStop(r);
        }
        if (rt < 1) allDone = false;
      }

      if (allDone) {
        s.active = false;
        rig.leverPivot.rotation.x = 0;
        const done = s.onDone;
        s.onDone = null;
        done?.();
      }
    }

    // 8. Slot winning beacon & payout tray coin cascade
    if (this.slotSpin.winCelebration > 0) {
      this.slotSpin.winCelebration = Math.max(0, this.slotSpin.winCelebration - animDt);
      const rig = this.slotRigs[this.slotSpin.celebrateTheme];
      const activeWin = this.slotSpin.winCelebration > 0;
      rig.winBeaconMat.emissiveIntensity = activeWin
        ? 0.8 + Math.abs(Math.sin(elapsed * 16)) * 2.2
        : 0.25;
      eastBase = activeWin ? 8.0 + Math.abs(Math.sin(elapsed * 16)) * 6.5 : 8.0;

      const coins = rig.trayCoinsGroup.children;
      for (let c = 0; c < coins.length; c++) {
        if (activeWin) {
          coins[c].position.y = Math.abs(Math.sin(elapsed * 11 + c * 0.9)) * 0.14;
          coins[c].rotation.z += dt * 7;
        } else {
          coins[c].position.y = 0;
          coins[c].rotation.z = 0;
        }
      }
    }
    this.eastSpotLight.intensity = eastBase;

    // Basic WASD / Arrow floor navigation while playing
    if (this.mode === 'playing') {
      const forward =
        (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp') ? 1 : 0) -
        (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown') ? 1 : 0);
      const strafe =
        (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight') ? 1 : 0) -
        (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft') ? 1 : 0);

      if (forward !== 0 || strafe !== 0) {
        this.cameraTransitionActive = false;
        this.camera.getWorldDirection(_moveForward);
        _moveForward.y = 0;
        if (_moveForward.lengthSq() > 0.0001) _moveForward.normalize();
        _moveRight.crossVectors(_moveForward, this.camera.up).normalize();

        const speed = 5.5 * dt;
        _moveDelta
          .set(0, 0, 0)
          .addScaledVector(_moveForward, forward * speed)
          .addScaledVector(_moveRight, strafe * speed);

        this.camera.position.add(_moveDelta);
        this.controls.target.add(_moveDelta);

        // Clamp inside salon walls
        const dist = Math.hypot(this.controls.target.x, this.controls.target.z);
        if (dist > 11.5) {
          const scale = 11.5 / dist;
          const ox = this.controls.target.x * (1 - scale);
          const oz = this.controls.target.z * (1 - scale);
          this.controls.target.x *= scale;
          this.controls.target.z *= scale;
          this.camera.position.x -= ox;
          this.camera.position.z -= oz;
        }
      }
    }

    // Camera choreography
    if (this.mode === 'title') {
      const orbitAngle = elapsed * 0.14;
      _targetCamPos.set(
        Math.sin(orbitAngle) * 11.6,
        6.2 + Math.sin(elapsed * 0.25) * 0.35,
        Math.cos(orbitAngle) * 11.6,
      );
      _targetLookAt.set(0, 1.35, -1.6);
      this.camera.position.lerp(_targetCamPos, 1 - Math.exp(-3.5 * dt));
      this.controls.target.lerp(_targetLookAt, 1 - Math.exp(-3.5 * dt));
    } else if (this.cameraTransitionActive) {
      const preset =
        this.activeStation === 'slots'
          ? SLOT_CAMERA_PRESETS[this.activeSlotTheme]
          : CAMERA_PRESETS[this.activeStation];
      _targetCamPos.set(...preset.pos);
      _targetLookAt.set(...preset.look);

      const lambda = 5.5;
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _targetCamPos.x, lambda, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _targetCamPos.y, lambda, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _targetCamPos.z, lambda, dt);

      this.controls.target.x = THREE.MathUtils.damp(this.controls.target.x, _targetLookAt.x, lambda, dt);
      this.controls.target.y = THREE.MathUtils.damp(this.controls.target.y, _targetLookAt.y, lambda, dt);
      this.controls.target.z = THREE.MathUtils.damp(this.controls.target.z, _targetLookAt.z, lambda, dt);

      if (this.camera.position.distanceTo(_targetCamPos) < 0.04) {
        this.cameraTransitionActive = false;
      }
    }
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.handlePointerDown);
    canvas.removeEventListener('pointerup', this.handlePointerUp);
    canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);

    this.controls.dispose();
    this.mats.dispose();
    this.salonRig.dustMaterial.dispose();
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh || (obj as THREE.Points).isPoints) {
        (obj as THREE.Mesh).geometry.dispose();
      }
    });
    this.renderer.dispose();
    if (canvas.parentElement === this.container) {
      this.container.removeChild(canvas);
    }
  }
}
