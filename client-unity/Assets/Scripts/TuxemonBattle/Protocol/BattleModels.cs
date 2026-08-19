using System;
using System.Collections.Generic;

[Serializable]
public enum PlayerSide { A, B }

[Serializable]
public enum BattlePhase { MAIN, BATTLE }

[Serializable]
public enum CardType { creature, spell, trap, field, equipment }

[Serializable]
public enum EffectType { damage, heal, draw }

[Serializable]
public enum BattleResultType { victory, defeat, draw, surrender }

[Serializable]
public class EffectDescriptor
{
    public EffectType effectType;
    public string target; // "enemy_creature" | "enemy_life" | "friendly_creature" | "friendly_life"
    public int amount;
    public int drawCount;
}

[Serializable]
public class CardDefinition
{
    public string id;
    public string name;
    public CardType type;
    public string rarity;
    public string element;
    public string archetype;
    public int cost;

    public int atk;
    public int def;
    public int hp;

    public List<EffectDescriptor> effects;
}

[Serializable]
public class CardInBattle
{
    public string instanceId;
    public string cardId;

    public int hp;
    public int atk;
    public int def;

    public bool attackedThisTurn;
    public bool summonedThisTurn;
}

[Serializable]
public class BattlefieldState
{
    public List<CardInBattle> creatureZone;
    public List<CardInBattle> spellTrapZone;
    public CardInBattle fieldZone;
}

[Serializable]
public class PlayerRuntimeState
{
    public string userId;
    public PlayerSide side;

    public List<string> deckCardIds;
    public List<CardInBattle> hand;

    public BattlefieldState battlefield;
    public List<CardInBattle> graveyard;

    public int lp;
    public int energy;
}

[Serializable]
public class BattleActionLog
{
    public long atMs;
    public int turnNumber;
    public PlayerSide actorSide;
    public string actionType;
    public Dictionary<string, string> actionPayload;
}

[Serializable]
public class ChainEventLog
{
    public string jobId;
    public EffectType effectType;
    public bool resolved;
}

[Serializable]
public class BattleOutcome
{
    public BattleResultType result;
    public PlayerSide? winnerSide;
}

[Serializable]
public class BattleState
{
    public string matchId;
    public int turnNumber;
    public PlayerSide activeSide;
    public BattlePhase phase;

    public PlayerRuntimeState A;
    public PlayerRuntimeState B;

    public BattleActionLog lastAction;
    public List<ChainEventLog> chainLog;
    public List<BattleActionLog> replay;
    public BattleOutcome outcome;
    public long createdAtMs;
}

// ===== Requests / Responses =====

[Serializable]
public class StartPracticeRequest
{
    public string matchType; // "pvp_normal_practice"
    public PlayerDeck playerA;
    public PlayerDeck playerB;
}

[Serializable]
public class PlayerDeck
{
    public string userId;
    public List<string> deckCardIds;
}

[Serializable]
public class StartPracticeResponse
{
    public string matchId;
    public BattleState state;
}

[Serializable]
public class CardsResponse
{
    public List<CardDefinition> cards;
}

[Serializable]
public class SubmitBattleActionRequest
{
    public string matchId;
    public BattleActionUnion action;
}

[Serializable]
public class SubmitBattleActionResponse
{
    public BattleState state;
}

// Unity-friendly action base:
[Serializable]
public abstract class BattleActionUnion
{
    public string type;
    public PlayerSide actorSide;
}

[Serializable]
public class SummonAction : BattleActionUnion
{
    public string handInstanceId;
    public int creatureSlotIndex;
}

[Serializable]
public class PlaySpellAction : BattleActionUnion
{
    public string handInstanceId;
    public int targetCreatureSlotIndex; // optional on server; may be omitted by client if set to -1
    public string target; // enum-like
}

[Serializable]
public class AttackAction : BattleActionUnion
{
    public int attackerCreatureSlotIndex;
    public AttackTarget target;
}

[Serializable]
public class AttackTarget
{
    public string kind; // "enemy_creature" | "enemy_life"
    public int enemyCreatureSlotIndex; // only for enemy_creature
}

[Serializable]
public class EndTurnAction : BattleActionUnion
{
}

[Serializable]
public class SurrenderAction : BattleActionUnion
{
}

