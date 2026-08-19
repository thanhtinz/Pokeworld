export const config = {
  port: Number(process.env.PORT ?? 3001),

  // Battlefield sizes
  creatureZoneSize: Number(process.env.CREATURE_ZONE_SIZE ?? 5),
  spellZoneSize: Number(process.env.SPELL_ZONE_SIZE ?? 5),

  // Starting hand / draw
  startingHandSize: Number(process.env.STARTING_HAND_SIZE ?? 5),
  drawPerTurn: Number(process.env.DRAW_PER_TURN ?? 1),

  // Energy system (Energy >= card cost)
  // MVP rule: energy = turnNumber (starting from 1 for each player's first turn)
  maxTurn: Number(process.env.MAX_TURN ?? 60),

  startingLp: Number(process.env.STARTING_LP ?? 8000),
  energyPerTurnBase: Number(process.env.ENERGY_PER_TURN_BASE ?? 1),

  // Deck rules (server authoritative; client must not hard-code)
  deck: {
    minCards: Number(process.env.DECK_MIN_CARDS ?? 40),
    maxCards: Number(process.env.DECK_MAX_CARDS ?? 60),
    maxCopiesPerCard: Number(process.env.DECK_MAX_COPIES_PER_CARD ?? 3)
  },

  // Card resolution tuning (MVP)
  damage: {
    creatureVsCreature: {
      // attacker.atk - defender.def, floor at 0
      minDamage: 0
    }
  }
};

