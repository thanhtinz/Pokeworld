import { createCardsRepositoryFromDisk } from "./cards/cardsRepository";
import { MatchStore } from "./store/matchStore";
import { createApp } from "./app";
import { config } from "./config";

async function main() {
  const cardsRepo = createCardsRepositoryFromDisk();
  const matchStore = new MatchStore(cardsRepo);

  const app = createApp({ cardsRepo, matchStore });
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[tuxemon-battle] listening on :${config.port}`);
  });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

