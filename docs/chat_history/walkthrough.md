# Nhật ký Thay đổi & Kết quả Nâng Cấp Chế Độ PVE Roguelike (Vampire Survivors Style)

Tài liệu này ghi nhận toàn bộ quá trình nâng cấp hệ thống tiến trình PVE, giao diện Lobby, cơ chế XP Gem nâng cao, tích hợp vật phẩm Vương Miện (Crown), nâng cấp vĩnh viễn trực tiếp trong trận đấu qua phím tắt `P`, công thức tính XP nâng cấp tịnh tiến mới, và các thao tác triển khai lên máy chủ cùng repository GitHub thành công tốt đẹp.

---

## 1. Các thay đổi và tính năng mới đã thực hiện

### 1.1 Hệ Thống XP Gem Đa Sắc & Đồ Họa Hạt Sáng Kim Cương
Thay thế hoàn toàn hệ thống ngọc tròn XP cũ bằng các hạt ngọc kim cương lấp lánh cao cấp:
- **Diamond Geometry**: Ngọc XP rơi ra từ quái vật có hình dạng kim cương lập thể 2.5D vẽ bằng canvas path (4 đỉnh sắc nét) với bóng đổ neon.
- **Multi-Tier Color Gems**: Ngọc tự động phân chia theo mức kinh nghiệm rớt ra từ quái:
  - **Tier 1 (Xanh lá - Small)**: XP $\le 5$ (Bán kính 4px).
  - **Tier 2 (Xanh dương - Medium)**: XP từ $6 \rightarrow 15$ (Bán kính 6px).
  - **Tier 3 (Tím - Large)**: XP từ $16 \rightarrow 50$ (Bán kính 8px).
  - **Tier 4 (Vàng Gold - Boss)**: Ngọc siêu cấp rớt ra khi diệt Boss (Bán kính lớn hơn kèm hiệu ứng tỏa sáng rực rỡ).
- **Pulsing Animation & Glowing Aura**: Tích hợp chu kỳ sóng sin vào bán kính hạt (`1 + 0.18 * Math.sin(phase)`) tạo nhịp thở đập pulsing liên tục. Vòng hào quang phát sáng xung quanh được vẽ bằng Radial Gradient mịn màng chuyển dần ra suốt, tạo hiệu ứng phát quang lấp lánh đỉnh cao.
- **Top Facet Highlight**: Có vệt sáng elip phản chiếu ánh sáng nghiêng màu trắng trong suốt ở đỉnh trên của hạt, tạo độ khối như ngọc thật.

### 1.2 Công Thức XP Tịnh Tiến & Các Cột Mốc Milestone
Thiết lập đường cong tiến trình (progression curve) hoàn hảo như Vampire Survivors:
- **Công thức tính XP yêu cầu lên cấp tiếp theo**:
  - **Cấp 1 - 20**: Tăng thêm `10` XP yêu cầu mỗi cấp (Ví dụ: Cấp 2 lên 3 cần 15 XP, cấp 3 lên 4 cần 25 XP...).
  - **Cấp 21 - 40**: Tăng thêm `13` XP yêu cầu mỗi cấp.
  - **Cấp 41 trở lên**: Tăng thêm `16` XP yêu cầu mỗi cấp.
- **Milestone Level 20 & 40 (Đột phá sức mạnh)**: Khi đạt mốc level 20 và 40, nhân vật đột phá cảnh giới:
  - Tự động nhân đôi chỉ số nhân lượng XP nhận được vĩnh viễn (`xpGainMult *= 2`).
  - Gây hiệu ứng rung màn hình mạnh mẽ (`screenShake`), thả các hạt ánh sáng văng tung tóe và hiển thị chữ nổi màu vàng kim rực rỡ báo hiệu đột phá sức mạnh `⚡ ĐỘT PHÁ SỨC MẠNH: +100% GROWTH!`.

### 1.3 Vương Miện Passive Item (Crown) & Nâng Cấp Vĩnh Viễn Mới
Bổ sung thêm 1 vật phẩm hỗ trợ và 2 thuộc tính nâng cấp vĩnh viễn trong hệ thống:
- **Vật phẩm Passive - Vương Miện (Crown) 👑**: Được định nghĩa đầy đủ trong `PASSIVE_ITEMS_DEFS`. Tăng `20%` lượng XP nhận được mỗi cấp (tối đa cấp 5, tương đương cộng thêm `100%` XP nhận được).
- **Powerup - Growth (Tăng Trưởng) 🌱**: Nâng cấp vĩnh viễn bằng vàng, tăng `10%` lượng XP nhận được mỗi cấp (tối đa 10 cấp).
- **Powerup - Magnet (Nam Châm) 🧲**: Nâng cấp vĩnh viễn bằng vàng, tăng thêm `80px` bán kính hút ngọc mỗi cấp (tối đa 8 cấp). Bán kính hút thực tế được tính toán động dựa trên chỉ số cơ bản + nâng cấp passive Attractorb + chỉ số Magnet từ Powerup này.

### 1.4 Bảng Nâng Cấp Vĩnh Viễn Trong Trận Đấu qua Phím [P]
Cho phép người chơi tiêu thụ lượng vàng tích lũy được để gia tăng chỉ số vĩnh viễn ngay khi đang chiến đấu:
- **Keyboard Shortcut KeyP**: Bấm phím `P` trên bàn phím để đóng/mở nhanh bảng Nâng Cấp Vĩnh Viễn in-game. Bảng này sẽ tự động dừng (pause) trận đấu để đảm bảo an toàn cho người chơi.
- **HUD Button [⚡ Nâng Cấp P]**: Chèn nút bấm tương tác ngay trên thanh HUD của trận đấu (nằm giữa nút Codex và nút Tạm dừng) giúp người chơi có thể click chuột trực tiếp để mở bảng nâng cấp.
- **In-game Powerup Interface**: Hiển thị danh sách đầy đủ các thuộc tính nâng cấp vĩnh viễn (Growth, Magnet, ATK, Max HP, Speed, v.v.), cho phép nhấn Buy để trừ vàng tích lũy của tài khoản và tăng cấp chỉ số ngay lập tức. Sau khi đóng bảng nâng cấp, trận đấu tự động tiếp tục và các chỉ số mới lập tức được áp dụng lên nhân vật.

---

## 2. Nhật ký Triển khai & Đồng bộ (Production & GitHub)

### 2.1 Cập nhật Lobby PVE 30 Phút
Giao diện sảnh chờ (Lobby PVE) đã được cập nhật nội dung tương thích với lối chơi sinh tồn 30 phút:
- Tiêu đề header mô tả: `Vampire Survivors Style · 30 Phút/Màn · Tử Thần xuất hiện phút 30 · Boss mỗi 5 phút`.
- Stage 1 mô tả: `Rất Khó · 30 Phút · Boss Cuối: Tử Thần (phút 30)`.
- Thêm các dòng nhắc nhở về phím tắt mở bảng Nâng Cấp Vĩnh Viễn `P` dưới nút Bắt đầu.

### 2.2 Khởi chạy Server Local
- Trình thông dịch Node.exe khởi chạy thành công máy chủ game Angel Arena tại đường dẫn local: `node server.js`
- Máy chủ hiện đang hoạt động ổn định trên cổng `3000`.

### 2.3 Đồng bộ hóa Lịch sử Chat & Mã nguồn lên GitHub
Thực hiện sao lưu toàn bộ nhật ký phiên làm việc và mã nguồn:
1. Copy tệp nhật ký `transcript.jsonl` (dung lượng 13MB) cùng các file kế hoạch/walkthrough markdown từ bộ nhớ đệm `AppData` vào thư mục `docs/chat_history/` của dự án.
2. Thực hiện commit các thay đổi và push lên kho lưu trữ GitHub tại:
   `https://github.com/meslipking/angel-arena.git`
3. Nhánh push: `main` (commit SHA hiện tại: `77fd8af`).

Phiên bản game hiện đã sẵn sàng và được cập nhật đầy đủ các tính năng Roguelike thời thượng nhất!
