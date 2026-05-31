# Lịch Sử Trò Chuyện & Tiến Trình Phát Triển Angel Arena PVE Roguelike

Thư mục này chứa file lịch sử cuộc trò chuyện đầy đủ (`transcript.jsonl`) giữa bạn và Antigravity trong việc phát triển, tối ưu hóa và sửa lỗi phiên bản **Angel Arena PVE - Roguelike Mode**.

## 🚀 Tóm Tắt Các Cải Tiến Đã Thực Hiện

### 1. Hệ Thống Thần Thú Đồng Hành (Companion/Pet System) [NEW]
* **Ba thần thú đồng hành cực hot**:
  * 🐶 **Corgi**: Tăng vĩnh viễn **+15% Vàng** nhận được.
  * 🦉 **Owl (Cú Ma Thuật)**: Tăng vĩnh viễn **+15% Kinh nghiệm (XP)** nhận được.
  * 🐱 **Kitty**: Tăng vĩnh viễn **+15 HP hồi phục mỗi giây** trong suốt trận đấu.
* **Giao diện Lobby lộng lẫy**: Kích hoạt và nâng cấp vĩnh viễn các Thần thú đồng hành bằng 🪙 Vàng trực tiếp tại sảnh chờ.
* **Hoạt ảnh đồng hành sống động**: Thần thú sẽ bay lơ lửng, nhấp nhô tuyệt đẹp theo cơ chế lò xo mềm mại ngay sau lưng nhân vật của bạn trong màn chơi!

### 2. Hệ Thống Khám Phá Boss (Boss Gallery & Lore) [NEW]
* **Giao diện First Encounter hoành tráng**: Khi phát hiện và đối đầu với bất kỳ Boss khủng nào lần đầu tiên trong sự nghiệp chơi game, trò chơi sẽ tạm dừng và hiện thông báo Neon ma mị, giới thiệu hình ảnh, thuộc tính nguy hiểm và cốt truyện truyền cảm hứng của Boss.
* **Cơ sở dữ liệu Codex**: Tích hợp danh sách Boss đã đụng độ vào tab **Codex 👹 Bosses** của Lobby giúp lưu trữ và theo dõi các cột mốc đã vượt qua.

### 3. Sửa Hàng Loạt Lỗi Nghiêm Trọng & Tối Ưu Hóa Trực Quan
* **Giới hạn AoE các Siêu Kỹ Năng lv.8 (Legendary Skills)**: Giới hạn bán kính nổ diện rộng cực hạn để tránh tình trạng AoE phủ kín toàn bộ bản đồ gây mất tính thử thách và lỗi FPS.
* **Tối ưu hóa AoE của Sát Thủ**: Cân bằng các hiệu ứng hạt bóng tối, đảm bảo bản đồ nhỏ (Mini-map) hiển thị trực quan không bị che phủ.
* **Thiết lập lại Thần Rừng Druid**:
  * Giảm mật độ gai sinh ra gây tụt FPS.
  * Giới hạn thời gian tồn tại và thu hẹp bán kính của thảm gai, giúp giao diện màn hình gọn gàng hơn, không che khuất Exp hay Vàng rớt.
* **Thời tiết hoành tráng**: Cải tiến hoạt ảnh **Bão Sét (Thunderstorm)** có hiệu ứng chớp tắt và tia sét giật sống động, **Bão Tuyết (Blizzard)** tuyết phủ mờ ảo bay theo chiều gió và tuyết đọng lung linh ở đáy màn hình.
* **Hoạt ảnh và Trí tuệ nhân tạo (AI)**: Khắc phục triệt để lỗi bot/boss đánh hụt hoặc đứng im, sửa lại hoạt ảnh tấn công khớp với sát thương thực tế.
* **Chức năng Đầu Hàng / Tự Sát (Suicide Button)**: Bổ sung nút ☠ Đầu Hàng giúp người chơi chủ động thoát trận và lưu toàn bộ Vàng/XP đã tích lũy thay vì chết đột ngột.
* **Sửa lỗi Codex**: Cải tiến logic phát hiện Codex, hiển thị thông tin phát hiện chuẩn xác ngay cả với các dữ liệu cũ hoặc hỏng.
