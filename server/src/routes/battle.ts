import { Router } from "express";
import { z } from "zod";
import { applyBattleAction, BattleActionError } from "../battle/applyAction";
import { MatchStore } from "../store/matchStore";
import { validateDeck } from "../battle/validate/deckValidator";
import { CardsRepository } from "../cards/cardsRepository";
import { config } from "../config";
import { StartPracticeRequest } from "../protocol";

const StartPracticeSchema = z.object({
  matchType: z.literal("pvp_normal_practice"),
  playerA: z.object({
    userId: z.string().min(1),
    deckCardIds: z.array(z.string().min(1))
  }),
  playerB: z.object({
    userId: z.string().min(1),
    deckCardIds: z.array(z.string().min(1))
  })
});

const BaseActionSchema = z.object({
  type: z.enum(["SUMMON", "PLAY_SPELL", "ATTACK", "END_TURN", "SURRENDER"]),
  actorSide: z.enum(["A", "B"])
});

const SummonSchema = BaseActionSchema.extend({
  type: z.literal("SUMMON"),
  handInstanceId: z.string().min(1),
  creatureSlotIndex: z.number().int().min(0)
});

const PlaySpellSchema = BaseActionSchema.extend({
  type: z.literal("PLAY_SPELL"),
  handInstanceId: z.string().min(1),
  targetCreatureSlotIndex: z.number().int().min(0).optional(),
  target: z.enum(["enemy_creature", "enemy_life", "friendly_creature", "friendly_life"])
});

const AttackSchema = BaseActionSchema.extend({
  type: z.literal("ATTACK"),
  attackerCreatureSlotIndex: z.number().int().min(0),
  target: z.union([
    z.object({ kind: z.literal("enemy_creature"), enemyCreatureSlotIndex: z.number().int().min(0) }),
    z.object({ kind: z.literal("enemy_life") })
  ])
});

const EndTurnSchema = BaseActionSchema.extend({
  type: z.literal("END_TURN")
});

const SurrenderSchema = BaseActionSchema.extend({
  type: z.literal("SURRENDER")
});

const ActionSchema = z.union([SummonSchema, PlaySpellSchema, AttackSchema, EndTurnSchema, SurrenderSchema]);

export function battleRouter(args: { matchStore: MatchStore; cardsRepo: CardsRepository }) {
  const router = Router();

  router.post("/battle/practice/start", (req, res) => {
    const parsed = StartPracticeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.format() });

    const body = parsed.data as StartPracticeRequest;

    // Validate decks (server-side rules, do not trust client)
    try {
      validateDeck(body.playerA.deckCardIds, args.cardsRepo);
      validateDeck(body.playerB.deckCardIds, args.cardsRepo);
    } catch (e: any) {
      return res.status(400).json({ error: "deck_invalid", message: e?.message ?? "unknown_error" });
    }

    const state = args.matchStore.createPracticeMatch(body);
    res.json({ matchId: state.matchId, state });
  });

  router.get("/battle/:matchId/state", (req, res) => {
    const state = args.matchStore.get(req.params.matchId);
    if (!state) return res.status(404).json({ error: "match_not_found" });
    res.json({ state });
  });

  router.post("/battle/:matchId/action", (req, res) => {
    const parsed = z.object({ matchId: z.string().min(1), action: ActionSchema }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid_request", details: parsed.error.format() });

    const { matchId, action } = parsed.data;
    try {
      const result = applyBattleAction({ state: args.matchStore.get(matchId)!, action, cardsRepo: args.cardsRepo });
      // `applyBattleAction` mutates state in-place
      res.json({ state: result });
    } catch (e: any) {
      if (e instanceof BattleActionError) {
        return res.status(400).json({ error: "battle_action_invalid", message: e.message });
      }
      return res.status(500).json({ error: "server_error", message: e?.message ?? "unknown_error" });
    }
  });

  return router;
}

