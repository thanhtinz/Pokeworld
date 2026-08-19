# Tuxemon Battle Card Game (Unity Client - skeleton)

Repo này chỉ cung cấp **khung code C#** để bạn:
1. Thêm vào Unity project (Android/iOS).
2. Kết nối tới server REST API.
3. Gửi battle actions (SUMMON / PLAY_SPELL / ATTACK / END_TURN / SURRENDER).
4. Nhận `BattleState` mới từ server và render theo UI.

> Lưu ý: Battle rules (damage/rng/reward) được server quyết định (anti-cheat).

## Import vào Unity
- Copy folder `Assets/` trong `client-unity/` vào project Unity.
- Build target: Android + iOS (Set up Unity normally).

## Endpoint server (MVP)
- `POST /api/v1/battle/practice/start`
- `POST /api/v1/battle/{matchId}/action`
- `GET  /api/v1/battle/{matchId}/state`
- `GET  /api/v1/cards`

