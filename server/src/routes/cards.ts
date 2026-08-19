import { Router } from "express";
import { CardsRepository } from "../cards/cardsRepository";

export function cardsRouter(cardsRepo: CardsRepository) {
  const router = Router();

  router.get("/cards", (_req, res) => {
    res.json({ cards: cardsRepo.getAllCards() });
  });

  router.get("/cards/:cardId", (req, res) => {
    const card = cardsRepo.getCardById(req.params.cardId);
    if (!card) return res.status(404).json({ error: "card_not_found" });
    res.json({ card });
  });

  return router;
}

