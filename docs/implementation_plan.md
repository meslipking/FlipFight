# Kế Hoạch Tổng Thể — Angel Arena PVE v3.0

## NHÓM A — Bug Fixes (Ưu tiên 1, sửa ngay)

### A1. Skeleton Necro chỉ xoay không tấn công
- **Bug:** Skeleton spawn ở vị trí gần player, nhưng `target` tìm theo `enemies` array — nếu enemies empty hoặc logic AI bị lỗi, skeleton đứng im
- **Fix:** Cải thiện AI skeleton: chase target rõ ràng, thêm fallback behavior khi không có enemy (orbit player)

### A2. Player chết không lý do
- **Bug:** `p.invuln` check không đúng. Damage từ hazard (briar_patch) áp dụng lên player. `masochist` demonic deal mất 5HP/frame thay vì per hit.
- **Fix:** Kiểm tra và sửa tất cả chỗ damage player: hazard, projectile, briar, masochist

### A3. Merchant items không dùng được
- **Bug:** `buyMerchantItem` có `this.openMerchantShop()` ở cuối tạo loop refresh. `invuln_potion` và `super_vacuum` gọi `closeMerchantShop()` trước return nhưng gold đã trừ.
- **Fix:** Loại bỏ auto-refresh, sửa gold check, thêm toast xác nhận

### A4. Skill level 8 bug
- **Bug:** Skills max lv=8 nhưng damage formula chỉ được test đến lv=1. AoE radius ở lv8 = r*(8*30) = quá lớn.
- **Fix:** Cap AoE radius, cap lifesteal, cap damage scaling theo lv

### A5. Druid briar_patch che XP/gold, FPS giảm, tồn tại lâu
- **Bug:** `thorny_spike` particles số lượng 16, tồn tại `6+lv` giây = max 14s. AoE too large.
- **Fix:** Giảm particles xuống 8, giảm thời gian còn 3+lv giây (max 11→6s), giảm AoE radius

### A6. Assassin skill phủ minimap
- **Bug:** `shadow_blades`, `void_reaver`, `specter_storm` spawns particles khắp map
- **Fix:** Giới hạn particles trong viewport, cap số lượng clone tối đa

### A7. Skills AoE cả map
- **Bug:** `specter_storm`, `grave_wrath`, `lich_army`, `hurricane_barrage` có radius = toàn map
- **Fix:** Cap radius tối đa 800px, giảm duration legendary skills

### A8. Nút thoát/tự sát
- **Fix:** Thêm nút "💀 Đầu Hàng" trong pause overlay, confirm dialog trước khi thoát

### A9. Codex không hiện thông tin
- **Bug:** `savedData.discovered` có thể null/undefined nếu save cũ không có field này
- **Fix:** Thêm defensive init cho discovered object, hiển thị all skills nếu discovered undefined

### A10. Environment lightning effect (thunderstorm) không xuất hiện
- **Bug:** `drawThunderstorm()` hoặc weather effect check sai
- **Fix:** Kiểm tra drawWeather, thêm lightning bolt particles đúng cách

### A11. Snow effect
- **Fix:** Redesign snow particles: snowflakes thật, drift theo gió, accumulate ở ground

### A12. Boss/Bot animation và collision
- **Bug:** Boss attack hitbox không khớp animation. Bot không attack đúng timing.
- **Fix:** Sync attack hitbox với animation frame, fix timing của dealDamage trong boss update

---

## NHÓM B — Xóa Tính Năng

### B1. Xóa Chest System
- Xóa UI rương đồng/bạc/vàng khỏi lobby
- Xóa `openChest()`, `closeChestModal()` functions
- Xóa `chestOpenModal`, `chestParticles` HTML
- Xóa `EQUIPMENT_POOL` constant

### B2. Xóa Equipment/Inventory
- Xóa `equipPanel` HTML block
- Xóa `shopPanel` HTML block (cửa hàng rương)
- Xóa equipment slots, inventory grid, equip bonuses
- Xóa `equipped`, `inventory` from save data
- Xóa `equipItem()`, `unequipItem()`, `applyEquipBonus()` functions
- Xóa equipment drawing từ `drawCharacter()`
- Giữ lại Merchant Shop (mua items bằng vàng trong trận)

---

## NHÓM C — Wave Scaling System (Vampire Survivors Style)

### C1. Difficulty Scaling theo thời gian
```
Mỗi phút: 
- Spawn rate tăng 8%
- Enemy HP tăng 12%
- Enemy speed tăng 4%
- Enemy damage tăng 6%
```

### C2. Enemy Wave Phases
- Phút 0-5: Cơ bản, spawn chậm
- Phút 5-10: Tăng dần, mix Elite
- Phút 10-15: Khó, boss mini
- Phút 15-20: Rất khó, enemy herd
- Phút 20-25: Kinh hoàng, Elite storms
- Phút 25-30: Tuyệt vọng, mass spawns
- Phút 30: Tử Thần (Death) xuất hiện, cực mạnh

### C3. Enemy Type Rotation
Mỗi phút có loại enemy đặc biệt khác nhau

---

## NHÓM D — Tính Năng Mới

### D1. "Lệnh Bài" Modifier System
- 3 modifier random trước mỗi trận
- 12 modifiers pool khác nhau
- Modifier ảnh hưởng gameplay căn bản

### D2. Pet/Companion System  
- 3 pets cơ bản mở khóa bằng gold vĩnh viễn
- Pet hỗ trợ passive (không phải combat pet phức tạp)
- Hiển thị pet theo sau player

### D3. Synergy System
- 5 synergy combos (skill + skill)
- Tự động kích hoạt khi có đủ điều kiện

### D4. Boss Gallery & Lore
- Modal hiển thị info boss khi lần đầu gặp
- Lưu vào save data

### D5. "Linh Hồn Kết Tinh" Ghost Echo
- Khi chết → ghost lượt trước patrol map tiếp theo
- Ghost giúp attack enemy (weak version)
- Ghost khiến enemy mạnh hơn 10% (balance)

---

## Verification Plan
- Syntax check sau mỗi nhóm changes
- Build Electron app
- Manual test từng feature
