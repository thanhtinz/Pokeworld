# Tuxemon Battle Card Game (Unity + Server scaffold)

Repo này được dựng lại theo yêu cầu:
- **Client (Unity)**: chạy Android/iOS, gửi battle actions tới server.
- **Server**: Node.js/TypeScript, **authoritative** cho toàn bộ combat (SUMMON / PLAY_SPELL / ATTACK / END_TURN / SURRENDER).

Trạng thái trận đấu (`BattleState`) được server trả về cho client để UI render.

## Run server (MVP)
```bash
cd server
npm i
npm run dev
```

## Smoke test server logic
```bash
cd server
npm test
```

## Unity client
Xem `client-unity/README.md`.

