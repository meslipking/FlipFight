# ⚔️ Angel Arena

> **2D Top-Down PVE Survival Game** — Chiến đấu chống lại 21 boss huyền thoại trong 30 phút sinh tồn!

---

## 🎮 Gameplay

Angel Arena là game sinh tồn theo phong cách **roguelite** — bạn điều khiển một nhân vật, tiêu diệt kẻ thù liên tục để nhận EXP, lên cấp và chọn kỹ năng ngẫu nhiên. Mục tiêu: **sống sót 30 phút** qua 3 màn độ khó tăng dần.

### Tính năng chính

- 🧙 **5 lớp nhân vật** — Mage, Fighter, Ranger, Assassin, Tank (mỗi lớp có bộ kỹ năng riêng)
- ⚔️ **10 Active Skills** độc đáo với cơ chế tiến hóa
- 🛡️ **10 Passive Skills** hỗ trợ chiến thuật xây dựng build
- 👹 **21 Boss độc đáo** — mỗi boss có thiết kế Canvas riêng, cơ chế rage phase và AI đặc biệt
- 🐾 **Hệ thống Pet** — đồng hành chiến đấu cùng bạn
- 📜 **Codex** — tra cứu thông tin boss và kỹ năng trong game
- 🌍 **Song ngữ** — Tiếng Việt / English

### 21 Boss

| Tier | Bosses |
|------|--------|
| 🟢 Early | Vua Slime, Phù Thủy Ôn Dịch, Linh Thần Đại Mộc, Đô Đốc Phong Bão |
| 🟡 Mid | Lãnh Chúa Bóng Đêm, Khổng Lồ Cát, Thủy Quái Bóng Tối, Băng Vương, Bạch Tuộc Vực Thẳm, Thằng Hề Hỗn Loạn |
| 🟠 Hard | Nữ Hoàng Rồng, Golem Pha Lê, Pharaoh Sắt, Thiên Sứ Sa Ngã, Thần Lich, Titan Hư Không |
| 🔴 Elite | Quỷ Vương Sa Ngã, Tiên Phong Tử Thần, Cỗ Máy Chiến Tranh |
| ☠️ Final | ⚠️ Tử Thần Thức Dậy, 💀 TỬ THẦN BẤT TỬ |

---

## 🖥️ Yêu cầu hệ thống

| | Tối thiểu | Đề xuất |
|--|-----------|---------|
| **OS** | Windows 10 64-bit | Windows 10/11 64-bit |
| **CPU** | Intel Core i3 / AMD Ryzen 3 | Intel Core i5 / AMD Ryzen 5 |
| **RAM** | 4 GB | 8 GB |
| **GPU** | Tích hợp (Intel UHD) | Dedicated GPU |
| **Storage** | 500 MB | 1 GB |

---

## 🚀 Cách chơi

### Bản PC (Electron App)
1. Tải bản release mới nhất từ [Releases](../../releases)
2. Giải nén và chạy `Angel Arena.exe`
3. Không cần cài đặt thêm!

### Chạy từ source
```bash
git clone https://github.com/your-username/angel-arena.git
cd angel-arena
npm install
npm run electron
```

### Build bản release
```bash
npm run build-win
# Output: dist/Angel Arena-win32-x64/
```

---

## 🎯 Hướng dẫn chơi

| Phím | Hành động |
|------|-----------|
| `WASD` / `↑↓←→` | Di chuyển |
| `F11` | Toggle fullscreen |
| `Escape` | Thoát fullscreen |
| `P` | Pause / Resume |

### Độ khó
- **Stage 1** — Boss từ phút 5, 12 boss spawns
- **Stage 2** — Boss từ phút 4, 14 boss spawns (nhanh hơn)
- **Stage 3** — Boss từ phút 3, 15 boss spawns (khó nhất)

---

## 🛠️ Tech Stack

- **Frontend**: HTML5 Canvas, Vanilla CSS, JavaScript
- **Desktop**: [Electron](https://electronjs.org/) v42
- **Build**: electron-packager

---

## 📁 Project Structure

```
angel-arena/
├── public/
│   ├── pve.html      # Game PVE (single-player)
│   ├── pve.js        # Game engine (~860KB, 19000+ lines)
│   ├── pve.css       # Game styles
│   ├── index.html    # Lobby / multiplayer
│   ├── game.js       # Multiplayer logic
│   └── ...
├── main.js           # Electron entry point
├── server.js         # Node.js multiplayer server
└── package.json
```

---

## 📝 License

MIT © Angel Studio 2026
