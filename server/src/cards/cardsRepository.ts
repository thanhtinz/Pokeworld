import fs from "node:fs";
import path from "node:path";
import { CardDefinition } from "../protocol";

export type CardsRepository = {
  getCardById: (id: string) => CardDefinition | undefined;
  getAllCards: () => CardDefinition[];
};

export function createCardsRepositoryFromDisk(): CardsRepository {
  const cardsPath = path.join(process.cwd(), "data", "cards", "cards.json");
  const raw = fs.readFileSync(cardsPath, "utf-8");
  const parsed = JSON.parse(raw) as { cards: CardDefinition[] };

  const map = new Map<string, CardDefinition>();
  for (const card of parsed.cards) {
    map.set(card.id, card);
  }

  return {
    getCardById: (id) => map.get(id),
    getAllCards: () => Array.from(map.values())
  };
}

