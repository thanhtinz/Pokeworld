import { BattleState, BattlefieldState, CardInBattle, PlayerSide, StartPracticeRequest } from "../protocol";
import { CardsRepository } from "../cards/cardsRepository";
import { config } from "../config";
import { createMulberry32, shuffleInPlace } from "../util/rng";
import { newInstanceId } from "../util/id";

function emptyBattlefield(creatureZoneSize: number, spellZoneSize: number): BattlefieldState {
  return {
    creatureZone: Array.from({ length: creatureZoneSize }, () => null),
    spellTrapZone: Array.from({ length: spellZoneSize }, () => null)
  };
}

function makeCardInstanceFromDefinition(cardId: string, def: ReturnType<CardsRepository["getCardById"]>): CardInBattle {
  const instanceId = newInstanceId("ci");
  if (!def) throw new Error(`Card definition missing for ${cardId}`);
  if (def.type === "creature") {
    return {
      instanceId,
      cardId,
      hp: def.hp ?? 0,
      atk: def.atk ?? 0,
      def: def.def ?? 0
    };
  }
  // Spell runtime state is trivial in MVP.
  return { instanceId, cardId };
}

function drawOne(deck: string[], playerSide: PlayerSide, userId: string, cardsRepo: CardsRepository) {
  const top = deck.pop();
  if (!top) return null;
  const def = cardsRepo.getCardById(top);
  if (!def) return null;
  const inst = makeCardInstanceFromDefinition(top, def);
  return inst;
}

export function createPracticeBattleState(args: StartPracticeRequest, cardsRepo: CardsRepository): BattleState {
  const matchId = `m_${newInstanceId("match")}`;
  const createdAtMs = Date.now();

  // Seed: deterministic shuffle within a match replay window.
  const seed = Math.floor(createdAtMs % 2147483647) + Math.floor(Math.random() * 1_000_000);
  const rnd = createMulberry32(seed);

  const creatureZoneSize = config.creatureZoneSize;
  const spellZoneSize = config.spellZoneSize;

  const makePlayer = (side: PlayerSide, userId: string, deckCardIds: string[]) => {
    // Shuffle deck deterministically
    const deck = [...deckCardIds];
    shuffleInPlace(deck, rnd);

    const hand: CardInBattle[] = [];
    for (let i = 0; i < config.startingHandSize; i++) {
      const drawn = drawOne(deck, side, userId, cardsRepo);
      if (!drawn) break;
      hand.push(drawn);
    }

    return {
      userId,
      side,
      deckCardIds: deck,
      hand,
      battlefield: emptyBattlefield(creatureZoneSize, spellZoneSize),
      graveyard: [],
      lp: config.startingLp,
      energy: config.energyPerTurnBase * 1
    };
  };

  const A = makePlayer("A", args.playerA.userId, args.playerA.deckCardIds);
  const B = makePlayer("B", args.playerB.userId, args.playerB.deckCardIds);

  const state: BattleState = {
    matchId,
    createdAtMs,
    turnNumber: 1,
    activeSide: "A",
    phase: "MAIN",
    players: {
      A,
      B
    },
    chainLog: [],
    replay: [],
    lastAction: undefined
  };

  return state;
}

