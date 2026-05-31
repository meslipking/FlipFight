# Kế hoạch: PVE Roguelike – Nâng Độ Khó Vampire Survivors + Codex + HUD Mới

## Tổng quan thay đổi

4 mục tiêu chính:
1. **Hoán đổi vị trí HUD**: Skill bar (to, ở trên) — Passive bar (nhỏ hơn, ở dưới)
2. **Bộ đếm thời gian toàn trận + Wave timer**: Khắc nghiệt theo kiểu Vampire Survivors
3. **Độ khó leo thang khắc nghiệt**: Sóng quái theo thời gian, đầu trận rất khó
4. **Bảng Codex (Collection)**: Mở ra skill/passive/evo đã khám phá, ? cho chưa khám phá

---

## Chi tiết thay đổi

### 1. HUD Layout – pve.html + pve.css

**pve.html**: Đổi thứ tự HTML — `#pveSkillBar` trên, `#pvePassiveBar` dưới (đã đúng), nhưng cần thêm `#pveGameTimer` vào TopBar

**pve.css**: 
- `#pveSkillBar`: giữ vị trí `bottom: 12px`, slot lớn 60x60px
- `#pvePassiveBar`: nhỏ hơn 34x34px, nằm ngay dưới skill bar với margin
- Thêm style cho Codex modal
- Thêm style bộ đếm thời gian toàn trận (Game Timer riêng)

### 2. Game Timer + Wave Timer – pve.js

**Thêm biến**:
- `this.gameElapsed = 0` — tổng thời gian sống sót (tăng liên tục)
- `this.waveElapsed = 0` — thời gian trong wave hiện tại
- Mỗi stage có `stageDuration`: S1=10min, S2=15min, S3=20min

**Cơ chế wave mới** (Vampire Survivors):
- KHÔNG còn "clear wave rồi mới sang wave tiếp" theo kiểu cũ
- Thay bằng: Quái xuất hiện LIÊN TỤC theo time milestones
- Cứ mỗi N giây → tăng wave number + spawn đợt quái mới TO HƠN
- Boss xuất hiện ở mốc thời gian cố định (phút 3, 6, 10, v.v.)
- Game kết thúc khi: hết thời gian (SỐNG SÓT = chiến thắng) hoặc chết

### 3. Độ khó leo thang – pve.js

**Wave scaling** (hàm `getWaveScaling(gameElapsed)`):
- 0-60s: `{ hpMult: 1.0, dmgMult: 1.0, count: 5, interval: 8 }` – rất ít quái, nhưng player yếu
- 1-3 min: `{ hpMult: 1.5, dmgMult: 1.2, count: 10, interval: 6 }` 
- 3-6 min: `{ hpMult: 2.5, dmgMult: 1.6, count: 18, interval: 5 }` – BOSS ở phút 3
- 6-10 min: `{ hpMult: 4.0, dmgMult: 2.2, count: 28, interval: 4 }` – BOSS ở phút 6
- 10-15 min: `{ hpMult: 7.0, dmgMult: 3.0, count: 40, interval: 3 }` – BOSS ở phút 10
- 15+ min: `{ hpMult: 12.0, dmgMult: 4.0, count: 60, interval: 2 }` – BOSS ở phút 15

**Elite scaling**: Tỉ lệ elite tăng từ 5% → 40% theo thời gian

**Permanent Upgrades (Power-ups)** mở từ gold trong lobby:
- `Might`: +10% sát thương tất cả kỹ năng / cấp
- `Amount`: +1 đạn/hiệu ứng / cấp  
- `Swiftness`: +5% tốc độ / cấp
- `Recovery`: +3 HP regen / cấp
- `Greed`: +15% gold / cấp
- `Luck`: +5% crit / cấp

### 4. Codex (Collection) – pve.html + pve.css + pve.js

**HTML**: Thêm modal `#pveCodexScreen` với tabs: Kỹ Năng | Passive | Tiến Hóa

**Data**: Lưu vào `savedData.discovered = { skills: Set, passives: Set, evos: Set }`

**Hiển thị**:
- Item đã unlock/dùng: hiển thị đầy đủ icon, tên, mô tả, combo tiến hóa
- Item CHƯA tìm ra: hiển thị `???` với icon `?` tím mờ
- Evolution row: `Skill Lv8 + Passive → Evolved` (nếu chưa biết thì `? + ? → ?`)

**Trigger discover**: Khi nhặt skill/passive lần đầu → thêm vào `discovered`

---

## Files cần sửa

### pve.html
- Thêm `#pveGameTimer` pill vào TopBar
- Thêm button "📖 Codex" vào TopBar/PauseMenu
- Thêm `#pveCodexScreen` modal đầy đủ
- Thêm `#pvePowerupPanel` vào Lobby

### pve.css
- Tăng kích thước skill slot → 60x60px
- Thu nhỏ passive slot → 34x34px
- Style game timer pill riêng (màu xanh dương neon)
- Style Codex modal: dark themed, tabs, grid cards với discovered/undiscovered
- Style Powerup panel trong lobby

### pve.js
- Thêm `POWERUP_DEFS` object
- Thêm `savedData.powerups = {}` và `savedData.discovered = {}`
- Sửa `defaultSave()` + `loadSaveData()`
- Sửa `createPlayer()` để áp dụng powerup bonuses
- Thêm `getWaveScaling(elapsed)` + sửa `updateWave(dt)` sang time-based
- Sửa `spawnWave()` → `spawnEnemyBatch(scaling)` 
- Thêm `BOSS_SCHEDULE` array: [{time: 180, bossId: ...}, ...]
- Thêm `updateGameTimer(dt)` vào update loop
- Thêm `discoverItem(type, id)` function
- Thêm `openCodex()` + `closeCodex()` + `renderCodex()` functions
- Sửa lobby: thêm Powerup panel và `buyPowerup(id)`
