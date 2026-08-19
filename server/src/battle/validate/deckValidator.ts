import { CardsRepository } from "../../cards/cardsRepository";
import { config } from "../../config";

export class DeckValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeckValidationError";
  }
}

export function validateDeck(deckCardIds: string[], cardsRepo: CardsRepository) {
  if (!Array.isArray(deckCardIds)) throw new DeckValidationError("deckCardIds must be an array");

  if (deckCardIds.length < config.deck.minCards || deckCardIds.length > config.deck.maxCards) {
    throw new DeckValidationError(
      `deckCardIds length must be in [${config.deck.minCards}, ${config.deck.maxCards}] (got ${deckCardIds.length})`
    );
  }

  const counts = new Map<string, number>();
  for (const id of deckCardIds) {
    if (!cardsRepo.getCardById(id)) throw new DeckValidationError(`Unknown cardId: ${id}`);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  for (const [cardId, count] of counts.entries()) {
    if (count > config.deck.maxCopiesPerCard) {
      throw new DeckValidationError(`Card ${cardId} count ${count} exceeds maxCopiesPerCard=${config.deck.maxCopiesPerCard}`);
    }
  }
}

