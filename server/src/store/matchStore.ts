import { BattleState, StartPracticeRequest, SubmitBattleActionRequest, SubmitBattleActionResponse, PlayerSide, BattleAction } from "../protocol";
import { CardsRepository } from "../cards/cardsRepository";
import { createPracticeBattleState } from "../battle/createBattleState";
import { applyBattleAction } from "../battle/applyAction";

export class MatchStore {
  private readonly matches = new Map<string, BattleState>();
  constructor(private readonly cardsRepo: CardsRepository) {}

  createPracticeMatch(req: StartPracticeRequest): BattleState {
    const state = createPracticeBattleState(req, this.cardsRepo);
    this.matches.set(state.matchId, state);
    return state;
  }

  get(matchId: string): BattleState | undefined {
    return this.matches.get(matchId);
  }

  submitAction(req: SubmitBattleActionRequest): SubmitBattleActionResponse {
    const state = this.matches.get(req.matchId);
    if (!state) throw new Error("Unknown matchId");
    applyBattleAction({ state, action: req.action, cardsRepo: this.cardsRepo });
    return { state };
  }
}

