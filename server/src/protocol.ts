export type PlayerSide = "A" | "B";

export type BattlePhase = "MAIN" | "BATTLE";

export type CardType = "creature" | "spell" | "trap" | "field" | "equipment";

export type BattleOutcome = {
  result: "victory" | "defeat" | "draw" | "surrender";
  winnerSide?: PlayerSide;
};

export type CardDefinition = {
  id: string;
  name: string;
  type: CardType;
  rarity?: string;
  element?: string;
  archetype?: string;
  cost: number;

  // Creature stats
  atk?: number;
  def?: number;
  hp?: number;

  // Spell effects
  effects?: EffectDescriptor[];
};

export type CardInBattle = {
  instanceId: string;
  cardId: string;
  // Creature runtime state
  hp?: number;
  atk?: number;
  def?: number;

  // Flags (MVP)
  attackedThisTurn?: boolean;
  summonedThisTurn?: boolean;
};

export type BattlefieldState = {
  creatureZone: Array<CardInBattle | null>;
  spellTrapZone: Array<CardInBattle | null>;
  fieldZone?: CardInBattle | null;
};

export type PlayerRuntimeState = {
  userId: string;
  side: PlayerSide;
  deckCardIds: string[]; // remaining deck (top is end)

  hand: CardInBattle[];
  battlefield: BattlefieldState;
  graveyard: CardInBattle[];

  lp: number;
  energy: number;
};

export type BattleChainJob = {
  id: string;
  effectType: EffectType;
  payload: Record<string, unknown>;
};

export type ChainEventLog = {
  jobId: string;
  effectType: EffectType;
  resolved: boolean;
};

export type EffectType = "damage" | "heal" | "draw";

export type EffectDescriptor = {
  effectType: EffectType;
  // Where to apply the effect
  target:
    | "enemy_creature"
    | "enemy_life"
    | "friendly_creature"
    | "friendly_life";

  amount?: number;
  drawCount?: number;
};

export type BattleState = {
  matchId: string;
  turnNumber: number; // global turn counter (each side increments once)
  activeSide: PlayerSide;
  phase: BattlePhase;

  players: {
    A: PlayerRuntimeState;
    B: PlayerRuntimeState;
  };

  lastAction?: BattleActionLog;
  chainLog: ChainEventLog[];
  replay: BattleActionLog[];
  outcome?: BattleOutcome;
  createdAtMs: number;
};

export type BattleAction =
  | {
      type: "SUMMON";
      actorSide: PlayerSide;
      handInstanceId: string;
      creatureSlotIndex: number;
    }
  | {
      type: "PLAY_SPELL";
      actorSide: PlayerSide;
      handInstanceId: string;
      // Optional target references (MVP)
      targetCreatureSlotIndex?: number;
      target: "enemy_creature" | "enemy_life" | "friendly_creature" | "friendly_life";
    }
  | {
      type: "ATTACK";
      actorSide: PlayerSide;
      attackerCreatureSlotIndex: number;
      target:
        | { kind: "enemy_creature"; enemyCreatureSlotIndex: number }
        | { kind: "enemy_life" };
    }
  | {
      type: "END_TURN";
      actorSide: PlayerSide;
    }
  | {
      type: "SURRENDER";
      actorSide: PlayerSide;
    };

export type BattleActionLog = {
  atMs: number;
  turnNumber: number;
  actorSide: PlayerSide;
  actionType: BattleAction["type"];
  actionPayload: Record<string, unknown>;
};

export type StartPracticeRequest = {
  matchType: "pvp_normal_practice";
  playerA: { userId: string; deckCardIds: string[] };
  playerB: { userId: string; deckCardIds: string[] };
};

export type StartPracticeResponse = {
  matchId: string;
  state: BattleState;
};

export type SubmitBattleActionRequest = {
  matchId: string;
  action: BattleAction;
};

export type SubmitBattleActionResponse = {
  state: BattleState;
};

