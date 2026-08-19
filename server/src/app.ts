import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health";
import { cardsRouter } from "./routes/cards";
import { battleRouter } from "./routes/battle";
import { CardsRepository } from "./cards/cardsRepository";
import { MatchStore } from "./store/matchStore";

export function createApp(args: { cardsRepo: CardsRepository; matchStore: MatchStore }) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/v1", healthRouter());
  app.use("/api/v1", cardsRouter(args.cardsRepo));
  app.use("/api/v1", battleRouter({ matchStore: args.matchStore, cardsRepo: args.cardsRepo }));

  // Generic 404
  app.use((_req, res) => {
    res.status(404).json({ error: "not_found" });
  });

  return app;
}

