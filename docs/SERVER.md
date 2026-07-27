# PokeWorld Server — Hướng dẫn cài đặt

Máy chủ online cho PokeWorld: tài khoản, đồng bộ save, bảng xếp hạng, bạn bè, kết hôn, chat, PvP realtime và trang quản trị.

## 1. Chạy thử trên máy

```bash
cd server
npm install
cp .env.example .env      # sửa JWT_SECRET, ADMIN_USER, ADMIN_PASS
npm start
```

- Máy chủ: `http://localhost:8790`
- Trang quản trị: `http://localhost:8790/admin`
- Kiểm tra hoạt động: `curl http://localhost:8790/health`
- Chạy bộ test: `npm test` (phải in `=== SERVER SMOKE OK ===`)

## 2. Chạy trên VPS bằng Docker (khuyên dùng)

```bash
git clone https://github.com/thanhtinz/Pokeworld.git
cd Pokeworld/server

nano docker-compose.yml     # BẮT BUỘC đổi JWT_SECRET, ADMIN_USER, ADMIN_PASS
docker compose up -d --build

docker compose logs -f      # xem log
```

Máy chủ chạy ở cổng `8790`. Dữ liệu lưu trong volume `pokeworld-data` nên nâng cấp/khởi động lại không mất.

**Cập nhật phiên bản mới:**
```bash
git pull && docker compose up -d --build
```

**Sao lưu dữ liệu:**
```bash
docker run --rm -v pokeworld-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/pokeworld-backup-$(date +%F).tar.gz /data
```

## 3. Chạy không dùng Docker

```bash
cd server && npm install --omit=dev
sudo npm install -g pm2
PORT=8790 JWT_SECRET=... ADMIN_PASS=... pm2 start src/index.js --name pokeworld
pm2 save && pm2 startup      # tự chạy lại khi VPS reboot
```

## 4. Tên miền + HTTPS (nginx)

Trình duyệt chặn trang HTTPS gọi sang máy chủ HTTP, nên nếu client chạy trên GitHub Pages thì **máy chủ bắt buộc phải có HTTPS**.

```nginx
server {
    server_name api.tenmien.com;

    location / {
        proxy_pass http://127.0.0.1:8790;
        proxy_http_version 1.1;
        # 3 dòng dưới bắt buộc để WebSocket (chat, PvP) hoạt động
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Cấp chứng chỉ miễn phí:
```bash
sudo certbot --nginx -d api.tenmien.com
```

Mở tường lửa nếu dùng cổng trực tiếp: `sudo ufw allow 8790`

## 5. Nối game vào máy chủ

Trong game, mở **Menu → Máy chủ**, dán địa chỉ (ví dụ `https://api.tenmien.com`) rồi đăng ký tài khoản online.

Hoặc đặt sẵn trong `js/net/config.js`:
```js
const DEFAULT_SERVER = 'https://api.tenmien.com';
```
Sau đó push lên `main` — mọi người vào web là tự kết nối máy chủ.

## 6. Trang quản trị `/admin`

Đăng nhập bằng `ADMIN_USER` / `ADMIN_PASS` trong `.env`:

| Mục | Chức năng |
|---|---|
| Tổng quan | Số tài khoản, đang online, đăng ký mới, trận PvP, cặp đôi; gửi thông báo toàn server |
| Người chơi | Tìm kiếm, xem tiền/dex/huy hiệu, tặng tiền & vật phẩm, **trao thời trang (nút 🏷)**, đặt lại mật khẩu, khóa/mở khóa, xóa tài khoản |
| Thời trang | Thêm danh hiệu / khung avatar / khung chat / skin, **tải ảnh riêng cho từng món**, đặt điều kiện nhận |
| Cấu hình | Đổi tên máy chủ, thông báo chào, bật sự kiện x2 EXP / x2 tiền / tăng tỉ lệ shiny — **áp dụng ngay, không cần khởi động lại** |
| Lịch sử PvP | 100 trận gần nhất, đánh dấu trận có kết quả lệch (nghi gian lận) |
| Nhật ký | Toàn bộ thao tác của admin |

Tài khoản bị khóa sẽ bị ngắt kết nối ngay lập tức và không đăng nhập lại được.

### Thời trang: ảnh tải lên và danh hiệu trao tay

- Mỗi món có một **điều kiện nhận**: có sẵn từ đầu, bắt đủ N sinh vật, thắng N trận,
  đủ N huy hiệu, đủ cấp huấn luyện viên — hoặc **“Admin trao tay”** cho món không
  có điều kiện nào tự đạt được (danh hiệu sự kiện, danh hiệu tặng riêng...).
- Món trao tay chỉ mở khi admin sang tab **Người chơi** bấm 🏷 rồi bấm **Trao**.
  Người chơi đang online mở khoá ngay lập tức, không cần đăng nhập lại.
- Ảnh tải lên (PNG/JPG/GIF/WEBP, tối đa 2MB) lưu ở `DATA_DIR/uploads/cosmetics/`
  và phục vụ tại `/uploads/cosmetics/...`. Món có ảnh thì trong game hiện đúng ảnh
  đó (danh hiệu trên đầu nhân vật, khung avatar, khung chat); món không có ảnh vẫn
  vẽ bằng CSS như bộ mặc định. **Nhớ backup thư mục `data/` cùng với `db.json`.**
- Xóa một món sẽ xóa luôn tệp ảnh và gỡ món khỏi những người đã được trao.

## 7. Bảo mật

- Mật khẩu băm bằng bcrypt, phiên đăng nhập dùng JWT hạn 7 ngày
- Save gửi lên đều bị kiểm tra: tiền vượt trần, cấp trên 100, IV/EV sai, vật phẩm lạ → **tự kẹp về mức hợp lệ** và ghi cảnh báo cho admin xem (không xóa tiến trình người chơi)
- Kết quả PvP chỉ ghi nhận khi **cả hai máy báo giống nhau**; lệch nhau bị đánh dấu `disputed`
- **Bắt buộc đổi `JWT_SECRET` và `ADMIN_PASS`** trước khi mở cho người ngoài chơi

## 8. Yêu cầu máy

RAM 512MB là đủ cho vài trăm người chơi (Node.js + dữ liệu JSON trong bộ nhớ, tự ghi đĩa mỗi 5 giây). Khi vượt vài nghìn tài khoản nên đổi sang PostgreSQL — chỉ cần thay phần thân của `server/src/db.js`, các phần khác giữ nguyên.

## 9. Danh sách API

| Nhóm | Đường dẫn |
|---|---|
| Tài khoản | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/me` |
| Save | `PUT /api/save` |
| Xếp hạng | `GET /api/leaderboard?metric=money\|dex\|badges\|level\|pvp` |
| Hồ sơ | `GET /api/player/:username`, `GET /api/config` |
| Thời trang | `GET /api/cosmetics` (kho + ảnh), món được trao nằm trong `GET /api/me` |
| Bạn bè | `GET /api/friends`, `POST /api/friends/request`, `POST /api/friends/respond`, `DELETE /api/friends/:username` |
| Kết hôn | `GET /api/marriage`, `POST /api/marriage/propose`, `POST /api/marriage/respond`, `DELETE /api/marriage` |
| Realtime | Socket.IO: `chat:send`, `pvp:challenge`, `pvp:accept`, `pvp:action`, `pvp:result` |
| Quản trị | `/api/admin/*` (cần quyền admin) |
