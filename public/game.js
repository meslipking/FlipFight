/* ============================================================
   FLIPFIGHT — Client Engine v2.0
   Fixed all QA bugs + 10 Evolution Stages + Rich Animations
   ============================================================ */

// ── Evolution Config (mirrors server) ────────────────────────
const EVO_RADIUS = { 1:20,2:26,3:34,4:43,5:53,6:66,7:78,8:88,9:100,10:116 };

window.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
let enableShadows = true;
// Intercept shadowBlur and shadowColor prototype setters to cleanly disable shadows on mobile
(function() {
  try {
    const descriptorBlur = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'shadowBlur');
    const descriptorColor = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'shadowColor');
    if (descriptorBlur && descriptorBlur.set) {
      Object.defineProperty(CanvasRenderingContext2D.prototype, 'shadowBlur', {
        set(val) {
          if (!enableShadows) {
            descriptorBlur.set.call(this, 0);
          } else {
            descriptorBlur.set.call(this, val);
          }
        },
        get() {
          return descriptorBlur.get.call(this);
        }
      });
    }
    if (descriptorColor && descriptorColor.set) {
      Object.defineProperty(CanvasRenderingContext2D.prototype, 'shadowColor', {
        set(val) {
          if (!enableShadows) {
            descriptorColor.set.call(this, 'transparent');
          } else {
            descriptorColor.set.call(this, val);
          }
        },
        get() {
          return descriptorColor.get.call(this);
        }
      });
    }
  } catch (e) {
    console.warn("Could not override CanvasRenderingContext2D shadows:", e);
  }
})();


// ── I18N Setup ───────────────────────────────────────────────
const I18N = {
  en: {
    tab_play: "Battle",
    tab_customize: "Loadout",
    online_players: "Players Online",
    enter_name: "Enter your name...",
    play_now: "⚔️ PLAY NOW",
    how_to_play: "Controls",
    move: "Move",
    skill: "Skill / Attack",
    use_item: "Use Item",
    mouse: "🖱️ Mouse",
    move_skill: "Aim direction",
    hp_bar: "❤️ HP",
    xp_bar: "✨ XP",
    leaderboard: "🏆 Leaderboard",
    btn_dash: "DASH<br><small>[Space]</small>",
    btn_skill: "SKILL<br><small>[E]</small>",
    btn_item: "ITEM<br><small>[F]</small>",
    btn_switch: "SWITCH<br><small>[Q]</small>",
    eliminated: "ELIMINATED",
    killed_by: "Killed by: ",
    stat_rank: "🏅 Rank",
    stat_score: "⭐ Score",
    stat_kills: "⚔️ Kills",
    stat_survived: "⏱ Survived",
    stat_evolution: "🦋 Max Evolution",
    play_again: "🔄 PLAY AGAIN",
    environment: "Environment",
    report_bug: "Report Bug & Feedback",
    tagline: "Free Online Multiplayer Battle Game",
    switch_item: "Switch Item",
    ctrl_keyboard: "⌨️ Keyboard",
    ctrl_mouse_header: "🖱️ Mouse",
    ctrl_move: "Move character",
    ctrl_dash: "Dash / Sprint",
    ctrl_skill: "Activate Skill / Attack",
    ctrl_wasd: "Move character",
    ctrl_mouse: "Auto-move to cursor",
    ctrl_lclick: "Attack / Skill",
    ctrl_rclick: "Use Item",
    ctrl_scroll: "Switch Item",
    ctrl_e: "Activate Skill",
    ctrl_f: "Use Item",
    ctrl_q: "Switch Item",
    ctrl_tab: "Leaderboard",
    ctrl_1to6: "Select Item Slot 1-6",
    items_title: "Items",
    evo_title: "Evolution Tree",
    badge_multi: "Multiplayer",
    badge_10evo: "10 Evolutions",
    seo_desc: "🎮 Free online 2D battle game. 10 evolution stages, various items, real-time combat!",
    item_boot: "Dash<br><em>[Boot]</em>",
    item_rocket: "Rocket<br><em>[Rocket]</em>",
    item_bomb: "Bomb<br><em>[Bomb]</em>",
    item_poison: "Poison<br><em>[Poison]</em>",
    item_shield: "Shield<br><em>[Shield]</em>",
    item_net: "Net<br><em>[Net]</em>",
    item_heal: "Heal<br><em>[Heal]</em>",
    item_rage: "Rage<br><em>[Rage]</em>",
    item_lightning: "Lightning<br><em>[Lightning]</em>",
    select_starting_perk: "Select Starting Perk",
    select_evo_branch: "Select Evolution Branch (Lv.5+)",
    perk_speed: "Speed",
    perk_hp: "Max HP",
    perk_heal: "Heal",
    perk_bomb: "Bomb Damage",
    perk_dmg: "Attack",
    perk_cd: "Cooldown",
    branch_assassin: "Assassin",
    branch_fighter: "Fighter",
    branch_mage: "Mage",
    rps_title: "⚔️ Class Counters (RPS)",
    rps_desc: "Tactical Rock-Paper-Scissors multipliers:",
    rps_assassin: "💜 Assassin ➜ counters 🩵 Mage (+30%)",
    rps_mage: "🩵 Mage ➜ counters 💛 Fighter (+30%)",
    rps_fighter: "💛 Fighter ➜ counters 💜 Assassin (+30%)",
    
    connecting: "Connecting...",
    lost_connection: "Connection lost. Reconnecting...",
    connection_error: "Connection error!",
    got_announcement: "✨ Got: ",

    evo_modal_banner: "✨ LEVEL 5 REACHED — ULTIMATE EVOLUTION ✨",
    evo_modal_title: "🌳 CHOOSE EVOLUTION PATH 🌳",
    evo_modal_subtitle: "Choose a path that defines your ultimate power.",
    evo_select_btn: "CHOOSE",

    branch_assassin_banner: "ASSASSIN",
    branch_assassin_desc_short: "Fades into shadows, executing swift critical strikes.",
    branch_assassin_stat1: "⚡ Speed: <span class=\"stat-up\">+20%</span>",
    branch_assassin_stat2: "🎯 Size: Small (-15% Radius)",
    branch_assassin_stat3: "💔 Health: Low (-20% HP)",
    branch_assassin_skill: "<strong>Primary Skill:</strong> Shadow Dash (Stun) & Stealth Vanish.",

    branch_fighter_banner: "FIGHTER",
    branch_fighter_desc_short: "Indestructible steel wall, dominating the frontlines.",
    branch_fighter_stat1: "❤️ Health: <span class=\"stat-up\">+35% HP</span>",
    branch_fighter_stat2: "🧱 Size: Large (+15% Radius)",
    branch_fighter_stat3: "💨 Speed: Reduced (-10%)",
    branch_fighter_skill: "<strong>Primary Skill:</strong> Shield Charge & 5s Invulnerability.",

    branch_mage_banner: "MAGE",
    branch_mage_desc_short: "Spell storm controller, casting wide area crowd control.",
    branch_mage_stat1: "🎯 Range: <span class=\"stat-up\">+25% Range</span>",
    branch_mage_stat2: "💥 Basic Atk: Chain lightning projectiles",
    branch_mage_stat3: "⏱️ Mana: Rapid resource regeneration",
    branch_mage_skill: "<strong>Primary Skill:</strong> Lightning Bind & Freezing Blizzard.",

    perk_modal_banner: "✨ MATCH START REWARD ✨",
    perk_modal_title: "🃏 ROGUELIKE PERK CARDS 🃏",
    perk_modal_subtitle: "Choose <strong style=\"color:#fbbf24;\">1 perk card</strong> — permanent stat bonuses for the entire match.",
    perk_modal_warn: "⚠️ Choose quickly to get ready for the arena!",
    
    perk_speed_boost_title: "⚡ Swift Foot",
    perk_speed_boost_stat: "⚡ Movement Speed: +8% (Permanent)",
    perk_speed_boost_desc: "Move swiftly across the arena to dodge hazards and chase down enemies.",
    
    perk_max_hp_boost_title: "🛡️ Iron Will",
    perk_max_hp_boost_stat: "🛡️ Max HP: +15% (Permanent)",
    perk_max_hp_boost_desc: "Gives permanent extra health, making you highly resilient to heavy blows.",
    
    perk_heal_boost_title: "🧪 Vigor Brew",
    perk_heal_boost_stat: "🧪 Healing Efficacy: +25% (Permanent)",
    perk_heal_boost_desc: "Significantly boosts the hitpoints recovered when using healing potions.",
    
    perk_bomb_boost_title: "💣 Demolition",
    perk_bomb_boost_stat: "💣 Explosion Damage: +30% (Permanent)",
    perk_bomb_boost_desc: "Amplifies both blast radius and lethal damage of all dropped bombs.",
    
    perk_attack_dmg_boost_title: "⚔️ Giant Strike",
    perk_attack_dmg_boost_stat: "⚔️ Base Damage: +12% (Permanent)",
    perk_attack_dmg_boost_desc: "Permanently empowers all basic slashes and projectiles with raw damage.",
    
    perk_cooldown_reduction_title: "⏱️ Haste",
    perk_cooldown_reduction_stat: "⏱️ Cooldown Reduction: -15% (Permanent)",
    perk_cooldown_reduction_desc: "Increases combat rhythm, allowing skills and dashes to cool down much faster.",
    
    branch_assassin_title: "💜 Assassin Branch (Lv.5+ Rogue)",
    branch_assassin_desc: "High mobility, deadly critical slashes, smoke bombs, and dark stealth/invisibility. Drapes in blood cloak & throws fast rotating shurikens. Counters Mage (+30% dmg).",
    
    branch_fighter_title: "💛 Fighter Branch (Lv.5+ Vanguard)",
    branch_fighter_desc: "Colossal size, massive health pool, shield charge, stun slam, warlord cry, and absolute invulnerability. Carries sword & iron crest shield. Counters Assassin (+30% dmg).",
    
    branch_mage_title: "🩵 Mage Branch (Lv.5+ Adept)",
    branch_mage_desc: "Unrivaled attack range, magic barriers, flame storm, freeze nova, chain lightning, and global time warping. Wears wizard hat & mahogany scepter staff. Counters Fighter (+30% dmg).",

    tag_speed: "SPEED",
    tag_hp: "HP",
    tag_heal: "HEAL",
    tag_bomb: "DAMAGE",
    tag_dmg: "ATTACK",
    tag_cd: "SKILL",
    perk_select_btn: "SELECT",
    perk_auto_select: "⏳ Auto-selecting in {seconds}s",
    perk_selecting: "⚡ Selecting...",
    rotate_device_title: "Rotate Your Device",
    rotate_device_desc: "Please use landscape mode for the best gaming experience.",

    perk_max_hp_boost_fighter_stat: "🛡️ Max HP: +10% & +15% CC Resist (Permanent)",
    perk_max_hp_boost_fighter_desc: "Increases maximum health and reduces slow/stun durations by 15%. Perfect for frontline Fighters.",
    perk_max_hp_boost_mage_stat: "🛡️ Max HP: +15% (Permanent)",
    perk_max_hp_boost_mage_desc: "Significantly increases maximum health to help the fragile Mage survive intense battles.",
    perk_max_hp_boost_assassin_stat: "🛡️ Max HP: +12% (Permanent)",
    perk_max_hp_boost_assassin_desc: "Gives a moderate health boost to make the Assassin safer when diving enemy backlines.",
    perk_speed_boost_mage_stat: "⚡ Speed: +8% & +5% Projectile Speed (Permanent)",
    perk_speed_boost_mage_desc: "Move swifter and gain 5% projectile speed for perfect magical kiting.",
    perk_cooldown_reduction_assassin_stat: "⏱️ Cooldown: -12% & +2% Damage (Permanent)",
    perk_cooldown_reduction_assassin_desc: "Reduces skill cooldown and adds 2% base damage to optimize burst potential.",

    bot_chat: {
      chase_1: "Stop right there! 💢",
      chase_2: "No escape for you! 🤣",
      chase_3: "Don't run, I just want to 'chat'! 🤪",
      chase_4: "Can't dodge this! 🎯",
      chase_5: "You're out of luck! 💀",
      flee_1: "Mercy please! 😨",
      flee_2: "High ping, save me! 😢",
      flee_3: "Catch you later! 🏃‍♂️",
      flee_4: "I'll be back for revenge! 💨",
      flee_5: "Let me heal up first! 🧪",
      kill_1: "Too easy, go practice! 😎",
      kill_2: "Back to lobby you go! 👋",
      kill_3: "Not even close! 🤪",
      kill_4: "Piece of cake! 🤣",
      kill_5: "Learn to dodge! 🎯",
      kill_6: "Perfect plan! 😈",
      kill_7: "Be more careful next time! 😉",
      death_1: "Hacker! How did you know I was here? 😡",
      death_2: "Damn lag! 😭",
      death_3: "My skills were on cooldown! 😢",
      death_4: "Teaming up on me? Unfair! 😠",
      death_5: "I will get my revenge! 💀",
      death_6: "If only I had a potion... 🧪",
      death_7: "Just a small slip-up, don't get cocky! 😅"
    }
  },
  vi: {
    tab_play: "Vào Trận",
    tab_customize: "Trang Bị",
    online_players: "Người đang chơi",
    enter_name: "Nhập tên của bạn...",
    play_now: "⚔️ VÀO TRẬN NGAY",
    how_to_play: "Điều Khiển",
    move: "Di chuyển",
    skill: "Kỹ năng / Tấn công",
    use_item: "Dùng vật phẩm",
    mouse: "🖱️ Chuột",
    move_skill: "Xoay hướng",
    hp_bar: "❤️ Máu",
    xp_bar: "✨ Kinh nghiệm",
    leaderboard: "🏆 Bảng xếp hạng",
    btn_dash: "LƯỚT<br><small>[Space]</small>",
    btn_skill: "KỸ NĂNG<br><small>[E]</small>",
    btn_item: "VẬT PHẨM<br><small>[F]</small>",
    btn_switch: "ĐỔI<br><small>[Q]</small>",
    eliminated: "ĐÃ BỊ HẠ GỤC",
    killed_by: "Bị hạ bởi: ",
    stat_rank: "🏅 Thứ Hạng",
    stat_score: "⭐ Điểm",
    stat_kills: "⚔️ Giết",
    stat_survived: "⏱ Sống Sót",
    stat_evolution: "🦋 Tiến Hóa",
    play_again: "🔄 CHƠI LẠI",
    environment: "Môi trường",
    report_bug: "Báo Lỗi & Góp Ý",
    tagline: "Game Chiến Đấu Trực Tuyến Miễn Phí",
    switch_item: "Đổi Vật Phẩm",
    ctrl_keyboard: "⌨️ Bàn phím",
    ctrl_mouse_header: "🖱️ Chuột",
    ctrl_move: "Di chuyển nhân vật",
    ctrl_dash: "Lướt / Tốc hành",
    ctrl_skill: "Kích hoạt kỹ năng / Tấn công",
    ctrl_wasd: "Di chuyển nhân vật",
    ctrl_mouse: "Tự đi theo chuột",
    ctrl_lclick: "Tấn công / Kỹ năng",
    ctrl_rclick: "Dùng vật phẩm",
    ctrl_scroll: "Chuyển vật phẩm",
    ctrl_e: "Kích hoạt kỹ năng",
    ctrl_f: "Dùng vật phẩm",
    ctrl_q: "Đổi vật phẩm",
    ctrl_tab: "Bảng xếp hạng",
    ctrl_1to6: "Chọn ô vật phẩm 1-6",
    items_title: "Vật Phẩm",
    evo_title: "Cây Tiến Hóa",
    badge_multi: "Nhiều Người Chơi",
    badge_10evo: "10 Tiến Hóa",
    seo_desc: "🎮 Game chiến đấu 2D online miễn phí. 10 giai đoạn tiến hóa, vật phẩm đa dạng, đấu real-time!",
    item_boot: "Lướt<br><em>[Boot]</em>",
    item_rocket: "Tên lửa<br><em>[Rocket]</em>",
    item_bomb: "Bom<br><em>[Bomb]</em>",
    item_poison: "Độc<br><em>[Poison]</em>",
    item_shield: "Khiên<br><em>[Shield]</em>",
    item_net: "Lưới<br><em>[Net]</em>",
    item_heal: "Thuốc<br><em>[Heal]</em>",
    item_rage: "Cuồng nộ<br><em>[Rage]</em>",
    item_lightning: "Sét Giật<br><em>[Lightning]</em>",
    select_starting_perk: "Chọn Thẻ Bài Khởi Đầu",
    select_evo_branch: "Chọn Nhánh Tiến Hóa (Cấp 5+)",
    perk_speed: "Tốc Độ",
    perk_hp: "Máu Tối Đa",
    perk_heal: "Hồi Phục",
    perk_bomb: "Bom Nổ",
    perk_dmg: "Tấn Công",
    perk_cd: "Hồi Chiêu",
    branch_assassin: "Sát Thủ",
    branch_fighter: "Đấu Sĩ",
    branch_mage: "Pháp Sư",
    rps_title: "⚔️ Khắc Chế Hệ Phái (Oẳn Tù Tì)",
    rps_desc: "Sát thương khắc chế tăng thêm +30%:",
    rps_assassin: "💜 Sát Thủ ➜ khắc 🩵 Pháp Sư (+30%)",
    rps_mage: "🩵 Pháp Sư ➜ khắc 💛 Đấu Sĩ (+30%)",
    rps_fighter: "💛 Đấu Sĩ ➜ khắc 💜 Sát Thủ (+30%)",
    
    connecting: "Đang kết nối...",
    lost_connection: "Mất kết nối tới máy chủ. Đang thử lại...",
    connection_error: "Lỗi kết nối!",
    got_announcement: "✨ Đã nhận: ",

    evo_modal_banner: "✨ ĐẠT CẤP 5 — TIẾN HÓA CỰC HẠN ✨",
    evo_modal_title: "🌳 CHỌN NHÁNH TIẾN HÓA 🌳",
    evo_modal_subtitle: "Chọn một hướng đi định hình sức mạnh tối thượng của bạn.",
    evo_select_btn: "LỰA CHỌN",

    branch_assassin_banner: "SÁT THỦ",
    branch_assassin_desc_short: "Ẩn hiện vô hình, dồn sát thương chí mạng cực nhanh.",
    branch_assassin_stat1: "⚡ Tốc chạy: <span class=\"stat-up\">+20%</span>",
    branch_assassin_stat2: "🎯 Thể chất: Bán kính nhỏ (-15%)",
    branch_assassin_stat3: "💔 Sinh mệnh: Thấp (-20% HP)",
    branch_assassin_skill: "<strong>Kỹ năng chính:</strong> Lướt bóng tối (Stun) & Tàng hình ẩn thân.",

    branch_fighter_banner: "ĐẤU SĨ",
    branch_fighter_desc_short: "Thiết giáp bất bại, càn quét tuyến đầu bản đồ.",
    branch_fighter_stat1: "❤️ Sinh mệnh: <span class=\"stat-up\">+35% HP</span>",
    branch_fighter_stat2: "🧱 Thể chất: Bán kính lớn (+15%)",
    branch_fighter_stat3: "💨 Tốc chạy: Giảm nhẹ (-10%)",
    branch_fighter_skill: "<strong>Kỹ năng chính:</strong> Lướt khiên choáng & Bất tử 5 giây.",

    branch_mage_banner: "PHÁP SƯ",
    branch_mage_desc_short: "Bão tố phép thuật, khống chế quần thể diện rộng.",
    branch_mage_stat1: "🎯 Tầm bắn: <span class=\"stat-up\">+25% Range</span>",
    branch_mage_stat2: "💥 Đòn đánh: Đạn ma pháp nảy sét",
    branch_mage_stat3: "⏱️ Mana: Hồi phục cực nhanh",
    branch_mage_skill: "<strong>Kỹ năng chính:</strong> Lôi xích & Bão tuyết đóng băng.",

    perk_modal_banner: "✨ PHẦN THƯỞNG BẮT ĐẦU TRẬN ĐẤU ✨",
    perk_modal_title: "🃏 THẺ BÀI ROGUELIKE 🃏",
    perk_modal_subtitle: "Chọn <strong style=\"color:#fbbf24;\">1 thẻ bài</strong> — Hiệu ứng cộng dồn vĩnh viễn suốt trận đấu.",
    perk_modal_warn: "⚠️ Hãy chọn thật nhanh để sẵn sàng bước vào đấu trường!",
    
    perk_speed_boost_title: "⚡ Swift Foot (Tốc Hành)",
    perk_speed_boost_stat: "⚡ Tốc độ di chuyển: +8% (Vĩnh viễn)",
    perk_speed_boost_desc: "Di chuyển cực kỳ nhanh nhẹn để né tránh bom đạn và truy đuổi kẻ địch.",
    
    perk_max_hp_boost_title: "🛡️ Iron Will (Ý Chí Thép)",
    perk_max_hp_boost_stat: "🛡️ Máu tối đa: +15% (Vĩnh viễn)",
    perk_max_hp_boost_desc: "Gia tăng vĩnh viễn giới hạn sinh mệnh, giúp chống chịu nhiều đòn đánh nặng hơn.",
    
    perk_heal_boost_title: "🧪 Vigor Brew (Sinh Lực Dồi Dào)",
    perk_heal_boost_stat: "🧪 Hiệu quả hồi máu: +25% (Vĩnh viễn)",
    perk_heal_boost_desc: "Tăng mạnh lượng máu phục hồi khi nhặt và sử dụng Thuốc hồi phục (Potion).",
    
    perk_bomb_boost_title: "💣 Demolition (Chuyên Gia Chất Nổ)",
    perk_bomb_boost_stat: "💣 Sát thương bom nổ: +30% (Vĩnh viễn)",
    perk_bomb_boost_desc: "Mở rộng bán kính vụ nổ và gia tăng uy lực của toàn bộ bom đặt ra.",
    
    perk_attack_dmg_boost_title: "⚔️ Giant Strike (Đòn Đánh Khổng Lồ)",
    perk_attack_dmg_boost_stat: "⚔️ Sát thương cơ bản: +12% (Vĩnh viễn)",
    perk_attack_dmg_boost_desc: "Cường hóa vũ khí vĩnh viễn, tăng sát thương mỗi đòn đánh thường và tia đạn.",
    
    perk_cooldown_reduction_title: "⏱️ Haste (Vội Vã)",
    perk_cooldown_reduction_stat: "⏱️ Giảm hồi chiêu: -15% (Vĩnh viễn)",
    perk_cooldown_reduction_desc: "Tăng nhịp độ chiến đấu, rút ngắn thời gian hồi kỹ năng và tốc biến chạy trốn.",
    
    branch_assassin_title: "💜 Hệ Sát Thủ (Cấp 5+ Rogue)",
    branch_assassin_desc: "Cơ động vượt trội, ám sát chớp nhoáng, bom khói tàng hình ẩn thân. Sở hữu áo choàng đỏ huyết và phi tiêu thép xoay tít cực chất. Khắc chế Pháp Sư (+30% sát thương).",
    
    branch_fighter_title: "💛 Hệ Đấu Sĩ (Cấp 5+ Vanguard)",
    branch_fighter_desc: "Kích thước khổng lồ, máu siêu trâu, lướt khiên choáng, tiếng hú warlord giáp ảo và bất tử hộ vệ. Mang kiếm hiệp sĩ và khiên sắt bọc vàng cực chiến. Khắc chế Sát Thủ (+30% sát thương).",
    
    branch_mage_title: "🩵 Hệ Pháp Sư (Cấp 5+ Adept)",
    branch_mage_desc: "Tầm bắn siêu xa, dựng tường ma pháp đẩy lùi, bão lửa sấm sét khống chế diện rộng và ngưng đọng thời gian toàn bản đồ. Đội mũ phù thủy và cầm trượng phép xanh tỏa sáng. Khắc chế Đấu Sĩ (+30% sát thương).",

    tag_speed: "TỐC ĐỘ",
    tag_hp: "SỨC BỀN",
    tag_heal: "HỒI PHỤC",
    tag_bomb: "SẤT THƯƠNG",
    tag_dmg: "TẤN CÔNG",
    tag_cd: "KỸ NĂNG",
    perk_select_btn: "CHỌN NGAY",
    perk_auto_select: "⏳ Tự động chọn sau {seconds}s",
    perk_selecting: "⚡ Đang chọn...",
    rotate_device_title: "Xoay ngang điện thoại",
    rotate_device_desc: "Để có trải nghiệm chiến đấu tốt nhất.",

    perk_max_hp_boost_fighter_stat: "🛡️ Máu tối đa: +10% & +15% Kháng CC (Vĩnh viễn)",
    perk_max_hp_boost_fighter_desc: "Gia tăng HP tối đa và giảm 15% thời gian bị làm chậm/choáng. Phù hợp cho Đấu Sĩ tiên phong.",
    perk_max_hp_boost_mage_stat: "🛡️ Máu tối đa: +15% (Vĩnh viễn)",
    perk_max_hp_boost_mage_desc: "Tăng giới hạn HP lớn giúp Pháp Sư mỏng manh dễ dàng sống sót trong giao tranh.",
    perk_max_hp_boost_assassin_stat: "🛡️ Máu tối đa: +12% (Vĩnh viễn)",
    perk_max_hp_boost_assassin_desc: "Tăng giới hạn HP vừa phải để Sát Thủ an toàn hơn khi thâm nhập tuyến sau.",
    perk_speed_boost_mage_stat: "⚡ Tốc chạy: +8% & +5% Tốc đạn (Vĩnh viễn)",
    perk_speed_boost_mage_desc: "Di chuyển nhanh nhẹn hơn và tăng 5% tốc độ bay của tia ma pháp để cấu rỉa hoàn hảo.",
    perk_cooldown_reduction_assassin_stat: "⏱️ Giảm hồi chiêu: -12% & +2% Sát thương (Vĩnh viễn)",
    perk_cooldown_reduction_assassin_desc: "Giảm thời gian hồi chiêu, cộng thêm 2% sát thương cơ bản để tối ưu khả năng dồn sát thương.",

    bot_chat: {
      chase_1: "Đứng lại đó cho ta! 💢",
      chase_2: "Chạy đằng trời nhé cưng! 🤣",
      chase_3: "Đừng chạy, ta chỉ muốn 'giao lưu' thôi! 🤪",
      chase_4: "Né sao được quả này! 🎯",
      chase_5: "Gặp ta là xui rồi con ơi! 💀",
      flee_1: "Tha cho em bác ơi! 😨",
      flee_2: "Lag quá lag quá, cứu tôi! 😢",
      flee_3: "Hẹn gặp lại sau nhé! 🏃‍♂️",
      flee_4: "Quân tử trả thù 10 năm chưa muộn! 💨",
      flee_5: "Đợi hồi máu đã nha! 🧪",
      kill_1: "Non quá, luyện thêm đi nhé! 😎",
      kill_2: "Biến về sảnh đi cưng! 👋",
      kill_3: "Tuổi gì thế này? 🤪",
      kill_4: "Dễ như ăn kẹo vậy! 🤣",
      kill_5: "Học thêm khóa né chiêu đi em! 🎯",
      kill_6: "Kế hoạch hoàn hảo! 😈",
      kill_7: "Lần sau cẩn thận hơn nha! 😉",
      death_1: "Đồ hack! Sao biết ta ở đây? 😡",
      death_2: "Mạng lag quá thế nhở! 😭",
      death_3: "Chưa kịp hồi chiêu mà! 😢",
      death_4: "Bị hội đồng, không công bằng! 😠",
      death_5: "Chờ đấy, ta sẽ phục thù! 💀",
      death_6: "Ước gì có bình HP lúc nãy... 🧪",
      death_7: "Sơ hở chút thôi làm gì căng! 😅"
    }
  }
};


let currentLang = localStorage.getItem('lang') || 'vi';
if (currentLang !== 'en' && currentLang !== 'vi') currentLang = 'vi';

window.setLang = function(lang) {
  if (lang !== 'en' && lang !== 'vi') lang = 'vi';
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if(I18N[lang] && I18N[lang][key]) el.innerHTML = I18N[lang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if(I18N[lang] && I18N[lang][key]) el.placeholder = I18N[lang][key];
  });

  // Update active state of language buttons
  const btnEn = document.getElementById('langBtnEn');
  const btnVi = document.getElementById('langBtnVi');
  if (btnEn && btnVi) {
    if (lang === 'en') {
      btnEn.classList.add('active');
      btnVi.classList.remove('active');
    } else {
      btnVi.classList.add('active');
      btnEn.classList.remove('active');
    }
  }

  // Refresh dynamic home page details in the newly selected language
  if (window.selectedHomepagePerk) {
    window.selectHomepagePerk(window.selectedHomepagePerk);
  }
  if (window.selectedHomepageBranch) {
    window.selectHomepageBranch(window.selectedHomepageBranch);
  }
};

window.switchMobileTab = function(tabName) {
  const container = document.querySelector('.login-inner');
  if (!container) return;
  
  const playBtn = document.querySelector('#mobileLobbyTabs button:nth-child(1)');
  const custBtn = document.querySelector('#mobileLobbyTabs button:nth-child(2)');
  
  if (tabName === 'play') {
    container.classList.remove('show-customize');
    if (playBtn) playBtn.classList.add('active');
    if (custBtn) custBtn.classList.remove('active');
  } else if (tabName === 'customize') {
    container.classList.add('show-customize');
    if (playBtn) playBtn.classList.remove('active');
    if (custBtn) custBtn.classList.add('active');
    
    // Refresh character preview rendering
    if (window.selectedHomepageBranch) {
      window.selectHomepageBranch(window.selectedHomepageBranch);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.setLang(currentLang);
  window.switchMobileTab('play');
  // Initialize starting selections and details on home
  window.selectHomepagePerk(window.selectedHomepagePerk);
  window.selectHomepageBranch(window.selectedHomepageBranch);
});

// ── WebSocket Setup ───────────────────────────────────────────
let socket;

// ── Canvas ────────────────────────────────────────────────────
const canvas   = document.getElementById('gameCanvas');
const ctx      = canvas.getContext('2d');
const mmCanvas = document.getElementById('minimapCanvas');
const mmCtx    = mmCanvas.getContext('2d');

// ── DOM Refs ──────────────────────────────────────────────────
const loginScreen    = document.getElementById('loginScreen');
const playerNameInput= document.getElementById('playerName');
const joinButton     = document.getElementById('joinButton');
const hud            = document.getElementById('hud');
const hudAliveCount  = document.getElementById('hudAliveCount');
const hudStopwatch   = document.getElementById('hudStopwatch');
const hudMatchTimer  = document.getElementById('hudMatchTimer');
const lbList         = document.getElementById('leaderboardList');
const lobbyCount     = document.getElementById('lobbyCountText');
const btnUseItem     = document.getElementById('btnUseItem');
const btnAttack      = document.getElementById('btnAttack');
const gameOverScreen = document.getElementById('gameOverScreen');
const statTime       = document.getElementById('statTime');
const statRank       = document.getElementById('statRank');
const statScore      = document.getElementById('statScore');
const statKills      = document.getElementById('statKills');
const statEvolution  = document.getElementById('statEvolution');
const statKilledBy   = document.getElementById('statKilledBy');
const respawnButton  = document.getElementById('respawnButton');
const hotbarSlots    = document.querySelectorAll('.hotbar-slot');
const mjOverlay      = document.getElementById('mobileJoystickOverlay');
const joyZone        = document.getElementById('joystickZone');
const joyBase        = document.getElementById('joystickBase');
const joyStick       = document.getElementById('joystickStick');
const killFeedEl     = document.getElementById('killFeed');
const pingText       = document.getElementById('pingText');
const btnDash        = document.getElementById('btnDash');

let cameraZoom = 1;
window.isSelectingPerk = false;
window.isSelectingBranch = false;
window.selectedHomepagePerk = 'speed_boost';
window.selectedHomepageBranch = 'assassin';

window.selectHomepagePerk = function(perk) {
  window.selectedHomepagePerk = perk;
  const boxes = document.querySelectorAll('#perkSelectGrid .selection-box');
  boxes.forEach(box => {
    if (box.getAttribute('data-perk') === perk) {
      box.classList.add('active');
    } else {
      box.classList.remove('active');
    }
  });

  // Update Perk Detail Sub-panel
  const panel = document.getElementById('perkDetailPanel');
  if (panel) {
    panel.classList.remove('hidden');
    panel.setAttribute('data-current-perk', perk);
    
    const titleKey = `perk_${perk}_title`;
    const statKey  = `perk_${perk}_stat`;
    const descKey  = `perk_${perk}_desc`;
    
    const langObj = I18N[currentLang] || I18N['vi'];
    
    const iconMap = {
      speed_boost: '⚡',
      max_hp_boost: '🛡️',
      heal_boost: '🧪',
      bomb_boost: '💣',
      attack_dmg_boost: '⚔️',
      cooldown_reduction: '⏱️'
    };

    const icon = document.getElementById('pdpIcon');
    const title = document.getElementById('pdpTitle');
    const stat = document.getElementById('pdpStat');
    const desc = document.getElementById('pdpDesc');

    if (icon) icon.textContent = iconMap[perk] || '🃏';
    if (title) title.innerHTML = langObj[titleKey] || perk;
    if (stat) stat.innerHTML = langObj[statKey] || '';
    if (desc) desc.innerHTML = langObj[descKey] || '';
  }
};

window.selectHomepageBranch = function(branch) {
  window.selectedHomepageBranch = branch;
  const boxes = document.querySelectorAll('#branchSelectGrid .selection-box');
  boxes.forEach(box => {
    if (box.getAttribute('data-branch') === branch) {
      box.classList.add('active');
    } else {
      box.classList.remove('active');
    }
  });

  // Update Branch Preview Info
  const wrap = document.getElementById('branchPreviewWrap');
  if (wrap) {
    wrap.setAttribute('data-current-branch', branch);
    
    const titleKey = `branch_${branch}_title`;
    const descKey  = `branch_${branch}_desc`;
    
    const langObj = I18N[currentLang] || I18N['vi'];
    
    const nameEl = document.getElementById('branchPreviewName');
    const descEl = document.getElementById('branchPreviewDesc');
    
    if (nameEl) nameEl.innerHTML = langObj[titleKey] || branch;
    if (descEl) descEl.innerHTML = langObj[descKey] || '';
  }

  // Trigger homepage branch canvas animation change
  window.startHomepageBranchPreview(branch);
};

let homepagePreviewAnimationId = null;
window.startHomepageBranchPreview = function(branch) {
  if (homepagePreviewAnimationId) {
    cancelAnimationFrame(homepagePreviewAnimationId);
    homepagePreviewAnimationId = null;
  }

  const canvasPrv = document.getElementById('homepageBranchCanvas');
  if (!canvasPrv) return;
  const ctxPrv = canvasPrv.getContext('2d');
  
  const r = 26; // nice drawing radius
  const startT = Date.now();
  
  function drawFrame() {
    const t = Date.now();
    ctxPrv.clearRect(0, 0, canvasPrv.width, canvasPrv.height);
    
    ctxPrv.save();
    // Translate to center of canvas (higher y offset to prevent bottom clipping of cloak/weapon)
    ctxPrv.translate(canvasPrv.width / 2, canvasPrv.height / 2 + 3);
    
    // Setup character skin details (representing the stunning high-tier Level 8 form!)
    let skin = BRANCH_SKINS[branch]?.[8] || SKINS[8];
    
    // Waddle + Breathe
    const breathY = Math.sin((t - startT) / 150) * 0.055;
    let squashX = 1 + breathY;
    let squashY = 1 - breathY;
    const waddleA = Math.sin((t - startT) / 120) * 0.12;
    
    // Action / Attack Swing cycle every 2.0s
    let attacking = false;
    let attackProgress = 0;
    const cycleTime = 2000;
    const animDuration = 450;
    const elapsedInCycle = (t - startT) % cycleTime;
    
    if (elapsedInCycle < animDuration) {
      attacking = true;
      attackProgress = elapsedInCycle / animDuration;
    }
    
    // Draw Shadow
    ctxPrv.beginPath();
    ctxPrv.ellipse(0, r - 2, r * 0.85, 6, 0, 0, Math.PI * 2);
    ctxPrv.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctxPrv.fill();
    
    // Aura Ring (Lv8 details)
    if (skin.aura) {
      ctxPrv.save();
      ctxPrv.rotate(((t - startT) / 600) % (Math.PI * 2));
      ctxPrv.setLineDash([6, 5]);
      ctxPrv.beginPath();
      ctxPrv.arc(0, 0, r + 10 + Math.sin((t - startT) / 80) * 3, 0, Math.PI * 2);
      ctxPrv.strokeStyle = skin.aura;
      ctxPrv.lineWidth = 2.5;
      ctxPrv.stroke();
      ctxPrv.restore();
    }
    
    ctxPrv.save();
    
    // Branch-specific attack body transformations
    if (attacking) {
      if (branch === 'assassin') {
        const dashDist = Math.sin(attackProgress * Math.PI) * r * 0.38;
        ctxPrv.translate(dashDist, 0);
        ctxPrv.rotate(-Math.sin(attackProgress * Math.PI) * 0.22);
      } else if (branch === 'fighter') {
        const swingTilt = Math.sin(attackProgress * Math.PI) * 0.28;
        ctxPrv.rotate(swingTilt);
      } else if (branch === 'mage') {
        const tilt = Math.sin(attackProgress * Math.PI) * 0.18;
        ctxPrv.rotate(tilt);
      }
    }
    
    ctxPrv.scale(squashX, squashY);
    ctxPrv.rotate(waddleA);
    
    // Behind body attachments
    if (branch === 'assassin') drawCloak(ctxPrv, r);
    if (skin.skinType === 'demon') drawDemonWings(ctxPrv, r, t);
    if (skin.skinType === 'shadow') drawShadowAura(ctxPrv, r, t);
    
    // Draw Body
    ctxPrv.beginPath();
    ctxPrv.arc(0, 0, r, 0, Math.PI * 2);
    const g = ctxPrv.createRadialGradient(-r * 0.35, -r * 0.38, r * 0.06, 0, 0, r);
    g.addColorStop(0, skin.bodyHL);
    g.addColorStop(0.5, skin.body1);
    g.addColorStop(1, skin.body2);
    ctxPrv.fillStyle = g;
    ctxPrv.fill();
    ctxPrv.strokeStyle = skin.outline;
    ctxPrv.lineWidth = 3.5;
    ctxPrv.stroke();
    
    // Front body attachments
    if (skin.skinType === 'leaf') drawLeaf(ctxPrv, r, t);
    else if (skin.skinType === 'horns') drawHorns(ctxPrv, r);
    else if (skin.skinType === 'neko') drawNekoEars(ctxPrv, r, skin);
    else if (skin.skinType === 'panda') drawPandaEars(ctxPrv, r, skin);
    else if (skin.skinType === 'demon') drawDemonHorns(ctxPrv, r);
    else if (skin.skinType === 'boss') drawCrown(ctxPrv, r, t);
    else if (skin.skinType === 'dragon') drawDragonHorns(ctxPrv, r, t);
    else if (skin.skinType === 'shadow') drawShadowMask(ctxPrv, r, t);
    else if (skin.skinType === 'celestial') drawHalo(ctxPrv, r, t);
    else if (skin.skinType === 'omega') drawOmegaSymbol(ctxPrv, r, t);
    
    // Draw Branch weapon equipments
    if (branch === 'assassin') {
      drawShuriken(ctxPrv, r, t, attacking, attackProgress);
    } else if (branch === 'fighter') {
      drawFighterSword(ctxPrv, r, attacking, attackProgress);
      drawFighterShield(ctxPrv, r, attacking, attackProgress);
    } else if (branch === 'mage') {
      drawMageHat(ctxPrv, r);
      drawMageStaff(ctxPrv, r, t, attacking, attackProgress);
    }
    
    // Eyes (representing a cute face looking right)
    ctxPrv.save();
    // A cute direct face orientation
    ctxPrv.rotate(0.1 + Math.sin((t - startT) / 250) * 0.05);
    const eyeSpread = r * 0.32;
    const eyeFwd = r * 0.38;
    const eyeR = r * 0.18;
    const pupR = r * 0.09;
    
    [[-eyeSpread], [eyeSpread]].forEach(([ey]) => {
      ctxPrv.beginPath();
      ctxPrv.arc(eyeFwd, ey, eyeR, 0, Math.PI * 2);
      ctxPrv.fillStyle = '#fff';
      ctxPrv.fill();
      ctxPrv.strokeStyle = skin.outline;
      ctxPrv.lineWidth = 1.5;
      ctxPrv.stroke();
      
      ctxPrv.beginPath();
      ctxPrv.arc(eyeFwd + 1.5, ey, pupR, 0, Math.PI * 2);
      ctxPrv.fillStyle = skin.eye;
      ctxPrv.fill();
      
      ctxPrv.beginPath();
      ctxPrv.arc(eyeFwd + pupR * 0.4, ey - pupR * 0.5, pupR * 0.4, 0, Math.PI * 2);
      ctxPrv.fillStyle = 'rgba(255,255,255,0.8)';
      ctxPrv.fill();
    });
    ctxPrv.restore();
    
    ctxPrv.restore(); // waddle/scale/translate character
    ctxPrv.restore(); // central canvas translate
    
    homepagePreviewAnimationId = requestAnimationFrame(drawFrame);
  }
  
  homepagePreviewAnimationId = requestAnimationFrame(drawFrame);
};
const hpBarFill      = document.getElementById('hpBarFill');
const xpBarFill      = document.getElementById('xpBarFill');
const skillCdOverlay = document.getElementById('skillCdOverlay');

// ── Game State ────────────────────────────────────────────────
let mapSize    = 3600;
let myId       = null;
let serverPlayers    = {};
let currentPlayers   = {};
let serverProjectiles= [];
let serverItems      = [];
let serverHazards    = [];
let camera   = { x: 1800, y: 1800 };
let clientGrass   = [];
let clientSpeedPads = [];
let gameStartTime = Date.now();
let screenShake   = 0;
let joystickActive= false;
let joyCentre  = { x: 0, y: 0 };
let lastPingTime = 0;
let pingMs       = 0;
let lastMatchTime= 300;
let timeWarpActive = false;

// ── Particle System ───────────────────────────────────────────
let particles = [];
let MAX_PARTICLES = 500;

// ── Combat Slash System ───────────────────────────────────────
let slashEffects = []; // { x, y, angle, r, alpha, color, time }

// ── Map Decorations ───────────────────────────────────────────
const MAP_DECO = [];
function seedDecorations() {
  MAP_DECO.length = 0;
  const types = ['tree','tree','tree','rock','rock','crate','barricade'];
  const rng = s => { const x = Math.sin(s)*43758.5453; return x - Math.floor(x); };
  const count = Math.floor((mapSize * mapSize) / 100000);
  for (let i = 0; i < count; i++) {
    const x = rng(i*2.1)*(mapSize-300)+150;
    const y = rng(i*3.7)*(mapSize-300)+150;
    if (Math.hypot(x-mapSize/2,y-mapSize/2) < 300) continue;
    MAP_DECO.push({
      x, y,
      type: types[Math.floor(rng(i*5.3)*types.length)],
      size: rng(i*7.1)*20+22,
      variant: Math.floor(rng(i*11.3)*3),
      angle: rng(i*13.7)*Math.PI*2
    });
  }
}
seedDecorations();

// ── Evolution Skins (10 stages) ───────────────────────────────
const SKINS = {
  1:  { name:'Blobby',    body1:'#4ade80', body2:'#15803d', bodyHL:'#bbf7d0', eye:'#166534', outline:'#052e16', aura:null,    skinType:'leaf',      skill:'Dash'           },
  2:  { name:'Brawler',   body1:'#38bdf8', body2:'#0369a1', bodyHL:'#bae6fd', eye:'#075985', outline:'#082f49', aura:'#22d3ee',skinType:'horns',    skill:'Dash+'          },
  3:  { name:'Knight',    body1:'#f472b6', body2:'#9d174d', bodyHL:'#fbcfe8', eye:'#831843', outline:'#500724', aura:'#38bdf8',skinType:'neko',     skill:'Aegis Shield'   },
  4:  { name:'Champion',  body1:'#ef4444', body2:'#7f1d1d', bodyHL:'#fecaca', eye:'#450a0a', outline:'#1c0303', aura:'#f97316',skinType:'panda',    skill:'Ground Slam'    },
  5:  { name:'Hunter',    body1:'#a855f7', body2:'#3b0764', bodyHL:'#d8b4fe', eye:'#c026d3', outline:'#1a0030', aura:'#7c3aed',skinType:'demon',    skill:'Chain Lightning' },
  6:  { name:'Boss King', body1:'#fbbf24', body2:'#92400e', bodyHL:'#fef08a', eye:'#451a03', outline:'#1c0a00', aura:'#f97316',skinType:'boss',     skill:'Dragon Breath'  },
  7:  { name:'Dragon',    body1:'#f97316', body2:'#431407', bodyHL:'#fed7aa', eye:'#7c2d12', outline:'#1c0a00', aura:'#dc2626',skinType:'dragon',   skill:'Firestorm'      },
  8:  { name:'Shadow',    body1:'#1e1b4b', body2:'#0f0e26', bodyHL:'#4c1d95', eye:'#c084fc', outline:'#000000', aura:'#6d28d9',skinType:'shadow',   skill:'Shadow Blink'   },
  9:  { name:'Celestial', body1:'#e0e7ff', body2:'#6366f1', bodyHL:'#ffffff', eye:'#312e81', outline:'#1e1b4b', aura:'#818cf8',skinType:'celestial',skill:'Celestial Nova' },
  10: { name:'Omega',     body1:'#ffffff', body2:'#d1d5db', bodyHL:'#ffffff', eye:'#000000', outline:'#1f2937', aura:'#fbbf24',skinType:'omega',    skill:'Annihilation'   }
};

const BRANCH_SKINS = {
  assassin: {
    5:  { name:'Rogue',         body1:'#059669', body2:'#047857', bodyHL:'#a7f3d0', eye:'#c084fc', outline:'#064e3b', aura:'#a855f7', skinType:'leaf',       skill:'Shadow Dash'    },
    6:  { name:'Shinobi',       body1:'#8b5cf6', body2:'#5b21b6', bodyHL:'#ddd6fe', eye:'#22d3ee', outline:'#2e1065', aura:'#a855f7', skinType:'horns',      skill:'Vanish'         },
    7:  { name:'Nightshade',    body1:'#312e81', body2:'#1e1b4b', bodyHL:'#c7d2fe', eye:'#4ade80', outline:'#000000', aura:'#10b981', skinType:'demon',      skill:'Smoke Bomb'     },
    8:  { name:'Shadow Reaper', body1:'#0f172a', body2:'#020617', bodyHL:'#334155', eye:'#a855f7', outline:'#000000', aura:'#6d28d9', skinType:'shadow',     skill:'Reaper Mark'    },
    9:  { name:'Void Stalker',  body1:'#1e1b4b', body2:'#090514', bodyHL:'#3b0764', eye:'#ec4899', outline:'#000000', aura:'#db2777', skinType:'celestial',  skill:'Void Shift'     },
    10: { name:'Specter Lord',  body1:'#00f2fe', body2:'#4facfe', bodyHL:'#e0f2fe', eye:'#ffffff', outline:'#000000', aura:'#a855f7', skinType:'omega',      skill:'Specter Army'   }
  },
  fighter: {
    5:  { name:'Vanguard',      body1:'#cbd5e1', body2:'#64748b', bodyHL:'#f1f5f9', eye:'#38bdf8', outline:'#334155', aura:'#38bdf8', skinType:'neko',      skill:'Shield Charge'  },
    6:  { name:'Berserker',     body1:'#ef4444', body2:'#7f1d1d', bodyHL:'#fecaca', eye:'#fbbf24', outline:'#450a0a', aura:'#f97316', skinType:'horns',      skill:'Blood Rage'     },
    7:  { name:'Colossus',      body1:'#4b5563', body2:'#1f2937', bodyHL:'#9ca3af', eye:'#fbbf24', outline:'#111827', aura:'#fbbf24', skinType:'demon',      skill:'Ground Slam'    },
    8:  { name:'Warlord',       body1:'#fbbf24', body2:'#92400e', bodyHL:'#fef08a', eye:'#ef4444', outline:'#451a03', aura:'#fbbf24', skinType:'boss',       skill:'Warlord Cry'    },
    9:  { name:'Juggernaut',    body1:'#0f172a', body2:'#1a0d00', bodyHL:'#334155', eye:'#f97316', outline:'#000000', aura:'#f97316', skinType:'shadow',     skill:'Aegis Shield'   },
    10: { name:'Immortal Titan',body1:'#fffbeb', body2:'#fbbf24', bodyHL:'#ffffff', eye:'#ffffff', outline:'#78350f', aura:'#fbbf24', skinType:'omega',      skill:'Immortal Bastion'}
  },
  mage: {
    5:  { name:'Adept',         body1:'#c084fc', body2:'#6b21a8', bodyHL:'#e9d5ff', eye:'#e9d5ff', outline:'#3b0764', aura:'#8b5cf6', skinType:'leaf',       skill:'Magic Barrier'  },
    6:  { name:'Pyromancer',    body1:'#f97316', body2:'#9a3412', bodyHL:'#fed7aa', eye:'#fde047', outline:'#431407', aura:'#ef4444', skinType:'horns',      skill:'Firestorm'      },
    7:  { name:'Cryomancer',    body1:'#93c5fd', body2:'#1d4ed8', bodyHL:'#dbeafe', eye:'#e0f2fe', outline:'#1e3a8a', aura:'#38bdf8', skinType:'neko',       skill:'Frost Nova'     },
    8:  { name:'Electromancer', body1:'#fef08a', body2:'#ca8a04', bodyHL:'#fef9c3', eye:'#38bdf8', outline:'#422006', aura:'#eab308', skinType:'demon',      skill:'Chain Lightning'},
    9:  { name:'Archmage',      body1:'#818cf8', body2:'#3730a3', bodyHL:'#c7d2fe', eye:'#ffffff', outline:'#1e1b4b', aura:'#a5b4fc', skinType:'celestial',  skill:'Celestial Nova' },
    10: { name:'Chrono Lord',   body1:'#fef08a', body2:'#854d0e', bodyHL:'#fef9c3', eye:'#000000', outline:'#422006', aura:'#fbbf24', skinType:'omega',      skill:'Time Warp'      }
  }
};

const ITEM_META = {
  potion:'🧪', boot:'👟', shield_item:'🛡️', bomb_item:'💣',
  trap_item:'🕸️', net_item:'🔗', missile_item:'🚀', rage_item:'😡',
  lightning_item:'⚡'
};

// ── Canvas Resize ─────────────────────────────────────────────
function resizeCanvas() { 
  // Use visualViewport when available for correct height on mobile Safari/Chrome
  const vvp = window.visualViewport;
  canvas.width  = vvp ? vvp.width  : window.innerWidth;
  canvas.height = vvp ? vvp.height : window.innerHeight;
  
  const isTouch = window.isTouchDevice;
  if (isTouch || canvas.width <= 950) {
    cameraZoom = 0.72;       // Zoom camera out slightly further on mobile for optimal battle vision
    MAX_PARTICLES = 120;     // Lower particle ceiling on mobile to prevent GPU/CPU overload
    enableShadows = false;   // Strictly disable all canvas shadows on all mobile/tablet touch devices!
  } else {
    cameraZoom = 1.0;
    MAX_PARTICLES = 500;     // Standard particle ceiling on desktop
    enableShadows = true;    // Enable canvas shadows on desktop for rich visual glow
  }

  if (isTouch) {
    document.body.classList.add('is-mobile');
  } else {
    document.body.classList.remove('is-mobile');
  }
}
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resizeCanvas);
} else {
  window.addEventListener('resize', resizeCanvas);
}
resizeCanvas();

// ══════════════════════════════════════════════════════════════
//  WEBSOCKET
// ══════════════════════════════════════════════════════════════
function setupSocket() {
  const protocol  = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  socket = new WebSocket(`${protocol}//${window.location.host}`);
  socket.onopen = () => {
    document.getElementById('connectingOverlay').style.opacity = '0';
    setTimeout(() => document.getElementById('connectingOverlay').style.display = 'none', 500);
    loginScreen.classList.remove('hidden');
    // Ping tracking
    lastPingTime = performance.now();
    socket.send(JSON.stringify({ type: 'ping' }));
  };

  socket.onmessage = ev => {
    const d = JSON.parse(ev.data);

    if (d.type === 'pong') {
      pingMs = Math.round(performance.now() - lastPingTime);
      if (pingText) pingText.textContent = pingMs + 'ms';
      if (pingText) pingText.style.color = pingMs < 50 ? '#22c55e' : pingMs < 120 ? '#eab308' : '#ef4444';
      setTimeout(() => {
        if (socket.readyState === WebSocket.OPEN) {
          lastPingTime = performance.now();
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 2000);
      return;
    }

    if (d.type === 'init') {
      myId = d.id;
      window.isSelectingPerk = false;
      window.isSelectingBranch = false;
      mapSize = d.mapSize;
      serverItems = d.items || [];
      serverHazards = d.hazards || [];
      gameStartTime = Date.now();
      seedDecorations();
      if (loginScreen) loginScreen.classList.add('hidden');
      if (gameOverScreen) gameOverScreen.classList.add('hidden');
      if (hud) hud.classList.remove('hidden'); // Show HUD at start
      if (mjOverlay && window.isTouchDevice) mjOverlay.classList.remove('hidden');
      camera = { x: mapSize / 2, y: mapSize / 2 };
      clientGrass = d.grass || [];
      clientSpeedPads = d.speedPads || [];
      // Hide lang toggle and mouse cursor style during game
      if (langToggleEl) langToggleEl.style.display = 'none';
    }
    else if (d.type === 'state') {
      timeWarpActive = d.tw || false;
      // Set id on each player object from key
      Object.keys(d.players).forEach(id => { d.players[id].id = id; });
      // Compute radius from level
      Object.values(d.players).forEach(sp => { sp.radius = EVO_RADIUS[sp.lvl] || 20; });

      // Merge serverPlayers to avoid 1-frame blank (fix flicker)
      const incoming = d.players;
      // Remove players no longer in game
      Object.keys(serverPlayers).forEach(id => { if (!incoming[id]) delete serverPlayers[id]; });
      // Merge each player's data using Object.assign to preserve offscreen details when basic data is sent
      Object.keys(incoming).forEach(id => {
        if (!serverPlayers[id]) {
          serverPlayers[id] = incoming[id];
        } else {
          // Explicitly clear/set stealth status to prevent stuck stealth when leaving grass
          serverPlayers[id].stealth = !!incoming[id].stealth;
          Object.assign(serverPlayers[id], incoming[id]);
        }

        const cp = currentPlayers[id];
        if (cp) {
          const chatRaw = incoming[id].chat;
          let chatText = chatRaw;
          if (chatRaw && I18N[currentLang] && I18N[currentLang].bot_chat && I18N[currentLang].bot_chat[chatRaw]) {
            chatText = I18N[currentLang].bot_chat[chatRaw];
          }
          if (chatRaw && cp.chatTextRaw !== chatRaw) {
            cp.chatTTL = 150;
            cp.chatTextRaw = chatRaw;
          }
          cp.chatText = chatText;
          cp.emote = incoming[id].emote;
        }
      });
      serverProjectiles = d.projectiles;

      hudAliveCount.textContent = d.livingCount;
      if (lobbyCount) lobbyCount.textContent = d.livingCount;

      // Match timer
      if (d.matchTime !== undefined) {
        lastMatchTime = d.matchTime;
        const mm = Math.floor(d.matchTime / 60);
        const ss = String(d.matchTime % 60).padStart(2, '0');
        if (hudMatchTimer) hudMatchTimer.textContent = `${mm}:${ss}`;
      }

      if (d.leaderboard) updateLeaderboard(d.leaderboard);
      if (d.killFeed) updateKillFeed(d.killFeed);

      // Interpolation init
      Object.keys(d.players).forEach(id => {
        if (!currentPlayers[id]) {
          currentPlayers[id] = { x: d.players[id].x, y: d.players[id].y, a: d.players[id].a, lastHit: 0 };
        }
      });
      Object.keys(currentPlayers).forEach(id => { if (!d.players[id]) delete currentPlayers[id]; });

      // My HUD
      if (serverPlayers[myId]) syncMyHUD(serverPlayers[myId]);

      // Stopwatch
      const elap = Math.floor((Date.now() - gameStartTime) / 1000);
      if (hudStopwatch) hudStopwatch.textContent = `${Math.floor(elap/60)}:${String(elap%60).padStart(2,'0')}`;
    }
    else if (d.type === 'hit_effect') {
      screenShake = 0; // vibration disabled to prevent dizziness
      emitSparks(d.x, d.y, '#fca5a5', 14, 6);
      emitFloatingDamage(d.x, d.y, d.damage);
      if (currentPlayers[d.victimId]) currentPlayers[d.victimId].lastHit = Date.now();
    }
    else if (d.type === 'heal_effect') {
      const sp = serverPlayers[d.playerId];
      if (sp) emitHealOrbs(sp.x, sp.y);
    }
    else if (d.type === 'shockwave_effect') {
      emitShockwave(d.x, d.y, d.radius, d.color);
      if (['#f87171','#f59e0b','#f97316'].includes(d.color)) {
        emitBoom(d.x, d.y, d.radius);
        screenShake = 0;
      }
      // Unique class-specific particle bursts based on skill shockwave colors
      if (d.color === '#38bdf8') {
        // Mage Ice/Barrier: light-blue ice fragments
        for (let i = 0; i < 15; i++) {
          const a = Math.random() * Math.PI * 2, spd = Math.random() * 4 + 2;
          addParticle({ type: 'spark', x: d.x, y: d.y, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd, color: '#e0f7fa', r: 4, alpha: 1, decay: 0.04 });
        }
      }
      else if (d.color === '#a855f7' || d.color === '#6d28d9') {
        // Assassin Shadow/Void: dark purple shadow specs
        for (let i = 0; i < 18; i++) {
          const a = Math.random() * Math.PI * 2, spd = Math.random() * 5 + 3;
          addParticle({ type: 'spark', x: d.x, y: d.y, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd, color: '#d946ef', r: 3.5, alpha: 0.9, decay: 0.035 });
        }
      }
      else if (d.color === '#f59e0b' || d.color === '#fbbf24') {
        // Fighter Ground/Titan Slam: heavy gold spark shards
        for (let i = 0; i < 20; i++) {
          const a = Math.random() * Math.PI * 2, spd = Math.random() * 6 + 4;
          addParticle({ type: 'spark', x: d.x, y: d.y, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd, color: '#fbbf24', r: 5, alpha: 1, decay: 0.03 });
        }
      }
    }
    else if (d.type === 'lightning_effect') { emitLightning(d.path, d.color, d.glow); }
    else if (d.type === 'dash_effect')      { emitDashBurst(d.x, d.y, d.angle); }
    else if (d.type === 'blink_effect')     { emitBlinkTrail(d.fromX, d.fromY, d.toX, d.toY); }
    else if (d.type === 'level_up_effect')  {
      const sp = serverPlayers[d.playerId] || currentPlayers[d.playerId];
      if (sp) emitLevelUpBurst(sp.x, sp.y, d.level);
    }
    else if (d.type === 'death_effect') {
      emitDeathExplosion(d.x, d.y, d.level, d.color);
      if (d.chat) {
        let chatText = d.chat;
        if (I18N[currentLang] && I18N[currentLang].bot_chat && I18N[currentLang].bot_chat[d.chat]) {
          chatText = I18N[currentLang].bot_chat[d.chat];
        }
        addParticle({
          type: 'death_chat',
          x: d.x,
          y: d.y - (EVO_RADIUS[d.level] || 20) - 10,
          text: chatText,
          emote: d.emote,
          alpha: 1.0,
          decay: 0.008, // fades out after ~120 frames (2.4s)
          vy: -0.2 // floats up slowly
        });
      }
    }
    else if (d.type === 'announcement') { showAnnouncement(d.text); }
    else if (d.type === 'item_obtained') {
      showAnnouncement(`✨ Got: ${ITEM_META[d.item] || '?'} ${d.item.replace(/_/g,' ')}!`);
      emitPickupBurst(serverPlayers[myId]?.x ?? 0, serverPlayers[myId]?.y ?? 0);
    }
    else if (d.type === 'add_item') {
      serverItems.push(d.item);
    }
    else if (d.type === 'remove_item') {
      serverItems = serverItems.filter(it => it.id !== d.id);
    }
    else if (d.type === 'add_hazard') {
      serverHazards.push(d.hazard);
    }
    else if (d.type === 'remove_hazard') {
      serverHazards = serverHazards.filter(hz => hz.id !== d.id);
    }
    else if (d.type === 'evolution_choice') {
      console.log("Evolution choice received");
      window.showEvolutionChoiceModal();
    }
    else if (d.type === 'perk_choice') {
      console.log("Perk choice received:", d.choices);
      window.showPerkChoiceModal(d.choices, d.timeout ? d.timeout / 1000 : 10);
    }
    else if (d.type === 'close_modals') {
      console.log("close_modals received (Auto-selection completed on server)");
      window.isSelectingPerk = false;
      window.isSelectingBranch = false;
      const evoModal = document.getElementById('evolutionChoiceModal');
      if (evoModal) evoModal.classList.add('hidden');
      const perkModal = document.getElementById('perkChoiceModal');
      if (perkModal) {
        perkModal.classList.add('hidden');
        perkModal.style.cssText = '';
      }
      
      if (window.evoInterval) { clearInterval(window.evoInterval); window.evoInterval = null; }
      const evoCd = document.getElementById('evoCountdown');
      if (evoCd) evoCd.textContent = '';
      
      if (window.perkInterval) { clearInterval(window.perkInterval); window.perkInterval = null; }
      const perkCd = document.getElementById('perkCountdown');
      if (perkCd) perkCd.textContent = '';
      
      window.stopBranchPreviews(); // stop drawing loop
      
      // Ensure HUD and Joystick are visible
      hud.classList.remove('hidden');
      if (window.isTouchDevice) mjOverlay.classList.remove('hidden');
    }
    else if (d.type === 'death') {
      window.isSelectingPerk = false;
      window.isSelectingBranch = false;
      // ─── CRITICAL: clear myId immediately so state updates never call syncMyHUD ───
      myId = null;
      if (hud) hud.classList.add('hidden');
      if (mjOverlay) mjOverlay.classList.add('hidden');
      
      // Close selection modals on death
      const evoModal = document.getElementById('evolutionChoiceModal');
      if (evoModal) evoModal.classList.add('hidden');
      const perkModal = document.getElementById('perkChoiceModal');
      if (perkModal) {
        perkModal.classList.add('hidden');
        perkModal.style.cssText = '';
      }
      
      if (window.evoInterval) { clearInterval(window.evoInterval); window.evoInterval = null; }
      const evoCd = document.getElementById('evoCountdown');
      if (evoCd) evoCd.textContent = '';
      
      if (window.perkInterval) { clearInterval(window.perkInterval); window.perkInterval = null; }
      const perkCd = document.getElementById('perkCountdown');
      if (perkCd) perkCd.textContent = '';
      
      if (typeof window.stopBranchPreviews === 'function') window.stopBranchPreviews();

      if (statTime)      statTime.textContent      = `${d.survivalTime}s`;
      if (statRank)      statRank.textContent      = `#${d.rank}`;
      if (statScore)     statScore.textContent      = d.score;
      if (statKills)     statKills.textContent      = d.kills;
      if (statEvolution) statEvolution.textContent  = `${d.evolution} (Lv.${d.level ?? '?'})`;
      
      const langObj = I18N[currentLang] || I18N['vi'];
      if (statKilledBy)  statKilledBy.textContent   = `${langObj.killed_by}${d.killedBy || langObj.environment}`;
      
      // Show game over screen with a short delay to allow death VFX to play first
      setTimeout(() => {
        if (hud) hud.classList.add('hidden');
        if (gameOverScreen) gameOverScreen.classList.remove('hidden');
        // Restore langToggle on game over screen
        if (langToggleEl) langToggleEl.style.display = '';
      }, 350);
    }
  };

  socket.onclose = () => {
    document.getElementById('connectingOverlay').style.display = 'flex';
    document.getElementById('connectingOverlay').style.opacity = '1';
    document.getElementById('connectingText').textContent = 'Mất kết nối tới máy chủ. Đang thử lại...';
    document.getElementById('connectingText').style.color = '#fca5a5';
    setTimeout(setupSocket, 3000);
  };
  socket.onerror = () => {
    document.getElementById('connectingText').textContent = 'Lỗi kết nối!';
    document.getElementById('connectingText').style.color = '#ef4444';
  };
}
setupSocket();

// ══════════════════════════════════════════════════════════════
//  CONTROLS
// ══════════════════════════════════════════════════════════════
const btnSwitchItem = document.getElementById('btnSwitchItem');
const lbToggleBtn   = document.getElementById('lbToggleBtn');
const leaderboardEl = document.getElementById('leaderboard');
const langToggleEl  = document.getElementById('langToggle');

// ── Mouse state ────────────────────────────────────────────────
let mouseDown = false;       // left button held — continuous attack
let rightMouseDown = false;  // right button held
let mouseX = 0, mouseY = 0;
let lastAttackTime = 0;
const ATTACK_INTERVAL = 150; // ms between auto-attacks when holding LMB

const keys = {};
window.addEventListener('keydown', e => {
  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.isContentEditable)) {
    return;
  }
  const perkModal = document.getElementById('perkChoiceModal');
  const evoModal = document.getElementById('evolutionChoiceModal');
  if ((perkModal && !perkModal.classList.contains('hidden')) || (evoModal && !evoModal.classList.contains('hidden'))) {
    return;
  }
  keys[e.code] = true;
  if (e.code === 'KeyE')  { 
    e.preventDefault(); 
    socket.send(JSON.stringify({ type:'skill' })); 
    if (myId && currentPlayers[myId]) {
      const now = Date.now();
      currentPlayers[myId].attackAnim = { t: now, duration: 200 };
      currentPlayers[myId].lastAttackAnimTime = now;
    }
  }
  if (e.code === 'KeyF') {
    const tx = (mouseX - canvas.width/2)/cameraZoom + camera.x;
    const ty = (mouseY - canvas.height/2)/cameraZoom + camera.y;
    socket.send(JSON.stringify({ type:'use_item', tx, ty }));
  }
  if (e.code === 'KeyQ')  socket.send(JSON.stringify({ type:'switch_item' }));
  if (e.code === 'KeyP')  { console.log("Force-triggering Perk Choice Modal (Debug)"); window.showPerkChoiceModal(['speed_boost', 'attack_dmg_boost', 'max_hp_boost']); }
  if (e.code === 'KeyO')  { console.log("Force-triggering Evolution Choice Modal (Debug)"); window.showEvolutionChoiceModal(); }
  if (e.code === 'Tab')   { e.preventDefault(); leaderboardEl?.classList.toggle('hidden'); }
  if (e.code === 'Space' || e.key === ' ' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') { e.preventDefault(); socket.send(JSON.stringify({ type:'dash' })); }
  if (['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6'].includes(e.code)) {
    const idx = parseInt(e.code.replace('Digit','')) - 1;
    socket.send(JSON.stringify({ type:'select_item', index: idx }));
  }
});
window.addEventListener('keyup', e => { 
  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.isContentEditable)) {
    return;
  }
  keys[e.code] = false; 
});

// ── Mouse controls ─────────────────────────────────────────────
// Left click = single attack; hold = rapid fire
// Left click = single attack; hold = rapid fire
let lastLeftClickTime = 0;
canvas.addEventListener('mousedown', e => {
  const perkModal = document.getElementById('perkChoiceModal');
  const evoModal = document.getElementById('evolutionChoiceModal');
  if ((perkModal && !perkModal.classList.contains('hidden')) || (evoModal && !evoModal.classList.contains('hidden'))) {
    return;
  }
  if (!mjOverlay.classList.contains('hidden')) return;
  if (e.button === 0) {
    mouseDown = true;
    mouseX = e.clientX; mouseY = e.clientY;
    
    const now = Date.now();
    let isDoubleClick = false;
    if (now - lastLeftClickTime < 300) {
      isDoubleClick = true;
      socket.send(JSON.stringify({ type:'dash' }));
    }
    lastLeftClickTime = now;

    if (!isDoubleClick) {
      // Immediate attack on click (only if not a double-click dash)
      socket.send(JSON.stringify({ type:'skill' }));
      lastAttackTime = now;
      if (myId && currentPlayers[myId]) {
        currentPlayers[myId].attackAnim = { t: now, duration: 200 };
        currentPlayers[myId].lastAttackAnimTime = now;
      }
    }
  }
  if (e.button === 2) {
    rightMouseDown = true;
    // Right click = use item
    const tx = (mouseX - canvas.width/2)/cameraZoom + camera.x;
    const ty = (mouseY - canvas.height/2)/cameraZoom + camera.y;
    socket.send(JSON.stringify({ type:'use_item', tx, ty }));
  }
});
canvas.addEventListener('mousemove', e => { 
  if (!mjOverlay.classList.contains('hidden')) return;
  mouseX = e.clientX; mouseY = e.clientY; 
});
canvas.addEventListener('mouseup', e => {
  if (!mjOverlay.classList.contains('hidden')) return;
  if (e.button === 0) mouseDown = false;
  if (e.button === 2) rightMouseDown = false;
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Scroll wheel = switch item
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  socket.send(JSON.stringify({ type: 'switch_item' }));
}, { passive: false });

// ── Mobile button bindings (Lag-free Touchstart + Correct Aiming + Double-Fire Protection) ──────
let lastTouchTime = 0;
window.addEventListener('touchstart', () => { lastTouchTime = Date.now(); }, { capture: true, passive: true });

const handleMobileSkill = e => {
  if (e && e.cancelable) e.preventDefault();
  if (e && e.type === 'click' && Date.now() - lastTouchTime < 800) return;
  socket.send(JSON.stringify({ type:'skill' }));
  if (myId && currentPlayers[myId]) {
    const now = Date.now();
    currentPlayers[myId].attackAnim = { t: now, duration: 200 };
    currentPlayers[myId].lastAttackAnimTime = now;
  }
};
const handleMobileDash = e => {
  if (e && e.cancelable) e.preventDefault();
  if (e && e.type === 'click' && Date.now() - lastTouchTime < 800) return;
  socket.send(JSON.stringify({ type:'dash' }));
};
const handleMobileUseItem = e => {
  if (e && e.cancelable) e.preventDefault();
  if (e && e.type === 'click' && Date.now() - lastTouchTime < 800) return;
  const me = currentPlayers[myId] || serverPlayers[myId];
  let tx = camera.x;
  let ty = camera.y;
  if (me) {
    // Aim items 150px in the direction the character is currently facing
    tx = me.x + Math.cos(me.a) * 150;
    ty = me.y + Math.sin(me.a) * 150;
  } else {
    tx = (mouseX - canvas.width/2)/cameraZoom + camera.x;
    ty = (mouseY - canvas.height/2)/cameraZoom + camera.y;
  }
  socket.send(JSON.stringify({ type:'use_item', tx, ty }));
};
const handleMobileSwitch = e => {
  if (e && e.cancelable) e.preventDefault();
  if (e && e.type === 'click' && Date.now() - lastTouchTime < 800) return;
  socket.send(JSON.stringify({ type:'switch_item' }));
};

// Bind touchstart and click to the protected handlers for instant response without double-firing
btnAttack.addEventListener('touchstart', handleMobileSkill, { passive: false });
btnAttack.addEventListener('click', handleMobileSkill);

if (btnDash) {
  btnDash.addEventListener('touchstart', handleMobileDash, { passive: false });
  btnDash.addEventListener('click', handleMobileDash);
}

btnUseItem.addEventListener('touchstart', handleMobileUseItem, { passive: false });
btnUseItem.addEventListener('click', handleMobileUseItem);

if (btnSwitchItem) {
  btnSwitchItem.addEventListener('touchstart', handleMobileSwitch, { passive: false });
  btnSwitchItem.addEventListener('click', handleMobileSwitch);
}

if (lbToggleBtn) {
  lbToggleBtn.addEventListener('touchstart', e => { if (e.cancelable) e.preventDefault(); leaderboardEl?.classList.toggle('hidden'); }, { passive: false });
  lbToggleBtn.addEventListener('click', () => leaderboardEl?.classList.toggle('hidden'));
}

// ── Touch Joystick ─────────────────────────────────────────────
joyZone?.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.touches[0];
  const r = joyBase.getBoundingClientRect();
  joyCentre = { x: r.left + r.width/2, y: r.top + r.height/2 };
  joystickActive = true; moveJoy(t.clientX, t.clientY);
}, { passive: false });
joyZone?.addEventListener('touchmove', e => { e.preventDefault(); if (joystickActive) moveJoy(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
joyZone?.addEventListener('touchend',  e => { e.preventDefault(); joystickActive = false; joyStick.style.transform = 'translate(-50%,-50%)'; sendDir(0,0); });
function moveJoy(cx, cy) {
  const dx = cx - joyCentre.x, dy = cy - joyCentre.y;
  const dist = Math.hypot(dx, dy), max = 48;
  joyStick.style.transform = `translate(calc(-50% + ${dist>max?dx/dist*max:dx}px), calc(-50% + ${dist>max?dy/dist*max:dy}px))`;
  sendDir(dx, dy);
}
let _lastA = 0, _lastM = 0;
function sendDir(dx, dy) {
  if (socket.readyState !== WebSocket.OPEN) return;
  const a = Math.atan2(dy, dx), m = Math.hypot(dx,dy)>0.05?1:0;
  if (Math.abs(a-_lastA)>0.03 || m!==_lastM) { socket.send(JSON.stringify({type:'control',dx,dy})); _lastA=a; _lastM=m; }
}

// ── processInput — character auto-follows mouse + WASD ─────────
function processInput() {
  const perkModal = document.getElementById('perkChoiceModal');
  const evoModal = document.getElementById('evolutionChoiceModal');
  if ((perkModal && !perkModal.classList.contains('hidden')) || (evoModal && !evoModal.classList.contains('hidden'))) {
    sendDir(0, 0);
    return;
  }
  if (joystickActive) return;
  let dx = 0, dy = 0;
  // WASD/Arrow priority
  if (keys['KeyW']||keys['ArrowUp'])    dy -= 1;
  if (keys['KeyS']||keys['ArrowDown'])  dy += 1;
  if (keys['KeyA']||keys['ArrowLeft'])  dx -= 1;
  if (keys['KeyD']||keys['ArrowRight']) dx += 1;
  
  // If no WASD pressed → auto-follow mouse cursor direction from center (Desktop only)
  if (!dx && !dy && canvas.width > 950) {
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const mdx = mouseX - cx, mdy = mouseY - cy;
    const dist = Math.hypot(mdx, mdy);
    // Only move if mouse is at least 30px away from center
    if (dist > 30) { dx = mdx; dy = mdy; }
  }
  
  sendDir(dx, dy);
  
  // Rapid fire while holding left mouse button
  if (mouseDown) {
    const now = Date.now();
    if (now - lastAttackTime > ATTACK_INTERVAL) {
      socket.send(JSON.stringify({ type:'skill' }));
      lastAttackTime = now;
    }
  }
}

joinButton.addEventListener('click', async () => {
  window.isSelectingPerk = false;
  window.isSelectingBranch = false;
  const name = playerNameInput.value.trim() || 'Angel';
  socket.send(JSON.stringify({ 
    type: 'join', 
    name,
    perk: window.selectedHomepagePerk,
    branch: window.selectedHomepageBranch
  }));
  
  // Force landscape on mobile devices
  if (typeof document.documentElement.requestFullscreen === 'function' && window.innerWidth < 800) {
    try {
      await document.documentElement.requestFullscreen();
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock("landscape");
      }
    } catch (err) {
      console.log("Orientation lock failed:", err);
    }
  }
});
playerNameInput.addEventListener('keypress', e => { if (e.key==='Enter') joinButton.click(); });
respawnButton?.addEventListener('click', () => {
  myId = null;
  window.isSelectingPerk = false;
  window.isSelectingBranch = false;
  if (gameOverScreen) gameOverScreen.classList.add('hidden');
  if (hud) hud.classList.add('hidden');
  socket.send(JSON.stringify({ 
    type: 'join', 
    name: playerNameInput.value.trim()||'Angel',
    perk: window.selectedHomepagePerk,
    branch: window.selectedHomepageBranch
  }));
});

// ══════════════════════════════════════════════════════════════
//  HUD SYNC
// ══════════════════════════════════════════════════════════════
function syncMyHUD(me) {
  // HP bar
  if (hpBarFill) hpBarFill.style.width = `${Math.max(0, (me.hp/me.mhp)*100)}%`;
  // XP bar
  if (xpBarFill && me.nxp > 0) xpBarFill.style.width = `${Math.max(0, Math.min(100, (me.exp/me.nxp)*100))}%`;
  // Item button icon + inventory count badge
  const icon  = btnUseItem?.querySelector('.icon-wrap');
  const badge = document.getElementById('inventoryCountBadge');
  const cdOv  = btnUseItem?.querySelector('.cd-overlay');
  
  if (icon)  icon.textContent  = me.itm ? (ITEM_META[me.itm] || '?') : '👟';
  if (badge) badge.textContent = me.inv ? me.inv.length : 0;
  if (cdOv)  cdOv.style.height = me.scd > 0 ? `${(me.scd/me.scdm)*100}%` : '0%';
  
  // Update Hotbar
  const inventory = me.inv || [];
  const activeIdx = me.invIdx || 0;
  hotbarSlots.forEach((slot, idx) => {
    if (idx < inventory.length) {
      slot.style.display = 'flex';
      const slotIcon = slot.querySelector('.slot-icon');
      if (slotIcon) slotIcon.textContent = ITEM_META[inventory[idx]] || '?';
      if (idx === activeIdx) {
        slot.classList.add('active');
        slot.style.border = '2px solid #38bdf8';
        slot.style.boxShadow = '0 0 10px #38bdf8';
      } else {
        slot.classList.remove('active');
        slot.style.border = '2px solid rgba(255,255,255,0.1)';
        slot.style.boxShadow = 'none';
      }
      
      // Add click listener if not already added
      if (!slot.dataset.clickBound) {
        slot.addEventListener('click', () => {
          socket.send(JSON.stringify({ type: 'select_item', index: idx }));
        });
        slot.dataset.clickBound = true;
      }
    } else {
      slot.style.display = 'none';
    }
  });
  
  // Skill button cooldown
  if (skillCdOverlay) skillCdOverlay.style.height = me.scd > 0 ? `${(me.scd/me.scdm)*100}%` : '0%';
  const cdDashOv = btnDash?.querySelector('.cd-overlay');
  if (cdDashOv) cdDashOv.style.height = me.dcd > 0 ? `${(me.dcd/3000)*100}%` : '0%';

  // Update Perks Indicators (selected cards)
  const perksPanel = document.getElementById('perksIndicatorPanel');
  if (perksPanel) {
    const perks = me.prks || [];
    if (perks.length > 0) {
      perksPanel.style.display = 'flex';
      
      const counts = {};
      perks.forEach(p => { counts[p] = (counts[p] || 0) + 1; });
      
      const perkMap = {
        speed_boost: { icon: '⚡', name: 'Swift Foot', class: 'speed_boost' },
        heal_boost: { icon: '🧪', name: 'Vigor Brew', class: 'heal_boost' },
        bomb_boost: { icon: '💣', name: 'Demolition', class: 'bomb_boost' },
        max_hp_boost: { icon: '🛡️', name: 'Iron Will', class: 'max_hp_boost' },
        attack_dmg_boost: { icon: '⚔️', name: 'Giant Strike', class: 'attack_dmg_boost' },
        cooldown_reduction: { icon: '⏱️', name: 'Haste', class: 'cooldown_reduction' }
      };
      
      let html = '';
      Object.keys(counts).forEach(p => {
        const item = perkMap[p] || { icon: '🃏', name: p, class: 'default' };
        html += `<div class="perk-badge ${item.class}" title="${item.name}">${item.icon} x${counts[p]}</div>`;
      });
      perksPanel.innerHTML = html;
    } else {
      perksPanel.style.display = 'none';
    }
  }

  // Reactive Modal Overlays: Automatically show if player has pending choices
  if (me.lvl === 5 && !me.brnch) {
    const evoModal = document.getElementById('evolutionChoiceModal');
    if (evoModal && evoModal.classList.contains('hidden') && !window.isSelectingBranch) {
      window.showEvolutionChoiceModal();
    }
  }

  if (me.pndPrks && Array.isArray(me.pndPrks) && me.pndPrks.length > 0) {
    const perkModal = document.getElementById('perkChoiceModal');
    if (perkModal && perkModal.classList.contains('hidden') && !window.isSelectingPerk) {
      window.showPerkChoiceModal(me.pndPrks);
    }
  }

  // Ensure HUD is visible when there are no active modals / pending choices
  // Guard: never restore HUD if Game Over screen is currently showing
  const isGameOverVisible = gameOverScreen && !gameOverScreen.classList.contains('hidden');
  const isSelectingPerkModal = me.pndPrks && Array.isArray(me.pndPrks) && me.pndPrks.length > 0;
  const isSelectingBranchModal = me.lvl === 5 && !me.brnch;
  if (!isGameOverVisible && !isSelectingPerkModal && !isSelectingBranchModal) {
    if (hud && hud.classList.contains('hidden')) {
      hud.classList.remove('hidden');
      if (window.isTouchDevice && mjOverlay) {
        mjOverlay.classList.remove('hidden');
      }
    }
  }
}

let lastLbStr = '';
function updateLeaderboard(list) {
  if (!lbList || !list) return;
  const str = list.map(e => `${e.id}:${e.score}:${e.level}`).join('|');
  if (str === lastLbStr) return;
  lastLbStr = str;
  lbList.innerHTML = '';
  list.forEach((e, i) => {
    const li = document.createElement('li');
    if (e.id === myId) li.classList.add('self-rank');
    const medals = ['👑','🥈','🥉'];
    
    // Resolve branch skins if available
    const sp = serverPlayers[e.id];
    const skin = (sp && sp.lvl >= 5 && sp.brnch) 
      ? (BRANCH_SKINS[sp.brnch]?.[sp.lvl] || SKINS[e.level]) 
      : (SKINS[e.level] || SKINS[1]);

    li.innerHTML = `<span class="rank-num">${medals[i]||'#'+(i+1)}</span><span class="rank-name">${esc(e.name)}</span><span class="rank-lvl" style="color:${skin.aura||'#aaa'}">Lv.${e.level}</span><span class="rank-time-score">${e.score}</span>`;
    lbList.appendChild(li);
  });
}

let lastKillFeedStr = '';
function updateKillFeed(feed) {
  if (!killFeedEl || !feed) return;
  const str = feed.join('|');
  if (str === lastKillFeedStr) return;
  lastKillFeedStr = str;
  killFeedEl.innerHTML = '';
  feed.slice(0, 4).forEach(text => {
    const div = document.createElement('div');
    div.className = 'kill-entry';
    div.textContent = text;
    killFeedEl.appendChild(div);
  });
}

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ══════════════════════════════════════════════════════════════
//  ANNOUNCEMENT
// ══════════════════════════════════════════════════════════════
let announcementText = null, announceTTL = 0;
function showAnnouncement(text) { announcementText = text; announceTTL = 130; }

// ══════════════════════════════════════════════════════════════
//  PARTICLE EMITTERS
// ══════════════════════════════════════════════════════════════
function addParticle(p) {
  if (particles.length >= MAX_PARTICLES) particles.splice(0, 10);
  particles.push(p);
}

function emitSparks(x, y, color, n, spd) {
  for (let i = 0; i < n; i++) {
    const a = Math.random()*Math.PI*2, v = (Math.random()*0.7+0.3)*spd;
    addParticle({ type:'spark', x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v, color, r:Math.random()*4+2, alpha:1, decay:0.026+Math.random()*0.018 });
  }
}

function emitHealOrbs(x, y) {
  for (let i = 0; i < 15; i++) {
    addParticle({ type:'heal', x:x+(Math.random()-.5)*20, y:y+(Math.random()-.5)*20, vy:-Math.random()*2, color:'#22c55e', r:4, alpha:1, decay:0.02 });
  }
  addParticle({ type:'shockwave', x, y, r:15, maxR:40, color:'#4ade80', alpha:0.8, decay:0.05 });
  addParticle({ type:'dmg_num', x, y: y-20, vy:-2, alpha:1, decay:0.02, text:'+ HP', color:'#4ade80' });
}

function emitShockwave(x, y, maxR, color) {
  addParticle({ type:'shockwave', x, y, r:10, maxR, color, alpha:0.85, decay:0.038 });
}

function emitBoom(x, y, maxR) {
  addParticle({ type:'boom', x, y, r:15, maxR, alpha:1, decay:0.032 });
  emitSparks(x, y, '#f97316', 22, 7);
  emitSparks(x, y, '#fbbf24', 14, 5);
  emitSparks(x, y, '#fff', 8, 9);
  // Add smoke and debris
  for (let i = 0; i < 8; i++) {
    addParticle({ type:'smoke', x:x+(Math.random()-.5)*15, y:y+(Math.random()-.5)*15, vx:(Math.random()-.5)*2, vy:(Math.random()-.5)*2 - 1, color:'#334155', r:Math.random()*10+5, alpha:0.7, decay:0.02 });
    addParticle({ type:'debris', x, y, vx:(Math.random()-.5)*12, vy:(Math.random()-.5)*12, color:'#475569', r:Math.random()*3+2, alpha:1, decay:0.04 });
  }
}

function emitLightning(path, color = '#a855f7', glow = '#d946ef') { addParticle({ type:'lightning', path, alpha:1, decay:0.12, color, glow }); }

function emitLevelUpBurst(x, y, level) {
  const color = SKINS[level]?.aura || '#fbbf24';
  for (let i = 0; i < 48; i++) {
    const a = (Math.PI*2/48)*i, spd = Math.random()*5+3;
    addParticle({ type:'lvlup_star', x, y, vx:Math.cos(a)*spd, vy:Math.sin(a)*spd, color, r:Math.random()*6+3, alpha:1, decay:0.016 });
  }
  addParticle({ type:'lvlup_ring', x, y, r:12, maxR:130, color, alpha:0.95, decay:0.03 });
  addParticle({ type:'lvlup_ring', x, y, r:12, maxR:180, color:'#fff', alpha:0.6, decay:0.025 });
  // Level-up edge flash
  addParticle({ type:'edge_flash', color, alpha:0.55, decay:0.04 });
  showAnnouncement(`⬆️ Level Up! → ${SKINS[level]?.name || `Lv.${level}`}!`);
}

function emitDeathExplosion(x, y, level, color) {
  const n = 30 + level * 5;
  emitSparks(x, y, color, n, 8);
  emitSparks(x, y, '#fff', 12, 11);
  addParticle({ type:'boom', x, y, r:20, maxR: 60 + level*15, alpha:1, decay:0.05 });
  screenShake = 0; // vibration disabled to prevent dizziness
}

function emitDashBurst(x, y, angle) {
  for (let i = 0; i < 12; i++) {
    const a = angle + (Math.random()-0.5)*2.5;
    addParticle({ type:'spark', x, y, vx:Math.cos(a)*10, vy:Math.sin(a)*10, color:'#7dd3fc', r:6, alpha:0.9, decay:0.04 });
  }
  addParticle({ type:'shockwave', x, y, r:10, maxR:70, color:'#0ea5e9', alpha:0.8, decay:0.05 });
  addParticle({ type:'boom', x, y, r:5, maxR:40, alpha:0.5, decay:0.06 });
}

function emitBlinkTrail(fx, fy, tx, ty) {
  emitSparks(fx, fy, '#6d28d9', 20, 6);
  emitSparks(tx, ty, '#a855f7', 24, 7);
  addParticle({ type:'shockwave', x:tx, y:ty, r:10, maxR:90, color:'#7c3aed', alpha:0.8, decay:0.06 });
}

function emitPickupBurst(x, y) {
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI*2/6)*i;
    addParticle({ type:'spark', x, y, vx:Math.cos(a)*4, vy:Math.sin(a)*4, color:'#fbbf24', r:5, alpha:0.9, decay:0.04 });
  }
}

function emitFloatingDamage(x, y, dmg) {
  addParticle({ type:'dmg_num', x, y: y-10, vy:-2.8, alpha:1, decay:0.018, text:`-${Math.round(dmg)}`, color: dmg >= 50 ? '#fbbf24' : '#fca5a5' });
}

function emitDashTrail(x, y, color) {
  addParticle({ type:'dash_trail', x, y, color, r:14, alpha:0.55, decay:0.075 });
}

// ── Combat Slash Emitter ──────────────────────────────────────
function emitSlash(x, y, angle, r, color, type) {
  slashEffects.push({ x, y, angle, r, color, type, alpha:1, life:1.0 });
}

// ══════════════════════════════════════════════════════════════
//  DRAW HELPERS
// ══════════════════════════════════════════════════════════════
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

function starPath(ctx, cx, cy, outer, inner, pts, rot=0) {
  ctx.beginPath();
  for (let i = 0; i < pts*2; i++) {
    const a = rot + (Math.PI/pts)*i - Math.PI/2;
    const rr = i%2===0 ? outer : inner;
    i===0 ? ctx.moveTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr) : ctx.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);
  }
  ctx.closePath();
}

// ══════════════════════════════════════════════════════════════
//  TERRAIN
// ══════════════════════════════════════════════════════════════
function drawTerrain() {
  const TS = 96;
  
  const cw = canvas.width / cameraZoom, ch = canvas.height / cameraZoom;
  // Deep cosmic background
  ctx.fillStyle = '#030510';
  ctx.fillRect(camera.x - cw/2, camera.y - ch/2, cw, ch);
  
  // Parallax stars
  const time = Date.now();
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 60; i++) {
    const px = (((i*123.4 + camera.x*0.1)%cw) + cw) % cw;
    const py = (((i*321.4 + camera.y*0.1)%ch) + ch) % ch;
    const s = 1 + (i%3);
    const alpha = 0.1 + 0.4 * Math.sin(time/1000 + i);
    ctx.globalAlpha = alpha;
    ctx.fillRect(camera.x - cw/2 + px, camera.y - ch/2 + py, s, s);
  }
  ctx.globalAlpha = 1.0;

  const sx = Math.floor((camera.x - cw/2)/TS)*TS;
  const ex = Math.ceil((camera.x + cw/2)/TS)*TS;
  const sy = Math.floor((camera.y - ch/2)/TS)*TS;
  const ey = Math.ceil((camera.y + ch/2)/TS)*TS;

  for (let tx = sx; tx <= ex; tx += TS) {
    for (let ty = sy; ty <= ey; ty += TS) {
      if (tx<0||tx>=mapSize||ty<0||ty>=mapSize) continue;
      
      // Glowing cosmic tiles
      ctx.fillStyle = ((tx/TS|0)+(ty/TS|0))%2===0 ? 'rgba(15, 23, 42, 0.4)' : 'rgba(10, 15, 30, 0.4)';
      ctx.fillRect(tx, ty, TS, TS);
      
      ctx.strokeStyle='rgba(6, 182, 212, 0.1)'; ctx.lineWidth=1;
      ctx.strokeRect(tx, ty, TS, TS);
      
      // Energy node circuits
      const h = Math.sin(tx*17.3+ty*31.7)*4358.5;
      if ((h-Math.floor(h)) < 0.15) {
        ctx.strokeStyle='rgba(6, 182, 212, 0.35)'; ctx.lineWidth=2;
        ctx.shadowColor='#06b6d4'; ctx.shadowBlur=8;
        ctx.beginPath(); 
        ctx.moveTo(tx+TS*0.2, ty+TS*0.2); 
        ctx.lineTo(tx+TS*0.5, ty+TS*0.4); 
        ctx.lineTo(tx+TS*0.8, ty+TS*0.3); 
        ctx.stroke();
        ctx.shadowBlur=0;
      }
    }
  }

  // Boundary glow (Cyan energy wall)
  ctx.save(); ctx.strokeStyle='rgba(6, 182, 212, 0.5)'; ctx.lineWidth=16; ctx.shadowColor='#06b6d4'; ctx.shadowBlur=40;
  ctx.strokeRect(2,2,mapSize-4,mapSize-4); ctx.restore();
}

// ══════════════════════════════════════════════════════════════
//  MAP DECORATIONS
// ══════════════════════════════════════════════════════════════
function drawDecorations() {
  const cullLimit = Math.max(canvas.width, canvas.height) * 0.72;
  [...MAP_DECO].sort((a,b)=>a.y-b.y).forEach(d => {
    if (Math.abs(d.x - camera.x) > cullLimit || Math.abs(d.y - camera.y) > cullLimit) return;
    ctx.save(); ctx.translate(d.x,d.y);
    ctx.beginPath(); ctx.ellipse(0,d.size*0.5,d.size*0.8,7,0,0,Math.PI*2);
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fill();
    if      (d.type==='tree')       drawTree(ctx,d.size);
    else if (d.type==='rock')       drawRock(ctx,d.size,d.variant);
    else if (d.type==='crate')      drawCrate(ctx,d.size);
    else if (d.type==='barricade')  drawBarricade(ctx,d.size,d.angle);
    ctx.restore();
  });
}

function drawTree(ctx,s) {
  ctx.fillStyle='#6b3c11'; roundRect(ctx,-5,-s*0.1,10,s*0.65,3); ctx.fill();
  ctx.strokeStyle='#3b1e05'; ctx.lineWidth=2; ctx.stroke();
  [{oy:-s*.68,r:s*.74,c1:'#4ade80',c2:'#15803d'},{oy:-s*.38,r:s*.58,c1:'#22c55e',c2:'#166534'},{oy:-s*.14,r:s*.44,c1:'#16a34a',c2:'#14532d'}].forEach(l=>{
    const g=ctx.createRadialGradient(l.r*-0.32,l.oy-l.r*.32,3,0,l.oy,l.r);
    g.addColorStop(0,l.c1); g.addColorStop(1,l.c2);
    ctx.beginPath(); ctx.arc(0,l.oy,l.r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    ctx.strokeStyle='#052e16'; ctx.lineWidth=3; ctx.stroke();
  });
}

function drawRock(ctx,s,v) {
  const shapes=[[[-s*.5,s*.4],[-s*.4,-s*.3],[0,-s*.5],[s*.45,-s*.1],[s*.5,s*.4]],[[-s*.4,s*.4],[-s*.5,-s*.1],[-s*.1,-s*.5],[s*.4,-s*.3],[s*.5,s*.4]],[[-s*.5,s*.3],[-s*.3,-s*.4],[s*.1,-s*.5],[s*.5,-s*.1],[s*.4,s*.4]]];
  const pts=shapes[v%3];
  const g=ctx.createLinearGradient(-s*.5,-s*.5,s*.5,s*.5); g.addColorStop(0,'#6d28d9'); g.addColorStop(1,'#1e1b4b');
  ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); pts.slice(1).forEach(p=>ctx.lineTo(p[0],p[1])); ctx.closePath();
  ctx.fillStyle=g; ctx.fill(); ctx.strokeStyle='#0f0e26'; ctx.lineWidth=3; ctx.stroke();
  ctx.strokeStyle='rgba(167,139,250,0.5)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(-s*.1,-s*.4); ctx.lineTo(0,-s*.1); ctx.stroke();
}

function drawCrate(ctx,s) {
  ctx.fillStyle='#92400e'; roundRect(ctx,-s/2,-s/2,s,s,4); ctx.fill(); ctx.strokeStyle='#451a03'; ctx.lineWidth=3; ctx.stroke();
  ctx.strokeStyle='#78350f'; ctx.lineWidth=1.5; [-s*.15,s*.15].forEach(oy=>{ctx.beginPath();ctx.moveTo(-s/2,oy);ctx.lineTo(s/2,oy);ctx.stroke();});
  ctx.strokeStyle='#6b2d03'; ctx.lineWidth=2; ctx.beginPath();ctx.moveTo(-s/2,-s/2);ctx.lineTo(s/2,s/2);ctx.stroke();ctx.beginPath();ctx.moveTo(s/2,-s/2);ctx.lineTo(-s/2,s/2);ctx.stroke();
  ctx.fillStyle='#d97706'; const cs=5; [[-s/2,-s/2],[s/2-cs,-s/2],[-s/2,s/2-cs],[s/2-cs,s/2-cs]].forEach(([cx,cy])=>ctx.fillRect(cx,cy,cs,cs));
}

function drawBarricade(ctx,s,angle) {
  ctx.save(); ctx.rotate(angle); ctx.fillStyle='#4b5563';
  [-s*.5,s*.5].forEach(ox=>{roundRect(ctx,ox-5,-s*.3,10,s*.7,3);ctx.fill();});
  const bw=s*1.4,bh=14,bx=-bw/2,by=-10;
  ctx.save(); ctx.beginPath(); ctx.rect(bx,by,bw,bh); ctx.clip();
  for(let sx=bx-bh;sx<bx+bw;sx+=18){ctx.fillStyle='#ca8a04';ctx.fillRect(sx,by,9,bh);ctx.fillStyle='#1c1917';ctx.fillRect(sx+9,by,9,bh);}
  ctx.restore(); ctx.strokeStyle='#000'; ctx.lineWidth=2.5; ctx.strokeRect(bx,by,bw,bh); ctx.restore();
}

// ══════════════════════════════════════════════════════════════
//  ITEMS — Rich Vector Animation System
// ══════════════════════════════════════════════════════════════
function drawItems() {
  const now = Date.now();
  const cullW = canvas.width / cameraZoom / 2 + 100;
  const cullH = canvas.height / cameraZoom / 2 + 100;
  serverItems.forEach(item => {
    if (Math.abs(item.x - camera.x) > cullW || Math.abs(item.y - camera.y) > cullH) return;
    const itype = item.t || item.type;
    const ir    = item.r || item.radius || 10;
    const seed  = (item.id || 0) * 173;
    const bob   = Math.sin((now + seed) / 220) * 4;
    const spin  = (now + seed) / 800;
    const pulse = 0.5 + Math.sin((now + seed) / 300) * 0.5;

    // Ground shadow
    ctx.save();
    ctx.translate(item.x, item.y + 4);
    ctx.scale(1, 0.3);
    ctx.beginPath(); ctx.arc(0, 0, ir * 1.6, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(item.x, item.y + bob);

    // ── Outer glow ring (all items)
    const glowColors = {
      orb: '#fbbf24', heal_orb: '#4ade80', chest: '#fbbf24',
      boot: '#38bdf8', missile_item: '#f87171', bomb_item: '#ef4444',
      poison_item: '#86efac', shield_item: '#a78bfa', net_item: '#94a3b8',
      rage_item: '#fb923c', potion: '#4ade80', lightning_item: '#facc15'
    };
    const gc = glowColors[itype] || '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, ir * 2.2, 0, Math.PI*2);
    const outerG = ctx.createRadialGradient(0,0,ir*0.5,0,0,ir*2.2);
    outerG.addColorStop(0, gc + '55'); outerG.addColorStop(1, gc + '00');
    ctx.fillStyle = outerG; ctx.fill();

    // ── Rotating orbit ring
    ctx.save(); ctx.rotate(spin);
    ctx.strokeStyle = gc + '66'; ctx.lineWidth = 1.5;
    ctx.setLineDash([4,6]);
    ctx.beginPath(); ctx.arc(0, 0, ir * 1.6, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
    // Orbit dot
    ctx.fillStyle = gc; ctx.shadowColor = gc; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(ir*1.6, 0, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.restore();

    if (itype === 'orb') {
      // XP Orb — pulsing gold star
      ctx.save(); ctx.rotate(spin * 0.5);
      const g = ctx.createRadialGradient(-ir*.3,-ir*.3,1,0,0,ir);
      g.addColorStop(0,'#fff9c4'); g.addColorStop(0.5,'#fbbf24'); g.addColorStop(1,'#92400e');
      ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 16;
      starPath(ctx, 0, 0, ir, ir*0.45, 5, 0);
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5; ctx.stroke();
      // Inner sparkle
      ctx.fillStyle = 'rgba(255,255,200,0.9)';
      ctx.beginPath(); ctx.arc(-ir*.25, -ir*.25, ir*.18, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
    else if (itype === 'heal_orb' || itype === 'potion') {
      // Heal Orb — cross symbol with glowing green
      const g = ctx.createRadialGradient(-ir*.3,-ir*.3,1,0,0,ir);
      g.addColorStop(0,'#bbf7d0'); g.addColorStop(0.6,'#22c55e'); g.addColorStop(1,'#14532d');
      ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(0,0,ir,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
      ctx.strokeStyle='#166534'; ctx.lineWidth=2; ctx.stroke();
      // Cross
      ctx.fillStyle='rgba(255,255,255,0.9)';
      ctx.fillRect(-ir*.55, -ir*.18, ir*1.1, ir*.36);
      ctx.fillRect(-ir*.18, -ir*.55, ir*.36, ir*1.1);
      // Pulse ring
      ctx.strokeStyle = `rgba(74,222,128,${pulse*0.6})`; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0,0,ir*(1+pulse*.4),0,Math.PI*2); ctx.stroke();
    }
    else if (itype === 'chest') {
      // Treasure Chest — glowing wood
      ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 20*(0.6+pulse*.4);
      const sz = ir;
      // Body
      const cg = ctx.createLinearGradient(-sz,-sz*.8,sz,sz*.8);
      cg.addColorStop(0,'#b45309'); cg.addColorStop(0.5,'#92400e'); cg.addColorStop(1,'#78350f');
      ctx.fillStyle = cg; roundRect(ctx,-sz,-sz*.8,sz*2,sz*1.6,5); ctx.fill();
      ctx.strokeStyle='#451a03'; ctx.lineWidth=3; ctx.stroke();
      // Lid
      const lg = ctx.createLinearGradient(-sz,-sz*.8,sz,-sz*.25);
      lg.addColorStop(0,'#d97706'); lg.addColorStop(1,'#a16207');
      ctx.fillStyle = lg; roundRect(ctx,-sz,-sz*.8,sz*2,sz*.55,5); ctx.fill();
      ctx.strokeStyle='#451a03'; ctx.lineWidth=2; ctx.stroke();
      // Lock
      ctx.fillStyle='#fbbf24'; ctx.beginPath(); ctx.arc(0,-sz*.25,ir*.35,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#92400e'; ctx.lineWidth=2; ctx.stroke();
      // Shimmer beam
      ctx.save(); ctx.globalAlpha=0.25+pulse*.3;
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.ellipse(0,-sz*.4,4,sz*.9,0.4,0,Math.PI*2); ctx.fill();
      ctx.restore();
      // Gold particles
      for(let i=0;i<3;i++){
        const pa=(spin+i*Math.PI*.67)%Math.PI*2;
        const pr=ir*(1+pulse*.5);
        ctx.save(); ctx.globalAlpha=0.6*pulse;
        ctx.fillStyle='#fbbf24'; ctx.shadowColor='#fbbf24'; ctx.shadowBlur=6;
        ctx.beginPath(); ctx.arc(Math.cos(pa)*pr,Math.sin(pa)*pr-ir*.3,2,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
    }
    else if (itype === 'boot') {
      // Dash Boot — angular speed lines
      ctx.save(); ctx.rotate(-spin * 0.3);
      const bg = ctx.createRadialGradient(-ir*.3,-ir*.3,1,0,0,ir);
      bg.addColorStop(0,'#e0f2fe'); bg.addColorStop(0.5,'#38bdf8'); bg.addColorStop(1,'#0369a1');
      ctx.shadowColor='#38bdf8'; ctx.shadowBlur=16;
      // Boot shape
      ctx.beginPath();
      ctx.moveTo(-ir*.7, ir*.4);
      ctx.lineTo(-ir*.7,-ir*.1);
      ctx.lineTo(-ir*.1,-ir*.7);
      ctx.lineTo(ir*.4,-ir*.5);
      ctx.lineTo(ir*.7, ir*.2);
      ctx.lineTo(ir*.5, ir*.4);
      ctx.closePath();
      ctx.fillStyle=bg; ctx.fill();
      ctx.strokeStyle='#0ea5e9'; ctx.lineWidth=2; ctx.stroke();
      // Speed lines
      ctx.strokeStyle='rgba(255,255,255,0.7)'; ctx.lineWidth=1.5;
      for(let i=0;i<3;i++){
        const ly=-ir*(.2-i*.2);
        ctx.beginPath(); ctx.moveTo(-ir*(1+i*.2),ly); ctx.lineTo(-ir*.1,ly); ctx.stroke();
      }
      ctx.restore();
    }
    else if (itype === 'missile_item') {
      // Sleek Homing Rocket
      ctx.save(); ctx.rotate(-Math.PI/2 + Math.sin(spin)*0.15);
      // Flame exhaust
      const fg=ctx.createRadialGradient(0,ir*.8,0,0,ir*.8,ir*.6);
      fg.addColorStop(0,'#fff'); fg.addColorStop(0.5,'#fb923c'); fg.addColorStop(1,'rgba(239,68,68,0)');
      ctx.globalAlpha=0.7+pulse*.3;
      ctx.beginPath(); ctx.ellipse(0,ir*.9,6,ir*.5+pulse*6,0,0,Math.PI*2);
      ctx.fillStyle=fg; ctx.fill(); 
      ctx.globalAlpha=1;
      // Body
      const rg=ctx.createLinearGradient(-ir*.3,-ir*.8,ir*.3,ir*.8);
      rg.addColorStop(0,'#e2e8f0'); rg.addColorStop(0.5,'#94a3b8'); rg.addColorStop(1,'#475569');
      ctx.shadowColor='#f87171'; ctx.shadowBlur=16;
      ctx.beginPath();
      ctx.moveTo(0,-ir*.9); ctx.lineTo(ir*.25,ir*.4); ctx.lineTo(-ir*.25,ir*.4); ctx.closePath();
      ctx.fillStyle=rg; ctx.fill(); ctx.strokeStyle='#334155'; ctx.lineWidth=2; ctx.stroke();
      // Red Nosecone
      ctx.fillStyle='#ef4444';
      ctx.beginPath(); ctx.moveTo(0,-ir*.9); ctx.lineTo(ir*.18,-ir*.3); ctx.lineTo(-ir*.18,-ir*.3); ctx.closePath(); ctx.fill();
      // Side Fins
      ctx.fillStyle='#dc2626';
      ctx.beginPath(); ctx.moveTo(-ir*.25,ir*.1); ctx.lineTo(-ir*.6,ir*.6); ctx.lineTo(-ir*.2,ir*.4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(ir*.25,ir*.1); ctx.lineTo(ir*.6,ir*.6); ctx.lineTo(ir*.2,ir*.4); ctx.closePath(); ctx.fill();
      // Target crosshair orbiting
      ctx.restore();
      ctx.save(); ctx.rotate(spin*2);
      ctx.strokeStyle='rgba(239,68,68,0.7)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(0,0,ir*1.4,0,Math.PI*2); ctx.stroke();
      for(let i=0;i<4;i++){
        ctx.rotate(Math.PI/2);
        ctx.beginPath(); ctx.moveTo(ir*1.2,0); ctx.lineTo(ir*1.6,0); ctx.stroke();
      }
      ctx.restore();
    }
    else if (itype === 'bomb_item') {
      // Bomb — classic round with sparkling fuse
      ctx.shadowColor='#ef4444'; ctx.shadowBlur=14*(0.5+pulse*.5);
      const bg2=ctx.createRadialGradient(-ir*.3,-ir*.4,1,0,0,ir);
      bg2.addColorStop(0,'#6b7280'); bg2.addColorStop(0.6,'#374151'); bg2.addColorStop(1,'#111827');
      ctx.beginPath(); ctx.arc(0,0,ir,0,Math.PI*2); ctx.fillStyle=bg2; ctx.fill();
      ctx.strokeStyle='#1f2937'; ctx.lineWidth=2.5; ctx.stroke();
      // Highlight
      ctx.fillStyle='rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.ellipse(-ir*.3,-ir*.35,ir*.28,ir*.2,-0.5,0,Math.PI*2); ctx.fill();
      // Fuse
      ctx.strokeStyle='#a16207'; ctx.lineWidth=2.5; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(ir*.3,-ir*.5); ctx.bezierCurveTo(ir*.8,-ir*.8,ir*1.1,-ir*.4,ir*.7,-ir*.1); ctx.stroke();
      // Fuse spark
      ctx.save(); ctx.globalAlpha=0.8+pulse*.2;
      ctx.fillStyle='#fbbf24'; ctx.shadowColor='#fbbf24'; ctx.shadowBlur=12;
      ctx.beginPath(); ctx.arc(ir*.7,-ir*.1,3+pulse*2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(ir*.7,-ir*.1,1.5,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
    else if (itype === 'potion' || itype === 'potion_item') {
      // Health Potion Flask — bubbling green liquid
      ctx.shadowColor='#86efac'; ctx.shadowBlur=14;
      // Flask shape
      const fl=ctx.createLinearGradient(-ir*.5,-ir*.8,ir*.5,ir*.8);
      fl.addColorStop(0,'#d1fae5'); fl.addColorStop(0.3,'#4ade80'); fl.addColorStop(1,'#14532d');
      ctx.beginPath();
      ctx.moveTo(-ir*.2,-ir*.8); ctx.lineTo(-ir*.4,-ir*.4);
      ctx.lineTo(-ir*.6,ir*.5); ctx.arcTo(-ir*.6,ir*.9,ir*.6,ir*.9,ir*.4);
      ctx.lineTo(ir*.6,ir*.5); ctx.lineTo(ir*.4,-ir*.4); ctx.lineTo(ir*.2,-ir*.8);
      ctx.closePath();
      ctx.fillStyle=fl; ctx.fill(); ctx.strokeStyle='#166534'; ctx.lineWidth=2.5; ctx.stroke();
      // Medical Cross
      ctx.fillStyle='rgba(255,255,255,0.8)';
      ctx.fillRect(-ir*.1, ir*.1, ir*.2, ir*.5);
      ctx.fillRect(-ir*.25, ir*.25, ir*.5, ir*.2);
      // Cork
      ctx.fillStyle='#a16207'; roundRect(ctx,-ir*.25,-ir*1.05,ir*.5,ir*.3,3); ctx.fill();
      // Bubbles
      [[-ir*.2,ir*.2],[ir*.1,-ir*.1],[ir*.3,ir*.4]].forEach(([bx,by],i)=>{
        ctx.save(); ctx.globalAlpha=0.4+Math.sin(spin+i*1.5)*0.4;
        ctx.fillStyle='#bbf7d0'; ctx.shadowColor='#4ade80'; ctx.shadowBlur=5;
        ctx.beginPath(); ctx.arc(bx,by,3+i,0,Math.PI*2); ctx.fill(); ctx.restore();
      });
    }
    else if (itype === 'shield_item') {
      // Shield — hexagonal with energy core
      ctx.save(); ctx.rotate(Math.sin(spin)*0.1);
      ctx.shadowColor='#a78bfa'; ctx.shadowBlur=16*(0.5+pulse*.5);
      // Shield body
      const sg=ctx.createLinearGradient(0,-ir,0,ir);
      sg.addColorStop(0,'#c4b5fd'); sg.addColorStop(0.5,'#7c3aed'); sg.addColorStop(1,'#4c1d95');
      ctx.beginPath();
      for(let i=0;i<6;i++){const a=(Math.PI/3)*i-Math.PI/6; ctx.lineTo(Math.cos(a)*ir,Math.sin(a)*ir);}
      ctx.closePath(); ctx.fillStyle=sg; ctx.fill(); ctx.strokeStyle='#6d28d9'; ctx.lineWidth=3; ctx.stroke();
      // Inner pattern
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1.5;
      ctx.beginPath();
      for(let i=0;i<6;i++){const a=(Math.PI/3)*i-Math.PI/6; ctx.lineTo(Math.cos(a)*ir*.55,Math.sin(a)*ir*.55);}
      ctx.closePath(); ctx.stroke();
      // Energy core
      const ec=ctx.createRadialGradient(0,0,1,0,0,ir*.3);
      ec.addColorStop(0,'#fff'); ec.addColorStop(1,'rgba(167,139,250,0)');
      ctx.beginPath(); ctx.arc(0,0,ir*.3,0,Math.PI*2); ctx.fillStyle=ec; ctx.fill();
      ctx.restore();
    }
    else if (itype === 'net_item') {
      // Net — woven diamond pattern
      ctx.save(); ctx.rotate(spin * 0.5);
      ctx.shadowColor='#94a3b8'; ctx.shadowBlur=10;
      // Outer circle
      ctx.strokeStyle='#cbd5e1'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(0,0,ir,0,Math.PI*2); ctx.stroke();
      // Net grid
      ctx.strokeStyle='rgba(148,163,184,0.8)'; ctx.lineWidth=1.5;
      for(let i=-1;i<=1;i++){
        ctx.beginPath(); ctx.moveTo(i*ir*.5,-ir); ctx.lineTo(i*ir*.5,ir); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-ir,i*ir*.5); ctx.lineTo(ir,i*ir*.5); ctx.stroke();
      }
      // Diagonal
      ctx.strokeStyle='rgba(148,163,184,0.5)'; ctx.lineWidth=1;
      for(let i=-2;i<=2;i++){
        ctx.beginPath(); ctx.moveTo(i*ir*.5-ir,-ir); ctx.lineTo(i*ir*.5+ir,ir); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i*ir*.5+ir,-ir); ctx.lineTo(i*ir*.5-ir,ir); ctx.stroke();
      }
      // Center chain link
      ctx.fillStyle='#64748b'; ctx.beginPath(); ctx.arc(0,0,ir*.25,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
    else if (itype === 'rage_item') {
      // Rage — fire gem
      ctx.save(); ctx.rotate(spin * 0.3);
      ctx.shadowColor='#f97316'; ctx.shadowBlur=20*(0.5+pulse*.5);
      // Gem shape (diamond)
      const rg2=ctx.createLinearGradient(0,-ir,0,ir);
      rg2.addColorStop(0,'#fed7aa'); rg2.addColorStop(0.4,'#f97316'); rg2.addColorStop(1,'#7c2d12');
      ctx.beginPath(); ctx.moveTo(0,-ir); ctx.lineTo(ir*.7,0); ctx.lineTo(0,ir); ctx.lineTo(-ir*.7,0); ctx.closePath();
      ctx.fillStyle=rg2; ctx.fill(); ctx.strokeStyle='#c2410c'; ctx.lineWidth=2.5; ctx.stroke();
      // Inner lines
      ctx.strokeStyle='rgba(255,237,213,0.5)'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(0,-ir*.5); ctx.lineTo(ir*.35,0); ctx.lineTo(0,ir*.5); ctx.lineTo(-ir*.35,0); ctx.closePath(); ctx.stroke();
      // Flames emanating
      for(let fi=0;fi<4;fi++){
        const fa2=(spin+fi*Math.PI*.5)%(Math.PI*2);
        ctx.save(); ctx.globalAlpha=0.5*pulse;
        ctx.fillStyle='#fbbf24'; ctx.shadowColor='#f97316'; ctx.shadowBlur=10;
        ctx.beginPath(); ctx.arc(Math.cos(fa2)*ir*1.2,Math.sin(fa2)*ir*1.2,3,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
    else if (itype === 'lightning_item') {
      // Lightning Shard / Electric Crystal
      ctx.save(); ctx.rotate(spin * 0.4);
      ctx.shadowColor='#facc15'; ctx.shadowBlur=20*(0.5+pulse*.5);
      
      // Crystal shape (hexagon)
      const lgg=ctx.createLinearGradient(0,-ir,0,ir);
      lgg.addColorStop(0,'#fffde7'); lgg.addColorStop(0.4,'#facc15'); lgg.addColorStop(1,'#ca8a04');
      ctx.beginPath();
      for(let i=0;i<6;i++){
        const a=(Math.PI/3)*i - Math.PI/6;
        ctx.lineTo(Math.cos(a)*ir*0.8, Math.sin(a)*ir*0.8);
      }
      ctx.closePath(); ctx.fillStyle=lgg; ctx.fill(); ctx.strokeStyle='#a16207'; ctx.lineWidth=2.5; ctx.stroke();
      
      // Draw lightning bolt symbol in the center
      ctx.rotate(-spin * 0.4); // stabilize symbol rotation
      ctx.fillStyle='#fff'; ctx.shadowBlur=0;
      ctx.beginPath();
      ctx.moveTo(0, -ir*0.5);
      ctx.lineTo(ir*0.25, -ir*0.1);
      ctx.lineTo(0, -ir*0.1);
      ctx.lineTo(ir*0.15, ir*0.5);
      ctx.lineTo(-ir*0.25, ir*0.1);
      ctx.lineTo(0, ir*0.1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    else {
      // Default fallback — glowing orb
      const df=ctx.createRadialGradient(-ir*.3,-ir*.3,1,0,0,ir);
      df.addColorStop(0,'#e2e8f0'); df.addColorStop(1,'#475569');
      ctx.beginPath(); ctx.arc(0,0,ir,0,Math.PI*2); ctx.fillStyle=df; ctx.fill();
      ctx.strokeStyle='#94a3b8'; ctx.lineWidth=2; ctx.stroke();
    }

    ctx.restore();
  });
}


// ══════════════════════════════════════════════════════════════
//  HAZARDS
// ══════════════════════════════════════════════════════════════
function drawHazards() {
  const cullW = canvas.width / cameraZoom / 2 + 180;
  const cullH = canvas.height / cameraZoom / 2 + 180;
  serverHazards.forEach(hz => {
    if (Math.abs(hz.x - camera.x) > cullW || Math.abs(hz.y - camera.y) > cullH) return;
    if (hz.t === 'trap' && hz.oid !== myId) return; // Hide traps from other players
    ctx.save();
    if (hz.t==='bomb') {
      const pulse=0.5+Math.sin(Date.now()/120)*0.35;
      ctx.beginPath();ctx.arc(hz.x,hz.y,180,0,Math.PI*2);
      ctx.strokeStyle=`rgba(239,68,68,${pulse*0.22})`;ctx.lineWidth=3;ctx.stroke();
      const ratio=1-(hz.tm/48);
      if(ratio>0){ctx.beginPath();ctx.arc(hz.x,hz.y,180*ratio,0,Math.PI*2);ctx.fillStyle='rgba(239,68,68,0.08)';ctx.fill();}
      
      // Beautiful Bomb vector drawing
      ctx.translate(hz.x, hz.y);
      ctx.shadowColor='#ef4444';ctx.shadowBlur=15;
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fillStyle = '#1e293b'; ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(-5, -5, 4, 0, Math.PI*2); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
      // Bomb fuse
      ctx.beginPath(); ctx.moveTo(0, -16); ctx.quadraticCurveTo(8, -24, 12, -20); ctx.strokeStyle = '#b45309'; ctx.lineWidth = 3; ctx.stroke();
      // Fuse spark
      const sparkPulse = 3 + Math.sin(Date.now()/50)*2;
      ctx.beginPath(); ctx.arc(12, -20, sparkPulse, 0, Math.PI*2); ctx.fillStyle = '#facc15'; ctx.fill();
      ctx.translate(-hz.x, -hz.y);
    }
    else if (hz.t==='trap') {
      ctx.translate(hz.x, hz.y);
      ctx.beginPath(); ctx.arc(0, 0, hz.r, 0, Math.PI*2); ctx.fillStyle='rgba(107,114,128,0.3)'; ctx.fill();
      ctx.strokeStyle='#374151'; ctx.lineWidth=2; ctx.stroke();
      // Woven net on ground
      ctx.strokeStyle = 'rgba(209,213,219,0.8)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.beginPath();
      for(let i=-hz.r; i<=hz.r; i+=7) {
        ctx.moveTo(i, -hz.r*0.9); ctx.lineTo(i, hz.r*0.9);
        ctx.moveTo(-hz.r*0.9, i); ctx.lineTo(hz.r*0.9, i);
      }
      ctx.stroke();
      ctx.translate(-hz.x, -hz.y);
    }
    else if (hz.t==='smoke_bomb') {
      ctx.translate(hz.x, hz.y);
      const radG = ctx.createRadialGradient(0, 0, hz.r * 0.1, 0, 0, hz.r);
      radG.addColorStop(0, 'rgba(100, 116, 139, 0.45)');
      radG.addColorStop(0.7, 'rgba(71, 85, 105, 0.3)');
      radG.addColorStop(1, 'rgba(71, 85, 105, 0)');
      ctx.fillStyle = radG;
      ctx.beginPath();
      ctx.arc(0, 0, hz.r, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw small puff outlines for a nice cloudy texture
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 + (Date.now() / 4000);
        const rx = Math.cos(angle) * (hz.r * 0.6);
        const ry = Math.sin(angle) * (hz.r * 0.6);
        ctx.beginPath();
        ctx.arc(rx, ry, hz.r * 0.35, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.translate(-hz.x, -hz.y);
    }
    else if (hz.t==='barrel') {
      const g=ctx.createRadialGradient(hz.x-8,hz.y-8,2,hz.x,hz.y,hz.r);
      g.addColorStop(0,'#dc2626');g.addColorStop(1,'#7f1d1d');
      ctx.beginPath();ctx.arc(hz.x,hz.y,hz.r,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
      ctx.strokeStyle='#000';ctx.lineWidth=3.5;ctx.stroke();
      [-hz.r*.4,0,hz.r*.4].forEach(oy=>{ctx.strokeStyle='#374151';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(hz.x,hz.y+oy,hz.r,Math.PI*.1,Math.PI*.9);ctx.stroke();});
      ctx.fillStyle='#fff';ctx.font='bold 11px Outfit';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.strokeText('TNT',hz.x,hz.y);ctx.fillText('TNT',hz.x,hz.y);
    }
    ctx.restore();
  });
}

// ══════════════════════════════════════════════════════════════
//  PROJECTILES (with combat animation)
// ══════════════════════════════════════════════════════════════
function drawProjectiles() {
  serverProjectiles.forEach(p => {
    ctx.save(); ctx.translate(p.x,p.y);
    const ang = Math.atan2(p.vy || 0, p.vx || 1);
    
    if (p.t === 'bullet' || p.t === 'magic_missile') {
      ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 16;
      const g = ctx.createRadialGradient(0,0,1,0,0,p.r*2.5);
      g.addColorStop(0,'#fff'); g.addColorStop(0.4,'#38bdf8'); g.addColorStop(1,'rgba(56,189,248,0)');
      ctx.beginPath(); ctx.arc(0,0,p.r*2.5,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    }
    else if (p.t === 'brawler_strike') {
      ctx.rotate(ang);
      ctx.shadowColor = '#fb7185'; ctx.shadowBlur = 15;
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.arc(p.r * 0.5, 0, p.r * 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(p.r * 0.5, 0, p.r * 0.4, 0, Math.PI * 2); ctx.fill();
    }
    else if (p.t === 'poison_dagger') {
      ctx.rotate(ang + (Date.now() / 40) % (Math.PI*2));
      ctx.shadowColor = '#10b981'; ctx.shadowBlur = 15;
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.moveTo(p.r*1.2, 0);
      ctx.lineTo(-p.r*0.4, p.r*0.3);
      ctx.lineTo(-p.r*0.4, -p.r*0.3);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#065f46';
      ctx.fillRect(-p.r*0.8, -p.r*0.1, p.r*0.4, p.r*0.2);
    }
    else if (p.t === 'shadow_bolt') {
      ctx.rotate(ang + (Date.now() / 45) % (Math.PI*2));
      ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 16;
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (Math.PI / 2) * i;
        ctx.lineTo(Math.cos(a)*p.r*1.2, Math.sin(a)*p.r*1.2);
        ctx.lineTo(Math.cos(a+Math.PI/4)*p.r*0.3, Math.sin(a+Math.PI/4)*p.r*0.3);
      }
      ctx.closePath(); ctx.fill();
    }
    else if (p.t === 'celestial_spark') {
      ctx.rotate(ang + (Date.now() / 60) % (Math.PI*2));
      ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 20;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI / 4) * i;
        ctx.lineTo(Math.cos(a)*p.r*1.3, Math.sin(a)*p.r*1.3);
        ctx.lineTo(Math.cos(a+Math.PI/8)*p.r*0.4, Math.sin(a+Math.PI/8)*p.r*0.4);
      }
      ctx.closePath(); ctx.fill();
    }
    else if (p.t === 'needle') {
      ctx.rotate(ang);
      ctx.shadowColor = '#cbd5e1'; ctx.shadowBlur = 12;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-p.r*1.8, 0);
      ctx.lineTo(p.r*1.8, 0);
      ctx.stroke();
    }
    else if (p.t === 'shuriken') {
      ctx.rotate((Date.now() / 30) % (Math.PI*2));
      ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 18;
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a1 = (Math.PI / 2) * i;
        const a2 = a1 + Math.PI / 4;
        ctx.lineTo(Math.cos(a1)*p.r*1.4, Math.sin(a1)*p.r*1.4);
        ctx.lineTo(Math.cos(a2)*p.r*0.4, Math.sin(a2)*p.r*0.4);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#08070d';
      ctx.beginPath(); ctx.arc(0, 0, p.r*0.25, 0, Math.PI*2); ctx.fill();
    }
    else if (p.t === 'scythe_sweep') {
      ctx.globalAlpha = 0.85; ctx.lineCap = 'round';
      ctx.rotate(ang);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.95)'; ctx.lineWidth = p.r * 0.7;
      ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 25;
      ctx.beginPath(); ctx.arc(0, 0, p.r * 0.95, -Math.PI * 0.65, Math.PI * 0.65); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = p.r * 0.3; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(0, 0, p.r * 0.95, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
    }
    else if (p.t === 'void_blade') {
      ctx.rotate(ang);
      ctx.shadowColor = '#c084fc'; ctx.shadowBlur = 20;
      ctx.fillStyle = '#6b21a8';
      ctx.beginPath();
      ctx.moveTo(p.r*1.8, 0);
      ctx.lineTo(-p.r*0.5, p.r*0.35);
      ctx.lineTo(-p.r*0.5, -p.r*0.35);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(p.r*1.3, 0);
      ctx.lineTo(-p.r*0.2, p.r*0.15);
      ctx.lineTo(-p.r*0.2, -p.r*0.15);
      ctx.closePath(); ctx.fill();
    }
    else if (p.t === 'ghost_claws') {
      ctx.globalAlpha = 0.9; ctx.lineCap = 'round';
      ctx.rotate(ang);
      ctx.strokeStyle = 'rgba(217, 70, 239, 0.9)'; ctx.lineWidth = p.r * 0.25;
      ctx.shadowColor = '#d946ef'; ctx.shadowBlur = 22;
      [-p.r*0.35, 0, p.r*0.35].forEach(offset => {
        ctx.beginPath();
        ctx.arc(offset, 0, p.r * 0.95, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();
      });
    }
    else if (p.t === 'iron_sword') {
      ctx.globalAlpha = 0.85; ctx.lineCap = 'round';
      ctx.rotate(ang);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.9)'; ctx.lineWidth = p.r * 0.6;
      ctx.shadowColor = '#ca8a04'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(0, 0, p.r * 0.8, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = p.r * 0.28; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(0, 0, p.r * 0.8, -Math.PI * 0.35, Math.PI * 0.35); ctx.stroke();
    }
    else if (p.t === 'heavy_axe') {
      ctx.globalAlpha = 0.85; ctx.lineCap = 'round';
      ctx.rotate(ang);
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.9)'; ctx.lineWidth = p.r * 0.85;
      ctx.shadowColor = '#ea580c'; ctx.shadowBlur = 22;
      ctx.beginPath(); ctx.arc(0, 0, p.r * 0.85, -Math.PI * 0.6, Math.PI * 0.6); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = p.r * 0.4; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(0, 0, p.r * 0.85, -Math.PI * 0.4, Math.PI * 0.4); ctx.stroke();
    }
    else if (p.t === 'fist_smash') {
      ctx.shadowColor = '#f97316'; ctx.shadowBlur = 25;
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = 'rgba(249, 115, 22, 0.35)';
      ctx.beginPath(); ctx.arc(0, 0, p.r * 1.1, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#ea580c'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, p.r * 0.95, 0, Math.PI*2); ctx.stroke();
    }
    else if (p.t === 'spear_thrust') {
      ctx.rotate(ang);
      ctx.shadowColor = '#eab308'; ctx.shadowBlur = 20;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(p.r*2.2, 0);
      ctx.lineTo(-p.r*0.6, p.r*0.35);
      ctx.lineTo(-p.r*0.3, 0);
      ctx.lineTo(-p.r*0.6, -p.r*0.35);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(p.r*1.5, 0);
      ctx.lineTo(-p.r*0.1, p.r*0.12);
      ctx.lineTo(-p.r*0.1, -p.r*0.12);
      ctx.closePath(); ctx.fill();
    }
    else if (p.t === 'mace_swing') {
      ctx.globalAlpha = 0.85; ctx.lineCap = 'round';
      ctx.rotate(ang);
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.9)'; ctx.lineWidth = p.r * 0.9;
      ctx.shadowColor = '#9ca3af'; ctx.shadowBlur = 24;
      ctx.beginPath(); ctx.arc(0, 0, p.r * 0.85, -Math.PI * 0.55, Math.PI * 0.55); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = p.r * 0.45; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(0, 0, p.r * 0.85, -Math.PI * 0.4, Math.PI * 0.4); ctx.stroke();
    }
    else if (p.t === 'divine_blade') {
      ctx.globalAlpha = 0.9; ctx.lineCap = 'round';
      ctx.rotate(ang);
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.95)'; ctx.lineWidth = p.r * 1.1;
      ctx.shadowColor = '#eab308'; ctx.shadowBlur = 35;
      ctx.beginPath(); ctx.arc(0, 0, p.r * 0.9, -Math.PI * 0.7, Math.PI * 0.7); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = p.r * 0.55; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(0, 0, p.r * 0.9, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
    }
    else if (p.t === 'magic_bolt') {
      ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 18;
      const g = ctx.createRadialGradient(0,0,1,0,0,p.r * 2.3);
      g.addColorStop(0,'#fff'); g.addColorStop(0.4,'#38bdf8'); g.addColorStop(1,'rgba(56,189,248,0)');
      ctx.beginPath(); ctx.arc(0, 0, p.r * 2.3, 0, Math.PI*2); ctx.fillStyle=g; ctx.fill();
    }
    else if (p.t === 'pyro_fireball' || p.t === 'boss_fireball') {
      ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 24;
      const g = ctx.createRadialGradient(0,0,1,0,0,p.r * 2.8);
      g.addColorStop(0,'#fff'); g.addColorStop(0.3,'#fb923c'); g.addColorStop(0.7,'#ef4444'); g.addColorStop(1,'rgba(239,68,68,0)');
      ctx.beginPath(); ctx.arc(0, 0, p.r * 2.8, 0, Math.PI*2); ctx.fillStyle=g; ctx.fill();
    }
    else if (p.t === 'ice_shard') {
      ctx.rotate(ang + (Date.now() / 50) % (Math.PI*2));
      ctx.shadowColor = '#67e8f9'; ctx.shadowBlur = 16;
      ctx.fillStyle = '#e0f7fa';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        ctx.lineTo(Math.cos(a)*p.r*1.3, Math.sin(a)*p.r*1.3);
        ctx.lineTo(Math.cos(a+Math.PI/6)*p.r*0.5, Math.sin(a+Math.PI/6)*p.r*0.5);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    else if (p.t === 'thunder_spark') {
      ctx.rotate(ang);
      ctx.shadowColor = '#facc15'; ctx.shadowBlur = 20;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-p.r, 0);
      ctx.lineTo(-p.r*0.3, p.r*0.5);
      ctx.lineTo(p.r*0.3, -p.r*0.5);
      ctx.lineTo(p.r*1.2, 0);
      ctx.stroke();
    }
    else if (p.t === 'cosmic_orb') {
      ctx.shadowColor = '#6366f1'; ctx.shadowBlur = 24;
      const g = ctx.createRadialGradient(0,0,1,0,0,p.r * 3.2);
      g.addColorStop(0,'#fff'); g.addColorStop(0.3,'#a5b4fc'); g.addColorStop(0.7,'#4f46e5'); g.addColorStop(1,'rgba(79,70,229,0)');
      ctx.beginPath(); ctx.arc(0, 0, p.r * 3.2, 0, Math.PI*2); ctx.fillStyle=g; ctx.fill();
      ctx.rotate(Date.now() / 200);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(0, 0, p.r*2.2, p.r*0.8, Math.PI/6, 0, Math.PI*2); ctx.stroke();
    }
    else if (p.t === 'time_rift') {
      ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 30;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(0, 0, p.r * 1.2, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(0, 0, p.r * 1.2, 0, Math.PI*2); ctx.stroke();
      ctx.rotate(-Date.now() / 150);
      ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.arc(0, 0, p.r * 1.6, 0, Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
    }
    else if (p.t === 'missile') {
      // Rocket projectile
      ctx.rotate(ang);
      ctx.shadowColor = '#f97316'; ctx.shadowBlur = 10;
      // Body
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath(); ctx.moveTo(p.r, 0); ctx.lineTo(0, p.r*0.6); ctx.lineTo(-p.r*0.8, p.r*0.5); ctx.lineTo(-p.r*0.8, -p.r*0.5); ctx.lineTo(0, -p.r*0.6); ctx.closePath(); ctx.fill();
      // Fins
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.moveTo(-p.r*0.3, p.r*0.5); ctx.lineTo(-p.r*0.8, p.r*1.2); ctx.lineTo(-p.r*0.8, p.r*0.5); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-p.r*0.3, -p.r*0.5); ctx.lineTo(-p.r*0.8, -p.r*1.2); ctx.lineTo(-p.r*0.8, -p.r*0.5); ctx.fill();
      // Exhaust
      const pulse = Math.sin(Date.now() / 30) * 0.5 + 0.5;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.moveTo(-p.r*0.8, p.r*0.3); ctx.lineTo(-p.r*(1.5 + pulse), 0); ctx.lineTo(-p.r*0.8, -p.r*0.3); ctx.fill();
    }
    else if (p.t === 'thrown_bomb') {
      // Thrown bomb
      ctx.rotate(ang + (Date.now()/50)%(Math.PI*2));
      ctx.shadowColor='#ef4444'; ctx.shadowBlur=10;
      ctx.beginPath(); ctx.arc(0, 0, p.r*0.8, 0, Math.PI*2); ctx.fillStyle = '#1e293b'; ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(-p.r*0.2, -p.r*0.2, p.r*0.2, 0, Math.PI*2); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -p.r*0.8); ctx.quadraticCurveTo(p.r*0.5, -p.r*1.2, p.r*0.8, -p.r*1.0); ctx.strokeStyle = '#b45309'; ctx.lineWidth = 2; ctx.stroke();
      // Sparks
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(p.r*0.8 + (Math.random()*4-2), -p.r*1.0 + (Math.random()*4-2), 2, 0, Math.PI*2); ctx.fill();
    }
    else if (p.t === 'net') {
      ctx.rotate(ang + (Date.now()/100)%(Math.PI*2));
      ctx.shadowColor = '#64748b'; ctx.shadowBlur = 10;
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
      for (let i=-1; i<=1; i++) {
        ctx.beginPath(); ctx.moveTo(i*p.r*0.5, -p.r); ctx.lineTo(i*p.r*0.5, p.r); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-p.r, i*p.r*0.5); ctx.lineTo(p.r, i*p.r*0.5); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.stroke();
    }
    else if (p.t === 'fireball') {
      ctx.shadowColor = '#f97316'; ctx.shadowBlur = 20;
      const g = ctx.createRadialGradient(0,0,1,0,0,p.r*2.8);
      g.addColorStop(0,'#fff'); g.addColorStop(0.3,'#fbbf24'); g.addColorStop(0.7,'#f97316'); g.addColorStop(1,'rgba(239,68,68,0)');
      ctx.beginPath(); ctx.arc(0,0,p.r*2.8,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    }
    else if (p.t === 'slime_spit') {
      ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 18;
      const g = ctx.createRadialGradient(0,0,1,0,0,p.r*2.5);
      g.addColorStop(0,'#bbf7d0'); g.addColorStop(0.4,'#4ade80'); g.addColorStop(1,'rgba(21,128,61,0)');
      ctx.beginPath(); ctx.arc(0,0,p.r*2.5,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    }
    else if (p.t === 'melee' || p.t === 'light_slash' || p.t === 'double_slash') {
      ctx.globalAlpha = 0.8; ctx.lineCap = 'round';
      ctx.rotate(ang);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = p.r * 0.55; ctx.shadowColor = '#fff'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(0,0,p.r*0.75,-Math.PI*0.45,Math.PI*0.45); ctx.stroke();
      ctx.strokeStyle = p.t === 'double_slash' ? '#fb923c' : '#fcd34d'; ctx.lineWidth = p.r * 0.28; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(0,0,p.r*0.75,-Math.PI*0.3,Math.PI*0.3); ctx.stroke();
    }
    else if (p.t === 'pierce') {
      ctx.rotate(ang);
      ctx.shadowColor = '#cbd5e1'; ctx.shadowBlur = 15;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.moveTo(p.r*1.5, 0); ctx.lineTo(-p.r, p.r*0.4); ctx.lineTo(-p.r*0.6, 0); ctx.lineTo(-p.r, -p.r*0.4); ctx.fill();
    }
    else if (p.t === 'spin') {
      const rot = (Date.now() / 60) % (Math.PI*2);
      ctx.rotate(rot);
      ctx.globalAlpha = 0.6; ctx.lineWidth = 4; ctx.strokeStyle = '#94a3b8';
      ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-p.r,0); ctx.lineTo(p.r,0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,-p.r); ctx.lineTo(0,p.r); ctx.stroke();
    }
    else if (p.t === 'dark_orb') {
      ctx.shadowColor = '#9333ea'; ctx.shadowBlur = 15;
      const g = ctx.createRadialGradient(0,0,1,0,0,p.r*2);
      g.addColorStop(0,'#d8b4fe'); g.addColorStop(0.5,'#7e22ce'); g.addColorStop(1,'rgba(126,34,206,0)');
      ctx.beginPath(); ctx.arc(0,0,p.r*2,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    }
    else if (p.t === 'fire_breath') {
      ctx.shadowColor = '#dc2626'; ctx.shadowBlur = 12;
      ctx.globalAlpha = 0.7; ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.fill();
    }
    else if (p.t === 'phoenix_feather') {
      ctx.rotate(ang);
      ctx.shadowColor = '#facc15'; ctx.shadowBlur = 10;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.ellipse(0, 0, p.r*1.2, p.r*0.4, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.ellipse(0, 0, p.r*0.8, p.r*0.2, 0, 0, Math.PI*2); ctx.fill();
    }
    else if (p.t === 'ground_smash') {
      ctx.shadowColor = '#b45309'; ctx.shadowBlur = 20;
      ctx.globalAlpha = 0.5; ctx.fillStyle = '#d97706';
      ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#fcd34d'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0,0,p.r*0.8,0,Math.PI*2); ctx.stroke();
    }
    else if (p.t === 'laser_beam') {
      ctx.rotate(ang);
      ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 25;
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(-p.r, -p.r*0.3, p.r*4, p.r*0.6);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-p.r, -p.r*0.1, p.r*4, p.r*0.2);
    }
    else if (p.t === 'net') {
      ctx.rotate(ang);
      ctx.strokeStyle = '#d4d4d8'; ctx.lineWidth = 2;
      ctx.beginPath();
      for(let i=-p.r; i<=p.r; i+=8) {
        ctx.moveTo(i, -p.r); ctx.lineTo(i, p.r);
        ctx.moveTo(-p.r, i); ctx.lineTo(p.r, i);
      }
      ctx.stroke();
      ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.stroke();
    }
    else if (p.t === 'omega_bolt') {
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 22;
      const g=ctx.createRadialGradient(0,0,1,0,0,p.r*3);
      g.addColorStop(0,'#fff');g.addColorStop(0.5,'#fbbf24');g.addColorStop(1,'rgba(251,191,36,0)');
      ctx.beginPath();ctx.arc(0,0,p.r*3,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
    }
    ctx.restore();
  });
}

function drawSpeechBubble(ctx, x, y, text, alpha = 1.0) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "bold 13px 'Outfit', sans-serif";
  const metrics = ctx.measureText(text);
  const padX = 14;
  const padY = 8;
  const w = metrics.width + padX * 2;
  const h = 26;
  const bx = x - w / 2;
  const by = y - h - 12;

  // Glassmorphic bubble background
  ctx.fillStyle = 'rgba(8, 14, 32, 0.9)';
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 8;

  // Draw rounded bubble rect
  roundRect(ctx, bx, by, w, h, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();

  // Draw tail/pointer
  ctx.beginPath();
  ctx.moveTo(x - 6, by + h);
  ctx.lineTo(x, by + h + 8);
  ctx.lineTo(x + 6, by + h);
  ctx.closePath();
  ctx.fillStyle = 'rgba(8, 14, 32, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
  ctx.beginPath();
  ctx.moveTo(x - 6, by + h);
  ctx.lineTo(x, by + h + 8);
  ctx.lineTo(x + 6, by + h);
  ctx.stroke();

  // Text
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, by + h / 2 + 1);
  ctx.restore();
}

function drawEmote(ctx, x, y, emote, stn, slw) {
  let emoji = null;
  if (stn) {
    emoji = '😭';
  } else if (slw) {
    emoji = '😢';
  } else if (emote === 'happy') {
    emoji = '🤣';
  } else if (emote === 'angry') {
    emoji = '💢';
  } else if (emote === 'scared') {
    emoji = '😨';
  }

  if (!emoji) return;

  ctx.save();
  const bobY = Math.sin(Date.now() / 150) * 3;
  ctx.translate(x + 22, y - bobY);
  
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(8, 14, 32, 0.85)';
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();

  ctx.font = '16px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 0, 1);
  ctx.restore();
}

// ══════════════════════════════════════════════════════════════
//  CHARACTER DRAWING — Full 10-Stage Animation System
// ══════════════════════════════════════════════════════════════
function drawCharacter(sp, cp) {
  let skin = SKINS[sp.lvl] || SKINS[1];
  if (sp.lvl >= 5 && sp.brnch) {
    skin = BRANCH_SKINS[sp.brnch]?.[sp.lvl] || skin;
  }
  const r    = sp.radius;
  const t    = Date.now();
  const isMe = sp.id === myId;
  const hitFlash   = (t - cp.lastHit) < 175;
  // BUG-002 FIX: server now sends vx/vy; also detect from angle change
  const moving = sp.vx !== 0 || sp.vy !== 0;

  ctx.save();
  if (sp.stealth) {
    ctx.globalAlpha = 0.5;
  }
  ctx.translate(cp.x, cp.y);

  // Dash trail when speed-boosted (server sends `spd` now via vx/vy being non-zero + rage)
  if (moving && sp.rage && Math.random() < 0.35) emitDashTrail(cp.x, cp.y, '#ef4444');
  if (moving && sp.dash && Math.random() < 0.6) emitDashTrail(cp.x, cp.y, '#38bdf8');
  if (moving && !sp.dash && Math.random() < 0.12) emitDashTrail(cp.x, cp.y, skin.body1);

  // Ground shadow
  ctx.beginPath(); ctx.ellipse(0,r-2,r*0.88,8,0,0,Math.PI*2); ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fill();

  // Omega gravity ring (Lv10)
  if (sp.lvl === 10) drawOmegaRing(ctx, r, t);

  // Aura ring (Lv2+)
  if (sp.lvl >= 2 && skin.aura) drawAuraRing(ctx, r, skin.aura, sp.lvl, t);

  // Boss fire ring (Lv6+)
  if (sp.lvl >= 6) drawBossFireRing(ctx, r, t, sp.lvl);

  // Shadow blink ghost (Lv8)
  if (sp.lvl === 8 && moving) drawShadowGhost(ctx, r, t, cp);

  // Waddle + Breathe
  const breathY = Math.sin(t/190)*0.048;
  let squashX = 1 + breathY;
  let squashY = 1 - breathY;
  let waddleA = moving ? Math.sin(t/(75+sp.lvl*8))*0.15 : 0;

  // Attack animation state
  const now = Date.now();
  let attacking = false;
  let attackProgress = 0;
  if (cp.attackAnim) {
    const elapsed = now - cp.attackAnim.t;
    if (elapsed < cp.attackAnim.duration) {
      attacking = true;
      attackProgress = elapsed / cp.attackAnim.duration;
    } else {
      delete cp.attackAnim;
    }
  }

  ctx.save();
  
  // Character specific attack transformations on the body
  if (attacking) {
    if (sp.brnch === 'assassin') {
      // Assassin: dash forward slightly & tilt
      const dashDist = Math.sin(attackProgress * Math.PI) * r * 0.35;
      ctx.translate(dashDist, 0);
      ctx.rotate(-Math.sin(attackProgress * Math.PI) * 0.2);
    } else if (sp.brnch === 'fighter') {
      // Fighter: heavy forward rotation swing
      const swingTilt = Math.sin(attackProgress * Math.PI) * 0.25;
      ctx.rotate(swingTilt);
    } else if (sp.brnch === 'mage') {
      // Mage: tilt body forward slightly
      const tilt = Math.sin(attackProgress * Math.PI) * 0.15;
      ctx.rotate(tilt);
    } else {
      // Base: squash & stretch nảy người
      const sq = Math.sin(attackProgress * Math.PI) * 0.28;
      squashX *= (1 + sq);
      squashY *= (1 - sq);
    }
  }

  ctx.scale(squashX, squashY);
  ctx.rotate(waddleA);

  // Behind-body attachments
  if (sp.brnch === 'assassin') drawCloak(ctx, r);
  if (skin.skinType==='demon'  || sp.lvl===5) drawDemonWings(ctx,r,t);
  if (skin.skinType==='shadow' || sp.lvl===8) drawShadowAura(ctx,r,t);
  if (skin.skinType==='dragon' || sp.lvl===7) drawDragonWings(ctx,r,t);

  // Body sphere
  ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2);
  if (hitFlash) {
    ctx.fillStyle='#ffffff';
  } else if (sp.rage) {
    // Rage: pulsing red gradient
    const rp=0.6+Math.sin(t/60)*0.4;
    const g=ctx.createRadialGradient(-r*.35,-r*.38,r*.06,0,0,r);
    g.addColorStop(0,skin.bodyHL); g.addColorStop(0.5,`rgba(239,68,68,${rp})`); g.addColorStop(1,skin.body2);
    ctx.fillStyle=g;
  } else {
    const g=ctx.createRadialGradient(-r*.38,-r*.4,r*.06,0,0,r);
    g.addColorStop(0,skin.bodyHL); g.addColorStop(0.5,skin.body1); g.addColorStop(1,skin.body2);
    ctx.fillStyle=g;
  }
  ctx.fill();
  ctx.strokeStyle = hitFlash ? '#ff2222' : sp.shld ? '#22d3ee' : skin.outline;
  ctx.lineWidth = sp.lvl >= 6 ? 5 : 4;
  ctx.stroke();

  // Front-body attachments
  if      (skin.skinType==='leaf')      drawLeaf(ctx,r,t);
  else if (skin.skinType==='horns')     drawHorns(ctx,r);
  else if (skin.skinType==='neko')      drawNekoEars(ctx,r,skin);
  else if (skin.skinType==='panda')     drawPandaEars(ctx,r,skin);
  else if (skin.skinType==='demon')     drawDemonHorns(ctx,r);
  else if (skin.skinType==='boss')      drawCrown(ctx,r,t);
  else if (skin.skinType==='dragon')    drawDragonHorns(ctx,r,t);
  else if (skin.skinType==='shadow')    drawShadowMask(ctx,r,t);
  else if (skin.skinType==='celestial') drawHalo(ctx,r,t);
  else if (skin.skinType==='omega')     drawOmegaSymbol(ctx,r,t);

  // Branch equipments
  if (sp.brnch === 'assassin') {
    drawShuriken(ctx, r, t, attacking, attackProgress);
  } else if (sp.brnch === 'fighter') {
    drawFighterSword(ctx, r, attacking, attackProgress);
    drawFighterShield(ctx, r, attacking, attackProgress);
  } else if (sp.brnch === 'mage') {
    drawMageHat(ctx, r);
    drawMageStaff(ctx, r, t, attacking, attackProgress);
  }

  // BUG-009 FIX: Correct 2-eye drawing
  drawEyes(ctx, r, cp, sp, skin, t);

  if (sp.lvl <= 4) drawCheeks(ctx, r);

  ctx.restore(); // waddle

  // Status overlays (not rotated)
  if (sp.stn)  drawStunStars(ctx,r,t);
  if (sp.shld) drawShieldHex(ctx,r,t);
  if (sp.slw)  drawSlowRings(ctx,r,t);
  if (sp.rage) drawRageFlames(ctx,r,t);

  ctx.restore(); // translate

  drawNameplate(ctx, cp, sp, r, isMe);
  if (sp.bnty) {
    drawBountyIndicator(ctx, cp, r, t);
  }

  // Draw chat bubble if active
  if (cp.chatText && cp.chatTTL > 0) {
    const bubbleY = cp.y - r - 35;
    drawSpeechBubble(ctx, cp.x, bubbleY, cp.chatText, Math.min(1.0, cp.chatTTL / 20));
  }

  // Draw emote if active
  drawEmote(ctx, cp.x, cp.y - r - 25, sp.emote, sp.stn, sp.slw);
}

// ─── Eye Drawing (FIXED — 2 eyes at correct horizontal positions)
function drawEyes(ctx, r, cp, sp, skin, t) {
  ctx.save();
  // Rotate face toward nearest interpolated enemy
  let faceAng = sp.a;
  let minD = 500;
  Object.values(serverPlayers).forEach(other => {
    if (other.id === sp.id) return;
    const cp2 = currentPlayers[other.id];
    if (!cp2) return;
    const d = Math.hypot(cp2.x - cp.x, cp2.y - cp.y);
    if (d < minD) { minD = d; faceAng = Math.atan2(cp2.y - cp.y, cp2.x - cp.x); }
  });
  ctx.rotate(faceAng);

  const eyeSpread = r * 0.34;  // half-distance between eyes
  const eyeFwd    = r * 0.4;   // forward distance from center
  const eyeR      = r * 0.18;  // eye radius
  const pupR      = r * 0.09;  // pupil radius

  // Draw left and right eyes at correct positions
  [[-eyeSpread],[eyeSpread]].forEach(([ey]) => {
    // White sclera
    ctx.beginPath(); ctx.arc(eyeFwd, ey, eyeR, 0, Math.PI*2);
    ctx.fillStyle='#fff'; ctx.fill();
    ctx.strokeStyle=skin.outline; ctx.lineWidth=2; ctx.stroke();
    // Colored pupil (slightly forward-offset)
    ctx.beginPath(); ctx.arc(eyeFwd + 2, ey, pupR, 0, Math.PI*2);
    ctx.fillStyle=skin.eye; ctx.fill();
    // Highlight sparkle
    ctx.beginPath(); ctx.arc(eyeFwd + pupR*0.4, ey - pupR*0.5, pupR*0.42, 0, Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.fill();
    // Angry eyebrows for Lv4+
    if (sp.lvl >= 4) {
      ctx.strokeStyle=skin.outline; ctx.lineWidth=2.5; ctx.lineCap='round';
      const bx1 = eyeFwd - eyeR*0.9, bx2 = eyeFwd + eyeR*0.9;
      const by1 = ey - eyeR - 2, by2 = ey - eyeR + (ey<0?4:-4);
      ctx.beginPath(); ctx.moveTo(bx1, by1); ctx.lineTo(bx2, by2); ctx.stroke();
    }
  });
  ctx.restore();
}

// ─── Aura Ring
function drawAuraRing(ctx,r,color,lvl,t) {
  const pulse=r+14+Math.sin(t/110)*5;
  ctx.save();
  if (lvl>=5) { ctx.rotate((t/700)%(Math.PI*2)); ctx.setLineDash([9,7]); }
  ctx.beginPath(); ctx.arc(0,0,pulse,0,Math.PI*2);
  ctx.strokeStyle=color; ctx.lineWidth=3+Math.sin(t/80); ctx.globalAlpha=0.5+Math.sin(t/95)*0.18;
  ctx.shadowColor=color; ctx.shadowBlur=14; ctx.stroke(); ctx.setLineDash([]); ctx.restore();
}

// ─── Boss Fire Ring
function drawBossFireRing(ctx,r,t,lvl) {
  const count = 6 + Math.min(8, lvl - 5);
  const ringR = r + 18 + (lvl-6)*4;
  const rot=(t/480)%(Math.PI*2);
  for(let i=0;i<count;i++){
    const a=rot+(Math.PI*2/count)*i;
    const fx=Math.cos(a)*ringR,fy=Math.sin(a)*ringR;
    const fs=8+Math.sin(t/100+i)*3;
    const g=ctx.createRadialGradient(fx,fy,1,fx,fy,fs*1.6);
    g.addColorStop(0,'#fff');g.addColorStop(0.4,'#fbbf24');g.addColorStop(1,'rgba(249,115,22,0)');
    ctx.beginPath();ctx.arc(fx,fy,fs*1.6,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
  }
}

// ─── Omega Gravity Ring (Lv10)
function drawOmegaRing(ctx,r,t) {
  const rot=(t/300)%(Math.PI*2);
  for(let ring=0;ring<3;ring++){
    ctx.save(); ctx.rotate(rot+ring*(Math.PI*2/3));
    ctx.beginPath(); ctx.arc(0,0,r+22+ring*14,0,Math.PI*2);
    ctx.strokeStyle=`rgba(251,191,36,${0.6-ring*0.15})`; ctx.lineWidth=3-ring*0.5;
    ctx.setLineDash([12,8]); ctx.shadowColor='#fbbf24'; ctx.shadowBlur=10; ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }
}

// ─── Shadow Ghost (Lv8 blink afterimage)
function drawShadowGhost(ctx,r,t,cp) {
  ctx.save(); ctx.globalAlpha=0.2+Math.sin(t/80)*0.1;
  ctx.translate(-cp.vx*18||0, -cp.vy*18||0);
  ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2);
  ctx.fillStyle='#6d28d9'; ctx.fill(); ctx.restore();
}

// ─── Demon Wings
function drawDemonWings(ctx,r,t) {
  const flap=Math.sin(t/95)*0.25;
  ctx.fillStyle='#1e1b4b'; ctx.strokeStyle='#0f0e26'; ctx.lineWidth=2.5;
  [-1,1].forEach(s=>{
    ctx.save(); ctx.translate(s*r*.65,-r*.15); ctx.rotate(s*(-Math.PI/5+flap));
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(s*-r*.95,-r*.5); ctx.lineTo(s*-r*.8,r*.1); ctx.lineTo(s*-r*.4,r*.28); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.restore();
  });
}

// ─── Dragon Wings (Lv7)
function drawDragonWings(ctx,r,t) {
  const flap=Math.sin(t/80)*0.3;
  ctx.fillStyle='#7f1d1d'; ctx.strokeStyle='#450a0a'; ctx.lineWidth=2.5;
  [-1,1].forEach(s=>{
    ctx.save(); ctx.translate(s*r*.72,-r*.1); ctx.rotate(s*(-Math.PI/4+flap));
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(s*-r*1.2,-r*.65); ctx.lineTo(s*-r*.8,r*.1);
    ctx.quadraticCurveTo(s*-r*.5,r*.3,0,r*.1);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Wing membrane lines
    ctx.strokeStyle='rgba(239,68,68,0.4)'; ctx.lineWidth=1;
    for(let wi=1;wi<=3;wi++){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(s*-r*.4*wi,-r*.2*wi);ctx.stroke();}
    ctx.restore();
  });
}

// ─── Shadow Aura (Lv8)
function drawShadowAura(ctx,r,t) {
  ctx.save(); ctx.globalAlpha=0.3+Math.sin(t/60)*0.15;
  const tentacles=6;
  for(let i=0;i<tentacles;i++){
    const a=(Math.PI*2/tentacles)*i+(t/400);
    const len=r*1.4+Math.sin(t/80+i)*r*0.4;
    ctx.strokeStyle='#6d28d9'; ctx.lineWidth=3; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);
    ctx.lineTo(Math.cos(a)*len,Math.sin(a)*len); ctx.stroke();
  }
  ctx.restore();
}

// ─── Halo (Lv9 Celestial)
function drawHalo(ctx,r,t) {
  ctx.save(); ctx.translate(0,-r-8); ctx.rotate((t/600)%(Math.PI*2));
  const g=ctx.createRadialGradient(0,0,5,0,0,r*.75);
  g.addColorStop(0,'rgba(255,255,255,0.8)'); g.addColorStop(1,'rgba(129,140,248,0)');
  ctx.beginPath(); ctx.ellipse(0,0,r*.75,r*.18,0,0,Math.PI*2);
  ctx.fillStyle=g; ctx.fill();
  ctx.strokeStyle='rgba(199,210,254,0.9)'; ctx.lineWidth=3;
  ctx.shadowColor='#818cf8'; ctx.shadowBlur=12; ctx.stroke();
  // Stars on halo
  for(let i=0;i<6;i++){const a=(Math.PI*2/6)*i;starPath(ctx,Math.cos(a)*r*.55,Math.sin(a)*r*.18*0.7,5,2.5,5);ctx.fillStyle='#e0e7ff';ctx.fill();}
  ctx.restore();
}

// ─── Omega Symbol (Lv10)
function drawOmegaSymbol(ctx,r,t) {
  ctx.save(); ctx.translate(0,-r-20);
  const sparkle=0.7+Math.sin(t/100)*0.3;
  ctx.font=`bold ${r*.85}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle=`rgba(251,191,36,${sparkle})`; ctx.shadowColor='#fbbf24'; ctx.shadowBlur=20;
  ctx.fillText('Ω',0,0); ctx.restore();
}

// ─── Dragon Horns (Lv7)
function drawDragonHorns(ctx,r,t) {
  ctx.fillStyle='#dc2626'; ctx.strokeStyle='#450a0a'; ctx.lineWidth=2.5;
  [-1,1].forEach(s=>{
    ctx.save(); ctx.translate(s*r*.5,-r*.55);
    ctx.beginPath(); ctx.moveTo(-8,12); ctx.lineTo(s*-3,-20); ctx.lineTo(s*5,-30); ctx.lineTo(s*8,-18); ctx.lineTo(8,12); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.restore();
  });
}

// ─── Shadow Mask (Lv8)
function drawShadowMask(ctx,r,t) {
  ctx.save();
  // Dark void effect around face
  ctx.globalAlpha=0.4+Math.sin(t/120)*0.2;
  ctx.fillStyle='#1e1b4b'; ctx.beginPath();
  ctx.arc(r*.3,-r*.15,r*.35,0,Math.PI*2); ctx.fill();
  // Glowing eyes
  ctx.globalAlpha=1; ctx.shadowColor='#c084fc'; ctx.shadowBlur=18;
  ctx.fillStyle='#c084fc';
  [{y:-r*.25},{y:r*.05}].forEach(({y})=>{
    ctx.beginPath(); ctx.ellipse(r*.35,y,r*.13,r*.07,0,0,Math.PI*2); ctx.fill();
  });
  ctx.restore();
}

// ─── Leaf (Lv1)
function drawLeaf(ctx,r,t) {
  ctx.save(); ctx.translate(0,-r*.88); ctx.rotate(Math.sin(t/260)*0.2);
  ctx.fillStyle='#22c55e'; ctx.strokeStyle='#052e16'; ctx.lineWidth=2;
  ctx.save();ctx.rotate(-0.4);ctx.beginPath();ctx.ellipse(-5,-9,8,4,-0.3,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
  ctx.save();ctx.rotate(0.4);ctx.beginPath();ctx.ellipse(5,-9,8,4,0.3,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
  ctx.strokeStyle='#4ade80';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-7);ctx.stroke();
  ctx.restore();
}

// ─── Horns (Lv2)
function drawHorns(ctx,r) {
  ctx.fillStyle='#e2e8f0';ctx.strokeStyle='#1e293b';ctx.lineWidth=2.5;
  [[-1],[1]].forEach(([s])=>{
    ctx.save();ctx.translate(s*r*.52,-r*.62);
    ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(s*13,-17,s*8,-28);ctx.quadraticCurveTo(s*4,-17,0,0);ctx.closePath();
    ctx.fill();ctx.stroke();ctx.restore();
  });
}

// ─── Neko Ears (Lv3)
function drawNekoEars(ctx,r,skin) {
  ctx.fillStyle=skin.body1;ctx.strokeStyle=skin.outline;ctx.lineWidth=3;
  [[-1],[1]].forEach(([s])=>{
    ctx.save();ctx.translate(s*r*.74,-r*.56);
    ctx.beginPath();ctx.moveTo(-12,10);ctx.lineTo(s*-3,-17);ctx.lineTo(12,10);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#fbcfe8';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-6,6);ctx.lineTo(0,-8);ctx.lineTo(6,6);ctx.closePath();ctx.fill();
    ctx.restore();
  });
}

// ─── Panda Ears (Lv4)
function drawPandaEars(ctx,r,skin) {
  ctx.fillStyle='#1c0303';ctx.strokeStyle=skin.outline;ctx.lineWidth=3;
  [-r*.63,r*.63].forEach(ex=>{
    ctx.beginPath();ctx.arc(ex,-r*.72,11,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#7f1d1d';ctx.beginPath();ctx.arc(ex,-r*.72,5,0,Math.PI*2);ctx.fill();
  });
}

// ─── Demon Horns (Lv5)
function drawDemonHorns(ctx,r) {
  ctx.fillStyle='#ef4444';ctx.strokeStyle='#000';ctx.lineWidth=2.5;
  [-1,1].forEach(s=>{ctx.save();ctx.translate(s*r*.42,-r*.67);ctx.beginPath();ctx.moveTo(-6,10);ctx.lineTo(s*-4,-15);ctx.lineTo(6,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();});
}

// ─── Crown (Lv6)
function drawCrown(ctx,r,t) {
  ctx.save();ctx.translate(0,-r*.9);
  const sparkle=0.85+Math.sin(t/110)*0.15;
  ctx.fillStyle=`rgba(251,191,36,${sparkle})`;ctx.strokeStyle='#451a03';ctx.lineWidth=3.5;
  ctx.beginPath();ctx.moveTo(-25,4);ctx.lineTo(-25,-7);ctx.lineTo(-17,-24);ctx.lineTo(-6,-11);ctx.lineTo(0,-32);ctx.lineTo(6,-11);ctx.lineTo(17,-24);ctx.lineTo(25,-7);ctx.lineTo(25,4);ctx.closePath();ctx.fill();ctx.stroke();
  [[-14,-16],[0,-26],[14,-16]].forEach(([gx,gy])=>{ctx.fillStyle='#ef4444';ctx.beginPath();ctx.arc(gx,gy,3.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#7f1d1d';ctx.lineWidth=1.5;ctx.stroke();});
  [[-17,-24],[0,-32],[17,-24]].forEach(([sx,sy])=>{ctx.fillStyle='#fbbf24';ctx.beginPath();ctx.arc(sx,sy,4.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#92400e';ctx.lineWidth=1.5;ctx.stroke();});
  ctx.restore();
}

// ─── Assassin Cloak (Behind body)
function drawCloak(ctx, r) {
  ctx.save();
  ctx.fillStyle = '#7c2d12'; // Crimson red cloak
  ctx.strokeStyle = '#431407';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, r * 0.3);
  ctx.bezierCurveTo(-r * 1.3, r * 1.5, -r * 0.5, r * 1.8, 0, r * 1.6);
  ctx.bezierCurveTo(r * 0.5, r * 1.8, r * 1.3, r * 1.5, r * 0.7, r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ─── Assassin Shuriken (Front side)
function drawShuriken(ctx, r, t, attacking = false, attackProgress = 0) {
  ctx.save();
  if (attacking) {
    // Projectile throwing animation: moves forward and back
    const throwX = r * 1.15 + Math.sin(attackProgress * Math.PI) * r * 0.9;
    const throwY = r * 0.25 - Math.sin(attackProgress * Math.PI) * r * 0.15;
    ctx.translate(throwX, throwY);
    // Spins extremely fast
    ctx.rotate((t / 35) % (Math.PI * 2));
    // Scale up slightly during mid-air
    const scale = 1 + Math.sin(attackProgress * Math.PI) * 0.35;
    ctx.scale(scale, scale);
  } else {
    ctx.translate(r * 1.15, r * 0.25);
    ctx.rotate((t / 120) % (Math.PI * 2)); // Spin fast
  }
  ctx.fillStyle = '#94a3b8'; // Steel gray
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.moveTo(0, 0);
    ctx.lineTo(-3, -r * 0.2);
    ctx.lineTo(0, -r * 0.45);
    ctx.lineTo(3, -r * 0.2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Core hole
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.restore();
}

// ─── Fighter Sword (Front side)
function drawFighterSword(ctx, r, attacking = false, attackProgress = 0) {
  ctx.save();
  if (attacking) {
    // Swing sword in a nice arc from back to front
    const swingAngle = Math.PI / 4 - Math.PI / 2 + attackProgress * Math.PI * 1.35;
    const swingX = r * 1.05 + Math.sin(attackProgress * Math.PI) * r * 0.3;
    const swingY = -r * 0.15 - Math.sin(attackProgress * Math.PI) * r * 0.2;
    ctx.translate(swingX, swingY);
    ctx.rotate(swingAngle);
  } else {
    ctx.translate(r * 1.05, -r * 0.15);
    ctx.rotate(Math.PI / 4 + Math.sin(Date.now() / 350) * 0.08); // Breathing idle angle
  }
  // Blade
  ctx.fillStyle = '#f1f5f9';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-3.5, 0);
  ctx.lineTo(-3.5, -r * 1.1);
  ctx.lineTo(0, -r * 1.35);
  ctx.lineTo(3.5, -r * 1.1);
  ctx.lineTo(3.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Crossguard
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-11, -3, 22, 5);
  ctx.strokeRect(-11, -3, 22, 5);
  // Handle & Pommel
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-2.5, 2, 5, r * 0.35);
  ctx.beginPath();
  ctx.arc(0, 2 + r * 0.35, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ─── Fighter Shield (Front side)
function drawFighterShield(ctx, r, attacking = false, attackProgress = 0) {
  ctx.save();
  if (attacking) {
    // Shield blocks forward, moving outwards slightly
    const shieldX = -r * 1.1 - attackProgress * r * 0.15;
    const shieldY = r * 0.15 - attackProgress * r * 0.08;
    ctx.translate(shieldX, shieldY);
    ctx.rotate(-Math.PI / 8 - attackProgress * Math.PI * 0.2);
  } else {
    ctx.translate(-r * 1.1, r * 0.15);
    ctx.rotate(-Math.PI / 8);
  }
  ctx.fillStyle = '#64748b'; // Iron shield body
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, -r * 0.35);
  ctx.lineTo(r * 0.45, -r * 0.35);
  ctx.quadraticCurveTo(r * 0.45, r * 0.3, 0, r * 0.75);
  ctx.quadraticCurveTo(-r * 0.45, r * 0.3, -r * 0.45, -r * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Center crest decoration
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ─── Mage Hat (Top head)
function drawMageHat(ctx, r) {
  ctx.save();
  ctx.translate(0, -r * 0.82);
  // Brim
  ctx.fillStyle = '#4c1d95'; // Mage purple hat
  ctx.strokeStyle = '#1e1b4b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.15, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Hat cone shape
  ctx.beginPath();
  ctx.moveTo(-r * 0.65, -2);
  ctx.bezierCurveTo(-r * 0.5, -r * 1.35, -r * 0.1, -r * 1.6, r * 0.2, -r * 1.7);
  ctx.bezierCurveTo(r * 0.1, -r * 1.2, r * 0.3, -r * 0.7, r * 0.55, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Golden belt band
  ctx.fillStyle = '#eab308';
  ctx.fillRect(-r * 0.42, -5, r * 0.84, 5);
  ctx.restore();
}

// ─── Mage Staff (Front side)
function drawMageStaff(ctx, r, t, attacking = false, attackProgress = 0) {
  ctx.save();
  if (attacking) {
    // Staff points and extends forward
    const staffX = r * 1.05 + attackProgress * r * 0.4;
    const staffY = -r * 0.15 - attackProgress * r * 0.25;
    ctx.translate(staffX, staffY);
    ctx.rotate(attackProgress * Math.PI * 0.3);
  } else {
    ctx.translate(r * 1.05, -r * 0.15);
  }
  // Wooden staff base
  ctx.fillStyle = '#78350f';
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-3, 0, 6, r * 1.35);
  ctx.strokeRect(-3, 0, 6, r * 1.35);
  // Scepter crown/gem holder
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, -r * 0.1, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Floating glowing core gem
  const crystalGlow = Math.sin(t / 180) * 0.15 + 0.95;
  ctx.save();
  ctx.translate(0, -r * 0.28);
  ctx.scale(crystalGlow, crystalGlow);
  ctx.fillStyle = '#22d3ee'; // Sky blue cyan crystal gem
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.22);
  ctx.lineTo(r * 0.14, 0);
  ctx.lineTo(0, r * 0.22);
  ctx.lineTo(-r * 0.14, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Magical flash on the crystal when attacking
  if (attacking) {
    ctx.save();
    ctx.translate(0, -r * 0.28);
    const flashSize = r * 0.65 * (1 - attackProgress);
    const flashGlow = ctx.createRadialGradient(0, 0, 1, 0, 0, flashSize);
    flashGlow.addColorStop(0, '#fff');
    flashGlow.addColorStop(0.3, '#22d3ee');
    flashGlow.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = flashGlow;
    ctx.beginPath();
    ctx.arc(0, 0, flashSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// ─── Cheeks
function drawCheeks(ctx,r) {
  ctx.save();ctx.globalAlpha=0.45;ctx.fillStyle='#f9a8d4';
  ctx.beginPath();ctx.ellipse(-r*.52,r*.26,r*.23,r*.15,-0.2,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(r*.52,r*.26,r*.23,r*.15,0.2,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

// ─── Stun Stars
function drawStunStars(ctx,r,t) {
  ctx.save();ctx.translate(0,-r-20);ctx.rotate((t/270)%(Math.PI*2));
  for(let i=0;i<3;i++){const a=(Math.PI*2/3)*i;ctx.font='15px serif';ctx.fillText('⭐',Math.cos(a)*20-7,Math.sin(a)*10+4);}
  ctx.restore();
}

// ─── Shield Hex
function drawShieldHex(ctx,r,t) {
  ctx.save();
  const pulse = 0.6 + Math.sin(t/150)*0.2;
  const sr = r + 15 + Math.sin(t/100)*2;
  
  // Glass sphere body
  const g = ctx.createRadialGradient(sr*0.3, -sr*0.3, 0, 0, 0, sr);
  g.addColorStop(0, 'rgba(255,255,255,0.4)');
  g.addColorStop(0.5, 'rgba(56,189,248,0.15)');
  g.addColorStop(0.8, 'rgba(14,165,233,0.3)');
  g.addColorStop(1, 'rgba(2,132,199,0.6)');
  
  ctx.beginPath(); ctx.arc(0, 0, sr, 0, Math.PI*2);
  ctx.fillStyle = g; ctx.fill();
  
  // High-tech rotating rings inside
  ctx.rotate((t/800) % (Math.PI*2));
  ctx.strokeStyle = `rgba(125,211,252,${pulse})`;
  ctx.lineWidth = 1.5; ctx.setLineDash([12, 8]);
  ctx.stroke();
  
  ctx.rotate(-(t/400) % (Math.PI*2));
  ctx.strokeStyle = `rgba(186,230,253,${pulse*0.7})`;
  ctx.setLineDash([25, 15, 5, 15]);
  ctx.stroke();
  
  ctx.restore();
}

// ─── Slow Rings
function drawSlowRings(ctx,r,t) {
  ctx.save();const phase=(t/380)%1;
  [0,0.5].forEach(off=>{const p=(phase+off)%1;ctx.beginPath();ctx.arc(0,r*.65,r*(0.5+p*.5),0,Math.PI*2);ctx.strokeStyle=`rgba(96,165,250,${(1-p)*.65})`;ctx.lineWidth=2.5;ctx.stroke();});
  ctx.restore();
}

// ─── Rage Flames
function drawRageFlames(ctx,r,t) {
  ctx.save();ctx.globalAlpha=0.7;
  for(let i=0;i<8;i++){
    const a=(Math.PI*2/8)*i+(t/200);
    const fx=Math.cos(a)*r,fy=Math.sin(a)*r;
    const fsize=8+Math.sin(t/80+i)*4;
    const g=ctx.createRadialGradient(fx,fy,1,fx,fy,fsize);
    g.addColorStop(0,'#fff');g.addColorStop(0.5,'#ef4444');g.addColorStop(1,'rgba(239,68,68,0)');
    ctx.beginPath();ctx.arc(fx,fy,fsize,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
  }
  ctx.restore();
}

// ─── Nameplate + HP + XP minibar
function drawNameplate(ctx, cp, sp, r, isMe) {
  const x = cp.x, y = cp.y;
  const barW = Math.max(50, 40 + r * 0.65);
  const barH = 10;
  const barX = x - barW/2;
  const barY = y - r - 14;
  const labelY = y - r - 26;
  const skin = SKINS[sp.lvl] || SKINS[1];

  ctx.save();

  // Level badge shield
  const bdgX = x - barW/2 - 18;
  ctx.fillStyle = skin.aura || skin.body1;
  ctx.beginPath(); ctx.moveTo(bdgX,labelY-6); ctx.lineTo(bdgX+14,labelY-6); ctx.lineTo(bdgX+14,labelY+8); ctx.lineTo(bdgX+7,labelY+14); ctx.lineTo(bdgX,labelY+8); ctx.closePath();
  ctx.fill(); ctx.strokeStyle='#000'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.fillStyle='#000'; ctx.font='bold 9px Outfit'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(sp.lvl, bdgX+7, labelY+4);

  // Name text
  ctx.font = `bold ${isMe?15:12}px 'Outfit',sans-serif`;
  ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  let label = sp.n;
  if (sp.lvl >= 9)      label = `✨ ${sp.n}`;
  else if (sp.lvl >= 6) label = `👑 ${sp.n}`;
  // Bot emoji removed to make bots look like real players
  ctx.fillStyle = isMe ? '#67e8f9' : sp.rage ? '#fca5a5' : '#f3f4f6';
  ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=6;
  ctx.fillText(label, x, labelY);

  // HP bar background
  ctx.fillStyle='rgba(0,0,0,0.6)'; roundRect(ctx,barX,barY,barW,barH,5); ctx.fill();

  // HP fill
  const hpPct = Math.max(0, Math.min(1, (sp.hp||0) / (sp.mhp||1)));
  if (hpPct > 0) {
    ctx.save(); ctx.beginPath(); roundRect(ctx,barX,barY,barW*hpPct,barH,5); ctx.clip();
    const g=ctx.createLinearGradient(barX,0,barX+barW,0);
    g.addColorStop(0,'#ef4444'); g.addColorStop(0.5,'#eab308'); g.addColorStop(1,'#22c55e');
    ctx.fillStyle=g; ctx.fillRect(barX,barY,barW,barH); ctx.restore();
  }
  ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.lineWidth=1.5; roundRect(ctx,barX,barY,barW,barH,5); ctx.stroke();

  // HP text
  ctx.font='bold 9px Outfit'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#fff'; ctx.shadowBlur=0;
  ctx.fillText(`${Math.round(sp.hp||0)}/${sp.mhp||0}`, x, barY+barH/2);

  ctx.restore();
}

// ══════════════════════════════════════════════════════════════
//  PARTICLE RENDERING
// ══════════════════════════════════════════════════════════════
function renderParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (p.type==='spark') {
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.09; p.alpha-=p.decay;
      if (p.alpha<=0){particles.splice(i,1);continue;}
      ctx.save();ctx.globalAlpha=p.alpha;ctx.shadowColor=p.color;ctx.shadowBlur=6;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill();ctx.restore();
    }
    else if (p.type==='lvlup_star') {
      p.x+=p.vx;p.y+=p.vy;p.vx*=0.96;p.vy*=0.96;p.alpha-=p.decay;
      if(p.alpha<=0){particles.splice(i,1);continue;}
      ctx.save();ctx.globalAlpha=p.alpha;ctx.shadowColor=p.color;ctx.shadowBlur=8;
      starPath(ctx,p.x,p.y,p.r,p.r*.4,5);ctx.fillStyle=p.color;ctx.fill();ctx.restore();
    }
    else if (p.type==='shockwave'||p.type==='lvlup_ring') {
      p.r+=(p.maxR-p.r)*.15;p.alpha-=p.decay;
      if(p.alpha<=0||p.r>=p.maxR-2){particles.splice(i,1);continue;}
      ctx.save();ctx.globalAlpha=p.alpha;ctx.shadowColor=p.color;ctx.shadowBlur=12;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.strokeStyle=p.color;ctx.lineWidth=5;ctx.stroke();ctx.restore();
    }
    else if (p.type==='lightning') {
      p.alpha-=p.decay;if(p.alpha<=0){particles.splice(i,1);continue;}
      ctx.save();ctx.globalAlpha=p.alpha;
      const strokeColor = p.color || '#a855f7';
      const glowColor = p.glow || '#d946ef';
      ctx.strokeStyle=strokeColor;ctx.lineWidth=5;ctx.shadowColor=glowColor;ctx.shadowBlur=20;ctx.lineCap='round';
      ctx.beginPath();
      p.path.forEach((pt,j)=>{
        if(j===0){ctx.moveTo(pt.x,pt.y);return;}
        const prev=p.path[j-1];const mx=(prev.x+pt.x)/2+(Math.random()-.5)*32;const my=(prev.y+pt.y)/2+(Math.random()-.5)*32;
        ctx.lineTo(mx,my);ctx.lineTo(pt.x,pt.y);
      });
      ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=2;ctx.shadowBlur=0;ctx.stroke();ctx.restore();
    }
    else if (p.type==='boom') {
      p.r+=(p.maxR-p.r)*.24;p.alpha-=p.decay;if(p.alpha<=0){particles.splice(i,1);continue;}
      ctx.save();ctx.globalAlpha=p.alpha;
      starPath(ctx,p.x,p.y,p.r,p.r*.4,12,Date.now()/1000*.2);
      const g=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,p.r);
      g.addColorStop(0,'#fff');g.addColorStop(.25,'#fef08a');g.addColorStop(.6,'#f97316');g.addColorStop(1,'#ef4444');
      ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='rgba(0,0,0,0.7)';ctx.lineWidth=5;ctx.stroke();
      const fs=Math.min(30,p.r*.55);
      ctx.font=`bold ${fs}px 'Fredoka',sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.strokeStyle='#000';ctx.lineWidth=7;ctx.strokeText('BOOM!',p.x,p.y);
      ctx.fillStyle='#fff';ctx.fillText('BOOM!',p.x,p.y);ctx.restore();
    }
    else if (p.type==='heal') {
      p.x+=p.vx; p.y+=p.vy; p.alpha-=p.decay;
      if(p.alpha<=0){particles.splice(i,1);continue;}
      ctx.save();ctx.globalAlpha=p.alpha;ctx.shadowColor=p.color;ctx.shadowBlur=10;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill();ctx.restore();
    }
    else if (p.type==='smoke') {
      p.x+=p.vx; p.y+=p.vy; p.r+=0.5; p.alpha-=p.decay;
      if(p.alpha<=0){particles.splice(i,1);continue;}
      ctx.save();ctx.globalAlpha=p.alpha;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill();ctx.restore();
    }
    else if (p.type==='debris') {
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.5; p.alpha-=p.decay;
      if(p.alpha<=0){particles.splice(i,1);continue;}
      ctx.save();ctx.globalAlpha=p.alpha;
      ctx.beginPath();ctx.rect(p.x-p.r, p.y-p.r, p.r*2, p.r*2);ctx.fillStyle=p.color;ctx.fill();ctx.restore();
    }
    else if (p.type==='dash_trail') {
      p.alpha-=p.decay;p.r-=0.7;if(p.alpha<=0||p.r<=0){particles.splice(i,1);continue;}
      ctx.save();ctx.globalAlpha=p.alpha*.55;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill();ctx.restore();
    }
    else if (p.type==='dmg_num') {
      p.y+=p.vy;p.vy*=0.93;p.alpha-=p.decay;if(p.alpha<=0){particles.splice(i,1);continue;}
      ctx.save();ctx.globalAlpha=p.alpha;
      const isDanger = p.color === '#fbbf24';
      ctx.font=`bold ${isDanger?22:18}px 'Fredoka',sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.strokeStyle='#000';ctx.lineWidth=5;ctx.strokeText(p.text,p.x,p.y);
      ctx.fillStyle=p.color;ctx.fillText(p.text,p.x,p.y);ctx.restore();
    }
    else if (p.type==='edge_flash') {
      p.alpha-=p.decay;if(p.alpha<=0){particles.splice(i,1);continue;}
      ctx.save();ctx.globalAlpha=p.alpha*0.4;
      ctx.fillStyle=p.color;
      const tw=canvas.width,th=canvas.height,bw=35;
      ctx.fillRect(0,0,tw,bw);ctx.fillRect(0,th-bw,tw,bw);
      ctx.fillRect(0,0,bw,th);ctx.fillRect(tw-bw,0,bw,th);
      ctx.restore();
    }
    else if (p.type==='death_chat') {
      p.y += p.vy; p.alpha -= p.decay;
      if (p.alpha <= 0) { particles.splice(i, 1); continue; }
      drawSpeechBubble(ctx, p.x, p.y, p.text, p.alpha);
      drawEmote(ctx, p.x, p.y + 10, p.emote, false, false);
    }
  }
}

// ── Slash Effects ─────────────────────────────────────────────
function renderSlashEffects() {
  for (let i = slashEffects.length - 1; i >= 0; i--) {
    const s = slashEffects[i];
    s.life -= 0.085;
    s.alpha = Math.max(0, s.life);
    if (s.alpha <= 0) { slashEffects.splice(i, 1); continue; }

    ctx.save();
    ctx.globalAlpha = s.alpha;
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    ctx.lineCap = 'round';

    if (s.type === 'assassin_slash') {
      // Assassin sleek dark-purple shadow blades
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.95)'; // purple glow
      ctx.shadowColor = '#d946ef'; ctx.shadowBlur = 20;
      ctx.lineWidth = s.r * 0.35;
      ctx.beginPath(); ctx.arc(0,0,s.r*0.95,-Math.PI*.4,Math.PI*.4); ctx.stroke();
      
      ctx.strokeStyle = '#fff'; ctx.lineWidth = s.r * 0.15; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(0,0,s.r*0.95,-Math.PI*.25,Math.PI*.25); ctx.stroke();
    } else if (s.type === 'fighter_slash') {
      // Fighter heavy broadsword golden sweeps
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.95)'; // gold glow
      ctx.shadowColor = '#eab308'; ctx.shadowBlur = 24;
      ctx.lineWidth = s.r * 0.7;
      ctx.beginPath(); ctx.arc(0,0,s.r*0.85,-Math.PI*.65,Math.PI*.65); ctx.stroke();
      
      ctx.strokeStyle = '#fff'; ctx.lineWidth = s.r * 0.35; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(0,0,s.r*0.85,-Math.PI*.5,Math.PI*.5); ctx.stroke();
    } else if (s.type === 'mage_slash') {
      // Mage mystical cyan celestial magic wave
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.95)'; // cyan glow
      ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 18;
      ctx.lineWidth = s.r * 0.45;
      ctx.beginPath(); ctx.arc(0,0,s.r*0.9,-Math.PI*.55,Math.PI*.55); ctx.stroke();
      
      ctx.strokeStyle = '#fff'; ctx.lineWidth = s.r * 0.22; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(0,0,s.r*0.9,-Math.PI*.4,Math.PI*.4); ctx.stroke();
    } else {
      // Standard melee slash
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 16;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = s.r * 0.5;
      ctx.beginPath(); ctx.arc(0,0,s.r*0.9,-Math.PI*.5,Math.PI*.5); ctx.stroke();
      
      ctx.strokeStyle = s.color; ctx.lineWidth = s.r * 0.25; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(0,0,s.r*0.9,-Math.PI*.35,Math.PI*.35); ctx.stroke();
    }

    // Slash streaks
    ctx.globalAlpha = s.alpha * 0.5;
    ctx.strokeStyle='#fffbeb'; ctx.lineWidth=2;
    [-s.r*.3,-s.r*.05,s.r*.25].forEach(offset=>{ctx.beginPath();ctx.moveTo(offset-s.r*.4,-s.r*.8);ctx.lineTo(offset+s.r*.4,s.r*.8);ctx.stroke();});
    ctx.restore();
  }
}

// ══════════════════════════════════════════════════════════════
//  MINI-MAP
// ══════════════════════════════════════════════════════════════
function drawMinimap() {
  const mw = mmCanvas.width, mh = mmCanvas.height;
  const s  = mw / mapSize;
  mmCtx.clearRect(0,0,mw,mh);

  // Draw Chaos Zone (Center 5000, 5000, radius 2200)
  const cx = 5000 * s;
  const cy = 5000 * s;
  const cr = 2200 * s;
  mmCtx.save();
  mmCtx.beginPath();
  mmCtx.arc(cx, cy, cr, 0, Math.PI * 2);
  mmCtx.fillStyle = 'rgba(239, 68, 68, 0.15)'; // light red fill
  mmCtx.fill();
  mmCtx.strokeStyle = 'rgba(239, 68, 68, 0.45)'; // red border
  mmCtx.lineWidth = 1.5;
  mmCtx.stroke();
  mmCtx.restore();

  // Players
  Object.values(serverPlayers).forEach(p=>{
    const mx=p.x*s,my=p.y*s;
    if(p.id===myId){
      mmCtx.save();mmCtx.translate(mx,my);mmCtx.rotate(p.a);
      mmCtx.fillStyle='#38bdf8';mmCtx.beginPath();mmCtx.moveTo(8,0);mmCtx.lineTo(-4,-4);mmCtx.lineTo(-2,0);mmCtx.lineTo(-4,4);mmCtx.closePath();mmCtx.fill();
      mmCtx.restore();
    } else {
      const skin=SKINS[p.lvl]||SKINS[1];
      const sz=p.lvl>=8?7:p.lvl>=5?5:3.5;
      mmCtx.beginPath();mmCtx.arc(mx,my,sz,0,Math.PI*2);
      mmCtx.fillStyle=p.bot?'rgba(192,132,252,0.8)':skin.body1;mmCtx.fill();
      mmCtx.strokeStyle='#000';mmCtx.lineWidth=1;mmCtx.stroke();
    }
  });
}

// ══════════════════════════════════════════════════════════════
//  MAIN LOOP
// ══════════════════════════════════════════════════════════════
let lastSlashTime = {};

function loop() {
  requestAnimationFrame(loop);
  processInput();

  // Interpolate players
  Object.keys(serverPlayers).forEach(id => {
    const sp = serverPlayers[id], cp = currentPlayers[id];
    if (!cp || !sp) return;
    cp.x += (sp.x - cp.x) * 0.32;
    cp.y += (sp.y - cp.y) * 0.32;
    let da = sp.a - cp.a;
    while (da < -Math.PI) da += Math.PI*2;
    while (da >  Math.PI) da -= Math.PI*2;
    cp.a += da * 0.28;
    cp.vx = sp.vx || 0; cp.vy = sp.vy || 0; // propagate for ghost trail
    
    // Decay chat bubble TTL
    if (cp.chatTTL > 0) cp.chatTTL--;
  });

  // Camera tracking
  const me = currentPlayers[myId];
  if (me) { camera.x += (me.x - camera.x) * 0.1; camera.y += (me.y - camera.y) * 0.1; }

  // Screen shake decay (vibration disabled to prevent dizziness)
  screenShake = 0;

  // Trigger attack animations based on active projectiles
  const now = Date.now();
  serverProjectiles.forEach(p => {
    const ownerId = p.oid;
    if (ownerId && currentPlayers[ownerId]) {
      const cp = currentPlayers[ownerId];
      if (!cp.lastAttackAnimTime || now - cp.lastAttackAnimTime > 250) {
        cp.attackAnim = { t: now, duration: 200 };
        cp.lastAttackAnimTime = now;
      }
    }
  });

  // Auto-emit slash when projectile hits (detect melee in list)
  serverProjectiles.forEach(p => {
    if (['melee', 'light_slash', 'double_slash', 'scythe_sweep', 'iron_sword', 'heavy_axe', 'spear_thrust', 'mace_swing', 'divine_blade'].includes(p.t) && !lastSlashTime[p.x+','+p.y]) {
      const owner = serverPlayers[p.oid];
      if (owner) {
        const skin = SKINS[owner.lvl] || SKINS[1];
        const slashType = owner.brnch ? (owner.brnch + '_slash') : 'melee';
        emitSlash(p.x, p.y, owner.a || 0, 40 + owner.lvl * 5, skin.body1, slashType);
      }
      lastSlashTime[p.x+','+p.y] = true;
      setTimeout(() => delete lastSlashTime[p.x+','+p.y], 200);
    }
  });

  // Clear canvas
  ctx.fillStyle='#08070d'; ctx.fillRect(0,0,canvas.width,canvas.height);

  // Apply camera (vibration/shake completely disabled to prevent dizziness)
  ctx.save();
  const sx=0, sy=0;
  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.scale(cameraZoom, cameraZoom);
  ctx.translate(-camera.x + sx, -camera.y + sy);

  drawTerrain();
  drawSpeedPads();
  drawGrass();
  drawDecorations();
  drawItems();
  drawHazards();
  drawProjectiles();
  renderSlashEffects();

  // Draw characters sorted by Y — culled to viewport
  const cullW = canvas.width / cameraZoom / 2 + 80;
  const cullH = canvas.height / cameraZoom / 2 + 80;
  Object.values(serverPlayers).sort((a,b)=>a.y-b.y).forEach(sp=>{
    const cp=currentPlayers[sp.id];
    if(!cp) return;
    // Skip rendering if outside visible area (prevents floating names outside camera)
    if (Math.abs(cp.x - camera.x) > cullW || Math.abs(cp.y - camera.y) > cullH) return;
    // Emit smoke when moving
    if((sp.vx||sp.vy)&&Math.random()<0.15) {
      addParticle({type:'spark',x:cp.x+(Math.random()-.5)*10,y:cp.y+sp.radius*.6,vx:(Math.random()-.5)*.6,vy:.4,color:'rgba(255,255,255,0.05)',r:5,alpha:.4,decay:.05});
    }
    drawCharacter(sp,cp);
  });

  renderParticles();
  ctx.restore();

  drawMinimap();
  
  // Draw off-screen Boss Compass arrows
  window.drawBossCompass();

  // Draw Time Warp active screen border vignette & glow
  if (timeWarpActive) {
    ctx.save();
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.35,
      canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
    );
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0.28)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 10;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 30;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.font = "bold 13px 'Fredoka', sans-serif";
    ctx.fillStyle = '#67e8f9';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.fillText("⏳ TIME WARP ACTIVE", canvas.width / 2, 70);
    ctx.restore();
  }

  // Chaos Zone HUD indicator (when player is inside center radius 2200)
  if (me) {
    const distToCenter = Math.hypot(me.x - 5000, me.y - 5000);
    if (distToCenter < 2200) {
      ctx.save();
      
      // Pulsing effect
      const pulse = Math.abs(Math.sin(Date.now() / 250));
      const opacity = 0.5 + pulse * 0.5;
      
      ctx.font = "bold 14px 'Fredoka', sans-serif";
      ctx.fillStyle = `rgba(239, 68, 68, ${opacity})`; // red pulse
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      
      const zoneText = currentLang === 'en' ? '🔥 CHAOS ZONE (2X EXP)' : '🔥 VÙNG HỖN LOẠN (x2 EXP)';
      ctx.fillText(zoneText, canvas.width / 2, 95);
      ctx.restore();
    }
  }

  // Announcement banner
  if (announceTTL > 0) {
    announceTTL--;
    const alpha = announceTTL < 28 ? announceTTL/28 : 1;
    const scale = announceTTL > 105 ? 1 + (130-announceTTL)*0.008 : 1;
    // Smaller font on mobile
    const fontSize = canvas.width <= 950 ? 18 : 26;
    const yPos = canvas.width <= 950 ? 90 : 108;
    ctx.save(); ctx.globalAlpha=alpha; ctx.translate(canvas.width/2, yPos); ctx.scale(scale,scale);
    ctx.font=`bold ${fontSize}px 'Fredoka',sans-serif`; ctx.textAlign='center';
    ctx.strokeStyle='#000'; ctx.lineWidth=5; ctx.strokeText(announcementText||'',0,0);
    ctx.fillStyle='#fbbf24'; ctx.fillText(announcementText||'',0,0);
    ctx.restore();
  }
}

function drawGrass() {
  ctx.save();
  // Turn off shadows to avoid performance degradation on mobile
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  const cullLimit = Math.max(canvas.width, canvas.height) * 0.8;
  clientGrass.forEach(g => {
    // Check if within viewport/camera range (cull check using fast Math.abs)
    if (Math.abs(g.x - camera.x) > cullLimit || Math.abs(g.y - camera.y) > cullLimit) return;

    ctx.save();
    ctx.translate(g.x, g.y);

    // Draw main transparent green radial gradient
    const radG = ctx.createRadialGradient(0, 0, g.r * 0.1, 0, 0, g.r);
    radG.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
    radG.addColorStop(0.75, 'rgba(4, 120, 87, 0.35)');
    radG.addColorStop(1, 'rgba(4, 120, 87, 0)');
    ctx.fillStyle = radG;
    ctx.beginPath();
    ctx.arc(0, 0, g.r, 0, Math.PI * 2);
    ctx.fill();

    // Draw stylized blade-like decorations inside the grass circle
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.25)';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const rx = Math.cos(angle) * (g.r * 0.55);
      const ry = Math.sin(angle) * (g.r * 0.55);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.quadraticCurveTo(rx + 10, ry - 15, rx + 5, ry - 30);
      ctx.stroke();
    }
    ctx.restore();
  });
  ctx.restore();
}

function drawSpeedPads() {
  ctx.save();
  ctx.shadowBlur = 0;
  const time = Date.now();
  const cullLimit = Math.max(canvas.width, canvas.height) * 0.8;
  clientSpeedPads.forEach(pad => {
    if (Math.abs(pad.x - camera.x) > cullLimit || Math.abs(pad.y - camera.y) > cullLimit) return;

    ctx.save();
    ctx.translate(pad.x, pad.y);
    ctx.rotate(pad.a); // angle of push

    // Draw pad background plate (diamond/roundrect-like chevron tile)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
    ctx.lineWidth = 3;
    
    // Draw a nice chevron pad base
    ctx.beginPath();
    ctx.moveTo(-30, -25);
    ctx.lineTo(15, -25);
    ctx.lineTo(35, 0);
    ctx.lineTo(15, 25);
    ctx.lineTo(-30, 25);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Moving chevron arrows inside to show movement direction
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const speed = 0.045;
    const shift = (time * speed) % 50 - 25; // animate movement from left to right (-25 to 25)
    
    // Draw 3 moving chevrons
    for (let i = -1; i <= 1; i++) {
      const cx = shift + i * 22;
      if (cx > -25 && cx < 25) {
        ctx.beginPath();
        ctx.moveTo(cx - 8, -12);
        ctx.lineTo(cx + 4, 0);
        ctx.lineTo(cx - 8, 12);
        ctx.stroke();
      }
    }

    ctx.restore();
  });
  ctx.restore();
}

function drawBountyIndicator(ctx, cp, r, t) {
  ctx.save();
  // Position above the player head nameplate
  ctx.translate(cp.x, cp.y - r - 52);
  
  const pulse = 1 + Math.sin(t / 140) * 0.12;
  ctx.scale(pulse, pulse);
  
  // Outer glowing wanted target crosshair
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 12;
  
  // Crosshair circle
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.stroke();
  
  // Crosshair ticks
  ctx.beginPath();
  ctx.moveTo(-20, 0); ctx.lineTo(-11, 0);
  ctx.moveTo(11, 0); ctx.lineTo(20, 0);
  ctx.moveTo(0, -20); ctx.lineTo(0, -11);
  ctx.moveTo(0, 11); ctx.lineTo(0, 20);
  ctx.stroke();
  
  // Wanted text in pulsing red
  ctx.fillStyle = '#f87171';
  ctx.font = "bold 8px 'Fredoka', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowBlur = 0;
  ctx.fillText("WANTED", 0, -1);
  
  ctx.restore();
}

loop();

// ─── Raid Boss Compass Pointer ────────────────────────────────
window.drawBossCompass = function() {
  const me = serverPlayers[myId];
  if (!me) return;
  
  const cw = canvas.width / cameraZoom;
  const ch = canvas.height / cameraZoom;
  const marginX = 40;
  const marginY = 40;
  
  Object.values(serverPlayers).forEach(p => {
    if (!p.boss || p.id === myId || p.hp <= 0) return;
    
    const dx = p.x - me.x;
    const dy = p.y - me.y;
    const dist = Math.hypot(dx, dy);
    
    const halfW = cw / 2;
    const halfH = ch / 2;
    
    // If the boss is offscreen, draw the arrow pointing to it
    if (Math.abs(dx) > halfW || Math.abs(dy) > halfH) {
      const angle = Math.atan2(dy, dx);
      
      // Calculate intersection with viewport edges
      let edgeX = 0;
      let edgeY = 0;
      
      const screenAspect = cw / ch;
      const targetAspect = Math.abs(dx / (dy || 0.001));
      
      if (targetAspect > screenAspect) {
        edgeX = dx > 0 ? halfW - marginX : -halfW + marginX;
        edgeY = edgeX * Math.tan(angle);
      } else {
        edgeY = dy > 0 ? halfH - marginY : -halfH + marginY;
        edgeX = edgeY / (Math.tan(angle) || 0.001);
      }
      
      const arrowX = canvas.width / 2 + edgeX * cameraZoom;
      const arrowY = canvas.height / 2 + edgeY * cameraZoom;
      
      ctx.save();
      ctx.translate(arrowX, arrowY);
      ctx.rotate(angle);
      
      // Glow shadow
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 15;
      
      // Draw arrow polygon
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-5, -10);
      ctx.lineTo(-2, -4);
      ctx.lineTo(-15, -4);
      ctx.lineTo(-15, 4);
      ctx.lineTo(-2, 4);
      ctx.lineTo(-5, 10);
      ctx.closePath();
      ctx.fill();
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      ctx.restore();
      
      // Draw label
      ctx.save();
      ctx.translate(arrowX, arrowY);
      
      let labelX = Math.cos(angle) * -34;
      let labelY = Math.sin(angle) * -34;
      
      ctx.font = "bold 11px 'Fredoka', sans-serif";
      ctx.fillStyle = '#f87171';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      
      const labelText = `👹 BOSS (Lv.${p.lvl})`;
      ctx.strokeText(labelText, labelX, labelY);
      ctx.fillText(labelText, labelX, labelY);
      
      // Draw distance
      const distInMeters = Math.round(dist / 10) + 'm';
      ctx.font = "bold 9px 'Outfit', sans-serif";
      ctx.fillStyle = '#fff';
      ctx.strokeText(distInMeters, labelX, labelY + 12);
      ctx.fillText(distInMeters, labelX, labelY + 12);
      
      ctx.restore();
    }
  });
};

// ─── Evolution & Roguelike Perks UI Overlays ──────────────────
window.showEvolutionChoiceModal = function() {
  console.log("showEvolutionChoiceModal called");
  window.isSelectingBranch = false;
  const modal = document.getElementById('evolutionChoiceModal');
  if (modal) {
    console.log("Removing hidden class from evolutionChoiceModal");
    modal.classList.remove('hidden');
    
    // Khởi chạy vẽ hoạt ảnh preview nhân vật
    window.startBranchPreviews();
    
    // Gán chạm nhanh touchstart cho các thẻ trên mobile
    const assassinCard = modal.querySelector('.assassin-card');
    const fighterCard = modal.querySelector('.fighter-card');
    const mageCard = modal.querySelector('.mage-card');
    if (assassinCard) assassinCard.ontouchstart = (e) => { e.preventDefault(); window.selectBranch('assassin'); };
    if (fighterCard) fighterCard.ontouchstart = (e) => { e.preventDefault(); window.selectBranch('fighter'); };
    if (mageCard) mageCard.ontouchstart = (e) => { e.preventDefault(); window.selectBranch('mage'); };
    
    const cdEl = document.getElementById('evoCountdown');
    if (cdEl) {
      let left = 10;
      cdEl.textContent = `(Tự động chọn sau ${left}s)`;
      if (window.evoInterval) clearInterval(window.evoInterval);
      window.evoInterval = setInterval(() => {
        left--;
        if (left <= 0) {
          cdEl.textContent = '';
          clearInterval(window.evoInterval);
        } else {
          cdEl.textContent = `(Tự động chọn sau ${left}s)`;
        }
      }, 1000);
    }
  } else {
    console.error("evolutionChoiceModal element not found!");
  }
};

window.selectBranch = function(branch) {
  window.isSelectingBranch = true;
  if (window.evoInterval) { clearInterval(window.evoInterval); window.evoInterval = null; }
  const cdEl = document.getElementById('evoCountdown');
  if (cdEl) cdEl.textContent = '';
  
  // Dừng vòng lặp vẽ preview
  window.stopBranchPreviews();
  
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'select_branch', branch }));
  }
  const modal = document.getElementById('evolutionChoiceModal');
  if (modal) modal.classList.add('hidden');
  
  // Đảm bảo hiện HUD và điều khiển khi đã chọn xong nhánh
  hud.classList.remove('hidden');
  if (window.isTouchDevice) mjOverlay.classList.remove('hidden');
};

const PERK_DETAILS = {
  speed_boost:       { title: 'Swift Foot',    bonus: '+8% Tốc độ',       icon: '⚡', color: '#eab308', desc: 'Tăng tốc di chuyển vĩnh viễn. Di chuyển cực kỳ linh hoạt trên bản đồ.', tag: 'TỐC ĐỘ' },
  body_boost:        { title: 'Iron Will',     bonus: '+15% Máu tối đa',   icon: '🛡️', color: '#38bdf8', desc: 'Gia tăng vĩnh viễn giới hạn sinh mệnh tối đa. Trụ được đòn nặng hơn.', tag: 'SỨC BỀN' },
  max_hp_boost:      { title: 'Iron Will',     bonus: '+15% Máu tối đa',   icon: '🛡️', color: '#38bdf8', desc: 'Gia tăng vĩnh viễn giới hạn sinh mệnh tối đa. Trụ được đòn nặng hơn.', tag: 'SỨC BỀN' },
  heal_boost:        { title: 'Vigor Brew',    bonus: '+25% Hồi máu',     icon: '🧪', color: '#10b981', desc: 'Tăng hiệu quả hồi phục máu khi sử dụng Potion. Sinh tồn lâu hơn.', tag: 'HỒI PHỤC' },
  bomb_boost:        { title: 'Demolition',   bonus: '+30% Sát thương nổ', icon: '💣', color: '#ef4444', desc: 'Mở rộng bán kính nổ và sát thương của bom. Kiểm soát vùng hiệu quả.', tag: 'SẤT THƯƠNG' },
  attack_dmg_boost:  { title: 'Giant Strike',  bonus: '+12% Sát thương',   icon: '⚔️', color: '#f97316', desc: 'Cường hóa vũ khí, tăng sát thương cơ bản vĩnh viễn mỗi đòn đánh.', tag: 'TẤN CÔNG' },
  cooldown_reduction:{ title: 'Haste',          bonus: '-15% Hồi chiêu',    icon: '⏱️', color: '#a855f7', desc: 'Tăng nhịp độ chiến đấu, giảm hồi chiêu kỹ năng và đặc biệt mạnh hơn.', tag: 'KỸ NĂNG' }
};

window.showPerkChoiceModal = function(choices, timeoutSec = 10) {
  console.log('[PERK MODAL] showPerkChoiceModal called with:', choices, 'timeout:', timeoutSec);
  window.isSelectingPerk = false;
  
  const container = document.getElementById('perkCardContainer');
  const modal = document.getElementById('perkChoiceModal');
  
  if (!modal) { console.error('[PERK MODAL] perkChoiceModal element NOT FOUND!'); return; }
  if (!container) { console.error('[PERK MODAL] perkCardContainer NOT FOUND!'); return; }
  if (!choices || !Array.isArray(choices) || choices.length === 0) {
    console.error('[PERK MODAL] Invalid choices:', choices); return;
  }
  
  // Get active branch to customize perk details dynamically
  const me = (typeof serverPlayers !== 'undefined' && serverPlayers[myId]) || (typeof currentPlayers !== 'undefined' && currentPlayers[myId]) || {};
  const branch = me.branch || '';
  const lang = currentLang;
  
  // Build card HTML
  container.innerHTML = '';
  choices.forEach(perk => {
    // Clone standard details or fetch from I18N
    const baseInfo = PERK_DETAILS[perk] || { icon: '🃏', color: '#06b6d4' };
    
    const info = {
      title: I18N[lang][`perk_${perk}_title`] || perk,
      bonus: I18N[lang][`perk_${perk}_stat`] || '',
      desc: I18N[lang][`perk_${perk}_desc`] || '',
      icon: baseInfo.icon || '🃏',
      color: baseInfo.color || '#06b6d4'
    };
    
    let tagKey = 'tag_hp';
    if (perk === 'speed_boost') tagKey = 'tag_speed';
    else if (perk === 'heal_boost') tagKey = 'tag_heal';
    else if (perk === 'bomb_boost') tagKey = 'tag_bomb';
    else if (perk === 'attack_dmg_boost') tagKey = 'tag_dmg';
    else if (perk === 'cooldown_reduction') tagKey = 'tag_cd';
    info.tag = I18N[lang][tagKey] || 'BONUS';
    
    // Class-Adaptive descriptions logic dynamically mapped to I18N
    if (perk === 'max_hp_boost' && branch) {
      info.bonus = I18N[lang][`perk_max_hp_boost_${branch}_stat`] || info.bonus;
      info.desc = I18N[lang][`perk_max_hp_boost_${branch}_desc`] || info.desc;
    } else if (perk === 'speed_boost' && branch === 'mage') {
      info.bonus = I18N[lang][`perk_speed_boost_mage_stat`] || info.bonus;
      info.desc = I18N[lang][`perk_speed_boost_mage_desc`] || info.desc;
    } else if (perk === 'cooldown_reduction' && branch === 'assassin') {
      info.bonus = I18N[lang][`perk_cooldown_reduction_assassin_stat`] || info.bonus;
      info.desc = I18N[lang][`perk_cooldown_reduction_assassin_desc`] || info.desc;
    }
    
    const card = document.createElement('div');
    card.className = 'perk-card ' + perk;
    card.onclick = () => window.selectPerk(perk);
    
    // Gán chạm nhanh touchstart cho thẻ perk trên di động
    card.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.selectPerk(perk);
    }, { passive: false });
    
    card.innerHTML = `
      <div class="card-glow"></div>
      <div class="card-cost-badge">0</div>
      <div class="card-art-frame">
        <span class="card-art-icon">${info.icon}</span>
      </div>
      <div class="card-title-banner">${(info.title || perk || 'BONUS').toUpperCase()}</div>
      <div class="card-desc-box">
        <p class="card-desc-text">${info.desc}</p>
        <div class="card-stat-bonus" style="color: ${info.color}">${info.bonus}</div>
      </div>
      <div class="card-type-tag" style="border-color: ${info.color}; color: ${info.color}">${info.tag}</div>
      <button class="card-select-btn" style="background: ${info.color}">${I18N[lang].perk_select_btn || 'SELECT'}</button>
    `;
    container.appendChild(card);
  });
  
  // Force show modal
  modal.classList.remove('hidden');
  modal.style.cssText = `
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
    z-index: 999999 !important;
    position: fixed !important;
    inset: 0 !important;
    align-items: center !important;
    justify-content: center !important;
    background: rgba(2, 6, 20, 0.90) !important;
    backdrop-filter: blur(6px) !important;
  `;
  
  // Countdown timer
  const cdEl = document.getElementById('perkCountdown');
  if (cdEl) {
    let left = timeoutSec;
    cdEl.textContent = (I18N[lang].perk_auto_select || '').replace('{seconds}', left);
    if (window.perkInterval) clearInterval(window.perkInterval);
    window.perkInterval = setInterval(() => {
      left--;
      if (left <= 0) {
        cdEl.textContent = I18N[lang].perk_selecting || '';
        clearInterval(window.perkInterval);
        window.perkInterval = null;
      } else {
        cdEl.textContent = (I18N[lang].perk_auto_select || '').replace('{seconds}', left);
      }
    }, 1000);
  }
  
  console.log('[PERK MODAL] Modal shown successfully!');
};

window.selectPerk = function(perk) {
  console.log('[PERK MODAL] selectPerk called:', perk);
  window.isSelectingPerk = true;
  if (window.perkInterval) { clearInterval(window.perkInterval); window.perkInterval = null; }
  const cdEl = document.getElementById('perkCountdown');
  if (cdEl) cdEl.textContent = '';
  
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'select_perk', perk }));
  }
  const modal = document.getElementById('perkChoiceModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.cssText = '';
  }
  
  // Hiển thị HUD và Joystick khi đã chọn xong Perk bắt đầu chơi
  hud.classList.remove('hidden');
  if (window.isTouchDevice) mjOverlay.classList.remove('hidden');
};

// ─── Evolution Branch Canvas Rendering Preview ────────────────
window.renderBranchPreview = function(canvasId, branch) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctxPrv = canvas.getContext('2d');
  ctxPrv.clearRect(0, 0, canvas.width, canvas.height);

  const skin = BRANCH_SKINS[branch]?.[5];
  if (!skin) return;

  const r = 26; // radius
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const t = Date.now();

  ctxPrv.save();
  ctxPrv.translate(cx, cy);

  // Ground shadow
  ctxPrv.beginPath();
  ctxPrv.ellipse(0, r - 2, r * 0.88, 6, 0, 0, Math.PI * 2);
  ctxPrv.fillStyle = 'rgba(0,0,0,0.35)';
  ctxPrv.fill();

  // Aura ring
  if (skin.aura) {
    drawAuraRing(ctxPrv, r, skin.aura, 5, t);
  }

  // Waddle + Breathe
  const breathY = Math.sin(t / 190) * 0.048;
  const squashX = 1 + breathY;
  const squashY = 1 - breathY;
  ctxPrv.save();
  ctxPrv.scale(squashX, squashY);

  // Behind-body attachments
  if (branch === 'assassin') drawCloak(ctxPrv, r);
  if (skin.skinType === 'demon' || skin.skinType === 'demon_wings') drawDemonWings(ctxPrv, r, t);
  if (skin.skinType === 'shadow') drawShadowAura(ctxPrv, r, t);
  if (skin.skinType === 'dragon') drawDragonWings(ctxPrv, r, t);

  // Body sphere
  ctxPrv.beginPath();
  ctxPrv.arc(0, 0, r, 0, Math.PI * 2);
  const g = ctxPrv.createRadialGradient(-r * 0.38, -r * 0.4, r * 0.06, 0, 0, r);
  g.addColorStop(0, skin.bodyHL);
  g.addColorStop(0.5, skin.body1);
  g.addColorStop(1, skin.body2);
  ctxPrv.fillStyle = g;
  ctxPrv.fill();

  ctxPrv.strokeStyle = skin.outline;
  ctxPrv.lineWidth = 4;
  ctxPrv.stroke();

  // Front-body attachments
  if (skin.skinType === 'leaf') drawLeaf(ctxPrv, r, t);
  else if (skin.skinType === 'horns') drawHorns(ctxPrv, r);
  else if (skin.skinType === 'neko') drawNekoEars(ctxPrv, r, skin);
  else if (skin.skinType === 'panda') drawPandaEars(ctxPrv, r, skin);
  else if (skin.skinType === 'demon') drawDemonHorns(ctxPrv, r);
  else if (skin.skinType === 'boss') drawCrown(ctxPrv, r, t);
  else if (skin.skinType === 'dragon') drawDragonHorns(ctxPrv, r, t);
  else if (skin.skinType === 'shadow') drawShadowMask(ctxPrv, r, t);
  else if (skin.skinType === 'celestial') drawHalo(ctxPrv, r, t);
  else if (skin.skinType === 'omega') drawOmegaSymbol(ctxPrv, r, t);

  // Branch equipments
  if (branch === 'assassin') {
    drawShuriken(ctxPrv, r, t);
  } else if (branch === 'fighter') {
    drawFighterSword(ctxPrv, r);
    drawFighterShield(ctxPrv, r);
  } else if (branch === 'mage') {
    drawMageHat(ctxPrv, r);
    drawMageStaff(ctxPrv, r, t);
  }

  // drawEyes (sp and cp mocks)
  const spMock = { id: 'mock', lvl: 5, angle: -Math.PI / 2, brnch: branch, vx: 0, vy: 0 };
  const cpMock = { x: 0, y: 0 };
  drawEyes(ctxPrv, r, cpMock, spMock, skin, t);

  ctxPrv.restore();
  ctxPrv.restore();
};

window.startBranchPreviews = function() {
  if (window.branchPreviewInterval) clearInterval(window.branchPreviewInterval);
  window.branchPreviewInterval = setInterval(() => {
    const modal = document.getElementById('evolutionChoiceModal');
    if (modal && !modal.classList.contains('hidden')) {
      window.renderBranchPreview('canvasEvoAssassin', 'assassin');
      window.renderBranchPreview('canvasEvoFighter', 'fighter');
      window.renderBranchPreview('canvasEvoMage', 'mage');
    } else {
      window.stopBranchPreviews();
    }
  }, 50);
};

window.stopBranchPreviews = function() {
  if (window.branchPreviewInterval) {
    clearInterval(window.branchPreviewInterval);
    window.branchPreviewInterval = null;
  }
};


