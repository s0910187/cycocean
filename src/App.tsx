import {
  AudioWaveform,
  BadgeCent,
  BookOpen,
  Home,
  Info,
  RotateCcw,
  Shield,
  SkipForward,
  Sparkles,
  Swords,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { NODE_DEFS } from "./game/content";
import {
  buyShopCard,
  buyShopRelic,
  cardCost,
  cardDef,
  cardName,
  cardText,
  chooseNode,
  cloneState,
  createGameState,
  endTurn,
  finishCinematic,
  goMap,
  heal,
  hpPercent,
  intentText,
  openRemoveCard,
  openUpgrade,
  playCard,
  removeCard,
  resolveEvent,
  restHeal,
  startRun,
  takeRewardCard,
  upgradeCard,
} from "./game/engine";
import { RitualAudio } from "./game/audio";
import type { CardInstance, Difficulty, GameState, NodeType, Screen } from "./game/types";
import { CombatStage } from "./phaser/CombatStage";

const routeNames = ["布袋港", "近岸海域", "珊瑚礁區", "深水區", "外海航道", "漁港外圍", "禁漁區", "外海決戰區"];
const hudBloodUrl = new URL("../assets/vendor/shushan/icon-blood-orb.png", import.meta.url).href;
const baguaIconUrl = new URL("../assets/vendor/shushan/icon-bagua-gold.png", import.meta.url).href;
const talismanIconUrl = new URL("../assets/vendor/shushan/icon-talisman-paper.png", import.meta.url).href;
const swordFireUrl = new URL("../assets/vendor/shushan/icon-sword-flame.png", import.meta.url).href;
const swordCrossUrl = new URL("../assets/vendor/shushan/icon-sword-cross.png", import.meta.url).href;
const blockBadgeUrl = new URL("../assets/vendor/shushan/badge-shield.png", import.meta.url).href;
const incenseBadgeUrl = new URL("../assets/vendor/shushan/relic-bell.png", import.meta.url).href;
const sealBadgeUrl = new URL("../assets/vendor/shushan/relic-orb-blue.png", import.meta.url).href;
const pileDrawUrl = new URL("../assets/vendor/shushan/badge-scroll.png", import.meta.url).href;
const pileDiscardUrl = new URL("../assets/vendor/shushan/icon-talisman-paper.png", import.meta.url).href;
const relicIconUrl = new URL("../assets/vendor/shushan/relic-umbrella.png", import.meta.url).href;
const goldIconUrl = new URL("../assets/vendor/shushan/icon-bagua-gold.png", import.meta.url).href;
const mapIconUrl = new URL("../assets/vendor/aigei/pile-draw.png", import.meta.url).href;
const gameIconUrl = new URL("../assets/marketing/icon.png", import.meta.url).href;
const costGemUrls: Record<string, string> = {
  empty: new URL("../assets/vendor/shushan/cost/cost-empty.png", import.meta.url).href,
  "0": new URL("../assets/vendor/shushan/cost/cost-0.png", import.meta.url).href,
  "1": new URL("../assets/vendor/shushan/cost/cost-1.png", import.meta.url).href,
  "2": new URL("../assets/vendor/shushan/cost/cost-2.png", import.meta.url).href,
  "3": new URL("../assets/vendor/shushan/cost/cost-3.png", import.meta.url).href,
};
const playerNightPatrolUrl = new URL("../assets/generated/characters/player-night-patrol.png", import.meta.url).href;
const cardArtUrls: Record<string, string> = {
  strike: new URL("../assets/generated/cards/card-strike.png", import.meta.url).href,
  defend: new URL("../assets/generated/cards/card-defend.png", import.meta.url).href,
  zhusha: new URL("../assets/generated/cards/card-zhusha.png", import.meta.url).href,
  taomu: new URL("../assets/generated/cards/card-taomu.png", import.meta.url).href,
  cloudstep: new URL("../assets/generated/cards/card-cloudstep.png", import.meta.url).href,
  qingxin: new URL("../assets/generated/cards/card-qingxin.png", import.meta.url).href,
  golden: new URL("../assets/generated/cards/card-golden.png", import.meta.url).href,
  incense: new URL("../assets/generated/cards/card-incense.png", import.meta.url).href,
  windScroll: new URL("../assets/generated/cards/card-windScroll.png", import.meta.url).href,
  thunder: new URL("../assets/generated/cards/card-thunder.png", import.meta.url).href,
  bell: new URL("../assets/generated/cards/card-bell.png", import.meta.url).href,
  fog: new URL("../assets/generated/cards/card-fog.png", import.meta.url).href,
  command: new URL("../assets/generated/cards/card-command.png", import.meta.url).href,
  burn: new URL("../assets/generated/cards/card-burn.png", import.meta.url).href,
  paper: new URL("../assets/generated/cards/card-paper.png", import.meta.url).href,
  breakEvil: new URL("../assets/generated/cards/card-breakEvil.png", import.meta.url).href,
  mirror: new URL("../assets/generated/cards/card-mirror.png", import.meta.url).href,
  refine: new URL("../assets/generated/cards/card-refine.png", import.meta.url).href,
  scripture: new URL("../assets/generated/cards/card-scripture.png", import.meta.url).href,
  ashReturn: new URL("../assets/generated/cards/card-ashReturn.png", import.meta.url).href,
  nightEye: new URL("../assets/generated/cards/card-nightEye.png", import.meta.url).href,
  citygod: new URL("../assets/generated/cards/card-citygod.png", import.meta.url).href,
  thunderLaw: new URL("../assets/generated/cards/card-thunderLaw.png", import.meta.url).href,
  paperBlade: new URL("../assets/generated/cards/card-paperBlade.png", import.meta.url).href,
  yinCold: new URL("../assets/generated/cards/card-yinCold.png", import.meta.url).href,
};
const sceneLoopVideoUrl = new URL("../assets/generated/backgrounds/night-temple-loop.mp4", import.meta.url).href;
const enemyArtUrls: Record<string, string> = {
  lantern: new URL("../assets/generated/enemies/lantern.png", import.meta.url).href,
  waterghost: new URL("../assets/generated/enemies/waterghost.png", import.meta.url).href,
  templecorpse: new URL("../assets/generated/enemies/templecorpse.png", import.meta.url).href,
  macaque: new URL("../assets/generated/enemies/macaque.png", import.meta.url).href,
  warlock: new URL("../assets/generated/enemies/warlock.png", import.meta.url).href,
  foxshade: new URL("../assets/generated/enemies/foxshade.png", import.meta.url).href,
  tigerlord: new URL("../assets/generated/enemies/tigerlord.png", import.meta.url).href,
};
const cinematicPosterUrls: Record<string, string> = {
  lantern: new URL("../assets/generated/cinematics/victory-lantern-poster.png", import.meta.url).href,
  waterghost: new URL("../assets/generated/cinematics/victory-waterghost-poster.png", import.meta.url).href,
  templecorpse: new URL("../assets/generated/cinematics/victory-templecorpse-poster.png", import.meta.url).href,
  macaque: new URL("../assets/generated/cinematics/victory-macaque-poster.png", import.meta.url).href,
  warlock: new URL("../assets/generated/cinematics/victory-warlock-poster.png", import.meta.url).href,
  foxshade: new URL("../assets/generated/cinematics/victory-foxshade-poster.png", import.meta.url).href,
  "boss-tigerlord": new URL("../assets/generated/cinematics/victory-boss-tigerlord-poster.png", import.meta.url).href,
};
const cinematicVideoUrls: Record<string, string> = {
  lantern: new URL("../assets/generated/cinematics/victory-lantern.mp4", import.meta.url).href,
  waterghost: new URL("../assets/generated/cinematics/victory-waterghost.mp4", import.meta.url).href,
  templecorpse: new URL("../assets/generated/cinematics/victory-templecorpse.mp4", import.meta.url).href,
  macaque: new URL("../assets/generated/cinematics/victory-macaque.mp4", import.meta.url).href,
  warlock: new URL("../assets/generated/cinematics/victory-warlock.mp4", import.meta.url).href,
  foxshade: new URL("../assets/generated/cinematics/victory-foxshade.mp4", import.meta.url).href,
  "boss-tigerlord": new URL("../assets/generated/cinematics/victory-boss-tigerlord.mp4", import.meta.url).href,
};

export function App() {
  const [game, setGame] = useState<GameState>(() => createGameState());
  const [muted, setMuted] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("normal");
  const [loadingDifficulty, setLoadingDifficulty] = useState<Difficulty | null>(null);
  const [aboutReturnScreen, setAboutReturnScreen] = useState<Screen>("title");
  const audioRef = useRef<RitualAudio | null>(null);
  const loadingTimerRef = useRef<number | null>(null);

  const audio = () => {
    if (!audioRef.current) audioRef.current = new RitualAudio();
    return audioRef.current;
  };

  const transact = (fn: (draft: GameState) => void, click = true) => {
    if (click) audio().sfx("click");
    setGame((prev) => {
      const next = cloneState(prev);
      next.lastFx = "none";
      fn(next);
      if (next.lastFx !== "none") window.setTimeout(() => audio().sfx(next.lastFx), 0);
      return next;
    });
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audio().setMuted(next);
  };

  const returnHome = () => {
    audio().sfx("click");
    if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    setLoadingDifficulty(null);
    setAboutReturnScreen("title");
    setGame(createGameState());
  };

  const openAbout = () => {
    audio().sfx("click");
    if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    setLoadingDifficulty(null);
    setGame((prev) => {
      if (prev.screen !== "about") setAboutReturnScreen(prev.screen);
      return { ...cloneState(prev), screen: "about" };
    });
  };

  const closeAbout = () => {
    audio().sfx("click");
    setGame((prev) => ({ ...cloneState(prev), screen: aboutReturnScreen || "title" }));
  };

  const beginRun = (difficulty: Difficulty) => {
    audio().sfx("click");
    setSelectedDifficulty(difficulty);
    setLoadingDifficulty(difficulty);
    if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = window.setTimeout(() => {
      setLoadingDifficulty(null);
      transact((draft) => startRun(draft, difficulty), false);
    }, 1450);
  };

  const player = game.player;

  useEffect(() => {
    audio().setMusicMode(game.screen === "title" || game.screen === "about" ? "title" : "game");
  }, [game.screen]);

  useEffect(
    () => () => {
      if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    },
    [],
  );

  const visibleScreen = loadingDifficulty ? "loading" : game.screen;

  return (
    <div className="app-frame">
      <TopHud
        game={game}
        muted={muted}
        onMute={toggleMute}
        onHome={returnHome}
        onAbout={openAbout}
        onRestart={() => transact((draft) => startRun(draft, game.difficulty || selectedDifficulty))}
      />
      <main className={`screen screen-${visibleScreen}`}>
        {loadingDifficulty && <LoadingScreen difficulty={loadingDifficulty} />}
        {!loadingDifficulty && game.screen === "title" && (
          <TitleScreen
            selectedDifficulty={selectedDifficulty}
            onDifficulty={setSelectedDifficulty}
            onStart={beginRun}
          />
        )}
        {!loadingDifficulty && game.screen === "about" && <AboutScreen onBack={closeAbout} onHome={returnHome} />}
        {player && game.screen === "map" && <MapScreen game={game} onChoose={(nodeId) => transact((draft) => chooseNode(draft, nodeId))} />}
        {player && game.screen === "combat" && game.combat && (
          <CombatScreen
            game={game}
            onPlayCard={(uid) => transact((draft) => playCard(draft, uid), false)}
            onEndTurn={() => transact(endTurn)}
          />
        )}
        {player && game.screen === "cinematic" && game.cinematic && (
          <CinematicScreen game={game} onContinue={() => transact(finishCinematic, false)} />
        )}
        {player && game.screen === "reward" && game.reward && (
          <RewardScreen
            game={game}
            onTake={(uid) => transact((draft) => takeRewardCard(draft, uid))}
            onSkip={() => transact(goMap)}
          />
        )}
        {player && game.screen === "event" && game.event && (
          <EventScreen game={game} onChoice={(choice) => transact((draft) => resolveEvent(draft, choice))} />
        )}
        {player && game.screen === "rest" && (
          <RestScreen
            onHeal={() => transact(restHeal)}
            onUpgrade={() => transact((draft) => openUpgrade(draft, "map"))}
          />
        )}
        {player && game.screen === "shop" && game.shop && (
          <ShopScreen
            game={game}
            onBuyCard={(index) => transact((draft) => buyShopCard(draft, index))}
            onBuyRelic={() => transact(buyShopRelic)}
            onRemove={() => transact((draft) => openRemoveCard(draft, draft.shop?.removeCost || 75, "shop"))}
            onLeave={() => transact(goMap)}
          />
        )}
        {player && game.screen === "remove" && (
          <DeckPickScreen
            title="報廢一張牌"
            desc={`花費 ${game.pendingRemove?.cost || 0} 補給費。選中的牌會從牌組中移除。`}
            cards={player.deck}
            actionLabel="報廢"
            onPick={(uid) => transact((draft) => removeCard(draft, uid))}
          />
        )}
        {player && game.screen === "upgrade" && (
          <DeckPickScreen
            title="強化一張牌"
            desc="選擇一張牌進行強化升級，提升其效果。"
            cards={player.deck.filter((card) => !card.upgraded && cardDef(card).rarity !== "status")}
            actionLabel="強化"
            onPick={(uid) => transact((draft) => upgradeCard(draft, uid))}
            emptyAction={() => transact(goMap)}
          />
        )}
        {game.screen === "gameover" && <EndScreen title="任務失敗" body="海浪沒有停歇，污染仍在蔓延。但每一次出航都是學習，下次你會更懂得取捨。" onStart={() => transact(startRun)} />}
        {game.screen === "victory" && <EndScreen title="海洋守護成功" body="非法捕鯨母船引擎熄滅，沉入布袋外海的深藍。你把識別章別回胸口，遠處燈塔重新亮起。嘉義縣海洋教育中心的任務從未結束——每一片乾淨的海，都是有人守過的結果。" onStart={() => transact(startRun)} />}
      </main>
    </div>
  );
}

function TopHud({
  game,
  muted,
  onMute,
  onHome,
  onAbout,
  onRestart,
}: {
  game: GameState;
  muted: boolean;
  onMute: () => void;
  onHome: () => void;
  onAbout: () => void;
  onRestart: () => void;
}) {
  const player = game.player;
  return (
    <header className="top-hud">
      <div className="hud-left">
        <div className="hero-seal">
          <img src={baguaIconUrl} alt="" draggable={false} />
        </div>
        {player && (
          <>
            <HudChip icon={<img className="hud-asset-icon" src={hudBloodUrl} alt="" draggable={false} />} label={`${player.hp}/${player.maxHp}`} tone="heart" />
            <HudChip icon={<img className="hud-asset-icon" src={goldIconUrl} alt="" draggable={false} />} label={String(player.gold)} tone="gold" />
          </>
        )}
      </div>
      <div className="hud-center">
        <div className="hud-center-stack">
          <div className="hud-primary-row">
            {player ? (
              <>
            <HudChip icon={<img className="hud-asset-icon" src={pileDrawUrl} alt="" draggable={false} />} label={`牌組 ${player.deck.length}`} />
            <HudChip icon={<img className="hud-asset-icon" src={relicIconUrl} alt="" draggable={false} />} label={`保育徽章 ${player.relics.length}`} />
            <HudChip icon={<img className="hud-asset-icon hud-map-icon" src={mapIconUrl} alt="" draggable={false} />} label={`地圖 ${Math.min(game.floor + 1, 8)}/8`} tone="map" />
              </>
            ) : (
              <span className="hud-title">守浪人：布袋篇</span>
            )}
          </div>
          <span className="hud-credit">嘉義縣海洋教育中心</span>
        </div>
      </div>
      <div className="hud-right">
        {game.screen !== "title" && (
          <button className="icon-btn" type="button" title="回到首頁" onClick={onHome}>
            <Home />
          </button>
        )}
        <button className="icon-btn" type="button" title={muted ? "打开声音" : "静音"} onClick={onMute}>
          {muted ? <VolumeX /> : <Volume2 />}
        </button>
        <button className="icon-btn" type="button" title="关于本作" onClick={onAbout}>
          <Info />
        </button>
        {player && game.screen !== "title" && (
          <button className="icon-btn" type="button" title="重新开始本局" onClick={onRestart}>
            <RotateCcw />
          </button>
        )}
      </div>
    </header>
  );
}

function HudChip({ icon, label, tone }: { icon: ReactNode; label: string; tone?: string }) {
  return (
    <div className={`hud-chip ${tone ? `hud-chip-${tone}` : ""}`}>
      <span>{icon}</span>
      <strong>{label}</strong>
    </div>
  );
}

const difficultyOptions: Array<{
  id: Difficulty;
  name: string;
  tag: string;
  desc: string;
}> = [
  { id: "story", name: "演示", tag: "體驗版", desc: "血量更高，敵人更鬆，適合初次體驗。" },
  { id: "normal", name: "標準", tag: "推薦", desc: "完整路線體驗，數值穩定，適合一般玩家。" },
  { id: "hard", name: "挑戰", tag: "進階", desc: "敵人更硬更痛，適合熟悉玩法後挑戰。" },
];

function TitleScreen({
  selectedDifficulty,
  onDifficulty,
  onStart,
}: {
  selectedDifficulty: Difficulty;
  onDifficulty: (difficulty: Difficulty) => void;
  onStart: (difficulty: Difficulty) => void;
}) {
  return (
    <section className="title-view">
      <video className="scene-loop-video title-loop-video" src={sceneLoopVideoUrl} autoPlay loop muted playsInline />
      <div className="title-copy">
        <p className="eyebrow">React + Phaser prototype</p>
        <div className="title-brand">
          <img src={gameIconUrl} alt="" draggable={false} />
          <h1>守浪人：布袋篇</h1>
        </div>
        <p>
          颱風過後，布袋外海傳來警報。你是嘉義縣海洋教育中心培訓的守浪志工，別上識別章出發，用清污行動、執法扣押和海洋保育能力，在每一次分岔路線裡拼出守護海洋的方法。
        </p>
        <div className="difficulty-picker" role="radiogroup" aria-label="难度选择">
          {difficultyOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`difficulty-card ${selectedDifficulty === option.id ? "selected" : ""}`}
              onClick={() => onDifficulty(option.id)}
              role="radio"
              aria-checked={selectedDifficulty === option.id}
            >
              <span>{option.tag}</span>
              <strong>{option.name}</strong>
              <em>{option.desc}</em>
            </button>
          ))}
        </div>
        <div className="title-actions">
          <button className="primary-command" type="button" onClick={() => onStart(selectedDifficulty)}>
            <Swords /> 開始守浪
          </button>
        </div>
      </div>
    </section>
  );
}

function AboutScreen({ onBack, onHome }: { onBack: () => void; onHome: () => void }) {
  return (
    <section className="about-view">
      <video className="scene-loop-video title-loop-video" src={sceneLoopVideoUrl} autoPlay loop muted playsInline />
      <div className="about-panel">
        <p className="eyebrow">About</p>
        <h1>關於《守浪人：布袋篇》</h1>
        <p className="about-lead">
          本遊戲由嘉義縣海洋教育中心製作，以海洋保育與海洋資源永續為主題。
        </p>
        <div className="about-grid">
          <article>
            <strong>遊戲主題</strong>
            <span>你扮演嘉義縣海洋教育中心培訓的守浪志工，在布袋外海清除污染、驅離盜獵、修復珊瑚礁，最終對抗非法捕鯨母船。</span>
          </article>
          <article>
            <strong>教育目標</strong>
            <span>透過卡牌構築 roguelike 的遊戲形式，讓玩家了解海洋污染、外來物種入侵、非法捕撈等海洋保育議題。</span>
          </article>
          <article>
            <strong>遊戲玩法</strong>
            <span>每回合獲得能量並抽牌，打出攻擊牌造成傷害，技能牌獲得防護或特殊效果，法門牌建立長期能力。積累清除污染程度可引爆大傷害。</span>
          </article>
          <article>
            <strong>關於中心</strong>
            <span>嘉義縣海洋教育中心致力於推廣海洋教育，培養學生對海洋生態的認識與保育意識，守護台灣珍貴的海洋資源。</span>
          </article>
        </div>
        <p className="about-notice">嘉義縣海洋教育中心</p>
        <div className="title-actions">
          <button className="primary-command" type="button" onClick={onBack}>
            <SkipForward /> 返回
          </button>
          <button className="secondary-command title-about-command" type="button" onClick={onHome}>
            <Home /> 回到首頁
          </button>
        </div>
      </div>
    </section>
  );
}

function LoadingScreen({ difficulty }: { difficulty: Difficulty }) {
  const option = difficultyOptions.find((item) => item.id === difficulty) || difficultyOptions[1];
  return (
    <section className="loading-view">
      <video className="scene-loop-video loading-loop-video" src={sceneLoopVideoUrl} autoPlay loop muted playsInline />
      <div className="loading-copy">
        <p className="eyebrow">出航準備</p>
        <h2>任務即將開始</h2>
        <span>{option.name}難度</span>
      </div>
      <div className="loading-thread" />
    </section>
  );
}

function AmbientSceneVideo() {
  return <video className="scene-loop-video ambient-scene-video" src={sceneLoopVideoUrl} autoPlay loop muted playsInline />;
}

function MapScreen({ game, onChoose }: { game: GameState; onChoose: (nodeId: string) => void }) {
  const rows = routeNames.map((_, row) => game.mapNodes.filter((node) => node.row === row).sort((a, b) => a.lane - b.lane));
  const available = new Set(game.availableNodeIds);
  const visited = new Set(game.visitedNodeIds || []);
  const nodeById = new globalThis.Map(game.mapNodes.map((node) => [node.id, node]));
  const mapWidth = 400;
  const mapHeight = 640;
  const laneX = (lane: number) => 28 + (lane / 4) * (mapWidth - 56);
  const rowY = (row: number) => 26 + (row / (routeNames.length - 1)) * (mapHeight - 52);
  const links = game.mapNodes.flatMap((node) =>
    node.nextIds.flatMap((targetId) => {
      const target = nodeById.get(targetId);
      return target ? [{ from: node, to: target }] : [];
    }),
  );
  return (
    <section className="route-view">
      <div className="route-map-panel">
        <div className="route-header">
          <p className="eyebrow">路線選擇</p>
          <h2>海域地圖</h2>
          <p>每個節點只通向幾條後路。想打精英、找補給、進漁港，都要提前看兩步。</p>
        </div>
        <div className="branch-map" style={{ "--map-rows": routeNames.length } as CSSProperties}>
          <svg className="branch-links" viewBox={`0 0 ${mapWidth} ${mapHeight}`} preserveAspectRatio="none" aria-hidden="true">
            {links.map(({ from, to }) => {
              const isPast = visited.has(from.id) && visited.has(to.id);
              const isOpen = available.has(from.id) || game.currentNodeId === from.id;
              return (
                <line
                  key={`${from.id}-${to.id}`}
                  className={`branch-link ${isOpen ? "open" : ""} ${isPast ? "past" : ""}`}
                  x1={laneX(from.lane)}
                  y1={rowY(from.row)}
                  x2={laneX(to.lane)}
                  y2={rowY(to.row)}
                />
              );
            })}
          </svg>
          {routeNames.map((name, rowIndex) => (
            <span key={name} className="branch-row-label" style={{ gridColumn: 1, gridRow: rowIndex + 1 }}>
              {name}
            </span>
          ))}
          {rows.flat().map((node) => {
            const isAvailable = available.has(node.id);
            const isCurrent = game.currentNodeId === node.id;
            const isPast = visited.has(node.id) && !isCurrent;
            return (
              <button
                key={node.id}
                type="button"
                className={`map-node map-node-${node.type} ${isAvailable ? "available" : ""} ${isCurrent ? "current" : ""} ${isPast ? "past" : ""}`}
                style={{ gridColumn: node.lane + 2, gridRow: node.row + 1 }}
                disabled={!isAvailable}
                onClick={() => onChoose(node.id)}
                title={NODE_DEFS[node.type].desc}
              >
                {nodeIcon(node.type)}
                <span>{NODE_DEFS[node.type].name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="node-choice-grid">
        {game.availableNodeIds.map((id) => {
          const node = game.mapNodes.find((item) => item.id === id);
          if (!node) return null;
          return (
            <button key={node.id} className={`node-card node-${node.type}`} type="button" onClick={() => onChoose(node.id)}>
              <span className="node-icon">{nodeIcon(node.type)}</span>
              <strong>{NODE_DEFS[node.type].name}</strong>
              <p>{NODE_DEFS[node.type].desc}</p>
            </button>
          );
        })}
      </div>
      <LogRail logs={game.log} />
    </section>
  );
}

function nodeIcon(type: NodeType) {
  if (type === "combat") return <Swords />;
  if (type === "elite") return <Zap />;
  if (type === "event") return <BookOpen />;
  if (type === "rest") return <Sparkles />;
  if (type === "shop") return <BadgeCent />;
  return <AudioWaveform />;
}

function CombatScreen({ game, onPlayCard, onEndTurn }: { game: GameState; onPlayCard: (uid: string) => void; onEndTurn: () => void }) {
  const combat = game.combat!;
  const player = game.player!;
  const enemy = combat.enemy;
  const [drag, setDrag] = useState<{
    uid: string;
    originX: number;
    originY: number;
    dx: number;
    dy: number;
  } | null>(null);
  const [burst, setBurst] = useState<{
    id: number;
    target: "player" | "enemy";
    kind: "shield" | "strike";
  } | null>(null);
  const draggedCard = drag ? combat.hand.find((card) => card.uid === drag.uid) : null;
  const expectedTarget = draggedCard ? dropTargetForCard(draggedCard) : null;
  const dragPoint = drag ? { x: drag.originX + drag.dx, y: drag.originY + drag.dy } : null;
  const hoverTarget = dragPoint ? dragHitTarget(dragPoint) : null;
  const targetHot = Boolean(expectedTarget && hoverTarget === expectedTarget);
  const dropHint = expectedTarget === "enemy" ? "拖到目標身上施放" : expectedTarget === "player" ? "拖到自己身上施放" : "拖到目標身上施放";

  const beginDrag = (card: CardInstance, event: ReactPointerEvent<HTMLButtonElement>) => {
    if (cardDef(card).unplayable) return;
    const cost = cardCost(card);
    if (typeof cost !== "number" || player.energy < cost) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Window-level pointer listeners below keep drag release reliable even if capture is unavailable.
    }
    setDrag({ uid: card.uid, originX: event.clientX, originY: event.clientY, dx: 0, dy: 0 });
  };

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    setDrag({ ...drag, dx: event.clientX - drag.originX, dy: event.clientY - drag.originY });
  };

  const releaseDragAt = (uid: string, point: { x: number; y: number }) => {
    const card = combat.hand.find((item) => item.uid === uid);
    const target = card ? dropTargetForCard(card) : null;
    if (!target || dragHitTarget(point) !== target) return;
    const id = Date.now();
    setBurst({ id, target, kind: target === "enemy" ? "strike" : "shield" });
    window.setTimeout(() => {
      setBurst((current) => (current?.id === id ? null : current));
    }, 520);
    onPlayCard(uid);
  };

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const uid = drag.uid;
    setDrag(null);
    releaseDragAt(uid, { x: event.clientX, y: event.clientY });
  };

  useEffect(() => {
    if (!drag) return;

    const handleMove = (event: PointerEvent) => {
      setDrag((current) => {
        if (!current || current.uid !== drag.uid) return current;
        return { ...current, dx: event.clientX - current.originX, dy: event.clientY - current.originY };
      });
    };
    const handleEnd = (event: PointerEvent) => {
      const uid = drag.uid;
      setDrag(null);
      releaseDragAt(uid, { x: event.clientX, y: event.clientY });
    };
    const handleCancel = () => setDrag(null);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleCancel);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleCancel);
    };
  }, [combat.hand, drag, onPlayCard]);

  return (
    <section className="combat-view">
      <CombatStage combat={combat} player={player} />
      <video className="combat-scene-loop" src={sceneLoopVideoUrl} autoPlay loop muted playsInline />
      <div className={`combat-overlay ${drag ? "drag-active" : ""} ${expectedTarget ? `expects-${expectedTarget}` : ""} ${targetHot ? "target-hot" : ""}`}>
        <div className={`play-drop-zone ${drag ? "visible" : ""} ${targetHot ? "hot" : ""}`}>{targetHot ? "放開施放" : dropHint}</div>
        <div className={`target-ghost target-player ${expectedTarget === "player" ? "visible" : ""} ${targetHot && hoverTarget === "player" ? "hot" : ""}`}>
          <Shield />
          <span>加護預備</span>
        </div>
        <div className={`target-ghost target-enemy ${expectedTarget === "enemy" ? "visible" : ""} ${targetHot && hoverTarget === "enemy" ? "hot" : ""}`}>
          <Swords />
          <span>施放攻擊</span>
        </div>
        {burst && (
          <div key={burst.id} className={`target-burst target-burst-${burst.target} burst-${burst.kind}`}>
            {burst.kind === "shield" ? <Shield /> : <Swords />}
          </div>
        )}
        <div className={`actor-panel player-panel ${expectedTarget === "player" ? "preview-target" : ""} ${targetHot && hoverTarget === "player" ? "target-hot" : ""}`}>
          <HealthStrip current={player.hp} max={player.maxHp} />
          <div className="status-stack">
            <StatusBadge icon={<img src={blockBadgeUrl} alt="" draggable={false} />} text={`防護 ${player.block}`} />
            <StatusBadge icon={<img src={incenseBadgeUrl} alt="" draggable={false} />} text={`海洋保育能力 ${player.incense}`} />
            {player.weak > 0 && <StatusBadge text={`虛弱 ${player.weak}`} />}
            {player.powers.nightEye && <StatusBadge text="監測儀" />}
            {player.powers.citygod && <StatusBadge text="中心支援" />}
          </div>
        </div>
        <div className={`actor-panel enemy-panel ${expectedTarget === "enemy" ? "preview-target" : ""} ${targetHot && hoverTarget === "enemy" ? "target-hot" : ""}`}>
          <div className="intent-plaque">
          <span>行動</span>
            <strong>{intentText(enemy.intent)}</strong>
          </div>
          <HealthStrip current={enemy.hp} max={enemy.maxHp} enemy />
          <div className="status-stack">
            <StatusBadge icon={<img src={sealBadgeUrl} alt="" draggable={false} />} text={`清除污染程度 ${enemy.seal}`} />
            <StatusBadge icon={<img src={blockBadgeUrl} alt="" draggable={false} />} text={`破壞環境指數 ${enemy.block}`} />
            {enemy.strength > 0 && <StatusBadge text={`力量 ${enemy.strength}`} />}
            {enemy.weak > 0 && <StatusBadge text={`虛弱 ${enemy.weak}`} />}
            {enemy.vulnerable > 0 && <StatusBadge text={`易傷 ${enemy.vulnerable}`} />}
          </div>
        </div>
        <div className="energy-orb">
          <strong>{player.energy}</strong>
          <span>/{player.maxEnergy}</span>
        </div>
        <button className="end-turn" type="button" onClick={onEndTurn}>
          <SkipForward /> 結束回合
        </button>
        <div className="pile-counters pile-left" title={`已棄牌 ${combat.discardPile.length}`} aria-label={`已棄牌 ${combat.discardPile.length}`}>
          <img src={pileDiscardUrl} alt="" draggable={false} />
          <span>已棄牌</span>
          <strong>{combat.discardPile.length}</strong>
        </div>
        <div className="pile-counters pile-right" title={`牌庫 ${combat.drawPile.length}`} aria-label={`牌庫 ${combat.drawPile.length}`}>
          <img src={pileDrawUrl} alt="" draggable={false} />
          <span>牌庫</span>
          <strong>{combat.drawPile.length}</strong>
        </div>
        <div className="hand-fan" style={{ "--hand-count": combat.hand.length } as CSSProperties}>
          {combat.hand.map((card, index) => {
            const cost = cardCost(card);
            const disabled = cardDef(card).unplayable || typeof cost !== "number" || player.energy < cost;
            const isDragging = drag?.uid === card.uid;
            return (
              <GameCard
                key={card.uid}
                card={card}
                mode="hand"
                index={index}
                count={combat.hand.length}
                disabled={disabled}
                dragOffset={isDragging ? { x: drag.dx, y: drag.dy } : undefined}
                dragging={isDragging}
                onPointerDown={(event) => beginDrag(card, event)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={() => setDrag(null)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HealthStrip({ current, max, enemy = false }: { current: number; max: number; enemy?: boolean }) {
  return (
    <div className={`health-strip ${enemy ? "enemy-health" : ""}`}>
      <div className="health-fill" style={{ width: `${Math.max(0, Math.min(100, (current / max) * 100))}%` }} />
      <strong>
        {current}/{max}
      </strong>
    </div>
  );
}

function StatusBadge({ icon, text }: { icon?: ReactNode; text: string }) {
  return (
    <span className="status-badge">
      {icon}
      {text}
    </span>
  );
}

function GameCard({
  card,
  mode,
  index = 0,
  count = 1,
  disabled,
  dragging,
  dragOffset,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  card: CardInstance;
  mode?: "hand" | "reward" | "pick";
  index?: number;
  count?: number;
  disabled?: boolean;
  dragging?: boolean;
  dragOffset?: { x: number; y: number };
  onClick?: () => void;
  onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerCancel?: () => void;
}) {
  const def = cardDef(card);
  const costKey = typeof def.cost === "number" ? String(Math.min(def.cost, 3)) : "empty";
  const center = (count - 1) / 2;
  const rotate = (index - center) * 5.5;
  const lift = Math.abs(index - center) * 9;
  const offset = (index - center) * 78;
  const style =
    mode === "hand"
      ? ({
          "--card-rot": `${rotate}deg`,
          "--card-x": `${offset}px`,
          "--card-y": `${lift}px`,
          "--drag-x": `${dragOffset?.x || 0}px`,
          "--drag-y": `${dragOffset?.y || 0}px`,
          zIndex: 20 + index,
        } as CSSProperties)
      : undefined;

  return (
    <button
      type="button"
      className={`game-card card-${def.type} ${disabled ? "disabled" : ""} ${dragging ? "is-dragging" : ""} ${mode ? `card-mode-${mode}` : ""}`}
      style={style}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className={`card-cost card-cost-${costKey}`}>
        <img src={costGemUrls[costKey]} alt="" draggable={false} />
        <strong>{def.cost}</strong>
      </div>
      <div className="card-title">{cardName(card)}</div>
      <div className="card-art-window">
        <img className={`card-art-icon card-art-icon-${def.type}`} src={cardArtImage(card)} alt="" draggable={false} />
        <div className="sigil-lines" />
      </div>
      <div className="card-kind">{typeLabel(def.type)}</div>
      <p>{cardText(card)}</p>
    </button>
  );
}

function cardArtImage(card: CardInstance) {
  const def = cardDef(card);
  return cardArtUrls[def.id] ?? talismanIconUrl;
}

function dropTargetForCard(card: CardInstance): "player" | "enemy" | null {
  const type = cardDef(card).type;
  if (type === "attack") return "enemy";
  if (type === "skill" || type === "power") return "player";
  return null;
}

function dragHitTarget(point: { x: number; y: number }): "player" | "enemy" | null {
  if (typeof window === "undefined") return null;
  const inBattleBand = point.y > 120 && point.y < window.innerHeight * 0.78;
  if (!inBattleBand) return null;
  if (point.x < window.innerWidth * 0.48) return "player";
  if (point.x > window.innerWidth * 0.52) return "enemy";
  return null;
}

function typeLabel(type: string) {
  if (type === "attack") return "攻擊";
  if (type === "skill") return "技能";
  if (type === "power") return "法門";
  return "狀態";
}

function CinematicScreen({ game, onContinue }: { game: GameState; onContinue: () => void }) {
  const cinematic = game.cinematic!;
  const reward = game.reward;
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const enemyArt = enemyArtUrls[cinematic.enemyArtKey] || enemyArtUrls.lantern;
  const mediaKey = cinematic.combatType === "boss" ? `boss-${cinematic.enemyId}` : cinematic.enemyId;
  const videoSrc = cinematicVideoUrls[mediaKey];
  const posterSrc = cinematicPosterUrls[mediaKey] || cinematic.posterUrl;
  const isBoss = cinematic.combatType === "boss";
  const isElite = cinematic.combatType === "elite";
  const shouldTryVideo = Boolean(videoSrc) && !videoFailed;

  useEffect(() => {
    setVideoFailed(false);
    setVideoStarted(false);
  }, [cinematic.enemyId, cinematic.combatType]);

  return (
    <section
      className={`cinematic-view ${isBoss ? "cinematic-boss" : ""}`}
      data-video-slot={videoSrc || cinematic.videoUrl}
      data-poster-slot={posterSrc}
    >
      <div className="cinematic-scene" aria-label={`${cinematic.enemyName}戰鬥結算過場`}>
        <div className="cinematic-moon" />
        <img className="cinematic-player" src={playerNightPatrolUrl} alt="" draggable={false} />
        <img className={`cinematic-enemy enemy-${cinematic.enemyArtKey}`} src={enemyArt} alt="" draggable={false} />
        <div className="cinematic-slash" />
        <div className="cinematic-caption">
          <p className="eyebrow">{isBoss ? "Boss Clear" : isElite ? "Elite Clear" : "Encounter Clear"}</p>
          <h2>{cinematic.title}</h2>
          <span>{cinematic.subtitle}</span>
        </div>
        {shouldTryVideo && (
          <video
            key={mediaKey}
            className={`cinematic-video ${videoStarted ? "is-playing" : ""}`}
            src={videoSrc || cinematic.videoUrl}
            poster={posterSrc}
            autoPlay
            playsInline
            muted
            onPlay={() => setVideoStarted(true)}
            onCanPlay={(e) => { (e.target as HTMLVideoElement).play().catch(() => setVideoFailed(true)); }}
            onEnded={onContinue}
            onError={() => setVideoFailed(true)}
            onClick={(e) => { (e.target as HTMLVideoElement).play().catch(() => {}); }}
          />
        )}
        {(videoFailed || !videoStarted) && (
          <div className="cinematic-static-card">
            <strong>{cinematic.enemyName}</strong>
            <span>{isBoss ? "外海霧散，引擎熄滅，海面恢復平靜。" : "威脅退散，海面重歸清澈。"}</span>
          </div>
        )}
      </div>
      <aside className="settlement-panel">
        <p className="eyebrow">戰鬥結算</p>
        <h3>{isBoss ? "最終關卡完成" : "補給待領取"}</h3>
        <div className="settlement-line">
          <img src={goldIconUrl} alt="" draggable={false} />
          <span>{cinematic.rewardSummary ? `獲得 ${cinematic.rewardSummary.gold} 補給費` : "非法母船引擎熄滅，海面恢復平靜"}</span>
        </div>
        {cinematic.rewardSummary?.relicName && (
          <div className="settlement-line">
            <Sparkles />
            <span>遗物：{cinematic.rewardSummary.relicName}</span>
          </div>
        )}
        {reward && (
          <div className="settlement-card-peek">
            {reward.cards.map((card) => (
              <span key={card.uid}>{cardName(card)}</span>
            ))}
          </div>
        )}
        <div className="settlement-flavor">
          <strong>巡查記錄</strong>
          <span>{isBoss ? "外海霧散，引擎聲熄滅，海面恢復了平靜。" : "威脅退散，海面重歸清澈，補給已在船上備妥。"}</span>
        </div>
        <button className="primary-command" type="button" onClick={onContinue}>
          <SkipForward /> {isBoss ? "進入通關頁" : "領取補給"}
        </button>
      </aside>
    </section>
  );
}

function RewardScreen({ game, onTake, onSkip }: { game: GameState; onTake: (uid: string) => void; onSkip: () => void }) {
  const reward = game.reward!;
  return (
    <section className="choice-view">
      <AmbientSceneVideo />
      <div className="choice-header">
        <p className="eyebrow">戰鬥獎勵</p>
        <h2>{reward.title}</h2>
        <p>獲得 {reward.gold} 補給費。{reward.relic ? `保育徽章 ${reward.relic.name} 已取得。` : "這次沒有保育徽章。"} 選一張技能牌，或讓牌組保持精簡。</p>
      </div>
      {reward.relic && <div className="relic-banner"><strong>{reward.relic.name}</strong>{reward.relic.text}</div>}
      <div className="reward-row">
        {reward.cards.map((card) => (
          <GameCard key={card.uid} card={card} mode="reward" onClick={() => onTake(card.uid)} />
        ))}
      </div>
      <button className="secondary-command" type="button" onClick={onSkip}>跳過技能牌</button>
      <LogRail logs={game.log} />
    </section>
  );
}

function EventScreen({ game, onChoice }: { game: GameState; onChoice: (choice: string) => void }) {
  const event = game.event!;
  return (
    <section className="choice-view event-view">
      <AmbientSceneVideo />
      <div className="choice-header">
        <p className="eyebrow">海上見聞</p>
        <h2>{event.title}</h2>
        <p>{event.body}</p>
      </div>
      <div className="decision-grid">
        {event.choices.map((choice) => (
          <button key={choice.id} type="button" className="decision-card" onClick={() => onChoice(choice.id)}>
            <strong>{choice.title}</strong>
            <span>{choice.desc}</span>
          </button>
        ))}
      </div>
      <LogRail logs={game.log} />
    </section>
  );
}

function RestScreen({ onHeal, onUpgrade }: { onHeal: () => void; onUpgrade: () => void }) {
  return (
    <section className="choice-view">
      <AmbientSceneVideo />
      <div className="choice-header">
        <p className="eyebrow">補給</p>
        <h2>中心補給站</h2>
        <p>回到嘉義縣海洋教育中心稍作休整。你可以療傷，也可以強化一張裝備。</p>
      </div>
      <div className="decision-grid">
        <button type="button" className="decision-card" onClick={onHeal}><strong>補充裝備</strong><span>回復最大生命 30%。</span></button>
        <button type="button" className="decision-card" onClick={onUpgrade}><strong>研習技能</strong><span>強化 1 張牌。</span></button>
      </div>
    </section>
  );
}

function ShopScreen({
  game,
  onBuyCard,
  onBuyRelic,
  onRemove,
  onLeave,
}: {
  game: GameState;
  onBuyCard: (index: number) => void;
  onBuyRelic: () => void;
  onRemove: () => void;
  onLeave: () => void;
}) {
  const shop = game.shop!;
  const gold = game.player!.gold;
  return (
    <section className="choice-view">
      <AmbientSceneVideo />
      <div className="choice-header">
        <p className="eyebrow">補給鋪</p>
        <h2>漁港裝備鋪</h2>
        <p>老闆從倉庫翻出各種裝備，價格公道。你有 {gold} 補給費。</p>
      </div>
      <div className="shop-grid">
        {shop.cards.map((item, index) => (
          <button key={item.card.uid} className="shop-card" type="button" disabled={item.sold || gold < item.cost} onClick={() => onBuyCard(index)}>
            <strong>{cardName(item.card)}</strong>
            <span>{cardText(item.card)}</span>
            <em>{item.sold ? "已售出" : `${item.cost} 補給費`}</em>
          </button>
        ))}
        <button className="shop-card relic-shop-card" type="button" disabled={shop.relic.sold || !shop.relic.relic || gold < shop.relic.cost} onClick={onBuyRelic}>
          <strong>{shop.relic.relic?.name || "無庫存"}</strong>
          <span>{shop.relic.relic?.text || "目前沒有新保育徽章。"}</span>
          <em>{shop.relic.sold ? "已售出" : `${shop.relic.cost} 補給費`}</em>
        </button>
        <button className="shop-card" type="button" disabled={gold < shop.removeCost} onClick={onRemove}>
          <strong>報廢裝備</strong>
          <span>請店主幫你淘汰一張不再需要的技能牌。</span>
          <em>{shop.removeCost} 補給費</em>
        </button>
      </div>
      <button className="secondary-command" type="button" onClick={onLeave}>離開裝備鋪</button>
    </section>
  );
}

function DeckPickScreen({
  title,
  desc,
  cards,
  actionLabel,
  onPick,
  emptyAction,
}: {
  title: string;
  desc: string;
  cards: CardInstance[];
  actionLabel: string;
  onPick: (uid: string) => void;
  emptyAction?: () => void;
}) {
  return (
    <section className="choice-view">
      <AmbientSceneVideo />
      <div className="choice-header">
        <p className="eyebrow">牌组</p>
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
      {cards.length ? (
        <div className="deck-grid">
          {cards.map((card) => (
            <button key={card.uid} type="button" className="deck-card" onClick={() => onPick(card.uid)}>
              <strong>{cardName(card)}</strong>
              <span>{cardText(card)}</span>
              <em>{actionLabel}</em>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-panel">
          <p>沒有可選擇的技能牌。</p>
          {emptyAction && <button type="button" onClick={emptyAction}>繼續</button>}
        </div>
      )}
    </section>
  );
}

function logTone(log: string) {
  if (/獲得|買下|補給費|保育徽章|技能牌|金/.test(log)) return { label: "收穫", tone: "gain" };
  if (/造成|攻擊|傷害|虛弱|易傷|污染|防護|力量|塞入/.test(log)) return { label: "戰鬥", tone: "combat" };
  if (/回復|強化|報廢|補給站|休整/.test(log)) return { label: "整備", tone: "ready" };
  if (/海龜|老漁翁|燈塔|研究員|漁港|海上見聞/.test(log)) return { label: "見聞", tone: "event" };
  return { label: "巡查", tone: "route" };
}

function LogRail({ logs }: { logs: string[] }) {
  return (
    <aside className="log-rail">
      <strong>巡查日誌</strong>
      {logs.length === 0 && <span className="log-entry log-route"><small>巡查</small><b>任務剛剛開始，海面還沒有留下任何紀錄。</b></span>}
      {logs.map((log, index) => {
        const meta = logTone(log);
        return (
          <span className={`log-entry log-${meta.tone}`} key={`${log}-${index}`}>
            <small>{meta.label}</small>
            <b>{log}</b>
          </span>
        );
      })}
    </aside>
  );
}

function EndScreen({ title, body, onStart }: { title: string; body: string; onStart: () => void }) {
  return (
    <section className="title-view">
      <div className="title-copy">
        <p className="eyebrow">终局</p>
        <h1>{title}</h1>
        <p>{body}</p>
        <div className="title-actions">
          <button className="primary-command" type="button" onClick={onStart}>
            <Swords /> 再巡一夜
          </button>
        </div>
      </div>
    </section>
  );
}
