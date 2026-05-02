import { CARD_DEFS, CARD_POOL, ENEMIES, EVENTS, NODE_DEFS, RELICS } from "./content";
import type {
  CardInstance,
  CombatState,
  Difficulty,
  EnemyMove,
  EnemyState,
  GameState,
  MapNode,
  NodeType,
  PlayerState,
  RelicDef,
  ShopState,
} from "./types";

const DIFFICULTY_SPECS: Record<
  Difficulty,
  {
    playerHp: number;
    gold: number;
    maxEnergy: number;
    enemyHp: number;
    enemyDamage: number;
    rewardGold: number;
    startingRelics: string[];
    logName: string;
  }
> = {
  story: {
    playerHp: 96,
    gold: 90,
    maxEnergy: 4,
    enemyHp: 0.82,
    enemyDamage: 0.72,
    rewardGold: 1.25,
    startingRelics: ["oldUmbrella", "blankPage"],
    logName: "演示",
  },
  normal: {
    playerHp: 84,
    gold: 65,
    maxEnergy: 3,
    enemyHp: 0.92,
    enemyDamage: 0.9,
    rewardGold: 1.1,
    startingRelics: [],
    logName: "標準",
  },
  hard: {
    playerHp: 74,
    gold: 45,
    maxEnergy: 3,
    enemyHp: 1.08,
    enemyDamage: 1.08,
    rewardGold: 1,
    startingRelics: [],
    logName: "挑戰",
  },
};

export function createGameState(): GameState {
  return {
    screen: "title",
    difficulty: "normal",
    player: null,
    floor: 0,
    mapNodes: [],
    availableNodeIds: [],
    currentNodeId: null,
    visitedNodeIds: [],
    combat: null,
    cinematic: null,
    reward: null,
    event: null,
    shop: null,
    pendingRemove: null,
    pendingUpgrade: null,
    log: [],
    seed: Date.now() % 2147483647,
    nextCardUid: 1,
    lastFx: "none",
  };
}

export function cloneState(state: GameState): GameState {
  return structuredClone(state) as GameState;
}

export function cardDef(cardOrId: CardInstance | string) {
  return CARD_DEFS[typeof cardOrId === "string" ? cardOrId : cardOrId.id];
}

export function cardName(card: CardInstance) {
  return `${cardDef(card).name}${card.upgraded ? "+" : ""}`;
}

export function cardText(card: CardInstance) {
  return cardDef(card).text[card.upgraded ? 1 : 0];
}

export function cardCost(card: CardInstance) {
  return cardDef(card).cost;
}

export function hpPercent(entity: { hp: number; maxHp: number }) {
  return `${Math.max(0, Math.min(100, (entity.hp / entity.maxHp) * 100))}%`;
}

export function intentText(intent: EnemyMove | null) {
  if (!intent) return "意圖不明";
  if (intent.type === "attack") return `${intent.label}：攻擊 ${intent.amount}${intent.hits ? ` x ${intent.hits}` : ""}`;
  if (intent.type === "block") return `${intent.label}：破壞環境指數 ${intent.amount}`;
  if (intent.type === "buff") return `${intent.label}：力量 +${intent.amount}`;
  if (intent.type === "debuff") return `${intent.label}：令你虛弱 ${intent.amount}`;
  if (intent.type === "curse") return `${intent.label}：塞入 ${intent.amount} 張污泥`;
  if (intent.type === "blockAttack") return `${intent.label}：破壞環境指數 ${intent.block} 並攻擊 ${intent.amount}`;
  return intent.label;
}

const ROUTE_ROW_NAMES = ["布袋港", "近岸海域", "珊瑚礁區", "深水區", "外海航道", "漁港外圍", "禁漁區", "外海決戰區"];

function nodeTrailLine(node: MapNode) {
  const row = ROUTE_ROW_NAMES[node.row] || "夜路";
  const def = NODE_DEFS[node.type];
  if (node.type === "combat") return `進入${row}，水面下有異常活動的跡象。`;
  if (node.type === "elite") return `${row}警報突響，非法作業現場就在前方。`;
  if (node.type === "event") return `${row}有意外情況出現，需要立即判斷處置。`;
  if (node.type === "rest") return `${row}中心補給站就在附近，可以喘口氣整備裝備。`;
  if (node.type === "shop") return `${row}漁港裝備鋪還開著，老闆從帘後探出頭來。`;
  return `${row}尽头只剩${def.name}。`;
}

function random(state: GameState) {
  state.seed = (state.seed * 48271) % 2147483647;
  return state.seed / 2147483647;
}

function int(state: GameState, min: number, max: number) {
  return Math.floor(random(state) * (max - min + 1)) + min;
}

function pick<T>(state: GameState, items: T[]): T {
  return items[Math.floor(random(state) * items.length)];
}

function shuffle<T>(state: GameState, items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random(state) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createCard(state: GameState, id: string, upgraded = false, temp = false): CardInstance {
  return { uid: `card-${state.nextCardUid++}`, id, upgraded, temp };
}

function cloneCard(state: GameState, card: CardInstance) {
  return createCard(state, card.id, card.upgraded, card.temp);
}

function value(card: CardInstance, base: number, upgraded: number) {
  return card.upgraded ? upgraded : base;
}

function hasRelic(state: GameState, id: string) {
  return Boolean(state.player?.relics.some((relic) => relic.id === id));
}

function addLog(state: GameState, message: string) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 9);
}

export function startRun(state: GameState, difficulty: Difficulty = "normal") {
  const spec = DIFFICULTY_SPECS[difficulty];
  const deck = [
    "strike",
    "strike",
    "strike",
    "defend",
    "defend",
    "defend",
    "zhusha",
    "windScroll",
    "cloudstep",
    "qingxin",
  ].map((id) => createCard(state, id));

  if (difficulty === "story") {
    deck.find((card) => card.id === "zhusha")!.upgraded = true;
    deck.find((card) => card.id === "windScroll")!.upgraded = true;
  }

  state.player = {
    name: "海洋保育志工",
    hp: spec.playerHp,
    maxHp: spec.playerHp,
    block: 0,
    energy: spec.maxEnergy,
    maxEnergy: spec.maxEnergy,
    incense: 0,
    gold: spec.gold,
    weak: 0,
    vulnerable: 0,
    powers: {},
    deck,
    relics: [],
  };
  state.difficulty = difficulty;
  spec.startingRelics.forEach((id) => addRelic(state, id));
  state.floor = 0;
  state.mapNodes = generateRouteMap(state);
  state.availableNodeIds = state.mapNodes.filter((node) => node.row === 0).map((node) => node.id);
  state.currentNodeId = null;
  state.visitedNodeIds = [];
  state.combat = null;
  state.cinematic = null;
  state.reward = null;
  state.event = null;
  state.shop = null;
  state.pendingRemove = null;
  state.pendingUpgrade = null;
  state.log = [];
  addLog(state, `難度：${spec.logName}。`);
  addLog(state, "清晨五點，布袋漁港的燈還亮著。");
  addLog(state, "嘉義縣海洋教育中心的無線電傳來警報，外海有異常活動。");
  addLog(state, "你別上識別章，引擎發動，守浪的任務從現在開始。");
  state.screen = "map";
  state.lastFx = "reward";
}

function generateRouteMap(state: GameState): MapNode[] {
  const rows: Array<Array<{ lane: number; type: NodeType }>> = [
    [
      { lane: 1, type: "combat" },
      { lane: 3, type: "combat" },
    ],
    shuffle(state, [
      { lane: 0, type: "combat" as NodeType },
      { lane: 2, type: "event" as NodeType },
      { lane: 4, type: "combat" as NodeType },
    ]),
    shuffle(state, [
      { lane: 0, type: "elite" as NodeType },
      { lane: 2, type: "event" as NodeType },
      { lane: 4, type: "shop" as NodeType },
    ]),
    shuffle(state, [
      { lane: 1, type: "rest" as NodeType },
      { lane: 2, type: "combat" as NodeType },
      { lane: 3, type: "event" as NodeType },
    ]),
    shuffle(state, [
      { lane: 0, type: "elite" as NodeType },
      { lane: 2, type: "combat" as NodeType },
      { lane: 4, type: "event" as NodeType },
    ]),
    shuffle(state, [
      { lane: 0, type: "shop" as NodeType },
      { lane: 2, type: "rest" as NodeType },
      { lane: 4, type: "combat" as NodeType },
    ]),
    shuffle(state, [
      { lane: 1, type: "elite" as NodeType },
      { lane: 2, type: "rest" as NodeType },
      { lane: 3, type: "event" as NodeType },
    ]),
    [{ lane: 2, type: "boss" }],
  ];

  const nodes: MapNode[] = rows.flatMap((row, rowIndex) =>
    row
      .sort((a, b) => a.lane - b.lane)
      .map((node, index) => ({
        id: `n-${rowIndex}-${index}`,
        row: rowIndex,
        lane: node.lane,
        type: node.type,
        nextIds: [],
      })),
  );

  for (let row = 0; row < rows.length - 1; row += 1) {
    const current = nodes.filter((node) => node.row === row);
    const next = nodes.filter((node) => node.row === row + 1);
    current.forEach((node) => {
      const adjacent = next.filter((candidate) => Math.abs(candidate.lane - node.lane) <= 2);
      const fallback = [...next].sort((a, b) => Math.abs(a.lane - node.lane) - Math.abs(b.lane - node.lane));
      node.nextIds = (adjacent.length ? adjacent : fallback.slice(0, 2)).map((candidate) => candidate.id);
    });
  }

  return nodes;
}

export function chooseNode(state: GameState, nodeId: string) {
  if (!state.availableNodeIds.includes(nodeId)) return;
  const node = state.mapNodes.find((item) => item.id === nodeId);
  if (!node) return;
  state.currentNodeId = node.id;
  state.visitedNodeIds.push(node.id);
  state.availableNodeIds = node.nextIds;
  state.floor = node.row + 1;
  const type = node.type;
  addLog(state, nodeTrailLine(node));
  if (type === "combat" || type === "elite" || type === "boss") startCombat(state, type);
  if (type === "event") startEvent(state);
  if (type === "rest") {
    state.screen = "rest";
    addLog(state, "中心補給站就在這裡，稍作休整再出發。");
  }
  if (type === "shop") startShop(state);
}

function enemyFor(state: GameState, type: "combat" | "elite" | "boss") {
  if (type === "boss") return "tigerlord";
  if (type === "elite") return pick(state, ["warlock", "foxshade"]);
  if (state.floor <= 1) return pick(state, ["lantern", "waterghost"]);
  if (state.floor <= 3) return pick(state, ["lantern", "waterghost", "templecorpse"]);
  return pick(state, ["lantern", "waterghost", "templecorpse", "macaque"]);
}

function startCombat(state: GameState, type: "combat" | "elite" | "boss") {
  const template = ENEMIES[enemyFor(state, type)];
  const spec = DIFFICULTY_SPECS[state.difficulty];
  const floorScale = Math.max(0, state.floor - 1);
  const baseHp = template.hp + (type === "combat" ? floorScale * 4 : floorScale * 6);
  const hp = Math.max(1, Math.round(baseHp * spec.enemyHp));
  const enemy: EnemyState = {
    ...template,
    hp,
    maxHp: hp,
    block: 0,
    strength: 0,
    seal: 0,
    weak: 0,
    vulnerable: 0,
    intent: null,
  };

  const player = mustPlayer(state);
  state.combat = {
    type,
    enemy,
    drawPile: shuffle(state, player.deck.map((card) => cloneCard(state, card))),
    discardPile: [],
    exhaustPile: [],
    hand: [],
    turn: 0,
    cardsPlayedThisTurn: 0,
    attackPlayed: false,
    pulse: 0,
    hitTarget: null,
  };
  player.block = 0;
  player.incense = 0;
  player.weak = 0;
  player.vulnerable = 0;
  player.powers = {};
  state.screen = "combat";
  if (hasRelic(state, "bronzeMirror")) applySeal(state, 2, false);
  chooseEnemyIntent(state);
  startPlayerTurn(state);
  addLog(state, `${enemy.name}出現在巡邏海域。`);
  state.lastFx = type === "boss" ? "danger" : "none";
}

function mustPlayer(state: GameState): PlayerState {
  if (!state.player) throw new Error("Player is not initialized");
  return state.player;
}

function mustCombat(state: GameState): CombatState {
  if (!state.combat) throw new Error("Combat is not active");
  return state.combat;
}

function chooseEnemyIntent(state: GameState) {
  const enemy = mustCombat(state).enemy;
  enemy.intent = pick(state, enemy.moves);
}

function startPlayerTurn(state: GameState) {
  const combat = mustCombat(state);
  const player = mustPlayer(state);
  combat.turn += 1;
  combat.cardsPlayedThisTurn = 0;
  combat.attackPlayed = false;
  player.block = 0;
  player.energy = player.maxEnergy;

  if (combat.turn === 1) {
    if (hasRelic(state, "paperHorse")) {
      player.energy += 1;
      addLog(state, "迷你無人機起飛偵查，第一回合能量 +1。");
    }
    if (hasRelic(state, "citySeal")) {
      player.incense += 2;
      addLog(state, "海洋教育中心識別章發亮，獲得 2 點海洋保育能力。");
    }
    if (hasRelic(state, "oldUmbrella")) gainBlock(state, 6, "防水夾克");
  }

  if (player.powers.citygod) {
    gainBlock(state, player.powers.citygod, "呼叫中心支援");
    player.incense += 1;
    addLog(state, "中心支援到位，海洋保育能力 +1。");
  }

  const drawCount = 5 + (player.powers.nightEye || 0) + (combat.turn === 1 && hasRelic(state, "nightSand") ? 1 : 0);
  drawCards(state, drawCount);
}

function drawCards(state: GameState, count: number) {
  const combat = mustCombat(state);
  for (let i = 0; i < count; i += 1) {
    if (combat.drawPile.length === 0) {
      if (combat.discardPile.length === 0) break;
      combat.drawPile = shuffle(state, combat.discardPile);
      combat.discardPile = [];
      addLog(state, "棄牌堆洗回抽牌堆。");
    }
    const card = combat.drawPile.pop();
    if (card) combat.hand.push(card);
  }
}

function gainBlock(state: GameState, amount: number, source = "防護") {
  mustPlayer(state).block += amount;
  addLog(state, `${source}獲得 ${amount} 點防護。`);
  state.lastFx = "charge";
}

function applySeal(state: GameState, amount: number, withLog = true) {
  const enemy = mustCombat(state).enemy;
  enemy.seal += amount;
  if (withLog) addLog(state, `${enemy.name}累積 ${amount} 層清除污染程度。`);
}

function applyWeak(state: GameState, amount: number) {
  const enemy = mustCombat(state).enemy;
  enemy.weak += amount;
  addLog(state, `${enemy.name}虛弱 ${amount} 回合。`);
}

function applyVulnerable(state: GameState, amount: number) {
  const enemy = mustCombat(state).enemy;
  enemy.vulnerable += amount;
  addLog(state, `${enemy.name}易傷 ${amount} 回合。`);
}

function dealEnemyDamage(state: GameState, baseAmount: number, hits = 1, context: { firstAttackBonus?: boolean } = {}) {
  const combat = mustCombat(state);
  const enemy = combat.enemy;
  let total = 0;
  for (let i = 0; i < hits; i += 1) {
    let amount = baseAmount;
    if (context.firstAttackBonus && i === 0) amount += 4;
    if (mustPlayer(state).weak > 0) amount = Math.floor(amount * 0.75);
    if (enemy.vulnerable > 0) amount = Math.floor(amount * 1.5);
    const blocked = Math.min(enemy.block, amount);
    enemy.block -= blocked;
    const dealt = amount - blocked;
    enemy.hp = Math.max(0, enemy.hp - dealt);
    total += dealt;
  }
  addLog(state, `造成 ${total} 點傷害。`);
  state.lastFx = "hit";
  combat.hitTarget = "enemy";
  combat.pulse += 1;
}

function losePlayerHp(state: GameState, amount: number, source = "失去生命") {
  const player = mustPlayer(state);
  player.hp = Math.max(0, player.hp - amount);
  addLog(state, `${source}：失去 ${amount} 點生命。`);
  if (state.combat) {
    state.combat.hitTarget = "player";
    state.combat.pulse += 1;
  }
  state.lastFx = "impact";
  if (player.hp <= 0) {
    state.screen = "gameover";
    state.lastFx = "danger";
  }
}

function enemyAttack(state: GameState, base: number, hits = 1) {
  const player = mustPlayer(state);
  const combat = mustCombat(state);
  const spec = DIFFICULTY_SPECS[state.difficulty];
  let total = 0;
  for (let i = 0; i < hits; i += 1) {
    let amount = Math.max(1, Math.round(base * spec.enemyDamage)) + combat.enemy.strength;
    if (combat.enemy.weak > 0) amount = Math.floor(amount * 0.75);
    const blocked = Math.min(player.block, amount);
    player.block -= blocked;
    const dealt = amount - blocked;
    player.hp = Math.max(0, player.hp - dealt);
    total += dealt;
  }
  addLog(state, `${combat.enemy.name}造成 ${total} 點傷害。`);
  state.lastFx = "impact";
  combat.hitTarget = "player";
  combat.pulse += 1;
  if (player.hp <= 0) state.screen = "gameover";
}

function attackFxForCard(card: CardInstance) {
  if (card.id === "thunder" || card.id === "thunderLaw") return "lightning";
  if (card.id === "zhusha" || card.id === "burn") return "fire";
  return "impact";
}

export function playCard(state: GameState, uid: string) {
  const combat = mustCombat(state);
  const player = mustPlayer(state);
  const index = combat.hand.findIndex((card) => card.uid === uid);
  if (index < 0) return;
  const card = combat.hand[index];
  const def = cardDef(card);
  if (def.unplayable || typeof def.cost !== "number" || player.energy < def.cost) return;

  player.energy -= def.cost;
  combat.hand.splice(index, 1);
  state.lastFx = "card";
  const context = {
    firstAttackBonus: def.type === "attack" && !combat.attackPlayed && hasRelic(state, "taomuTassel"),
  };
  resolveCard(state, card, context);
  if (state.screen === "gameover") return;
  if (def.type === "attack" && ["hit", "impact", "fire", "lightning"].includes(state.lastFx)) {
    state.lastFx = attackFxForCard(card);
  }

  if (def.type === "attack") combat.attackPlayed = true;
  if (def.type === "skill" && hasRelic(state, "brokenCenser")) gainBlock(state, 1, "破香炉");

  combat.cardsPlayedThisTurn += 1;
  if (hasRelic(state, "blankPage") && combat.cardsPlayedThisTurn % 3 === 0) {
    drawCards(state, 1);
    addLog(state, "布袋海域調查筆記翻動，抽 1 張牌。");
  }

  if (def.type === "power" || def.exhaust || card.temp) {
    combat.exhaustPile.push(card);
  } else {
    combat.discardPile.push(card);
  }

  if (combat.enemy.hp <= 0) winCombat(state);
}

function resolveCard(state: GameState, card: CardInstance, context: { firstAttackBonus?: boolean }) {
  const player = mustPlayer(state);
  const enemy = mustCombat(state).enemy;

  switch (card.id) {
    case "strike":
      dealEnemyDamage(state, value(card, 6, 9), 1, context);
      break;
    case "defend":
      gainBlock(state, value(card, 5, 8), cardName(card));
      break;
    case "zhusha":
      dealEnemyDamage(state, value(card, 4, 6), 1, context);
      applySeal(state, value(card, 1, 2));
      break;
    case "taomu":
      dealEnemyDamage(state, value(card, 4, 5), 2, context);
      break;
    case "cloudstep":
      gainBlock(state, value(card, 3, 5), cardName(card));
      drawCards(state, 1);
      break;
    case "qingxin":
      drawCards(state, value(card, 2, 3));
      addLog(state, `${cardName(card)}抽牌。`);
      break;
    case "golden":
      gainBlock(state, value(card, 8, 11), cardName(card));
      player.incense += 1;
      addLog(state, "海洋保育能力 +1。");
      break;
    case "incense":
      player.incense += value(card, 2, 3);
      addLog(state, `海洋保育能力 +${value(card, 2, 3)}。`);
      break;
    case "windScroll":
      drawCards(state, 1 + (enemy.seal > 0 ? value(card, 1, 2) : 0));
      addLog(state, `${cardName(card)}感知洋流。`);
      break;
    case "thunder":
      dealEnemyDamage(state, value(card, 10, 14), 1, context);
      if (enemy.seal > 0) dealEnemyDamage(state, value(card, 6, 8));
      break;
    case "bell":
      gainBlock(state, value(card, 3, 5), cardName(card));
      applyWeak(state, value(card, 2, 3));
      break;
    case "fog":
      gainBlock(state, value(card, 6, 9), cardName(card));
      drawCards(state, 1);
      break;
    case "command":
      gainBlock(state, value(card, 4, 6), cardName(card));
      applySeal(state, value(card, 4, 5));
      break;
    case "burn": {
      const layers = enemy.seal;
      enemy.seal = 0;
      if (layers > 0) {
        dealEnemyDamage(state, layers * value(card, 5, 7));
        addLog(state, `引爆 ${layers} 層清除污染程度。`);
      } else {
        addLog(state, "海域乾淨，沒有清除污染程度可以引爆。");
      }
      break;
    }
    case "paper":
      gainBlock(state, value(card, 7, 10), cardName(card));
      mustCombat(state).hand.push(createCard(state, "paperBlade", card.upgraded, true));
      addLog(state, "誘餌引出魚叉入手。");
      break;
    case "breakEvil":
      dealEnemyDamage(state, value(card, 14, 18), 1, context);
      if (enemy.seal > 0) {
        player.energy += 1;
        addLog(state, "執法成功，能量 +1。");
      }
      break;
    case "mirror":
      applySeal(state, value(card, 2, 3));
      applyVulnerable(state, 2);
      break;
    case "refine":
      player.energy += 1;
      losePlayerHp(state, value(card, 2, 1), cardName(card));
      break;
    case "scripture":
      drawCards(state, value(card, 3, 4));
      mustCombat(state).discardPile.push(createCard(state, "yinCold"));
      addLog(state, "資料調閱完成，但污泥也混入牌堆。");
      break;
    case "ashReturn":
      recycleDiscardIntoDraw(state);
      drawCards(state, value(card, 1, 2));
      gainBlock(state, value(card, 4, 6), cardName(card));
      break;
    case "nightEye":
      player.powers.nightEye = 1;
      addLog(state, "生態監測儀啟動，每回合多抽 1 張牌。");
      if (card.upgraded) drawCards(state, 1);
      break;
    case "citygod":
      player.powers.citygod = value(card, 3, 5);
      addLog(state, "中心支援已呼叫，本場戰鬥每回合護衛到位。");
      break;
    case "thunderLaw": {
      const spent = player.incense;
      player.incense = 0;
      dealEnemyDamage(state, value(card, 12, 16) + spent * value(card, 5, 6), 1, context);
      addLog(state, `全力清污消耗 ${spent} 點海洋保育能力。`);
      break;
    }
    case "paperBlade":
      dealEnemyDamage(state, value(card, 3, 5), 1, context);
      break;
  }
}

export function endTurn(state: GameState) {
  const combat = mustCombat(state);
  const coldCount = combat.hand.filter((card) => card.id === "yinCold").length;
  if (coldCount > 0) losePlayerHp(state, coldCount * 2, "污泥侵蝕");
  if (state.screen === "gameover") return;

  while (combat.hand.length) {
    const card = combat.hand.pop();
    if (!card) break;
    if (card.temp || cardDef(card).exhaust) combat.exhaustPile.push(card);
    else combat.discardPile.push(card);
  }
  enemyTurn(state);
}

function triggerSeal(state: GameState) {
  const enemy = mustCombat(state).enemy;
  if (enemy.seal <= 0) return;
  const perLayer = 3 + (hasRelic(state, "thunderWood") ? 1 : 0);
  const damage = enemy.seal * perLayer;
  enemy.hp = Math.max(0, enemy.hp - damage);
  addLog(state, `清除污染程度爆發，造成 ${damage} 點傷害。`);
  enemy.seal = Math.max(0, enemy.seal - 1);
  state.lastFx = "fire";
  const combat = mustCombat(state);
  combat.hitTarget = "enemy";
  combat.pulse += 1;
}

function enemyTurn(state: GameState) {
  const combat = mustCombat(state);
  const enemy = combat.enemy;
  triggerSeal(state);
  if (enemy.hp <= 0) {
    winCombat(state);
    return;
  }

  const intent = enemy.intent;
  if (!intent) return;
  if (intent.type === "attack") enemyAttack(state, intent.amount, intent.hits || 1);
  if (intent.type === "block") {
    enemy.block += intent.amount;
    addLog(state, `${enemy.name}獲得 ${intent.amount} 點防護。`);
    state.lastFx = "charge";
  }
  if (intent.type === "buff") {
    enemy.strength += intent.amount;
    addLog(state, `${enemy.name}力量 +${intent.amount}。`);
    state.lastFx = "danger";
  }
  if (intent.type === "debuff") {
    mustPlayer(state).weak += intent.amount;
    addLog(state, `${enemy.name}令你虛弱 ${intent.amount} 回合。`);
    state.lastFx = "danger";
  }
  if (intent.type === "curse") {
    for (let i = 0; i < intent.amount; i += 1) combat.discardPile.push(createCard(state, "yinCold"));
    addLog(state, `${enemy.name}將 ${intent.amount} 張污泥塞入棄牌堆。`);
    state.lastFx = "danger";
  }
  if (intent.type === "blockAttack") {
    enemy.block += intent.block || 0;
    addLog(state, `${enemy.name}獲得 ${intent.block || 0} 點防護。`);
    enemyAttack(state, intent.amount, intent.hits || 1);
  }

  enemy.weak = Math.max(0, enemy.weak - 1);
  enemy.vulnerable = Math.max(0, enemy.vulnerable - 1);
  const player = mustPlayer(state);
  player.weak = Math.max(0, player.weak - 1);
  player.vulnerable = Math.max(0, player.vulnerable - 1);

  if (player.hp <= 0) {
    state.screen = "gameover";
    return;
  }
  chooseEnemyIntent(state);
  startPlayerTurn(state);
}

function winCombat(state: GameState) {
  const combat = mustCombat(state);
  const enemy = combat.enemy;
  if (combat.type === "boss") {
    state.cinematic = createCinematicState(enemy, combat.type, "victory");
    state.combat = null;
    state.screen = "cinematic";
    addLog(state, "外海霧散，非法捕鯨母船引擎熄滅。");
    state.lastFx = "reward";
    return;
  }

  const spec = DIFFICULTY_SPECS[state.difficulty];
  const gold = Math.round((int(state, 18, 32) + (combat.type === "elite" ? 18 : 0)) * spec.rewardGold);
  mustPlayer(state).gold += gold;
  let relic: RelicDef | null = null;
  if (combat.type === "elite" || random(state) > 0.8) relic = gainRandomRelic(state);
  state.reward = {
    title: `${enemy.name}驅離`,
    gold,
    relic,
    cards: randomCardChoices(state, 3),
  };
  state.cinematic = createCinematicState(enemy, combat.type, "reward", {
    gold,
    relicName: relic?.name,
  });
  state.combat = null;
  state.screen = "cinematic";
  addLog(state, `获得 ${gold} 金。`);
  state.lastFx = "reward";
}

function createCinematicState(
  enemy: EnemyState,
  combatType: "combat" | "elite" | "boss",
  nextScreen: "reward" | "victory",
  rewardSummary?: { gold: number; relicName?: string },
) {
  const slug = combatType === "boss" ? `boss-${enemy.id}` : enemy.id;
  const title = combatType === "boss" ? `${enemy.name}擊沉` : combatType === "elite" ? `${enemy.name}驅離` : `${enemy.name}清除`;
  const subtitle =
    combatType === "boss"
      ? "非法捕鯨母船引擎熄滅，沉入布袋外海的深藍。你把識別章別回胸口，遠處燈塔重新亮起。嘉義縣海洋教育中心的任務從未結束——每一片乾淨的海，都是有人守過的結果。"
      : combatType === "elite"
        ? "非法作業現場淨空，保育徽章在浪花中浮現。"
        : "海域恢復平靜，巡邏路線重新暢通。";
  return {
    enemyId: enemy.id,
    enemyName: enemy.name,
    enemyArtKey: enemy.artKey,
    combatType,
    title,
    subtitle,
    videoUrl: `/assets/generated/cinematics/victory-${slug}.mp4`,
    posterUrl: `/assets/generated/cinematics/victory-${slug}-poster.png`,
    nextScreen,
    rewardSummary,
  };
}

export function finishCinematic(state: GameState) {
  const cinematic = state.cinematic;
  if (!cinematic) {
    if (state.reward) state.screen = "reward";
    return;
  }
  state.cinematic = null;
  state.screen = cinematic.nextScreen;
  state.lastFx = cinematic.nextScreen === "victory" ? "reward" : "none";
}

function randomCardChoices(state: GameState, count: number) {
  const cards: CardInstance[] = [];
  const cycleIds = ["cloudstep", "qingxin", "windScroll", "fog", "ashReturn", "scripture", "refine", "nightEye"];
  const payoffIds = ["thunder", "burn", "breakEvil", "mirror", "command", "paper", "incense", "citygod"];
  const pool = shuffle(state, CARD_POOL);
  for (const id of pool) {
    if (cards.length >= count) break;
    cards.push(createCard(state, id));
  }
  if (cards.length >= 3 && !cards.some((card) => cycleIds.includes(card.id))) {
    const replacement = pick(state, cycleIds);
    cards[0] = createCard(state, replacement);
  }
  if (cards.length >= 3 && !cards.some((card) => payoffIds.includes(card.id))) {
    const replacement = pick(state, payoffIds);
    cards[1] = createCard(state, replacement);
  }
  if (cards.length === 1 && state.floor <= 3 && random(state) < 0.55) {
    cards[0] = createCard(state, pick(state, cycleIds));
  }
  return cards;
}

function gainRandomRelic(state: GameState) {
  const owned = new Set(mustPlayer(state).relics.map((relic) => relic.id));
  const options = RELICS.filter((relic) => !owned.has(relic.id));
  if (options.length === 0) return null;
  const relic = pick(state, options);
  addRelic(state, relic.id);
  return relic;
}

function addRelic(state: GameState, id: string) {
  const player = mustPlayer(state);
  const relic = RELICS.find((item) => item.id === id);
  if (!relic || hasRelic(state, id)) return null;
  player.relics.push(relic);
  addLog(state, `獲得保育徽章：${relic.name}。`);
  if (relic.onGain === "gold60") {
    player.gold += 60;
    addLog(state, "漁港舊錢幣兌換為 60 補給費。");
  }
  return relic;
}

export function takeRewardCard(state: GameState, uid: string) {
  const card = state.reward?.cards.find((item) => item.uid === uid);
  if (!card) return;
  mustPlayer(state).deck.push(createCard(state, card.id, card.upgraded));
  addLog(state, `獲得技能牌：${cardName(card)}。`);
  goMap(state);
}

export function goMap(state: GameState) {
  state.cinematic = null;
  state.reward = null;
  state.event = null;
  state.shop = null;
  state.pendingRemove = null;
  state.pendingUpgrade = null;
  state.screen = "map";
}

function recycleDiscardIntoDraw(state: GameState) {
  const combat = mustCombat(state);
  if (combat.discardPile.length === 0) {
    addLog(state, "棄牌堆空空如也。");
    return;
  }
  combat.drawPile = shuffle(state, [...combat.drawPile, ...combat.discardPile]);
  combat.discardPile = [];
  addLog(state, "潮汐回流，棄牌堆洗回抽牌堆。");
}

function startEvent(state: GameState) {
  state.event = pick(state, EVENTS);
  state.screen = "event";
  addLog(state, `${state.event.title}出現在任務途中。`);
}

export function resolveEvent(state: GameState, choiceId: string) {
  const player = mustPlayer(state);
  if (choiceId === "wellHeal") {
    heal(state, 12);
    goMap(state);
  }
  if (choiceId === "wellRelic") {
    losePlayerHp(state, 7, "救援耗損");
    if (state.screen !== "gameover") {
      gainRandomRelic(state);
      goMap(state);
    }
  }
  if (choiceId === "foxCard") {
    const card = randomCardChoices(state, 1)[0];
    player.deck.push(createCard(state, card.id));
    addLog(state, `老漁翁的海圖化為 ${cardName(card)}。`);
    goMap(state);
  }
  if (choiceId === "foxRemove") openRemoveCard(state, 40, "map");
  if (choiceId === "templeUpgrade") openUpgrade(state, "map");
  if (choiceId === "templeGold") {
    player.gold += 80;
    player.deck.push(createCard(state, "yinCold"));
    addLog(state, "獲得 80 補給費，污泥也混入牌組。");
    goMap(state);
  }
  if (choiceId === "scholarCopy") {
    const candidates = player.deck.filter((card) => !["basic", "status"].includes(cardDef(card).rarity));
    const source = candidates.length ? pick(state, candidates) : createCard(state, "qingxin");
    player.deck.push(createCard(state, source.id, source.upgraded));
    player.deck.push(createCard(state, "yinCold"));
    addLog(state, `研究員筆記讓你習得 ${cardName(source)}，但污泥也隨之混入。`);
    goMap(state);
  }
  if (choiceId === "scholarLeave") {
    addLog(state, "任務優先，繼續前進。");
    goMap(state);
  }
}

export function heal(state: GameState, amount: number) {
  const player = mustPlayer(state);
  const before = player.hp;
  player.hp = Math.min(player.maxHp, player.hp + amount);
  addLog(state, `回复 ${player.hp - before} 点生命。`);
  state.lastFx = "reward";
}

export function restHeal(state: GameState) {
  heal(state, Math.ceil(mustPlayer(state).maxHp * 0.3));
  goMap(state);
}

export function openUpgrade(state: GameState, returnScreen: "map" | "shop") {
  state.pendingUpgrade = { returnScreen };
  state.screen = "upgrade";
}

export function upgradeCard(state: GameState, uid: string) {
  const card = mustPlayer(state).deck.find((item) => item.uid === uid);
  if (!card || card.upgraded || cardDef(card).rarity === "status") return;
  card.upgraded = true;
  addLog(state, `${cardDef(card).name}已升级。`);
  state.lastFx = "reward";
  goMap(state);
}

function startShop(state: GameState) {
  state.shop = {
    cards: randomCardChoices(state, 3).map((card) => ({ card, sold: false, cost: shopCardCost(card) })),
    relic: { relic: randomShopRelic(state), sold: false, cost: 150 },
    removeCost: 75,
  };
  state.screen = "shop";
  addLog(state, "阴市灯摊摊开货匣，符纸和旧器都沾着冷香。");
}

function randomShopRelic(state: GameState) {
  const owned = new Set(mustPlayer(state).relics.map((relic) => relic.id));
  const options = RELICS.filter((relic) => !owned.has(relic.id));
  return options.length ? pick(state, options) : null;
}

function shopCardCost(card: CardInstance) {
  const rarity = cardDef(card).rarity;
  if (rarity === "rare") return 95;
  if (rarity === "uncommon") return 68;
  return 48;
}

export function buyShopCard(state: GameState, index: number) {
  const item = state.shop?.cards[index];
  const player = mustPlayer(state);
  if (!item || item.sold || player.gold < item.cost) return;
  player.gold -= item.cost;
  player.deck.push(createCard(state, item.card.id));
  item.sold = true;
  addLog(state, `买下 ${cardName(item.card)}。`);
  state.lastFx = "reward";
}

export function buyShopRelic(state: GameState) {
  const item = state.shop?.relic;
  const player = mustPlayer(state);
  if (!item?.relic || item.sold || player.gold < item.cost) return;
  player.gold -= item.cost;
  addRelic(state, item.relic.id);
  item.sold = true;
  state.lastFx = "reward";
}

export function openRemoveCard(state: GameState, cost: number, returnScreen: "map" | "shop") {
  if (mustPlayer(state).gold < cost) {
    addLog(state, "金币不足。");
    return;
  }
  state.pendingRemove = { cost, returnScreen };
  state.screen = "remove";
}

export function removeCard(state: GameState, uid: string) {
  const pending = state.pendingRemove;
  const player = mustPlayer(state);
  const index = player.deck.findIndex((card) => card.uid === uid);
  if (!pending || index < 0 || player.gold < (pending.cost || 0)) return;
  const [removed] = player.deck.splice(index, 1);
  player.gold -= pending.cost || 0;
  addLog(state, `烧掉了 ${cardName(removed)}。`);
  state.lastFx = "reward";
  if (pending.returnScreen === "shop") {
    state.screen = "shop";
    state.pendingRemove = null;
    return;
  }
  goMap(state);
}

export function shopState(state: GameState): ShopState | null {
  return state.shop;
}
