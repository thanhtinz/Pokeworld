import { createCardsRepositoryFromDisk } from "../src/cards/cardsRepository";
import { MatchStore } from "../src/store/matchStore";
import { applyBattleAction } from "../src/battle/applyAction";
import { StartPracticeRequest } from "../src/protocol";
import { validateDeck } from "../src/battle/validate/deckValidator";
import { config } from "../src/config";

function buildDeck(cardIds: string[], size: number) {
  const deck: string[] = [];
  const counts = new Map<string, number>();
  for (let i = 0; i < size; i++) {
    // Greedy: pick the next id that still allows maxCopies
    for (const id of cardIds) {
      const c = counts.get(id) ?? 0;
      if (c < config.deck.maxCopiesPerCard) {
        deck.push(id);
        counts.set(id, c + 1);
        break;
      }
    }
  }
  return deck;
}

async function main() {
  const cardsRepo = createCardsRepositoryFromDisk();
  const matchStore = new MatchStore(cardsRepo);

  const allIds = cardsRepo.getAllCards().map((c) => c.id);
  const deckAIds = buildDeck(allIds, 40);
  const deckBIds = buildDeck([...allIds].reverse(), 40);

  validateDeck(deckAIds, cardsRepo);
  validateDeck(deckBIds, cardsRepo);

  const req: StartPracticeRequest = {
    matchType: "pvp_normal_practice",
    playerA: { userId: "uA", deckCardIds: deckAIds },
    playerB: { userId: "uB", deckCardIds: deckBIds }
  };

  const state = matchStore.createPracticeMatch(req);
  console.log("matchId", state.matchId);
  console.log("turn", state.turnNumber, "active", state.activeSide, "phase", state.phase);

  const active = state.players[state.activeSide];
  // Choose a summonable creature (otherwise cast a cheap spell).
  const summonable = active.hand.find((ci) => {
    const def = cardsRepo.getCardById(ci.cardId);
    return def?.type === "creature" && (def.cost ?? 0) <= active.energy;
  });

  if (summonable) {
    applyBattleAction({
      state,
      action: {
        type: "SUMMON",
        actorSide: state.activeSide,
        handInstanceId: summonable.instanceId,
        creatureSlotIndex: 0
      },
      cardsRepo
    });

    console.log("After SUMMON: A lp", state.players.A.lp, "B lp", state.players.B.lp);
  } else {
    const castableSpell = active.hand.find((ci) => {
      const def = cardsRepo.getCardById(ci.cardId);
      return def?.type === "spell" && (def.cost ?? 0) <= active.energy && def.effects?.length;
    });
    if (!castableSpell) throw new Error("No summonable creature or castable spell found in starting hand (try re-run).");

    const def = cardsRepo.getCardById(castableSpell.cardId)!;
    // Pick the first effect target; for enemy_creature we use slot 0 as default.
    const firstEff = def.effects![0];
    const targetKind = firstEff.target as any;

    applyBattleAction({
      state,
      action: {
        type: "PLAY_SPELL",
        actorSide: state.activeSide,
        handInstanceId: castableSpell.instanceId,
        targetCreatureSlotIndex: 0,
        target: targetKind
      },
      cardsRepo
    });

    console.log("After PLAY_SPELL: A lp", state.players.A.lp, "B lp", state.players.B.lp, "chainLog", state.chainLog.length);
  }

  // Try attacking enemy life if attacker slot has a creature.
  if (state.players.A.battlefield.creatureZone[0] || state.players.B.battlefield.creatureZone[0]) {
    const actorSide = state.activeSide; // still actor's side unless END_TURN executed
    const attackerOwner = state.players[actorSide];
    if (attackerOwner.battlefield.creatureZone[0]) {
      applyBattleAction({
        state,
        action: {
          type: "ATTACK",
          actorSide,
          attackerCreatureSlotIndex: 0,
          target: { kind: "enemy_life" }
        },
        cardsRepo
      });
      console.log("After ATTACK: A lp", state.players.A.lp, "B lp", state.players.B.lp, "outcome", state.outcome);
    }
  }

  applyBattleAction({
    state,
    action: { type: "END_TURN", actorSide: state.activeSide },
    cardsRepo
  });

  console.log("After END_TURN: turn", state.turnNumber, "active", state.activeSide);
  console.log("chainLog", state.chainLog.length, "replayLog", state.replay.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

