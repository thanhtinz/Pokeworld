import {
  BattleAction,
  BattleActionLog,
  BattleOutcome,
  BattleState,
  CardDefinition,
  CardInBattle,
  PlayerSide
} from "../protocol";
import { config } from "../config";
import { CardsRepository } from "../cards/cardsRepository";
import { validateDeck } from "./validate/deckValidator";
import { newInstanceId } from "../util/id";

export class BattleActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BattleActionError";
  }
}

function sideToPlayer(state: BattleState, side: PlayerSide) {
  return state.players[side];
}

function getEnemySide(side: PlayerSide): PlayerSide {
  return side === "A" ? "B" : "A";
}

function resolveDamageToCreature(attacker: CardInBattle, defender: CardInBattle) {
  const atk = attacker.atk ?? 0;
  const def = defender.def ?? 0;
  const dmg = Math.max(config.damage.creatureVsCreature.minDamage, atk - def);
  defender.hp = (defender.hp ?? 0) - dmg;
  return dmg;
}

function moveCreatureToGraveyard(player: ReturnType<typeof sideToPlayer>, slotIndex: number) {
  const creature = player.battlefield.creatureZone[slotIndex];
  if (!creature) return null;
  player.graveyard.push(creature);
  player.battlefield.creatureZone[slotIndex] = null;
  return creature;
}

function drawFromDeck(player: ReturnType<typeof sideToPlayer>, cardsRepo: CardsRepository, count: number) {
  for (let i = 0; i < count; i++) {
    const top = player.deckCardIds.pop();
    if (!top) break;
    const def = cardsRepo.getCardById(top);
    if (!def) continue;
    const inst: CardInBattle = { instanceId: newInstanceId("ci"), cardId: top };
    if (def.type === "creature") {
      inst.hp = def.hp ?? 0;
      inst.atk = def.atk ?? 0;
      inst.def = def.def ?? 0;
    }
    player.hand.push(inst);
  }
}

function setOutcome(state: BattleState, outcome: BattleOutcome) {
  state.outcome = outcome;
}

function makeOutcomeForActor(side: PlayerSide, result: BattleOutcome["result"], winnerSide?: PlayerSide): BattleOutcome {
  return {
    result,
    winnerSide
  };
}

export function applyBattleAction(args: {
  state: BattleState;
  action: BattleAction;
  cardsRepo: CardsRepository;
}): BattleState {
  const { state, action, cardsRepo } = args;
  if (state.outcome) throw new BattleActionError("Match is already finished");

  const actorSide = action.actorSide;
  const actor = sideToPlayer(state, actorSide);
  const enemySide = getEnemySide(actorSide);
  const enemy = sideToPlayer(state, enemySide);

  const replayLog: BattleActionLog = {
    atMs: Date.now(),
    turnNumber: state.turnNumber,
    actorSide,
    actionType: action.type,
    actionPayload: JSON.parse(
      JSON.stringify(action, (k, v) => (k === "actorSide" ? undefined : v))
    ) as Record<string, unknown>
  };
  state.replay.push(replayLog);
  state.lastAction = replayLog;

  // Soft check: only active side can act, except SURRENDER.
  if (action.type !== "SURRENDER" && actorSide !== state.activeSide) {
    throw new BattleActionError(`Not your turn (activeSide=${state.activeSide})`);
  }

  const ensurePhase = (allowed: Array<BattleState["phase"]>) => {
    if (!allowed.includes(state.phase)) {
      throw new BattleActionError(`Action ${action.type} not allowed in phase ${state.phase}`);
    }
  };

  const resolveCardDef = (cardId: string): CardDefinition => {
    const def = cardsRepo.getCardById(cardId);
    if (!def) throw new BattleActionError(`Missing card definition: ${cardId}`);
    return def;
  };

  if (action.type === "SURRENDER") {
    setOutcome(state, {
      result: "surrender",
      winnerSide: enemySide
    });
    return state;
  }

  if (action.type === "END_TURN") {
    if (actorSide !== state.activeSide) throw new BattleActionError("Only active side can end turn");

    const nextSide: PlayerSide = enemySide;
    state.activeSide = nextSide;
    state.turnNumber += 1;
    state.phase = "MAIN";

    // Reset energy and per-turn flags for next side
    const next = sideToPlayer(state, nextSide);
    next.energy = config.energyPerTurnBase * state.turnNumber;
    for (let i = 0; i < next.battlefield.creatureZone.length; i++) {
      const c = next.battlefield.creatureZone[i];
      if (!c) continue;
      c.attackedThisTurn = false;
      c.summonedThisTurn = false;
    }
    drawFromDeck(next, cardsRepo, config.drawPerTurn);

    return state;
  }

  if (action.type === "SUMMON") {
    ensurePhase(["MAIN"]);
    if (action.creatureSlotIndex < 0 || action.creatureSlotIndex >= actor.battlefield.creatureZone.length) {
      throw new BattleActionError("Invalid creatureSlotIndex");
    }
    if (actor.battlefield.creatureZone[action.creatureSlotIndex]) {
      throw new BattleActionError("Creature slot is occupied");
    }
    const idx = actor.hand.findIndex((c) => c.instanceId === action.handInstanceId);
    if (idx < 0) throw new BattleActionError("Card not found in hand");
    const handCard = actor.hand[idx];
    const def = resolveCardDef(handCard.cardId);
    if (def.type !== "creature") throw new BattleActionError("SUMMON requires a creature card");
    if (actor.energy < def.cost) throw new BattleActionError("Not enough energy");

    // Pay cost and move from hand to battlefield
    actor.energy -= def.cost;
    actor.hand.splice(idx, 1);
    const inst: CardInBattle = {
      ...handCard,
      hp: def.hp ?? handCard.hp ?? 0,
      atk: def.atk ?? handCard.atk ?? 0,
      def: def.def ?? handCard.def ?? 0,
      attackedThisTurn: false,
      summonedThisTurn: true
    };
    actor.battlefield.creatureZone[action.creatureSlotIndex] = inst;
    return state;
  }

  if (action.type === "PLAY_SPELL") {
    ensurePhase(["MAIN"]);
    const idx = actor.hand.findIndex((c) => c.instanceId === action.handInstanceId);
    if (idx < 0) throw new BattleActionError("Card not found in hand");
    const handCard = actor.hand[idx];
    const def = resolveCardDef(handCard.cardId);
    if (def.type !== "spell") throw new BattleActionError("PLAY_SPELL requires a spell card");
    if (actor.energy < def.cost) throw new BattleActionError("Not enough energy");
    if (!def.effects) throw new BattleActionError("Spell card has no effects");

    actor.energy -= def.cost;
    actor.hand.splice(idx, 1);

    // Resolve spell effects sequentially (data-driven)
    for (const eff of def.effects) {
      const jobId = `job_${newInstanceId("eff")}`;
      const jobResolved = resolveEffect({
        state,
        actorSide,
        enemySide,
        eff,
        cardsRepo,
        request: action
      });
      state.chainLog.push({
        jobId,
        effectType: eff.effectType,
        resolved: jobResolved
      });
    }

    // If enemy LP reached 0, set outcome
    if (enemy.lp <= 0) {
      setOutcome(state, {
        result: "victory",
        winnerSide: actorSide
      });
    }

    return state;
  }

  if (action.type === "ATTACK") {
    if (state.phase !== "BATTLE" && state.phase !== "MAIN") {
      throw new BattleActionError(`ATTACK not allowed in phase ${state.phase}`);
    }
    // Allow attacking during MAIN; switch to BATTLE for clarity
    if (state.phase === "MAIN") state.phase = "BATTLE";

    if (action.attackerCreatureSlotIndex < 0 || action.attackerCreatureSlotIndex >= actor.battlefield.creatureZone.length) {
      throw new BattleActionError("Invalid attackerCreatureSlotIndex");
    }
    const attacker = actor.battlefield.creatureZone[action.attackerCreatureSlotIndex];
    if (!attacker) throw new BattleActionError("No creature in attacker slot");
    if ((attacker.hp ?? 0) <= 0) throw new BattleActionError("Attacker creature is defeated");
    if (attacker.attackedThisTurn) throw new BattleActionError("Creature already attacked this turn");

    const dealToEnemyLife = () => {
      const dmg = attacker.atk ?? 0;
      enemy.lp -= dmg;
      attacker.attackedThisTurn = true;
      if (enemy.lp <= 0) {
        setOutcome(state, { result: "victory", winnerSide: actorSide });
      }
    };

    if (action.target.kind === "enemy_life") {
      dealToEnemyLife();
      return state;
    }

    // Enemy creature target
    const targetIdx = action.target.enemyCreatureSlotIndex;
    if (targetIdx < 0 || targetIdx >= enemy.battlefield.creatureZone.length) {
      throw new BattleActionError("Invalid enemyCreatureSlotIndex");
    }
    const defender = enemy.battlefield.creatureZone[targetIdx];
    if (!defender) throw new BattleActionError("No creature in enemy slot");
    if ((defender.hp ?? 0) <= 0) throw new BattleActionError("Defender creature is defeated");

    // Damage exchange
    resolveDamageToCreature(attacker, defender);
    const attackerDefenderAlive = (defender.hp ?? 0) > 0;

    if (!attackerDefenderAlive) {
      moveCreatureToGraveyard(enemy, targetIdx);
    }

    // Counter-attack if defender survives
    if (attackerDefenderAlive) {
      resolveDamageToCreature(defender, attacker);
      if ((attacker.hp ?? 0) <= 0) {
        moveCreatureToGraveyard(actor, action.attackerCreatureSlotIndex);
      }
    }

    attacker.attackedThisTurn = true;

    // Victory condition: opponent LP <=0 (not hit in creature vs creature MVP)
    if (enemy.lp <= 0) {
      setOutcome(state, { result: "victory", winnerSide: actorSide });
    }

    return state;
  }

  throw new BattleActionError(`Unknown action type: ${(action as any).type}`);
}

function resolveEffect(args: {
  state: BattleState;
  actorSide: PlayerSide;
  enemySide: PlayerSide;
  eff: { effectType: string; target: string; amount?: number; drawCount?: number };
  cardsRepo: CardsRepository;
  request: any;
}): boolean {
  const { state, actorSide, enemySide, eff, request } = args;
  const actor = state.players[actorSide];
  const enemy = state.players[enemySide];

  // Determine target resolution for MVP
  const targetKind = eff.target;
  if (eff.effectType === "damage") {
    const amount = typeof eff.amount === "number" ? eff.amount : 0;
    if (targetKind === "enemy_life") {
      enemy.lp -= amount;
      return true;
    }
    if (targetKind === "friendly_life") {
      actor.lp -= amount;
      return true;
    }
    if (targetKind === "enemy_creature") {
      const slot = request.targetCreatureSlotIndex;
      if (typeof slot !== "number") throw new BattleActionError("targetCreatureSlotIndex is required for enemy_creature damage");
      const defender = enemy.battlefield.creatureZone[slot];
      if (!defender) return true;
      defender.hp = (defender.hp ?? 0) - amount;
      if ((defender.hp ?? 0) <= 0) {
        enemy.graveyard.push(defender);
        enemy.battlefield.creatureZone[slot] = null;
      }
      return true;
    }
    if (targetKind === "friendly_creature") {
      const slot = request.targetCreatureSlotIndex;
      if (typeof slot !== "number") throw new BattleActionError("targetCreatureSlotIndex is required for friendly_creature damage");
      const defender = actor.battlefield.creatureZone[slot];
      if (!defender) return true;
      defender.hp = (defender.hp ?? 0) - amount;
      if ((defender.hp ?? 0) <= 0) {
        actor.graveyard.push(defender);
        actor.battlefield.creatureZone[slot] = null;
      }
      return true;
    }
  }

  if (eff.effectType === "heal") {
    const amount = typeof eff.amount === "number" ? eff.amount : 0;
    if (targetKind === "enemy_life") {
      enemy.lp += amount; // rarely used in MVP
      return true;
    }
    if (targetKind === "friendly_life") {
      actor.lp += amount;
      return true;
    }
    if (targetKind === "enemy_creature") {
      const slot = request.targetCreatureSlotIndex;
      const c = enemy.battlefield.creatureZone[slot];
      if (!c) return true;
      c.hp = (c.hp ?? 0) + amount;
      return true;
    }
    if (targetKind === "friendly_creature") {
      const slot = request.targetCreatureSlotIndex;
      const c = actor.battlefield.creatureZone[slot];
      if (!c) return true;
      c.hp = (c.hp ?? 0) + amount;
      return true;
    }
  }

  if (eff.effectType === "draw") {
    // amount or drawCount
    const drawCount = typeof eff.drawCount === "number" ? eff.drawCount : typeof eff.amount === "number" ? eff.amount : 1;
    // Draw into the casting side
    const player = actor;
    for (let i = 0; i < drawCount; i++) {
      const top = player.deckCardIds.pop();
      if (!top) break;
      const def = args.cardsRepo.getCardById(top);
      if (!def) continue;
      const inst: CardInBattle = { instanceId: newInstanceId("ci"), cardId: top };
      if (def.type === "creature") {
        inst.hp = def.hp ?? 0;
        inst.atk = def.atk ?? 0;
        inst.def = def.def ?? 0;
      }
      player.hand.push(inst);
    }
    return true;
  }

  return false;
}

