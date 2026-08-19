using System;
using System.Threading.Tasks;
using UnityEngine;

public class BattleClientController : MonoBehaviour
{
    [SerializeField] private string serverBaseUrl = "http://localhost:3001";

    private ApiClient api;
    private string matchId;
    public BattleState CurrentState { get; private set; }

    private void Awake()
    {
        api = new ApiClient(serverBaseUrl);
    }

    public async Task StartPracticeAsync(StartPracticeRequest req)
    {
        var res = await api.StartPracticeAsync(req);
        matchId = res.matchId;
        CurrentState = res.state;
    }

    public async Task SubmitAsync(BattleActionUnion action)
    {
        if (string.IsNullOrEmpty(matchId))
            throw new Exception("matchId is null. Call StartPracticeAsync first.");

        var submitReq = new SubmitBattleActionRequest
        {
            matchId = matchId,
            action = action
        };

        var res = await api.SubmitActionAsync(submitReq);
        CurrentState = res.state;
    }

    public Task SummonAsync(PlayerSide actorSide, string handInstanceId, int slotIndex)
    {
        var action = new SummonAction
        {
            type = "SUMMON",
            actorSide = actorSide,
            handInstanceId = handInstanceId,
            creatureSlotIndex = slotIndex
        };
        return SubmitAsync(action);
    }

    public Task AttackEnemyLifeAsync(PlayerSide actorSide, int attackerSlotIndex)
    {
        var action = new AttackAction
        {
            type = "ATTACK",
            actorSide = actorSide,
            attackerCreatureSlotIndex = attackerSlotIndex,
            target = new AttackTarget { kind = "enemy_life" }
        };
        return SubmitAsync(action);
    }

    public Task EndTurnAsync(PlayerSide actorSide)
    {
        var action = new EndTurnAction
        {
            type = "END_TURN",
            actorSide = actorSide
        };
        return SubmitAsync(action);
    }
}

