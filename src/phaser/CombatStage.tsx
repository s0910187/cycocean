import Phaser from "phaser";
import { useEffect, useRef } from "react";
import type { CombatState, PlayerState } from "../game/types";

const nightTempleBattleUrl = new URL("../../assets/generated/backgrounds/night-temple-battle.png", import.meta.url).href;
const playerNightPatrolUrl = new URL("../../assets/generated/characters/player-night-patrol.png", import.meta.url).href;
const waterghostUrl = new URL("../../assets/generated/enemies/waterghost.png", import.meta.url).href;
const tigerlordUrl = new URL("../../assets/generated/enemies/tigerlord.png", import.meta.url).href;

interface CombatStageProps {
  combat: CombatState;
  player: PlayerState;
}

interface StageSnapshot {
  enemyKey: string;
  enemyName: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemySeal: number;
  enemyBlock: number;
  enemyIntent: string;
  playerHp: number;
  playerMaxHp: number;
  playerBlock: number;
  pulse: number;
}

class NightBattleScene extends Phaser.Scene {
  private bg?: Phaser.GameObjects.Image;
  private enemy?: Phaser.GameObjects.Image;
  private player?: Phaser.GameObjects.Container;
  private playerSprite?: Phaser.GameObjects.Image;
  private playerShadow?: Phaser.GameObjects.Ellipse;
  private fog?: Phaser.GameObjects.Particles.ParticleEmitter;
  private sealText?: Phaser.GameObjects.Text;
  private intentText?: Phaser.GameObjects.Text;
  private enemyName?: Phaser.GameObjects.Text;
  private lastEnemyKey = "";
  private lastPulse = 0;
  private playerBaseY = 0;
  private enemyBaseY = 0;
  private snapshot: StageSnapshot | null = null;

  constructor() {
    super("NightBattle");
  }

  preload() {
    this.load.image("huangmiao-bg", nightTempleBattleUrl);
    this.load.image("player-night-patrol", playerNightPatrolUrl);
    this.load.image("enemy-lantern", "/assets/enemies/lantern.svg");
    this.load.image("enemy-waterghost", waterghostUrl);
    this.load.image("enemy-templecorpse", "/assets/enemies/templecorpse.svg");
    this.load.image("enemy-foxshade", "/assets/enemies/foxshade.svg");
    this.load.image("enemy-tigerlord", tigerlordUrl);
  }

  create() {
    const { width, height } = this.scale;
    this.bg = this.add.image(width / 2, height / 2, "huangmiao-bg").setDisplaySize(width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x050707, 0.18);
    this.add.ellipse(width / 2, height * 0.83, width * 0.82, height * 0.16, 0x080909, 0.36);
    this.createPlayer();
    this.enemy = this.add.image(width * 0.74, height * 0.6, "enemy-lantern");
    this.enemy.setDisplaySize(width * 0.24, height * 0.34);
    this.enemyName = this.add.text(width * 0.74, height * 0.31, "", {
      fontFamily: "serif",
      fontSize: "28px",
      color: "#f8dfad",
      stroke: "#101010",
      strokeThickness: 5,
    }).setOrigin(0.5);
    this.sealText = this.add.text(width * 0.74, height * 0.39, "", {
      fontFamily: "serif",
      fontSize: "22px",
      color: "#ffd46f",
      stroke: "#150909",
      strokeThickness: 5,
    }).setOrigin(0.5);
    this.intentText = this.add.text(width * 0.74, height * 0.24, "", {
      fontFamily: "serif",
      fontSize: "22px",
      color: "#ffd8c8",
      stroke: "#140908",
      strokeThickness: 5,
    }).setOrigin(0.5);
    this.createMist();
    this.refresh();
  }

  update(_time: number, _delta: number) {
    if (this.player) {
      this.player.y = this.playerBaseY + Math.sin(this.time.now / 650) * 3;
    }
    if (this.enemy) {
      this.enemy.y = this.enemyBaseY + Math.sin(this.time.now / 700) * 4;
    }
  }

  setSnapshot(snapshot: StageSnapshot) {
    this.snapshot = snapshot;
    this.refresh();
  }

  private createPlayer() {
    const { width, height } = this.scale;
    const group = this.add.container(width * 0.28, height * 0.66);
    const shadow = this.add.ellipse(0, 8, 210, 40, 0x050505, 0.48);
    const glow = this.add.circle(20, -110, 92, 0x7bd6ce, 0.08);
    const sprite = this.add.image(0, 8, "player-night-patrol").setOrigin(0.5, 1);
    group.add([shadow, glow, sprite]);
    this.player = group;
    this.playerSprite = sprite;
    this.playerShadow = shadow;
  }

  private createMist() {
    const { width, height } = this.scale;
    const particles = this.add.particles(0, 0, "huangmiao-bg", {
      x: { min: -120, max: width + 120 },
      y: { min: height * 0.25, max: height * 0.72 },
      lifespan: 9000,
      speedX: { min: 8, max: 22 },
      speedY: { min: -4, max: 6 },
      alpha: { start: 0.032, end: 0 },
      scale: { start: 0.08, end: 0.18 },
      quantity: 1,
      frequency: 420,
      blendMode: Phaser.BlendModes.ADD,
    });
    this.fog = particles;
  }

  private refresh() {
    if (!this.snapshot || !this.enemy || !this.bg) return;
    const { width, height } = this.scale;
    this.bg.setDisplaySize(width, height).setPosition(width / 2, height / 2);
    if (this.snapshot.enemyKey !== this.lastEnemyKey) {
      this.enemy.setTexture(`enemy-${this.snapshot.enemyKey}`);
      this.lastEnemyKey = this.snapshot.enemyKey;
    }
    const boss = this.snapshot.enemyKey === "tigerlord";
    this.enemyBaseY = height * 0.59;
    this.playerBaseY = height * 0.66;
    this.enemy.setPosition(width * 0.74, this.enemyBaseY);
    const enemyWidth = boss ? 0.39 : this.snapshot.enemyKey === "waterghost" ? 0.22 : 0.24;
    const enemyHeight = boss ? 0.4 : this.snapshot.enemyKey === "waterghost" ? 0.42 : 0.34;
    this.enemy.setDisplaySize(width * enemyWidth, height * enemyHeight);
    this.player?.setPosition(width * 0.28, this.playerBaseY);
    this.playerSprite?.setDisplaySize(width * 0.2, height * 0.48);
    this.playerShadow?.setSize(width * 0.18, height * 0.055);
    this.enemyName?.setText(this.snapshot.enemyName).setPosition(width * 0.74, height * 0.3);
    this.sealText
      ?.setText(`符印 ${this.snapshot.enemySeal}   格挡 ${this.snapshot.enemyBlock}`)
      .setPosition(width * 0.74, height * 0.38);
    this.intentText?.setText(this.snapshot.enemyIntent).setPosition(width * 0.74, height * 0.22);
    if (this.snapshot.pulse !== this.lastPulse) {
      this.lastPulse = this.snapshot.pulse;
      this.cameras.main.shake(110, 0.004);
      this.tweens.add({
        targets: this.enemy,
        scaleX: this.enemy.scaleX * 1.04,
        scaleY: this.enemy.scaleY * 1.04,
        duration: 80,
        yoyo: true,
      });
    }
    this.fog?.setPosition(0, 0);
  }
}

export function CombatStage({ combat, player }: CombatStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) return;
    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      backgroundColor: "#07100f",
      transparent: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: "100%",
        height: "100%",
      },
      render: {
        antialias: true,
      },
      scene: NightBattleScene,
    });
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const snapshot: StageSnapshot = {
      enemyKey: combat.enemy.artKey,
      enemyName: combat.enemy.name,
      enemyHp: combat.enemy.hp,
      enemyMaxHp: combat.enemy.maxHp,
      enemySeal: combat.enemy.seal,
      enemyBlock: combat.enemy.block,
      enemyIntent: combat.enemy.intent?.label || "敌意未明",
      playerHp: player.hp,
      playerMaxHp: player.maxHp,
      playerBlock: player.block,
      pulse: combat.pulse,
    };

    const push = () => {
      const scene = gameRef.current?.scene.getScene("NightBattle") as NightBattleScene | undefined;
      scene?.setSnapshot(snapshot);
    };

    push();
    const id = window.setTimeout(push, 80);
    return () => window.clearTimeout(id);
  }, [combat, player]);

  return <div ref={hostRef} className="phaser-stage" aria-hidden="true" />;
}
