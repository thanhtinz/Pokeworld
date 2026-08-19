using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UnityEngine;

public class BattleDebugHarness : MonoBehaviour
{
    [Header("Server")]
    [SerializeField] private string serverBaseUrl = "http://localhost:3001";

    [Header("User IDs (MVP)")]
    [SerializeField] private string userIdA = "uA";
    [SerializeField] private string userIdB = "uB";

    private ApiClient api;
    private BattleState state;

    private void Awake()
    {
        api = new ApiClient(serverBaseUrl);
    }

    private async void Start()
    {
        try
        {
            await RunSmokeBattleAsync();
        }
        catch (Exception e)
        {
            Debug.LogError($"BattleDebugHarness error: {e}");
        }
    }

    private async Task RunSmokeBattleAsync()
    {
        Debug.Log("BattleDebugHarness: fetching card definitions...");
        var cardsRes = await api.GetCardsAsync();
        var defsById = cardsRes.cards.ToDictionary(c => c.id, c => c);

        // Build a valid 40-card deck:
        // - server: deck.minCards=40, deck.maxCards=60, deck.maxCopiesPerCard=3
        var allIds = defsById.Keys.ToList();
        var deck = new List<string>(40);
        var counts = new Dictionary<string, int>();
        foreach (var id in allIds)
        {
            if (deck.Count >= 40) break;
            var cnt = counts.TryGetValue(id, out var v) ? v : 0;
            if (cnt < 3)
            {
                deck.Add(id);
                counts[id] = cnt + 1;
            }
        }

        // If not enough due to small set, just repeat through again.
        var i = 0;
        while (deck.Count < 40)
        {
            var id = allIds[i % allIds.Count];
            counts.TryGetValue(id, out var cnt);
            if (cnt < 3)
            {
                deck.Add(id);
                counts[id] = cnt + 1;
            }
            i++;
        }

        var startReq = new StartPracticeRequest
        {
            matchType = "pvp_normal_practice",
            playerA = new PlayerDeck { userId = userIdA, deckCardIds = deck },
            playerB = new PlayerDeck { userId = userIdB, deckCardIds = deck }
        };

        Debug.Log("BattleDebugHarness: starting practice match...");
        var startRes = await api.StartPracticeAsync(startReq);
        state = startRes.state;
        Debug.Log($"Started matchId={state.matchId}, active={state.activeSide}, phase={state.phase}, turn={state.turnNumber}");

        // Perform a few turns (MVP)
        for (var step = 0; step < 6; step++)
        {
            if (state.outcome != null)
            {
                Debug.Log($"Outcome: {state.outcome.result}");
                break;
            }

            var activeSide = state.activeSide;
            var activePlayer = GetPlayer(state, activeSide);
            var enemyPlayer = GetPlayer(state, activeSide == PlayerSide.A ? PlayerSide.B : PlayerSide.A);

            // 1) SUMMON first creature that we can afford
            var summonDef = activePlayer.hand.FirstOrDefault(ci =>
            {
                if (ci == null) return false;
                return defsById.TryGetValue(ci.cardId, out var def) && def.type == CardType.creature && def.cost <= activePlayer.energy;
            });

            if (summonDef != null)
            {
                var emptySlot = activePlayer.battlefield.creatureZone.FindIndex(c => c == null);
                if (emptySlot >= 0)
                {
                    Debug.Log($"SUMMON {summonDef.cardId} into slot {emptySlot}");
                    var summonAction = new SummonAction
                    {
                        type = "SUMMON",
                        actorSide = activeSide,
                        handInstanceId = summonDef.instanceId,
                        creatureSlotIndex = emptySlot
                    };
                    state = (await api.SubmitActionAsync(new SubmitBattleActionRequest { matchId = state.matchId, action = summonAction })).state;
                }
            }

            // 2) ATTACK enemy life with slot 0 (if there is a creature)
            var attacker = activePlayer.battlefield.creatureZone[0];
            if (attacker != null && attacker.hp > 0)
            {
                Debug.Log($"ATTACK enemy life with slot 0");
                var attackAction = new AttackAction
                {
                    type = "ATTACK",
                    actorSide = activeSide,
                    attackerCreatureSlotIndex = 0,
                    target = new AttackTarget { kind = "enemy_life" }
                };
                state = (await api.SubmitActionAsync(new SubmitBattleActionRequest { matchId = state.matchId, action = attackAction })).state;
            }

            // 3) END_TURN
            Debug.Log($"END_TURN (actorSide={activeSide})");
            var endReq = new SubmitBattleActionRequest
            {
                matchId = state.matchId,
                action = new EndTurnAction { type = "END_TURN", actorSide = activeSide }
            };
            state = (await api.SubmitActionAsync(endReq)).state;
            Debug.Log($"Turn={state.turnNumber}, active={state.activeSide}, lpA={state.A.lp}, lpB={state.B.lp}");
        }
    }

    private PlayerRuntimeState GetPlayer(BattleState st, PlayerSide side)
    {
        return side == PlayerSide.A ? st.A : st.B;
    }
}

