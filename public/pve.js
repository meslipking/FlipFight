/* ═══════════════════════════════════════════════════════════════
   PVE ROGUELIKE ENGINE — pve.js
   FlipFight.com · Client-Side Only · No Server Required
═══════════════════════════════════════════════════════════════ */

'use strict';

// ─── CONSTANTS ────────────────────────────────────────────────
const PVE_PW = 'flipfight_pve_beta';
const WORLD_W = 4000, WORLD_H = 4000;
const MAX_SKILLS = 6;

// Time-based stages (seconds) — Vampire Survivors style
// Mỗi màn chơi là 30 phút — giống Vampire Survivors
// Victory = survive the full duration; Death = game over
const STAGE_DURATION = { 1: 1800, 2: 1800, 3: 1800 }; // 30 phút mỗi màn
const STAGE_MAX_WAVE = { 1: 30, 2: 30, 3: 30 }; // 30 wave (1 wave/phút)

// ─── BOSS SCHEDULE (Vampire Survivors style) ─────────────────
// Phút 5, 10, 15, 20, 25 = boss thông thường (ngày càng mạnh)
// Phút 28 = boss cực khó báo hiệu cuối game
// Phút 30 = TỬ THẦN xuất hiện — giết ngay hoặc chết!
const BOSS_SCHEDULE = {
  // Stage 1: cơ bản nhất
  1: [
    { t: 300,  b: 'boss_slime_king'   },  // phút 5
    { t: 600,  b: 'boss_dark_lord'    },  // phút 10
    { t: 900,  b: 'boss_dragon_queen' },  // phút 15
    { t: 1200, b: 'boss_void_titan'   },  // phút 20
    { t: 1500, b: 'boss_death_herald' },  // phút 25 — thám tử tử thần
    { t: 1680, b: 'boss_reaper_form1' },  // phút 28 — cảnh báo DEATH đến gần
    { t: 1800, b: 'boss_death_reaper' },  // phút 30 — TỬ THẦN (cực kỳ khó)
  ],
  // Stage 2: khó hơn, boss xuất hiện sớm hơn
  2: [
    { t: 240,  b: 'boss_slime_king'   },  // phút 4
    { t: 480,  b: 'boss_dark_lord'    },  // phút 8
    { t: 720,  b: 'boss_dragon_queen' },  // phút 12
    { t: 960,  b: 'boss_void_titan'   },  // phút 16
    { t: 1200, b: 'boss_void_titan'   },  // phút 20 — lần 2
    { t: 1440, b: 'boss_death_herald' },  // phút 24
    { t: 1680, b: 'boss_reaper_form1' },  // phút 28
    { t: 1800, b: 'boss_death_reaper' },  // phút 30
  ],
  // Stage 3: khó nhất
  3: [
    { t: 180,  b: 'boss_slime_king'   },  // phút 3
    { t: 360,  b: 'boss_dark_lord'    },  // phút 6
    { t: 540,  b: 'boss_dragon_queen' },  // phút 9
    { t: 720,  b: 'boss_void_titan'   },  // phút 12
    { t: 900,  b: 'boss_death_herald' },  // phút 15
    { t: 1080, b: 'boss_void_titan'   },  // phút 18 — Titan lần 2
    { t: 1260, b: 'boss_death_herald' },  // phút 21 — Herald lần 2
    { t: 1440, b: 'boss_reaper_form1' },  // phút 24 — cảnh báo
    { t: 1620, b: 'boss_reaper_form1' },  // phút 27 — cảnh báo 2
    { t: 1800, b: 'boss_death_reaper' },  // phút 30
  ],
};

// ─── WAVE SCALING theo 30 phút ───────────────────────────────
// Đầu game rất khó do player yếu → dần dần cân bằng → cuối game overwhelming
// ─── MAX ENEMIES CAP ─────────────────────────────────────────
const MAX_ENEMIES_ON_SCREEN = 700; // hard cap — FlipFight supports up to 700 enemies simultaneously

// ─── STAT HARD CAPS (Giới hạn cứng chỉ số) ────────────────────
// Đây là ngưỡng tối đa nhân vật có thể đạt trong một ván đấu
const STAT_CAPS = {
  cdMult:        0.10,   // Hồi chiêu: min 10% gốc còn lại (-90% CDR cap)
  projAddCount:  10,     // Số lượng đạn bổ sung: tối đa +10
  dmgMult:       10.0,   // Sát thương: tối đa x10 (+900%)
  aoeMult:       10.0,   // Phạm vi AoE: tối đa x10 (+900%)
  projSpeedMult: 6.0,    // Tốc độ đạn: tối đa x6 (+500%)
  durationMult:  6.0,    // Thời gian kỹ năng: tối đa x6 (+500%)
  spdMult:       10.0,   // Tốc độ di chuyển: tối đa x10 (+900%)
  critChance:    0.90,   // Chí mạng: tối đa 90%
  critDmgMult:   5.0,    // Nhân chí mạng: tối đa 5x (+400%)
  xpGainMult:    10.0,   // Kinh nghiệm: tối đa x10 (+900%)
  armor:         900,    // Giáp: tối đa 900 (mỗi điểm -1 dmg, tối thiểu 1 dmg)
  lifesteal:     0.40,   // Hút máu: tối đa 40%
  hpRegen:       200,    // Hồi máu: tối đa 200 HP/giây
  magnetRadius:  600,    // Tầm hút ngọc: tối đa 600px
  goldBonus:     5.0,    // Nhân vàng: tối đa 5x
  thornsDmg:     0.80,   // Phản đòn: tối đa 80% dmg nhận vào
  reviveCount:   3,      // Hồi sinh: tối đa 3 lần/ván
  projectilePierce: 8,  // Xuyên thấu: tối đa 8 lần
};

// ─── I-FRAMES DURATION ───────────────────────────────────────
// Sau mỗi lần nhận damage, player bất tử 600ms
// Ngăn chặn bị "bốc hơi" khi bầy đàn áp sát cùng lúc
const I_FRAME_DURATION_MS = 600;
// Boss đặc biệt (Red Death) xuyên qua I-frames thông thường
const BOSS_PIERCE_IFRAMES = ['boss_death_reaper'];

// ─── Áp dụng Hard Caps vào player stats ─────────────────────
function applyStatCaps(p) {
  if (!p) return;
  p.cdMult        = Math.max(STAT_CAPS.cdMult,        p.cdMult        || 1.0);
  p.projAddCount  = Math.min(STAT_CAPS.projAddCount,   p.projAddCount  || 0);
  p.dmgMult       = Math.min(STAT_CAPS.dmgMult,        p.dmgMult       || 1.0);
  p.aoeMult       = Math.min(STAT_CAPS.aoeMult,        p.aoeMult       || 1.0);
  p.projSpeedMult = Math.min(STAT_CAPS.projSpeedMult,  p.projSpeedMult || 1.0);
  p.spdMult       = Math.min(STAT_CAPS.spdMult,        p.spdMult       || 1.0);
  p.critChance    = Math.min(STAT_CAPS.critChance,     p.critChance    || 0);
  p.xpGainMult    = Math.min(STAT_CAPS.xpGainMult,     p.xpGainMult    || 1.0);
  p.lifesteal     = Math.min(STAT_CAPS.lifesteal,      p.lifesteal     || 0);
  p.hpRegen       = Math.min(STAT_CAPS.hpRegen,        p.hpRegen       || 0);
  p.goldBonus     = Math.min(STAT_CAPS.goldBonus,      p.goldBonus     || 1.0);
  if (p.thornsDmg !== undefined) p.thornsDmg = Math.min(STAT_CAPS.thornsDmg, p.thornsDmg);
  p.defMult       = Math.min(STAT_CAPS.armor / 100,  p.defMult       || 1.0);
  p.reviveCount   = Math.min(STAT_CAPS.reviveCount,  p.reviveCount   || 0);
}

function getWaveScaling(sec) {
  const min = sec / 60;
  // C1: Difficulty scaling per minute — RẤT KHÓ ngay từ đầu!
  const hpMult   = Math.pow(1.18, min); // +18% HP mỗi phút (cũ 12%)
  const dmgMult  = Math.pow(1.10, min); // +10% Damage mỗi phút (cũ 6%)
  const speedAdd = Math.min(60, (Math.pow(1.06, min) - 1) * 120); // +6% speed/min, cap 60
  
  // Spawn rate tăng 50% mỗi phút — dày đặc kinh khủng!
  const countPerBatch = Math.min(200, Math.floor(6 * Math.pow(1.12, min))); 
  const batchInterval = Math.max(1.0, 8.0 - min * 0.25);
  const eliteChance   = Math.min(0.75, 0.05 + min * 0.032); // elite sớm hơn
  
  return { hpMult, dmgMult, speedAdd, countPerBatch, batchInterval, eliteChance };
}

// ─── PERMANENT POWER-UP DEFINITIONS ──────────────────────────

const MASTERY_DEFS = {
  node1: { id: 'node1', name: 'Chiến Binh Kiên Cường', icon: '🛡️', desc: '+10% HP tối đa & +5% Giáp vĩnh viễn.', cost: 300, dependsOn: null, stat: { maxHpBonusPct: 0.10, armorBonusPct: 0.05 } },
  node2: { id: 'node2', name: 'Trí Tuệ Cổ Đại', icon: '🔮', desc: '+5% Tốc độ hồi chiêu (CDR) vĩnh viễn.', cost: 400, dependsOn: null, stat: { cdReducePct: 0.05 } },
  node3: { id: 'node3', name: 'Thần Tài Gõ Cửa', icon: '🪙', desc: '+10% Vàng nhận được vĩnh viễn.', cost: 350, dependsOn: null, stat: { goldBonusPct: 0.10 } },
  node4: { id: 'node4', name: 'Bóng Tối Phục Kích', icon: '🗡️', desc: '+5% Tỷ lệ chí mạng vĩnh viễn.', cost: 800, dependsOn: 'node1', stat: { critChancePct: 0.05 } },
  node5: { id: 'node5', name: 'Quyền Năng Vô Song', icon: '🔥', desc: '+10% Sát thương kỹ năng & +5% AoE.', cost: 900, dependsOn: 'node2', stat: { dmgMultPct: 0.10, aoeMultPct: 0.05 } },
  node6: { id: 'node6', name: 'Pháp Sư Tối Thượng', icon: '⚡', desc: '+8% Tốc độ đánh & +5% Tốc độ di chuyển.', cost: 850, dependsOn: 'node2', stat: { speedMultPct: 0.05, cdReducePct: 0.03 } },
  node7: { id: 'node7', name: 'Dòng Máu Quỷ', icon: '🩸', desc: '+2% Hút máu cho tất cả kỹ năng.', cost: 1200, dependsOn: 'node3', stat: { lifestealPct: 0.02 } },
  node8: { id: 'node8', name: 'Thần Thú Gia Tốc', icon: '🐾', desc: '+15 HP/giây hồi phục vĩnh viễn.', cost: 1000, dependsOn: 'node3', stat: { hpRegenAdd: 15 } },
  node9: { id: 'node9', name: 'Dấu Ấn Tử Thần', icon: '☠️', desc: '+15% Sát thương và +5% chí mạng.', cost: 2500, dependsOn: 'node4', stat: { dmgMultPct: 0.15, critChancePct: 0.05 } },
  node10: { id: 'node10', name: 'Hào Quang Mặt Trời', icon: '☀️', desc: '+20% Sát thương, +10% hồi chiêu.', cost: 3000, dependsOn: 'node5', stat: { dmgMultPct: 0.20, cdReducePct: 0.10 } }
};

const POWERUP_DEFS = {
  might:     { name:'Might',      icon:'⚔️',  desc:'+10% Sát thương kỹ năng mỗi cấp.',         maxLevel:10, baseCost:80,  costScale:1.5,  effect:'dmgMult',      perLevel:0.10 },
  amount:    { name:'Amount',     icon:'✨',  desc:'+1 đạn/hiệu ứng bổ sung mỗi cấp.',          maxLevel:5,  baseCost:120, costScale:1.8,  effect:'projAddCount',  perLevel:1    },
  swiftness: { name:'Swiftness',  icon:'💨',  desc:'+5% Tốc độ di chuyển mỗi cấp.',             maxLevel:10, baseCost:60,  costScale:1.4,  effect:'spdMult',      perLevel:0.05 },
  recovery:  { name:'Recovery',   icon:'💚',  desc:'+3 HP/giây hồi máu mỗi cấp.',               maxLevel:8,  baseCost:70,  costScale:1.5,  effect:'hpRegen',      perLevel:3    },
  greed:     { name:'Greed',      icon:'🪙',  desc:'+15% Vàng nhận được mỗi cấp.',              maxLevel:6,  baseCost:100, costScale:1.6,  effect:'goldBonus',    perLevel:0.15 },
  luck:      { name:'Luck',       icon:'🍀',  desc:'+5% Tỷ lệ chí mạng mỗi cấp.',              maxLevel:8,  baseCost:90,  costScale:1.5,  effect:'critChance',   perLevel:0.05 },
  cooldown:  { name:'Cooldown',   icon:'⚡',  desc:'-6% Hồi chiêu kỹ năng mỗi cấp.',           maxLevel:8,  baseCost:110, costScale:1.6,  effect:'cdMult',       perLevel:-0.06},
  vitality:  { name:'Vitality',   icon:'❤️',  desc:'+15% HP tối đa mỗi cấp.',                  maxLevel:8,  baseCost:80,  costScale:1.5,  effect:'maxHpMult',    perLevel:0.15 },
  // ── MỚI: Growth & Magnet ──────────────────────────────────────
  growth:    { name:'Growth',     icon:'🌱',  desc:'+10% XP nhận được mỗi cấp. Cấp 20&40 thưởng +100% Growth.', maxLevel:10, baseCost:90, costScale:1.55, effect:'xpGainMult', perLevel:0.10 },
  magnet:    { name:'Magnet',     icon:'🧲',  desc:'+80px tầm hút ngọc XP & vàng mỗi cấp.',   maxLevel:8,  baseCost:75,  costScale:1.45, effect:'magnetBonus',  perLevel:80   },
};



// ─── CLASS DEFINITIONS ────────────────────────────────────────
const CLASSES = {
  assassin:   { name:'Sát Thủ',    icon:'🗡️',  color:'#a855f7', hp:180, speed:210, atk:1.35, def:0.75, startSkill:'shadow_blades',
                desc:'Cơ động vượt trội, ám sát chớp nhoáng, hiểm hóc chí mạng.',
                stats:{hp:50,spd:85,atk:70,def:30}, weaponType:'daggers' },
  fighter:    { name:'Đấu Sĩ',     icon:'🛡️',  color:'#facc15', hp:320, speed:145, atk:1.00, def:1.45, startSkill:'shield_bash',
                desc:'Thiết giáp bất bại, đứng mũi chịu sào, càn quét tuyến đầu.',
                stats:{hp:90,spd:35,atk:55,def:90}, weaponType:'sword' },
  mage:       { name:'Pháp Sư',    icon:'🔮',  color:'#22d3ee', hp:200, speed:175, atk:1.40, def:0.65, startSkill:'magic_missile',
                desc:'Bão tố phép thuật, tầm xa khống chế quần thể diện rộng.',
                stats:{hp:45,spd:60,atk:90,def:25}, weaponType:'wand' },
  ranger:     { name:'Cung Thủ',   icon:'🏹',  color:'#34d399', hp:210, speed:195, atk:1.20, def:0.80, startSkill:'piercing_arrow',
                desc:'Cung tên xuyên thấu, tốc đánh cực nhanh, giữ khoảng cách hiểm hóc.',
                stats:{hp:55,spd:75,atk:75,def:40}, weaponType:'bow' },
  paladin:    { name:'Hộ Vệ',      icon:'✨',  color:'#fde68a', hp:280, speed:155, atk:0.90, def:1.30, startSkill:'holy_light',
                desc:'Thánh quang hồi phục, tạo giáp thần, bảo vệ đồng đội.',
                stats:{hp:80,spd:45,atk:45,def:80}, weaponType:'hammer' },
  necromancer:{ name:'Gọi Hồn',   icon:'💀',  color:'#94a3b8', hp:190, speed:165, atk:1.15, def:0.85, startSkill:'summon_skeleton',
                desc:'Triệu hồi đệ xương chiến đấu, hút sinh lực kẻ địch.',
                stats:{hp:48,spd:50,atk:68,def:45}, weaponType:'skull_staff' },
  druid:      { name:'Thần Rừng',  icon:'🌿',  color:'#86efac', hp:230, speed:170, atk:1.10, def:1.00, startSkill:'briar_patch',
                desc:'Triệu hồi linh thú, gây độc diện rộng, hồi phục theo thời gian.',
                stats:{hp:65,spd:55,atk:60,def:60}, weaponType:'nature_staff' },
};

// ─── SKILL DEFINITIONS ────────────────────────────────────────
const SKILL_DEFS = {
  // ASSASSIN branch
  shadow_blades:  { name:'Lưỡi Bóng Tối', icon:'🗡️',  branch:'assassin',  color:'#a855f7', cd:1.2,  dmg:28, desc:'Dao găm bóng tối quay quanh người càn quét kẻ địch gần.' },
  void_pulse:     { name:'Xung Hư Vô',    icon:'🌀',  branch:'assassin',  color:'#7c3aed', cd:5.5,  dmg:55, desc:'Xung năng lượng tím đẩy lùi và gây sát thương AoE mạnh.' },
  poison_dart:    { name:'Kim Độc',        icon:'🟢',  branch:'assassin',  color:'#10b981', cd:2.2,  dmg:18, desc:'Kim độc tự tìm mục tiêu gây sát thương theo thời gian.' },
  shadow_clone:   { name:'Phân Thân',      icon:'👤',  branch:'assassin',  color:'#6d28d9', cd:7.0,  dmg:35, desc:'Tạo phân thân sao chép đòn tấn công của chủ thể.' },
  // FIGHTER branch
  shield_bash:    { name:'Đập Khiên',      icon:'🛡️',  branch:'fighter',   color:'#facc15', cd:3.8,  dmg:48, desc:'Đập khiên gây choáng và sát thương cho quái xung quanh.' },
  earthquake:     { name:'Địa Chấn',       icon:'💥',  branch:'fighter',   color:'#f97316', cd:5.0,  dmg:72, desc:'Nứt đất gây choáng và sát thương diện rộng.' },
  iron_wall:      { name:'Tường Sắt',      icon:'🧱',  branch:'fighter',   color:'#64748b', cd:6.0,  dmg:0,  desc:'Tạo giáp hấp thụ sát thương hồi phục theo thời gian.' },
  rally:          { name:'Xung Phong',     icon:'⚡',  branch:'fighter',   color:'#eab308', cd:10.0, dmg:0,  desc:'Tăng tốc chạy 50% và có thể vừa di chuyển vừa đánh.' },
  // MAGE branch
  magic_missile:  { name:'Tên Lửa Thần',   icon:'🔵',  branch:'mage',      color:'#22d3ee', cd:1.5,  dmg:32, desc:'Tên lửa ma pháp tự tìm kẻ địch gần nhất phát nổ.' },
  frost_aura:     { name:'Băng Hào Quang', icon:'❄️',  branch:'mage',      color:'#93c5fd', cd:2.0,  dmg:18, desc:'Vòng băng làm chậm và gây sát thương kẻ địch xung quanh.' },
  thunder_ring:   { name:'Vòng Sét',       icon:'⚡',  branch:'mage',      color:'#fde047', cd:3.0,  dmg:40, desc:'8 tia sét bắn xung quanh người chơi xuyên thấu.' },
  meteor:         { name:'Thiên Thạch',    icon:'☄️',  branch:'mage',      color:'#f97316', cd:7.0,  dmg:95, desc:'Thiên thạch rơi ngẫu nhiên gây sát thương diện rộng.' },
  fireball:       { name:'Cầu Lửa',        icon:'🔥',  branch:'mage',      color:'#ef4444', cd:2.8,  dmg:52, desc:'Cầu lửa phóng về kẻ địch gần nhất gây nổ AoE.' },
  // RANGER branch
  piercing_arrow: { name:'Mũi Tên Xuyên',  icon:'🏹',  branch:'ranger',    color:'#34d399', cd:0.9,  dmg:26, desc:'Mũi tên xuyên thấu tất cả kẻ địch theo đường thẳng.' },
  arrow_rain:     { name:'Mưa Tên',        icon:'🌧️', branch:'ranger',    color:'#059669', cd:6.0,  dmg:20, desc:'Mưa tên dày đặc oanh tạc vùng lớn trước mặt.' },
  spirit_wolf:    { name:'Sói Linh Hồn',   icon:'🐺',  branch:'ranger',    color:'#6ee7b7', cd:8.0,  dmg:60, desc:'Triệu hồi sói linh hồn phóng thẳng vồ quái vật.' },
  // PALADIN branch
  holy_light:     { name:'Thánh Quang',    icon:'✨',  branch:'paladin',   color:'#fde68a', cd:4.0,  dmg:35, desc:'Thánh quang hồi máu và thiêu đốt quỷ xung quanh.' },
  divine_shield:  { name:'Khiên Thánh',    icon:'🌟',  branch:'paladin',   color:'#fbbf24', cd:12.0, dmg:0,  desc:'Khiên thánh vô địch 2s rồi nổ thánh quang đẩy lùi.' },
  consecration:   { name:'Đất Thánh',      icon:'⭐',  branch:'paladin',   color:'#f59e0b', cd:3.5,  dmg:22, desc:'Tạo vùng đất thánh thiêu đốt liên tục kẻ địch bước vào.' },
  // NECROMANCER branch
  summon_skeleton:{ name:'Xương Chiến Binh',icon:'💀', branch:'necromancer',color:'#94a3b8', cd:9.0,  dmg:30, desc:'Triệu hồi đệ xương chiến đấu càn quét quái vật.' },
  death_grasp:    { name:'Bàn Tay Tử Thần',icon:'🖐️', branch:'necromancer',color:'#475569', cd:4.5,  dmg:42, desc:'Bàn tay xương trồi lên trói chân quái và gây sát thương.' },
  soul_drain:     { name:'Hút Linh Hồn',   icon:'🌑',  branch:'necromancer',color:'#334155', cd:3.0,  dmg:25, desc:'Hút sinh lực kẻ địch chuyển hóa thành máu cho bản thân.' },
  // DRUID branch
  briar_patch:    { name:'Bụi Gai',        icon:'🌿',  branch:'druid',     color:'#86efac', cd:5.0,  dmg:30, desc:'Bụi gai mọc lên làm chậm và gây độc kẻ địch bước vào.' },
  nature_regrowth:{ name:'Hồi Sinh Rừng',  icon:'🍃',  branch:'druid',     color:'#4ade80', cd:8.0,  dmg:0,  desc:'Hiệu ứng lá bay hồi máu liên tục trong 5 giây.' },
  vine_whip:      { name:'Roi Dây Leo',     icon:'🌱',  branch:'druid',     color:'#22c55e', cd:2.5,  dmg:38, desc:'Dây leo quất mạnh quái vật và đánh hất tung ra xa.' },
  // LEGENDARY COMBOS (Nguyên bản)
  specter_storm:  { name:'Bão Phân Thân',   icon:'👻',  branch:'assassin',  color:'#c084fc', cd:5.0,  dmg:200, isLegendary:true, desc:'6 phân thân bóng tối bao phủ càn quét toàn màn hình.' },
  celestial_nova: { name:'Nova Thiên Hà',   icon:'🌌',  branch:'mage',      color:'#38bdf8', cd:8.0,  dmg:250, isLegendary:true, desc:'Vụ nổ siêu tân tinh hút quái và đóng băng toàn bản đồ.' },
  titan_fortress: { name:'Pháo Đài Titan',  icon:'🏛️',  branch:'fighter',   color:'#f97316', cd:10.0, dmg:180, isLegendary:true, desc:'Vô địch 2s, phản 200% sát thương và nổ AoE cực lớn.' },
  hurricane_barrage:{ name:'Bão Tên Lốc Xoáy',icon:'🌪️',branch:'ranger',  color:'#34d399', cd:7.0,  dmg:160, isLegendary:true, desc:'Lốc xoáy tên khổng lồ bắn 360 độ cực đại càn quét quái.' },
  judgment_day:   { name:'Ngày Phán Xét',   icon:'⚔️',  branch:'paladin',   color:'#fde68a', cd:12.0, dmg:300, isLegendary:true, desc:'Thánh giá từ trời giáng xuống thiêu đốt toàn bộ màn hình.' },
  lich_army:      { name:'Quân Đội Lich',   icon:'💀',  branch:'necromancer',color:'#94a3b8', cd:15.0, dmg:220, isLegendary:true, desc:'Triệu hồi Lich King bắn tia laser bóng tối phá hủy tất cả.' },
  grave_wrath:    { name:'Phẫn Nộ Đại Địa',icon:'🌿',  branch:'druid',     color:'#86efac', cd:10.0, dmg:240, isLegendary:true, desc:'Rễ cây trồi lên quật nát và đầu độc toàn bộ bản đồ.' },

  // EVOLVED ACTIVE SKILLS (MỚI)
  spell_storm:       { name:'Bão Tia Sét',      icon:'⛈️',  branch:'mage',        color:'#22d3ee', cd:1.0,  dmg:150, isLegendary:true, desc:'Bão Laser màu xanh neon càn quét liên hồi khắp màn hình.' },
  wind_runner:       { name:'Thần Gió',         icon:'🌪️',  branch:'ranger',      color:'#34d399', cd:1.8,  dmg:180, isLegendary:true, desc:'Bắn ra 3 lốc xoáy tên khổng lồ xoay tròn và đẩy lui quái liên tục.' },
  void_reaver:       { name:'Lưỡi Hái Hư Vô',   icon:'🌑',  branch:'assassin',    color:'#a855f7', cd:2.2,  dmg:200, isLegendary:true, desc:'6 đao găm hư vô bóng tối quay rộng bao trùm toàn bộ màn hình.' },
  aegis_smash:       { name:'Chấn Động Khiên Thần',icon:'🛡️', branch:'fighter',     color:'#facc15', cd:3.0,  dmg:220, isLegendary:true, desc:'Vụ nổ sóng chấn động cực đại phản lại toàn bộ sát thương quái chạm phải.' },
  hellfire_meteor:   { name:'Thiên Thạch Địa Ngục',icon:'🔥', branch:'mage',        color:'#ef4444', cd:4.0,  dmg:300, isLegendary:true, desc:'Cầu lửa khổng lồ lăn đè bẹp quái, phát nổ 3 lần liên tiếp.' },
  genesis_bloom:     { name:'Địa Đàng Gai',     icon:'🌹',  branch:'druid',       color:'#86efac', cd:4.5,  dmg:140, isLegendary:true, desc:'Thánh địa hoa hồng gai nở rộ gây độc mạnh và hút máu liên tục.' },
  grim_reaper:       { name:'Thần Chết',        icon:'☠️',  branch:'necromancer', color:'#94a3b8', cd:5.0,  dmg:250, isLegendary:true, desc:'Triệu hồi Thần Chết khổng lồ cầm lưỡi hái chém quét vòng tròn cực mạnh.' },
  glacial_sanctum:   { name:'Thánh Điện Băng',   icon:'❄️',  branch:'mage',        color:'#93c5fd', cd:3.0,  dmg:120, isLegendary:true, desc:'Bão tuyết thánh điện đóng băng quái và hồi phục 5% HP mỗi giây.' },
  archangel_light:   { name:'Hào Quang Thiên Sứ',icon:'👼',  branch:'paladin',     color:'#fde68a', cd:3.0,  dmg:180, isLegendary:true, desc:'Tia sáng quét liên tục, tặng Perk hồi máu khi tung chiêu (Không tiêu thụ Passive item).' },
  void_demon:        { name:'Hóa Quỷ Hư Vô',     icon:'😈',  branch:'assassin',    color:'#6d28d9', cd:10.0, dmg:260, isLegendary:true, desc:'Biến hình thành Quỷ Vương khổng lồ chém càn quét 360 độ chí mạng.' }
};

// ─── PASSIVE ITEMS DEFINITIONS ────────────────────────────────
const PASSIVE_ITEMS_DEFS = {
  spinach:       { name: 'Măng Tây (Spinach)',         icon: '🥬', desc: 'Tăng 10% sát thương kỹ năng mỗi cấp.', maxLevel: 5 },
  armor_plate:   { name: 'Giáp Sắt (Armor Plate)',     icon: '🛡️', desc: 'Giảm 6% sát thương nhận vào mỗi cấp.', maxLevel: 5 },
  hollow_heart:  { name: 'Tim Rỗng (Hollow Heart)',    icon: '🖤', desc: 'Tăng 15% Máu tối đa mỗi cấp.', maxLevel: 5 },
  attractorb:    { name: 'Nam Châm (Attractorb)',      icon: '🧲', desc: 'Tăng 25% tầm hút ngọc kinh nghiệm mỗi cấp.', maxLevel: 5 },
  candelabrador: { name: 'Chân Nến (Candelabrador)',   icon: '🕯️', desc: 'Tăng 10% kích thước diện rộng kỹ năng.', maxLevel: 5 },
  empty_tome:    { name: 'Sách Rỗng (Empty Tome)',     icon: '📖', desc: 'Giảm 6% thời gian hồi chiêu mỗi cấp.', maxLevel: 5 },
  clover:        { name: 'Cỏ 4 Lá (Clover)',           icon: '🍀', desc: 'Tăng 6% tỷ lệ chí mạng mỗi cấp.', maxLevel: 5 },
  wings:         { name: 'Đôi Cánh (Wings)',           icon: '🪶', desc: 'Tăng 8% tốc độ di chuyển mỗi cấp.', maxLevel: 5 },
  crown:         { name: 'Vương Miện (Crown)',         icon: '👑', desc: 'Tăng 20% lượng XP nhận được mỗi cấp.', maxLevel: 5 }
};

// Legendary combos: which base skills + what legendary they unlock
const LEGENDARY_COMBOS = [
  { branch:'assassin',   needs:['shadow_blades','shadow_clone','void_pulse','poison_dart'], unlocks:'specter_storm' },
  { branch:'mage',       needs:['frost_aura','magic_missile','thunder_ring','meteor'],      unlocks:'celestial_nova' },
  { branch:'fighter',    needs:['shield_bash','earthquake','iron_wall','rally'],            unlocks:'titan_fortress' },
  { branch:'ranger',     needs:['piercing_arrow','arrow_rain','spirit_wolf'],               unlocks:'hurricane_barrage' },
  { branch:'paladin',    needs:['holy_light','divine_shield','consecration'],               unlocks:'judgment_day' },
  { branch:'necromancer',needs:['summon_skeleton','death_grasp','soul_drain'],              unlocks:'lich_army' },
  { branch:'druid',      needs:['briar_patch','nature_regrowth','vine_whip'],               unlocks:'grave_wrath' },
];

// ─── LỆNH BÀI MODIFIER POOL ──────────────────────────────────
const LENH_BAI_POOL = [
  { id:'dai_hoa', icon:'🔥', name:'Đại Hỏa Kiếp',   desc:'Quái mang thuộc tính lửa, gây 20% thêm STH. Vàng x2.',
    apply: (G) => { G._modiFireEnemy=true; G._modiGoldMult=2.0; } },
  { id:'tuyet_phu', icon:'❄️', name:'Tuyết Phủ Thần',  desc:'Mọi thứ chậm -20%, XP x1.5.',
    apply: (G) => { G._modiSpeedSlow=0.80; G._modiXpMult=1.5; } },
  { id:'ngay_tan_the', icon:'💀', name:'Ngày Tận Thế', desc:'Quái sinh x2 nhưng drop legendary x3.',
    apply: (G) => { G._modiSpawnMult=2.0; G._modiLegendaryDrop=3.0; } },
  { id:'dem_vo_tan', icon:'🌙', name:'Đêm Vô Tận',   desc:'Luôn là ban đêm. STH +25%.',
    apply: (G) => { G._modiNightForce=true; G._modiDmgBonus=1.25; } },
  { id:'man_hinh_xanh', icon:'💚', name:'Hào Quang Xanh',desc:'Quái có 15% HP nhiều hơn nhưng nhả vàng x2.',
    apply: (G) => { G._modiEnemyHpMult=1.15; G._modiGoldMult=2.0; } },
  { id:'dinh_menh', icon:'⚡', name:'Định Mệnh Sấm',  desc:'Mỗi 30s sét đánh 1 mục tiêu ngẫu nhiên gần player.',
    apply: (G) => { G._modiLightningTimer=30; } },
  { id:'qua_tang', icon:'🎁',  name:'Của Trời Cho',   desc:'Merchant luôn có mặt, giá giảm 40%.',
    apply: (G) => { G.merchant.active=true; G.merchantPriceDiscount=0.6; } },
  { id:'xam_lan', icon:'🌊', name:'Xâm Lăng',        desc:'Quái sinh nhanh hơn 50% nhưng player +30% ATK.',
    apply: (G) => { G._modiSpawnMult=1.5; G.player.atkMult=(G.player.atkMult||1)*1.3; } },
  { id:'thien_su', icon:'👼', name:'Ân Huệ Thiên Sứ', desc:'+1 lần hồi sinh và +20% Hồi máu mỗi giây.',
    apply: (G) => { G._modiExtraRevive=true; G.player.hpRegenPerSec=(G.player.hpRegenPerSec||0)+20; } },
  { id:'dam_phan', icon:'🎲',  name:'Đàm Phán',        desc:'Bắt đầu với 3 upgrade choices ngay lập tức.',
    apply: (G) => { setTimeout(()=>G.showUpgradeChoice&&G.showUpgradeChoice(),1000); } },
  { id:'suc_manh_bong_toi', icon:'🌑', name:'Sức Mạnh Bóng Tối', desc:'Mọi kỹ năng +20% STH, +5% Lifesteal.',
    apply: (G) => { G.player.dmgMult=(G.player.dmgMult||1)*1.2; G.player.lifesteal=(G.player.lifesteal||0)+0.05; } },
  { id:'phong_trao', icon:'🌪️', name:'Phong Trào',    desc:'+40% Tốc chạy, kỹ năng AoE rộng +30%.',
    apply: (G) => { G.player.spdMult=(G.player.spdMult||1)*1.4; G.player.aoeMult=(G.player.aoeMult||1)*1.3; } },
];
// ─── Evolution Skins (10 stages) ───────────────────────────────
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
  },
  ranger: {
    5:  { name:'Tập Sự',       body1:'#4ade80', body2:'#166534', bodyHL:'#bbf7d0', eye:'#166534', outline:'#052e16', aura:'#22c55e', skinType:'leaf',       skill:'Mũi Tên Xuyên'  },
    6:  { name:'Thợ Săn',       body1:'#86efac', body2:'#15803d', bodyHL:'#bbf7d0', eye:'#15803d', outline:'#052e16', aura:'#4ade80', skinType:'horns',      skill:'Mưa Tên'        },
    7:  { name:'Tinh Anh',      body1:'#059669', body2:'#064e3b', bodyHL:'#a7f3d0', eye:'#059669', outline:'#000000', aura:'#10b981', skinType:'neko',       skill:'Sói Linh Hồn'   },
    8:  { name:'Cung Thủ Gió',   body1:'#34d399', body2:'#065f46', bodyHL:'#a7f3d0', eye:'#c084fc', outline:'#000000', aura:'#059669', skinType:'demon',      skill:'Bão Tên Lốc'    },
    9:  { name:'Bão Tố',        body1:'#00f2fe', body2:'#1d4ed8', bodyHL:'#e0f2fe', eye:'#22d3ee', outline:'#000000', aura:'#38bdf8', skinType:'celestial',  skill:'Siêu Tân Tinh'  },
    10: { name:'Thần Rừng Cung', body1:'#ffffff', body2:'#047857', bodyHL:'#e8f5e9', eye:'#000000', outline:'#000000', aura:'#10b981', skinType:'omega',      skill:'Tối Thượng'     }
  },
  paladin: {
    5:  { name:'Hộ Vệ Trẻ',     body1:'#fef08a', body2:'#ca8a04', bodyHL:'#fef9c3', eye:'#ca8a04', outline:'#422006', aura:'#eab308', skinType:'leaf',       skill:'Thánh Quang'    },
    6:  { name:'Hiệp Sĩ Thánh',  body1:'#fde68a', body2:'#b45309', bodyHL:'#fef3c7', eye:'#b45309', outline:'#451a03', aura:'#f59e0b', skinType:'horns',      skill:'Khiên Thánh'    },
    7:  { name:'Thập Tự Quân',   body1:'#fbbf24', body2:'#78350f', bodyHL:'#fef3c7', eye:'#78350f', outline:'#451a03', aura:'#d97706', skinType:'neko',       skill:'Đất Thánh'      },
    8:  { name:'Thánh Vệ Giả',   body1:'#fffbeb', body2:'#d97706', bodyHL:'#ffffff', eye:'#fbbf24', outline:'#000000', aura:'#fbbf24', skinType:'demon',      skill:'Ngày Phán Xét'  },
    9:  { name:'Đại Thiên Thần', body1:'#ffffff', body2:'#eab308', bodyHL:'#ffffff', eye:'#ffffff', outline:'#000000', aura:'#fbbf24', skinType:'celestial',  skill:'Thánh Điện'     },
    10: { name:'Thánh Vương',    body1:'#ffffff', body2:'#fbbf24', bodyHL:'#ffffff', eye:'#ffffff', outline:'#78350f', aura:'#fbbf24', skinType:'omega',      skill:'Thánh Linh'     }
  },
  necromancer: {
    5:  { name:'Tập Tế',        body1:'#475569', body2:'#1e293b', bodyHL:'#64748b', eye:'#a855f7', outline:'#0f172a', aura:'#475569', skinType:'leaf',       skill:'Triệu Hồi Xương' },
    6:  { name:'Phù Thủy Xương', body1:'#334155', body2:'#0f172a', bodyHL:'#475569', eye:'#22d3ee', outline:'#000000', aura:'#334155', skinType:'horns',      skill:'Bàn Tay Tử Thần' },
    7:  { name:'Kỵ Sĩ Vong Hồn', body1:'#1e1b4b', body2:'#0f0e26', bodyHL:'#312e81', eye:'#ef4444', outline:'#000000', aura:'#4f46e5', skinType:'demon',      skill:'Hút Linh Hồn'   },
    8:  { name:'Bán Thần Lich',  body1:'#581c87', body2:'#2e1065', bodyHL:'#7e22ce', eye:'#a855f7', outline:'#000000', aura:'#a855f7', skinType:'shadow',     skill:'Quân Đội Lich'  },
    9:  { name:'Vong Hồn Sứ',    body1:'#020617', body2:'#000000', bodyHL:'#1e293b', eye:'#c084fc', outline:'#000000', aura:'#6d28d9', skinType:'celestial',  skill:'Vương Quốc Vong' },
    10: { name:'Chúa Tể Xương',  body1:'#000000', body2:'#1e1b4b', bodyHL:'#4c1d95', eye:'#ffffff', outline:'#000000', aura:'#a855f7', skinType:'omega',      skill:'Hủy Diệt Vong'  }
  },
  druid: {
    5:  { name:'Dân Rừng',      body1:'#86efac', body2:'#166534', bodyHL:'#bbf7d0', eye:'#166534', outline:'#052e16', aura:'#22c55e', skinType:'leaf',       skill:'Bụi Gai'        },
    6:  { name:'Linh Thú Sư',    body1:'#4ade80', body2:'#15803d', bodyHL:'#bbf7d0', eye:'#15803d', outline:'#052e16', aura:'#4ade80', skinType:'horns',      skill:'Hồi Sinh Rừng'  },
    7:  { name:'Pháp Sư Rừng',   body1:'#b45309', body2:'#78350f', bodyHL:'#d97706', eye:'#78350f', outline:'#451a03', aura:'#f59e0b', skinType:'panda',      skill:'Roi Dây Leo'    },
    8:  { name:'Đại Pháp Sư',    body1:'#059669', body2:'#064e3b', bodyHL:'#a7f3d0', eye:'#4ade80', outline:'#000000', aura:'#10b981', skinType:'demon',      skill:'Phẫn Nộ Rừng'   },
    9:  { name:'Hóa Thân Rừng',  body1:'#10b981', body2:'#047857', bodyHL:'#6ee7b7', eye:'#a7f3d0', outline:'#000000', aura:'#10b981', skinType:'celestial',  skill:'Bảo Vệ Thiên'   },
    10: { name:'Thần Rừng Tối',  body1:'#ffffff', body2:'#065f46', bodyHL:'#a7f3d0', eye:'#ffffff', outline:'#000000', aura:'#10b981', skinType:'omega',      skill:'Thần Khởi Nguyên'}
  }
};


// ─── RARITY (kept for minimal compat) ───────────────────────
const RARITY_COLOR = { common:'#9ca3af', rare:'#60a5fa', epic:'#a78bfa', legendary:'#fbbf24' };
const RARITY_LABEL = { common:'Thường',  rare:'Hiếm',    epic:'Sử Thi',  legendary:'Huyền Thoại' };
// EQUIPMENT_POOL removed — chest/inventory system removed

// ─── STAGE SYSTEM STATE ───────────────────────────────────────
let selectedStage = 1;

// ─── ENEMY DEFINITIONS ───────────────────────────────────────
const ENEMY_TYPES = {
  // ── WAVE 1-3: Quái đầu game — PHẢI KHÓ NGAY TỪ ĐẦU ──
  slime:        { name:'Slime',        emoji:'🟢', hp:80,   dmg:12,  speed:90,  radius:18, wave:1,  xp:3,  gold:1,  color:'#4ade80' },
  bat:          { name:'Dơi Ma',       emoji:'🦇', hp:50,   dmg:10,  speed:160, radius:14, wave:1,  xp:2,  gold:1,  color:'#a855f7', _zigzag:true },
  goblin:       { name:'Goblin',       emoji:'👺', hp:100,  dmg:15,  speed:105, radius:20, wave:2,  xp:5,  gold:2,  color:'#86efac', ranged:true, range:280 },
  spider:       { name:'Nhện Độc',     emoji:'🕷️', hp:70,   dmg:14,  speed:130, radius:16, wave:2,  xp:4,  gold:1,  color:'#a3e635', _poison:true, poisonDmgPerSec:8 },
  wolf:         { name:'Sói Hoang',    emoji:'🐺', hp:130,  dmg:18,  speed:145, radius:20, wave:3,  xp:6,  gold:2,  color:'#d97706', _packHunter:true },
  // ── WAVE 4-8: Quái trung cấp ──
  knight:       { name:'Hiệp Sĩ',     emoji:'⚔️', hp:250,  dmg:28,  speed:70,  radius:26, wave:4,  xp:10, gold:4,  color:'#94a3b8', armor:0.30 },
  slime_king_jr:{ name:'Slime Khổng', emoji:'🟩', hp:400,  dmg:20,  speed:55,  radius:35, wave:4,  xp:12, gold:5,  color:'#22c55e', _splitter:true },
  orc:          { name:'Thú Orc',      emoji:'👹', hp:350,  dmg:32,  speed:80,  radius:30, wave:5,  xp:14, gold:5,  color:'#84cc16', armor:0.15 },
  dark_mage:    { name:'Pháp Sư Đen',  emoji:'🔮', hp:160,  dmg:35,  speed:72,  radius:22, wave:6,  xp:12, gold:5,  color:'#818cf8', ranged:true, range:370 },
  skeleton:     { name:'Xương Sống',   emoji:'💀', hp:180,  dmg:22,  speed:95,  radius:22, wave:6,  xp:9,  gold:3,  color:'#e2e8f0', _undead:true },
  // ── WAVE 9-13: Quái nguy hiểm ──
  shadow:       { name:'Bóng Tối',     emoji:'👤', hp:140,  dmg:26,  speed:155, radius:18, wave:7,  xp:8,  gold:3,  color:'#6d28d9', stealth:0.5 },
  vampire:      { name:'Ma Cà Rồng',   emoji:'🧛', hp:220,  dmg:30,  speed:120, radius:22, wave:8,  xp:14, gold:6,  color:'#be185d', _lifesteal:0.25 },
  golem:        { name:'Golem Đất',    emoji:'🪨', hp:600,  dmg:40,  speed:45,  radius:34, wave:9,  xp:20, gold:8,  color:'#78350f', armor:0.40, _slow:true },
  berserker:    { name:'Chiến Binh',   emoji:'💪', hp:340,  dmg:45,  speed:100, radius:28, wave:10, xp:15, gold:6,  color:'#ef4444', enrage:0.45 },
  phantom:      { name:'Hồn Ma',       emoji:'👻', hp:120,  dmg:28,  speed:130, radius:20, wave:10, xp:11, gold:4,  color:'#c084fc', stealth:0.6, _phaseThrough:true },
  // ── WAVE 14-18: Quái elite ──
  necromancer:  { name:'Gọi Hồn',     emoji:'🧙', hp:200,  dmg:22,  speed:78,  radius:22, wave:12, xp:18, gold:8,  color:'#64748b', summons:true },
  banshee:      { name:'Yêu Nữ',       emoji:'😱', hp:160,  dmg:50,  speed:100, radius:22, wave:13, xp:16, gold:7,  color:'#f9a8d4', ranged:true, range:420, _scream:true },
  executioner:  { name:'Đao Phủ',      emoji:'🪓', hp:450,  dmg:55,  speed:70,  radius:32, wave:14, xp:22, gold:10, color:'#b45309', _charge:true },
  ice_witch:    { name:'Phù Thủy Băng',emoji:'🧊', hp:190,  dmg:38,  speed:82,  radius:22, wave:15, xp:20, gold:9,  color:'#7dd3fc', ranged:true, range:380, _freeze:true },
  titan_minion: { name:'Tay Sai Titan', emoji:'💎', hp:800,  dmg:60,  speed:65,  radius:36, wave:16, xp:35, gold:15, color:'#7c3aed', armor:0.35 },
  // ── WAVE 18+: Quái cực mạnh ──
  dragon:       { name:'Rồng',         emoji:'🐉', hp:700,  dmg:60,  speed:115, radius:32, wave:17, xp:30, gold:15, color:'#f97316', fireBreath:true },
  death_knight: { name:'Kỵ Sĩ Tử',    emoji:'⚰️', hp:550,  dmg:65,  speed:85,  radius:30, wave:18, xp:30, gold:14, color:'#1e1b4b', armor:0.45, summons:true },
  hellhound:    { name:'Chó Địa Ngục', emoji:'🔥', hp:300,  dmg:50,  speed:165, radius:22, wave:19, xp:25, gold:12, color:'#dc2626', _charge:true, enrage:0.4 },
  void_crawler: { name:'Bò Hư Không',  emoji:'🌑', hp:900,  dmg:70,  speed:90,  radius:30, wave:20, xp:40, gold:18, color:'#312e81', _teleport:true },
  // ─── BOSSES (theo BOSS_SCHEDULE, HP rất nhiều để thách thức) ──────────
  // Phút 5 — Boss 1: vừa đủ thách thức
  boss_slime_king:  { name:'Vua Slime Khổng Lồ', emoji:'👑', hp:4000,   dmg:55,  speed:80,  radius:52, wave:5,  xp:80,  gold:60,  color:'#4ade80', isBoss:true,
                      _phases:[{ hpPct:0.6, rage:true }, { hpPct:0.3, speed:110 }] },
  // Phút 10 — Boss 2: nguy hiểm hơn nhiều
  boss_dark_lord:   { name:'Lãnh Chúa Bóng Đêm',  emoji:'🌑', hp:9000,   dmg:85,  speed:100, radius:54, wave:10, xp:150, gold:120, color:'#818cf8', isBoss:true, ranged:true, range:420,
                      summons:true, _phases:[{ hpPct:0.5, speed:120 }] },
  // Phút 15 — Boss 3: phun lửa, nhanh
  boss_dragon_queen:{ name:'Rồng Nữ Hoàng',        emoji:'🐉', hp:20000,  dmg:110, speed:115, radius:66, wave:15, xp:200, gold:200, color:'#f97316', isBoss:true, fireBreath:true,
                      _phases:[{ hpPct:0.5, speed:140, rage:true }] },
  // Phút 20 — Boss 4: cực mạnh
  boss_void_titan:  { name:'Titan Hư Không Vô Cực', emoji:'🌌', hp:50000,  dmg:140, speed:70,  radius:78, wave:20, xp:350, gold:400, color:'#7c3aed', isBoss:true,
                      _phases:[{ hpPct:0.65, enrage:true }, { hpPct:0.35, speed:100 }, { hpPct:0.15, speed:130 }] },
  // Phút 25 — Tiên phong Tử Thần: nhanh, tàng hình, triệu hồi
  boss_death_herald:{ name:'Tiên Phong Tử Thần',   emoji:'🕰️', hp:30000,  dmg:95,  speed:135, radius:46, wave:25, xp:200, gold:300, color:'#94a3b8', isBoss:true,
                      stealth:0.7, summons:true, ranged:true, range:450,
                      _desc:'Siêu nhanh, tàng hình cao, triệu hồi quái liên tục. Nguy hiểm!' },
  // Phút 28 — Hình dạng 1 của Tử Thần
  boss_reaper_form1:{ name:'⚠️ TỬ THẦN THỨC DẬY!',  emoji:'💀', hp:65000,  dmg:165, speed:110, radius:60, wave:28, xp:400, gold:600, color:'#dc2626', isBoss:true,
                      ranged:true, range:520, fireBreath:true,
                      _phases:[{ hpPct:0.5, speed:130, rage:true }],
                      _desc:'Hình dạng ban đầu — hãy chuẩn bị cho Tử Thần thực sự!' },
  // Phút 30 — TỬ THẦN THỰC SỰ: gần như bất khả chiến bại nếu chưa đủ mạnh
  boss_death_reaper:{ name:'💀 TỬ THẦN BẤT TỬ',     emoji:'⚰️', hp:250000, dmg:250, speed:145, radius:70, wave:30, xp:999, gold:2000, color:'#0f0f0f', isBoss:true,
                      fireBreath:true, enrage:0.35, summons:true,
                      _phases:[{ hpPct:0.7, speed:165 }, { hpPct:0.45, speed:190, enrageAll:true }, { hpPct:0.2, invulnFrames:true, speed:220 }],
                      _desc:'Thần Tử — Giết nó là chiến thắng!' },
};

// ─── GAME STATE ───────────────────────────────────────────────
let G = null; // Game instance
let selectedClass = 'assassin';
let savedData = null;

// ─── INIT ON LOAD ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadSaveData();
  updateGoldDisplay();
  selectClass('assassin');
  updateStageLockDisplay();
  selectStage(1);
  renderPowerupPanel();
  renderPetPanel();
});


// ─── SAVE / LOAD ──────────────────────────────────────────────
function loadSaveData() {
  const raw = localStorage.getItem('pve_save');
  if (raw) {
    try {
      savedData = JSON.parse(raw);
      if (!savedData.unlockedStages) savedData.unlockedStages = [1];
      if (!savedData.unlockedPassives) savedData.unlockedPassives = ['spinach', 'armor_plate', 'hollow_heart', 'candelabrador', 'empty_tome', 'wings'];
      if (!savedData.powerups) savedData.powerups = {};
      if (!savedData.mastery) savedData.mastery = {};
      if (!savedData.discovered) savedData.discovered = { skills: [], passives: [], evos: [], bosses: [] };
      if (!savedData.discovered.bosses) savedData.discovered.bosses = [];
      if (!savedData.unlockedPets) savedData.unlockedPets = [];
      if (savedData.activePet === undefined) savedData.activePet = null;
      if (savedData.lastRunGhost === undefined) savedData.lastRunGhost = null;
    } catch(e) {
      savedData = defaultSave();
    }
  } else {
    savedData = defaultSave();
  }
}

function defaultSave() {
  return {
    gold: 0, lastGoldEarned: 0,
    equipped: { weapon: null, armor: null, accessory: null },
    inventory: [],
    chestHistory: [],
    unlockedStages: [1],
    unlockedPassives: ['spinach', 'armor_plate', 'hollow_heart', 'candelabrador', 'empty_tome', 'wings'],
    powerups: {},
    mastery: {},
    discovered: { skills: [], passives: [], evos: [], bosses: [] },
    unlockedPets: [],
    activePet: null,
    lastRunGhost: null
  };
}


function saveToDisk() {
  localStorage.setItem('pve_save', JSON.stringify(savedData));
}

// ─── GOLD & SHOP ──────────────────────────────────────────────
function updateGoldDisplay() {
  if (!savedData) return;
  const el = document.getElementById('shopGoldAmount');
  const modalEl = document.getElementById('modalGoldAmount');
  const lastEl = document.getElementById('lastGoldEarned');
  if (el)    el.textContent = savedData.gold;
  if (modalEl) modalEl.textContent = savedData.gold;
  if (lastEl) lastEl.textContent = '+' + (savedData.lastGoldEarned || 0);
}

function openChest(type) {}
function showChestOpenModal(type, item) {}
function spawnChestParticles(rarity) {}
function closeChestModal() {}
function formatBonuses(bonus) { return ''; }
function updateChestHistory() {}
function buildInventoryGrid() {}
function renderInventory() {}
function equipItem(invIndex) {}
function unequipItem(slot) {}
function updateEquipSlots() {}
function updateEquipBonuses() {}

// ─── CLASS SELECTION (LOBBY) ──────────────────────────────────
function selectClass(cls) {
  selectedClass = cls;
  // Support both old .class-btn and new .class-chip selectors
  document.querySelectorAll('.class-btn, .class-chip').forEach(b => b.classList.toggle('active', b.dataset.class === cls));
  drawClassPreview(cls);
  updateClassStats(cls);
  const def = CLASSES[cls];
  const nameEl = document.getElementById('classPreviewName');
  const descEl = document.getElementById('classPreviewDesc');
  if (nameEl) nameEl.textContent = def.icon + ' ' + def.name;
  if (descEl) descEl.textContent = def.desc;
  
  // Class-exclusive skill and passive info
  const startSkillDef = SKILL_DEFS[def.startSkill];
  const classPassiveInfo = {
    assassin:    { passive: '⚡ Nội tại: +15% Chí mạng, +10% Tốc chạy', exclusive: `🎯 Chỉ học kỹ năng hệ Sát Thủ` },
    fighter:     { passive: '🛡️ Nội tại: +15% Kháng STH, Phản 15% cận chiến', exclusive: `🎯 Chỉ học kỹ năng hệ Đấu Sĩ` },
    mage:        { passive: '🔮 Nội tại: +20% STH phép, -10% Hồi chiêu', exclusive: `🎯 Chỉ học kỹ năng hệ Pháp Sư` },
    ranger:      { passive: '🏹 Nội tại: +15% Tốc bắn, +1 Tia xuyên thấu', exclusive: `🎯 Chỉ học kỹ năng hệ Cung Thủ` },
    paladin:     { passive: '✨ Nội tại: +5 HP/giây Hồi máu, Giáp x1.5', exclusive: `🎯 Chỉ học kỹ năng hệ Hộ Vệ` },
    necromancer: { passive: '💀 Nội tại: +20% Hút máu, +1 Đệ triệu hồi', exclusive: `🎯 Chỉ học kỹ năng hệ Gọi Hồn` },
    druid:       { passive: '🌿 Nội tại: Độc x2, Hồi máu khi đứng yên', exclusive: `🎯 Chỉ học kỹ năng hệ Thần Rừng` }
  };
  const info = classPassiveInfo[cls] || {};
  const startSkillName = startSkillDef ? `${startSkillDef.icon} K.năng đầu: ${startSkillDef.name}` : '';
  const passiveEl = document.getElementById('classPassiveDesc');
  if (passiveEl) passiveEl.textContent = `${info.passive || ''} • ${info.exclusive || ''} • ${startSkillName}`;
}


function updateClassStats(cls) {
  const s = CLASSES[cls].stats;
  document.getElementById('statHp').style.width  = s.hp + '%';
  document.getElementById('statSpd').style.width = s.spd + '%';
  document.getElementById('statAtk').style.width = s.atk + '%';
  document.getElementById('statDef').style.width = s.def + '%';
}

function selectStage(stageNum) {
  if (!savedData || !savedData.unlockedStages || !savedData.unlockedStages.includes(stageNum)) {
    showToast(`Bản đồ này đang bị khóa! Hãy vượt qua Stage ${stageNum - 1} để mở khóa.`, '#f87171');
    return;
  }
  selectedStage = stageNum;
  // Support both .stage-card and .stage-card-fancy
  document.querySelectorAll('.stage-card, .stage-card-fancy').forEach(card => {
    const s = parseInt(card.dataset.stage);
    card.classList.toggle('active', s === stageNum);
  });
}

function updateStageLockDisplay() {
  if (!savedData || !savedData.unlockedStages) return;
  const isUnlocked2 = savedData.unlockedStages.includes(2);
  const isUnlocked3 = savedData.unlockedStages.includes(3);
  
  const sc2 = document.getElementById('stageCard2');
  const sc3 = document.getElementById('stageCard3');
  
  if (sc2) {
    if (isUnlocked2) {
      sc2.classList.remove('locked');
      const lockIcon = sc2.querySelector('.stage-lock-icon');
      if (lockIcon) lockIcon.remove();
    } else {
      sc2.classList.add('locked');
    }
  }
  if (sc3) {
    if (isUnlocked3) {
      sc3.classList.remove('locked');
      const lockIcon = sc3.querySelector('.stage-lock-icon');
      if (lockIcon) lockIcon.remove();
    } else {
      sc3.classList.add('locked');
    }
  }
}
// ─── POWERUP SYSTEM ───────────────────────────────────────────
function getPowerupLevel(id) {
  return (savedData.powerups && savedData.powerups[id]) || 0;
}

function getPowerupCost(id) {
  const def = POWERUP_DEFS[id];
  const lv = getPowerupLevel(id);
  return Math.round(def.baseCost * Math.pow(def.costScale, lv));
}

function buyPowerup(id) {
  if (!savedData) return;
  const def = POWERUP_DEFS[id];
  const lv = getPowerupLevel(id);
  if (lv >= def.maxLevel) { showToast('Đã đạt cấp tối đa!', '#fbbf24'); return; }
  const cost = getPowerupCost(id);
  if (savedData.gold < cost) { showToast(`Không đủ vàng! Cần ${cost} 🪙`, '#f87171'); return; }
  savedData.gold -= cost;
  if (!savedData.powerups) savedData.powerups = {};
  savedData.powerups[id] = lv + 1;
  saveToDisk();
  updateGoldDisplay();
  renderPowerupPanel();
  showToast(`⬆️ ${def.name} lên Cấp ${lv + 1}!`, '#34d399');
}

function renderPowerupPanel() {
  const grid = document.getElementById('powerupGrid');
  if (!grid || !savedData) return;
  grid.innerHTML = '';
  Object.entries(POWERUP_DEFS).forEach(([id, def]) => {
    const lv = getPowerupLevel(id);
    const isMax = lv >= def.maxLevel;
    const cost = isMax ? '—' : getPowerupCost(id);
    const card = document.createElement('div');
    card.className = 'powerup-card' + (isMax ? ' maxed' : '');
    card.onclick = isMax ? null : () => buyPowerup(id);
    card.innerHTML = `
      <div class="pu-icon">${def.icon}</div>
      <div class="pu-info">
        <div class="pu-name">${def.name}</div>
        <div class="pu-desc">${def.desc}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
        <div class="pu-level">LV ${lv}/${def.maxLevel}</div>
        <div class="pu-cost">${isMax ? '✓ MAX' : '🪙' + cost}</div>
      </div>`;
    grid.appendChild(card);
  });
}


let _powerupTab = 'basic';

function switchPowerupTab(tab) {
  _powerupTab = tab;
  document.querySelectorAll('#pvePowerupModal .codex-tab').forEach(btn => {
    btn.classList.remove('active');
    btn.style.color = '#64748b';
  });
  
  const activeBtn = document.getElementById(tab === 'basic' ? 'btnPowerupBasic' : 'btnPowerupMastery');
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.style.color = '#fff';
  }
  
  const powerupGrid = document.getElementById('powerupGrid');
  const masteryTreeGrid = document.getElementById('masteryTreeGrid');
  
  if (tab === 'basic') {
    if (powerupGrid) {
      powerupGrid.classList.remove('hidden');
      powerupGrid.style.display = 'grid';
    }
    if (masteryTreeGrid) {
      masteryTreeGrid.classList.add('hidden');
      masteryTreeGrid.style.display = 'none';
    }
    renderPowerupPanel();
  } else {
    if (powerupGrid) {
      powerupGrid.classList.add('hidden');
      powerupGrid.style.display = 'none';
    }
    if (masteryTreeGrid) {
      masteryTreeGrid.classList.remove('hidden');
      masteryTreeGrid.style.display = 'grid';
    }
    renderMasteryPanel();
  }
}
window.switchPowerupTab = switchPowerupTab;

function isMasteryNodeUnlocked(nodeId) {
  const node = MASTERY_DEFS[nodeId];
  if (!node) return false;
  if (!node.dependsOn) return true;
  return !!(savedData.mastery && savedData.mastery[node.dependsOn]);
}

function buyMasteryNode(nodeId) {
  const node = MASTERY_DEFS[nodeId];
  if (!node || !savedData) return;
  if (savedData.mastery && savedData.mastery[nodeId]) {
    showToast('Thiên phú này đã được nâng cấp!', '#fbbf24');
    return;
  }
  if (!isMasteryNodeUnlocked(nodeId)) {
    showToast('Thiên phú này đang bị khóa! Cần nâng cấp nút trước đó.', '#f87171');
    return;
  }
  if (savedData.gold < node.cost) {
    showToast(`Không đủ vàng! Cần ${node.cost} 🪙`, '#f87171');
    return;
  }
  
  savedData.gold -= node.cost;
  if (!savedData.mastery) savedData.mastery = {};
  savedData.mastery[nodeId] = true;
  
  saveToDisk();
  updateGoldDisplay();
  renderMasteryPanel();
  showToast(`🌳 Đã nâng cấp thiên phú: ${node.name}!`, '#34d399');
}
window.buyMasteryNode = buyMasteryNode;

function renderMasteryPanel() {
  const grid = document.getElementById('masteryTreeGrid');
  if (!grid || !savedData) return;
  grid.innerHTML = '';
  
  if (!savedData.mastery) savedData.mastery = {};
  
  Object.entries(MASTERY_DEFS).forEach(([id, def]) => {
    const isPurchased = !!savedData.mastery[id];
    const isUnlocked = isMasteryNodeUnlocked(id);
    const isAffordable = savedData.gold >= def.cost;
    
    const card = document.createElement('div');
    card.className = 'powerup-card';
    card.style.position = 'relative';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.justifyContent = 'space-between';
    card.style.height = '140px';
    card.style.padding = '12px';
    card.style.borderRadius = '12px';
    card.style.border = '1px solid';
    card.style.transition = 'all 0.25s';
    
    if (isPurchased) {
      card.style.background = 'rgba(52,211,153,0.06)';
      card.style.borderColor = '#10b981';
      card.style.boxShadow = '0 0 10px rgba(16,185,129,0.15)';
    } else if (isUnlocked) {
      card.style.background = 'rgba(255,255,255,0.02)';
      card.style.borderColor = isAffordable ? '#fbbf24' : 'rgba(255,255,255,0.15)';
      card.style.cursor = 'pointer';
      if (isAffordable) {
        card.style.boxShadow = '0 0 8px rgba(251,191,36,0.08)';
      }
      card.onclick = () => buyMasteryNode(id);
    } else {
      card.style.background = 'rgba(0,0,0,0.3)';
      card.style.borderColor = 'rgba(255,255,255,0.04)';
      card.style.opacity = '0.4';
      card.style.cursor = 'not-allowed';
    }
    
    let depHtml = '';
    if (def.dependsOn) {
      const parentNode = MASTERY_DEFS[def.dependsOn];
      depHtml = `<div style="font-size: 8px; color: #a78bfa; margin-top: 2px;">Yêu cầu: ${parentNode.name}</div>`;
    } else {
      depHtml = `<div style="font-size: 8px; color: #34d399; margin-top: 2px;">Nút khởi đầu</div>`;
    }
    
    let footerHtml = '';
    if (isPurchased) {
      footerHtml = `<div style="color: #34d399; font-size: 11px; font-weight: 800; text-align: right;">✓ ĐÃ BẬT</div>`;
    } else if (isUnlocked) {
      footerHtml = `<div style="color: ${isAffordable ? '#fbbf24' : '#ef4444'}; font-size: 11px; font-weight: 800; text-align: right;">🪙 ${def.cost}</div>`;
    } else {
      footerHtml = `<div style="color: #64748b; font-size: 11px; font-weight: 800; text-align: right;">🔒 KHÓA</div>`;
    }
    
    card.innerHTML = `
      <div style="display: flex; gap: 10px; align-items: flex-start;">
        <div style="font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${def.icon}</div>
        <div>
          <div style="font-weight: 700; font-size: 12px; color: #fff; line-height: 1.2;">${def.name}</div>
          ${depHtml}
        </div>
      </div>
      <div style="font-size: 9px; color: #94a3b8; line-height: 1.3; margin: 6px 0; height: 32px; display: flex; align-items: center;">
        ${def.desc}
      </div>
      <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="font-size: 8px; color: #64748b;">MASTERY</div>
        ${footerHtml}
      </div>
    `;
    grid.appendChild(card);
  });
}
window.renderMasteryPanel = renderMasteryPanel;

function openPowerupModal() {
  const modal = document.getElementById('pvePowerupModal');
  if (modal) {
    modal.classList.remove('hidden');
    updateGoldDisplay();
    switchPowerupTab('basic');
  }
}

function closePowerupModal() {
  const modal = document.getElementById('pvePowerupModal');
  if (modal) modal.classList.add('hidden');
}


const PETS_DEFS = {
  corgi: { id: 'corgi', name: 'Corgi 🐶', emoji: '🐶', cost: 1500, desc: '+15% Vàng vĩnh viễn' },
  owl:   { id: 'owl',   name: 'Owl 🦉',   emoji: '🦉', cost: 3000, desc: '+15% XP vĩnh viễn' },
  kitty: { id: 'kitty', name: 'Kitty 🐱', emoji: '🐱', cost: 4500, desc: '+15 HP hồi/giây vĩnh viễn' }
};

// Pet lobby canvas animations
let _petLobbyAnims = [];
let _petLobbyFrame = 0;

function stopPetLobbyAnims() {
  _petLobbyAnims.forEach(id => cancelAnimationFrame(id));
  _petLobbyAnims = [];
}

// ── LOBBY PET DRAW FUNCTIONS ──
function drawLobbyPetCorgi(ctx, cx, cy, frame) {
  const t = frame * 16;
  ctx.save(); ctx.translate(cx, cy);
  ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 10;
  // Body
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.ellipse(0, 0, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
  // Belly
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath(); ctx.ellipse(0, 3, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Head
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.arc(11, -4, 8, 0, Math.PI * 2); ctx.fill();
  // Snout
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath(); ctx.ellipse(16, -2, 5, 3.5, 0.2, 0, Math.PI * 2); ctx.fill();
  // Nose
  ctx.fillStyle = '#1e293b';
  ctx.beginPath(); ctx.arc(18, -2, 1.5, 0, Math.PI * 2); ctx.fill();
  // Ears
  ctx.fillStyle = '#d97706';
  ctx.beginPath(); ctx.moveTo(8,-10); ctx.lineTo(6,-18); ctx.lineTo(13,-13); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(13,-9); ctx.lineTo(15,-17); ctx.lineTo(18,-11); ctx.closePath(); ctx.fill();
  // Eyes
  ctx.fillStyle = '#1e293b'; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(13,-6,2.2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(13.6,-6.5,0.7,0,Math.PI*2); ctx.fill();
  // Wagging tail
  const wag = Math.sin(t/100)*0.6;
  ctx.save(); ctx.translate(-12,-3); ctx.rotate(-wag-0.4);
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.ellipse(0,0,4,2.5,0,0,Math.PI*2); ctx.fill();
  ctx.restore();
  // Legs
  ctx.strokeStyle = '#d97706'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  [[-6,9],[-1,9],[4,9],[9,9]].forEach(([lx,ly],i) => {
    ctx.save(); ctx.translate(lx,ly);
    ctx.rotate(Math.sin(t/90+i*1.3)*0.35);
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,7); ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}

function drawLobbyPetOwl(ctx, cx, cy, frame) {
  const t = frame * 16;
  ctx.save(); ctx.translate(cx, cy);
  ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 12;
  const wf = Math.sin(t/120)*0.35;
  ctx.fillStyle = '#6d28d9';
  ctx.save(); ctx.translate(-10,-2); ctx.rotate(-wf);
  ctx.beginPath(); ctx.ellipse(0,0,11,5,-0.4,0,Math.PI*2); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(10,-2); ctx.rotate(wf);
  ctx.beginPath(); ctx.ellipse(0,0,11,5,0.4,0,Math.PI*2); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#4c1d95';
  ctx.beginPath(); ctx.ellipse(0,2,9,11,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath(); ctx.ellipse(0,4,6,7,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#4c1d95';
  ctx.beginPath(); ctx.arc(0,-9,8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#6d28d9';
  ctx.beginPath(); ctx.moveTo(-6,-14); ctx.lineTo(-8,-22); ctx.lineTo(-2,-16); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6,-14); ctx.lineTo(8,-22); ctx.lineTo(2,-16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fbbf24'; ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(-3.5,-9,3.5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(3.5,-9,3.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000'; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(-3.5,-9,1.8,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(3.5,-9,1.8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath(); ctx.moveTo(-2,-7); ctx.lineTo(0,-4); ctx.lineTo(2,-7); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawLobbyPetKitty(ctx, cx, cy, frame) {
  const t = frame * 16;
  ctx.save(); ctx.translate(cx, cy);
  ctx.shadowColor = '#ec4899'; ctx.shadowBlur = 10;
  const ts = Math.sin(t/150)*0.8;
  ctx.strokeStyle = '#f9a8d4'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.save(); ctx.translate(-12,4); ctx.rotate(ts-0.5);
  ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(-10,-12,-8,-20); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#f9a8d4';
  ctx.beginPath(); ctx.ellipse(0,3,11,8,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fce7f3';
  ctx.beginPath(); ctx.ellipse(0,5,7,5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#f9a8d4';
  ctx.beginPath(); ctx.arc(0,-8,9,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#f472b6';
  ctx.beginPath(); ctx.moveTo(-7,-14); ctx.lineTo(-10,-22); ctx.lineTo(-2,-16); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(7,-14); ctx.lineTo(10,-22); ctx.lineTo(2,-16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fce7f3';
  ctx.beginPath(); ctx.moveTo(-6,-15); ctx.lineTo(-8,-20); ctx.lineTo(-3,-16); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6,-15); ctx.lineTo(8,-20); ctx.lineTo(3,-16); ctx.closePath(); ctx.fill();
  const blink = (Math.floor(t/3000)%8===0) ? 0.15 : 1.0;
  ctx.fillStyle = '#10b981'; ctx.shadowColor = '#10b981'; ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.ellipse(-3.5,-9,3,3*blink,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(3.5,-9,3,3*blink,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000'; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(-3.5,-9,1.5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(3.5,-9,1.5,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0,-6); ctx.lineTo(-13,-8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-5); ctx.lineTo(-13,-4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-6); ctx.lineTo(13,-8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-5); ctx.lineTo(13,-4); ctx.stroke();
  ctx.fillStyle = '#f472b6';
  ctx.beginPath(); ctx.arc(0,-6,1.5,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawLobbyPetWolf(ctx, cx, cy, frame) {
  const t = frame * 16;
  ctx.save(); ctx.translate(cx, cy);
  ctx.shadowColor = '#60a5fa'; ctx.shadowBlur = 10;
  ctx.fillStyle = '#93c5fd';
  ctx.beginPath(); ctx.ellipse(0,2,13,9,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#eff6ff';
  ctx.beginPath(); ctx.ellipse(0,5,8,5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#93c5fd';
  ctx.beginPath(); ctx.arc(11,-3,8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#bfdbfe';
  ctx.beginPath(); ctx.moveTo(7,-9); ctx.lineTo(5,-17); ctx.lineTo(12,-12); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(12,-8); ctx.lineTo(14,-16); ctx.lineTo(18,-10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1e40af'; ctx.shadowColor = '#60a5fa'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(13,-4,2.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(14,-4.5,0.8,0,Math.PI*2); ctx.fill();
  const wag = Math.sin(t/120)*0.7;
  ctx.save(); ctx.translate(-13,-2); ctx.rotate(-wag-0.3);
  ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(-8,-8,-6,-14); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

function drawLobbyPetImp(ctx, cx, cy, frame) {
  const t = frame * 16;
  const bobY = Math.sin(t/80)*3;
  ctx.save(); ctx.translate(cx, cy - 5 + bobY);
  ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 12;
  ctx.fillStyle = '#dc2626';
  ctx.beginPath(); ctx.ellipse(0,2,9,7,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(0,-5,8,0,Math.PI*2); ctx.fill();
  // Horns
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath(); ctx.moveTo(-5,-11); ctx.lineTo(-7,-20); ctx.lineTo(-1,-14); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(5,-11); ctx.lineTo(7,-20); ctx.lineTo(1,-14); ctx.closePath(); ctx.fill();
  // Eyes
  ctx.fillStyle = '#fbbf24'; ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(-3,-5,2.5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(3,-5,2.5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000'; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(-3,-5,1.2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(3,-5,1.2,0,Math.PI*2); ctx.fill();
  // Tail
  ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  const ts = Math.sin(t/100)*0.8;
  ctx.save(); ctx.translate(-9,7); ctx.rotate(ts);
  ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(-8,8,-6,14); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

function drawLobbyPetGolem(ctx, cx, cy, frame) {
  const t = frame * 16;
  const bobY = Math.sin(t/120)*2;
  ctx.save(); ctx.translate(cx, cy + bobY);
  ctx.shadowColor = '#34d399'; ctx.shadowBlur = 12;
  // Body (stone)
  ctx.fillStyle = '#374151';
  ctx.beginPath(); ctx.roundRect(-10,-5,20,18,3); ctx.fill();
  ctx.fillStyle = '#4b5563';
  ctx.beginPath(); ctx.roundRect(-8,-3,16,14,2); ctx.fill();
  // Head
  ctx.fillStyle = '#374151';
  ctx.beginPath(); ctx.roundRect(-8,-17,16,14,3); ctx.fill();
  // Eyes (glowing)
  ctx.fillStyle = '#34d399'; ctx.shadowColor = '#34d399'; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(-3,-12,3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(3,-12,3,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  // Arms
  ctx.fillStyle = '#374151';
  ctx.beginPath(); ctx.roundRect(-18,0,8,10,2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(10,0,8,10,2); ctx.fill();
  ctx.restore();
}

function renderPetPanel() {
  const grid = document.getElementById('petGrid');
  if (!grid || !savedData) return;
  grid.innerHTML = '';

  // Also populate pet canvas preview row if it exists
  const canvasRow = document.getElementById('petCanvasRow');
  if (canvasRow) {
    canvasRow.innerHTML = '';
    stopPetLobbyAnims();
    _petLobbyFrame = 0;

    Object.entries(PETS_DEFS).forEach(([id, def]) => {
      const isUnlocked = (savedData.unlockedPets || []).includes(id);
      const isActive = savedData.activePet === id;

      const item = document.createElement('div');
      item.className = 'pet-canvas-item';
      item.title = def.name + ' — ' + def.desc;
      item.onclick = () => isUnlocked ? equipPet(id) : buyPet(id);

      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 64;
      cv.style.borderRadius = '50%';
      cv.style.border = isActive ? '2px solid #fbbf24' : (isUnlocked ? '2px solid rgba(52,211,153,0.4)' : '2px solid rgba(255,255,255,0.08)');
      cv.style.background = isActive ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)';
      cv.style.opacity = isUnlocked ? '1' : '0.45';
      cv.style.filter = isActive ? 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' : '';

      const nameEl = document.createElement('div');
      nameEl.className = 'pet-canvas-name';
      nameEl.textContent = def.name;
      nameEl.style.color = isActive ? '#fbbf24' : (isUnlocked ? '#94a3b8' : '#374151');

      item.appendChild(cv);
      item.appendChild(nameEl);
      canvasRow.appendChild(item);

      // Animate each pet canvas
      const ctx2 = cv.getContext('2d');
      let frame = 0;
      const petId = id;

      function animatePet(animFrame) {
        frame++;
        ctx2.clearRect(0, 0, 64, 64);

        // Draw pet using existing drawPet functions based on type
        const petAnimMap = {
          corgi: drawLobbyPetCorgi,
          owl: drawLobbyPetOwl,
          kitty: drawLobbyPetKitty,
          wolf_pup: drawLobbyPetWolf,
          imp: drawLobbyPetImp,
          golem: drawLobbyPetGolem,
        };

        const drawFn = petAnimMap[petId];
        if (drawFn) {
          drawFn(ctx2, 32, 38, frame);
        } else {
          // Fallback: emoji
          ctx2.font = '28px serif';
          ctx2.textAlign = 'center';
          ctx2.textBaseline = 'middle';
          const bobY = Math.sin(frame * 0.06) * 2;
          ctx2.fillText(def.emoji, 32, 32 + bobY);
        }

        const lobby = document.getElementById('pvelobby');
        if (lobby && !lobby.classList.contains('hidden')) {
          const rafId = requestAnimationFrame(animatePet);
          _petLobbyAnims.push(rafId);
        }
      }
      const rafId = requestAnimationFrame(animatePet);
      _petLobbyAnims.push(rafId);
    });
  }

  // Render the grid cards below
  Object.entries(PETS_DEFS).forEach(([id, def]) => {
    const isUnlocked = (savedData.unlockedPets || []).includes(id);
    const isActive = savedData.activePet === id;

    const card = document.createElement('div');
    card.style.cssText = `background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:8px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px;position:relative;transition:all 0.2s;cursor:pointer;`;
    if (isActive) {
      card.style.borderColor = '#fbbf24';
      card.style.boxShadow = '0 0 10px rgba(251,191,36,0.15)';
      card.style.background = 'rgba(251,191,36,0.05)';
    }

    let btnHtml = '';
    if (isActive) {
      btnHtml = `<div style="background:rgba(251,191,36,0.18);border:1px solid #fbbf24;color:#fbbf24;font-size:9px;font-weight:800;border-radius:6px;padding:2px 6px;">⚡ ĐANG DÙNG</div>`;
    } else if (isUnlocked) {
      btnHtml = `<button onclick="equipPet('${id}')" style="background:#1e293b;border:1px solid #475569;color:#e2e8f0;font-size:9px;font-weight:700;border-radius:6px;padding:2px 6px;cursor:pointer;">Chọn</button>`;
    } else {
      btnHtml = `<button onclick="buyPet('${id}')" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border:none;color:#fff;font-size:9px;font-weight:700;border-radius:6px;padding:3px 6px;cursor:pointer;">🪙${def.cost}</button>`;
    }

    card.innerHTML = `
      <div style="font-size:22px;${isUnlocked?'':'filter:grayscale(0.8) opacity(0.5);'}">${def.emoji}</div>
      <div style="font-weight:700;font-size:10px;color:${isActive?'#fbbf24':'#e2e8f0'};">${def.name}</div>
      <div style="font-size:8px;color:#475569;line-height:1.3;height:20px;overflow:hidden;">${def.desc}</div>
      <div style="margin-top:1px;">${btnHtml}</div>
    `;
    grid.appendChild(card);
  });
}


function buyPet(id) {
  const def = PETS_DEFS[id];
  if (!def || !savedData) return;
  if (savedData.gold < def.cost) {
    showToast(`Không đủ vàng! Cần ${def.cost} 🪙`, '#f87171');
    return;
  }
  savedData.gold -= def.cost;
  if (!savedData.unlockedPets) savedData.unlockedPets = [];
  savedData.unlockedPets.push(id);
  savedData.activePet = id;
  saveToDisk();
  updateGoldDisplay();
  renderPetPanel();
  showToast(`🐾 Đã mở khóa thần thú ${def.name}!`, '#34d399');
}

function equipPet(id) {
  if (!savedData) return;
  savedData.activePet = id;
  saveToDisk();
  renderPetPanel();
  const def = PETS_DEFS[id];
  showToast(`🐾 Thần thú ${def ? def.name : 'không'} đã đồng hành cùng bạn!`, '#38bdf8');
}

window.buyPet = buyPet;
window.equipPet = equipPet;
window.closePowerupModal = closePowerupModal;

function closeBossEncounter() {
  const modal = document.getElementById('bossEncounterModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.add('hidden');
  }
  if (G) G.resume();
}
window.closeBossEncounter = closeBossEncounter;

// ─── CODEX SYSTEM ─────────────────────────────────────────────
let _codexTab = 'skills';

function discoverItem(type, id) {
  if (!savedData || !savedData.discovered) return;
  const arr = savedData.discovered[type];
  if (arr && !arr.includes(id)) {
    arr.push(id);
    saveToDisk();
  }
}

function openCodex() {
  const screen = document.getElementById('pveCodexScreen');
  if (screen) screen.classList.remove('hidden');
  renderCodex(_codexTab);
}
window.openCodex = openCodex;

function closeCodex() {
  const screen = document.getElementById('pveCodexScreen');
  if (screen) screen.classList.add('hidden');
  // If called from in-game, resume
  if (G && G.paused && document.getElementById('pvePauseOverlay').classList.contains('hidden')) {
    G.resume();
  }
}
window.closeCodex = closeCodex;

function switchCodexTab(tab) {
  _codexTab = tab;
  document.querySelectorAll('.codex-tab').forEach(btn => btn.classList.remove('active'));
  const tabEl = document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
  if (tabEl) tabEl.classList.add('active');
  renderCodex(tab);
}
window.switchCodexTab = switchCodexTab;

function renderCodex(tab) {
  const body = document.getElementById('codexBody');
  const countEl = document.getElementById('codexDiscoveredCount');
  if (!body) return;
  if (!savedData) savedData = defaultSave();
  if (!savedData.discovered) savedData.discovered = { skills: [], passives: [], evos: [], bosses: [] };
  if (!savedData.discovered.bosses) savedData.discovered.bosses = [];
  body.innerHTML = '';
  body.style.gridTemplateColumns = tab === 'evolutions' ? 'repeat(auto-fill, minmax(260px, 1fr))' : 'repeat(auto-fill, minmax(130px, 1fr))';
  
  const disc = savedData.discovered;
  let total = 0, found = 0;

  if (tab === 'skills') {
    Object.entries(SKILL_DEFS).forEach(([id, def]) => {
      const known = disc.skills.includes(id);
      total++; if (known) found++;
      const card = document.createElement('div');
      card.className = 'codex-card' + (known ? '' : ' undiscovered');
      card.innerHTML = `
        <div class="c-icon">${known ? def.icon : '❓'}</div>
        <div class="c-name">${known ? def.name : '???'}</div>
        ${known ? `<div class="c-desc">${def.desc}</div>` : '<div class="c-desc">Chưa khám phá</div>'}
        ${known ? `<div class="c-type">${def.branch}</div>` : ''}`;
      body.appendChild(card);
    });
  } else if (tab === 'passives') {
    Object.entries(PASSIVE_ITEMS_DEFS).forEach(([id, def]) => {
      const known = disc.passives.includes(id) || savedData.unlockedPassives.includes(id);
      total++; if (known) found++;
      const card = document.createElement('div');
      card.className = 'codex-card' + (known ? '' : ' undiscovered');
      card.innerHTML = `
        <div class="c-icon">${known ? def.icon : '❓'}</div>
        <div class="c-name">${known ? def.name : '???'}</div>
        ${known ? `<div class="c-desc">${def.desc}</div>` : '<div class="c-desc">Chưa mở khóa</div>'}`;
      body.appendChild(card);
    });
  } else if (tab === 'evolutions') {
    [...EVO_COMBOS, ...UNION_COMBOS].forEach(combo => {
      const evoId = combo.evolvedSkill;
      const known = disc.evos.includes(evoId);
      total++; if (known) found++;
      const card = document.createElement('div');
      card.className = 'codex-card evo-card' + (known ? '' : ' undiscovered');
      if (known) {
        const base1Def = SKILL_DEFS[combo.baseSkill || combo.baseSkill1];
        const base2Def = combo.baseSkill2 ? SKILL_DEFS[combo.baseSkill2] : PASSIVE_ITEMS_DEFS[combo.passiveItem];
        const evoDef = SKILL_DEFS[evoId];
        const typeLabel = combo.type || 'EVOLUTION';
        const typeColors = { EVOLUTION:'#fbbf24', UNION:'#93c5fd', GIFT:'#fde68a', MORPH:'#c084fc' };
        card.innerHTML = `
          <div class="evo-lhs">
            <span style="font-size:26px">${base1Def?.icon || '❓'}</span>
            <span style="font-size:12px;color:#94a3b8;">+</span>
            <span style="font-size:26px">${base2Def?.icon || '❓'}</span>
          </div>
          <div class="evo-arrow">→</div>
          <div style="text-align:center;">
            <div style="font-size:26px;">${evoDef?.icon || '⭐'}</div>
            <div style="font-size:10px;font-weight:800;color:${typeColors[typeLabel]||'#fbbf24'}">${typeLabel}</div>
            <div style="font-size:11px;color:#94a3b8;">${evoDef?.name || evoId}</div>
          </div>`;
      } else {
        card.innerHTML = `
          <div class="evo-lhs">
            <span style="font-size:26px;color:#374151;">❓</span>
            <span style="font-size:12px;color:#374151;">+</span>
            <span style="font-size:26px;color:#374151;">❓</span>
          </div>
          <div class="evo-arrow" style="color:#374151;">→</div>
          <div style="text-align:center;">
            <div style="font-size:26px;color:#374151;">❓</div>
            <div style="font-size:11px;color:#374151;">Chưa khám phá</div>
          </div>`;
      }
      body.appendChild(card);
    });
  } else if (tab === 'bosses') {
    const bossIds = Object.keys(ENEMY_TYPES).filter(id => ENEMY_TYPES[id].isBoss);
    bossIds.forEach(id => {
      const def = ENEMY_TYPES[id];
      const known = (savedData.discovered.bosses || []).includes(id);
      total++; if (known) found++;
      const card = document.createElement('div');
      card.className = 'codex-card' + (known ? '' : ' undiscovered');
      card.innerHTML = `
        <div class="c-icon" style="font-size:28px">${known ? def.emoji : '❓'}</div>
        <div class="c-name">${known ? def.name : '???'}</div>
        ${known ? `<div class="c-desc">HP: ${def.hp.toLocaleString()} \u2022 STH: ${def.dmg}</div>
          <div class="c-type" style="color:#ef4444">BOSS</div>` : '<div class="c-desc">Chưa gặp</div>'}`;
      body.appendChild(card);
    });
  }
  if (countEl) countEl.textContent = `${found} / ${total} đã khám phá`;
}

// Lobby preview animation state
let _lobbyPreviewAnim = null;
let _lobbyPreviewFrame = 0;

function drawClassPreview(cls) {
  const canvas = document.getElementById('classPreviewCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const def = CLASSES[cls];
  const W = canvas.width, H = canvas.height;

  // Cancel any existing animation
  if (_lobbyPreviewAnim) { cancelAnimationFrame(_lobbyPreviewAnim); _lobbyPreviewAnim = null; }

  // Determine radius scale based on canvas size (160x200 or 110x110)
  const isLarge = W >= 150;
  const r = isLarge ? 44 : 35;
  const cx = W / 2;
  const cy = isLarge ? H * 0.55 : H / 2;

  function renderFrame() {
    _lobbyPreviewFrame++;
    ctx.clearRect(0, 0, W, H);

    // Animated aura glow
    const pulse = 0.85 + 0.15 * Math.sin(_lobbyPreviewFrame * 0.04);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.5 * pulse);
    grad.addColorStop(0, def.color + '44');
    grad.addColorStop(0.5, def.color + '18');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Orbiting particles
    if (isLarge) {
      const t = _lobbyPreviewFrame * 0.025;
      for (let i = 0; i < 5; i++) {
        const angle = t + (i / 5) * Math.PI * 2;
        const dist = r * 1.7 + Math.sin(t * 2 + i) * 6;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist * 0.5; // elliptical orbit
        const size = 2.5 + 1.5 * Math.sin(t * 3 + i);
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = def.color + 'bb';
        ctx.fill();
      }
    }

    // Idle bob animation
    const bobY = isLarge ? Math.sin(_lobbyPreviewFrame * 0.035) * 4 : 0;

    const sp = {
      id: 'preview',
      isPlayer: true,
      lvl: 5,
      brnch: cls,
      radius: r,
      angle: -Math.PI / 2,
      a: -Math.PI / 2,
      vx: 0, vy: 0,
      shld: false,
      rage: false,
      stn: false,
      slw: false,
      dash: false,
      stealth: false,
      hp: def.hp,
      mhp: def.hp,
      n: def.name,
    };
    const cp = {
      x: cx,
      y: cy + bobY,
      lastHit: 0,
      attackAnim: null,
    };

    drawCharacter(sp, cp, ctx);

    // Ground shadow
    if (isLarge) {
      const shadowAlpha = 0.3 + 0.1 * Math.sin(_lobbyPreviewFrame * 0.035);
      const shadowGrad = ctx.createRadialGradient(cx, cy + r * 1.0, 0, cx, cy + r * 1.0, r * 1.2);
      shadowGrad.addColorStop(0, `rgba(0,0,0,${shadowAlpha})`);
      shadowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = shadowGrad;
      ctx.ellipse(cx, cy + r * 0.98 - bobY * 0.3, r * 1.1, r * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Only animate if lobby is visible
    const lobby = document.getElementById('pvelobby');
    if (lobby && !lobby.classList.contains('hidden')) {
      _lobbyPreviewAnim = requestAnimationFrame(renderFrame);
    }
  }

  renderFrame();
}

function drawLobbyWeapon(ctx, cls, cx, cy, r, color) {
  ctx.save();
  switch(cls) {
    case 'assassin': // Two small daggers
      ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx + r * 0.9, cy - r * 0.5); ctx.lineTo(cx + r * 1.5, cy - r * 1.0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + r * 0.9, cy + r * 0.2); ctx.lineTo(cx + r * 1.5, cy + r * 0.7); ctx.stroke();
      break;
    case 'fighter': // Big sword
      ctx.fillStyle = '#94a3b8'; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
      ctx.fillRect(cx + r * 0.9, cy - r * 1.2, 8, r * 2.4);
      ctx.fillStyle = '#fbbf24'; ctx.fillRect(cx + r * 0.7, cy - r * 0.12, 14, 8);
      ctx.stroke();
      break;
    case 'mage': // Star orb
      ctx.shadowBlur = 16; ctx.shadowColor = color;
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx + r * 1.15, cy - r * 0.8, 8, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      break;
    case 'ranger': // Bow
      ctx.strokeStyle = '#86efac'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx + r * 0.95, cy, r * 0.7, -Math.PI * 0.6, Math.PI * 0.6, false); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx + r * 0.95, cy - r * 0.45); ctx.lineTo(cx + r * 0.95, cy + r * 0.45); ctx.stroke();
      break;
    case 'paladin': // Holy hammer
      ctx.fillStyle = '#fde68a'; ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2;
      ctx.fillRect(cx + r * 0.85, cy - r * 1.2, 16, 10); // hammer head
      ctx.fillRect(cx + r * 0.91, cy - r * 1.1, 4, r * 2.2); // handle
      ctx.stroke();
      break;
    case 'necromancer': // Skull staff
      ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
      ctx.fillRect(cx + r * 0.95, cy - r * 0.5, 4, r * 1.6); // staff
      ctx.beginPath(); ctx.arc(cx + r * 0.97, cy - r * 0.7, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      break;
    case 'druid': // Leaf nature staff
      ctx.strokeStyle = '#86efac'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx + r * 0.9, cy + r * 0.9); ctx.lineTo(cx + r * 1.1, cy - r * 1.0); ctx.stroke();
      ctx.fillStyle = '#4ade80';
      ctx.beginPath(); ctx.ellipse(cx + r * 1.2, cy - r * 1.1, 10, 7, -0.5, 0, Math.PI * 2); ctx.fill();
      break;
  }
  ctx.restore();
}

function shadeColor(col, amt) {
  let r = parseInt(col.slice(1,3),16), g = parseInt(col.slice(3,5),16), b = parseInt(col.slice(5,7),16);
  r = Math.max(0,Math.min(255,r+amt)); g = Math.max(0,Math.min(255,g+amt)); b = Math.max(0,Math.min(255,b+amt));
  return '#' + [r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
}

// ─── TOAST ────────────────────────────────────────────────────
function showToast(msg, color = '#a78bfa') {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(10,12,30,0.95);border:1px solid ${color};color:${color};border-radius:30px;padding:10px 22px;font-size:13px;font-weight:700;font-family:Outfit;z-index:9999;animation:floatUp 2.5s ease-out forwards;pointer-events:none;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

// ─── START GAME ───────────────────────────────────────────────
function startPveGame() {
  document.getElementById('pvelobby').classList.add('hidden');
  document.getElementById('pveGame').classList.remove('hidden');
  // Chọn 3 Lệnh Bài ngẫu nhiên
  const shuffledBai = LENH_BAI_POOL.slice().sort(()=>0.5-Math.random());
  window._selectedLenhBai = shuffledBai.slice(0, 3);
  G = new PveGame(selectedClass, savedData, selectedStage);
  // Apply Lệnh Bài modifiers
  const selectedBai = window._selectedLenhBai || [];
  selectedBai.forEach(bai => { try { bai.apply(G); } catch(e) {} });
  G.activeLenhBai = selectedBai;
  G.start();
  // Update HUD Lenh Bai display
  const lbEl = document.getElementById('lenhBaiDisplay');
  if (lbEl) {
    lbEl.innerHTML = (window._selectedLenhBai||[]).map(b=>`<div title="${b.desc}" style="background:rgba(0,0,0,0.7);border:1px solid #6b7280;border-radius:6px;padding:3px 6px;font-size:13px;">${b.icon}</div>`).join('');
  }
}

function pausePve() { if (G) G.pause(); }
function resumePve() { if (G) G.resume(); }
function quitToLobby() { if (G) { G.stop(); G = null; } goToLobby(); }

function goToLobby() {
  ['pveGame','pveGameOver','pveVictory','pveUpgradeScreen','pveArcanaScreen','pveEvolutionScreen','pveCodexScreen'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  document.getElementById('pvelobby').classList.remove('hidden');
  loadSaveData();
  updateGoldDisplay();
  updateStageLockDisplay();
  renderPowerupPanel();
}


function restartPve() {
  ['pveGameOver','pveVictory'].forEach(id => document.getElementById(id).classList.add('hidden'));
  startPveGame();
}

// ─══════════════════════════════════════════════════════════════
//  PVE GAME CLASS — Full Roguelike Engine
// ══════════════════════════════════════════════════════════════
class PveGame {
  constructor(className, saveData, selectedStage = 1) {
    this.canvas = document.getElementById('pveCanvas');
    this.ctx    = this.canvas.getContext('2d', { alpha: false });
    this.cls    = CLASSES[className];
    this.clsKey = className;
    this.save   = saveData;
    this.selectedStage = selectedStage;

    this.running = false;
    this.paused  = false;
    this.raf     = null;
    this.lastTime = 0;

    // Camera
    this.cam = { x: WORLD_W/2, y: WORLD_H/2, zoom: 1 };

    // Passive & Stats State
    this.passiveItems = [];
    this.magnetRadius = 100;
    this.bossChests = [];

    // Player
    this.player = this.createPlayer();
    this.recalculatePassiveStats();

    // Arcana state
    this.arcanaSelectedWave1 = false;
    this.arcanaSelectedWave10 = false;
    this.activeArcanas = new Set();
    this.pactKillCount = 0;
    this.pactDmgMult = 1.0;

    // Collections
    this.enemies    = [];
    this.projectiles= [];
    this.particles  = [];
    this.floats     = [];  // floating damage numbers
    this.summons    = [];  // friendly summons
    this.hazards    = [];  // ground effects (briar patch, consecration, etc)
    this.slashEffects = []; // slashes

    // Floating background spores
    this.bgSpores = [];
    for (let i = 0; i < 80; i++) {
      this.bgSpores.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        r: 1.2 + Math.random() * 1.8,
        speed: 8 + Math.random() * 16,
        angle: Math.random() * Math.PI * 2,
        color: ['#a78bfa', '#22d3ee', '#34d399', '#fde047'][Math.floor(Math.random() * 4)],
        pulse: Math.random() * Math.PI
      });
    }

    // Skills state: array of { id, level, lastFired, cooldownMs, ... }
    this.skills     = [];
    this.skillState = {};  // keyed by skill id

    // ── TIME-BASED WAVE SYSTEM (Vampire Survivors style) ──
    this.gameElapsed = 0;        // total seconds survived
    this.stageDuration = STAGE_DURATION[selectedStage] || 600;
    this.maxVisualWave = STAGE_MAX_WAVE[selectedStage] || 10;
    this.wave = 1;               // visual wave label
    this.totalKills = 0;
    this.totalGold  = 0;
    this.gameStartTime = Date.now();

    // Batch spawning
    this.batchTimer = 0;         // counts down to next enemy batch
    this.nextBatchInterval = getWaveScaling(0).batchInterval;

    // Boss scheduling
    this._bossSchedule = (BOSS_SCHEDULE[selectedStage] || []).map(e => ({ ...e, done: false }));
    this.bossActive = false;
    this.autoVacuumActive = false;

    // Day-Night cycle & Weather variables (Round 3)
    this.dayNightCycle = 'day';     // 'day' or 'night'
    this.dayNightTimer = 0;         // seconds in current cycle
    this.currentWeather = 'clear';  // 'clear', 'thunderstorm', 'blizzard', 'solar_flare'
    this.weatherTimer = 0;          // seconds in current weather state
    this.nextWeatherEventIn = 180;  // weather changes every 3 mins (180s)
    
    // Wandering Merchant & Rescue variables
    this.merchantRescueActive = false;
    this.merchantRescueTimer = 0;
    this.merchantRescueSuccess = false;
    this.merchantPriceDiscount = 1.0;
    this.currentRescueMission = null; // Holds current rescue mission definition

    // Shrines & Altars
    this.shrines = [];
    this.demonicAltar = null;
    this.activeShrineBuffs = {
      speed: 0, // remaining duration in ms
      power: 0,
      gold: 0
    };

    // Legacy compat (some systems still reference these)
    this.waveTimer = 0;
    this.waveSec   = 60;
    this.waveTransitionTriggered = false;
    this.waveEndDelayTimer = 0;


    // Input
    this.keys = {};
    this.mousePos = { x: 0, y: 0 };
    this.inputVec = { x: 0, y: 0 };

    // NG+ multiplier
    this.ngPlus = 0;

    // Add starting skill
    this.addSkill(this.cls.startSkill);
    this.updatePassiveBar(); // Draw initial empty slots for passives

    // Generate random 2.5D static obstacles based on Stage
    this.staticObstacles = [];
    const obsTypes = selectedStage === 1 ? ['tree', 'rock', 'crate'] :
                     selectedStage === 2 ? ['bookcase', 'crate'] :
                     ['void_pillar', 'rock'];

    for (let i = 0; i < 55; i++) {
      const type = obsTypes[Math.floor(Math.random() * obsTypes.length)];
      // Avoid spawning too close to the center (250px radius) where player spawns
      let x = 150 + Math.random() * (WORLD_W - 300);
      let y = 150 + Math.random() * (WORLD_H - 300);
      const dx = x - WORLD_W / 2;
      const dy = y - WORLD_H / 2;
      if (dx * dx + dy * dy < 250 * 250) {
        x += (x > WORLD_W / 2 ? 220 : -220);
        y += (y > WORLD_H / 2 ? 220 : -220);
      }
      
      let radius = 25;
      if (type === 'tree' || type === 'void_pillar') radius = 32;
      else if (type === 'rock' || type === 'bookcase') radius = 28;
      else radius = 22;

      this.staticObstacles.push({
        type,
        x,
        y,
        r: radius,
        id: 'obs_' + i,
        hp: 150,
        maxHp: 150
      });
    }

    // Generate Shrines (Round 3)
    this.shrines = [];
    const shrineTypes = ['speed', 'power', 'gold'];
    shrineTypes.forEach((st, idx) => {
      let sx = 200 + Math.random() * (WORLD_W - 400);
      let sy = 200 + Math.random() * (WORLD_H - 400);
      const sdx = sx - WORLD_W / 2;
      const sdy = sy - WORLD_H / 2;
      if (sdx * sdx + sdy * sdy < 300 * 300) {
        sx += (sx > WORLD_W / 2 ? 350 : -350);
        sy += (sy > WORLD_H / 2 ? 350 : -350);
      }
      this.shrines.push({
        type: st,
        x: sx,
        y: sy,
        r: 22,
        active: true,
        cooldownRemaining: 0,
        id: 'shrine_' + idx
      });
    });

    // Generate Demonic Altar (Round 3)
    this.demonicAltar = {
      x: WORLD_W / 2 - 250,
      y: WORLD_H / 2 - 250,
      r: 28,
      active: true,
      id: 'demonic_altar'
    };

    this.frameAnimations = [];
    // Merchant: random spawn chance 60%, not always present from the start
    const merchantSpawns = Math.random() < 0.6;
    this.merchant = {
      x: WORLD_W / 2 + 120,
      y: WORLD_H / 2 + 120,
      r: 25,
      active: merchantSpawns,
      hp: 1200,
      maxHp: 1200
    };
    this.merchantSpawnNextCheck = 120 + Math.random() * 60; // next check at 2-3 mins
    this.merchantRescueNextTrigger = 900 + Math.random() * 300; // random 15-20 min first rescue
    this.rescue1Triggered = false;
    this.rescue2Triggered = false;

    // Initialize Ghost Echo (D5)
    this.lastRunGhostActive = false;
    if (this.save && this.save.lastRunGhost) {
      this.lastRunGhostActive = true;
      const g = this.save.lastRunGhost;
      this.summons.push({
        id: 'ghost_echo',
        type: 'ghost_echo',
        clsKey: g.clsKey,
        x: WORLD_W / 2 - 80,
        y: WORLD_H / 2 - 80,
        r: 22,
        maxHp: 99999, // immortal ghost
        hp: 99999,
        expiresAt: Infinity, // infinite duration
        speed: 140,
        dmg: 30 + g.level * 4,
        color: '#c084fc', // purple spectral glow
        attackCd: 850,
        lastAttack: 0,
        name: `Hồn Ma: ${g.name || 'Người Chơi Trước'}`
      });
      showToast('👻 HỒN MA KẾT TINH XUẤT HIỆN! Quái vật +10% sức mạnh!', '#a78bfa');
    }

    this.initVisualAssets();
    this.initSpriteSheets();

    this.resize();
  }

  initVisualAssets() {
    if (window._pveCachedAssets) {
      this.grassTileCanvasA = window._pveCachedAssets.grassTileCanvasA;
      this.grassTileCanvasB = window._pveCachedAssets.grassTileCanvasB;
      this.libraryTileCanvasA = window._pveCachedAssets.libraryTileCanvasA;
      this.libraryTileCanvasB = window._pveCachedAssets.libraryTileCanvasB;
      this.voidTileCanvasA = window._pveCachedAssets.voidTileCanvasA;
      this.voidTileCanvasB = window._pveCachedAssets.voidTileCanvasB;
      this.treeAsset = window._pveCachedAssets.treeAsset;
      this.rockAsset = window._pveCachedAssets.rockAsset;
      this.crateAsset = window._pveCachedAssets.crateAsset;
      this.bookcaseAsset = window._pveCachedAssets.bookcaseAsset;
      this.voidPillarAsset = window._pveCachedAssets.voidPillarAsset;
      return;
    }
    const createGrassTile = (isEven) => {
      const cv = document.createElement('canvas');
      cv.width = 96; cv.height = 96;
      const c = cv.getContext('2d');
      // Base green
      c.fillStyle = isEven ? '#1b321a' : '#112911'; // dark lush greens
      c.fillRect(0, 0, 96, 96);
      
      // Draw pixelated grass blades
      c.fillStyle = isEven ? '#224622' : '#1a3c1a';
      for (let i = 0; i < 15; i++) {
        const gx = Math.random() * 90, gy = Math.random() * 90;
        c.fillRect(gx, gy, 2, 4);
        c.fillRect(gx - 2, gy + 2, 2, 2);
        c.fillRect(gx + 2, gy + 1, 2, 3);
      }
      
      // Draw minor highlights
      c.fillStyle = '#2f592f';
      for (let i = 0; i < 10; i++) {
        c.fillRect(Math.random() * 90, Math.random() * 90, 2, 2);
      }

      // Draw occasional tiny flowers
      if (Math.random() < 0.6) {
        c.fillStyle = ['#fbbf24', '#f472b6', '#38bdf8'][Math.floor(Math.random() * 3)];
        const fx = 15 + Math.random() * 66, fy = 15 + Math.random() * 66;
        c.fillRect(fx, fy, 2, 2); // center
        c.fillStyle = '#ffffff';
        c.fillRect(fx - 2, fy, 2, 2);
        c.fillRect(fx + 2, fy, 2, 2);
        c.fillRect(fx, fy - 2, 2, 2);
        c.fillRect(fx, fy + 2, 2, 2);
      }
      
      // Subtle grid border
      c.strokeStyle = 'rgba(52, 211, 153, 0.04)';
      c.lineWidth = 1;
      c.strokeRect(0, 0, 96, 96);
      return cv;
    };

    const createLibraryTile = (isEven) => {
      const cv = document.createElement('canvas');
      cv.width = 96; cv.height = 96;
      const c = cv.getContext('2d');
      // Wooden planks
      c.fillStyle = isEven ? '#3e2723' : '#4e342e';
      c.fillRect(0, 0, 96, 96);
      // Plank splits
      c.fillStyle = '#27120f';
      for (let y = 0; y < 96; y += 24) {
        c.fillRect(0, y, 96, 2);
      }
      for (let x = 0; x < 96; x += 32) {
        c.fillRect(x, 0, 2, 96);
      }
      // Plank grains
      c.fillStyle = 'rgba(0,0,0,0.1)';
      for (let i = 0; i < 8; i++) {
        c.fillRect(Math.random()*80, Math.random()*80, 15, 1);
      }
      c.strokeStyle = 'rgba(245, 158, 11, 0.02)';
      c.lineWidth = 1;
      c.strokeRect(0, 0, 96, 96);
      return cv;
    };

    const createVoidTile = (isEven) => {
      const cv = document.createElement('canvas');
      cv.width = 96; cv.height = 96;
      const c = cv.getContext('2d');
      // Dark dungeon stones
      c.fillStyle = isEven ? '#0c0a15' : '#08060f';
      c.fillRect(0, 0, 96, 96);
      // Stone boundaries
      c.fillStyle = '#020105';
      c.fillRect(0, 0, 96, 3);
      c.fillRect(0, 0, 3, 96);
      c.fillRect(0, 93, 96, 3);
      c.fillRect(93, 0, 3, 96);
      // Cosmic glow lines
      c.fillStyle = 'rgba(139, 92, 246, 0.12)';
      c.fillRect(10, 10, 76, 2);
      c.fillRect(10, 84, 76, 2);
      // Noise
      c.fillStyle = '#1e1b4b';
      for (let i = 0; i < 12; i++) {
        c.fillRect(Math.random()*90, Math.random()*90, 2, 2);
      }
      c.strokeStyle = 'rgba(168, 85, 247, 0.03)';
      c.lineWidth = 1;
      c.strokeRect(0, 0, 96, 96);
      return cv;
    };

    this.grassTileCanvasA = createGrassTile(true);
    this.grassTileCanvasB = createGrassTile(false);
    this.libraryTileCanvasA = createLibraryTile(true);
    this.libraryTileCanvasB = createLibraryTile(false);
    this.voidTileCanvasA = createVoidTile(true);
    this.voidTileCanvasB = createVoidTile(false);

    // Pre-render detailed 2D Tree asset
    const makeTree = () => {
      const cv = document.createElement('canvas');
      cv.width = 120; cv.height = 140;
      const c = cv.getContext('2d');
      // Trunk
      c.fillStyle = '#4c1e05';
      c.beginPath();
      c.moveTo(52, 120); c.lineTo(56, 70); c.lineTo(64, 70); c.lineTo(68, 120);
      c.closePath(); c.fill();
      // Branches
      c.beginPath();
      c.moveTo(56, 70); c.lineTo(44, 45); c.lineTo(50, 45); c.lineTo(58, 65);
      c.closePath(); c.fill();
      c.beginPath();
      c.moveTo(64, 70); c.lineTo(76, 50); c.lineTo(82, 50); c.lineTo(66, 68);
      c.closePath(); c.fill();
      
      // Foliage overlapping rings (pixelated clumps)
      const drawClump = (x, y, r, c1, c2) => {
        c.shadowColor = 'rgba(0,0,0,0.18)'; c.shadowBlur = 10;
        const g = c.createRadialGradient(x - r*0.2, y - r*0.2, 0, x, y, r);
        g.addColorStop(0, c1); g.addColorStop(1, c2);
        c.fillStyle = g;
        c.beginPath(); c.arc(x, y, r, 0, Math.PI*2); c.fill();
        c.shadowBlur = 0;
      };
      
      drawClump(45, 60, 24, '#22c55e', '#166534'); 
      drawClump(75, 55, 26, '#22c55e', '#166534'); 
      drawClump(60, 40, 32, '#4ade80', '#15803d'); 
      drawClump(60, 24, 22, '#86efac', '#166534'); 
      
      // Tiny apples/fruits
      c.fillStyle = '#ef4444';
      c.fillRect(40, 50, 4, 4);
      c.fillRect(72, 42, 4, 4);
      c.fillRect(54, 30, 4, 4);
      return cv;
    };

    // Pre-render detailed 2D Rock asset
    const makeRock = () => {
      const cv = document.createElement('canvas');
      cv.width = 80; cv.height = 70;
      const c = cv.getContext('2d');
      // Rock polygon sides
      c.fillStyle = '#64748b'; 
      c.beginPath();
      c.moveTo(10, 55); c.lineTo(24, 18); c.lineTo(56, 14); c.lineTo(70, 50); c.lineTo(50, 60);
      c.closePath(); c.fill();
      
      c.fillStyle = '#94a3b8'; 
      c.beginPath();
      c.moveTo(24, 18); c.lineTo(56, 14); c.lineTo(50, 32); c.lineTo(28, 35);
      c.closePath(); c.fill();
      
      c.fillStyle = '#475569'; 
      c.beginPath();
      c.moveTo(28, 35); c.lineTo(50, 32); c.lineTo(70, 50); c.lineTo(50, 60);
      c.closePath(); c.fill();
      
      c.strokeStyle = '#334155'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(28, 35); c.lineTo(50, 32); c.stroke();
      
      c.fillStyle = '#16a34a';
      c.fillRect(42, 14, 8, 4);
      return cv;
    };

    // Pre-render Crate asset
    const makeCrate = () => {
      const cv = document.createElement('canvas');
      cv.width = 60; cv.height = 60;
      const c = cv.getContext('2d');
      c.fillStyle = '#854d0e'; c.fillRect(4, 4, 52, 52);
      c.fillStyle = '#a16207'; c.fillRect(8, 8, 44, 44);
      c.strokeStyle = '#713f12'; c.lineWidth = 6;
      c.beginPath(); c.moveTo(8, 8); c.lineTo(52, 52); c.stroke();
      c.beginPath(); c.moveTo(52, 8); c.lineTo(8, 52); c.stroke();
      c.fillStyle = '#713f12';
      c.fillRect(4, 4, 52, 6); 
      c.fillRect(4, 50, 52, 6); 
      c.fillRect(4, 4, 6, 52); 
      c.fillRect(50, 4, 6, 52); 
      c.fillStyle = '#94a3b8';
      c.fillRect(6, 6, 3, 3);
      c.fillRect(50, 6, 3, 3);
      return cv;
    };

    // Pre-render Bookcase
    const makeBookcase = () => {
      const cv = document.createElement('canvas');
      cv.width = 75; cv.height = 85;
      const c = cv.getContext('2d');
      c.fillStyle = '#5c2d12'; c.fillRect(4, 4, 67, 77);
      c.fillStyle = '#3c1d0a'; c.fillRect(9, 9, 57, 67);
      c.fillStyle = '#5c2d12';
      c.fillRect(9, 28, 57, 5);
      c.fillRect(9, 52, 57, 5);
      const drawBooks = (y, colors) => {
        let x = 12;
        colors.forEach(col => {
          c.fillStyle = col;
          const w = 3 + Math.random() * 4;
          const h = 12 + Math.random() * 6;
          c.fillRect(x, y - h, w, h);
          c.fillStyle = 'rgba(0,0,0,0.15)'; 
          c.fillRect(x + w - 1, y - h, 1, h);
          x += w + 1;
        });
      };
      drawBooks(28, ['#ef4444', '#38bdf8', '#fbbf24', '#10b981', '#a78bfa', '#f472b6']);
      drawBooks(52, ['#fbbf24', '#f472b6', '#a78bfa', '#38bdf8', '#ef4444', '#10b981']);
      drawBooks(76, ['#38bdf8', '#10b981', '#fbbf24', '#a78bfa', '#f472b6', '#ef4444']);
      return cv;
    };

    // Pre-render Void Pillar
    const makeVoidPillar = () => {
      const cv = document.createElement('canvas');
      cv.width = 75; cv.height = 100;
      const c = cv.getContext('2d');
      c.fillStyle = '#1e1b4b'; 
      c.beginPath();
      c.moveTo(37, 6); c.lineTo(12, 90); c.lineTo(63, 90);
      c.closePath(); c.fill();
      c.fillStyle = '#0f0c29';
      c.beginPath();
      c.moveTo(37, 6); c.lineTo(37, 90); c.lineTo(63, 90);
      c.closePath(); c.fill();
      c.fillStyle = '#c084fc';
      c.shadowBlur = 12; c.shadowColor = '#c084fc';
      c.fillRect(35, 30, 5, 5);
      c.fillRect(35, 48, 5, 7);
      c.fillRect(35, 68, 5, 5);
      c.shadowBlur = 0;
      return cv;
    };

    this.treeAsset = makeTree();
    this.rockAsset = makeRock();
    this.crateAsset = makeCrate();
    this.bookcaseAsset = makeBookcase();
    this.voidPillarAsset = makeVoidPillar();

    window._pveCachedAssets = {
      grassTileCanvasA: this.grassTileCanvasA,
      grassTileCanvasB: this.grassTileCanvasB,
      libraryTileCanvasA: this.libraryTileCanvasA,
      libraryTileCanvasB: this.libraryTileCanvasB,
      voidTileCanvasA: this.voidTileCanvasA,
      voidTileCanvasB: this.voidTileCanvasB,
      treeAsset: this.treeAsset,
      rockAsset: this.rockAsset,
      crateAsset: this.crateAsset,
      bookcaseAsset: this.bookcaseAsset,
      voidPillarAsset: this.voidPillarAsset
    };
  }

  initSpriteSheets() {
    if (window._pveCachedSpriteSheets) {
      this.spriteSheets = window._pveCachedSpriteSheets;
      return;
    }
    this.spriteSheets = {};

    const makeSwordSlash = () => {
      const frames = [];
      for (let f = 0; f < 6; f++) {
        const cv = document.createElement('canvas');
        cv.width = 120; cv.height = 120;
        const c = cv.getContext('2d');
        c.translate(60, 60);
        c.strokeStyle = 'rgba(56, 189, 248, 0.9)'; 
        c.lineWidth = 14 - f * 2.2;
        c.lineCap = 'round';
        c.shadowBlur = 18; c.shadowColor = '#38bdf8';
        const startRad = -1.2;
        const endRad = startRad + (f / 5) * Math.PI * 1.5;
        c.beginPath();
        c.arc(0, 0, 36 + f * 3, startRad, endRad);
        c.stroke();
        c.strokeStyle = '#ffffff';
        c.lineWidth = 4;
        c.shadowBlur = 0;
        c.beginPath();
        c.arc(0, 0, 36 + f * 3, startRad + 0.15, endRad - 0.05);
        c.stroke();
        frames.push(cv);
      }
      return frames;
    };

    const makeFireballExplode = () => {
      const frames = [];
      for (let f = 0; f < 8; f++) {
        const cv = document.createElement('canvas');
        cv.width = 128; cv.height = 128;
        const c = cv.getContext('2d');
        c.translate(64, 64);
        const alpha = 1.0 - (f / 8.0);
        c.globalAlpha = alpha;
        const maxR = 12 + f * 6.5;
        c.shadowBlur = 24; c.shadowColor = '#ef4444';
        const g = c.createRadialGradient(0, 0, 0, 0, 0, maxR);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.35, '#fbbf24');
        g.addColorStop(0.65, '#f97316');
        g.addColorStop(0.85, '#dc2626');
        g.addColorStop(1, 'transparent');
        c.fillStyle = g;
        c.beginPath();
        c.arc(0, 0, maxR, 0, Math.PI*2);
        c.fill();
        c.shadowBlur = 0;
        frames.push(cv);
      }
      return frames;
    };

    const makeMagicBlast = () => {
      const frames = [];
      for (let f = 0; f < 6; f++) {
        const cv = document.createElement('canvas');
        cv.width = 100; cv.height = 100;
        const c = cv.getContext('2d');
        c.translate(50, 50);
        c.globalAlpha = 1.0 - (f / 6.0);
        const r = 8 + f * 7;
        c.strokeStyle = '#22d3ee'; c.lineWidth = 5;
        c.shadowBlur = 16; c.shadowColor = '#22d3ee';
        c.beginPath();
        c.arc(0, 0, r, 0, Math.PI*2);
        c.stroke();
        c.fillStyle = '#a855f7';
        c.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + f * 0.2;
          c.lineTo(Math.cos(a)*r*0.6, Math.sin(a)*r*0.6);
        }
        c.closePath(); c.fill();
        c.shadowBlur = 0;
        frames.push(cv);
      }
      return frames;
    };

    const makeLightningStrike = () => {
      const frames = [];
      for (let f = 0; f < 6; f++) {
        const cv = document.createElement('canvas');
        cv.width = 100; cv.height = 160;
        const c = cv.getContext('2d');
        c.globalAlpha = 1.0 - (f / 6.0);
        c.strokeStyle = '#fde047';
        c.lineWidth = 6 - f * 0.8;
        c.shadowBlur = 20; c.shadowColor = '#eab308';
        c.beginPath();
        let py = 10;
        c.moveTo(50, py);
        for (let i = 1; i <= 6; i++) {
          py += 23;
          const px = 50 + (Math.sin(f + i) * 20);
          c.lineTo(px, py);
        }
        c.stroke();
        frames.push(cv);
      }
      return frames;
    };

    const makeHolyJudgment = () => {
      const frames = [];
      for (let f = 0; f < 8; f++) {
        const cv = document.createElement('canvas');
        cv.width = 150; cv.height = 150;
        const c = cv.getContext('2d');
        c.translate(75, 75);
        c.globalAlpha = 1.0 - (f / 8.0);
        const r = 20 + f * 8;
        c.shadowBlur = 22; c.shadowColor = '#fbbf24';
        c.fillStyle = '#fde68a';
        c.fillRect(-8, -r, 16, r * 2);
        c.fillRect(-r, -15, r * 2, 16);
        c.strokeStyle = '#f59e0b';
        c.lineWidth = 3;
        c.beginPath();
        c.arc(0, 0, r * 0.85, 0, Math.PI*2);
        c.stroke();
        c.shadowBlur = 0;
        frames.push(cv);
      }
      return frames;
    };

    const makeGrimReaperSlash = () => {
      const frames = [];
      for (let f = 0; f < 8; f++) {
        const cv = document.createElement('canvas');
        cv.width = 180; cv.height = 180;
        const c = cv.getContext('2d');
        c.translate(90, 90);
        c.globalAlpha = 1.0 - (f / 8.0);
        c.rotate(f * 0.4); 
        c.strokeStyle = '#a855f7';
        c.lineWidth = 16 - f * 1.5;
        c.shadowBlur = 25; c.shadowColor = '#6d28d9';
        c.beginPath();
        c.arc(0, 0, 50 + f * 4, 0, Math.PI * 1.6);
        c.stroke();
        c.strokeStyle = '#ffffff';
        c.lineWidth = 3.5;
        c.shadowBlur = 0;
        c.beginPath();
        c.arc(0, 0, 50 + f * 4, 0.1, Math.PI * 1.5);
        c.stroke();
        frames.push(cv);
      }
      return frames;
    };

    this.spriteSheets.sword_slash = makeSwordSlash();
    this.spriteSheets.fireball_explode = makeFireballExplode();
    this.spriteSheets.magic_blast = makeMagicBlast();
    this.spriteSheets.lightning_strike = makeLightningStrike();
    this.spriteSheets.holy_judgment = makeHolyJudgment();
    this.spriteSheets.grim_reaper_slash = makeGrimReaperSlash();

    window._pveCachedSpriteSheets = this.spriteSheets;
  }

  spawnFrameAnimation(spriteName, x, y, radius, angle = 0, fps = 16) {
    if (!this.spriteSheets[spriteName]) return;
    this.frameAnimations.push({
      spriteName,
      x,
      y,
      r: radius,
      angle,
      frame: 0,
      maxFrames: this.spriteSheets[spriteName].length,
      fps,
      timer: 0
    });
  }

  updateFrameAnimations(dt) {
    for (let i = this.frameAnimations.length - 1; i >= 0; i--) {
      const anim = this.frameAnimations[i];
      anim.timer += dt * 1000;
      const msPerFrame = 1000 / anim.fps;
      if (anim.timer >= msPerFrame) {
        anim.timer -= msPerFrame;
        anim.frame++;
        if (anim.frame >= anim.maxFrames) {
          this.frameAnimations.splice(i, 1);
        }
      }
    }
  }

  // ──────────────────────────────────────────────
  // PLAYER CREATION
  // ──────────────────────────────────────────────
  createPlayer() {
    const eq = this.save.equipped;
    const weaponBonus = eq.weapon ? eq.weapon.bonus : {};
    const armorBonus  = eq.armor  ? eq.armor.bonus  : {};
    const accBonus    = eq.accessory ? eq.accessory.bonus : {};
    const allBonus = {};
    [weaponBonus, armorBonus, accBonus].forEach(b => Object.entries(b).forEach(([k,v]) => { allBonus[k] = (allBonus[k]||0) + (typeof v==='boolean'?0:v); }));

    // Apply class passives
    let classPassiveBonus = {};
    const cls = this.clsKey;
    if (cls === 'assassin') {
      classPassiveBonus = { crit: 15, speed: 10 };
    } else if (cls === 'fighter') {
      classPassiveBonus = { def: 15 }; // reflected damage is handled in collision
    } else if (cls === 'mage') {
      classPassiveBonus = { cdReduce: 10 }; // spell dmg mult is separate
    } else if (cls === 'ranger') {
      classPassiveBonus = { atkSpd: 15 };
    }

    // ── METAGAME MASTERY BONUSES ──
    const mastery = (this.save && this.save.mastery) ? this.save.mastery : {};
    let mMaxHp = 0;      // maxHp percentage bonus
    let mArmor = 0;      // armor percentage bonus
    let mCd = 0;         // cooldown reduction (CDR) percentage bonus
    let mGold = 0;       // gold bonus percentage
    let mCrit = 0;       // crit chance percentage bonus
    let mDmg = 0;        // damage multiplier percentage bonus
    let mAoe = 0;        // aoe multiplier percentage bonus
    let mSpeed = 0;      // speed multiplier percentage bonus
    let mLifesteal = 0;  // lifesteal percentage bonus
    let mHpRegen = 0;    // flat hp regen bonus
    
    Object.keys(mastery).forEach(nodeId => {
      if (mastery[nodeId]) {
        const def = MASTERY_DEFS[nodeId];
        if (def && def.stat) {
          const s = def.stat;
          if (s.maxHpBonusPct) mMaxHp += s.maxHpBonusPct;
          if (s.armorBonusPct) mArmor += s.armorBonusPct;
          if (s.cdReducePct) mCd += s.cdReducePct;
          if (s.goldBonusPct) mGold += s.goldBonusPct;
          if (s.critChancePct) mCrit += s.critChancePct;
          if (s.dmgMultPct) mDmg += s.dmgMultPct;
          if (s.aoeMultPct) mAoe += s.aoeMultPct;
          if (s.speedMultPct) mSpeed += s.speedMultPct;
          if (s.lifestealPct) mLifesteal += s.lifestealPct;
          if (s.hpRegenAdd) mHpRegen += s.hpRegenAdd;
        }
      }
    });

    const baseHp    = this.cls.hp    + (allBonus.hp || 0) + (classPassiveBonus.hp || 0);
    const baseSpeed = this.cls.speed + (allBonus.speed || 0) + (classPassiveBonus.speed || 0);
    const atkMult   = this.cls.atk   * (1 + ((allBonus.atk || 0) + (classPassiveBonus.atk || 0)) / 100);
    const defMult   = this.cls.def   * (1 + ((allBonus.def || 0) + (classPassiveBonus.def || 0)) / 100 + mArmor);
    const critChance= ((allBonus.crit || 0) + (classPassiveBonus.crit || 0)) / 100 + mCrit;
    const lifesteal = ((allBonus.lifesteal || 0) + (classPassiveBonus.lifesteal || 0)) / 100 + (cls === 'necromancer' ? 0.20 : 0) + mLifesteal;
    const hpRegen   = (allBonus.hpRegen || 0) + (cls === 'paladin' ? 5 : 0) + mHpRegen;
    const goldBonus = 1 + (allBonus.goldBonus || 0) / 100 + mGold;
    const revive    = !!accBonus.revive;

    // Special class multiplier traits
    const projSpeedMult  = cls === 'ranger' ? 1.15 : 1.0;
    const summonAddCount = cls === 'necromancer' ? 1 : 0;
    const poisonDmgMult  = cls === 'druid' ? 2.0 : 1.0;
    const shieldMaxMult  = cls === 'paladin' ? 1.5 : 1.0;

    // ── PERMANENT POWERUP BONUSES ──
    const pu = (this.save && this.save.powerups) ? this.save.powerups : {};
    const puMight     = (pu.might     || 0) * POWERUP_DEFS.might.perLevel;
    const puAmount    = (pu.amount    || 0) * POWERUP_DEFS.amount.perLevel;
    const puSwiftness = (pu.swiftness || 0) * POWERUP_DEFS.swiftness.perLevel;
    const puRecovery  = (pu.recovery  || 0) * POWERUP_DEFS.recovery.perLevel;
    const puGreed     = (pu.greed     || 0) * POWERUP_DEFS.greed.perLevel;
    const puLuck      = (pu.luck      || 0) * POWERUP_DEFS.luck.perLevel;
    const puCooldown  = (pu.cooldown  || 0) * POWERUP_DEFS.cooldown.perLevel; // negative
    const puVitality  = (pu.vitality  || 0) * POWERUP_DEFS.vitality.perLevel;
    const puGrowth    = (pu.growth    || 0) * POWERUP_DEFS.growth.perLevel;    // XP multiplier
    const puMagnet    = (pu.magnet    || 0) * POWERUP_DEFS.magnet.perLevel;    // px bonus

    // Ranger proj count comes from class + Amount powerup
    const projAddCount = (cls === 'ranger' ? 1 : 0) + puAmount;

    const finalMaxHp = Math.round(baseHp * (1 + puVitality + mMaxHp));

    return {
      branch: cls,
      x: WORLD_W / 2, y: WORLD_H / 2,
      r: 22,
      maxHp: finalMaxHp, hp: finalMaxHp,
      speed: baseSpeed * (1 + puSwiftness + mSpeed),
      atkMult, defMult, critChance: critChance + puLuck, lifesteal,
      hpRegen: hpRegen + puRecovery,
      goldBonus: goldBonus + puGreed,
      revive, reviveUsed: false,
      level: 1, xp: 0, xpToNext: 5,   // Bắt đầu với 5 XP
      xpGainMult: 1.0 + puGrowth,        // nhân XP nhận được
      magnetBonusPx: puMagnet,           // px cộng vào magnetRadius
      // Special class traits
      projSpeedMult, projAddCount, shieldMaxMult, summonAddCount, poisonDmgMult,
      // Stat multipliers (from upgrades + might powerup)
      dmgMult: 1.0 + puMight + mDmg,
      cdMult:  1.0 + puCooldown - mCd,
      aoeMult: 1.0 + mAoe,
      spdMult: 1.0 + mSpeed,
      // Iron wall shield
      shieldHp: 0,
      shieldMax: 0,
      // Immortal frames
      invincible: false,
      invincibleUntil: 0,
      // Enrage timer
      rallyUntil: 0,
      divineShieldUntil: 0,
      // Animation
      angle: 0,
      attackAnim: 0,
      color: this.cls.color,
      weaponType: this.cls.weaponType,
      // Standing check
      lastStandingRegenTime: 0,
      // Persistent in-game bonuses (from Shrines, Demonic Altar, and Golden Eggs)
      demonicDmgMult: 1.0,
      demonicCritChance: 0.0,
      demonicLifesteal: 0.0,
      demonicMaxHpLossPct: 0.0,
      hasDemonicVoidRegenBan: false,
      eggDmgBonus: 0.0,
      eggSpeedBonus: 0,
      eggRegenBonus: 0,
      eggMaxHpBonus: 0,
      eggCritBonus: 0,
      spawnRateMult: 1.0,
      // ── I-FRAMES SYSTEM ──────────────────────────────────────
      // Sau mỗi lần nhận hit, player bất tử I_FRAME_DURATION_MS ms
      iFrameUntil: 0,
      // ── STAT CAPS EXTRAS ────────────────────────────────────
      critDmgMult: 1.5,        // Chí mạng nhân 1.5x mặc định, tối đa 5x
      thornsDmg: cls === 'fighter' ? 0.15 : 0, // Fighter: 15% phản đòn mặc định
      reviveCount: revive ? 1 : 0,   // Số lần hồi sinh còn lại
            // ── SOUL AEGIS (Hidden item vs Red Death) ────────────────
      hasSoulAegis: false,     // Trang bị ẩn chống One-Hit-Kill của Red Death
      soulAegisUsed: false,    // Đã dùng chưa (1 lần/ván)
      eggCdBonus: 0.0,
      eggSpdMultBonus: 0.0,
      eggDefBonus: 0.0,
      lvlUpDmgMult: 1.0,
      lvlUpCdMult: 1.0,
      lvlUpSpdMult: 1.0,
      lvlUpAoeMult: 1.0,
      lvlUpLifesteal: 0.0,
      lvlUpMaxHpMult: 1.0,
      thorns: 0.0,
      demonicDefMult: 1.0,
    };
  }



    recalculatePassiveStats() {
    const p = this.player;
    if (!p) return;
    const eq = this.save.equipped;
    
    // Base stats
    const allBonusHp = (eq.weapon ? eq.weapon.bonus.hp || 0 : 0) + (eq.armor ? eq.armor.bonus.hp || 0 : 0) + (eq.accessory ? eq.accessory.bonus.hp || 0 : 0);
    const baseHp = this.cls.hp + allBonusHp;
    
    const allBonusSpeed = (eq.weapon ? eq.weapon.bonus.speed || 0 : 0) + (eq.armor ? eq.armor.bonus.speed || 0 : 0) + (eq.accessory ? eq.accessory.bonus.speed || 0 : 0);
    const baseSpeed = this.cls.speed + allBonusSpeed + (this.clsKey === 'assassin' ? 10 : 0);
    
    const allBonusCrit = (eq.weapon ? eq.weapon.bonus.crit || 0 : 0) + (eq.armor ? eq.armor.bonus.crit || 0 : 0) + (eq.accessory ? eq.accessory.bonus.crit || 0 : 0);
    const classCrit = this.clsKey === 'assassin' ? 15 : 0;
    
    // Level multipliers from passives
    let spinachLvl = 0, emptyTomeLvl = 0, candelabradorLvl = 0, wingsLvl = 0, heartLvl = 0, cloverLvl = 0, armorPlateLvl = 0, crownLvl = 0;
    this.passiveItems.forEach(item => {
      if (item.id === 'spinach') spinachLvl = item.level;
      if (item.id === 'empty_tome') emptyTomeLvl = item.level;
      if (item.id === 'candelabrador') candelabradorLvl = item.level;
      if (item.id === 'wings') wingsLvl = item.level;
      if (item.id === 'hollow_heart') heartLvl = item.level;
      if (item.id === 'clover') cloverLvl = item.level;
      if (item.id === 'armor_plate') armorPlateLvl = item.level;
      if (item.id === 'crown') crownLvl = item.level;
    });

    const pu = (this.save && this.save.powerups) ? this.save.powerups : {};
    const puMight     = (pu.might     || 0) * POWERUP_DEFS.might.perLevel;
    const puSwiftness = (pu.swiftness || 0) * POWERUP_DEFS.swiftness.perLevel;
    const puRecovery  = (pu.recovery  || 0) * POWERUP_DEFS.recovery.perLevel;
    const puLuck      = (pu.luck      || 0) * POWERUP_DEFS.luck.perLevel;
    const puVitality  = (pu.vitality  || 0) * POWERUP_DEFS.vitality.perLevel;
    const puAmount    = (pu.amount    || 0) * POWERUP_DEFS.amount.perLevel;
    const puGrowth    = (pu.growth    || 0) * POWERUP_DEFS.growth.perLevel;
    const puGreed     = (pu.greed     || 0) * POWERUP_DEFS.greed.perLevel;

    // Metagame mastery bonuses
    const mastery = (this.save && this.save.mastery) ? this.save.mastery : {};
    let mArmor = 0;
    let mGold = 0;
    Object.keys(mastery).forEach(nodeId => {
      if (mastery[nodeId]) {
        const def = MASTERY_DEFS[nodeId];
        if (def && def.stat) {
          const s = def.stat;
          if (s.armorBonusPct) mArmor += s.armorBonusPct;
          if (s.goldBonusPct) mGold += s.goldBonusPct;
        }
      }
    });
    
    // Update player attributes with powerups, passives, and persistent upgrades (demonic/egg/lvlUp)
    p.dmgMult = (1.0 + spinachLvl * 0.10 + puMight) * (p.demonicDmgMult || 1.0) * (p.lvlUpDmgMult || 1.0) + (p.eggDmgBonus || 0.0);
    if (this.hermitBuffActive) p.dmgMult *= 1.40;

    p.cdMult  = (1.0 - emptyTomeLvl * 0.06 - (p.eggCdBonus || 0.0)) * (p.lvlUpCdMult || 1.0);
    p.aoeMult = (1.0 + candelabradorLvl * 0.10) * (p.lvlUpAoeMult || 1.0);
    p.spdMult = (1.0 + wingsLvl * 0.08 + (p.eggSpdMultBonus || 0.0)) * (p.lvlUpSpdMult || 1.0);
    p.speed   = baseSpeed * (1 + puSwiftness) + (p.eggSpeedBonus || 0);
    
    const prevMax = p.maxHp;
    const calculatedMaxHp = Math.round(baseHp * (1 + puVitality) * (1 + heartLvl * 0.15));
    p.maxHp = Math.round(calculatedMaxHp * (1 - (p.demonicMaxHpLossPct || 0.0)) * (p.lvlUpMaxHpMult || 1.0) + (p.eggMaxHpBonus || 0));
    if (p.maxHp > prevMax) p.hp += (p.maxHp - prevMax);
    if (p.hp > p.maxHp) p.hp = p.maxHp;
    
    p.critChance = (allBonusCrit + classCrit) / 100 + cloverLvl * 0.06 + puLuck + (p.demonicCritChance || 0.0) + (p.eggCritBonus || 0.0);
    
    const baseLifesteal = ((eq.weapon ? eq.weapon.bonus.lifesteal || 0 : 0) + (eq.armor ? eq.armor.bonus.lifesteal || 0 : 0) + (eq.accessory ? eq.accessory.bonus.lifesteal || 0 : 0)) / 100 + (this.clsKey === 'necromancer' ? 0.20 : 0);
    p.lifesteal = baseLifesteal + (p.demonicLifesteal || 0.0) + (p.lvlUpLifesteal || 0.0);

    if (p.hasDemonicVoidRegenBan) {
      p.hpRegen = 0;
    } else {
      const baseRegen = (eq.weapon ? eq.weapon.bonus.hpRegen || 0 : 0) + (eq.armor ? eq.armor.bonus.hpRegen || 0 : 0) + (eq.accessory ? eq.accessory.bonus.hpRegen || 0 : 0) + (this.clsKey === 'paladin' ? 5 : 0) + puRecovery;
      p.hpRegen = baseRegen + (p.eggRegenBonus || 0);
    }
    
    // Attractorb & magnetRadius
    let magnetLvl = 0;
    const magnetItem = this.passiveItems.find(i => i.id === 'attractorb');
    if (magnetItem) magnetLvl = magnetItem.level;
    this.magnetRadius = Math.min(STAT_CAPS.magnetRadius, 120 + magnetLvl * 60 + (this.player.magnetBonusPx || 0));

    // Crown & _crownXpBonus
    this._crownXpBonus = crownLvl * 0.20;

    // Recalculate other stats
    p.projAddCount = (this.clsKey === 'ranger' ? 1 : 0) + puAmount;
    p.projSpeedMult = this.clsKey === 'ranger' ? 1.15 : 1.0;

    let baseGrowth = 1.0 + puGrowth;
    if (p.hasMilestone20Buff) baseGrowth *= 2.0;
    if (p.hasMilestone40Buff) baseGrowth *= 2.0;
    p.xpGainMult = baseGrowth;

    const allBonusGold = (eq.weapon ? eq.weapon.bonus.goldBonus || 0 : 0) + (eq.armor ? eq.armor.bonus.goldBonus || 0 : 0) + (eq.accessory ? eq.accessory.bonus.goldBonus || 0 : 0);
    p.goldBonus = 1.0 + allBonusGold / 100 + mGold + puGreed;

    const allBonusDef = (eq.weapon ? eq.weapon.bonus.def || 0 : 0) + (eq.armor ? eq.armor.bonus.def || 0 : 0) + (eq.accessory ? eq.accessory.bonus.def || 0 : 0);
    const classPassiveDef = (this.clsKey === 'fighter' ? 15 : 0);
    let baseDef = this.cls.def * (1 + (allBonusDef + classPassiveDef) / 100 + mArmor);
    baseDef += armorPlateLvl * 0.20;
    p.defMult = (baseDef + (p.eggDefBonus || 0.0)) * (p.demonicDefMult || 1.0);

    const baseThorns = (eq.armor && eq.armor.bonus.thorns) ? eq.armor.bonus.thorns / 100 : 0;
    p.thornsDmg = baseThorns + (p.thorns || 0.0);

    // Apply stat caps
    applyStatCaps(p);
  }


  updatePassiveBar() {
    const bar = document.getElementById('pvePassiveBar');
    if (!bar) return;
    bar.innerHTML = '';
    this.passiveItems.forEach(item => {
      const def = PASSIVE_ITEMS_DEFS[item.id];
      if (!def) return;
      const slot = document.createElement('div');
      slot.className = 'pve-passive-slot has-item';
      slot.innerHTML = `
        <span style="font-size:16px;">${def.icon}</span>
        <div class="passive-lv">L${item.level}</div>`;
      slot.title = def.name + ': ' + def.desc;
      bar.appendChild(slot);
    });
    for (let i = this.passiveItems.length; i < 6; i++) {
      const slot = document.createElement('div');
      slot.className = 'pve-passive-slot empty';
      slot.innerHTML = `<span style="font-size:12px;color:rgba(255,255,255,0.15)">➕</span>`;
      bar.appendChild(slot);
    }
  }

  // ──────────────────────────────────────────────
  // SKILL MANAGEMENT
  // ──────────────────────────────────────────────
  addSkill(id) {
    const def = SKILL_DEFS[id];
    if (!def) return false;
    const existing = this.skills.find(s => s.id === id);
    if (existing) {
      if (existing.level >= 8) return false; // extended to max level 8
      existing.level++;
      this.showSkillLevelUp(id, existing.level);
      return true;
    }
    const activeSkillsCount = this.skills.filter(s => !SKILL_DEFS[s.id].isLegendary).length;
    if (activeSkillsCount >= MAX_SKILLS) return false;
    this.skills.push({ id, level: 1 });
    this.skillState[id] = { lastFired: 0 };
    this.updateSkillBar();
    this.checkLegendary();
    return true;
  }

  checkLegendary() {
    for (const combo of LEGENDARY_COMBOS) {
      if (this.skills.find(s => s.id === combo.unlocks)) continue; // already have it
      const hasAll = combo.needs.every(n => {
        const s = this.skills.find(sk => sk.id === n);
        return s && s.level >= 8;
      });
      if (hasAll) {
        // Unlock the legendary
        const slot = this.skills.find(s => s.id === combo.unlocks);
        if (!slot) {
          this.skills.push({ id: combo.unlocks, level: 1, isLegendary: true });
          this.skillState[combo.unlocks] = { lastFired: 0 };
          this.showLegendaryBanner(SKILL_DEFS[combo.unlocks]);
          this.updateSkillBar();
        }
      }
    }
  }

  showLegendaryBanner(skillDef) {
    const banner = document.getElementById('legendaryBanner');
    const sub    = document.getElementById('legendarySubText');
    banner.classList.remove('hidden');
    sub.textContent = `${skillDef.icon} ${skillDef.name} thức tỉnh!`;
    // Remove forced keyframe restart
    banner.style.animation = 'none';
    void banner.offsetWidth; // reflow
    banner.style.animation = '';
    setTimeout(() => banner.classList.add('hidden'), 3200);
  }

  showSkillLevelUp(id, level) {
    const def = SKILL_DEFS[id];
    this.addFloat(this.player.x, this.player.y - 60, `${def.icon} LV.${level}!`, '#a78bfa', true);
  }

  updateSkillBar() {
    const bar = document.getElementById('pveSkillBar');
    if (!bar) return;
    bar.innerHTML = '';
    this.skills.forEach((s, i) => {
      const def = SKILL_DEFS[s.id];
      if (!def) return;
      const slot = document.createElement('div');
      slot.className = 'pve-skill-slot' + (s.isLegendary ? ' legendary' : '');
      slot.id = `skillSlot_${s.id}`;
      slot.innerHTML = `
        <div class="skill-cd-overlay" id="skillCd_${s.id}"></div>
        <span style="position:relative;z-index:1;font-size:20px">${def.icon}</span>
        <div class="skill-key">${i+1}</div>
        <div class="skill-lv">L${s.level}</div>`;
      slot.title = def.name + ': ' + def.desc;
      bar.appendChild(slot);
    });
    // Add empty slots up to 6 active skills (excluding legendary slot)
    const activeSkillsCount = this.skills.filter(s => !SKILL_DEFS[s.id].isLegendary).length;
    for (let i = activeSkillsCount; i < 6; i++) {
      const slot = document.createElement('div');
      slot.className = 'pve-skill-slot empty';
      slot.style.borderColor = 'rgba(255,255,255,0.06)';
      slot.innerHTML = `<span style="font-size:14px;color:rgba(255,255,255,0.1)">⚔️</span>`;
      bar.appendChild(slot);
    }
  }

  // ──────────────────────────────────────────────
  // GAME LOOP
  // ──────────────────────────────────────────────
  start() {
    this.running = true;
    this.setupInput();
    window.addEventListener('resize', () => this.resize());
    // Spawn đợt quái đầu tiên ngay khi game bắt đầu
    const p = this.player;
    const initScaling = getWaveScaling(0);
    for (let i = 0; i < initScaling.countPerBatch; i++) {
      const typeId = 'slime';
      const angle = Math.random() * Math.PI * 2;
      const dist  = 500 + Math.random() * 200;
      this.spawnEnemy(typeId, p.x + Math.cos(angle) * dist, p.y + Math.sin(angle) * dist, 1, false);
    }
    this.batchTimer = initScaling.batchInterval;
    this.updateHud();
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(t => this.loop(t));

    // Trigger Arcana selection at start of game (Wave 1)
    setTimeout(() => {
      this.triggerArcanaSelection();
    }, 200);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.removeInput();
  }

  pause() {
    this.paused = true;
    document.getElementById('pvePauseOverlay').classList.remove('hidden');
    if (typeof updatePauseStatsPanel === 'function') {
      updatePauseStatsPanel();
    }
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.lastTime = performance.now();
    document.getElementById('pvePauseOverlay').classList.add('hidden');
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(t => this.loop(t));
  }

  loop(timestamp) {
    if (!this.running) return;
    let dt = (timestamp - this.lastTime) / 1000;
    if (isNaN(dt) || dt < 0 || dt > 1.0) {
      dt = 0.016; // default fallback to 60fps frame time
    }
    dt = Math.min(dt, 0.1);
    this.lastTime = timestamp;
    try {
      if (!this.paused) {
        this.update(dt);
      }
      this.draw();
    } catch (err) {
      console.error('[FlipFight] Runtime error in game loop:', err);
      // Reset canvas transform to prevent cascade corruption
      try {
        const canvas = document.getElementById('pveCanvas');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }
      } catch(e2) {}
    }
    this.raf = requestAnimationFrame(t => this.loop(t));
  }

  // ──────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────
    update(dt) {
    this.updatePlayer(dt);
    this.updateSkills(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateSlashEffects(dt);
    this.updateParticles(dt);
    this.updateFloats(dt);
    this.updateSummons(dt);
    this.updateHazards(dt);
    this.updateDangerZones(dt);
    this.updateWave(dt);
    this.updateCamera(dt);
    this.updateHud();
    this.hpRegen(dt);
    this.updateBgSpores(dt);
    this.updateFrameAnimations(dt);
    this.updateDayNightAndWeather(dt);
    this.updateMerchantRescue(dt);
    this.updateShrinesAndAltars(dt);
    this.updateTarotEffects(dt);
    applyStatCaps(this.player);
  }

  updateBgSpores(dt) {
    this.bgSpores.forEach(s => {
      s.x += Math.cos(s.angle) * s.speed * dt;
      s.y += Math.sin(s.angle) * s.speed * dt;
      s.pulse += dt * 2;
      if (s.x < 0) s.x = WORLD_W;
      if (s.x > WORLD_W) s.x = 0;
      if (s.y < 0) s.y = WORLD_H;
      if (s.y > WORLD_H) s.y = 0;
    });
  }

  updateTarotEffects(dt) {
    const p = this.player;
    if (p.hp <= 0) return;

    // 1. The Chariot: periodic shockwave every 3s
    if (this.activeArcanas.has('arcana_the_chariot')) {
      this.chariotTimer = (this.chariotTimer || 0) + dt;
      if (this.chariotTimer >= 3.0) {
        this.chariotTimer = 0;
        this.aoeExplosion(p.x, p.y, 160, 120 * p.dmgMult * (p.atkMult || 1.0), '#22d3ee');
        this.addFloat(p.x, p.y - 60, '🏎️ Sóng Chariot Bộc Phát!', '#22d3ee');
      }
    }

    // 2. The Hermit: +40% ATK & +20% Armor if no enemies are within 300px
    if (this.activeArcanas.has('arcana_the_hermit')) {
      let enemyNear = false;
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.hp > 0) {
          const dx = e.x - p.x;
          const dy = e.y - p.y;
          if (dx * dx + dy * dy < 300 * 300) {
            enemyNear = true;
            break;
          }
        }
      }
            if (!enemyNear) {
        if (!this.hermitBuffActive) {
          this.hermitBuffActive = true;
          this.recalculatePassiveStats();
          this.addFloat(p.x, p.y - 45, '🛖 Cường Hóa Hermit!', '#34d399');
        }
      } else {
        if (this.hermitBuffActive) {
          this.hermitBuffActive = false;
          this.recalculatePassiveStats();
        }
      }
    }

    // 3. The Tower: Lightning smites every 2s to up to 3 random enemies
    if (this.activeArcanas.has('arcana_the_tower')) {
      this.towerTimer = (this.towerTimer || 0) + dt;
      if (this.towerTimer >= 2.0) {
        this.towerTimer = 0;
        // Find nearest enemies within 400px
        const nearby = this.enemies.filter(e => e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) < 400);
        const targets = nearby.sort(() => 0.5 - Math.random()).slice(0, 3);
        if (targets.length > 0) {
          targets.forEach(t => {
            t.hp -= 150 * p.dmgMult;
            t.isStunned = true;
            t.stunEnd = Date.now() + 1000; // stun 1s
            // Spawn lightning particles
            this.spawnParticles(t.x, t.y, '#fde047', 10, 3);
            this.particles.push({ type: 'ring', x: t.x, y: t.y, r: 0, maxR: 35, color: '#fde047', life: 0.3, maxLife: 0.3 });
            this.addFloat(t.x, t.y - 30, `⚡ Sét Smite: ${Math.round(150 * p.dmgMult)}`, '#fde047');
          });
        }
      }
    }

    // 4. The Sun: solar aura burns nearby enemies every 1.0s
    if (this.activeArcanas.has('arcana_the_sun')) {
      this.sunTimer = (this.sunTimer || 0) + dt;
      if (this.sunTimer >= 1.0) {
        this.sunTimer = 0;
        this.enemies.forEach(e => {
          if (e.hp > 0) {
            const dx = e.x - p.x;
            const dy = e.y - p.y;
            if (dx * dx + dy * dy < 180 * 180) {
              const dmg = Math.round(25 * p.dmgMult * (p.atkMult || 1.0));
              e.hp -= dmg;
              this.spawnParticle(e.x, e.y, '#f97316', 2, 0.4);
              this.addFloat(e.x, e.y - 30, `🔥 ${dmg}`, '#f97316');
            }
          }
        });
      }
    }
  }

  updatePlayer(dt) {
    const p = this.player;
    if (p.voidDemonActiveUntil && Date.now() > p.voidDemonActiveUntil) {
      if (p._originalRadius) {
        p.r = p._originalRadius;
        p.atkMult = p._originalAtkMult;
        p._originalRadius = null;
        p._originalAtkMult = null;
        this.addFloat(p.x, p.y - 70, 'Demon form ended', '#94a3b8');
      }
      p.voidDemonActiveUntil = null;
    }
    let dx = 0, dy = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp'])    dy -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown'])  dy += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft'])  dx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

    if (this.joystickVec) { dx = this.joystickVec.x; dy = this.joystickVec.y; }

    const len = Math.hypot(dx, dy);
    if (len > 0) { dx /= len; dy /= len; }

    p.vx = dx;
    p.vy = dy;

    let weatherSpdMult = 1.0;
    if (this.currentWeather === 'blizzard') weatherSpdMult *= 0.7; // 30% slow
    if (this.activeShrineBuffs && this.activeShrineBuffs.speed > 0) weatherSpdMult *= 1.4; // Shrines speed buff (+40%)
    const spd = p.speed * p.spdMult * (Date.now() < p.rallyUntil ? 1.5 : 1) * weatherSpdMult * dt;
    const prevX = p.x, prevY = p.y;
    p.x = Math.max(p.r, Math.min(WORLD_W - p.r, p.x + dx * spd));
    p.y = Math.max(p.r, Math.min(WORLD_H - p.r, p.y + dy * spd));
    // ── Track actual velocity for boss intercept AI ────────────
    // (_vx, _vy) là vận tốc pixel/giây để boss dự đoán vị trí tương lai
    p._vx = (p.x - prevX) / dt;
    p._vy = (p.y - prevY) / dt;

    // Spawn running dust smoke footsteps particles
    if (len > 0) {
      p.dustTimer = (p.dustTimer || 0) + dt;
      if (p.dustTimer > 0.16) {
        p.dustTimer = 0;
        const backAngle = p.angle + Math.PI + (Math.random() - 0.5) * 0.5;
        const dustX = p.x + Math.cos(backAngle) * p.r * 0.8;
        const dustY = p.y + Math.sin(backAngle) * p.r * 0.8;
        this.spawnFootstepDust(dustX, dustY);
      }
    } else {
      p.dustTimer = 0;
    }

    // Collision with 2.5D static obstacles (Player)
    if (this.staticObstacles) {
      this.staticObstacles.forEach(obs => {
        const odx = p.x - obs.x;
        const ody = p.y - obs.y;
        const dist = Math.hypot(odx, ody);
        const minDist = p.r + obs.r * 0.65; // 0.65 margin for a nice 2.5D depth overlapping feel
        if (dist < minDist) {
          const overlap = minDist - dist;
          if (dist > 0) {
            p.x += (odx / dist) * overlap;
            p.y += (ody / dist) * overlap;
          } else {
            p.x += minDist; // Default push to prevent NaN
          }
          p.x = Math.max(p.r, Math.min(WORLD_W - p.r, p.x));
          p.y = Math.max(p.r, Math.min(WORLD_H - p.r, p.y));
        }
      });
    }

    if (len > 0) p.angle = Math.atan2(dy, dx);
    
    // Druid standing regen
    if (len === 0 && this.clsKey === 'druid') {
      const now = Date.now();
      if (!p.lastStandingRegenTime || now - p.lastStandingRegenTime > 1000) {
        p.lastStandingRegenTime = now;
        const regenVal = p.maxHp * 0.015; // 1.5% hp per second
        p.hp = Math.min(p.maxHp, p.hp + regenVal);
        this.addFloat(p.x, p.y - 30, `+${Math.round(regenVal)} HP (Đứng Yên)`, '#4ade80');
      }
    }

    // Morph State (Void Demon)
    if (p.isMorphed) {
      if (Date.now() > p.morphExpires) {
        p.isMorphed = false;
        p.r = 22; // restore size
        this.addFloat(p.x, p.y - 60, 'Trở lại dạng thường', '#94a3b8');
        this.spawnParticles(p.x, p.y, '#94a3b8', 20, 4);
      } else {
        p.r = 45; // giant quỷ vương radius
        // 360-degree sweep attacks every 0.8 seconds
        if (!p.lastMorphAttack || Date.now() - p.lastMorphAttack > 800) {
          p.lastMorphAttack = Date.now();
          const sweepRange = 160;
          this.enemies.forEach(e => {
            if (Math.hypot(e.x - p.x, e.y - p.y) < sweepRange) {
              this.dealDamage(e, 140 * p.dmgMult * p.atkMult);
              this.spawnParticles(e.x, e.y, '#6d28d9', 6, 2);
            }
          });
          this.emitSlash(p.x, p.y, Math.random()*Math.PI*2, sweepRange, '#6d28d9', 'fighter_slash');
          this.particles.push({ type: 'ring', x: p.x, y: p.y, r: 0, maxR: sweepRange, color: '#6d28d9', life: 0.3, maxLife: 0.3 });
          this.screenShake(6, 0.15);
        }
      }
    }

    // Collect Boss Evolution Chest
    if (this.bossChests) {
      for (let i = this.bossChests.length - 1; i >= 0; i--) {
        const chest = this.bossChests[i];
        const dist = Math.hypot(p.x - chest.x, p.y - chest.y);
        if (dist < p.r + chest.r) {
          this.bossChests.splice(i, 1);
          this.triggerEvolutionCheck();
        }
      }
    }

    p.attackAnim = Math.max(0, p.attackAnim - dt * 4);

    if (p.attackAnimObj && Date.now() - p.attackAnimObj.t > p.attackAnimObj.duration) {
      p.attackAnimObj = null;
    }

    // Invincibility frames
    if (p.invincible && Date.now() > p.invincibleUntil) p.invincible = false;

    // Spider poison DoT on player
    if (p.poisonedUntil && Date.now() < p.poisonedUntil && p.poisonDmgPerSec > 0) {
      const poisonDmg = p.poisonDmgPerSec * dt;
      p.hp = Math.max(1, p.hp - poisonDmg);
      if (Math.random() < 0.15) {
        this.spawnParticle(p.x + (Math.random()-0.5)*20, p.y + (Math.random()-0.5)*20, '#a3e635', 3, 0.4);
        this.addFloat(p.x, p.y - 18, `💚 -${Math.round(poisonDmg*10)}`, '#a3e635');
      }
      if (p.hp <= 0) this.gameOver();
    } else if (p.poisonedUntil && Date.now() >= p.poisonedUntil) {
      p.poisonedUntil = 0;
      p.poisonDmgPerSec = 0;
    }
  }

  hpRegen(dt) {
    const p = this.player;
    let petRegen = 0;
    if (this.save && this.save.activePet === 'kitty') {
      petRegen = 15;
    }
    const totalRegen = (p.hpRegen || 0) + petRegen;
    if (p.hp < p.maxHp && totalRegen > 0) {
      p.hp = Math.min(p.maxHp, p.hp + totalRegen * dt);
    }
  }

  updateCamera(dt) {
    const p = this.player;
    this.cam.x += (p.x - this.cam.x) * 8 * dt;
    this.cam.y += (p.y - this.cam.y) * 8 * dt;
  }

  // ──────────────────────────────────────────────
  // SKILLS UPDATE
  // ──────────────────────────────────────────────
  updateSkills(dt) {
    const now = Date.now();
    const p = this.player;
    this.skills.forEach(s => {
      const def = SKILL_DEFS[s.id];
      if (!def) return;
      const state = this.skillState[s.id] || (this.skillState[s.id] = { lastFired: 0 });
      const cdMs = Math.max(200, def.cd * 1000 * p.cdMult * Math.max(0.25, 1 - (s.level - 1) * 0.10));
      const elapsed = now - state.lastFired;
      const pct = Math.max(0, Math.min(1, elapsed / cdMs));

      // Update CD overlay
      const cdEl = document.getElementById(`skillCd_${s.id}`);
      if (cdEl) cdEl.style.height = ((1 - pct) * 100) + '%';

      if (elapsed >= cdMs) {
        state.lastFired = now;
        this.fireSkill(s.id, s.level, def);
      }
    });
  }

  fireSkill(id, level, def) {
    const p = this.player;
    if (p.hasArchangelPerk) {
      p.hp = Math.min(p.maxHp, p.hp + 5);
      this.spawnParticle(p.x, p.y, '#fde68a', 4, 0.3);
    }
    p.attackAnimObj = { t: Date.now(), duration: 200 }; // Trigger swing
    const pactMult = this.pactDmgMult || 1.0;
    const mageMult = this.clsKey === 'mage' ? 1.2 : 1.0;
    let shadowDmgMult = 1.0;
    if (this.dayNightCycle === 'night') {
      const shadowSkills = ['shadow_blades', 'void_pulse', 'poison_dart', 'shadow_clone', 'void_reaver', 'void_demon', 'summon_skeleton', 'death_grasp', 'soul_drain', 'lich_army', 'grim_reaper'];
      if (shadowSkills.includes(id)) shadowDmgMult = 1.30; // +30% at night
    }
    let shrineDmgMult = 1.0;
    if (this.activeShrineBuffs && this.activeShrineBuffs.power > 0) {
      shrineDmgMult = 1.50; // +50% from Power Shrine
    }
    const dmgScale = p.dmgMult * p.atkMult * (1 + (level - 1) * 0.35) * mageMult * pactMult * shadowDmgMult * shrineDmgMult;
    const baseDmg  = def.dmg * dmgScale;

    switch(id) {
      case 'magic_missile':  this.fireMagicMissile(baseDmg, level); break;
      case 'piercing_arrow': this.firePiercingArrow(baseDmg, level); break;
      case 'fireball':       this.fireFireball(baseDmg, level); break;
      case 'shadow_blades':  this.fireShadowBlades(baseDmg, level); break;
      case 'frost_aura':     this.fireFrostAura(baseDmg, level); break;
      case 'thunder_ring':   this.fireThunderRing(baseDmg, level); break;
      case 'meteor':         this.fireMeteor(baseDmg, level); break;
      case 'shield_bash':    this.fireShieldBash(baseDmg, level); break;
      case 'earthquake':     this.fireEarthquake(baseDmg, level); break;
      case 'void_pulse':     this.fireVoidPulse(baseDmg, level); break;
      case 'iron_wall':      this.fireIronWall(level); break;
      case 'rally':          this.fireRally(level); break;
      case 'poison_dart':    this.firePoisonDart(baseDmg, level); break;
      case 'shadow_clone':   this.fireShadowClone(baseDmg, level); break;
      case 'arrow_rain':     this.fireArrowRain(baseDmg, level); break;
      case 'spirit_wolf':    this.fireSpiritWolf(baseDmg, level); break;
      case 'holy_light':     this.fireHolyLight(baseDmg, level); break;
      case 'divine_shield':  this.fireDivineShield(level); break;
      case 'consecration':   this.fireConsecration(baseDmg, level); break;
      case 'summon_skeleton':this.fireSummonSkeleton(baseDmg, level); break;
      case 'death_grasp':    this.fireDeathGrasp(baseDmg, level); break;
      case 'soul_drain':     this.fireSoulDrain(baseDmg, level); break;
      case 'briar_patch':    this.fireBriarPatch(baseDmg, level); break;
      case 'nature_regrowth':this.fireNatureRegrowth(level); break;
      case 'vine_whip':      this.fireVineWhip(baseDmg, level); break;
      // Legendaries (Nguyên bản)
      case 'specter_storm':  this.fireSpecterStorm(baseDmg, level); break;
      case 'celestial_nova': this.fireCelestialNova(baseDmg, level); break;
      case 'titan_fortress': this.fireTitanFortress(baseDmg, level); break;
      case 'hurricane_barrage': this.fireHurricaneBarrage(baseDmg, level); break;
      case 'judgment_day':   this.fireJudgmentDay(baseDmg, level); break;
      case 'lich_army':      this.fireLichArmy(baseDmg, level); break;
      case 'grave_wrath':    this.fireGraveWrath(baseDmg, level); break;
      // Evolved Skills (MỚI)
      case 'spell_storm':    this.fireSpellStorm(baseDmg, level); break;
      case 'wind_runner':    this.fireWindRunner(baseDmg, level); break;
      case 'void_reaver':    this.fireVoidReaver(baseDmg, level); break;
      case 'aegis_smash':    this.fireAegisSmash(baseDmg, level); break;
      case 'hellfire_meteor':this.fireHellfireMeteor(baseDmg, level); break;
      case 'genesis_bloom':  this.fireGenesisBloom(baseDmg, level); break;
      case 'grim_reaper':    this.fireGrimReaper(baseDmg, level); break;
      case 'glacial_sanctum':this.fireGlacialSanctum(baseDmg, level); break;
      case 'archangel_light':this.fireArchangelLight(baseDmg, level); break;
      case 'void_demon':     this.fireVoidDemon(baseDmg, level); break;
    }
  }

  // ─── SKILL IMPLEMENTATIONS ───────────────────

  fireMagicMissile(dmg, lv) {
    const target = this.nearestEnemy();
    if (!target) return;
    const p = this.player;
    const angle = Math.atan2(target.y - p.y, target.x - p.x);
    const count = (lv >= 3 ? 3 : lv >= 2 ? 2 : 1) + (p.projAddCount || 0);
    const speed = 420 * (p.projSpeedMult || 1.0);
    for (let i = 0; i < count; i++) {
      const spread = (i - (count-1)/2) * 0.15;
      this.spawnProjectile({ x: p.x, y: p.y, angle: angle + spread, speed, dmg, radius: 9,
        color: '#22d3ee', trail: true, trailColor: '#0ea5e9', pierce: false,
        emitParticle: () => this.spawnParticle(0, 0, '#22d3ee', 5, 0.3, true)
      });
    }
    this.spawnParticles(p.x, p.y, '#22d3ee', 5, 2.5);
  }

  firePiercingArrow(dmg, lv) {
    const target = this.nearestEnemy();
    const p = this.player;
    const angle = target ? Math.atan2(target.y - p.y, target.x - p.x) : p.angle;
    const count = (lv >= 3 ? 3 : lv >= 2 ? 2 : 1) + (p.projAddCount || 0);
    const speed = 560 * (p.projSpeedMult || 1.0);
    for (let i = 0; i < count; i++) {
      const spread = (i - (count-1)/2) * 0.2;
      this.spawnProjectile({ x: p.x, y: p.y, angle: angle + spread, speed, dmg, radius: 6,
        color: '#34d399', trail: true, trailColor: '#10b981', pierce: true,
        maxPierces: 3 + lv, isArrow: true
      });
    }
    this.spawnParticles(p.x, p.y, '#34d399', 4, 2);
  }

  fireFireball(dmg, lv) {
    const target = this.nearestEnemy();
    if (!target) return;
    const p = this.player;
    const angle = Math.atan2(target.y - p.y, target.x - p.x);
    const count = 1 + (p.projAddCount || 0);
    const speed = 300 * (p.projSpeedMult || 1.0);
    for (let i = 0; i < count; i++) {
      const spread = (i - (count-1)/2) * 0.15;
      this.spawnProjectile({ x: p.x, y: p.y, angle: angle + spread, speed, dmg, radius: 14,
        color: '#ef4444', trail: true, trailColor: '#f97316', pierce: false,
        onHit: (ex, ey) => { 
          this.aoeExplosion(ex, ey, (60+lv*20)*this.player.aoeMult, dmg*0.6, '#ef4444');
          this.spawnFrameAnimation('fireball_explode', ex, ey, (60+lv*20)*this.player.aoeMult * 1.2);
        }
      });
    }
    this.spawnParticles(p.x, p.y, '#f97316', 8, 3);
  }

  fireShadowBlades(dmg, lv) {
    const p = this.player;
    const count = Math.min(8, 3 + lv); // cap at 8 blades per fire
    const orbitRadius = Math.min(80, p.r + 30); // cap orbit radius at 80px
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const ox = Math.cos(angle) * orbitRadius;
      const oy = Math.sin(angle) * orbitRadius;
      // Check hit in orbital zone
      this.enemies.forEach(e => {
        const ex = e.x - p.x, ey = e.y - p.y;
        const dist = Math.hypot(ex, ey);
        if (dist < p.r + 55) {
          this.dealDamage(e, dmg * 0.6);
          this.spawnParticles(e.x, e.y, '#a855f7', 3, 2);
        }
      });
      this.spawnParticle(p.x + ox, p.y + oy, '#c084fc', 8, 0.3);
    }
  }

  fireFrostAura(dmg, lv) {
    const p = this.player;
    const r = (120 + lv * 30) * p.aoeMult;
    this.enemies.forEach(e => {
      if (Math.hypot(e.x - p.x, e.y - p.y) < r) {
        this.dealDamage(e, dmg * 0.4);
        e.slow = Math.max(e.slow || 0, 0.35 + lv * 0.1);
        e.slowUntil = Date.now() + 1800;
        this.spawnParticles(e.x, e.y, '#93c5fd', 4, 1.5);
      }
    });
    // Spawn rotating custom snowflakes!
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const dist = Math.random() * r;
      this.particles.push({
        type: 'snowflake',
        x: p.x + Math.cos(a) * dist,
        y: p.y + Math.sin(a) * dist,
        r: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        life: 0.75, maxLife: 0.75
      });
    }
    // Frost ring visual
    this.particles.push({ type:'ring', x: p.x, y: p.y, r: 0, maxR: r, color:'#93c5fd', life: 0.5, maxLife: 0.5 });
  }

  fireThunderRing(dmg, lv) {
    const p = this.player;
    const count = 8 + lv * 2;
    const dist = 280 + lv * 40;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const tx = p.x + Math.cos(angle) * dist;
      const ty = p.y + Math.sin(angle) * dist;
      this.emitLightningEffect(p.x, p.y, tx, ty, '#fde047', '#eab308');
      
      this.spawnProjectile({ x: p.x, y: p.y, angle, speed: 380, dmg, radius: 7,
        color: '#fde047', trail: true, trailColor: '#eab308', pierce: true, maxPierces: 2,
        maxDist: dist,
        onHit: (hx, hy) => this.spawnFrameAnimation('lightning_strike', hx, hy, 80)
      });
    }
    this.spawnParticles(p.x, p.y, '#fde047', 12, 3.5);
  }

  fireMeteor(dmg, lv) {
    const count = lv;
    for (let i = 0; i < count; i++) {
      const tx = WORLD_W * 0.2 + Math.random() * WORLD_W * 0.6;
      const ty = WORLD_H * 0.2 + Math.random() * WORLD_H * 0.6;
      setTimeout(() => {
        if (!this.running) return;
        // Warning circle
        this.particles.push({ type:'ring', x: tx, y: ty, r: 60, maxR: 60, color:'#f97316', life: 0.8, maxLife: 0.8 });
        
        // Spawn falling fireball visual!
        this.particles.push({
          type: 'spark', x: tx - 100, y: ty - 400,
          vx: 125, vy: 500, color: '#f97316', r: 12, life: 0.8, maxLife: 0.8
        });
        
        setTimeout(() => {
          if (!this.running) return;
          const r = (80 + lv * 20) * this.player.aoeMult;
          this.aoeExplosion(tx, ty, r, dmg, '#f97316');
          this.spawnFrameAnimation('fireball_explode', tx, ty, r * 1.25);
          this.screenShake(8, 0.3);
          
          // Extra fire ash particles rising
          for (let j = 0; j < 10; j++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 60 + Math.random() * 80;
            this.particles.push({
              type: 'spark', x: tx, y: ty,
              vx: Math.cos(a) * sp, vy: -120 - Math.random() * 100,
              color: '#ef4444', r: 3 + Math.random() * 4, life: 1.0, maxLife: 1.0
            });
          }
        }, 800);
      }, i * 600);
    }
  }

  fireShieldBash(dmg, lv) {
    const p = this.player;
    const r = (160 + lv * 30) * p.aoeMult;
    this.enemies.forEach(e => {
      const dist = Math.hypot(e.x - p.x, e.y - p.y);
      if (dist < r) {
        this.dealDamage(e, dmg);
        e.stunUntil = Date.now() + 800 * lv;
        const angle = Math.atan2(e.y - p.y, e.x - p.x);
        e.x += Math.cos(angle) * 60;
        e.y += Math.sin(angle) * 60;
        this.spawnParticles(e.x, e.y, '#facc15', 8, 3);
      }
    });
    this.emitSlash(p.x, p.y, p.angle, 60 + lv * 10, '#facc15', 'fighter_slash');
    this.spawnFrameAnimation('sword_slash', p.x, p.y, r * 0.9, p.angle);
    this.particles.push({ type:'ring', x: p.x, y: p.y, r: 0, maxR: r, color:'#facc15', life: 0.3, maxLife: 0.3 });
    this.spawnParticles(p.x, p.y, '#facc15', 15, 4);
  }

  fireEarthquake(dmg, lv) {
    const p = this.player;
    const r = (200 + lv * 40) * p.aoeMult;
    // Ground crack particles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      this.particles.push({ type:'crack', x: p.x, y: p.y, angle, len: r, color:'#f97316', life: 0.8, maxLife: 0.8 });
    }
    this.enemies.forEach(e => {
      if (Math.hypot(e.x - p.x, e.y - p.y) < r) {
        this.dealDamage(e, dmg);
        e.stunUntil = Date.now() + 1200;
        this.spawnParticles(e.x, e.y, '#f97316', 10, 3);
      }
    });
    this.screenShake(10, 0.4);
  }

  fireVoidPulse(dmg, lv) {
    const p = this.player;
    const r = Math.min(200, (150 + lv * 40) * p.aoeMult); // cap at 200px
    this.enemies.forEach(e => {
      const dist = Math.hypot(e.x - p.x, e.y - p.y);
      if (dist < r) {
        this.dealDamage(e, dmg);
        const angle = Math.atan2(e.y - p.y, e.x - p.x);
        e.x += Math.cos(angle) * (150 - dist * 0.5);
        e.y += Math.sin(angle) * (150 - dist * 0.5);
        this.spawnParticles(e.x, e.y, '#7c3aed', 10, 3);
      }
    });
    this.emitSlash(p.x, p.y, p.angle, 55 + lv * 10, '#7c3aed', 'assassin_slash');
    // Expanding ring
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (!this.running) return;
        this.particles.push({ type:'ring', x: p.x, y: p.y, r: 0, maxR: r * (0.5 + i * 0.25), color:'#7c3aed', life: 0.4, maxLife: 0.4 });
      }, i * 80);
    }
  }

  fireIronWall(lv) {
    const p = this.player;
    const mult = p.shieldMaxMult || 1.0;
    p.shieldMax = p.maxHp * (0.15 + lv * 0.08) * mult;
    p.shieldHp  = p.shieldMax;
    this.spawnParticles(p.x, p.y, '#64748b', 20, 4);
    this.particles.push({ type:'ring', x: p.x, y: p.y, r: 0, maxR: p.r + 30, color:'#64748b', life: 0.5, maxLife: 0.5 });
    this.addFloat(p.x, p.y - 40, `🧱 SHIELD +${Math.round(p.shieldMax)}`, '#94a3b8');
  }

  fireRally(lv) {
    const p = this.player;
    p.rallyUntil = Date.now() + (3000 + lv * 500);
    this.spawnParticles(p.x, p.y, '#eab308', 20, 5);
    this.addFloat(p.x, p.y - 40, '⚡ SPEED UP!', '#fbbf24');
  }

  firePoisonDart(dmg, lv) {
    const target = this.nearestEnemy();
    if (!target) return;
    const p = this.player;
    const angle = Math.atan2(target.y - p.y, target.x - p.x);
    const count = 1 + (p.projAddCount || 0);
    const speed = 460 * (p.projSpeedMult || 1.0);
    for (let i = 0; i < count; i++) {
      const spread = (i - (count-1)/2) * 0.15;
      this.spawnProjectile({ x: p.x, y: p.y, angle: angle + spread, speed, dmg: dmg * 0.5, radius: 7,
        color: '#10b981', trail: true, trailColor: '#34d399', pierce: false,
        onHit: (ex, ey, enemy) => {
          if (enemy) {
            enemy.poisonDmg = dmg * 0.3 * lv * (p.poisonDmgMult || 1.0);
            enemy.poisonUntil = Date.now() + 4000;
            this.spawnParticles(ex, ey, '#10b981', 6, 2);
          }
        }
      });
    }
  }

  fireShadowClone(dmg, lv) {
    const p = this.player;
    const duration = 5000 + lv * 1000;
    
    // LIMIT ACTIVE CLONES (Capping)
    const maxClones = 4 + (this.clsKey === 'assassin' ? 2 : 0);
    const clones = this.summons.filter(s => s.type === 'shadow_clone');
    const count = lv;

    if (clones.length + count > maxClones) {
      const toRemove = (clones.length + count) - maxClones;
      let removedCount = 0;
      for (let i = 0; i < this.summons.length; i++) {
        if (this.summons[i].type === 'shadow_clone') {
          this.summons.splice(i, 1);
          i--;
          removedCount++;
          if (removedCount >= toRemove) break;
        }
      }
    }

    for (let i = 0; i < lv; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.summons.push({
        type: 'shadow_clone', x: p.x + Math.cos(angle) * 60, y: p.y + Math.sin(angle) * 60,
        r: p.r * 0.8, hp: 9999 * (this.activeArcanas.has('arcana_the_lovers') ? 1.5 : 1.0), dmg: dmg * 0.7 * (this.activeArcanas.has('arcana_the_lovers') ? 1.5 : 1.0), speed: p.speed * 0.9, color: '#6d28d9',
        expiresAt: Date.now() + duration, lastAttack: 0, attackCd: 600
      });
    }
    this.spawnParticles(p.x, p.y, '#6d28d9', 15, 4);
  }

  fireArrowRain(dmg, lv) {
    const p = this.player;
    const target = this.nearestEnemy() || { x: p.x + 200, y: p.y };
    const count = 8 + lv * 4;
    const aoeR = (80 + lv * 15) * p.aoeMult;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!this.running) return;
        const tx = target.x + (Math.random() - 0.5) * aoeR * 2;
        const ty = target.y + (Math.random() - 0.5) * aoeR * 2;
        // Spawn warning dot on ground
        this.particles.push({ type: 'rain_arrow_warn', x: tx, y: ty, r: 8, life: 0.25, maxLife: 0.25, color: '#34d399' });
        // Spawn falling arrow after 0.25s delay
        setTimeout(() => {
          if (!this.running) return;
          this.particles.push({
            type: 'rain_arrow',
            x: tx, y: ty - 320,
            tx, ty,
            vx: 0, vy: 0,
            color: '#34d399',
            dmg: dmg * p.dmgMult * p.atkMult,
            life: 0.22, maxLife: 0.22,
            done: false
          });
        }, 250);
      }, i * 70);
    }
    this.addFloat(p.x, p.y - 50, '🏹 MƯA TÊN!', '#34d399');
  }

    fireBriarPatch(dmg, lv) {
    const p = this.player;
    
    // LIMIT ACTIVE BRIAR PATCHES (Cap max 8 density)
    const activeBriars = this.hazards.filter(h => h.type === 'briar');
    const maxBriars = 8;
    if (activeBriars.length >= maxBriars) {
      const toRemove = activeBriars.length - maxBriars + 1;
      let removedCount = 0;
      for (let i = 0; i < this.hazards.length; i++) {
        if (this.hazards[i].type === 'briar') {
          this.hazards.splice(i, 1);
          i--;
          removedCount++;
          if (removedCount >= toRemove) break;
        }
      }
    }

    const r = Math.min(200, (80 + lv * 15) * p.aoeMult);
    this.hazards.push({ type:'briar', x: p.x, y: p.y, r,
      dmg: dmg * 0.2, life: Math.min(6, 3 + lv * 0.5), color:'#86efac', slow: 0.4 + lv * 0.1, tickCd: 0.5 });
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const dist = Math.random() * r * 0.95;
      this.particles.push({
        type: 'thorny_spike',
        x: p.x + Math.cos(a) * dist,
        y: p.y + Math.sin(a) * dist,
        w: 6 + Math.random() * 6,
        h: 12 + Math.random() * 12,
        life: Math.min(6, 3.0 + lv * 0.4), maxLife: Math.min(6, 3.0 + lv * 0.4)
      });
    }
    this.spawnParticles(p.x, p.y, '#86efac', 10, 3);
  }

  fireSpiritWolf(dmg, lv) {
    const p = this.player;
    
    // LIMIT ACTIVE SPIRIT WOLVES (Capping)
    const maxWolves = 6;
    const wolves = this.summons.filter(s => s.type === 'spirit_wolf');
    const count = 1;

    if (wolves.length + count > maxWolves) {
      const toRemove = (wolves.length + count) - maxWolves;
      let removedCount = 0;
      for (let i = 0; i < this.summons.length; i++) {
        if (this.summons[i].type === 'spirit_wolf') {
          this.summons.splice(i, 1);
          i--;
          removedCount++;
          if (removedCount >= toRemove) break;
        }
      }
    }

    this.summons.push({
      type: 'spirit_wolf', x: p.x, y: p.y, r: 18, hp: 9999 * (this.activeArcanas.has('arcana_the_lovers') ? 1.5 : 1.0), dmg: dmg * (this.activeArcanas.has('arcana_the_lovers') ? 1.5 : 1.0), speed: 350, color: '#6ee7b7',
      angle: p.angle, expiresAt: Date.now() + 4000, phase: 'charging'
    });
    this.spawnParticles(p.x, p.y, '#6ee7b7', 12, 3);
  }

  fireHolyLight(dmg, lv) {
    const p = this.player;
    const healAmt = p.maxHp * (0.05 + lv * 0.02);
    p.hp = Math.min(p.maxHp, p.hp + healAmt);
    this.addFloat(p.x, p.y - 30, `+${Math.round(healAmt)} HP`, '#fde68a');
    
    // Spawn gorgeous holy judgment animation at player position
    this.spawnFrameAnimation('holy_judgment', p.x, p.y, 140 * p.aoeMult);

    // Holy damage to nearby
    this.enemies.forEach(e => {
      if (Math.hypot(e.x - p.x, e.y - p.y) < 140 * p.aoeMult) {
        this.dealDamage(e, dmg);
        this.spawnParticles(e.x, e.y, '#fde68a', 8, 3);
      }
    });
    // Holy light burst
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      this.spawnProjectile({ x: p.x, y: p.y, angle: a, speed: 0, dmg: 0, radius: 0,
        color: '#fde68a', trail: false, life: 0.3, shape: 'beam', beamLen: 100 + lv * 30
      });
    }
    this.spawnParticles(p.x, p.y, '#fde68a', 20, 5);
  }

  fireDivineShield(lv) {
    const p = this.player;
    p.invincible = true;
    p.divineShieldUntil = Date.now() + 2000;
    p.invincibleUntil = p.divineShieldUntil;
    this.addFloat(p.x, p.y - 40, '🌟 DIVINE SHIELD!', '#fde68a');
    this.spawnParticles(p.x, p.y, '#fde68a', 30, 6);
    setTimeout(() => {
      if (!this.running) return;
      const r = (200 + lv * 50) * p.aoeMult;
      this.aoeExplosion(p.x, p.y, r, 80 * lv * p.dmgMult * p.atkMult, '#fde68a');
      this.spawnFrameAnimation('holy_judgment', p.x, p.y, r);
    }, 2000);
  }

  fireConsecration(dmg, lv) {
    const p = this.player;
    const r = (100 + lv * 30) * p.aoeMult;
    this.hazards.push({ type:'consecration', x: p.x, y: p.y, r, dmg: dmg * 0.3, life: 5 + lv, color:'#fde68a', tickCd: 0.6 });
    // Spawn gorgeous glowing cathedral floor runes!
    this.particles.push({ type: 'cathedral_rune', x: p.x, y: p.y, r: r * 0.95, life: 5.0 + lv, maxLife: 5.0 + lv });
    this.spawnParticles(p.x, p.y, '#fde68a', 16, 4);
    
    // Spawn a holy judgment animation on floor run start
    this.spawnFrameAnimation('holy_judgment', p.x, p.y, r * 1.1);
  }

    fireSummonSkeleton(dmg, lv) {
    const p = this.player;
    const maxSkeletons = 6;
    const skeletons = this.summons.filter(s => s.type === 'skeleton');
    const count = 2 + (p.summonAddCount || 0);

    if (skeletons.length + count > maxSkeletons) {
      const toRemove = (skeletons.length + count) - maxSkeletons;
      let removedCount = 0;
      for (let i = 0; i < this.summons.length; i++) {
        if (this.summons[i].type === 'skeleton') {
          this.summons.splice(i, 1);
          i--;
          removedCount++;
          if (removedCount >= toRemove) break;
        }
      }
    }

    // Cân bằng HP xương chiến binh theo cấp độ và sát thương của người chơi
    const baseSkeletonHp = (120 + lv * 50) * p.dmgMult * (1 + p.level * 0.05);
    const finalSkeletonHp = Math.round(baseSkeletonHp);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.summons.push({
        type: 'skeleton', x: p.x + Math.cos(angle) * 50, y: p.y + Math.sin(angle) * 50,
        r: 16, hp: finalSkeletonHp, maxHp: finalSkeletonHp, dmg: dmg * (this.activeArcanas.has('arcana_the_lovers') ? 1.5 : 1.0), speed: 130, color: '#e2e8f0',
        expiresAt: Date.now() + (8000 + lv * 2000), lastAttack: 0, attackCd: 900, target: null
      });
    }
    this.spawnParticles(p.x, p.y, '#94a3b8', 15, 3);
  }

  fireDeathGrasp(dmg, lv) {
    const target = this.nearestEnemy();
    if (!target) return;
    const p = this.player;
    target.stunUntil = Date.now() + 2000 + lv * 500;
    this.dealDamage(target, dmg);
    this.spawnParticles(target.x, target.y, '#475569', 12, 3);
    // Draw grasp line
    this.particles.push({ type:'grasp_line', x: p.x, y: p.y, tx: target.x, ty: target.y, color:'#475569', life: 0.5, maxLife: 0.5 });
  }

  fireSoulDrain(dmg, lv) {
    const p = this.player;
    let totalDrained = 0;
    this.enemies.forEach(e => {
      if (Math.hypot(e.x - p.x, e.y - p.y) < 180 * p.aoeMult) {
        const d = this.dealDamage(e, dmg);
        totalDrained += d * 0.3;
        this.spawnParticles(e.x, e.y, '#334155', 6, 2);
      }
    });
    if (totalDrained > 0) {
      p.hp = Math.min(p.maxHp, p.hp + totalDrained);
      this.addFloat(p.x, p.y - 40, `+${Math.round(totalDrained)} 吸血`, '#475569');
    }
  }

  fireNatureRegrowth(lv) {
    const p = this.player;
    const healTotal = p.maxHp * (0.12 + lv * 0.04);
    const ticks = 10;
    let tick = 0;
    const interval = setInterval(() => {
      if (!this.running || tick >= ticks) { clearInterval(interval); return; }
      p.hp = Math.min(p.maxHp, p.hp + healTotal / ticks);
      // Spawn spiraling green leaves!
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + tick * 0.45;
        this.particles.push({
          type: 'leaf',
          x: p.x + Math.cos(a) * 45,
          y: p.y + Math.sin(a) * 45,
          r: 6 + Math.random() * 4,
          rot: Math.random() * Math.PI,
          color: '#4ade80',
          life: 0.9, maxLife: 0.9
        });
      }
      this.spawnParticle(p.x + (Math.random()-0.5)*40, p.y + (Math.random()-0.5)*40, '#4ade80', 8, 0.8);
      tick++;
    }, 500);
  }

  fireVineWhip(dmg, lv) {
    const p = this.player;
    const count = 2 + lv;
    const sorted = [...this.enemies].sort((a,b) => Math.hypot(a.x-p.x,a.y-p.y) - Math.hypot(b.x-p.x,b.y-p.y));
    sorted.slice(0, count).forEach(e => {
      this.dealDamage(e, dmg);
      const angle = Math.atan2(e.y - p.y, e.x - p.x);
      e.x += Math.cos(angle + Math.PI) * 80;
      e.y += Math.sin(angle + Math.PI) * 80;
      e.stunUntil = Date.now() + 400;
      this.particles.push({ type:'vine', x: p.x, y: p.y, tx: e.x, ty: e.y, color:'#22c55e', life: 0.3, maxLife: 0.3 });
      this.spawnParticles(e.x, e.y, '#22c55e', 8, 3);
    });
    this.emitSlash(p.x, p.y, p.angle, 50 + lv * 8, '#22c55e', 'melee');
  }

  // ─── LEGENDARY SKILLS ────────────────────────

  fireSpecterStorm(dmg, lv) {
    const p = this.player;
    this.screenShake(15, 0.5);
    this.addFloat(p.x, p.y - 60, '👻 SPECTER STORM!', '#c084fc');
    const stormRadius = 400; // capped radius
    for (let c = 0; c < 6; c++) {
      setTimeout(() => {
        if (!this.running) return;
        this.enemies.forEach(e => {
          if (Math.hypot(e.x - p.x, e.y - p.y) < stormRadius && Math.random() < 0.7) {
            this.dealDamage(e, dmg * 0.5);
            this.spawnParticles(e.x, e.y, '#a855f7', 8, 3);
          }
        });
        this.spawnParticles(p.x + (Math.random()-0.5)*stormRadius*2, p.y + (Math.random()-0.5)*stormRadius*2, '#6d28d9', 20, 6);
      }, c * 500);
    }
  }

  fireCelestialNova(dmg, lv) {
    const p = this.player;
    this.screenShake(20, 0.8);
    this.addFloat(p.x, p.y - 60, '🌌 CELESTIAL NOVA!', '#38bdf8');
    const r = Math.min(450, 600 * p.aoeMult); // capped at 450px
    // Pull enemies in
    this.enemies.forEach(e => {
      if (Math.hypot(e.x - p.x, e.y - p.y) < r) {
        const angle = Math.atan2(p.y - e.y, p.x - e.x);
        e.x += Math.cos(angle) * 120;
        e.y += Math.sin(angle) * 120;
        e.stunUntil = Date.now() + 2500;
        e.slow = 0.8; e.slowUntil = Date.now() + 3500;
        this.dealDamage(e, dmg);
        this.spawnParticles(e.x, e.y, '#38bdf8', 10, 4);
      }
    });
    // Expanding nova rings
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        if (!this.running) return;
        this.particles.push({ type:'ring', x: p.x, y: p.y, r: 0, maxR: r * (0.3 + i * 0.23), color:'#38bdf8', life: 0.7, maxLife: 0.7 });
      }, i * 150);
    }
    for (let i = 0; i < 30; i++) {
      const a = Math.random()*Math.PI*2; const d = Math.random()*r;
      this.spawnParticle(p.x+Math.cos(a)*d, p.y+Math.sin(a)*d, '#0ea5e9', 10, 1);
    }
  }

  fireTitanFortress(dmg, lv) {
    const p = this.player;
    this.screenShake(18, 0.7);
    this.addFloat(p.x, p.y - 60, '🏛️ TITAN FORTRESS!', '#f97316');
    p.invincible = true; p.invincibleUntil = Date.now() + 2000;
    p.titanCounterUntil = Date.now() + 2000;
    // AoE after invincibility - capped at 500px
    setTimeout(() => {
      if (!this.running) return;
      const r = Math.min(500, (250 + lv * 40) * p.aoeMult);
      this.aoeExplosion(p.x, p.y, r, dmg, '#f97316');
      this.screenShake(20, 0.5);
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          if (!this.running) return;
          this.particles.push({ type:'ring', x: p.x, y: p.y, r: 0, maxR: r * (0.5 + i * 0.15), color:'#f97316', life: 0.5, maxLife: 0.5 });
        }, i * 100);
      }
    }, 2000);
    this.spawnParticles(p.x, p.y, '#f97316', 35, 7);
  }

  fireHurricaneBarrage(dmg, lv) {
    const p = this.player;
    this.addFloat(p.x, p.y - 60, '🌪️ HURRICANE!', '#34d399');
    let angle = 0;
    let ticks = 0;
    const maxTicks = 60;
    const interval = setInterval(() => {
      if (!this.running || ticks >= maxTicks) { clearInterval(interval); return; }
      const count = 8;
      for (let i = 0; i < count; i++) {
        const a = angle + (i / count) * Math.PI * 2;
        this.spawnProjectile({ x: p.x, y: p.y, angle: a, speed: 420, dmg: dmg * 0.2, radius: 8,
          color: '#34d399', trail: true, trailColor: '#10b981', pierce: true, maxPierces: 2, maxDist: 400
        });
      }
      angle += 0.25;
      ticks++;
    }, 70);
    this.spawnParticles(p.x, p.y, '#34d399', 30, 6);
    this.screenShake(12, 0.5);
  }

  fireJudgmentDay(dmg, lv) {
    const p = this.player;
    this.addFloat(p.x, p.y - 60, '⚔️ JUDGMENT DAY!', '#fde68a');
    this.screenShake(22, 1.0);
    // Holy cross beams - capped to screen-scale, not world-scale
    const beamW = 70 + lv * 15;
    const beamLen = Math.min(550, 400 + lv * 30); // max 550px beam length
    // Damage enemies in cross shape with range limit
    this.enemies.forEach(e => {
      const inH = Math.abs(e.x - p.x) < beamW / 2 && Math.abs(e.y - p.y) < beamLen;
      const inV = Math.abs(e.y - p.y) < beamW / 2 && Math.abs(e.x - p.x) < beamLen;
      if (inH || inV) {
        this.dealDamage(e, dmg);
        this.spawnParticles(e.x, e.y, '#fde68a', 12, 4);
      }
    });
    // Visual
    this.particles.push({ type:'holy_cross', x: p.x, y: p.y, w: beamW, len: beamLen, color:'#fde68a', life: 1.5, maxLife: 1.5 });
    for (let i = 0; i < 25; i++) {
      const a = Math.random()*Math.PI*2; const d = Math.random()*beamLen;
      this.spawnParticle(p.x+Math.cos(a)*d, p.y+Math.sin(a)*d, '#fde68a', 12, 1.5);
    }
  }

  fireLichArmy(dmg, lv) {
    const p = this.player;
    this.addFloat(p.x, p.y - 60, '💀 LICH ARMY!', '#94a3b8');
    this.screenShake(18, 0.8);
    // Spawn gorgeous glowing lich laser beams sweeping toward center!
    const laserRadius = 450; // capped at 450px
    const angles = [0, Math.PI / 4, Math.PI / 2, Math.PI * 3/4, Math.PI, Math.PI * 5/4, Math.PI * 3/2, Math.PI * 7/4];
    angles.forEach((a, i) => {
      setTimeout(() => {
        if (!this.running) return;
        const sx = p.x + Math.cos(a) * Math.min(laserRadius, 350);
        const sy = p.y + Math.sin(a) * Math.min(laserRadius, 350);
        
        // Spawn thick laser visual particle!
        this.particles.push({
          type: 'magic_beam', x: sx, y: sy, tx: p.x, ty: p.y,
          w: 12 + lv * 2, color: '#c084fc', life: 0.45, maxLife: 0.45
        });
        
        // Accurate line-segment laser physics collision!
        this.enemies.forEach(e => {
          if (e.hp <= 0) return;
          const distToLine = distToSegment(e.x, e.y, sx, sy, p.x, p.y);
          if (distToLine < e.r + (12 + lv * 2)) {
            this.dealDamage(e, dmg * 0.7);
            this.spawnParticles(e.x, e.y, '#6d28d9', 5, 2);
          }
        });
        
        this.spawnParticles(sx, sy, '#6d28d9', 15, 5);
      }, i * 180);
    });
  }

  fireGraveWrath(dmg, lv) {
    const p = this.player;
    this.addFloat(p.x, p.y - 60, '🌿 GRAVE WRATH!', '#86efac');
    this.screenShake(20, 0.9);
    // Roots spawn NEAR PLAYER (not all over world map)
    const rootCount = Math.min(15, 8 + lv * 2);
    const spawnRange = Math.min(450, (250 + lv * 25) * p.aoeMult);
    for (let i = 0; i < rootCount; i++) {
      const angle = (i / rootCount) * Math.PI * 2 + Math.random() * 0.5;
      const dist = spawnRange * (0.3 + Math.random() * 0.7);
      const rx = p.x + Math.cos(angle) * dist;
      const ry = p.y + Math.sin(angle) * dist;
      setTimeout(() => {
        if (!this.running) return;
        this.enemies.forEach(e => {
          if (Math.hypot(e.x - rx, e.y - ry) < 90) {
            this.dealDamage(e, dmg * 0.4);
            e.stunUntil = Date.now() + 1800;
            e.poisonDmg = dmg * 0.12;
            e.poisonUntil = Date.now() + 4000;
            this.spawnParticles(e.x, e.y, '#86efac', 8, 3);
          }
        });
        this.particles.push({ type:'root', x: rx, y: ry, color:'#22c55e', life: 1.2, maxLife: 1.2 });
        this.spawnParticles(rx, ry, '#4ade80', 5, 2);
      }, i * 100);
    }
  }

  // ──────────────────────────────────────────────
  // COMBAT
  // ──────────────────────────────────────────────
  dealDamage(enemy, rawDmg) {
    if (!enemy || enemy.hp <= 0) return 0;
    const armorReduction = enemy.armor || 0;
    let dmg = rawDmg * (1 - armorReduction);
    const isCrit = Math.random() < this.player.critChance;
    if (isCrit) dmg *= 2;
    dmg = Math.max(1, Math.round(dmg));
    enemy.hp -= dmg;
    enemy.lastHitTime = Date.now(); // Enable quái vật hit flash!
    this.addFloat(enemy.x, enemy.y - enemy.r, isCrit ? `💥${dmg}` : `${dmg}`, isCrit ? '#fbbf24' : '#f87171', isCrit);

    // Spawn hit sprite-sheet animation on enemy
    this.spawnFrameAnimation('magic_blast', enemy.x, enemy.y, enemy.r * 1.5);
    // Spawn impact particles (Z-axis sparks/blood)
    this.spawnParticles(enemy.x, enemy.y, enemy.color || '#f87171', 5, 2.6);

    // Screen Shake on impact
    if (isCrit) {
      this.screenShake(enemy.isBoss ? 12 : enemy.isElite ? 8 : 5, 0.15);
    } else if (enemy.isBoss) {
      this.screenShake(4, 0.10);
    }

    // Lifesteal
    if (this.player.lifesteal > 0) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + dmg * this.player.lifesteal);
    }

    // Thorns (armor item)
    if (this.save.equipped.armor && this.save.equipped.armor.bonus.thorns) {
      enemy.hp -= rawDmg * (this.save.equipped.armor.bonus.thorns / 100);
    }

    if (enemy.hp <= 0) this.killEnemy(enemy);
    return dmg;
  }

  killEnemy(enemy) {
    enemy.hp = 0;
    
    // Death Tarot explode & heal
    if (this.activeArcanas.has('arcana_death')) {
      const p = this.player;
      p.hp = Math.min(p.maxHp, p.hp + 3);
      if (Math.random() < 0.30) {
        this.aoeExplosion(enemy.x, enemy.y, 120, 200 * p.dmgMult, '#ef4444');
      }
    }
    
    const luckLv = (this.save && this.save.powerups && this.save.powerups.luck) || 0;
    const extraChance = luckLv * 0.05;
    
    // Determine gold drop chance
    let goldDropChance = 1.0;
    if (!enemy.isBoss && !enemy.isElite) {
      if (enemy.type === 'slime') {
        goldDropChance = 0.35 + extraChance;
      } else if (enemy.type === 'goblin') {
        goldDropChance = 0.40 + extraChance;
      } else if (enemy.type === 'knight') {
        goldDropChance = 0.50 + extraChance;
      } else {
        goldDropChance = 0.40 + extraChance;
      }
    }
    
    const shouldDropGold = Math.random() < goldDropChance;
    let baseGold = enemy.gold || 1;
    if (enemy.isBoss) {
      baseGold = Math.round(baseGold * 1.5); // Increase Boss gold drop by 50%
    }
    
    const goldEarned = Math.round(baseGold * this.player.goldBonus);
    const xpEarned   = enemy.xp || 3;
    this.totalKills++;
    // ★ Count kills for rescue missions
    if (this.merchantRescueActive && this.currentRescueMission && this.currentRescueMission.type === 'kill_count') {
      this.merchantRescueKillCount = (this.merchantRescueKillCount || 0) + 1;
      // Update HUD pill with kill progress
      const rescueEl = document.getElementById('pveRescueNum');
      if (rescueEl) {
        const m = this.currentRescueMission;
        rescueEl.textContent = `${m.title} ${this.merchantRescueKillCount}/${m.target}`;
      }
    }
    this.spawnParticles(enemy.x, enemy.y, enemy.color || '#fff', 10, 4);
    
    // Drop gold orb
    if (shouldDropGold) {
      const angleG = Math.random() * Math.PI * 2;
      const speedG = 50 + Math.random() * 70;
      this.particles.push({
        type: 'gold_orb', x: enemy.x, y: enemy.y,
        vx: Math.cos(angleG) * speedG,
        vy: Math.sin(angleG) * speedG,
        r: enemy.isBoss ? 9 : 6, color: '#fbbf24', value: goldEarned,
        life: 35, maxLife: 35, glow: true,
      });
    }

    // 1. Calculate Gem Drop Chance influenced by Luck
    const dropChance = Math.min(1.0, 0.85 + luckLv * 0.05); // +5% chance per Luck level, base 85%
    const shouldDropGem = Math.random() < dropChance;

    if (shouldDropGem) {
      // Helper function to spawn dynamic diamond gems
      const spawnGem = (xVal, col, sz, speed = null) => {
        const a = Math.random() * Math.PI * 2;
        const s = speed ?? (45 + Math.random() * 65);
        this.particles.push({
          type: 'xp_orb',
          // New Colors: Small (Green): max 2 XP; Medium (Blue): max 9 XP; Large (Purple): > 9 XP
          gemTier: xVal <= 2 ? 'small' : xVal <= 9 ? 'medium' : 'large',
          x: enemy.x + (Math.random() - 0.5) * 20,
          y: enemy.y + (Math.random() - 0.5) * 20,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          r: sz, color: col, value: xVal,
          life: 40, maxLife: 40, glow: true,
          pulse: Math.random() * Math.PI * 2, // phase for pulsing animation
        });
      };

      if (enemy.isBoss) {
        // Boss: Drop high value Gems (Gold/Purple) + Small green gems
        spawnGem(Math.round(xpEarned * 0.5), '#fbbf24', 10); // boss gem vàng lớn
        spawnGem(Math.round(xpEarned * 0.3), '#c084fc', 8);  // Tím lớn
        spawnGem(Math.round(xpEarned * 0.2), '#38bdf8', 6);  // Xanh dương trung bình
        for (let i = 0; i < 5; i++) spawnGem(2, '#4ade80', 4); // Xanh lá nhỏ
      } else if (xpEarned > 9) {
        // Elite/High XP: Purple gem + Blue gem
        spawnGem(Math.round(xpEarned * 0.7), '#c084fc', 8); // Tím lớn (>9 XP)
        spawnGem(Math.round(xpEarned * 0.3), '#38bdf8', 5); // Xanh dương trung bình
      } else if (xpEarned > 2) {
        // Medium: Blue gem
        spawnGem(xpEarned, '#38bdf8', 6); // Xanh dương (<=9 XP)
      } else {
        // Small: Green gem
        spawnGem(xpEarned, '#4ade80', 4); // Xanh lá (<=2 XP)
      }

      // 2. Limit PVE XP gems to 400. Gather furthest overflow gems into a beautiful Red Accumulator Gem
      let xpOrbs = this.particles.filter(p => p.type === 'xp_orb');
      while (xpOrbs.length > 400) {
        // Find furthest gem from player
        let maxDistSq = -1;
        let furthestGem = null;
        xpOrbs.forEach(gem => {
          if (gem.isAccumulator) return; // Don't delete the accumulator itself
          const dx = gem.x - this.player.x;
          const dy = gem.y - this.player.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > maxDistSq) {
            maxDistSq = distSq;
            furthestGem = gem;
          }
        });

        if (furthestGem) {
          // Find if an accumulator gem already exists
          let accumGem = xpOrbs.find(gem => gem.isAccumulator);
          if (accumGem) {
            // Accumulate XP into the existing one and delete furthest
            accumGem.value += furthestGem.value;
            const idx = this.particles.indexOf(furthestGem);
            if (idx !== -1) this.particles.splice(idx, 1);
          } else {
            // Upgrade furthest gem into a glorious Red/Purple Accumulator Gem
            furthestGem.isAccumulator = true;
            furthestGem.color = '#ef4444'; // Red Gem
            furthestGem.r = 11; // Large size
            furthestGem.gemTier = 'red_accum';
          }
        }
        // Refresh filter for loop condition
        xpOrbs = this.particles.filter(p => p.type === 'xp_orb');
      }
    }


    // Check boss death
    if (enemy.isBoss) {
      this.spawnBossChest(enemy.x, enemy.y);
      this.bossActive = false;

            // Tử Thần bị giết → VICTORY!
      if (enemy.type === 'boss_death_reaper' && !enemy._isDeathClone) {
        this.spawnParticles(enemy.x, enemy.y, '#fbbf24', 80, 10);
        this.spawnParticles(enemy.x, enemy.y, '#a78bfa', 60, 8);
        this.screenShake(40, 3.0);
        showToast('🏆 TỬ THẦN ĐÃ BỊ TIÊU DIỆT! CHIẾN THẮNG!', '#fbbf24');
        setTimeout(() => this.victory(), 2000);
      }
    }

    // Slime King Jr: phân tách thành 2 slime khi chết
    if (enemy._splitter) {
      for (let s = 0; s < 2; s++) {
        const angle = (s / 2) * Math.PI * 2 + Math.random() * 0.5;
        this.spawnEnemy('slime', enemy.x + Math.cos(angle) * 35, enemy.y + Math.sin(angle) * 35, 0.5, false);
      }
    }
  }


  // Tính XP cần cho lần lên cấp tiếp theo dựa theo cấp hiện tại
  getXpToNext(level) {
    if (level === 1) return 5;
    if (level >= 2 && level <= 19) {
      return 5 + (level - 1) * 10;
    }
    if (level === 20) {
      return 600; // Checkpoint
    }
    if (level >= 21 && level <= 39) {
      return 195 + (level - 20) * 13;
    }
    if (level === 40) {
      return 2400; // Checkpoint
    }
    if (level >= 41) {
      const base40 = 195 + 20 * 13; // 455
      return base40 + (level - 40) * 16;
    }
    return 1000;
  }

  gainXp(amount) {
    const p = this.player;
    // Áp dụng Growth multiplier (powerup + Crown passive + milestone bonus)
    const growthBoost = p.xpGainMult || 1.0;
    const crownBonus  = this._crownXpBonus || 0; // từ Crown passive item
    let petXpMult = 1.0;
    if (this.save && this.save.activePet === 'owl') {
      petXpMult = 1.15;
    }
    const finalAmount = Math.round(amount * growthBoost * (1 + crownBonus) * petXpMult);

    p.xp += finalAmount;
    while (p.xp >= p.xpToNext) {
      p.xp -= p.xpToNext;
      p.level++;
      p.xpToNext = this.getXpToNext(p.level);
      this.onLevelUp();
    }
  }

  onLevelUp() {
    const p = this.player;

    // Remove milestone 20 buff when leaving Level 20 (i.e. leveling up to 21)
    if (p.hasMilestone20Buff && p.level !== 20) {
      p.xpGainMult /= 2.0;
      p.hasMilestone20Buff = false;
      showToast(`⭐ Hết hiệu ứng x2 XP Milestone 20`, '#94a3b8');
    }
    // Remove milestone 40 buff when leaving Level 40 (i.e. leveling up to 41)
    if (p.hasMilestone40Buff && p.level !== 40) {
      p.xpGainMult /= 2.0;
      p.hasMilestone40Buff = false;
      showToast(`⭐ Hết hiệu ứng x2 XP Milestone 40`, '#94a3b8');
    }

    // Milestone level 20 & 40: thưởng +100% Growth tạm thời
    if (p.level === 20) {
      p.xpGainMult = (p.xpGainMult || 1.0) * 2.0; // +100% Growth
      p.hasMilestone20Buff = true;
      this.addFloat(p.x, p.y - 90, `🌟 MILESTONE Lv.20! +100% GROWTH!`, '#fbbf24', true);
      this.spawnParticles(p.x, p.y, '#fbbf24', 50, 10);
      this.screenShake(15, 0.5);
      showToast(`⭐ MILESTONE 20! XP nhận được x2!`, '#fbbf24');
    } else if (p.level === 40) {
      p.xpGainMult = (p.xpGainMult || 1.0) * 2.0; // +100% Growth
      p.hasMilestone40Buff = true;
      this.addFloat(p.x, p.y - 90, `🌟 MILESTONE Lv.40! +100% GROWTH!`, '#fbbf24', true);
      this.spawnParticles(p.x, p.y, '#fbbf24', 50, 10);
      this.screenShake(15, 0.5);
      showToast(`⭐ MILESTONE 40! XP nhận được x2!`, '#fbbf24');
    } else {
      this.addFloat(p.x, p.y - 50, `⬆️ LEVEL ${p.level}!`, '#a78bfa', true);
      this.spawnParticles(p.x, p.y, '#a78bfa', 25, 6);
    }

    this.pause();
    this.showUpgradeChoice(() => {
      this.resume();
    });
  }


  emitSlash(x, y, angle, r, color, type) {
    this.slashEffects.push({
      x, y, angle, r, color, type, life: 1.0, alpha: 1.0
    });
  }

  updateSlashEffects(dt) {
    for (let i = this.slashEffects.length - 1; i >= 0; i--) {
      const s = this.slashEffects[i];
      s.life -= dt * 5.0; // Decay life over ~200ms
      s.alpha = Math.max(0, s.life);
      if (s.alpha <= 0) {
        this.slashEffects.splice(i, 1);
      }
    }
  }

  drawSlashEffects(ctx) {
    this.slashEffects.forEach(s => {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.lineCap = 'round';

      if (s.type === 'assassin_slash') {
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.95)';
        ctx.shadowColor = '#d946ef'; ctx.shadowBlur = 20;
        ctx.lineWidth = s.r * 0.35;
        ctx.beginPath(); ctx.arc(0,0,s.r*0.95,-Math.PI*.4,Math.PI*.4); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = s.r * 0.15; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(0,0,s.r*0.95,-Math.PI*.25,Math.PI*.25); ctx.stroke();
      } else if (s.type === 'fighter_slash') {
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.95)';
        ctx.shadowColor = '#eab308'; ctx.shadowBlur = 24;
        ctx.lineWidth = s.r * 0.7;
        ctx.beginPath(); ctx.arc(0,0,s.r*0.85,-Math.PI*.65,Math.PI*.65); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = s.r * 0.35; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(0,0,s.r*0.85,-Math.PI*.5,Math.PI*.5); ctx.stroke();
      } else if (s.type === 'mage_slash') {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.95)';
        ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 18;
        ctx.lineWidth = s.r * 0.45;
        ctx.beginPath(); ctx.arc(0,0,s.r*0.9,-Math.PI*.55,Math.PI*.55); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = s.r * 0.22; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(0,0,s.r*0.9,-Math.PI*.4,Math.PI*.4); ctx.stroke();
      } else {
        ctx.shadowColor = '#fff'; ctx.shadowBlur = 16;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = s.r * 0.5;
        ctx.beginPath(); ctx.arc(0,0,s.r*0.9,-Math.PI*.5,Math.PI*.5); ctx.stroke();
        ctx.strokeStyle = s.color; ctx.lineWidth = s.r * 0.25; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(0,0,s.r*0.9,-Math.PI*.35,Math.PI*.35); ctx.stroke();
      }

      ctx.globalAlpha = s.alpha * 0.5;
      ctx.strokeStyle='#fffbeb'; ctx.lineWidth=2;
      [-s.r*.3,-s.r*.05,s.r*.25].forEach(offset=>{
        ctx.beginPath();ctx.moveTo(offset-s.r*.4,-s.r*.8);ctx.lineTo(offset+s.r*.4,s.r*.8);ctx.stroke();
      });
      ctx.restore();
    });
  }

  takeDamage(amt, sourceType = null) {
    const p = this.player;
    const now = Date.now();
    // Invuln checks
    if (p.invincible) return;
    if (p.invulnUntil && now < p.invulnUntil) return;
    if (p.invincibleUntil && now < p.invincibleUntil) return;
    
    // ── I-FRAMES SYSTEM ──────────────────────────────────────
    // Kiểm tra xem nguồn damage có thể bypass I-frames không
    const bypassIFrames = sourceType && BOSS_PIERCE_IFRAMES.includes(sourceType);
    if (!bypassIFrames && p.iFrameUntil && now < p.iFrameUntil) return;
    // Áp dụng I-frames (600ms sau khi nhận hit)
    if (!bypassIFrames) {
      p.iFrameUntil = now + I_FRAME_DURATION_MS;
    }
    
    // ── RED DEATH ONE-HIT-KILL ────────────────────────────────
    if (sourceType === 'boss_death_reaper') {
      // Soul Aegis block (hidden item)
      if (p.hasSoulAegis && !p.soulAegisUsed) {
        p.soulAegisUsed = true;
        p.invincibleUntil = now + 3000;
        p.hp = Math.max(1, Math.round(p.maxHp * 0.01)); // còn lại 1% HP
        this.addFloat(p.x, p.y - 70, '✨ LINH HỒN BẢO VỆ BẠN!', '#fbbf24', true);
        this.addFloat(p.x, p.y - 95, '💫 Soul Aegis kích hoạt!', '#a855f7', true);
        this.spawnParticles(p.x, p.y, '#fbbf24', 40, 8);
        this.screenShake(20, 1.0);
        return;
      }
      // One-Hit-Kill không thể tránh
      this.gameOver();
      return;
    }
    
    // Tarot The Fool complete dodge check
    if (this.activeArcanas.has('arcana_the_fool') && Math.random() < 0.20) {
      this.addFloat(p.x, p.y - 45, '🃏 NÉ TRÁNH (The Fool)!', '#c084fc');
      this.spawnParticles(p.x, p.y, '#c084fc', 8, 2);
      return;
    }
    // Morph damage reduction
    if (p.isMorphed) amt *= 0.5;
    
    // Titan counter
    if (p.titanCounterUntil && Date.now() < p.titanCounterUntil) {
      this.aoeExplosion(p.x, p.y, 150, amt * 2, '#f97316');
      return;
    }
    // Aegis Smash reflection
    if (p.aegisReflectUntil && Date.now() < p.aegisReflectUntil) {
      this.aoeExplosion(p.x, p.y, 180, amt * 2.5, '#facc15');
      this.addFloat(p.x, p.y - 45, `🛡️ Phản đòn: ${Math.round(amt * 2.5)}!`, '#facc15');
      return;
    }
    // Shield first
    if (p.shieldHp > 0) {
      const absorb = Math.min(p.shieldHp, amt);
      p.shieldHp -= absorb;
      amt -= absorb;
      this.spawnParticle(p.x, p.y, '#94a3b8', 10, 0.4);
    }
    if (amt <= 0) return;
    
    // ── ARMOR FLAT REDUCTION ────────────────────────────────
    // 1 điểm giáp = -1 dmg, tối thiểu 1 dmg
    if (p.flatArmor && p.flatArmor > 0) {
      amt = Math.max(1, amt - p.flatArmor);
    }
    
    p.hp -= amt;
    this.addFloat(p.x, p.y - 30, `-${Math.round(amt)}`, '#f87171');
    this.spawnParticles(p.x, p.y, '#ef4444', 8, 2);
    cp && (cp.lastHit = now); // update lastHit for hit flash

    // Arcana Grace check
    if (this.activeArcanas.has('arcana_grace') && p.hp / p.maxHp < 0.3 && p.hp > 0) {
      if (!this.lastGraceTriggered || Date.now() - this.lastGraceTriggered > 60000) {
        this.lastGraceTriggered = Date.now();
        p.invincible = true;
        p.invincibleUntil = Date.now() + 3000;
        this.addFloat(p.x, p.y - 65, '👼 ARCANA GRACE: BẤT TỬ 3S!', '#fbbf24', true);
        this.spawnParticles(p.x, p.y, '#38bdf8', 35, 6);
      }
    }

    if (p.hp <= 0) {
      p.hp = 0;
      // Kiểm tra revive (nhiều lần hồi sinh)
      const canRevive = p.reviveCount > 0 || (p.revive && !p.reviveUsed);
      if (canRevive) {
        if (p.reviveCount > 0) {
          p.reviveCount--;
        } else {
          p.reviveUsed = true;
        }
        p.hp = p.maxHp * 0.5;
        p.invincible = true; p.invincibleUntil = Date.now() + 2000;
        p.iFrameUntil = Date.now() + 2000;
        this.addFloat(p.x, p.y - 60, `🔥 REVIVE! (${p.reviveCount} còn lại)`, '#f97316', true);
        this.spawnParticles(p.x, p.y, '#f97316', 30, 8);
      } else {
        this.gameOver();
      }
    }
  }


  // ──────────────────────────────────────────────
  // PROJECTILES
  // ──────────────────────────────────────────────
  spawnProjectile(cfg) {
    this.projectiles.push({
      x: cfg.x, y: cfg.y,
      vx: Math.cos(cfg.angle) * cfg.speed,
      vy: Math.sin(cfg.angle) * cfg.speed,
      angle: cfg.angle,
      dmg: cfg.dmg, radius: cfg.radius || 8,
      color: cfg.color || '#fff',
      trail: cfg.trail || false,
      trailColor: cfg.trailColor || cfg.color || '#fff',
      pierce: cfg.pierce || false,
      maxPierces: cfg.maxPierces || 1, pierced: 0,
      maxDist: cfg.maxDist || 1200, traveled: 0,
      aoeRadius: cfg.aoeRadius || 0,
      onHit: cfg.onHit || null,
      onDestroy: cfg.onDestroy || null,
      isVoidReaver: cfg.isVoidReaver || false,
      angleBase: cfg.angleBase || 0,
      angleOffset: cfg.angleOffset || 0,
      radiusOffset: cfg.radiusOffset || 0,
      trailParticles: [],
      life: cfg.life || 99,
      isArrow: cfg.isArrow || false,
    });
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life -= dt;
      if (proj.life <= 0) {
        if (proj.onDestroy) proj.onDestroy(proj.x, proj.y);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Orbit movement for Void Reaver blades
      if (proj.isVoidReaver) {
        proj.angleOffset = (proj.angleOffset || 0) + dt * 6.0;
        proj.radiusOffset = (proj.radiusOffset || 40) + dt * 260.0;
        const p = this.player;
        proj.x = p.x + Math.cos(proj.angleBase + proj.angleOffset) * proj.radiusOffset;
        proj.y = p.y + Math.sin(proj.angleBase + proj.angleOffset) * proj.radiusOffset;
        proj.vx = 0;
        proj.vy = 0;
        proj.traveled += dt * 260.0;
      }

      const dx = proj.vx * dt, dy = proj.vy * dt;
      proj.x += dx; proj.y += dy;
      proj.traveled += Math.sqrt(dx * dx + dy * dy);

      // Trail particles
      if (proj.trail && Math.random() < 0.6) {
        this.spawnParticle(proj.x, proj.y, proj.trailColor, proj.radius * 0.8, 0.25);
      }

      // Blocked by static obstacles
      if (proj.isEnemyProjectile) {
        let blocked = false;
        if (this.staticObstacles) {
          for (let j = 0; j < this.staticObstacles.length; j++) {
            const obs = this.staticObstacles[j];
            const odx = proj.x - obs.x;
            const ody = proj.y - obs.y;
            const distSq = odx * odx + ody * ody;
            const minDist = proj.radius + obs.r * 0.7; // 2.5D overlap margin
            if (distSq < minDist * minDist) {
              blocked = true;
              break;
            }
          }
        }
        if (blocked) {
          this.spawnParticles(proj.x, proj.y, '#94a3b8', 4, 1.2);
          if (proj.onDestroy) proj.onDestroy(proj.x, proj.y);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Out of bounds
      if (proj.x < 0 || proj.x > WORLD_W || proj.y < 0 || proj.y > WORLD_H || proj.traveled > proj.maxDist) {
        // Wall Bounce Arcana check
        if (this.activeArcanas.has('arcana_bounce') && (!proj.bounces || proj.bounces < 2) && proj.traveled <= proj.maxDist) {
          proj.bounces = (proj.bounces || 0) + 1;
          if (proj.x < 0 || proj.x > WORLD_W) {
            proj.vx *= -1;
            proj.x = Math.max(0, Math.min(WORLD_W, proj.x));
          }
          if (proj.y < 0 || proj.y > WORLD_H) {
            proj.vy *= -1;
            proj.y = Math.max(0, Math.min(WORLD_H, proj.y));
          }
          proj.angle = Math.atan2(proj.vy, proj.vx);
          this.spawnParticles(proj.x, proj.y, proj.color, 4, 1.5);
          continue;
        }
        if (proj.aoeRadius > 0) this.aoeExplosion(proj.x, proj.y, proj.aoeRadius, proj.dmg * 0.5, proj.color);
        if (proj.onDestroy) proj.onDestroy(proj.x, proj.y);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Hit detection
      if (proj.isEnemyProjectile) continue; // Skip enemy hit detection for enemy projectiles!
      let hitOccurred = false;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (e.hp <= 0) continue;
        const pdx = proj.x - e.x;
        const pdy = proj.y - e.y;
        const minDist = proj.radius + e.r;
        if (pdx * pdx + pdy * pdy < minDist * minDist) {
          this.dealDamage(e, proj.dmg);
          if (proj.onHit) proj.onHit(e.x, e.y, e);
          if (proj.aoeRadius > 0) { this.aoeExplosion(e.x, e.y, proj.aoeRadius, proj.dmg * 0.5, proj.color); }
          proj.pierced++;
          hitOccurred = true;

          // Spawn impact shockwave ring particle!
          this.particles.push({
            type: 'ring',
            x: proj.x, y: proj.y,
            r: proj.radius,
            maxR: proj.radius * 3.5,
            color: proj.color || '#ffffff',
            life: 0.18, maxLife: 0.18
          });

          // Enemy Bounce Arcana check
          if (this.activeArcanas.has('arcana_bounce') && (!proj.bounces || proj.bounces < 2)) {
            proj.bounces = (proj.bounces || 0) + 1;
            const nextEnemy = this.findNearestEnemyExclude(proj.x, proj.y, [e]);
            if (nextEnemy) {
              const speed = Math.hypot(proj.vx, proj.vy) || 400;
              const angle = Math.atan2(nextEnemy.y - proj.y, nextEnemy.x - proj.x);
              proj.vx = Math.cos(angle) * speed;
              proj.vy = Math.sin(angle) * speed;
              proj.angle = angle;
              proj.pierced = 0; // Reset pierce count
              this.spawnParticles(proj.x, proj.y, proj.color, 4, 1.5);
              continue;
            }
          }

          if (!proj.pierce || proj.pierced >= proj.maxPierces) {
            if (proj.onDestroy) proj.onDestroy(proj.x, proj.y);
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  aoeExplosion(x, y, r, dmg, color) {
    const rSq = r * r;
    this.enemies.forEach(e => {
      if (e.hp <= 0) return;
      const edx = e.x - x;
      const edy = e.y - y;
      if (edx * edx + edy * edy < rSq) this.dealDamage(e, dmg);
    });

    // Damage static obstacles
    if (this.staticObstacles) {
      for (let j = this.staticObstacles.length - 1; j >= 0; j--) {
        const obs = this.staticObstacles[j];
        const odx = obs.x - x;
        const ody = obs.y - y;
        if (odx * odx + ody * ody < rSq) {
          obs.hp -= dmg * 0.4;
          if (obs.hp <= 0) {
            this.destroyObstacle(obs, j);
          }
        }
      }
    }

    this.spawnParticles(x, y, color, 20, 5);
    this.particles.push({ type:'ring', x, y, r: 0, maxR: r, color, life: 0.4, maxLife: 0.4 });
  }

  // ──────────────────────────────────────────────
  // ENEMIES
  // ──────────────────────────────────────────────
  // spawnWave() đã được thay bởi time-based batch spawning trong updateWave().
  // Giữ lại để tránh lỗi nếu vẫn còn code cũ gọi tới.
  spawnWave(waveNum) {
    // Legacy no-op — time-based spawning now handled in updateWave()
    console.log('[PVE] spawnWave() called (legacy) — ignored, using time-based spawning.');
  }

  spawnEnemy(typeId, x, y, hpMult = 1, isElite = false, dmgMult = 1) {
    const def = ENEMY_TYPES[typeId];
    if (!def) return;

    // MAX ENEMIES CAP: khi quái thường đã đầy, không spawn thêm (boss vẫn spawn)
    if (!def.isBoss) {
      const nonBossCount = this.enemies.filter(e => !e.isBoss).length;
      if (nonBossCount >= MAX_ENEMIES_ON_SCREEN) return;
    }

    if (def.isBoss) {
      const discoveredBosses = (savedData && savedData.discovered && savedData.discovered.bosses) || [];
      const firstEncounter = !discoveredBosses.includes(typeId);
      discoverItem('bosses', typeId);
      if (firstEncounter) {
        this.triggerBossEncounter(typeId);
      }
    }

    // Boss scaling: dùng hpMult/dmgMult từ getWaveScaling trực tiếp (không x 1+wave*0.06)
    const isBoss = !!def.isBoss;
    let hpScale  = isBoss ? hpMult : hpMult * (1 + this.wave * 0.04) * (isElite ? 3.0 : 1);
    let dmgScale = isBoss ? dmgMult : dmgMult * (1 + this.wave * 0.03) * (isElite ? 1.6 : 1);
    if (this.lastRunGhostActive) {
      hpScale *= 1.1;
      dmgScale *= 1.1;
    }
    const speedScale = isElite ? 1.2 : 1;
    const rScale     = isElite ? 1.35 : 1;

    this.enemies.push({
      type: typeId,
      x: Math.max(50, Math.min(WORLD_W-50, x)),
      y: Math.max(50, Math.min(WORLD_H-50, y)),
      r: def.radius * rScale,
      hp: Math.round(def.hp * hpScale), maxHp: Math.round(def.hp * hpScale),
      dmg: def.dmg * dmgScale,
      speed: def.speed * speedScale,
      color: isElite ? '#c084fc' : (isBoss ? def.color : def.color),
      armor: def.armor || 0,
      gold: def.gold * (isElite ? 5 : 1), xp: def.xp * (isElite ? 4 : 1),
      isBoss,
      isElite: !!isElite,
      ranged: !!def.ranged, range: def.range || 0,
      stealth: def.stealth || 0,
      summons: !!def.summons,
      fireBreath: !!def.fireBreath,
      enrageThreshold: def.enrage || 0,
      phases: def._phases || null,
      emoji: def.emoji,
      name: def.name,
      // State
      stunUntil: 0, slow: 0, slowUntil: 0,
      poisonDmg: 0, poisonUntil: 0,
      lastAttack: 0, lastRangedAttack: 0, lastSummon: 0,
      phase: 1,
      _phasesTriggered: new Set(),
    });
    // Trả về enemy vừa spawn (cần thiết cho Soul Harvest, Dragon Dive v.v.)
    return this.enemies[this.enemies.length - 1];
  }

  // ── Red Death: Spawn shadow decoy clones ────────────────────
  // Clones là quái giả — trông giống Red Death nhưng không gây OHK
  // Chỉ 1 cái thật có e._isRealReaper = true
  _spawnDeathClones(reaper, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 100;
      const clone = {
        type: 'boss_death_reaper',
        x: reaper.x + Math.cos(angle) * dist,
        y: reaper.y + Math.sin(angle) * dist,
        r: reaper.r * 0.85,
        hp: reaper.maxHp * 0.1, maxHp: reaper.maxHp * 0.1,
        dmg: reaper.dmg * 0.3, // clone gây dmg thường (không OHK)
        speed: reaper.speed * 0.9,
        color: '#1a1a2e',
        isBoss: true, isElite: false,
        ranged: false, stealth: 0, summons: false, fireBreath: false,
        enrageThreshold: 0, phases: null,
        stunUntil: 0, slow: 0, slowUntil: 0,
        poisonDmg: 0, poisonUntil: 0,
        lastAttack: 0, lastRangedAttack: 0, lastSummon: 0,
        phase: 1, _phasesTriggered: new Set(),
        gold: 0, xp: 0,
        name: '💀 Bóng Ma Tử Thần',
        emoji: '👻',
        _isDeathClone: true, // marker: đây là clone giả
        armor: 0,
        opacity: 0.7, // trong suốt hơn để phân biệt nếu nhìn kỹ
      };
      this.enemies.push(clone);
    }
  }



  updateEnemies(dt) {
    const now = Date.now();
    const p = this.player;
    
    // 1. Update each enemy (poison, stunned, primary movement, obstacle collision, ranged/melee attacks)
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.hp <= 0) { this.enemies.splice(i, 1); continue; }

      // Poison DoT
      if (now < e.poisonUntil && e.poisonDmg > 0) {
        const poisonMult = p.poisonDmgMult || 1.0;
        e.hp -= e.poisonDmg * poisonMult * dt;
        if (e.hp <= 0) { this.killEnemy(e); this.enemies.splice(i, 1); continue; }
        if (Math.random() < 0.3) this.spawnParticle(e.x + (Math.random()-0.5)*e.r, e.y + (Math.random()-0.5)*e.r, '#10b981', 5, 0.5);
      }

      if (now < e.stunUntil) continue; // Stunned, skip movement

      // Slow
      const slowFactor = (now < e.slowUntil) ? (1 - e.slow) : 1;

      // Enrage at low hp
      const speedMult = (e.enrageThreshold > 0 && e.hp / e.maxHp < e.enrageThreshold) ? 2.2 : 1;

      // Boss Phase transitions (rage speed boost, etc.)
      if (e.isBoss && e.phases && e._phasesTriggered) {
        const hpPct = e.hp / e.maxHp;
        for (const ph of e.phases) {
          const phKey = `${ph.hpPct}`;
          if (!e._phasesTriggered.has(phKey) && hpPct <= ph.hpPct) {
            e._phasesTriggered.add(phKey);
            if (ph.speed) e.speed = ph.speed;
            if (ph.rage || ph.enrage) {
              e.speed *= 1.5;
              this.addFloat(e.x, e.y - 60, `💢 ${e.name || 'BOSS'} CUỒNG NỘ!`, '#ef4444', true);
              this.screenShake(14, 0.5);
            }
          }
        }
      }

      // Target player or merchant
      let targetX = p.x;
      let targetY = p.y;
      let targetIsMerchant = false;
      
      if (this.merchantRescueActive && (e.isElite || Math.random() < 0.4)) {
        const distToPlayer = Math.hypot(p.x - e.x, p.y - e.y);
        const distToMerchant = Math.hypot(this.merchant.x - e.x, this.merchant.y - e.y);
        if (distToMerchant < distToPlayer || e.isElite) {
          targetX = this.merchant.x;
          targetY = this.merchant.y;
          targetIsMerchant = true;
        }
      }
      
      const dx = targetX - e.x, dy = targetY - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Night scale
      let nightDmgMult = 1.0;
      let nightSpdMult = 1.0;
      if (this.dayNightCycle === 'night' && (e.type === 'shadow' || e.type === 'necromancer' || e.type === 'slime' || e.type === 'goblin')) {
        nightDmgMult = 1.25;
        nightSpdMult = 1.20;
      }

      if (!e.ranged || dist > e.range) {
        const weatherSlow = this.currentWeather === 'blizzard' ? 0.70 : 1.0;
        
        let moveTargetX = targetX;
        let moveTargetY = targetY;
        
        // ── BOSS INTERCEPT MOVEMENT (Chặn đường player) ─────────
        // Boss không đi thẳng tới vị trí hiện tại mà DỰ ĐOÁN vị trí player
        if (e.isBoss && !targetIsMerchant) {
          const predTime = 0.4; // dự đoán 0.4s tương lai
          const pvx = p._vx || 0;
          const pvy = p._vy || 0;
          moveTargetX = p.x + pvx * predTime;
          moveTargetY = p.y + pvy * predTime;
          // Giữ trong world bounds
          moveTargetX = Math.max(e.r, Math.min(WORLD_W - e.r, moveTargetX));
          moveTargetY = Math.max(e.r, Math.min(WORLD_H - e.r, moveTargetY));
        }
        
        // ── BOSS DASH ATTACK (Lao nhanh tới player) ─────────────
        if (e.isBoss) {
          e._dashTimer = (e._dashTimer || 0) + dt;
          const dashCooldown = e.type === 'boss_death_reaper' ? 5 : e.type === 'boss_reaper_form1' ? 6 : 9;
          
          if (!e._dashWarning && !e.isDashing && e._dashTimer > dashCooldown && dist < 600 && dist > 80) {
            // Hiện warning indicator
            e._dashWarning = true;
            e._dashWarningUntil = now + 400; // 0.4s cảnh báo
            e._dashDir = { x: (moveTargetX - e.x) / dist, y: (moveTargetY - e.y) / dist };
          }
          
          if (e._dashWarning && now > e._dashWarningUntil) {
            // Bắt đầu dash
            e._dashWarning = false;
            e.isDashing = true;
            e._dashDuration = 0.45;
            e._dashVx = e._dashDir.x * e.speed * 3.5;
            e._dashVy = e._dashDir.y * e.speed * 3.5;
            e._dashTimer = 0;
          }
          
          if (e.isDashing) {
            e._dashDuration -= dt;
            e.x += e._dashVx * dt;
            e.y += e._dashVy * dt;
            if (e._dashDuration <= 0) e.isDashing = false;
          } else if (!e._dashWarning) {
            // Di chuyển bình thường với intercept
            const idx = moveTargetX - e.x, idy = moveTargetY - e.y;
            const iDist = Math.sqrt(idx * idx + idy * idy);
            if (iDist > 0) {
              const spd = e.speed * speedMult * slowFactor * nightSpdMult * weatherSlow * dt;
              e.x += (idx / iDist) * spd;
              e.y += (idy / iDist) * spd;
            }
          }
        } else {
          // Quái thường: di chuyển thẳng
          const spd = e.speed * speedMult * slowFactor * nightSpdMult * weatherSlow * dt;
          if (dist > 0) {
            e.x += (dx / dist) * spd;
            e.y += (dy / dist) * spd;
          }
        }
      }


      // Collision with 2.5D static obstacles (Enemies)
      if (this.staticObstacles) {
        this.staticObstacles.forEach(obs => {
          const odx = e.x - obs.x;
          const ody = e.y - obs.y;
          const oDistSq = odx * odx + ody * ody;
          const minODist = e.r + obs.r * 0.6; // 0.6 threshold for a smooth 2.5D overlap
          if (oDistSq < minODist * minODist) {
            const oDist = Math.sqrt(oDistSq);
            if (oDist > 0) {
              const overlap = minODist - oDist;
              e.x += (odx / oDist) * overlap;
              e.y += (ody / oDist) * overlap;
              
              // Wall Slam check
              const isPushed = (e.stunUntil > Date.now()) || (e.pushedTime && Date.now() - e.pushedTime < 800);
              if (isPushed) {
                this.triggerWallSlam(e, obs);
              }
            }
          }
        });
      }

      // Physics: Player-Enemy physical collision blocking (Optimized vector push)
      const pdx = e.x - p.x;
      const pdy = e.y - p.y;
      const pDistSq = pdx * pdx + pdy * pdy;
      const minPDist = p.r + e.r;
      if (pDistSq < minPDist * minPDist) {
        const pDist = Math.sqrt(pDistSq);
        if (pDist > 0) {
          const overlap = minPDist - pDist;
          const ratio = overlap / pDist;
          const pushX = pdx * ratio;
          const pushY = pdy * ratio;
          e.x += pushX * 0.6;
          e.y += pushY * 0.6;
          p.x -= pushX * 0.4;
          p.y -= pushY * 0.4;
          p.x = Math.max(p.r, Math.min(WORLD_W - p.r, p.x));
          p.y = Math.max(p.r, Math.min(WORLD_H - p.r, p.y));
        }
      }

      // Physics: Merchant-Enemy physical collision blocking
      if (this.merchantRescueActive) {
        const m = this.merchant;
        const mdx = e.x - m.x;
        const mdy = e.y - m.y;
        const mDistSq = mdx * mdx + mdy * mdy;
        const minMDist = m.r + e.r;
        if (mDistSq < minMDist * minMDist) {
          const mDist = Math.sqrt(mDistSq);
          if (mDist > 0) {
            const overlap = minMDist - mDist;
            const ratio = overlap / mDist;
            e.x += mdx * ratio * 0.8;
            e.y += mdy * ratio * 0.8;
          }
        }
      }

      // Ranged attack
      const rangedCd = e.isBoss ? (e.phase === 3 ? 1100 : e.phase === 2 ? 1650 : 2200) : 2200;
      if (e.ranged && dist < e.range && now - e.lastRangedAttack > rangedCd) {
        e.lastRangedAttack = now;
        e.attackAnim = { t: now, duration: 250 };
        const angle = Math.atan2(dy, dx);
        this.projectiles.push({
          x: e.x, y: e.y, vx: Math.cos(angle)*230, vy: Math.sin(angle)*230,
          angle: angle,
          dmg: e.dmg * nightDmgMult, radius: 8, color: e.color || '#f87171', trail: true, trailColor: e.color || '#f87171',
          isEnemyProjectile: true, pierce: false, maxPierces: 1, pierced: 0,
          maxDist: e.range + 80, traveled: 0, life: 99,
          targetMerchant: targetIsMerchant
        });
      }

      // Summons
      const summonCd = e.isBoss ? (e.phase === 3 ? 2500 : e.phase === 2 ? 3750 : 5000) : 5000;
      if (e.summons && now - e.lastSummon > summonCd) {
        e.lastSummon = now;
        e.attackAnim = { t: now, duration: 350 };
        for (let j = 0; j < 2; j++) this.spawnEnemy('slime', e.x + (Math.random()-0.5)*80, e.y + (Math.random()-0.5)*80);
      }

      // Fire breath
      const breathCd = e.isBoss ? (e.phase === 3 ? 1500 : e.phase === 2 ? 2250 : 3000) : 3000;
      if (e.fireBreath && dist < 300 && now - e.lastRangedAttack > breathCd) {
        e.lastRangedAttack = now;
        e.attackAnim = { t: now, duration: 400 };
        for (let f = 0; f < 5; f++) {
          const a = Math.atan2(dy, dx) + (f-2)*0.12;
          this.projectiles.push({
            x: e.x, y: e.y, vx: Math.cos(a)*250, vy: Math.sin(a)*250,
            angle: a,
            dmg: e.dmg * 0.6 * nightDmgMult, radius: 10, color: '#f97316', trail: true, trailColor: '#ef4444',
            isEnemyProjectile: true, pierce: true, maxPierces: 3, pierced: 0,
            maxDist: 300, traveled: 0, life: 99,
            targetMerchant: targetIsMerchant
          });
        }
      }

      // ── ĐẶC BIỆT: hành vi riêng theo loại quái mới ──────────
      // Bat: zigzag di chuyển lảo đảo
      if (e._zigzag) {
        e._zigzagTimer = (e._zigzagTimer || 0) + dt;
        if (e._zigzagTimer > 0.4) {
          e._zigzagTimer = 0;
          e._zigzagDir = (Math.random() - 0.5) * 2.0;
        }
        const perp = { x: -(dy / (dist || 1)), y: dx / (dist || 1) };
        e.x += perp.x * (e._zigzagDir || 0) * e.speed * dt * 0.5;
        e.y += perp.y * (e._zigzagDir || 0) * e.speed * dt * 0.5;
      }

      // Spider: poison on hit (handled in melee; mark for player poison)
      if (e._poison && dist < p.r + e.r + 5 && now - e.lastAttack > 800) {
        // Poison applied via melee hit below; just add flag for reference
      }

      // Vampire: lifesteal on melee hit
      if (e._lifesteal && dist < p.r + e.r + 20) {
        // handled in melee below
      }

      // Executioner / Hellhound: charge dash
      if (e._charge && !e.isCharging) {
        e._chargeTimer = (e._chargeTimer || 0) + dt;
        if (e._chargeTimer > 4.0 && dist < 380 && dist > 80) {
          e._chargeTimer = 0;
          e.isCharging = true;
          e._chargeDur = 0.45;
          e._chargeVx = (dx / dist) * e.speed * 5;
          e._chargeVy = (dy / dist) * e.speed * 5;
          this.addFloat(e.x, e.y - 30, '⚡ Lao tới!', e.color || '#ef4444');
          this.screenShake(5, 0.2);
        }
      }
      if (e.isCharging) {
        e._chargeDur -= dt;
        e.x += e._chargeVx * dt;
        e.y += e._chargeVy * dt;
        if (e._chargeDur <= 0) { e.isCharging = false; }
      }

      // Banshee: scream AoE every 5s
      if (e._scream) {
        e._screamTimer = (e._screamTimer || 0) + dt;
        if (e._screamTimer > 5.0 && dist < 500) {
          e._screamTimer = 0;
          e.attackAnim = { t: now, duration: 500 };
          this.aoeExplosion(e.x, e.y, 220, e.dmg * 0.8, '#f9a8d4');
          this.addFloat(e.x, e.y - 40, '😱 TIẾNG HÉT!', '#f9a8d4');
          this.screenShake(8, 0.3);
        }
      }

      // Ice Witch: freeze slow projectile
      if (e._freeze && dist < e.range && now - (e._lastFreeze||0) > 4000) {
        e._lastFreeze = now;
        e.attackAnim = { t: now, duration: 350 };
        const angle = Math.atan2(dy, dx);
        this.projectiles.push({
          x: e.x, y: e.y, vx: Math.cos(angle)*180, vy: Math.sin(angle)*180,
          angle, dmg: e.dmg * 0.5, radius: 12, color: '#7dd3fc', trail: true, trailColor: '#bae6fd',
          isEnemyProjectile: true, pierce: false, maxPierces: 1, pierced: 0,
          maxDist: e.range + 100, traveled: 0, life: 99,
          _freezeOnHit: true, _freezeDur: 1500
        });
      }

      // Golem: shockwave on stomp every 6s
      if (e.type === 'golem') {
        e._stompTimer = (e._stompTimer || 0) + dt;
        if (e._stompTimer > 6.0 && dist < 200) {
          e._stompTimer = 0;
          this.aoeExplosion(e.x, e.y, 180, e.dmg * 1.2, '#78350f');
          this.screenShake(12, 0.4);
          this.addFloat(e.x, e.y - 40, '🪨 GIẪM!', '#78350f');
        }
      }

      // Void Crawler: teleport behind player every 8s
      if (e._teleport) {
        e._teleTimer = (e._teleTimer || 0) + dt;
        if (e._teleTimer > 8.0 && dist > 200) {
          e._teleTimer = 0;
          const angle = Math.random() * Math.PI * 2;
          e.x = p.x + Math.cos(angle) * (p.r + e.r + 30);
          e.y = p.y + Math.sin(angle) * (p.r + e.r + 30);
          this.spawnParticles(e.x, e.y, '#312e81', 12, 3);
          this.addFloat(e.x, e.y - 40, '🌑 Dịch Chuyển!', '#818cf8');
        }
      }

      // Slime King Jr: splitter — when dies splits into 2 slimes (handled in killEnemy)

      // ══════════════════════════════════════════════════════════
      // ── KỸ NĂNG BOSS ĐẶC THÙ ─────────────────────────────────
      // ══════════════════════════════════════════════════════════
      if (e.isBoss) {
        // ── BOSS: SLIME KING — Jelly Slam ──────────────────────
        // Nhảy lên đập xuống AoE 200px, slow + spawn slime con
        if (e.type === 'boss_slime_king') {
          e._jellyTimer = (e._jellyTimer || 0) + dt;
          const jCd = e.phase >= 3 ? 5 : e.phase >= 2 ? 7 : 10;
          if (e._jellyTimer > jCd && dist < 350) {
            e._jellyTimer = 0;
            e.attackAnim = { t: now, duration: 800 };
            // AoE slam
            this.aoeExplosion(e.x, e.y, 220, e.dmg * 1.8, '#4ade80');
            this.screenShake(16, 0.6);
            this.addFloat(e.x, e.y - 60, '💚 JELLY SLAM!', '#4ade80', true);
            // Slow player nếu trong tầm
            if (dist < 220) {
              p.slowUntil = now + 2200;
              p.slow = 0.45;
              this.addFloat(p.x, p.y - 30, '🐌 Dính Nhầy!', '#4ade80');
            }
            // Spawn 4 slime con
            for (let s = 0; s < 4; s++) {
              const sAngle = (s / 4) * Math.PI * 2;
              this.spawnEnemy('slime', e.x + Math.cos(sAngle) * 80, e.y + Math.sin(sAngle) * 80);
            }
          }
        }

        // ── BOSS: DARK LORD — Shadow Barrage ───────────────────
        // 8 orb bóng tối quay xung quanh, đẩy ra ngoài mỗi vài giây
        if (e.type === 'boss_dark_lord') {
          e._barrageTimer = (e._barrageTimer || 0) + dt;
          const bCd = e.phase >= 3 ? 5 : e.phase >= 2 ? 7 : 10;
          if (e._barrageTimer > bCd) {
            e._barrageTimer = 0;
            e.attackAnim = { t: now, duration: 600 };
            this.addFloat(e.x, e.y - 60, '🌑 SHADOW BARRAGE!', '#818cf8', true);
            for (let b = 0; b < 8; b++) {
              const bAngle = (b / 8) * Math.PI * 2;
              this.projectiles.push({
                x: e.x, y: e.y,
                vx: Math.cos(bAngle) * 220, vy: Math.sin(bAngle) * 220,
                angle: bAngle,
                dmg: e.dmg * 0.7, radius: 11, color: '#818cf8',
                trail: true, trailColor: '#4c1d95',
                isEnemyProjectile: true, pierce: true, maxPierces: 5, pierced: 0,
                maxDist: 800, traveled: 0, life: 99
              });
            }
            this.screenShake(10, 0.3);
          }
        }

        // ── BOSS: DRAGON QUEEN — Dragon Dive ───────────────────
        // Biến mất 1s, đập xuống đúng vị trí player (unblockable trừ I-frames)
        if (e.type === 'boss_dragon_queen') {
          e._diveTimer = (e._diveTimer || 0) + dt;
          const dCd = e.phase >= 3 ? 7 : e.phase >= 2 ? 10 : 14;
          if (!e._isDiving && e._diveTimer > dCd && dist < 500) {
            e._diveTimer = 0;
            e._isDiving = true;
            e._diveTargetX = p.x;
            e._diveTargetY = p.y;
            e._diveDuration = 1.0;
            e._diveLanded = false;
            e.opacity = 0.15; // "bay lên" - mờ đi
            this.addFloat(e.x, e.y - 60, '🐉 DRAGON DIVE!', '#f97316', true);
            this.screenShake(12, 0.4);
          }
          if (e._isDiving) {
            e._diveDuration -= dt;
            if (e._diveDuration <= 0 && !e._diveLanded) {
              e._diveLanded = true;
              e.opacity = 1;
              e.x = e._diveTargetX;
              e.y = e._diveTargetY;
              // AoE cực mạnh khi hạ cánh
              this.aoeExplosion(e.x, e.y, 180, e.dmg * 3.0, '#f97316');
              this.screenShake(25, 1.0);
              this.spawnParticles(e.x, e.y, '#f97316', 30, 6);
              this.addFloat(e.x, e.y - 50, '💥 CRIT ×3!', '#ef4444', true);
              e._isDiving = false;
            }
          }
        }

        // ── BOSS: VOID TITAN — Singularity (kéo player) ────────
        // Tạo vùng hút kéo player vào center titan
        if (e.type === 'boss_void_titan') {
          e._singTimer = (e._singTimer || 0) + dt;
          const sCd = e.phase >= 3 ? 8 : e.phase >= 2 ? 11 : 16;
          if (!e._singActive && e._singTimer > sCd) {
            e._singTimer = 0;
            e._singActive = true;
            e._singDuration = 3.0; // kéo 3 giây
            this.addFloat(e.x, e.y - 70, '🌌 SINGULARITY!', '#7c3aed', true);
            this.screenShake(15, 0.5);
          }
          if (e._singActive) {
            e._singDuration -= dt;
            // Kéo player về phía boss
            const sdx = e.x - p.x, sdy = e.y - p.y;
            const sdist = Math.hypot(sdx, sdy);
            if (sdist > e.r + p.r + 10 && sdist < 500) {
              const pullStr = 180 * dt; // px/s
              p.x += (sdx / sdist) * pullStr;
              p.y += (sdy / sdist) * pullStr;
            }
            if (e._singDuration <= 0) e._singActive = false;
          }
        }

        // ── BOSS: DEATH HERALD — Soul Harvest ──────────────────
        // Triệu hồi 6 phantom stealth tốc độ cao
        if (e.type === 'boss_death_herald') {
          e._harvestTimer = (e._harvestTimer || 0) + dt;
          const hCd = e.phase >= 3 ? 8 : e.phase >= 2 ? 12 : 18;
          if (e._harvestTimer > hCd) {
            e._harvestTimer = 0;
            e.attackAnim = { t: now, duration: 600 };
            this.addFloat(e.x, e.y - 60, '👻 SOUL HARVEST!', '#94a3b8', true);
            for (let ph = 0; ph < 6; ph++) {
              const pAngle = (ph / 6) * Math.PI * 2;
              const phantom = this.spawnEnemy('phantom',
                e.x + Math.cos(pAngle) * 120,
                e.y + Math.sin(pAngle) * 120
              );
              if (phantom) {
                phantom.speed *= 1.8; // phantom nhanh hơn thường
                phantom.stealth = 0.85; // tàng hình cao hơn
              }
            }
            this.screenShake(8, 0.3);
          }
        }

        // ── BOSS: REAPER FORM 1 — Death Scythe Swing ───────────
        // Warning ring 360° → AoE → stun 1s
        if (e.type === 'boss_reaper_form1') {
          e._scytheTimer = (e._scytheTimer || 0) + dt;
          const rCd = e.phase >= 3 ? 6 : e.phase >= 2 ? 9 : 12;
          if (!e._scytheWarning && e._scytheTimer > rCd) {
            e._scytheTimer = 0;
            e._scytheWarning = true;
            e._scytheWarnUntil = now + 1200; // 1.2s warning ring
            // Spawn warning ring particle
            this.particles.push({ type: 'ring', x: e.x, y: e.y, r: 0, maxR: 280, color: '#dc2626', life: 1.2, maxLife: 1.2 });
            this.addFloat(e.x, e.y - 65, '⚠️ DEATH SCYTHE!', '#dc2626', true);
          }
          if (e._scytheWarning && now > e._scytheWarnUntil) {
            e._scytheWarning = false;
            e.attackAnim = { t: now, duration: 600 };
            this.aoeExplosion(e.x, e.y, 280, e.dmg * 2.0, '#dc2626');
            // Stun player nếu trong tầm
            if (dist < 280) {
              p.stunUntil = (p.stunUntil || 0);
              p.stunUntil = now + 1200;
              this.addFloat(p.x, p.y - 40, '⭐ BỊ CHOÁNG!', '#fbbf24');
            }
            this.screenShake(20, 0.8);
          }
        }

        // ── BOSS: DEATH REAPER (Red Death) — Đặc biệt ─────────
        if (e.type === 'boss_death_reaper') {
          // Speed luôn nhanh hơn player tối đa
          const playerMaxSpeed = p.speed * Math.min(p.spdMult, STAT_CAPS.spdMult);
          e.speed = Math.max(e.speed, playerMaxSpeed * 2.1);

          // Phase 2 (HP 70-45%): Shadow Clones
          const hpPct = e.hp / e.maxHp;
          if (hpPct < 0.70 && !e._clonesSpawned2) {
            e._clonesSpawned2 = true;
            this._spawnDeathClones(e, 3);
            this.addFloat(e.x, e.y - 80, '💀 SHADOW CLONES!', '#7c3aed', true);
          }

          // Phase 3 (HP 45-20%): Invincibility cycles (2s immune / 2s vuln)
          if (hpPct < 0.45) {
            if (!e._invulnCycleStart) e._invulnCycleStart = now;
            const cycleMs = (now - e._invulnCycleStart) % 4000;
            e._isInvulnPhase3 = cycleMs < 2000;
            // Áp dụng invuln
            if (e._isInvulnPhase3) {
              e._tempInvuln = true;
            } else {
              e._tempInvuln = false;
            }
          }

          // Phase 4 (HP < 20%): Full rage
          if (hpPct < 0.20 && !e._phase4Triggered) {
            e._phase4Triggered = true;
            e.speed *= 1.5;
            this._spawnDeathClones(e, 2);
            this.screenShake(30, 2.0);
            this.addFloat(e.x, e.y - 90, '💀 FINAL RAGE!', '#ef4444', true);
          }

          // Death Presence: Darkening effect
          const deathDist = dist;
          this._deathPresenceIntensity = Math.max(0, Math.min(0.6, (400 - deathDist) / 400 * 0.6));
        }
      }


      if (targetIsMerchant) {
        if (dist < this.merchant.r + e.r + 5 && now - e.lastAttack > 800) {
          e.lastAttack = now;
          e.attackAnim = { t: now, duration: 200 };
          const finalDmg = Math.round(e.dmg * 0.4 * nightDmgMult);
          this.merchant.hp -= finalDmg;
          this.spawnFrameAnimation('sword_slash', this.merchant.x, this.merchant.y, this.merchant.r * 1.5, Math.atan2(dy, dx));
          this.spawnParticles(this.merchant.x, this.merchant.y, '#ef4444', 6, 2.5);
          this.addFloat(this.merchant.x, this.merchant.y - this.merchant.r, `-${finalDmg} HP`, '#ef4444');
        }
      } else {
        if (dist < p.r + e.r + 5 && now - e.lastAttack > 800) {
          e.lastAttack = now;
          e.attackAnim = { t: now, duration: 200 };
          const finalMeleeDmg = e.dmg * nightDmgMult * (1 - p.defMult * 0.3);
          // Truyền loại kẻ thù để kiểm tra Red Death OHK và I-frames bypass
          this.takeDamage(finalMeleeDmg, e.type);
          
          // Spider: áp độc lên người chơi
          if (e._poison) {
            p.poisonedUntil = (p.poisonedUntil || 0);
            p.poisonedUntil = Math.max(p.poisonedUntil, now + 3000);
            p.poisonDmgPerSec = Math.max(p.poisonDmgPerSec || 0, e.poisonDmgPerSec || 8);
            this.addFloat(p.x, p.y - 25, '🕷️ Trúng Độc!', '#a3e635');
          }

          // Vampire: hút máu từ người chơi
          if (e._lifesteal) {
            const steal = finalMeleeDmg * (e._lifesteal || 0.25);
            e.hp = Math.min(e.maxHp, e.hp + steal);
            this.spawnParticle(e.x, e.y, '#be185d', 4, 0.5);
          }
          
          // Spawn red slash hit effect at player
          const hitAngle = Math.atan2(p.y - e.y, p.x - e.x);
          this.spawnFrameAnimation('sword_slash', p.x, p.y, p.r * 1.3, hitAngle);
          // Spawn blood particles văng trục Z
          this.spawnParticles(p.x, p.y, '#ef4444', 8, 3.2);
          
          // Fighter melee reflection passive + thornsDmg
          const reflectPct = (this.clsKey === 'fighter' ? 0.15 : 0) + (p.thornsDmg || 0);
          if (reflectPct > 0) {
            const reflectDmg = finalMeleeDmg * Math.min(STAT_CAPS.thornsDmg, reflectPct);
            this.dealDamage(e, reflectDmg);
            if (reflectDmg > 5) {
              this.addFloat(e.x, e.y - 15, `🛡️ Phản Đòn ${Math.round(reflectDmg)}`, '#facc15');
            }
          }
        }
      }


      // Check boss phase
      if (e.isBoss) this.updateBossPhase(e);
    }

    // 2. Physics: Spatial Partitioning Grid for fast enemy separation (Optimized O(N))
    const numEnemies = this.enemies.length;
    const cellSize = 100;
    const grid = {};

    // Group active enemies into 2D grid cells
    for (let i = 0; i < numEnemies; i++) {
      const e = this.enemies[i];
      if (e.hp <= 0) continue;
      const cx = Math.floor(e.x / cellSize);
      const cy = Math.floor(e.y / cellSize);
      const key = `${cx},${cy}`;
      if (!grid[key]) grid[key] = [];
      grid[key].push(e);
    }

    // Solve mutual bot separation only within neighboring cells
    for (let i = 0; i < numEnemies; i++) {
      const e = this.enemies[i];
      if (e.hp <= 0) continue;

      const cx = Math.floor(e.x / cellSize);
      const cy = Math.floor(e.y / cellSize);

      // Check adjacent 3x3 grid cells
      for (let nx = cx - 1; nx <= cx + 1; nx++) {
        for (let ny = cy - 1; ny <= cy + 1; ny++) {
          const key = `${nx},${ny}`;
          const cell = grid[key];
          if (!cell) continue;

          for (let k = 0; k < cell.length; k++) {
            const other = cell[k];
            if (other === e || other.hp <= 0) continue;

            const sdx = e.x - other.x;
            const sdy = e.y - other.y;
            const distSq = sdx * sdx + sdy * sdy;
            const minDist = (e.r + other.r) * 0.95;
            const minDistSq = minDist * minDist;

            if (distSq < minDistSq) {
              const sDist = Math.sqrt(distSq);
              if (sDist > 0) {
                const overlap = minDist - sDist;
                const force = overlap * 0.15; // Smooth repel force
                const ratio = force / sDist;
                const pushX = sdx * ratio;
                const pushY = sdy * ratio;
                e.x += pushX;
                e.y += pushY;
                other.x -= pushX;
                other.y -= pushY;
              } else {
                const angle = Math.random() * Math.PI * 2;
                const force = minDist * 0.15;
                const pushX = Math.cos(angle) * force;
                const pushY = Math.sin(angle) * force;
                e.x += pushX;
                e.y += pushY;
                other.x -= pushX;
                other.y -= pushY;
              }
            }
          }
        }
      }
    }

    // 3. Keep all enemies within world bounds
    for (let i = 0; i < numEnemies; i++) {
      const e = this.enemies[i];
      if (e.hp <= 0) continue;
      e.x = Math.max(e.r, Math.min(WORLD_W - e.r, e.x));
      e.y = Math.max(e.r, Math.min(WORLD_H - e.r, e.y));
    }

    // 4. Enemy projectile hit player or merchant (Optimized collision)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (!proj.isEnemyProjectile) continue;

      // Target merchant check
      if (proj.targetMerchant && this.merchantRescueActive) {
        const pdx = proj.x - this.merchant.x;
        const pdy = proj.y - this.merchant.y;
        const minDist = proj.radius + this.merchant.r;
        if (pdx * pdx + pdy * pdy < minDist * minDist) {
          const finalDmg = Math.round(proj.dmg * 0.4);
          this.merchant.hp -= finalDmg;
          this.spawnFrameAnimation('fireball_explode', this.merchant.x, this.merchant.y, this.merchant.r * 1.1);
          this.spawnParticles(this.merchant.x, this.merchant.y, '#ef4444', 4, 2);
          this.addFloat(this.merchant.x, this.merchant.y - this.merchant.r, `-${finalDmg} HP`, '#ef4444');
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      const pdx = proj.x - p.x;
      const pdy = proj.y - p.y;
      const minDist = proj.radius + p.r;
      if (pdx * pdx + pdy * pdy < minDist * minDist) {
        this.takeDamage(proj.dmg * (1 - p.defMult * 0.3));
        
        // Spawn small impact explosion animation on player
        this.spawnFrameAnimation('fireball_explode', p.x, p.y, p.r * 1.1);
        // Spawn blood particles văng trục Z
        this.spawnParticles(p.x, p.y, '#ef4444', 6, 2.8);
        
        // Spawn impact shockwave ring on player
        this.particles.push({
          type: 'ring',
          x: proj.x, y: proj.y,
          r: proj.radius,
          maxR: proj.radius * 3.0,
          color: proj.color || '#ff2222',
          life: 0.18, maxLife: 0.18
        });
        
        this.projectiles.splice(i, 1);
      }
    }
  }

  updateBossPhase(boss) {
    const hpPct = boss.hp / boss.maxHp;
    if (hpPct < 0.33 && boss.phase < 3) { boss.phase = 3; boss.speed *= 1.3; boss.dmg *= 1.2; this.addFloat(boss.x, boss.y - 60, '⚠️ PHASE 3!', '#f87171'); }
    else if (hpPct < 0.66 && boss.phase < 2) { boss.phase = 2; boss.speed *= 1.15; this.addFloat(boss.x, boss.y - 60, '⚠️ PHASE 2!', '#f87171'); }
  }

  nearestEnemy() {
    if (!this.enemies.length) return null;
    const p = this.player;
    let best = null;
    let bestDistSq = Infinity;
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.hp <= 0) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        best = e;
      }
    }
    return best;
  }

  // ──────────────────────────────────────────────
  // PARTICLES
  // ──────────────────────────────────────────────
  spawnParticle(x, y, color, r = 6, life = 0.6, followNothing = false) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 80;
    this.particles.push({
      type: 'dot', x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
      z: 0, vz: 0, gravity: 0,
      color, r, life, maxLife: life
    });
  }

  spawnParticles(x, y, color, count = 10, speed = 3) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const sp    = speed * 40 + Math.random() * speed * 40;
      // Let particles launch into the 3D Z-axis
      const launchVz = speed * 30 + Math.random() * speed * 40;
      this.particles.push({
        type:'dot', x, y, vx: Math.cos(angle)*sp, vy: Math.sin(angle)*sp,
        z: 2 + Math.random() * 8, vz: launchVz, gravity: 380,
        color, r: 4 + Math.random() * 5, life: 0.4 + Math.random() * 0.5, maxLife: 0.9
      });
    }
  }

  spawnFootstepDust(x, y) {
    this.particles.push({
      type: 'dust',
      x, y,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      r: 5 + Math.random() * 5,
      life: 0.35 + Math.random() * 0.25,
      maxLife: 0.6
    });
  }

  emitLightningEffect(fromX, fromY, toX, toY, color, glow) {
    const steps = 6;
    const path = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = fromX + (toX - fromX) * t;
      const py = fromY + (toY - fromY) * t;
      path.push({ x: px, y: py });
    }
    this.particles.push({
      type: 'lightning', path, color, glow, life: 0.25, maxLife: 0.25
    });
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }

      // Z-axis gravity simulation
      if (p.z !== undefined && p.vz !== undefined && p.vz !== 0) {
        p.z += p.vz * dt;
        p.vz -= (p.gravity || 380) * dt;
        if (p.z <= 0) {
          p.z = 0;
          p.vz = 0;
        }
      }
      
      if (p.type === 'dot') {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.92; p.vy *= 0.92;
      }
      else if (p.type === 'dust') {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.90; p.vy *= 0.90;
      }
      else if (p.type === 'spark') {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += 200 * dt; // gravity
        p.alpha = Math.max(0, p.life / p.maxLife);
      }
      else if (p.type === 'lvlup_star') {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.96; p.vy *= 0.96;
        p.alpha = Math.max(0, p.life / p.maxLife);
      }
      else if (p.type === 'lightning') {
        p.alpha = Math.max(0, p.life / p.maxLife);
      }
      else if (p.type === 'boom') {
        p.r += (p.maxR - p.r) * 12 * dt;
        p.alpha = Math.max(0, p.life / p.maxLife);
      }
      else if (p.type === 'ring') {
        p.r += (p.maxR / p.maxLife) * dt;
      }
      else if (p.type === 'rain_arrow') {
        // Move arrow from sky to ground target
        const progress = 1 - p.life / p.maxLife;
        p.x = p.x + (p.tx - p.x) * Math.min(1, dt * 12);
        p.y = p.y + (p.ty - p.y) * Math.min(1, dt * 12);
        // Deal damage when arrow arrives (life < 0.05 and not already dealt)
        if (!p.done && p.life < 0.04) {
          p.done = true;
          this.enemies.forEach(e => {
            if (e.hp > 0 && Math.hypot(e.x - p.tx, e.y - p.ty) < 35) {
              this.dealDamage(e, p.dmg);
            }
          });
          this.spawnParticles(p.tx, p.ty, '#34d399', 5, 2);
        }
      }
      else if (p.type === 'rain_arrow_warn') {
        // Pulsing warning circle - no movement
        p.r = 8 + Math.sin(p.life * 30) * 3;
      }
      else if (p.type === 'gold_orb' || p.type === 'xp_orb') {
        const dx = this.player.x - p.x, dy = this.player.y - p.y;
        const distSq = dx * dx + dy * dy;
        
        // If collected
        if (distSq < 900) {
          if (p.type === 'gold_orb') {
            let finalVal = p.value;
            if (this.activeShrineBuffs && this.activeShrineBuffs.gold > 0) {
              finalVal *= 2;
            }
            let petGoldMult = 1.0;
            if (this.save && this.save.activePet === 'corgi') {
              petGoldMult = 1.15;
            }
            finalVal = Math.round(finalVal * petGoldMult);
            this.totalGold += finalVal;
            this.addFloat(p.x, p.y - 15, `+${finalVal}🪙`, '#fbbf24');
          } else {
            this.gainXp(p.value);
            if (p.isAccumulator || p.gemTier === 'red_accum') {
              this.addFloat(p.x, p.y - 25, `+${p.value} XP 🔥`, '#ef4444', true);
            }
          }
          this.particles.splice(i, 1);
          continue;
        }
        
        const dist = Math.sqrt(distSq);
        const shouldPull = dist < this.magnetRadius || this.autoVacuumActive;
        
        if (shouldPull) {
          let speedBase = 220;
          if (this.autoVacuumActive) {
            speedBase = 800;
          }
          const spd = speedBase + (1 - dist / this.magnetRadius) * 480;
          p.x += (dx/dist)*spd*dt; p.y += (dy/dist)*spd*dt;
        } else {
          // Slow down initial drop velocity
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.88;
          p.vy *= 0.88;
        }
      }
      else if (p.type === 'golden_egg') {
        const dx = this.player.x - p.x, dy = this.player.y - p.y;
        const distSq = dx * dx + dy * dy;
        
        // If collected
        if (distSq < 900) {
          this.collectGoldenEgg();
          this.particles.splice(i, 1);
          continue;
        }
        
        const dist = Math.sqrt(distSq);
        const shouldPull = dist < this.magnetRadius || this.autoVacuumActive;
        
        if (shouldPull) {
          let speedBase = 220;
          if (this.autoVacuumActive) {
            speedBase = 800;
          }
          const spd = speedBase + (1 - dist / this.magnetRadius) * 480;
          p.x += (dx/dist)*spd*dt; p.y += (dy/dist)*spd*dt;
        } else {
          // Slow down initial drop velocity
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.88;
          p.vy *= 0.88;
        }
      }
    }
  }

  // ──────────────────────────────────────────────
  // FLOAT TEXT
  // ──────────────────────────────────────────────
  addFloat(x, y, text, color = '#fff', big = false) {
    this.floats.push({ x, y, text, color, big, life: 1.0, vy: -60 - Math.random()*20 });
  }

  updateFloats(dt) {
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.life -= dt * 0.9;
      f.y += f.vy * dt;
      f.vy *= 0.96;
      if (f.life <= 0) this.floats.splice(i, 1);
    }
  }

  // ──────────────────────────────────────────────
  // SUMMONS
  // ──────────────────────────────────────────────
  updateSummons(dt) {
    const now = Date.now();
    for (let i = this.summons.length - 1; i >= 0; i--) {
      const s = this.summons[i];
      if (now > s.expiresAt) { this.summons.splice(i, 1); continue; }

      if (s.type === 'spirit_wolf') {
        s.x += Math.cos(s.angle) * s.speed * dt;
        s.y += Math.sin(s.angle) * s.speed * dt;
        
        let wolfHit = false;
        for (let j = 0; j < this.enemies.length; j++) {
          const e = this.enemies[j];
          if (e.hp <= 0) continue;
          const sdx = e.x - s.x;
          const sdy = e.y - s.y;
          const minDist = s.r + e.r;
          if (sdx * sdx + sdy * sdy < minDist * minDist) {
            this.dealDamage(e, s.dmg);
            this.summons.splice(i, 1);
            this.spawnParticles(s.x, s.y, s.color, 15, 5);
            wolfHit = true;
            break;
          }
        }
        if (wolfHit) continue;
        if (s.x < 0 || s.x > WORLD_W || s.y < 0 || s.y > WORLD_H) this.summons.splice(i, 1);
        continue;
      }

      // Skeleton / Shadow clone / Grim Reaper — find nearest enemy and move toward it
      let target = null;
      let targetDistSq = 999999 * 999999; // Only chase within 800px
      const chaseRangeSq = 800 * 800;
      for (let j = 0; j < this.enemies.length; j++) {
        const e = this.enemies[j];
        if (e.hp <= 0) continue;
        const sdx = e.x - s.x;
        const sdy = e.y - s.y;
        const distSq = sdx * sdx + sdy * sdy;
        if (distSq < targetDistSq) {
          targetDistSq = distSq;
          target = e;
        }
      }

      if (target && targetDistSq < chaseRangeSq) {
        // Chase and attack nearest enemy
        const dx = target.x - s.x;
        const dy = target.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const attackRange = s.r + target.r + 6;
        if (dist > attackRange && dist > 0) {
          const spd = (s.speed || 130) * dt;
          s.x += (dx / dist) * spd;
          s.y += (dy / dist) * spd;
        }
        if (dist <= attackRange + 4 && now - (s.lastAttack || 0) > (s.attackCd || 900)) {
          s.lastAttack = now;
          this.dealDamage(target, s.dmg);
          s.attackAnim = { t: now, duration: 250 };
          if (s.type === 'grim_reaper') {
            this.spawnFrameAnimation('grim_reaper_slash', target.x, target.y, 80);
            this.screenShake(4, 0.15);
          } else {
            this.spawnParticles(target.x, target.y, s.color || '#e2e8f0', 4, 2);
          }
        }
      } else {
        // No nearby enemy — loosely follow player (don't orbit)
        const p = this.player;
        const dx = p.x - s.x;
        const dy = p.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = i % 8;
        const followDist = 55 + idx * 18; // Spread summons around player
        if (dist > followDist + 25 && dist > 0) {
          const spd = (s.speed || 130) * dt * 0.65;
          s.x += (dx / dist) * spd;
          s.y += (dy / dist) * spd;
        }
      }
    }
  }

  // ──────────────────────────────────────────────
  // HAZARDS
  // ──────────────────────────────────────────────
  updateHazards(dt) {
    const now = Date.now();
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.life -= dt;
      if (h.life <= 0) { this.hazards.splice(i, 1); continue; }
      h.tickCd -= dt;
      if (h.tickCd <= 0) {
        h.tickCd = 0.5;
        const hRangeSq = h.r * h.r;
        const p = this.player;

        // Player standing inside glacial_sanctum check
        if (h.type === 'glacial_sanctum') {
          const pdx = p.x - h.x;
          const pdy = p.y - h.y;
          if (pdx * pdx + pdy * pdy < hRangeSq) {
            const healVal = p.maxHp * 0.025; // 2.5% hp per 0.5s = 5% per second
            p.hp = Math.min(p.maxHp, p.hp + healVal);
            this.addFloat(p.x, p.y - 40, `+${Math.round(healVal)} HP (Thánh Điện)`, '#60a5fa');
          }
        }

        this.enemies.forEach(e => {
          if (e.hp <= 0) return;
          const hdx = e.x - h.x;
          const hdy = e.y - h.y;
          if (hdx * hdx + hdy * hdy < hRangeSq) {
            this.dealDamage(e, h.dmg);
            if (h.slow) { e.slow = Math.max(e.slow||0, h.slow); e.slowUntil = Date.now() + 600; }
            
            if (h.type === 'briar') {
              e.poisonDmg = Math.max(e.poisonDmg||0, h.dmg*0.5);
              e.poisonUntil = Date.now() + 2000;
            } else if (h.type === 'genesis_bloom') {
              e.poisonDmg = Math.max(e.poisonDmg||0, h.dmg*0.85);
              e.poisonUntil = Date.now() + 3000;
              // Lifesteal 10% of damage
              const heal = h.dmg * 0.10;
              p.hp = Math.min(p.maxHp, p.hp + heal);
              this.addFloat(p.x, p.y - 30, `+${Math.round(heal)} HP (Hút Máu)`, '#22c55e');
            } else if (h.type === 'glacial_sanctum') {
              // Freeze / stun enemies
              e.stunUntil = Date.now() + 1500;
              e.slow = 1.0;
              e.slowUntil = Date.now() + 1500;
            }

            this.spawnParticle(e.x, e.y, h.color, 5, 0.4);
          }
        });
      }
    }
  }

  // ─── DANGER ZONES: vùng nguy hiểm buộc player phải di chuyển ───
  updateDangerZones(dt) {
    const p = this.player;
    const now = Date.now();
    const elapsed = this.gameElapsed;

    // Chỉ xuất hiện từ phút 1 trở đi
    if (elapsed < 60) return;

    // Khởi tạo mảng
    if (!this.dangerZones) this.dangerZones = [];
    if (!this._dangerZoneTimer) this._dangerZoneTimer = 0;

    // Spawn danger zone mỗi 18-25s, sau phút 5 thì 10-16s
    const spawnInterval = elapsed > 300 ? 10 + Math.random() * 6 : 18 + Math.random() * 7;
    this._dangerZoneTimer += dt;

    if (this._dangerZoneTimer >= spawnInterval) {
      this._dangerZoneTimer = 0;
      const types = [
        { type: 'fire',   color: '#f97316', warnColor: '#fbbf24', label: '🔥 Vùng Lửa!',    dmgPct: 0.12, r: 130, life: 8,  slowEnemy: false },
        { type: 'acid',   color: '#a3e635', warnColor: '#84cc16', label: '☣️ Vùng Acid!',   dmgPct: 0.08, r: 160, life: 10, slowEnemy: true  },
        { type: 'void',   color: '#6d28d9', warnColor: '#a78bfa', label: '🌀 Hố Hư Không!', dmgPct: 0.15, r: 110, life: 6,  slowEnemy: false },
        { type: 'ice',    color: '#7dd3fc', warnColor: '#bae6fd', label: '❄️ Bão Tuyết!',   dmgPct: 0.06, r: 200, life: 12, slowEnemy: true  },
      ];
      const def = types[Math.floor(Math.random() * types.length)];
      // Spawn gần player nhưng không trùng vị trí
      const angle = Math.random() * Math.PI * 2;
      const dist = 200 + Math.random() * 250;
      const zx = Math.max(200, Math.min(WORLD_W - 200, p.x + Math.cos(angle) * dist));
      const zy = Math.max(200, Math.min(WORLD_H - 200, p.y + Math.sin(angle) * dist));

      // Cảnh báo trước 2.5s
      this.addFloat(zx, zy - 50, `⚠️ ${def.label}`, def.warnColor, true);
      this.screenShake(5, 0.2);
      showToast(`⚠️ ${def.label} Hãy di chuyển!`, def.warnColor);

      setTimeout(() => {
        if (!this.running) return;
        this.dangerZones.push({
          ...def,
          x: zx, y: zy,
          life: def.life,
          tickCd: 0,
          pulse: 0,
          warningShown: false,
        });
      }, 2500);
    }

    // Update và xử lý damage
    for (let i = this.dangerZones.length - 1; i >= 0; i--) {
      const z = this.dangerZones[i];
      z.life -= dt;
      z.pulse += dt * 3;
      z.tickCd -= dt;

      if (z.life <= 0) { this.dangerZones.splice(i, 1); continue; }

      // Damage player inside zone mỗi 0.3s
      if (z.tickCd <= 0) {
        z.tickCd = 0.3;
        const pdx = p.x - z.x;
        const pdy = p.y - z.y;
        if (pdx * pdx + pdy * pdy < z.r * z.r) {
          const dmg = p.maxHp * z.dmgPct * 0.3; // per 0.3s
          this.takeDamage(dmg);
          this.spawnParticle(p.x, p.y, z.color, 6, 0.5);
          this.addFloat(p.x, p.y - 30, `${z.type === 'fire' ? '🔥' : z.type === 'acid' ? '☣️' : z.type === 'void' ? '🌀' : '❄️'} -${Math.round(dmg)}`, z.color);
        }

        // Slow enemies nếu cần
        if (z.slowEnemy) {
          this.enemies.forEach(e => {
            const edx = e.x - z.x, edy = e.y - z.y;
            if (edx * edx + edy * edy < z.r * z.r) {
              e.slow = Math.max(e.slow || 0, 0.3);
              e.slowUntil = Date.now() + 500;
            }
          });
        }
      }
    }
  }


  // ──────────────────────────────────────────────
  updateWave(dt) {
    // ── GAME TIMER ──
    this.gameElapsed += dt;
    const elapsed = this.gameElapsed;
    const remaining = Math.max(0, this.stageDuration - elapsed);

    // Update visual wave number (1 wave per minute)
    this.wave = Math.min(this.maxVisualWave, 1 + Math.floor(elapsed / 60));

    // Update wave timer display (HUD: đồng hồ đếm ngược)
    this.waveSec = Math.round(remaining);

    // ── HUD TIMER ──
    const waveEl = document.getElementById('pveTimerNum');
    if (waveEl) {
      const wMin = Math.floor(remaining / 60), wSec = Math.floor(remaining % 60);
      waveEl.textContent = `${wMin}:${wSec.toString().padStart(2,'0')}`;
    }
    const gameTimerEl = document.getElementById('pveGameTimerNum');
    if (gameTimerEl) {
      const eMin = Math.floor(elapsed / 60), eSec = Math.floor(elapsed % 60);
      gameTimerEl.textContent = `${eMin}:${eSec.toString().padStart(2,'0')}`;
      const timerDisp = document.getElementById('pveGameTimerDisplay');
      if (timerDisp) timerDisp.classList.toggle('danger', remaining < 120); // đỏ khi còn < 2 phút
    }
    const waveNumEl = document.getElementById('pveWaveNum');
    if (waveNumEl) waveNumEl.textContent = `Wave ${this.wave}/30`;

    // ── COUNTDOWN WARNINGS ──
    // Phút 28: cảnh báo Tử Thần chuẩn bị
    if (!this._warned28 && elapsed >= 1680) {
      this._warned28 = true;
      showToast('☠️ CÒN 2 PHÚT — TỬ THẦN SẮP ĐẾN!', '#dc2626');
      this.screenShake(20, 1.0);
    }
    // Phút 29: đếm ngược 1 phút
    if (!this._warned29 && elapsed >= 1740) {
      this._warned29 = true;
      showToast('💀 CÒN 1 PHÚT — HÃY CHUẨN BỊ!', '#dc2626');
    }
    // Phút 29:30: đếm ngược 30s
    if (!this._warned2930 && elapsed >= 1770) {
      this._warned2930 = true;
      showToast('⚠️ 30 GIÂY — TỬ THẦN THỨC DẬY!', '#f97316');
    }

    // ── ARCANA SELECTION ở phút 15 ──
    if (!this.arcanaSelectedWave10 && elapsed >= 900) {
      this.arcanaSelectedWave10 = true;
      this.pause();
      this.triggerArcanaSelection(() => { this.resume(); });
      return;
    }

    // ── VICTORY: chỉ khi giết Tử Thần (boss_death_reaper) ──
    // Victory được trigger trong killEnemy khi boss_death_reaper chết
    // Nếu hết giờ mà Tử Thần chưa xuất hiện: spawn ngay
    if (elapsed >= this.stageDuration && !this._deathReaperSpawned) {
      this._deathReaperSpawned = true;
      // Nếu không có boss nào: spawn ngay Death Reaper
      if (!this.enemies.some(e => e.isBoss)) {
        const p = this.player;
        const angle = Math.random() * Math.PI * 2;
        this.spawnEnemy('boss_death_reaper', p.x + Math.cos(angle) * 650, p.y + Math.sin(angle) * 650, 1, false);
        this.addFloat(p.x, p.y - 140, '💀💀 TỬ THẦN XUẤT HIỆN! GIẾT NÓ ĐỂ THẮNG! 💀💀', '#dc2626', true);
        this.screenShake(30, 2.0);
        showToast('☠️ TỬ THẦN — GIẾT NÓ ĐỂ CHIẾN THẮNG!', '#dc2626');
      }
      return;
    }
    // Nếu đã hết giờ và không có boss (tình huống bất thường): chờ kill boss
    if (elapsed > this.stageDuration + 600 && !this.enemies.some(e => e.isBoss)) {
      // Timeout 10 phút sau phút 30 → defeat
      this.gameOver();
      return;
    }

    // ── BOSS SCHEDULE CHECK ──
    const p = this.player;
    for (const entry of this._bossSchedule) {
      if (!entry.done && elapsed >= entry.t && !this.bossActive) {
        entry.done = true;
        this.bossActive = true;
        const bdef = ENEMY_TYPES[entry.b];
        if (bdef) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 680;
          const isDeathReaper = entry.b === 'boss_death_reaper';
          
          if (isDeathReaper) {
            // ── RED DEATH SPAWN SEQUENCE ────────────────────────
            this._deathReaperSpawned = true;
            this._deathPresenceIntensity = 0;
            
            // Cảnh báo trước 3 giây
            this.addFloat(p.x, p.y - 140, '⚰️ TỬ THẦN ĐÃ ĐẾN...', '#dc2626', true);
            this.screenShake(15, 1.0);
            
            // Spawn sau 3s với HP scale theo level
            setTimeout(() => {
              if (!this || this._gameOver) return;
              const spawnAngle = Math.random() * Math.PI * 2;
              const reaper = this.spawnEnemy(
                'boss_death_reaper',
                p.x + Math.cos(spawnAngle) * 680,
                p.y + Math.sin(spawnAngle) * 680,
                1, false
              );
              // HP scale: 655,350 × player level (đúng theo yêu cầu)
              if (reaper) {
                const reaperHp = Math.round(655350 * p.level);
                reaper.hp = reaperHp;
                reaper.maxHp = reaperHp;
                reaper._isRealReaper = true;
                reaper._invulnCycleStart = null;
              }
              this.addFloat(p.x, p.y - 140, '💀💀 TỬ THẦN XUẤT HIỆN! GIẾT NÓ ĐỂ THẮNG! 💀💀', '#dc2626', true);
              this.screenShake(30, 2.0);
              showToast('☠️ TỬ THẦN — GIẾT NÓ ĐỂ CHIẾN THẮNG!', '#dc2626');
            }, 3000);
          } else {
            this.spawnEnemy(entry.b, p.x + Math.cos(angle) * dist, p.y + Math.sin(angle) * dist, 1, false);
            const bossMinute = Math.floor(entry.t / 60);
            this.addFloat(p.x, p.y - 120, `💀 ${bdef.name} XUẤT HIỆN! [Phút ${bossMinute}]`, '#ef4444', true);
            this.screenShake(18, 0.6);
            showToast(`⚠️ BOSS: ${bdef.name} (Phút ${bossMinute})`, '#ef4444');
          }
        }
      }
    }

    // ── SOUL AEGIS UNLOCK (Hidden Item) ─────────────────────
    // Nếu player sống sót đến phút 27 với ≤10% HP → unlock soul aegis
    if (elapsed >= 1620 && !this._soulAegisChecked) {
      this._soulAegisChecked = true;
      if (p.hp / p.maxHp <= 0.10 && !p.hasSoulAegis) {
        p.hasSoulAegis = true;
        this.addFloat(p.x, p.y - 100, '✨ LINH HỒN BÌNH AN ĐƯỢC TRAO!', '#fbbf24', true);
        this.addFloat(p.x, p.y - 125, '🛡️ Soul Aegis: chặn 1 lần OHK của Tử Thần', '#a855f7', true);
        this.spawnParticles(p.x, p.y, '#fbbf24', 25, 5);
        showToast('✨ Soul Aegis unlock! Sẽ bảo vệ bạn 1 lần khỏi Tử Thần!', '#fbbf24');
      }
    }



    // Boss dead → clear flag, auto vacuum, Arcana ở boss phút 10+
    if (this.bossActive && !this.enemies.some(e => e.isBoss)) {
      this.bossActive = false;
      this.autoVacuumActive = true;
      const bossMinute = Math.floor(elapsed / 60);
      this.addFloat(p.x, p.y - 70, `👑 BOSS TIÊU DIỆT! [Phút ${bossMinute}]`, '#fbbf24', true);
      setTimeout(() => { this.autoVacuumActive = false; }, 3500);
      // Nếu giết Tử Thần → Victory!
      if (this._deathReaperSpawned && !this.enemies.some(e => e.type === 'boss_death_reaper')) {
        setTimeout(() => this.victory(), 1500);
        return;
      }
    }

    // ── CONTINUOUS BATCH SPAWNING (không spawn khi boss đang active) ──
    if (this.bossActive) return; // Boss đang chiến → giảm quái thường để tránh overwhelm quá mức
    const scaling = getWaveScaling(elapsed);
    this.batchTimer -= dt * (this.player.spawnRateMult || 1.0);

    if (this.batchTimer <= 0) {
      this.batchTimer = scaling.batchInterval;

      // Eligible enemy types (mở khóa theo thời gian)
      const eligible = Object.entries(ENEMY_TYPES).filter(([k, v]) => {
        if (v.isBoss) return false;
        const unlockSec = (v.wave - 1) * 60; // 1 loại quái mới mỗi phút
        return elapsed >= unlockSec;
      });
      if (eligible.length === 0) return;

      // Swarm event: xác suất 8%, sau phút 2
      const isSwarm = Math.random() < 0.08 && elapsed > 120;
      const count = isSwarm ? Math.floor(scaling.countPerBatch * 1.8) : scaling.countPerBatch;
      if (isSwarm) {
        this.addFloat(p.x, p.y - 120, '🚨 SWARM INCOMING! 🚨', '#ef4444', true);
        this.screenShake(12, 0.4);
      }

      for (let i = 0; i < count; i++) {
        const [typeId] = eligible[Math.floor(Math.random() * eligible.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist  = 600 + Math.random() * 280;
        const isElite = Math.random() < scaling.eliteChance;
        this.spawnEnemy(typeId, p.x + Math.cos(angle) * dist, p.y + Math.sin(angle) * dist,
          scaling.hpMult, isElite, scaling.dmgMult);
      }
    }
  }


  // nextWave is now only called for level-up upgrade screen mid-game (triggered by XP leveling)
  // It no longer drives the wave loop
  nextWave() {
    // Legacy: just show upgrade screen when leveling up
    this.pause();
    this.showUpgradeChoice(() => {
      this.resume();
    });
  }



  // ──────────────────────────────────────────────
  // UPGRADE CHOICE
  // ──────────────────────────────────────────────
  showUpgradeChoice(callback) {
    const screen = document.getElementById('pveUpgradeScreen');
    const cards  = document.getElementById('upgradeCards');
    const title  = document.getElementById('upgradeTitle');
    const sub    = document.getElementById('upgradeSub');

    title.textContent = `🎯 LEVEL ${this.player.level} — CHỌN NÂNG CẤP`;
    sub.textContent   = `Wave ${this.wave} sắp bắt đầu • Hãy chọn 1 trong 3 lựa chọn`;
    cards.innerHTML   = '';
    screen.classList.remove('hidden');

    const choices = this.generateUpgradeChoices();
    choices.forEach(choice => {
      const card = document.createElement('div');
      card.className = `upgrade-card ${choice.cardClass}`;
      if (choice.style) card.style.cssText = choice.style;
      card.innerHTML = `
        <div class="up-icon">${choice.icon}</div>
        <div class="up-name">${choice.name}</div>
        <div class="up-desc">${choice.desc}</div>
        <div class="up-type" style="color:${choice.color || '#a78bfa'}">${choice.typeLabel}</div>`;
      card.onclick = () => {
        choice.apply();
        screen.classList.add('hidden');
        if (callback) callback();
      };
      cards.appendChild(card);
    });
  }

  generateUpgradeChoices() {
    const choices = [];
    const ownedSkillIds = this.skills.map(s => s.id);
    const playerBranch = this.player.branch || 'assassin';
    // ★ CLASS-EXCLUSIVE: Only allow skills matching the player's branch
    const allSkillIds = Object.keys(SKILL_DEFS).filter(id => {
      const def = SKILL_DEFS[id];
      return !def.isLegendary && def.branch === playerBranch;
    });

    // Filter active skills that can be upgraded (Lv < 8)
    const upgradeableSkills = this.skills.filter(s => {
      if (s.isLegendary) return false;
      if (s.level >= 8) return false;
      if (s.level === 7) {
        // To upgrade to Lv 8, must own the corresponding passive item for standard EVOs
        const evo = EVO_COMBOS.find(e => e.baseSkill === s.id);
        if (evo) {
          const hasPassive = this.passiveItems.some(p => p.id === evo.passiveItem);
          if (!hasPassive) return false;
        }
        // To upgrade to Lv 8, must own the corresponding secondary skill for UNION combos
        const union = UNION_COMBOS.find(u => u.baseSkill1 === s.id || u.baseSkill2 === s.id);
        if (union) {
          const hasSkill1 = this.skills.some(sk => sk.id === union.baseSkill1);
          const hasSkill2 = this.skills.some(sk => sk.id === union.baseSkill2);
          if (!hasSkill1 || !hasSkill2) return false;
        }
      }
      return true;
    });
    // Filter passive items that can be upgraded (Lv < 5)
    const upgradeablePassives = this.passiveItems.filter(p => p.level < 5);

    // Unlocked passives list from save state
    const unlockedPassivesList = savedData.unlockedPassives || ['spinach', 'armor_plate', 'hollow_heart', 'candelabrador', 'empty_tome', 'wings'];
    const ownedPassiveIds = this.passiveItems.map(p => p.id);
    const poolNewPassives = unlockedPassivesList.filter(id => !ownedPassiveIds.includes(id));
    const poolNewSkills = allSkillIds.filter(id => !ownedSkillIds.includes(id));

    // Choice pool of possible actions:
    const candidates = [];

    // Add new skill option (class-exclusive — only same branch)
    if (this.skills.filter(s => !s.isLegendary).length < MAX_SKILLS) {
      poolNewSkills.forEach(id => {
        const def = SKILL_DEFS[id];
        candidates.push({
          type: 'new_skill',
          id: id,
          weight: 4,
          icon: def.icon,
          name: def.name,
          desc: def.desc,
          typeLabel: `✨ Kỹ Năng ${CLASSES[playerBranch]?.name || ''} Đặc Quyền`,
          color: def.color,
          cardClass: 'new-skill',
          apply: () => this.addSkill(id)
        });
      });
    }

    // Add upgrade skill options
    upgradeableSkills.forEach(s => {
      const def = SKILL_DEFS[s.id];
      candidates.push({
        type: 'upgrade_skill',
        id: s.id,
        weight: 6,
        icon: def.icon, name: `${def.name} LV.${s.level+1}`, desc: `Nâng cấp kỹ năng chủ động lên cấp ${s.level+1}. Sức mạnh và hiệu ứng tăng mạnh.`,
        typeLabel: '⬆️ Nâng Cấp Kỹ Năng', color: def.color, cardClass: 'upgrade-skill',
        apply: () => { s.level++; this.showSkillLevelUp(s.id, s.level); this.checkLegendary(); }
      });
    });

    // Add new passive option
    if (this.passiveItems.length < 6) {
      poolNewPassives.forEach(id => {
        const def = PASSIVE_ITEMS_DEFS[id];
        if (def) {
          candidates.push({
            type: 'new_passive',
            id: id,
            weight: 3,
            icon: def.icon, name: def.name, desc: def.desc, typeLabel: '🛡️ Vật Phẩm Hỗ Trợ Mới',
            color: '#34d399', cardClass: 'new-passive',
            apply: () => {
              this.passiveItems.push({ id, level: 1 });
              this.recalculatePassiveStats();
              this.updatePassiveBar();
            }
          });
        }
      });
    }

    // Add upgrade passive options
    upgradeablePassives.forEach(pItem => {
      const def = PASSIVE_ITEMS_DEFS[pItem.id];
      if (def) {
        candidates.push({
          type: 'upgrade_passive',
          id: pItem.id,
          weight: 5,
          icon: def.icon, name: `${def.name} LV.${pItem.level+1}`, desc: `Nâng cấp thuộc tính hỗ trợ của ${def.name}.`,
          typeLabel: '⬆️ Nâng Cấp Vật Phẩm', color: '#10b981', cardClass: 'upgrade-passive',
          apply: () => {
            pItem.level++;
            this.recalculatePassiveStats();
            this.updatePassiveBar();
          }
        });
      }
    });

    // Shuffle candidates and pick 3, or fallback to stat boosts if not enough choices
    const selected = [];
    const shuffled = candidates.sort(() => 0.5 - Math.random());
    
    for (let c of shuffled) {
      if (selected.length >= 3) break;
      selected.push(c);
    }

    // Fill the rest with random stat boosts if we have less than 3 choices
        const statBoosts = [
      { icon:'❤️', name:'+25% Máu Tối Đa', desc:'Tăng máu tối đa và hồi đầy máu.', apply: () => { this.player.lvlUpMaxHpMult = (this.player.lvlUpMaxHpMult || 1.0) * 1.25; this.recalculatePassiveStats(); this.player.hp = this.player.maxHp; } },
      { icon:'💨', name:'+15% Tốc Độ', desc:'Di chuyển nhanh hơn 15%.', apply: () => { this.player.lvlUpSpdMult = (this.player.lvlUpSpdMult || 1.0) * 1.15; this.recalculatePassiveStats(); } },
      { icon:'⚔️', name:'+20% Sát Thương', desc:'Tất cả kỹ năng gây thêm 20% sát thương.', apply: () => { this.player.lvlUpDmgMult = (this.player.lvlUpDmgMult || 1.0) * 1.20; this.recalculatePassiveStats(); } },
      { icon:'⏱️', name:'-15% Hồi Chiêu', desc:'Tất cả kỹ năng hồi chiêu nhanh hơn 15%.', apply: () => { this.player.lvlUpCdMult = (this.player.lvlUpCdMult || 1.0) * 0.85; this.recalculatePassiveStats(); } },
      { icon:'💥', name:'+20% Diện Tích AoE', desc:'Vùng tác động kỹ năng lớn hơn 20%.', apply: () => { this.player.lvlUpAoeMult = (this.player.lvlUpAoeMult || 1.0) * 1.20; this.recalculatePassiveStats(); } },
      { icon:'🩸', name:'+8% Hút Máu', desc:'Mỗi đòn đánh hồi máu tương ứng 8% sát thương gây ra.', apply: () => { this.player.lvlUpLifesteal = (this.player.lvlUpLifesteal || 0.0) + 0.08; this.recalculatePassiveStats(); } },
    ];

    while (selected.length < 3) {
      const boost = statBoosts[Math.floor(Math.random() * statBoosts.length)];
      if (!selected.some(s => s.name === boost.name)) {
        selected.push({ ...boost, typeLabel: '📊 Nâng Chỉ Số', cardClass: 'stat-boost', color: '#fbbf24' });
      }
    }

    return selected;
  }

  // ──────────────────────────────────────────────
  // GAME OVER / VICTORY
  // ──────────────────────────────────────────────
  gameOver() {
    this.stop();
    const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
    const mins = Math.floor(elapsed / 60), secs = elapsed % 60;

    // Check passive unlocks on loss too!
    let unlockedMsg = '';
    if ((this.player.level >= 30 || this.totalKills >= 2000) && savedData.unlockedPassives) {
      if (!savedData.unlockedPassives.includes('attractorb')) {
        savedData.unlockedPassives.push('attractorb');
        unlockedMsg += '🔓 Mở khóa vật phẩm: Nam Châm (Attractorb)!\n';
      }
      if (!savedData.unlockedPassives.includes('clover')) {
        savedData.unlockedPassives.push('clover');
        unlockedMsg += '🔓 Mở khóa vật phẩm: Cỏ 4 Lá (Clover)!\n';
      }
    }

    savedData.gold += this.totalGold;
    savedData.lastGoldEarned = this.totalGold;
    savedData.lastRunGhost = {
      clsKey: this.clsKey,
      level: this.player.level,
      skills: this.skills.map(s => s.id),
      name: this.player.name || this.cls.name
    };
    saveToDisk();

    setTimeout(() => {
      document.getElementById('pveGame').classList.add('hidden');
      document.getElementById('pveGameOver').classList.remove('hidden');
      document.getElementById('goWave').textContent  = `Wave ${this.wave}`;
      document.getElementById('goKills').textContent = this.totalKills;
      document.getElementById('goTime').textContent  = `${mins}:${secs.toString().padStart(2,'0')}`;
      document.getElementById('goGold').textContent  = this.totalGold;
      if (unlockedMsg) {
        showToast(unlockedMsg, '#34d399');
      }
    }, 800);
  }

  victory() {
    if (this._victoryTriggered) return; // Tránh gọi 2 lần
    this._victoryTriggered = true;
    this.stop();
    this.ngPlus++;
    const elapsed = Math.floor(this.gameElapsed || (Date.now() - this.gameStartTime) / 1000);
    const mins = Math.floor(elapsed / 60), secs = elapsed % 60;
    const killedReaper = this._deathReaperSpawned;

    // Bonus vàng đặc biệt nếu giết Tử Thần
    if (killedReaper) {
      this.totalGold += 5000;
      showToast('🏆 +5000🪙 THƯỞNG DIỆT TỬ THẦN!', '#fbbf24');
    }

    // Check unlocks
    let unlockedMsg = '';
    if (this.selectedStage === 1 && !savedData.unlockedStages.includes(2)) {
      savedData.unlockedStages.push(2);
      unlockedMsg += '🔓 Mở khóa Stage 2: Thư Viện Cổ!\n';
    } else if (this.selectedStage === 2 && !savedData.unlockedStages.includes(3)) {
      savedData.unlockedStages.push(3);
      unlockedMsg += '🔓 Mở khóa Stage 3: Hầm Ngục Hư Vô!\n';
    }

    if ((this.player.level >= 20 || this.totalKills >= 500) && savedData.unlockedPassives) {
      if (!savedData.unlockedPassives.includes('attractorb')) {
        savedData.unlockedPassives.push('attractorb');
        unlockedMsg += '🔓 Mở khóa vật phẩm: Nam Châm (Attractorb)!\n';
      }
      if (!savedData.unlockedPassives.includes('clover')) {
        savedData.unlockedPassives.push('clover');
        unlockedMsg += '🔓 Mở khóa vật phẩm: Cỏ 4 Lá (Clover)!\n';
      }
    }

    savedData.gold += this.totalGold;
    savedData.lastGoldEarned = this.totalGold;
    savedData.lastRunGhost = {
      clsKey: this.clsKey,
      level: this.player.level,
      skills: this.skills.map(s => s.id),
      name: this.player.name || this.cls.name
    };
    saveToDisk();
    
    // Update Stage UI
    if (typeof updateStageLockDisplay === 'function') updateStageLockDisplay();

    setTimeout(() => {
      document.getElementById('pveGame').classList.add('hidden');
      document.getElementById('pveVictory').classList.remove('hidden');
      document.getElementById('vicKills').textContent  = this.totalKills;
      document.getElementById('vicTime').textContent   = `${mins}:${secs.toString().padStart(2,'0')}`;
      document.getElementById('vicGold').textContent   = this.totalGold;
      document.getElementById('vicSkills').textContent = this.skills.length;
      // Hiển thị thông báo đặc biệt nếu kill Tử Thần
      const vicTitle = document.getElementById('vicTitle');
      if (vicTitle) {
        vicTitle.textContent = killedReaper
          ? '💀 TỬ THẦN ĐÃ BỊ TIÊU DIỆT — CHIẾN THẮNG TUYỆT ĐỐI!'
          : '🏆 CHIẾN THẮNG!';
      }
      if (unlockedMsg) {
        showToast(unlockedMsg, '#34d399');
      }
    }, killedReaper ? 2500 : 800);
  }


  // ──────────────────────────────────────────────
  // HUD UPDATE
  // ──────────────────────────────────────────────
  updateHud() {
    const p = this.player;
    const hpPct = p.hp / p.maxHp * 100;
    const xpPct = p.xp / p.xpToNext * 100;
    const hpEl  = document.getElementById('pveHpBar');
    const xpEl  = document.getElementById('pveXpBar');
    if (hpEl) hpEl.style.width = hpPct + '%';
    if (xpEl) xpEl.style.width = xpPct + '%';
    const wEl = document.getElementById('pveWaveNum');
    const tEl = document.getElementById('pveTimerNum');
    const gEl = document.getElementById('pveGoldNum');
    const kEl = document.getElementById('pveKillNum');
    if (wEl) wEl.textContent = `Wave ${this.wave}/${this.maxVisualWave || 30}`;
    if (gEl) gEl.textContent = this.totalGold;
    if (kEl) kEl.textContent = this.totalKills;

    // Update Day-Night cycle pill
    const cycleEl = document.getElementById('pveCycleNum');
    const cycleIconEl = document.getElementById('pveCycleIcon');
    const cycleDisp = document.getElementById('pveCycleDisplay');
    if (cycleEl) {
      if (this.dayNightCycle === 'day') {
        cycleEl.textContent = 'Ngày';
        if (cycleIconEl) cycleIconEl.textContent = '☀️';
        if (cycleDisp) {
          cycleDisp.style.background = 'rgba(251, 191, 36, 0.2)';
          cycleDisp.style.borderColor = 'rgba(251, 191, 36, 0.4)';
        }
      } else {
        cycleEl.textContent = 'Đêm';
        if (cycleIconEl) cycleIconEl.textContent = '🌙';
        if (cycleDisp) {
          cycleDisp.style.background = 'rgba(129, 140, 248, 0.2)';
          cycleDisp.style.borderColor = 'rgba(129, 140, 248, 0.4)';
        }
      }
    }

    // Update Weather event pill
    const weatherEl = document.getElementById('pveWeatherNum');
    const weatherIconEl = document.getElementById('pveWeatherIcon');
    const weatherDisp = document.getElementById('pveWeatherDisplay');
    if (weatherDisp) {
      if (this.currentWeather === 'clear') {
        weatherDisp.classList.add('hidden');
      } else {
        weatherDisp.classList.remove('hidden');
        if (this.currentWeather === 'thunderstorm') {
          if (weatherEl) weatherEl.textContent = 'Bão Sét';
          if (weatherIconEl) weatherIconEl.textContent = '⛈️';
          weatherDisp.style.background = 'rgba(234, 179, 8, 0.2)';
          weatherDisp.style.borderColor = 'rgba(234, 179, 8, 0.4)';
        } else if (this.currentWeather === 'blizzard') {
          if (weatherEl) weatherEl.textContent = 'Bão Tuyết';
          if (weatherIconEl) weatherIconEl.textContent = '❄️';
          weatherDisp.style.background = 'rgba(56, 189, 248, 0.2)';
          weatherDisp.style.borderColor = 'rgba(56, 189, 248, 0.4)';
        } else if (this.currentWeather === 'solar_flare') {
          if (weatherEl) weatherEl.textContent = 'Solar Flare';
          if (weatherIconEl) weatherIconEl.textContent = '☀️🔥';
          weatherDisp.style.background = 'rgba(239, 68, 68, 0.2)';
          weatherDisp.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        }
      }
    }

    // Update Merchant Rescue countdown pill
    const rescueDisp = document.getElementById('pveRescueDisplay');
    const rescueEl = document.getElementById('pveRescueNum');
    if (rescueDisp) {
      if (this.merchantRescueActive) {
        rescueDisp.classList.remove('hidden');
        if (rescueEl) rescueEl.textContent = `Cứu ${Math.round(this.merchantRescueTimer)}s`;
      } else {
        rescueDisp.classList.add('hidden');
      }
    }
  }

  // ──────────────────────────────────────────────
  // SCREEN SHAKE
  // ──────────────────────────────────────────────
  screenShake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeUntil = Date.now() + duration * 1000;
  }

  // ──────────────────────────────────────────────
  // INPUT
  // ──────────────────────────────────────────────
  setupInput() {
    this._kd = (e) => {
      this.keys[e.code] = true;

      // Phím I: toggle Powerup Panel trong game
      if (e.code === 'KeyI' && this.running) {
        e.preventDefault();
        this._toggleInGamePowerupPanel();
      }
      // Phím E: mở cửa hàng thương nhân, kích hoạt đền thờ, hoặc bàn thờ giao kèo ác quỷ
      if (e.code === 'KeyE' && this.running && !this.paused) {
        // 1. Check if near Merchant
        if (this.merchant && this.merchant.active) {
          const dist = Math.hypot(this.player.x - this.merchant.x, this.player.y - this.merchant.y);
          if (dist < 90) {
            e.preventDefault();
            this.openMerchantShop();
            return;
          }
        }
        
        // 2. Check if near Shrines
        if (this.shrines) {
          for (let s of this.shrines) {
            if (s.active) {
              const dist = Math.hypot(this.player.x - s.x, this.player.y - s.y);
              if (dist < 80) {
                e.preventDefault();
                this.activateShrine(s);
                return;
              }
            }
          }
        }
        
        // 3. Check if near Demonic Altar
        if (this.demonicAltar && this.demonicAltar.active) {
          const dist = Math.hypot(this.player.x - this.demonicAltar.x, this.player.y - this.demonicAltar.y);
          if (dist < 80) {
            e.preventDefault();
            this.openDemonicAltar();
            return;
          }
        }
      }
      // Phím P: toggle pause hoặc đóng panel
      if (e.code === 'KeyP' && this.running) {
        e.preventDefault();
        if (this._inGamePowerupOpen) {
          this._closeInGamePowerupPanel();
        } else if (this._merchantShopOpen) {
          this.closeMerchantShop();
        } else if (this._demonicAltarOpen) {
          this.closeDemonicAltarModal();
        } else if (!this.paused) {
          this.pause();
        } else {
          this.resume();
        }
      }
      // Phím Escape: đóng panels (KHÔNG pause game để tránh Electron co màn hình)
      if (e.code === 'Escape') {
        e.preventDefault();
        if (this._inGamePowerupOpen) {
          this._closeInGamePowerupPanel();
        } else if (this._merchantShopOpen) {
          this.closeMerchantShop();
        } else if (this._demonicAltarOpen) {
          this.closeDemonicAltarModal();
        }
      }
    };
    this._ku = (e) => { this.keys[e.code] = false; };
    window.addEventListener('keydown', this._kd);
    window.addEventListener('keyup',   this._ku);

    // Touch joystick (simple)
    this.canvas.addEventListener('touchstart', (e) => { this._touchStart(e); }, { passive: false });
    this.canvas.addEventListener('touchmove',  (e) => { this._touchMove(e);  }, { passive: false });
    this.canvas.addEventListener('touchend',   (e) => { this.joystickVec = null; }, { passive: false });
  }

  _toggleInGamePowerupPanel() {
    if (this._inGamePowerupOpen) {
      this._closeInGamePowerupPanel();
    } else {
      this._openInGamePowerupPanel();
    }
  }

  _openInGamePowerupPanel() {
    this._inGamePowerupOpen = true;
    this.pause();

    // Tạo overlay panel trong game
    let panel = document.getElementById('inGamePowerupPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'inGamePowerupPanel';
      panel.style.cssText = `
        position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
        background:rgba(10,10,20,0.97);border:1px solid rgba(167,139,250,0.3);
        border-radius:18px;padding:24px 28px;z-index:9999;width:min(680px,95vw);
        max-height:80vh;overflow-y:auto;box-shadow:0 0 60px rgba(167,139,250,0.2);
        backdrop-filter:blur(20px);
      `;
      document.body.appendChild(panel);
    }

    // Render powerup grid
    const pu = (this.save && this.save.powerups) ? this.save.powerups : {};
    let html = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <div style="font-size:18px;font-weight:800;color:#a78bfa;">⚡ Nâng Cấp Vĩnh Viễn</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:13px;color:#fbbf24;font-weight:700;">🪙 ${savedData.gold + this.totalGold}</span>
          <button onclick="G._closeInGamePowerupPanel()" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#fff;padding:6px 14px;cursor:pointer;font-size:13px;">✕ Đóng [Esc]</button>
        </div>
      </div>
      <div style="font-size:11px;color:#64748b;margin-bottom:16px;">Vàng chi tiêu sẽ được khấu trừ từ tổng vàng kiếm được. Có hiệu lực từ màn chơi tiếp theo.</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
    `;

    Object.entries(POWERUP_DEFS).forEach(([id, def]) => {
      const lvl = pu[id] || 0;
      const maxed = lvl >= def.maxLevel;
      const cost = maxed ? 0 : Math.round(def.baseCost * Math.pow(def.costScale, lvl));
      const canAfford = (savedData.gold + this.totalGold) >= cost;
      html += `
        <div style="background:rgba(255,255,255,0.04);border:1px solid ${maxed ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.1)'};border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:12px;">
          <span style="font-size:22px;">${def.icon}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:13px;color:${maxed ? '#fbbf24' : '#e2e8f0'};">${def.name} <span style="color:#64748b;font-weight:400;font-size:11px;">LV ${lvl}/${def.maxLevel}</span></div>
            <div style="font-size:10px;color:#64748b;margin-top:2px;line-height:1.4;">${def.desc}</div>
          </div>
          ${maxed
            ? `<div style="font-size:11px;color:#fbbf24;font-weight:700;white-space:nowrap;">MAX ✓</div>`
            : `<button onclick="G._buyPowerupInGame('${id}')" style="background:${canAfford ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)'};border:1px solid ${canAfford ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.1)'};border-radius:8px;color:${canAfford ? '#a78bfa' : '#475569'};padding:5px 10px;cursor:${canAfford ? 'pointer' : 'default'};font-size:11px;font-weight:700;white-space:nowrap;">🪙 ${cost}</button>`
          }
        </div>
      `;
    });

    html += `</div>`;
    panel.innerHTML = html;
    panel.style.display = 'block';
  }

  _buyPowerupInGame(id) {
    const def = POWERUP_DEFS[id];
    if (!def) return;
    const pu = (this.save && this.save.powerups) ? this.save.powerups : {};
    const lvl = pu[id] || 0;
    if (lvl >= def.maxLevel) return;
    const cost = Math.round(def.baseCost * Math.pow(def.costScale, lvl));
    const totalAvail = (savedData.gold || 0) + this.totalGold;
    if (totalAvail < cost) { showToast('Không đủ vàng!', '#ef4444'); return; }

    // Deduct from savedData.gold first, then totalGold
    if (savedData.gold >= cost) {
      savedData.gold -= cost;
    } else {
      const remaining = cost - savedData.gold;
      savedData.gold = 0;
      this.totalGold = Math.max(0, this.totalGold - remaining);
    }

    if (!this.save.powerups) this.save.powerups = {};
    this.save.powerups[id] = (this.save.powerups[id] || 0) + 1;
    saveToDisk();
    showToast(`✅ ${def.name} → LV ${this.save.powerups[id]}!`, '#a78bfa');

    // Re-render panel với gold mới
    this._openInGamePowerupPanel();
  }

  _closeInGamePowerupPanel() {
    this._inGamePowerupOpen = false;
    const panel = document.getElementById('inGamePowerupPanel');
    if (panel) panel.style.display = 'none';
    this.resume();
  }

  openMerchantShop() {
    this._merchantShopOpen = true;
    this.pause();

    const goldEl = document.getElementById('merchantGoldAmount');
    if (goldEl) goldEl.textContent = '🪙 ' + this.totalGold;

    // Build Merchant Shop cards
    const cardsContainer = document.getElementById('merchantCards');
    if (cardsContainer) {
      cardsContainer.innerHTML = '';
      const shopItems = [
        { id: 'chicken', name: '🍗 Đùi Gà Nướng', icon: '🍗', cost: 15, desc: 'Hồi phục ngay lập tức 50 HP.' },
        { id: 'gold_egg', name: '🥚 Trứng Vàng', icon: '🥚', cost: 45, desc: '+3% ngẫu nhiên 1 chỉ số vĩnh viễn trong trận (ATK/DEF/SPD/CRIT/CD).' },
        { id: 'super_vacuum', name: '🧲 Nam Châm cực đại', icon: '🧲', cost: 30, desc: 'Kích hoạt lực hút cực đại gom toàn bộ ngọc trên bản đồ.' },
        { id: 'reroll_die', name: '🎲 Xúc Xắc hồi chiêu', icon: '🎲', cost: 35, desc: 'Tăng thêm +1 lượt Reroll lựa chọn nâng cấp.' },
        { id: 'invuln_potion', name: '🧪 Thuốc Bất Tử', icon: '🧪', cost: 60, desc: 'Nhận trạng thái bất tử hoàn toàn trong 8 giây.' }
      ];

      const mult = this.merchantPriceDiscount || 1.0;
      shopItems.forEach(item => {
        const finalCost = Math.round(item.cost * mult);
        const card = document.createElement('div');
        card.className = 'upgrade-card merchant-item';
        card.style.cssText = `--card-color: #fbbf24; --card-glow: rgba(251, 191, 36, 0.35); width: auto; min-width: 170px;`;
        
        card.innerHTML = `
          <div class="up-icon" style="font-size: 32px; margin-bottom: 8px;">${item.icon}</div>
          <div class="up-name" style="font-size: 15px; font-weight: 800; color: #fff; margin-bottom: 6px;">${item.name}</div>
          <div class="up-desc" style="font-size: 11px; color: #94a3b8; line-height: 1.4; min-height: 38px; margin-bottom: 12px;">${item.desc}</div>
          <button class="pve-btn pve-btn-primary" style="margin: 0; width: 100%; font-weight: 800; padding: 6px 0; font-size: 13px; text-shadow: 0 0 4px #000;" ${this.totalGold < finalCost ? 'disabled style="background: #374151; color: #94a3b8; cursor: not-allowed; border-color: #4b5563;"' : ''}>MUA ${finalCost} 🪙</button>
        `;

        const btn = card.querySelector('button');
        if (this.totalGold >= finalCost) {
          btn.onclick = () => {
            this.buyMerchantItem(item.id, finalCost, item.name);
            this.openMerchantShop(); // Refresh UI
          };
        }
        cardsContainer.appendChild(card);
      });
    }

    const screen = document.getElementById('merchantShopModal');
    if (screen) screen.classList.remove('hidden');
  }

  closeMerchantShop() {
    this._merchantShopOpen = false;
    const screen = document.getElementById('merchantShopModal');
    if (screen) screen.classList.add('hidden');
    this.resume();
  }

  triggerBossEncounter(typeId) {
    const def = ENEMY_TYPES[typeId];
    if (!def) return;
    
    this.pause();
    
    const modal = document.getElementById('bossEncounterModal');
    const nameEl = document.getElementById('bossEncName');
    const emojiEl = document.getElementById('bossEncEmoji');
    const descEl = document.getElementById('bossEncDesc');
    
    if (modal && nameEl && emojiEl && descEl) {
      nameEl.textContent = def.name;
      emojiEl.textContent = def.emoji;
      
      const customDescs = {
        boss_slime_king: "Vua Slime khổng lồ. Di chuyển chậm nhưng đè bẹp mọi thứ nó chạm vào. Triệu hồi Slime con liên tục.",
        boss_dark_lord: "Kẻ thống lĩnh đội quân bóng tối. Bắn cầu phép ma thuật tầm xa cực mạnh và có áo giáp bảo vệ vững chắc.",
        boss_dragon_queen: "Nữ hoàng của loài rồng lửa. Khè ra 5 tia lửa cực nóng thiêu rụi mọi thứ cản đường.",
        boss_void_titan: "Titan cổ đại thức tỉnh từ Hư vô. Sức phòng thủ cực cao, cuồng nộ khi yếu máu, giẫm đạp tạo chấn động lớn.",
        boss_death_herald: "Kẻ báo hiệu ngày phán xét. Di chuyển cực nhanh, tàng hình và liên tục triệu hồi xương sát thủ cản bước.",
        boss_reaper_form1: "Hình bóng đen tối của Thần Chết xuất hiện báo hiệu thời gian sinh tồn sắp cạn kiệt.",
        boss_death_reaper: "Tử Thần Tối Thượng xuất hiện lúc 30 phút để tước đoạt sinh mạng của bạn. Chỉ kẻ mạnh nhất mới có thể tiêu diệt được hắn!"
      };
      
      descEl.textContent = customDescs[typeId] || def._desc || "Thần thú hung hãn cổ đại sở hữu sức mạnh hủy diệt và bộ kỹ năng cực kỳ bá đạo.";
      
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
    }
  }

  confirmSuicide() {
    if (!this.running) return;
    this.pause();
    const existing = document.getElementById('suicideConfirmModal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'suicideConfirmModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;pointer-events:all;';
    modal.innerHTML = `<div style='background:#1a0000;border:2px solid #ef4444;border-radius:16px;padding:32px 40px;text-align:center;max-width:360px;'><div style='font-size:48px;margin-bottom:8px;'>☠️</div><h2 style='color:#fca5a5;margin:0 0 8px;font-size:22px;'>Đầu Hàng?</h2><p style='color:#94a3b8;margin-bottom:24px;font-size:14px;'>Trận đấu sẽ kết thúc. Bạn có chắc không?</p><div style='display:flex;gap:12px;justify-content:center;'><button onclick='document.getElementById(\"suicideConfirmModal\").remove();if(G)G.resume();' style='background:#374151;border:1px solid #6b7280;color:#d1d5db;border-radius:8px;padding:10px 24px;font-size:14px;font-weight:700;cursor:pointer;'>Tiếp Tục</button><button onclick='document.getElementById(\"suicideConfirmModal\").remove();if(G){G.stop();G=null;}goToLobby();' style='background:linear-gradient(135deg,#7f1d1d,#450a0a);border:1px solid #ef4444;color:#fca5a5;border-radius:8px;padding:10px 24px;font-size:14px;font-weight:700;cursor:pointer;'>☠ Đầu Hàng</button></div></div>`;
    document.body.appendChild(modal);
  }

  buyMerchantItem(id, cost, name) {
    if (this.totalGold < cost) {
      showToast('Không đủ vàng trong trận!', '#f87171');
      return;
    }

    this.totalGold -= cost;
    const p = this.player;

    // Apply item logic
    if (id === 'chicken') {
      p.hp = Math.min(p.maxHp, p.hp + 50);
      this.spawnParticles(p.x, p.y, '#4ade80', 25, 4);
      this.addFloat(p.x, p.y - 40, '+50 HP 🍗', '#4ade80', true);
      showToast('🍗 Đùi Gà Nướng: +50 HP!', '#4ade80');
    } 
    else if (id === 'gold_egg') {
      const stats = ['atkMult', 'defMult', 'spdMult', 'critChance', 'cdMult'];
      const chosen = stats[Math.floor(Math.random() * stats.length)];
      let statLabel = '';
            if (chosen === 'cdMult') {
        p.eggCdBonus = (p.eggCdBonus || 0.0) + 0.03;
        this.recalculatePassiveStats();
        statLabel = '-3% Hồi Chiêu ⏱️';
      } else if (chosen === 'critChance') {
        p.eggCritBonus = (p.eggCritBonus || 0.0) + 0.03;
        this.recalculatePassiveStats();
        statLabel = '+3% Chí Mạng ⚡';
      } else if (chosen === 'atkMult') {
        p.eggDmgBonus = (p.eggDmgBonus || 0.0) + 0.03;
        this.recalculatePassiveStats();
        statLabel = '+3% Tấn Công ⚔️';
      } else if (chosen === 'defMult') {
        p.eggDefBonus = (p.eggDefBonus || 0.0) + 0.03;
        this.recalculatePassiveStats();
        statLabel = '+3% Phòng Thủ 🛡️';
      } else {
        p.eggSpdMultBonus = (p.eggSpdMultBonus || 0.0) + 0.03;
        this.recalculatePassiveStats();
        statLabel = '+3% Tốc Độ 💨';
      }
      this.spawnParticles(p.x, p.y, '#fbbf24', 30, 4.5);
      this.addFloat(p.x, p.y - 40, statLabel, '#fbbf24', true);
      showToast(`🥚 TRỨNG VÀNG: ${statLabel}!`, '#fbbf24');
    }
    else if (id === 'super_vacuum') {
      this.autoVacuumActive = true;
      setTimeout(() => { this.autoVacuumActive = false; }, 3000);
      this.spawnParticles(p.x, p.y, '#38bdf8', 25, 4);
      showToast('🧲 Kích hoạt lực hút ngọc cực đại!', '#38bdf8');
      this.closeMerchantShop();
      return;
    }
    else if (id === 'reroll_die') {
      this.rerolls = (this.rerolls || 0) + 1;
      this.spawnParticles(p.x, p.y, '#a855f7', 20, 4);
      showToast('+1 Lượt Reroll! 🎲', '#a855f7');
    }
    else if (id === 'invuln_potion') {
      p.invulnUntil = Date.now() + 8000;
      this.spawnParticles(p.x, p.y, '#fbbf24', 35, 5);
      showToast('🧪 Bất tử hoàn toàn trong 8 giây!', '#fde68a');
      this.closeMerchantShop();
      return;
    }

    // Refresh display
    this.openMerchantShop();
  }



  removeInput() {
    window.removeEventListener('keydown', this._kd);
    window.removeEventListener('keyup',   this._ku);
  }

  _touchStart(e) {
    e.preventDefault();
    const t = e.touches[0];
    this._touchOrigin = { x: t.clientX, y: t.clientY };
    this.joystickVec = { x: 0, y: 0 };
  }
  _touchMove(e) {
    e.preventDefault();
    if (!this._touchOrigin) return;
    const t = e.touches[0];
    const dx = t.clientX - this._touchOrigin.x;
    const dy = t.clientY - this._touchOrigin.y;
    const len = Math.hypot(dx, dy);
    const maxLen = 60;
    this.joystickVec = len > 0 ? { x: dx / Math.max(len, maxLen), y: dy / Math.max(len, maxLen) } : { x:0, y:0 };
  }

  // ──────────────────────────────────────────────
  // RESIZE
  // ──────────────────────────────────────────────
  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  // ──────────────────────────────────────────────
  // DRAW
  // ──────────────────────────────────────────────
  draw() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;
    const p = this.player;

    // Screen shake offset
    let sx = 0, sy = 0;
    if (this.shakeUntil && Date.now() < this.shakeUntil) {
      const t = (this.shakeUntil - Date.now()) / 1000;
      const intensity = this.shakeIntensity * t;
      sx = (Math.random() - 0.5) * intensity;
      sy = (Math.random() - 0.5) * intensity;
    }

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.translate(W/2 - this.cam.x, H/2 - this.cam.y);

    // Draw background layers
    this.drawWorld(ctx, W, H);
    this.drawHazards_(ctx);

    // 2.5D Depth Engine: Pool all renderable objects for Z-sorting (Y-axis sorting)
    const renderQueue = [];

    // Push static 2.5D obstacles (trees, rocks, crates)
    if (this.staticObstacles) {
      this.staticObstacles.forEach(obs => {
        // Culling: Only render if inside camera view bounding box + padding
        if (Math.abs(obs.x - this.cam.x) < W/2 + 100 && Math.abs(obs.y - this.cam.y) < H/2 + 150) {
          renderQueue.push({
            type: 'obstacle',
            y: obs.y, // Pivot bottom Y
            draw: () => {
              if (obs.type === 'tree') this.drawTree(ctx, obs);
              else if (obs.type === 'rock') this.drawRock(ctx, obs);
              else if (obs.type === 'crate') this.drawCrate(ctx, obs);
              else if (obs.type === 'bookcase') this.drawBookcase(ctx, obs);
              else if (obs.type === 'void_pillar') this.drawVoidPillar(ctx, obs);
              
              // Draw HP bar for damaged obstacles
              if (obs.hp < obs.maxHp) {
                const barW = obs.r * 1.5;
                const barH = 5;
                const bx = obs.x - barW / 2;
                const by = obs.y - obs.r - 25;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(bx, by, barW, barH);
                ctx.fillStyle = '#10b981';
                ctx.fillRect(bx, by, barW * (obs.hp / obs.maxHp), barH);
              }
            }
          });
        }
      });
    }

    // Push Shrines (Round 3)
    if (this.shrines) {
      this.shrines.forEach(s => {
        if (Math.abs(s.x - this.cam.x) < W/2 + 100 && Math.abs(s.y - this.cam.y) < H/2 + 100) {
          renderQueue.push({
            type: 'shrine',
            y: s.y,
            draw: () => {
              this.drawShrine(ctx, s);
            }
          });
        }
      });
    }

    // Push Demonic Altar (Round 3)
    if (this.demonicAltar && this.demonicAltar.active) {
      const alt = this.demonicAltar;
      if (Math.abs(alt.x - this.cam.x) < W/2 + 100 && Math.abs(alt.y - this.cam.y) < H/2 + 100) {
        renderQueue.push({
          type: 'demonic_altar',
          y: alt.y,
          draw: () => {
            this.drawDemonicAltar(ctx, alt);
          }
        });
      }
    }

    // Push Merchant NPC
    if (this.merchant && this.merchant.active) {
      const m = this.merchant;
      if (Math.abs(m.x - this.cam.x) < W/2 + 100 && Math.abs(m.y - this.cam.y) < H/2 + 100) {
        renderQueue.push({
          type: 'merchant',
          y: m.y,
          draw: () => {
            this.drawMerchant(ctx, m);
          }
        });
      }
    }

    // Push Boss Chests
    if (this.bossChests) {
      this.bossChests.forEach(chest => {
        if (Math.abs(chest.x - this.cam.x) < W/2 + chest.r + 50 && Math.abs(chest.y - this.cam.y) < H/2 + chest.r + 50) {
          renderQueue.push({
            type: 'boss_chest',
            y: chest.y,
            draw: () => {
              this.drawBossChest(ctx, chest);
            }
          });
        }
      });
    }

    // Push friendly summons
    this.summons.forEach(s => {
      if (Math.abs(s.x - this.cam.x) < W/2 + s.r + 50 && Math.abs(s.y - this.cam.y) < H/2 + s.r + 50) {
        renderQueue.push({
          type: 'summon',
          y: s.y,
          draw: () => {
            this.drawSingleSummon(ctx, s);
          }
        });
      }
    });

    // Push active enemies
    this.enemies.forEach(e => {
      if (e.hp <= 0) return;
      if (Math.abs(e.x - this.cam.x) < W/2 + e.r + 50 && Math.abs(e.y - this.cam.y) < H/2 + e.r + 50) {
        renderQueue.push({
          type: 'enemy',
          y: e.y,
          draw: () => {
            this.drawSingleEnemy(ctx, e);
          }
        });
      }
    });

    // Push player
    renderQueue.push({
      type: 'player',
      y: p.y,
      draw: () => {
        this.drawPlayer(ctx);
      }
    });

    // Sort render queue by Y (depth sorting)
    renderQueue.sort((a, b) => a.y - b.y);

    // Render Y-sorted queue
    renderQueue.forEach(item => item.draw());

    // Top-layer rendering (projectiles, floating texts, particles)
    this.drawProjectiles_(ctx);
    this.drawSlashEffects(ctx);
    this.drawParticles_(ctx);
    
    // Draw pre-rendered frame animations
    this.frameAnimations.forEach(anim => {
      const frames = this.spriteSheets[anim.spriteName];
      if (frames && frames[anim.frame]) {
        ctx.save();
        ctx.translate(anim.x, anim.y);
        if (anim.angle !== undefined) ctx.rotate(anim.angle);
        const size = anim.r;
        ctx.drawImage(frames[anim.frame], -size, -size, size * 2, size * 2);
        ctx.restore();
      }
    });

    this.drawFloats(ctx);

    ctx.restore();

    // Vignette overlay
    const vignette = ctx.createRadialGradient(W/2, H/2, Math.min(W, H) * 0.45, W/2, H/2, Math.max(W, H) * 0.85);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(3, 2, 8, 0.65)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // Weather and Night overlays (Round 3)
    this.drawNightOverlay(ctx);
    this.drawWeatherEffects(ctx);

    // ── DEATH PRESENCE EFFECT (Red Death gần) ─────────────────
    // Màn hình tối dần + ánh đỏ tím khi Tử Thần tiếp cận
    if (this._deathPresenceIntensity && this._deathPresenceIntensity > 0) {
      const dp = this._deathPresenceIntensity;
      // Dark vignette đỏ tím từ góc màn hình
      const dpGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H));
      dpGrad.addColorStop(0, `rgba(0, 0, 0, ${dp * 0.3})`);
      dpGrad.addColorStop(0.6, `rgba(50, 0, 20, ${dp * 0.4})`);
      dpGrad.addColorStop(1, `rgba(100, 0, 0, ${dp * 0.7})`);
      ctx.fillStyle = dpGrad;
      ctx.fillRect(0, 0, W, H);

      // Tia đỏ tím nhấp nháy ở góc màn hình
      if (Math.random() < dp * 0.3) {
        ctx.fillStyle = `rgba(120, 0, 40, ${Math.random() * dp * 0.15})`;
        ctx.fillRect(0, 0, W, H);
      }
    }
    // Giảm Death Presence dần nếu reaper không còn
    if (!this.enemies.some(e => e.type === 'boss_death_reaper')) {
      this._deathPresenceIntensity = Math.max(0, (this._deathPresenceIntensity || 0) - 0.01);
    }

    this.drawMinimap();
  }



  drawMinimap() {
    const canvas = document.getElementById('pveMinimap');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    const scale = w / WORLD_W;
    const p = this.player;
    
    // Draw map border
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, h);
    
    // Draw hazards (Consecration, Briar, etc.)
    this.hazards.forEach(hz => {
      const hx = hz.x * scale;
      const hy = hz.y * scale;
      const hr = hz.r * scale;
      ctx.beginPath();
      ctx.arc(hx, hy, Math.max(1.5, hr), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
      ctx.fill();
    });
    
    // Draw summons
    this.summons.forEach(s => {
      const sx = s.x * scale;
      const sy = s.y * scale;
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#34d399';
      ctx.fill();
    });
    
    // Draw enemies
    this.enemies.forEach(e => {
      if (e.hp <= 0) return;
      const ex = e.x * scale;
      const ey = e.y * scale;
      
      ctx.beginPath();
      if (e.isBoss) {
        const pulse = 3 + Math.sin(Date.now() / 150) * 1.5;
        ctx.arc(ex, ey, pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
      } else {
        ctx.arc(ex, ey, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = '#f87171';
        ctx.fill();
      }
    });
    
    // Draw player
    const px = p.x * scale;
    const py = p.y * scale;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(p.angle);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(-3, -3);
    ctx.lineTo(-1.5, 0);
    ctx.lineTo(-3, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawWorld(ctx, W, H) {
    const time = Date.now();
    const tileSize = 96;
    
    // Themes depending on Stage selection
    let bgColor = '#06050b';
    let evenColor = '#0c0a15';
    let oddColor = '#0e0c1b';
    let gridColor = 'rgba(124, 58, 237, 0.04)';
    let borderShadow = '#8b5cf6';
    let borderStroke = '#a855f7';
    
    if (this.selectedStage === 1) { // Green meadows
      bgColor = '#030805';
      evenColor = '#07120a';
      oddColor = '#0b1a0f';
      gridColor = 'rgba(52, 211, 153, 0.03)';
      borderShadow = '#10b981';
      borderStroke = '#34d399';
    } else if (this.selectedStage === 2) { // Old library
      bgColor = '#0a0604';
      evenColor = '#160f0b';
      oddColor = '#1d130e';
      gridColor = 'rgba(245, 158, 11, 0.03)';
      borderShadow = '#f59e0b';
      borderStroke = '#fbbf24';
    } else if (this.selectedStage === 3) { // Void dungeon
      bgColor = '#040209';
      evenColor = '#090514';
      oddColor = '#120a24';
      gridColor = 'rgba(168, 85, 247, 0.05)';
      borderShadow = '#8b5cf6';
      borderStroke = '#a855f7';
    }
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(this.cam.x - W/2 - tileSize, this.cam.y - H/2 - tileSize, W + tileSize * 2, H + tileSize * 2);
    
    const startX = Math.floor((this.cam.x - W / 2) / tileSize) * tileSize - tileSize;
    const startY = Math.floor((this.cam.y - H / 2) / tileSize) * tileSize - tileSize;
    const endX   = startX + W + tileSize * 2;
    const endY   = startY + H + tileSize * 2;
    
    for (let x = startX; x < endX; x += tileSize) {
      for (let y = startY; y < endY; y += tileSize) {
        if (x < 0 || x > WORLD_W - 5 || y < 0 || y > WORLD_H - 5) continue;
        
        const isEven = (Math.floor(x/tileSize) + Math.floor(y/tileSize)) % 2 === 0;
        
        const tileCanvas = this.selectedStage === 1 ? (isEven ? this.grassTileCanvasA : this.grassTileCanvasB) :
                           this.selectedStage === 2 ? (isEven ? this.libraryTileCanvasA : this.libraryTileCanvasB) :
                           (isEven ? this.voidTileCanvasA : this.voidTileCanvasB);
        ctx.drawImage(tileCanvas, x, y, tileSize, tileSize);
      }
    }
    
    // Spores
    ctx.save();
    this.bgSpores.forEach(s => {
      if (Math.abs(s.x - this.cam.x) > W/2 + 20 || Math.abs(s.y - this.cam.y) > H/2 + 20) return;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = 0.08 + Math.sin(s.pulse) * 0.06;
      ctx.fill();
    });
    ctx.restore();
    
    // World border
    const marginX = W / 2 + 50;
    const marginY = H / 2 + 50;
    if (this.cam.x < marginX || this.cam.x > WORLD_W - marginX ||
        this.cam.y < marginY || this.cam.y > WORLD_H - marginY) {
      ctx.save();
      ctx.shadowBlur = 20 + Math.sin(time / 200) * 10;
      ctx.shadowColor = borderShadow;
      ctx.strokeStyle = borderStroke;
      ctx.lineWidth = 6 + Math.sin(time / 100) * 2;
      ctx.strokeRect(0, 0, WORLD_W, WORLD_H);
      ctx.restore();
    }
  }

  drawPlayer(ctx) {
    const p = this.player;
    const t = Date.now();
    
    // Prepare sp and cp models compatible with drawCharacter
    const sp = {
      id: 'me',
      isPlayer: true,
      lvl: p.level,
      brnch: this.clsKey, // assassin, fighter, mage, ranger, paladin, necromancer, druid
      radius: p.r,
      angle: p.angle,
      a: p.angle,
      vx: this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : this.keys['KeyA'] || this.keys['ArrowLeft'] ? -1 : 0,
      vy: this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : this.keys['KeyW'] || this.keys['ArrowUp'] ? -1 : 0,
      shld: p.shieldHp > 0,
      rage: Date.now() < p.rallyUntil,
      stn: false,
      slw: false,
      dash: Date.now() < p.rallyUntil,
      stealth: p.invincible, // or just false
      isMorphed: p.isMorphed,
      hp: p.hp,
      mhp: p.maxHp,
      n: p.name || this.cls.name,
      equippedWeapon: this.save.equipped.weapon,
      equippedArmor: this.save.equipped.armor,
    };
    if (this.joystickVec) {
      sp.vx = this.joystickVec.x;
      sp.vy = this.joystickVec.y;
    }

    const cp = {
      x: p.x,
      y: p.y,
      lastHit: p.lastHitTime || 0,
      attackAnim: p.attackAnimObj || null,
      chatText: null,
      chatTTL: 0,
    };

    // Draw shadow blades orbital shurikens if owned!
    if (this.skills.some(s => s.id === 'shadow_blades')) {
      const s = this.skills.find(s => s.id === 'shadow_blades');
      const count = 3 + s.level;
      const radius = p.r + 30;
      const rot = (t / 150) % (Math.PI * 2);
      for (let i = 0; i < count; i++) {
        const a = rot + (i / count) * Math.PI * 2;
        ctx.save();
        ctx.translate(p.x + Math.cos(a) * radius, p.y + Math.sin(a) * radius);
        ctx.rotate((t / 25) % (Math.PI * 2));
        ctx.fillStyle = '#94a3b8'; ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let j = 0; j < 4; j++) {
          ctx.rotate(Math.PI / 2);
          ctx.moveTo(0, 0);
          ctx.lineTo(-2, -6);
          ctx.lineTo(0, -12);
          ctx.lineTo(2, -6);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }

    // Draw frost aura ring if owned!
    if (this.skills.some(s => s.id === 'frost_aura')) {
      const s = this.skills.find(s => s.id === 'frost_aura');
      const r = (120 + s.level * 30) * p.aoeMult;
      ctx.save();
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(147, 197, 253, ${0.15 + Math.sin(t/300)*0.05})`;
      ctx.lineWidth = 4 + Math.sin(t/150);
      ctx.stroke();
      ctx.fillStyle = `rgba(147, 197, 253, ${0.03 + Math.sin(t/300)*0.01})`;
      ctx.fill();
      ctx.restore();
    }

    // Draw magic casting circle under player when attacking or casting!
    if (p.attackAnimObj) {
      const elapsed = t - p.attackAnimObj.t;
      if (elapsed < p.attackAnimObj.duration) {
        const progress = elapsed / p.attackAnimObj.duration;
        const alpha = Math.sin(progress * Math.PI) * 0.75;
        ctx.save();
        ctx.globalAlpha = alpha;
        
        let color1 = '#a78bfa';
        let color2 = '#22d3ee';
        const type = this.clsKey;
        
        if (type === 'mage') { color1 = '#818cf8'; color2 = '#60a5fa'; }
        else if (type === 'necromancer') { color1 = '#581c87'; color2 = '#a855f7'; }
        else if (type === 'druid') { color1 = '#10b981'; color2 = '#34d399'; }
        else if (type === 'paladin') { color1 = '#fbbf24'; color2 = '#fffbeb'; }
        else if (type === 'fighter') { color1 = '#ef4444'; color2 = '#f97316'; }
        else if (type === 'ranger') { color1 = '#34d399'; color2 = '#6ee7b7'; }
        else if (type === 'assassin') { color1 = '#c084fc'; color2 = '#8b5cf6'; }
        
        ctx.translate(p.x, p.y);
        
        // Outer Ring (Rotates clockwise)
        ctx.save();
        ctx.rotate(t / 250);
        ctx.strokeStyle = color1;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = color1;
        ctx.beginPath();
        ctx.arc(0, 0, p.r * 2.0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Outer Runic Marks (dashed circle)
        ctx.strokeStyle = color2;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 12]);
        ctx.beginPath();
        ctx.arc(0, 0, p.r * 1.85, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        
        // Inner Star / Hexagon (Rotates counter-clockwise)
        ctx.save();
        ctx.rotate(-t / 300);
        ctx.strokeStyle = color2;
        ctx.lineWidth = 1.8;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color2;
        
        // Draw intersecting triangles (hexagram)
        ctx.beginPath();
        for (let j = 0; j < 3; j++) {
          const a = (j / 3) * Math.PI * 2;
          const tx = Math.cos(a) * p.r * 1.6;
          const ty = Math.sin(a) * p.r * 1.6;
          if (j === 0) ctx.moveTo(tx, ty);
          else ctx.lineTo(tx, ty);
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.beginPath();
        for (let j = 0; j < 3; j++) {
          const a = (j / 3) * Math.PI * 2 + Math.PI;
          const tx = Math.cos(a) * p.r * 1.6;
          const ty = Math.sin(a) * p.r * 1.6;
          if (j === 0) ctx.moveTo(tx, ty);
          else ctx.lineTo(tx, ty);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Inner core dashed ring
        ctx.strokeStyle = color1;
        ctx.lineWidth = 1.0;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, p.r * 1.15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        
        ctx.restore();
      }
    }

    drawCharacter(sp, cp, ctx);

    // Draw active pet companion (2.5D animated sprite)
    if (this.save && this.save.activePet) {
      const petId = this.save.activePet;
      const floatOffset = Math.sin(t * 0.0035) * 5;
      const orbitAngle = p.angle + Math.PI + Math.sin(t * 0.0009) * 0.3;
      const petX = p.x + Math.cos(orbitAngle) * (p.r + 28);
      const petY = p.y + Math.sin(orbitAngle) * (p.r + 28) + floatOffset;
      
      ctx.save();
      ctx.translate(petX, petY);

      // Ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 14, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (petId === 'corgi') {
        // ── CORGI: fluffy running dog with golden fur ──
        ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 12;
        // Body
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.ellipse(0, 0, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
        // Belly
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath(); ctx.ellipse(0, 3, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
        // Head
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.arc(11, -4, 8, 0, Math.PI * 2); ctx.fill();
        // Snout
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath(); ctx.ellipse(16, -2, 5, 3.5, 0.2, 0, Math.PI * 2); ctx.fill();
        // Nose
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.arc(18, -2, 1.5, 0, Math.PI * 2); ctx.fill();
        // Ears (floppy)
        ctx.fillStyle = '#d97706';
        ctx.beginPath(); ctx.moveTo(8, -10); ctx.lineTo(6, -18); ctx.lineTo(13, -13); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(13, -9); ctx.lineTo(15, -17); ctx.lineTo(18, -11); ctx.closePath(); ctx.fill();
        // Eyes
        ctx.fillStyle = '#1e293b'; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(13, -6, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(13.6, -6.5, 0.7, 0, Math.PI * 2); ctx.fill();
        // Tail (wagging)
        const wagAngle = Math.sin(t / 100) * 0.6;
        ctx.save(); ctx.translate(-12, -3); ctx.rotate(-wagAngle - 0.4);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.ellipse(0, 0, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // Running legs
        ctx.strokeStyle = '#d97706'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        const legSwing = Math.sin(t / 90);
        [[-6, 9, -0.4], [-1, 9, 0.4], [4, 9, -0.3], [9, 9, 0.3]].forEach(([lx, ly, phase], i) => {
          ctx.save(); ctx.translate(lx, ly);
          ctx.rotate(Math.sin(t / 90 + i * 1.3) * 0.4);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 7); ctx.stroke();
          ctx.restore();
        });

      } else if (petId === 'owl') {
        // ── OWL: wise owl with animated wings and glowing eyes ──
        ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 14;
        const wingFlap = Math.sin(t / 120) * 0.35;
        // Wings flapping
        ctx.fillStyle = '#6d28d9';
        ctx.save(); ctx.translate(-10, -2); ctx.rotate(-wingFlap);
        ctx.beginPath(); ctx.ellipse(0, 0, 11, 5, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.translate(10, -2); ctx.rotate(wingFlap);
        ctx.beginPath(); ctx.ellipse(0, 0, 11, 5, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // Body
        ctx.fillStyle = '#4c1d95';
        ctx.beginPath(); ctx.ellipse(0, 2, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
        // Belly feathers
        ctx.fillStyle = '#7c3aed';
        ctx.beginPath(); ctx.ellipse(0, 4, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
        // Head
        ctx.fillStyle = '#4c1d95';
        ctx.beginPath(); ctx.arc(0, -9, 8, 0, Math.PI * 2); ctx.fill();
        // Ear tufts
        ctx.fillStyle = '#6d28d9';
        ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(-8, -22); ctx.lineTo(-2, -16); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(6, -14); ctx.lineTo(8, -22); ctx.lineTo(2, -16); ctx.closePath(); ctx.fill();
        // Glowing eyes
        ctx.fillStyle = '#fbbf24'; ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(-3.5, -9, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3.5, -9, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(-3.5, -9, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3.5, -9, 1.8, 0, Math.PI * 2); ctx.fill();
        // Beak
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.moveTo(-2, -7); ctx.lineTo(0, -4); ctx.lineTo(2, -7); ctx.closePath(); ctx.fill();
        // Talons
        ctx.strokeStyle = '#6d28d9'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-4, 12); ctx.lineTo(-6, 17); ctx.moveTo(-4,12); ctx.lineTo(-2,18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, 12); ctx.lineTo(6, 17); ctx.moveTo(4,12); ctx.lineTo(2,18); ctx.stroke();

      } else if (petId === 'kitty') {
        // ── KITTY: playful cat with swishing tail ──
        ctx.shadowColor = '#ec4899'; ctx.shadowBlur = 12;
        // Tail (swishing)
        const tailSwing = Math.sin(t / 150) * 0.8;
        ctx.strokeStyle = '#f9a8d4'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.save(); ctx.translate(-12, 4); ctx.rotate(tailSwing - 0.5);
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-10, -12, -8, -20);
        ctx.stroke(); ctx.restore();
        // Body
        ctx.fillStyle = '#f9a8d4';
        ctx.beginPath(); ctx.ellipse(0, 3, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
        // Belly
        ctx.fillStyle = '#fce7f3';
        ctx.beginPath(); ctx.ellipse(0, 5, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
        // Head
        ctx.fillStyle = '#f9a8d4';
        ctx.beginPath(); ctx.arc(0, -8, 9, 0, Math.PI * 2); ctx.fill();
        // Ears
        ctx.fillStyle = '#f472b6';
        ctx.beginPath(); ctx.moveTo(-7, -14); ctx.lineTo(-10, -22); ctx.lineTo(-2, -16); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(7, -14); ctx.lineTo(10, -22); ctx.lineTo(2, -16); ctx.closePath(); ctx.fill();
        // Inner ear
        ctx.fillStyle = '#fce7f3';
        ctx.beginPath(); ctx.moveTo(-6, -15); ctx.lineTo(-8, -20); ctx.lineTo(-3, -16); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(6, -15); ctx.lineTo(8, -20); ctx.lineTo(3, -16); ctx.closePath(); ctx.fill();
        // Eyes (blinking)
        const blink = (Math.floor(t / 3000) % 8 === 0) ? 0.15 : 1.0;
        ctx.fillStyle = '#10b981'; ctx.shadowColor = '#10b981'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.ellipse(-3.5, -9, 3, 3 * blink, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(3.5, -9, 3, 3 * blink, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(-3.5, -9, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3.5, -9, 1.5, 0, Math.PI * 2); ctx.fill();
        // Whiskers
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(-14, -8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(-14, -4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(14, -8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(14, -4); ctx.stroke();
        // Nose
        ctx.fillStyle = '#f472b6';
        ctx.beginPath(); ctx.arc(0, -6, 1.5, 0, Math.PI * 2); ctx.fill();
        // Paws
        ctx.fillStyle = '#f9a8d4';
        ctx.beginPath(); ctx.ellipse(-5, 11, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(5, 11, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();

      } else {
        // Generic pet fallback (emoji)
        const petEmoji = PETS_DEFS[petId]?.emoji || '🐾';
        ctx.font = '22px Outfit, Inter, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4;
        ctx.fillText(petEmoji, 0, 0);
      }

      // Pet ability aura ring (subtle glow based on pet type)
      const auraColors = { corgi: '#fbbf24', owl: '#a78bfa', kitty: '#ec4899' };
      const aura = auraColors[petId] || '#fff';
      ctx.strokeStyle = aura + '55'; ctx.lineWidth = 1.5;
      ctx.shadowColor = aura; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(0, 0, 18 + Math.sin(t / 200) * 2, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.restore();
    }
  }

  drawArmorOverlay(ctx, p) {
    const armor = this.save.equipped.armor;
    const colors = { leather_vest:'#92400e', chain_mail:'#64748b', steel_plate:'#94a3b8', shadow_cloak:'#1e1b4b', dragon_scale:'#ef4444' };
    const c = colors[armor.id] || '#64748b';
    ctx.beginPath(); ctx.arc(0, p.r*0.1, p.r*0.85, 0, Math.PI);
    ctx.fillStyle = c + 'aa'; ctx.fill();
  }

  drawPlayerEyes(ctx, p) {
    const t = Date.now();
    const bob = Math.sin(t/300)*1.5;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-p.r*0.3, -p.r*0.1 + bob, p.r*0.18, p.r*0.22, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(p.r*0.3, -p.r*0.1 + bob, p.r*0.18, p.r*0.22, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.arc(-p.r*0.28, -p.r*0.08 + bob, p.r*0.1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.r*0.28, -p.r*0.08 + bob, p.r*0.1, 0, Math.PI*2); ctx.fill();
  }

  drawPlayerWeapon(ctx, p, t) {
    const wpn = this.save.equipped.weapon;
    const type = wpn ? (wpn.id.includes('sword') ? 'sword' : wpn.id.includes('bow') ? 'bow' : wpn.id.includes('staff') ? 'wand' : wpn.id.includes('hammer') ? 'hammer' : wpn.id.includes('axe') ? 'axe' : 'sword') : p.weaponType;
    const attackSwing = p.attackAnim * 0.6;
    ctx.save();
    ctx.rotate(attackSwing);

    switch(type) {
      case 'sword':
      case 'sword': // Iron sword
        ctx.fillStyle = wpn ? (wpn.rarity === 'legendary' ? '#fde68a' : '#94a3b8') : '#cbd5e1';
        ctx.fillRect(-3, -(p.r + 5), 6, p.r * 1.6 + 10);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(-8, -(p.r - 2), 16, 6);
        break;
      case 'bow':
        ctx.strokeStyle = wpn ? (wpn.rarity === 'legendary' ? '#fde68a' : '#86efac') : '#86efac';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, p.r * 0.9, -Math.PI * 0.65, Math.PI * 0.65, false); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, -p.r * 0.65); ctx.lineTo(0, p.r * 0.65); ctx.stroke();
        break;
      case 'wand':
        ctx.strokeStyle = wpn && wpn.rarity === 'legendary' ? '#fde68a' : '#c084fc';
        ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, p.r * 0.5); ctx.lineTo(0, -(p.r + 12)); ctx.stroke();
        ctx.shadowBlur = 12; ctx.shadowColor = ctx.strokeStyle;
        ctx.beginPath(); ctx.arc(0, -(p.r + 14), 7, 0, Math.PI*2);
        ctx.fillStyle = ctx.strokeStyle; ctx.fill(); ctx.shadowBlur = 0;
        break;
      case 'hammer':
        ctx.fillStyle = wpn && wpn.rarity === 'legendary' ? '#fde68a' : '#64748b';
        ctx.fillRect(-4, -(p.r), 8, p.r * 1.4);
        ctx.fillRect(-14, -(p.r + 14), 28, 14);
        break;
      case 'daggers':
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(-10, -p.r, 4, p.r * 1.3);
        ctx.fillRect(6, -p.r * 0.8, 4, p.r * 1.2);
        break;
      case 'skull_staff':
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, p.r * 0.5); ctx.lineTo(0, -(p.r + 8)); ctx.stroke();
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath(); ctx.arc(0, -(p.r + 18), 10, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(-3, -(p.r + 18), 1.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(3, -(p.r + 18), 1.5, 0, Math.PI*2); ctx.fill();
        break;
      case 'nature_staff':
        ctx.strokeStyle = '#86efac'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, p.r * 0.5); ctx.lineTo(0, -(p.r + 8)); ctx.stroke();
        ctx.fillStyle = '#4ade80';
        ctx.beginPath(); ctx.ellipse(0, -(p.r + 18), 10, 7, -0.5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath(); ctx.ellipse(0, -(p.r + 18), 4, 3, -0.5, 0, Math.PI*2); ctx.fill();
        break;
    }
    ctx.restore();
  }

  drawEnemies(ctx) {
    this.enemies.forEach(e => {
      if (e.hp <= 0) return;
      this.drawSingleEnemy(ctx, e);
    });
  }

  drawSingleEnemy(ctx, e) {
    const t = Date.now();
    const rage = e.enrageThreshold > 0 && e.hp / e.maxHp < e.enrageThreshold;
    const hitFlash = (t - (e.lastHitTime || 0)) < 175;
    const stunned = t < (e.stunUntil || 0);
    const slowed = t < (e.slowUntil || 0);
    const isDiving = e._isDiving; // dragon queen dive (invisible)

    // Opacity cho clone và boss divining
    const opacity = e.opacity !== undefined ? e.opacity : 1;

    ctx.save();
    if (opacity < 1) ctx.globalAlpha = opacity;
    if (e.stealth > 0 && t % 1000 < 500) ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.45;

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + e.r * 0.75, e.r * 0.85, e.r * 0.38, 0, 0, Math.PI*2);
    ctx.fill();

    // Dash warning indicator (red pulsing arc in front of boss)
    if (e._dashWarning) {
      ctx.save();
      ctx.translate(e.x, e.y);
      const warnAlpha = 0.5 + Math.sin(t / 60) * 0.5;
      ctx.strokeStyle = `rgba(239,68,68,${warnAlpha})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 1.8, -0.6, 0.6);
      ctx.stroke();
      ctx.restore();
    }

    // Elite neon ring
    if (e.isElite) {
      ctx.save(); ctx.translate(e.x, e.y);
      drawEliteNeonRing(ctx, e.r, t);
      ctx.restore();
    }

    // Dispatch to specialized draw function
    if (!isDiving) {
      switch(e.type) {
        case 'slime':         drawEnemySlime(ctx, e, t, hitFlash, rage); break;
        case 'bat':           drawEnemyBat(ctx, e, t, hitFlash, rage); break;
        case 'goblin':        drawEnemyGoblin(ctx, e, t, hitFlash, rage); break;
        case 'spider':        drawEnemySpider(ctx, e, t, hitFlash, rage); break;
        case 'wolf':          drawEnemyWolf(ctx, e, t, hitFlash, rage); break;
        case 'slime_king_jr': drawEnemySlime(ctx, e, t, hitFlash, rage); break;
        case 'knight':        drawEnemyKnight(ctx, e, t, hitFlash, rage); break;
        case 'orc':           drawEnemyOrc(ctx, e, t, hitFlash, rage); break;
        case 'dark_mage':     drawEnemyDarkMage(ctx, e, t, hitFlash, rage); break;
        case 'skeleton':      drawEnemySkeleton(ctx, e, t, hitFlash, rage); break;
        case 'shadow':        drawEnemyShadow(ctx, e, t, hitFlash, rage); break;
        case 'vampire':       drawEnemyVampire(ctx, e, t, hitFlash, rage); break;
        case 'golem':         drawEnemyGolem(ctx, e, t, hitFlash, rage); break;
        case 'berserker':     drawEnemyBerserker(ctx, e, t, hitFlash, rage); break;
        case 'phantom':       drawEnemyPhantom(ctx, e, t, hitFlash, rage); break;
        case 'dragon':        drawEnemyDragon(ctx, e, t, hitFlash, rage); break;
        case 'necromancer':   drawEnemyNecromancer(ctx, e, t, hitFlash, rage); break;
        case 'banshee':       drawEnemyBanshee(ctx, e, t, hitFlash, rage); break;
        case 'executioner':   drawEnemyExecutioner(ctx, e, t, hitFlash, rage); break;
        case 'ice_witch':     drawEnemyIceWitch(ctx, e, t, hitFlash, rage); break;
        case 'void_crawler':  drawEnemyVoidCrawler(ctx, e, t, hitFlash, rage); break;
        case 'titan_minion':  drawEnemyVoidCrawler(ctx, e, t, hitFlash, rage); break;
        case 'death_knight':  drawEnemyKnight(ctx, e, t, hitFlash, rage); break;
        case 'hellhound':     drawEnemyWolf(ctx, e, t, hitFlash, rage); break;
        case 'boss_slime_king':    drawBossSlimeKing(ctx, e, t, hitFlash, rage); break;
        case 'boss_dark_lord':     drawBossDarkLord(ctx, e, t, hitFlash, rage); break;
        case 'boss_dragon_queen':  drawBossDragonQueen(ctx, e, t, hitFlash, rage); break;
        case 'boss_void_titan':    drawBossVoidTitan(ctx, e, t, hitFlash, rage); break;
        case 'boss_death_herald':  drawBossDeathHerald(ctx, e, t, hitFlash, rage); break;
        case 'boss_reaper_form1':  drawBossReaperForm1(ctx, e, t, hitFlash, rage); break;
        case 'boss_death_reaper':  drawBossDeathReaper(ctx, e, t, hitFlash, rage); break;
        default:
          // Fallback: vẽ hình tròn màu của enemy type
          ctx.fillStyle = hitFlash ? '#fff' : (e.color || '#ef4444');
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI*2); ctx.fill();
          break;
      }
    }

    // Stun stars overlay
    if (stunned) {
      const sCount = 3;
      for (let si = 0; si < sCount; si++) {
        const sAngle = (si / sCount) * Math.PI * 2 + t / 200;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(e.x + Math.cos(sAngle) * (e.r + 8), e.y + Math.sin(sAngle) * (e.r + 8) - 5, 4, 0, Math.PI*2);
        ctx.fill();
      }
    }
    // Slow rings
    if (slowed) {
      ctx.strokeStyle = 'rgba(125,211,252,0.5)';
      ctx.lineWidth = 2;
      for (let ri = 0; ri < 2; ri++) {
        const rr = e.r * (1.3 + ri * 0.3) + Math.sin(t / 200 + ri) * 3;
        ctx.beginPath(); ctx.arc(e.x, e.y, rr, 0, Math.PI*2); ctx.stroke();
      }
    }
    // Rage flames
    if (rage) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      for (let fi = 0; fi < 5; fi++) {
        const fa = (fi / 5) * Math.PI * 2 + t / 300;
        const fr = e.r + 8 + Math.sin(t / 100 + fi) * 5;
        ctx.fillStyle = fi % 2 === 0 ? '#ef4444' : '#f97316';
        ctx.beginPath();
        ctx.ellipse(e.x + Math.cos(fa) * fr, e.y + Math.sin(fa) * fr, 4, 8, fa, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Boss invuln phase3 indicator (blinking white outline)
    if (e._isInvulnPhase3) {
      ctx.strokeStyle = `rgba(255,255,255,${0.5 + Math.sin(t/80)*0.5})`;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 4, 0, Math.PI*2); ctx.stroke();
    }

    // HP bar (only show if damaged)
    if (e.hp < e.maxHp) {
      const barW = e.isBoss ? e.r * 2.5 : e.r * 1.6;
      const barH = e.isBoss ? 7 : 4;
      const barX = e.x - barW / 2;
      const barY = e.y - e.r - (e.isBoss ? 18 : 12);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX, barY, barW, barH);
      const hpColor = e.hp / e.maxHp > 0.5 ? '#22c55e' : e.hp / e.maxHp > 0.25 ? '#eab308' : '#ef4444';
      ctx.fillStyle = hpColor;
      ctx.fillRect(barX, barY, barW * (e.hp / e.maxHp), barH);
      // Boss name label
      if (e.isBoss) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(e.name || e.type, e.x, barY - 4);
      }
    }

    ctx.restore();
  }


  drawHpBar(ctx, x, y, w, h, pct, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - w/2, y - h/2, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x - w/2, y - h/2, w * Math.max(0, pct), h);
  }

  drawProjectiles_(ctx) {
    this.projectiles.forEach(p => {
      if (p.isVoidReaver) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angleBase || 0) + (p.angleOffset || 0) + Date.now() / 90);
        
        // Glow layer
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 6;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#a855f7';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, -0.9, 0.9);
        ctx.stroke();
        
        // Inner white layer
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, -0.7, 0.7);
        ctx.stroke();
        
        ctx.restore();
        return;
      }

      ctx.save();
      
      const angle = p.angle !== undefined ? p.angle : Math.atan2(p.vy, p.vx);
      const vx = Math.cos(angle);
      const vy = Math.sin(angle);
      
      if (p.isArrow) {
        // --- DRAW 2D ARROW SHAPE ---
        // 1. Draw flat arrow shadow on ground (2.5D perspective)
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.beginPath();
        const sx = p.x;
        const sy = p.y + 14; 
        ctx.translate(sx, sy);
        ctx.rotate(angle);
        ctx.moveTo(12, 0);
        ctx.lineTo(-12, -4);
        ctx.lineTo(-8, 0);
        ctx.lineTo(-12, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 2. Draw actual arrow
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        
        // Wind/motion speed trail behind arrow
        ctx.save();
        ctx.strokeStyle = p.color + '55';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(-48, 0);
        ctx.stroke();
        ctx.restore();

        // Arrow shaft
        ctx.strokeStyle = '#78350f'; // brown wood
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();

        // Arrow feathers
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-15, -4);
        ctx.lineTo(-13, 0);
        ctx.lineTo(-15, 4);
        ctx.closePath();
        ctx.fill();

        // Arrow head
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(2, -4);
        ctx.lineTo(3, 0);
        ctx.lineTo(2, 4);
        ctx.closePath();
        ctx.fill();
        
        // Glow core (Removed shadowBlur for high performance)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(6, 0, 1.8, 0, Math.PI*2);
        ctx.fill();
        
      } else {
        // --- DRAW SPELL ORB WITH MULTI-LAYER GLOW ---
        const trailLength = p.radius * 4.8;
        const grad = ctx.createLinearGradient(p.x, p.y, p.x - vx * trailLength, p.y - vy * trailLength);
        grad.addColorStop(0, p.color);
        grad.addColorStop(0.4, p.color + 'aa');
        grad.addColorStop(1, 'transparent');
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = p.radius * 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - vx * trailLength, p.y - vy * trailLength);
        ctx.stroke();
        
        // Glowing magic ball with radial gradient
        ctx.save();
        ctx.translate(p.x, p.y);
        
        // Outer aura
        const radG = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius * 2.2);
        radG.addColorStop(0, '#ffffff');
        radG.addColorStop(0.2, p.color);
        radG.addColorStop(0.6, p.color + '55');
        radG.addColorStop(1, 'transparent');
        
        ctx.fillStyle = radG;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.75, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
      
      ctx.restore();
    });
  }

  drawParticles_(ctx) {
    const t = Date.now();
    this.particles.forEach(p => {
      const alpha = Math.max(0, p.life / (p.maxLife || p.life));

      // Draw 2.5D dynamic shadow on ground if particle flies high on Z axis
      if (p.z && p.z > 0) {
        ctx.save();
        ctx.globalAlpha = alpha * Math.max(0.1, 1 - p.z / 250);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        const shadowRadius = Math.max(1, (p.r || 5) * Math.max(0.3, 1 - p.z / 350));
        ctx.ellipse(p.x, p.y, shadowRadius * 1.5, shadowRadius * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      // Translate context on Y axis by -z to elevate rendering
      if (p.z && p.z > 0) {
        ctx.translate(0, -p.z);
      }

      if (p.type === 'dot') {
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, p.r * alpha), 0, Math.PI*2);
        ctx.fillStyle = p.color; ctx.fill();
      } else if (p.type === 'dust') {
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, p.r * alpha), 0, Math.PI*2);
        ctx.fillStyle = `rgba(148, 163, 184, ${0.45 * alpha})`; // slate-400 smoke
        ctx.fill();
      } else if (p.type === 'spark') {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = p.color; ctx.fill();
      } else if (p.type === 'lvlup_star') {
        starPath(ctx, p.x, p.y, p.r, p.r * 0.4, 5);
        ctx.fillStyle = p.color; ctx.fill();
      } else if (p.type === 'snowflake') {
        ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 1.8;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot + (t / 400));
        for (let j = 0; j < 6; j++) {
          ctx.rotate(Math.PI / 3);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -p.r); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-3, -p.r * 0.6); ctx.lineTo(0, -p.r * 0.85); ctx.lineTo(3, -p.r * 0.6); ctx.stroke();
        }
        ctx.restore();
      } else if (p.type === 'leaf') {
        ctx.fillStyle = p.color || '#34d399';
        ctx.strokeStyle = shadeColor(ctx.fillStyle, -35);
        ctx.lineWidth = 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot + Math.sin(t/200)*0.4);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.r, p.r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.restore();
      } else if (p.type === 'thorny_spike') {
        ctx.fillStyle = '#16a34a'; ctx.strokeStyle = '#14532d'; ctx.lineWidth = 1.5;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.beginPath();
        ctx.moveTo(-p.w/2, 0);
        ctx.lineTo(0, -p.h * alpha);
        ctx.lineTo(p.w/2, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      } else if (p.type === 'cathedral_rune') {
        ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 2.5 * alpha;
        ctx.shadowBlur = 18; ctx.shadowColor = '#fbbf24';
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(t / 900);
        ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.rect(-p.r * 0.68, -p.r * 0.68, p.r * 1.36, p.r * 1.36); ctx.stroke();
        ctx.restore();
      } else if (p.type === 'magic_beam') {
        ctx.strokeStyle = p.color; ctx.lineWidth = p.w * alpha;
        ctx.shadowBlur = 25; ctx.shadowColor = p.color;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.tx, p.ty); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = p.w * 0.35 * alpha;
        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.tx, p.ty); ctx.stroke();
      } else if (p.type === 'lightning') {
        ctx.strokeStyle = p.color; ctx.lineWidth = 4; ctx.shadowColor = p.glow || p.color; ctx.shadowBlur = 20; ctx.lineCap = 'round';
        ctx.beginPath();
        p.path.forEach((pt, j) => {
          if (j === 0) { ctx.moveTo(pt.x, pt.y); return; }
          const prev = p.path[j-1];
          const mx = (prev.x + pt.x)/2 + (Math.random() - 0.5) * 20;
          const my = (prev.y + pt.y)/2 + (Math.random() - 0.5) * 20;
          ctx.lineTo(mx, my); ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.shadowBlur = 0; ctx.stroke();
      } else if (p.type === 'boom') {
        starPath(ctx, p.x, p.y, p.r, p.r * 0.4, 12, Date.now() / 1000 * 0.2);
        const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, p.r);
        g.addColorStop(0, '#fff'); g.addColorStop(0.25, '#fef08a'); g.addColorStop(0.6, '#f97316'); g.addColorStop(1, '#ef4444');
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 4; ctx.stroke();
        const fs = Math.min(24, p.r * 0.55);
        ctx.font = `bold ${fs}px Outfit`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.strokeText('BOOM!', p.x, p.y);
        ctx.fillStyle = '#fff'; ctx.fillText('BOOM!', p.x, p.y);
      } else if (p.type === 'ring') {
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.6, 0, 0, Math.PI * 2);
        ctx.strokeStyle = p.color; ctx.lineWidth = 2 * alpha;
        ctx.shadowBlur = 10; ctx.shadowColor = p.color; ctx.stroke();
      } else if (p.type === 'gold_orb') {
        // ── GOLD ORB: đồng xu vàng với shimmer ──
        const r1 = p.r;
        const pulse = 1 + 0.15 * Math.sin(t / 60 + (p.pulse || 0));
        const rc = r1 * pulse;
        // Outer glow (Removed shadowBlur for high performance)
        const g = ctx.createRadialGradient(p.x - rc * 0.3, p.y - rc * 0.3, 0, p.x, p.y, rc * 1.6);
        g.addColorStop(0, '#fff9c4');
        g.addColorStop(0.4, '#fbbf24');
        g.addColorStop(0.8, '#d97706');
        g.addColorStop(1,   'rgba(217,119,6,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, rc * 1.6, 0, Math.PI*2); ctx.fill();
        // Core coin
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(p.x, p.y, rc, 0, Math.PI*2); ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath(); ctx.ellipse(p.x - rc*0.25, p.y - rc*0.25, rc*0.35, rc*0.2, -0.5, 0, Math.PI*2); ctx.fill();
      } else if (p.type === 'xp_orb') {
        // ── XP GEM: hình kim cương (diamond) đẹp theo tier ──
        const r1 = p.r;
        const phase = (p.pulse || 0) + t / 55;
        const pulse = 1 + 0.18 * Math.sin(phase);
        const rc = r1 * pulse;
        const col = p.color;

        // Tier-based glow strength
        const tier = p.gemTier || 'small';
        const isAccum = p.isAccumulator || tier === 'red_accum';

        ctx.save();
        ctx.translate(p.x, p.y);

        // Outer aura (Removed shadowBlur for high performance)
        const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, rc * 2.2);
        aura.addColorStop(0, col);
        aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura;
        ctx.globalAlpha = 0.5 * alpha;
        ctx.beginPath(); ctx.arc(0, 0, rc * 2.2, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = alpha;

        if (isAccum) {
          // Dynamic outer pulsing ring for Red Accumulator Gem
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, rc * 2.5 + Math.sin(t / 15) * 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Diamond shape (4-pointed star / gem) (Removed shadowBlur for high performance)
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, -rc * 1.5);   // top
        ctx.lineTo(rc * 0.9, 0);    // right
        ctx.lineTo(0, rc * 1.0);    // bottom
        ctx.lineTo(-rc * 0.9, 0);   // left
        ctx.closePath();
        ctx.fill();

        // Inner bright highlight (top facet)
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.beginPath();
        ctx.moveTo(0, -rc * 1.5);
        ctx.lineTo(rc * 0.4, -rc * 0.3);
        ctx.lineTo(0, rc * 0.1);
        ctx.lineTo(-rc * 0.4, -rc * 0.3);
        ctx.closePath();
        ctx.fill();

        // Tiny sparkle at top
        if (tier !== 'small' || isAccum) {
          const sparkSize = rc * (isAccum ? 0.35 : 0.25);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(0, -rc * 1.5, sparkSize, 0, Math.PI*2); ctx.fill();
        }

        // Dynamic sparkle/shimmer flares for Red Accumulator Gem
        if (isAccum) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 2;
          const shimmerLength = rc * 2.5;
          
          // Rotate slightly for a cool dynamic effect
          ctx.rotate(t / 40);
          
          // horizontal flare
          ctx.beginPath();
          ctx.moveTo(-shimmerLength, 0);
          ctx.lineTo(shimmerLength, 0);
          ctx.stroke();
          
          // vertical flare
          ctx.beginPath();
          ctx.moveTo(0, -shimmerLength);
          ctx.lineTo(0, shimmerLength);
          ctx.stroke();
        }

        ctx.restore();

      } else if (p.type === 'golden_egg') {
        const rc = p.r * (1 + 0.12 * Math.sin(t / 80));
        ctx.save();
        ctx.translate(p.x, p.y);
        
        // Outer glow aura
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 24 + Math.sin(t / 80) * 8;
        
        const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, rc * 2.5);
        aura.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
        aura.addColorStop(0.5, 'rgba(251, 191, 36, 0.15)');
        aura.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, rc * 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Egg core (drawn using bezier curves to make it look like a nice egg)
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(0, -rc * 1.3);
        ctx.bezierCurveTo(rc * 1.1, -rc * 1.3, rc * 1.1, rc * 0.9, 0, rc * 1.1);
        ctx.bezierCurveTo(-rc * 1.1, rc * 0.9, -rc * 1.1, -rc * 1.3, 0, -rc * 1.3);
        ctx.closePath();
        ctx.fill();
        
        // Inner highlight
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(0, -rc * 1.1);
        ctx.bezierCurveTo(rc * 0.8, -rc * 1.1, rc * 0.8, rc * 0.7, 0, rc * 0.9);
        ctx.bezierCurveTo(-rc * 0.8, rc * 0.7, -rc * 0.8, -rc * 1.1, 0, -rc * 1.1);
        ctx.closePath();
        ctx.fill();
        
        // Bright white gleam
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-rc * 0.25, -rc * 0.45, rc * 0.22, rc * 0.38, -0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();

      } else if (p.type === 'crack') {
        ctx.strokeStyle = p.color; ctx.lineWidth = 2 * alpha;
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.cos(p.angle) * p.len * (1-alpha), p.y + Math.sin(p.angle) * p.len * (1-alpha));
        ctx.stroke();
      } else if (p.type === 'grasp_line' || p.type === 'vine') {
        ctx.strokeStyle = p.color; ctx.lineWidth = 3 * alpha;
        ctx.setLineDash([8, 4]);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.tx, p.ty); ctx.stroke();
        ctx.setLineDash([]);
      } else if (p.type === 'holy_cross') {
        ctx.strokeStyle = p.color; ctx.lineWidth = p.w * alpha;
        ctx.shadowBlur = 30; ctx.shadowColor = p.color;
        ctx.beginPath(); ctx.moveTo(p.x - 2000, p.y); ctx.lineTo(p.x + 2000, p.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x, p.y - 2000); ctx.lineTo(p.x, p.y + 2000); ctx.stroke();
      } else if (p.type === 'root') {
        ctx.strokeStyle = p.color; ctx.lineWidth = 3 * alpha;
        for (let i = 0; i < 5; i++) {
          const a = (i/5)*Math.PI*2;
          ctx.beginPath(); ctx.moveTo(p.x, p.y);
          const len = 30 + Math.sin(i)*20;
          ctx.bezierCurveTo(p.x + Math.cos(a+0.5)*len*0.5, p.y + Math.sin(a+0.5)*len*0.5,
                            p.x + Math.cos(a-0.3)*len*0.8, p.y + Math.sin(a-0.3)*len*0.8,
                            p.x + Math.cos(a)*len, p.y + Math.sin(a)*len);
          ctx.stroke();
        }
      } else if (p.type === 'rain_arrow') {
        // Draw a falling arrow from sky to target
        const progress = 1 - (p.life / p.maxLife);
        const ax = p.x;
        const ay = p.y;
        const angle = Math.atan2(p.ty - p.y, p.tx - p.x) + Math.PI * 0.5;
        const arrowLen = 28;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(angle);
        // Arrow shaft
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(0, -arrowLen * 0.5);
        ctx.lineTo(0, arrowLen * 0.5);
        ctx.stroke();
        // Arrowhead
        ctx.fillStyle = '#6ee7b7';
        ctx.beginPath();
        ctx.moveTo(0, -arrowLen * 0.5 - 8);
        ctx.lineTo(-5, -arrowLen * 0.5 + 2);
        ctx.lineTo(5, -arrowLen * 0.5 + 2);
        ctx.closePath();
        ctx.fill();
        // Feathers at tail
        ctx.strokeStyle = '#a7f3d0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, arrowLen * 0.5);
        ctx.lineTo(0, arrowLen * 0.5 - 8);
        ctx.lineTo(4, arrowLen * 0.5);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'rain_arrow_warn') {
        // Pulsing green circle warning on ground before arrow lands
        ctx.save();
        ctx.globalAlpha = alpha * 0.7;
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(52, 211, 153, 0.2)';
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    });
  }

  drawSummons(ctx) {
    this.summons.forEach(s => {
      this.drawSingleSummon(ctx, s);
    });
  }

  drawMerchant(ctx, m) {
    const t = Date.now();
    ctx.save();
    ctx.translate(m.x, m.y);

    // 1. Ground Shadow (elliptical 2.5D shadow under the portal)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, m.r * 0.9, m.r * 1.1, m.r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Rotating Rune Magic Rings under feet (2.5D flat projections)
    ctx.save();
    ctx.translate(0, m.r * 0.9);
    
    // Outer dashed gold ring rotating clockwise
    ctx.shadowBlur = 18; ctx.shadowColor = '#fbbf24';
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.ellipse(0, 0, m.r * 1.4 + Math.sin(t / 150) * 2, m.r * 0.7 + Math.sin(t / 150) * 1.0, t / 800, 0, Math.PI * 2);
    ctx.stroke();

    // Inner rune solid/dashed ring rotating counter-clockwise
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.ellipse(0, 0, m.r * 1.0, m.r * 0.5, -t / 600, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
    ctx.shadowBlur = 0;

    // Bobbing movement for floating magician look
    const bobY = Math.sin(t / 180) * 2.2;
    ctx.translate(0, bobY);

    // 3. Floating magic sparks around merchant (local particles simulation)
    ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
    ctx.shadowBlur = 8; ctx.shadowColor = '#fbbf24';
    for (let i = 0; i < 6; i++) {
      const pTime = (t * 0.0015 + i * (Math.PI / 3)) % 1;
      const py = -5 - pTime * 45; // fly upwards
      const px = Math.sin(i * 12 + t / 250) * 18 * (1 - pTime * 0.4);
      const pr = 1.5 + (1 - pTime) * 2;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // 4. Robed Merchant Body (Detailed 2.5D Wizard shape)
    // Left and right dark-purple robe parts
    ctx.fillStyle = '#4c1d95'; // Purple robe base
    ctx.beginPath();
    ctx.moveTo(-16, 12);
    ctx.quadraticCurveTo(-14, -8, -10, -22);
    ctx.lineTo(0, -22);
    ctx.lineTo(0, 12);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#3b0764'; // Darker shadow robe right side
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(0, -22);
    ctx.lineTo(10, -22);
    ctx.quadraticCurveTo(14, -8, 16, 12);
    ctx.closePath();
    ctx.fill();

    // Golden embroidery line on the center of robe
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-1.5, -22, 3, 34);
    
    // Golden shoulder pads / collar details
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-12, -20);
    ctx.lineTo(12, -20);
    ctx.stroke();

    // 5. Mage Hood and Dark Face Mask
    ctx.fillStyle = '#1e1b4b'; // Deep dark hood interior
    ctx.beginPath();
    ctx.arc(0, -20, 9, 0, Math.PI * 2);
    ctx.fill();

    // Wizard pointy hood hat
    ctx.fillStyle = '#3b0764';
    ctx.beginPath();
    ctx.moveTo(-11, -21);
    ctx.quadraticCurveTo(-10, -38, -15, -45); // Pointy tip bending left
    ctx.quadraticCurveTo(-2, -35, 11, -21);
    ctx.closePath();
    ctx.fill();
    
    // Glowing Wizard Eyes (mysterious gold neon eyes inside hood)
    ctx.fillStyle = '#fbbf24';
    ctx.shadowBlur = 10; ctx.shadowColor = '#fbbf24';
    ctx.beginPath();
    ctx.arc(-3, -20, 1.8, 0, Math.PI * 2);
    ctx.arc(3, -20, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Sleeves with gold trim
    ctx.fillStyle = '#4c1d95';
    ctx.beginPath();
    ctx.arc(-15, -6, 4, 0, Math.PI * 2);
    ctx.arc(15, -6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(-15, -6, 2, 0, Math.PI * 2);
    ctx.arc(15, -6, 2, 0, Math.PI * 2);
    ctx.fill();

    // 6. Wizard Staff (Ornate wooden stick with pulsing crystal gem)
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(19, 14);
    ctx.lineTo(19, -32);
    ctx.stroke();
    
    // Ornate staff top wings
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(19, -32, 5, Math.PI * 1.0, 0);
    ctx.stroke();

    // Pulsing Crystal Sphere
    const crystalPulse = 5.5 + Math.sin(t / 120) * 1.5;
    const crystalGlow = 14 + Math.sin(t / 120) * 8;
    
    ctx.fillStyle = '#fbbf24';
    ctx.shadowBlur = crystalGlow; ctx.shadowColor = '#fbbf24';
    ctx.beginPath();
    ctx.arc(19, -36, crystalPulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner white core of crystal
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(19 - 1.5, -36 - 1.5, crystalPulse * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // 7. Floating Text Tag (Outfit styled text with glow)
    ctx.fillStyle = '#fbbf24';
    ctx.font = '800 13px Outfit';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 8; ctx.shadowColor = '#fbbf24';
    ctx.fillText('⚖️ THƯƠNG NHÂN ⚖️', 0, -56);
    ctx.shadowBlur = 0;

    // 8. Interactive Hint if player is near
    const dist = Math.hypot(this.player.x - m.x, this.player.y - m.y);
    if (dist < 90) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 12px Outfit';
      ctx.shadowBlur = 6; ctx.shadowColor = '#ffffff';
      ctx.fillText('[Ấn phím E]', 0, -74);
      ctx.shadowBlur = 0;
    }

    // 9. Merchant HP bar if rescue event is active
    if (this.merchantRescueActive && m.hp !== undefined) {
      const barW = 50;
      const barH = 6;
      const bx = -barW / 2;
      const by = -92;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(bx, by, barW, barH);
      const hpPct = Math.max(0, m.hp / m.maxHp);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(bx, by, barW * hpPct, barH);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, barW, barH);
    }

    ctx.restore();
  }

  drawSingleSummon(ctx, s) {
    const t = Date.now();
    ctx.save();
    ctx.translate(s.x, s.y);
    const bob = Math.sin(t / 160 + s.x * 0.01) * 2.5;
    ctx.translate(0, bob);

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, s.r - bob, s.r * 0.9, s.r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    if (s.type === 'shadow_clone') {
      // ── SHADOW CLONE: humanoid silhouette with purple dark energy ──
      const r = s.r;
      ctx.shadowColor = '#7c3aed';
      ctx.shadowBlur = 18;
      // Body torso
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(-r * 0.32, -r * 0.6, r * 0.64, r * 0.85);
      // Legs
      ctx.fillStyle = '#2e1065';
      ctx.fillRect(-r * 0.32, r * 0.2, r * 0.28, r * 0.55);
      ctx.fillRect(r * 0.04, r * 0.2, r * 0.28, r * 0.55);
      // Arms
      const armSwing = Math.sin(t / 160) * 0.18;
      ctx.save();
      ctx.translate(-r * 0.32, -r * 0.2);
      ctx.rotate(-armSwing);
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(-r * 0.18, 0, r * 0.18, r * 0.55);
      ctx.restore();
      ctx.save();
      ctx.translate(r * 0.32, -r * 0.2);
      ctx.rotate(armSwing);
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(0, 0, r * 0.18, r * 0.55);
      ctx.restore();
      // Head
      const g = ctx.createRadialGradient(-r * 0.1, -r * 0.75, 0, 0, -r * 0.75, r * 0.36);
      g.addColorStop(0, '#7c3aed');
      g.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, -r * 0.75, r * 0.36, 0, Math.PI * 2);
      ctx.fill();
      // Glowing purple eyes
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(-r * 0.11, -r * 0.75, r * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.11, -r * 0.75, r * 0.08, 0, Math.PI * 2); ctx.fill();
      // Dark energy wisps
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(167,139,250,0.55)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const wa = (i / 4) * Math.PI * 2 + t / 300;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.2);
        ctx.quadraticCurveTo(Math.cos(wa) * r * 0.6, Math.sin(wa) * r * 0.5, Math.cos(wa) * r * 0.9, Math.sin(wa) * r * 0.9);
        ctx.stroke();
      }

    } else if (s.type === 'skeleton') {
      // ── SKELETON: full bony humanoid figure ──
      const r = s.r;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      // Skull
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath(); ctx.arc(0, -r * 0.78, r * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5;
      ctx.stroke();
      // Jaw
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.18, -r * 0.55);
      ctx.lineTo(-r * 0.18, -r * 0.44);
      ctx.lineTo(r * 0.18, -r * 0.44);
      ctx.lineTo(r * 0.18, -r * 0.55);
      ctx.stroke();
      // Eye sockets
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.arc(-r * 0.1, -r * 0.8, r * 0.07, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.8, r * 0.07, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(-r * 0.1, -r * 0.8, r * 0.04, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.8, r * 0.04, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Spine
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.5); ctx.lineTo(0, r * 0.22);
      ctx.stroke();
      // Ribs
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 3; i++) {
        const ry = -r * 0.35 + i * r * 0.2;
        ctx.beginPath(); ctx.moveTo(0, ry); ctx.quadraticCurveTo(-r * 0.45, ry + r * 0.06, -r * 0.38, ry + r * 0.18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, ry); ctx.quadraticCurveTo(r * 0.45, ry + r * 0.06, r * 0.38, ry + r * 0.18); ctx.stroke();
      }
      // Arms
      const armSwing = Math.sin(t / 180) * 0.25;
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#e2e8f0';
      // Left arm
      ctx.save(); ctx.translate(-r * 0.38, -r * 0.38); ctx.rotate(-armSwing - 0.3);
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, r * 0.38); ctx.moveTo(0, r * 0.38); ctx.lineTo(0, r * 0.6);
      ctx.stroke(); ctx.restore();
      // Right arm
      ctx.save(); ctx.translate(r * 0.38, -r * 0.38); ctx.rotate(armSwing + 0.3);
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, r * 0.38); ctx.moveTo(0, r * 0.38); ctx.lineTo(0, r * 0.6);
      ctx.stroke(); ctx.restore();
      // Pelvis and legs
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-r * 0.3, r * 0.22); ctx.lineTo(r * 0.3, r * 0.22); ctx.stroke();
      const legSwing = Math.sin(t / 200) * 0.18;
      // Left leg
      ctx.save(); ctx.translate(-r * 0.18, r * 0.22); ctx.rotate(-legSwing);
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, r * 0.4); ctx.moveTo(0, r * 0.4); ctx.lineTo(0, r * 0.7);
      ctx.stroke(); ctx.restore();
      // Right leg
      ctx.save(); ctx.translate(r * 0.18, r * 0.22); ctx.rotate(legSwing);
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, r * 0.4); ctx.moveTo(0, r * 0.4); ctx.lineTo(0, r * 0.7);
      ctx.stroke(); ctx.restore();

    } else if (s.type === 'spirit_wolf') {
      // ── SPIRIT WOLF: wolf silhouette with ethereal glow ──
      const r = s.r;
      const facing = s.angle > Math.PI * 0.5 && s.angle < Math.PI * 1.5 ? -1 : 1;
      ctx.save();
      ctx.scale(facing, 1);
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 18;
      // Body
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.75, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      // Inner luminous body
      const wg = ctx.createRadialGradient(-r * 0.1, -r * 0.1, 0, 0, 0, r * 0.7);
      wg.addColorStop(0, 'rgba(110, 231, 183, 0.8)');
      wg.addColorStop(0.6, 'rgba(16, 185, 129, 0.5)');
      wg.addColorStop(1, 'rgba(6, 78, 59, 0)');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.75, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.ellipse(r * 0.62, -r * 0.12, r * 0.35, r * 0.3, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Snout
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.ellipse(r * 0.9, r * 0.0, r * 0.22, r * 0.16, 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Ears
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.moveTo(r * 0.5, -r * 0.35); ctx.lineTo(r * 0.4, -r * 0.65); ctx.lineTo(r * 0.65, -r * 0.42); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(r * 0.68, -r * 0.3); ctx.lineTo(r * 0.68, -r * 0.58); ctx.lineTo(r * 0.82, -r * 0.35); ctx.closePath(); ctx.fill();
      // Glowing eyes
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(r * 0.72, -r * 0.15, r * 0.07, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.beginPath(); ctx.arc(r * 0.73, -r * 0.15, r * 0.04, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Tail (curved)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, 0);
      ctx.quadraticCurveTo(-r * 1.1, -r * 0.5, -r * 0.95, -r * 0.75);
      ctx.stroke();
      // Running legs
      const legAnim = Math.sin(t / 80) * 0.4;
      ctx.strokeStyle = '#065f46'; ctx.lineWidth = 5;
      const legPositions = [[-r*0.4, r*0.38], [-r*0.15, r*0.38], [r*0.15, r*0.38], [r*0.4, r*0.38]];
      legPositions.forEach(([lx, ly], idx) => {
        ctx.save();
        ctx.translate(lx, ly - r * 0.02);
        const swing = Math.sin(t / 80 + idx * 1.2) * 0.35;
        ctx.rotate(swing);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, r * 0.38); ctx.stroke();
        ctx.restore();
      });
      ctx.restore();

    } else if (s.type === 'grim_reaper') {
      // ── GRIM REAPER ──
      const r = s.r;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 14;
      // Floating dark robe
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 0.4);
      ctx.quadraticCurveTo(-r * 0.55, 0, -r * 0.5, r * 0.7);
      ctx.quadraticCurveTo(0, r * 0.85, r * 0.5, r * 0.7);
      ctx.quadraticCurveTo(r * 0.55, 0, r * 0.4, -r * 0.4);
      ctx.closePath();
      ctx.fill();
      // Hood
      ctx.fillStyle = '#18181b';
      ctx.beginPath(); ctx.arc(0, -r * 0.62, r * 0.38, 0, Math.PI * 2); ctx.fill();
      // Pointy hood tip
      ctx.beginPath(); ctx.moveTo(-r*0.28, -r*0.75); ctx.lineTo(0, -r*1.15); ctx.lineTo(r*0.28, -r*0.75); ctx.fill();
      // Glowing red eyes
      ctx.fillStyle = '#ef4444'; ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(-r * 0.1, -r * 0.65, r * 0.07, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.65, r * 0.07, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Scythe
      ctx.strokeStyle = '#71717a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(r * 0.35, -r * 0.5); ctx.lineTo(r * 0.35, r * 0.6); ctx.stroke();
      ctx.strokeStyle = '#a1a1aa'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(r * 0.35, -r * 0.5);
      ctx.quadraticCurveTo(r * 0.9, -r * 1.0, r * 0.1, -r * 0.85);
      ctx.stroke();

    } else if (s.type === 'ghost_echo') {
      // ── GHOST ECHO: translucent wavy spirit ──
      const r = s.r;
      ctx.globalAlpha *= 0.75;
      ctx.shadowColor = '#a78bfa';
      ctx.shadowBlur = 22;
      // Ghost body (teardrop)
      const gg = ctx.createRadialGradient(0, -r * 0.3, 0, 0, 0, r * 0.9);
      gg.addColorStop(0, '#c4b5fd');
      gg.addColorStop(0.6, '#7c3aed');
      gg.addColorStop(1, 'rgba(109,40,217,0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(0, -r * 0.25, r * 0.55, 0, Math.PI, true);
      const waveAmp = r * 0.15;
      for (let xi = -r * 0.55; xi <= r * 0.55; xi += r * 0.18) {
        ctx.lineTo(xi, r * 0.35 + Math.sin(xi * 0.3 + t / 100) * waveAmp);
      }
      ctx.closePath();
      ctx.fill();
      // Eyes
      ctx.globalAlpha = 1.0 * (ctx.globalAlpha > 0 ? 1 : 1);
      ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(-r * 0.18, -r * 0.32, r * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.18, -r * 0.32, r * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath(); ctx.arc(-r * 0.18, -r * 0.3, r * 0.05, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.18, -r * 0.3, r * 0.05, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

    } else {
      // Fallback generic blob summon
      const color1 = s.color || '#8b5cf6';
      const color2 = shadeColor(color1, -40);
      ctx.beginPath(); ctx.arc(0, 0, s.r, 0, Math.PI*2);
      const g = ctx.createRadialGradient(-s.r*0.2, -s.r*0.2, 0, 0, 0, s.r);
      g.addColorStop(0, '#fff'); g.addColorStop(0.3, color1); g.addColorStop(1, color2);
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
    }

    // Floating emoji label above summon
    ctx.save();
    const icons = { shadow_clone:'👤', skeleton:'💀', spirit_wolf:'🐺', grim_reaper:'☠️', ghost_echo:'👻' };
    const labelY = -s.r * 1.15 - 14 + Math.sin(t / 240) * 2.5;
    ctx.font = 'bold 11px Outfit'; ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 2.5;
    ctx.strokeText(icons[s.type] || '✨', 0, labelY);
    ctx.fillText(icons[s.type] || '✨', 0, labelY);
    ctx.restore();

    ctx.restore();
  }

  drawHazards_(ctx) {
    const t = Date.now();
    this.hazards.forEach(h => {
      ctx.save();

      if (h.type === 'lightning_warning') {
        // ── LIGHTNING WARNING: pulsing red danger zone with ⚡ icon ──
        const pulse = Math.sin(t / 80) * 0.5 + 0.5;
        const lifeAlpha = Math.min(1, h.life / h.maxLife);
        const rf = h.r * (1 + pulse * 0.08);
        ctx.globalAlpha = lifeAlpha * (0.45 + pulse * 0.25);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
        ctx.beginPath(); ctx.arc(h.x, h.y, rf, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = lifeAlpha * (0.75 + pulse * 0.25);
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5 + pulse * 1.5;
        ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.arc(h.x, h.y, rf, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        // Cross-hair
        ctx.strokeStyle = 'rgba(251,191,36,0.7)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(h.x - rf * 0.6, h.y); ctx.lineTo(h.x + rf * 0.6, h.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(h.x, h.y - rf * 0.6); ctx.lineTo(h.x, h.y + rf * 0.6); ctx.stroke();
        // ⚡ icon at center
        ctx.globalAlpha = lifeAlpha * (0.8 + pulse * 0.2);
        ctx.font = `bold ${Math.round(rf * 0.55)}px Outfit`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fde047';
        ctx.fillText('⚡', h.x, h.y);
        ctx.textBaseline = 'alphabetic';
        ctx.restore();
        return;
      }

      const alpha = 0.35 + Math.sin(t/400)*0.1;
      
      // Outer glow boundary (No shadowBlur, fast 2-pass fill)
      ctx.fillStyle = h.color;
      ctx.beginPath();
      ctx.ellipse(h.x, h.y, h.r * 1.15, h.r * 1.15 * 0.6, 0, 0, Math.PI * 2);
      ctx.globalAlpha = alpha * 0.4;
      ctx.fill();
      
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.ellipse(h.x, h.y, h.r, h.r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = h.color; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(h.x, h.y, h.r, h.r * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // ─── DANGER ZONES: render pulsing danger areas ───
    if (this.dangerZones) {
      this.dangerZones.forEach(z => {
        ctx.save();
        const pulse = Math.sin(z.pulse) * 0.5 + 0.5;
        const alpha = 0.25 + pulse * 0.2;
        const rf = z.r * (1 + pulse * 0.08);

        // Filled danger area
        ctx.globalAlpha = alpha;
        ctx.fillStyle = z.color;
        ctx.beginPath();
        ctx.arc(z.x, z.y, rf, 0, Math.PI * 2);
        ctx.fill();

        // Animated ring border
        ctx.globalAlpha = 0.7 + pulse * 0.3;
        ctx.strokeStyle = z.color;
        ctx.lineWidth = 3 + pulse * 2;
        ctx.beginPath();
        ctx.arc(z.x, z.y, rf, 0, Math.PI * 2);
        ctx.stroke();

        // Second outer ring pulsing
        ctx.globalAlpha = 0.3 + pulse * 0.3;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(z.x, z.y, rf * 1.15, 0, Math.PI * 2);
        ctx.stroke();

        // Warning icon label
        ctx.globalAlpha = 0.85 + pulse * 0.15;
        ctx.fillStyle = '#fff';
        ctx.font = `bold 16px Outfit`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const icon = z.type === 'fire' ? '🔥' : z.type === 'acid' ? '☣️' : z.type === 'void' ? '🌀' : '❄️';
        ctx.strokeText(icon, z.x, z.y + 6);
        ctx.fillText(icon, z.x, z.y + 6);

        // Life indicator (fading edge near death)
        if (z.life < 2) {
          ctx.globalAlpha = z.life / 2 * 0.4;
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(z.x, z.y, rf, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
    }
  }



  drawFloats(ctx) {
    this.floats.forEach(f => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.font = `${f.big ? 800 : 700} ${f.big ? 20 : 14}px Outfit`;
      ctx.textAlign = 'center';
      
      // Draw crisp black outline (100x faster than shadowBlur and more readable)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = f.big ? 4 : 2.5;
      ctx.strokeText(f.text, f.x, f.y);
      
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    });
  }

  // ──────────────────────────────────────────────
  // 2.5D STATIC OBSTACLES RENDERING
  // ──────────────────────────────────────────────
  drawTree(ctx, obs) {
    ctx.save();
    // 1. Draw flat ground shadow
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.beginPath();
    ctx.ellipse(obs.x, obs.y, obs.r * 1.25, obs.r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    // 2. Draw cached tree asset centered Y-pivot
    ctx.drawImage(this.treeAsset, obs.x - 60, obs.y - 120, 120, 140);
    ctx.restore();
  }

  drawBookcase(ctx, obs) {
    ctx.save();
    // 1. Draw flat ground shadow
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.beginPath();
    ctx.ellipse(obs.x, obs.y + obs.r * 0.1, obs.r * 1.3, obs.r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    // 2. Draw cached bookcase
    ctx.drawImage(this.bookcaseAsset, obs.x - 37.5, obs.y - 75, 75, 85);
    ctx.restore();
  }
  drawRock(ctx, obs) {
    ctx.save();
    // 1. Draw flat ground shadow
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.beginPath();
    ctx.ellipse(obs.x, obs.y + obs.r * 0.1, obs.r * 1.15, obs.r * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    // 2. Draw cached rock
    ctx.drawImage(this.rockAsset, obs.x - 40, obs.y - 45, 80, 70);
    ctx.restore();
  }

  drawCrate(ctx, obs) {
    ctx.save();
    // 1. Draw flat ground shadow
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.beginPath();
    ctx.ellipse(obs.x, obs.y, obs.r * 1.15, obs.r * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    // 2. Draw cached crate
    ctx.drawImage(this.crateAsset, obs.x - 30, obs.y - 45, 60, 60);
    ctx.restore();
  }

  triggerArcanaSelection(callback) {
    this.pause();
    const screen = document.getElementById('pveArcanaScreen');
    const cardsContainer = document.getElementById('arcanaCards');
    if (!screen || !cardsContainer) return;
    
    screen.classList.remove('hidden');
    cardsContainer.innerHTML = '';
    
    // Check if it's the start selection (Tarot) or Wave 15 selection (Arcana Boosts)
    const isStartSelection = !this.activeArcanas.has('arcana_the_fool') &&
                             !this.activeArcanas.has('arcana_the_magician') &&
                             !this.activeArcanas.has('arcana_the_empress') &&
                             !this.activeArcanas.has('arcana_the_emperor') &&
                             !this.activeArcanas.has('arcana_the_lovers') &&
                             !this.activeArcanas.has('arcana_the_chariot') &&
                             !this.activeArcanas.has('arcana_the_hermit') &&
                             !this.activeArcanas.has('arcana_wheel_of_fortune') &&
                             !this.activeArcanas.has('arcana_death') &&
                             !this.activeArcanas.has('arcana_the_tower') &&
                             !this.activeArcanas.has('arcana_the_sun');
                             
    let pool = [];
    if (isStartSelection) {
      const tarotPool = [
        { id: 'arcana_the_fool', name: 'The Fool 🃏', desc: 'Nhận +20% tỷ lệ né tránh hoàn toàn tất cả sát thương nhận vào.', icon: '🃏' },
        { id: 'arcana_the_magician', name: 'The Magician 🔮', desc: 'Tăng +25% tốc độ hồi chiêu kỹ năng (Cooldown Speed Reduction).', icon: '🔮' },
        { id: 'arcana_the_empress', name: 'The Empress 👑', desc: 'Tăng vĩnh viễn +30 HP hồi/giây và +20% HP tối đa.', icon: '👑' },
        { id: 'arcana_the_emperor', name: 'The Emperor ⚔️', desc: 'Tăng +30% Sát thương đòn đánh kỹ năng và +15% Hút máu (Lifesteal).', icon: '⚔️' },
        { id: 'arcana_the_lovers', name: 'The Lovers 💞', desc: 'Đệ triệu hồi nhận +50% Máu và Sát thương, thừa hưởng 35% hút máu.', icon: '💞' },
        { id: 'arcana_the_chariot', name: 'The Chariot 🏎️', desc: 'Cứ mỗi 3 giây, tự động kích nổ sóng năng lượng xung kích gây 120 sát thương xung quanh.', icon: '🏎️' },
        { id: 'arcana_the_hermit', name: 'The Hermit 🛖', desc: 'Nhận +40% ATK & +20% Armor khi không có quái vật trong phạm vi 300px.', icon: '🛖' },
        { id: 'arcana_wheel_of_fortune', name: 'Wheel of Fortune 🎡', desc: 'Nhân đôi (x2) tỷ lệ chí mạng và tăng nhân 1.4 lần lượng Vàng nhận được.', icon: '🎡' },
        { id: 'arcana_death', name: 'Death 💀', desc: 'Đòn chí mạng nổ gây 50% sát thương lan; tiêu diệt kẻ địch hồi 3 HP.', icon: '💀' },
        { id: 'arcana_the_tower', name: 'The Tower 🗼', desc: 'Mỗi 2 giây sét đánh 3 kẻ địch ngẫu nhiên gần nhất gây 150 sát thương và làm choáng 1.0 giây.', icon: '🗼' },
        { id: 'arcana_the_sun', name: 'The Sun ☀️', desc: 'Phát ra vầng hào quang thiêu đốt xung quanh gây 25 sát thương/giây trong bán kính 180px.', icon: '☀️' }
      ];
      // Shuffle and pick 3 random Tarot cards
      pool = tarotPool.sort(() => 0.5 - Math.random()).slice(0, 3);
      const titleEl = document.getElementById('arcanaTitle');
      const subEl = document.getElementById('arcanaSub');
      if (titleEl) titleEl.textContent = '🔮 KHỞI ĐẦU TAROT BẢN MỆNH 🔮';
      if (subEl) subEl.textContent = 'Chọn 1 Lá bài Tarot Bản mệnh để định hình phong cách chiến đấu';
    } else {
      const arcanas = [
        { id: 'arcana_slash', name: '🗡️ Sát Thủ Vô Song (Slash)', desc: 'Các đòn chí mạng gây thêm 100% sát thương (Tổng cộng x3).', icon: '🗡️' },
        { id: 'arcana_bounce', name: '🌀 Ma Pháp Nảy Đạn (Bounce)', desc: 'Tia đạn và mũi tên nảy thêm 2 lần khi chạm quái vật hoặc tường.', icon: '🌀' },
        { id: 'arcana_grace', name: '👼 Thánh Quang Hộ Thể (Grace)', desc: 'Khi HP xuống dưới 30%, nhận 3 giây bất tử (Hồi chiêu 60 giây).', icon: '👼' },
        { id: 'arcana_pact', name: '🩸 Khế Ước Tử Thần (Pact)', desc: 'Mỗi kẻ địch tiêu diệt tăng 0.5% sát thương kỹ năng (Tối đa +50%).', icon: '🩸' }
      ];
      pool = arcanas.filter(a => !this.activeArcanas.has(a.id)).slice(0, 3);
      const titleEl = document.getElementById('arcanaTitle');
      const subEl = document.getElementById('arcanaSub');
      if (titleEl) titleEl.textContent = '🔮 THỨC TỈNH ARCANA BOOSTS 🔮';
      if (subEl) subEl.textContent = 'Chọn 1 Thẻ bài Arcana bổ sung để cường hóa tối thượng sức mạnh';
    }
    
    pool.forEach((arc, idx) => {
      const card = document.createElement('div');
      card.className = 'arcana-card';
      const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
      card.innerHTML = `
        <div class="arc-icon">${arc.icon}</div>
        <div class="arc-name">${arc.name}</div>
        <div class="arc-desc">${arc.desc}</div>
        <div class="arc-num">${romanNumerals[idx] || 'I'}</div>
      `;
      card.onclick = () => {
        this.activeArcanas.add(arc.id);
        screen.classList.add('hidden');
        this.addFloat(this.player.x, this.player.y - 60, `🔮 Kích hoạt: ${arc.name}!`, '#fbbf24', true);
        this.spawnParticles(this.player.x, this.player.y, '#fbbf24', 15, 3);
        
        // Empress immediate stat adjustments
        if (arc.id === 'arcana_the_empress') {
          this.player.maxHp *= 1.20;
          this.player.hp = this.player.maxHp;
          this.player.hpRegen += 30;
        }
        
        // Emperor immediate stat adjustments
        if (arc.id === 'arcana_the_emperor') {
          this.player.lifesteal = (this.player.lifesteal || 0) + 0.15;
          this.player.dmgMult *= 1.30;
        }

        // Magician immediate CDR adjustments
        if (arc.id === 'arcana_the_magician') {
          this.player.cdMult -= 0.25;
        }

        // Wheel of fortune immediate critical adjustments
        if (arc.id === 'arcana_wheel_of_fortune') {
          this.player.critChance = (this.player.critChance || 0.05) * 2.0;
          this._modiGoldMult = (this._modiGoldMult || 1.0) * 2.0;
        }
        
        if (arc.id === 'arcana_pact') {
          this.pactKillCount = 0;
          this.pactDmgMult = 1.0;
        }
        
        if (callback) {
          callback();
        } else {
          this.resume();
        }
      };
      cardsContainer.appendChild(card);
    });
  }

  findNearestEnemyExclude(x, y, excludeList = []) {
    let nearest = null;
    let minDistSq = Infinity;
    const excludes = new Set(excludeList);
    this.enemies.forEach(e => {
      if (e.hp <= 0 || excludes.has(e)) return;
      const dx = e.x - x;
      const dy = e.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        nearest = e;
      }
    });
    return nearest;
  }

  spawnBossChest(x, y) {
    if (!this.bossChests) this.bossChests = [];
    this.bossChests.push({
      x: x,
      y: y,
      r: 18,
      t: Date.now()
    });
    this.spawnParticles(x, y, '#fbbf24', 15, 3);
  }

  drawBossChest(ctx, chest) {
    const t = Date.now();
    const bob = Math.sin(t / 200) * 4;
    const pulse = 1 + Math.sin(t / 150) * 0.15;
    
    ctx.save();
    ctx.translate(chest.x, chest.y + bob);
    
    ctx.beginPath();
    ctx.ellipse(0, 8, 20 * pulse, 6 * pulse, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(0, 10, 14, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();
    
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-15, -6, 30, 16);
    
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-15, -6, 30, 16);
    
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(0, -6, 15, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-8, -21);
    ctx.lineTo(-12, -26);
    ctx.lineTo(-5, -24);
    ctx.lineTo(0, -29);
    ctx.lineTo(5, -24);
    ctx.lineTo(12, -26);
    ctx.lineTo(8, -21);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 2, 3, 0, Math.PI * 2);
    ctx.fill();
    
    if (Math.random() < 0.1) {
      this.spawnParticle(chest.x + (Math.random() - 0.5) * 30, chest.y + (Math.random() - 0.5) * 30, '#fbbf24', 4, 0.5);
    }
    
    ctx.restore();
  }

  triggerEvolutionCheck() {
    // 1. Check UNION first
    for (const combo of UNION_COMBOS) {
      const s1 = this.skills.find(s => s.id === combo.baseSkill1);
      const s2 = this.skills.find(s => s.id === combo.baseSkill2);
      if (s1 && s1.level >= 8 && s2 && s2.level >= 8) {
        if (!this.skills.some(s => s.id === combo.evolvedSkill)) {
          this.evolveSkillUnion(combo.baseSkill1, combo.baseSkill2, combo.evolvedSkill);
          return;
        }
      }
    }
    
    // 2. Check standard EVOS, GIFTS, and MORPHS
    for (const combo of EVO_COMBOS) {
      const s = this.skills.find(s => s.id === combo.baseSkill);
      if (s && s.level >= 8) {
        const psv = this.passiveItems.find(p => p.id === combo.passiveItem);
        if (psv) {
          if (!this.skills.some(s => s.id === combo.evolvedSkill)) {
            this.evolveSkill(combo.baseSkill, combo.passiveItem, combo.evolvedSkill, combo.type);
            return;
          }
        }
      }
    }
    
    // 3. Fallback: Gold + Permanent Item
    this.openGoldChestFallback();
  }

  evolveSkill(baseSkillId, passiveItemId, evolvedSkillId, typeName) {
    this.pause();
    const sIndex = this.skills.findIndex(s => s.id === baseSkillId);
    if (sIndex !== -1) {
      this.skills[sIndex] = { id: evolvedSkillId, level: 1, isLegendary: true };
      delete this.skillState[baseSkillId];
      this.skillState[evolvedSkillId] = { lastFired: 0 };
    }
    this.updateSkillBar();
    this.showEvolutionModal(baseSkillId, passiveItemId, evolvedSkillId, typeName);
  }

  evolveSkillUnion(baseSkill1, baseSkill2, evolvedSkillId) {
    this.pause();
    this.skills = this.skills.filter(s => s.id !== baseSkill1 && s.id !== baseSkill2);
    delete this.skillState[baseSkill1];
    delete this.skillState[baseSkill2];
    this.skills.push({ id: evolvedSkillId, level: 1, isLegendary: true });
    this.skillState[evolvedSkillId] = { lastFired: 0 };
    this.updateSkillBar();
    this.showEvolutionModal(baseSkill1, baseSkill2, evolvedSkillId, 'UNION');
  }

  showEvolutionModal(baseSkillId, passiveId, evolvedSkillId, typeName) {
    const screen = document.getElementById('pveEvolutionScreen');
    if (!screen) return;
    
    const wpnIcon = document.getElementById('evoWeaponIcon');
    const psvIcon = document.getElementById('evoPassiveIcon');
    const resIcon = document.getElementById('evoResultIcon');
    const typeLabel = document.getElementById('evoType');
    const nameLabel = document.getElementById('evoName');
    const descLabel = document.getElementById('evoDesc');
    
    const wpnDef = SKILL_DEFS[baseSkillId];
    const resDef = SKILL_DEFS[evolvedSkillId];
    
    let psvIconChar = '❓';
    if (typeName === 'UNION') {
      psvIconChar = SKILL_DEFS[passiveId]?.icon || '❓';
    } else {
      psvIconChar = PASSIVE_ITEMS_DEFS[passiveId]?.icon || '❓';
    }
    
    if (wpnIcon) wpnIcon.textContent = wpnDef ? wpnDef.icon : '❓';
    if (psvIcon) psvIcon.textContent = psvIconChar;
    if (resIcon) resIcon.textContent = resDef ? resDef.icon : '❓';
    
    if (typeLabel) {
      typeLabel.textContent = typeName;
      if (typeName === 'UNION') typeLabel.style.color = '#93c5fd';
      else if (typeName === 'GIFT') typeLabel.style.color = '#fde68a';
      else if (typeName === 'MORPH') typeLabel.style.color = '#c084fc';
      else typeLabel.style.color = '#fbbf24';
    }
    if (nameLabel) nameLabel.textContent = resDef ? resDef.name : 'Unknown';
    if (descLabel) descLabel.textContent = resDef ? resDef.desc : '';
    
    screen.classList.remove('hidden');
    
    this.screenShake(10, 0.4);
    this.spawnParticles(this.player.x, this.player.y, '#fbbf24', 30, 8);
  }

  openGoldChestFallback() {
    this.pause();
    
    const goldBonus = 350;
    this.totalGold += goldBonus;
    this.addFloat(this.player.x, this.player.y - 40, `+${goldBonus} 🪙 Vàng Thưởng!`, '#fbbf24', true);
    
    if (savedData.inventory.length >= 18) {
      this.addFloat(this.player.x, this.player.y - 80, `Túi đồ đầy! +200 🪙 Vàng bù`, '#f87171', true);
      this.totalGold += 200;
      this.resume();
      return;
    }
    
    const rolls = ['epic', 'epic', 'legendary', 'rare'];
    const rarity = rolls[Math.floor(Math.random() * rolls.length)];
    const allItems = [...EQUIPMENT_POOL.weapon, ...EQUIPMENT_POOL.armor, ...EQUIPMENT_POOL.accessory];
    const pool = allItems.filter(i => i.rarity === rarity);
    const item = pool[Math.floor(Math.random() * pool.length)];
    
    savedData.inventory.push({ ...item });
    savedData.chestHistory.unshift(`🎁 ${item.icon} ${item.name} (${RARITY_LABEL[item.rarity]})`);
    if (savedData.chestHistory.length > 10) savedData.chestHistory.pop();
    saveToDisk();
    
    if (typeof buildInventoryGrid === 'function') buildInventoryGrid();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof updateChestHistory === 'function') updateChestHistory();
    
    showChestOpenModal('gold', item);
    
    const originalClose = window.closeChestModal;
    window.closeChestModal = () => {
      originalClose();
      window.closeChestModal = originalClose;
      this.resume();
    };
  }



  fireSpellStorm(dmg, lv) {
    const p = this.player;
    this.addFloat(p.x, p.y - 60, '⛈️ SPELL STORM!', '#22d3ee');
    this.screenShake(10, 0.4);
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        if (!this.running) return;
        const targets = this.enemies.filter(e => e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) < 600);
        const target = targets.length > 0 ? targets[Math.floor(Math.random() * targets.length)] : this.nearestEnemy();
        const tx = target ? target.x : p.x + (Math.random() - 0.5) * 400;
        const ty = target ? target.y : p.y - 200 + Math.random() * 400;
        
        this.particles.push({
          type: 'magic_beam',
          x: tx, y: ty - 450,
          tx: tx, ty: ty,
          color: '#22d3ee',
          w: 8,
          life: 0.25, maxLife: 0.25
        });
        
        this.aoeExplosion(tx, ty, 80, dmg * 0.45, '#0ea5e9');
        this.spawnParticles(tx, ty, '#22d3ee', 6, 2.5);
      }, i * 120);
    }
  }

  fireWindRunner(dmg, lv) {
    const p = this.player;
    this.addFloat(p.x, p.y - 60, '🌪️ WIND RUNNER!', '#34d399');
    
    const baseAngle = p.angle;
    const speed = 350;
    const count = 3;
    
    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 0.35;
      const angle = baseAngle + spread;
      
      this.spawnProjectile({
        x: p.x, y: p.y,
        angle: angle,
        speed: speed,
        dmg: dmg,
        radius: 35,
        color: '#34d399',
        trail: true,
        trailColor: '#a7f3d0',
        pierce: true,
        maxPierces: 999,
        maxDist: 700,
        onHit: (ex, ey, e) => {
          if (e) {
            e.x += Math.cos(angle) * 60;
            e.y += Math.sin(angle) * 60;
            e.stunUntil = Date.now() + 1000;
            this.spawnParticles(e.x, e.y, '#34d399', 4, 2);
          }
        }
      });
    }
    
    this.spawnParticles(p.x, p.y, '#34d399', 15, 4);
  }

  fireVoidReaver(dmg, lv) {
    const p = this.player;
    this.addFloat(p.x, p.y - 60, '🌑 VOID REAVER!', '#a855f7');
    this.screenShake(12, 0.5);
    const count = 6;
    for (let i = 0; i < count; i++) {
      this.spawnProjectile({
        x: p.x, y: p.y,
        angle: 0,
        speed: 0,
        dmg: dmg,
        radius: 25,
        color: '#a855f7',
        trail: true,
        trailColor: '#6d28d9',
        pierce: true,
        maxPierces: 9999,
        maxDist: 800,
        isVoidReaver: true,
        angleBase: (i / count) * Math.PI * 2,
        angleOffset: 0,
        radiusOffset: 40
      });
    }
  }

  fireAegisSmash(dmg, lv) {
    const p = this.player;
    this.addFloat(p.x, p.y - 60, '🛡️ AEGIS SMASH!', '#facc15');
    this.screenShake(15, 0.5);
    
    p.aegisReflectUntil = Date.now() + 2000;
    
    const r = 240 * p.aoeMult;
    this.enemies.forEach(e => {
      if (e.hp <= 0) return;
      const dist = Math.hypot(e.x - p.x, e.y - p.y);
      if (dist < r) {
        this.dealDamage(e, dmg);
        e.stunUntil = Date.now() + 2500;
        const angle = Math.atan2(e.y - p.y, e.x - p.x);
        e.x += Math.cos(angle) * 80;
        e.y += Math.sin(angle) * 80;
        this.spawnParticles(e.x, e.y, '#facc15', 6, 2.5);
      }
    });
    
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        if (!this.running) return;
        this.particles.push({ type: 'ring', x: p.x, y: p.y, r: 0, maxR: r * (0.25 + i * 0.25), color: '#facc15', life: 0.4, maxLife: 0.4 });
      }, i * 100);
    }
    this.spawnParticles(p.x, p.y, '#facc15', 25, 5);
  }

  fireHellfireMeteor(dmg, lv) {
    const p = this.player;
    this.addFloat(p.x, p.y - 60, '🔥 HELLFIRE METEOR!', '#ef4444');
    this.screenShake(12, 0.4);
    
    const target = this.nearestEnemy();
    const angle = target ? Math.atan2(target.y - p.y, target.x - p.x) : p.angle;
    const speed = 250;
    
    this.spawnProjectile({
      x: p.x, y: p.y,
      angle: angle,
      speed: speed,
      dmg: dmg * 1.5,
      radius: 40,
      color: '#ef4444',
      trail: true,
      trailColor: '#f97316',
      pierce: true,
      maxPierces: 999,
      maxDist: 600,
      onHit: (ex, ey, e) => {
        if (Math.random() < 0.3) {
          this.hazards.push({
            type: 'fire',
            x: ex, y: ey,
            r: 60,
            dmg: dmg * 0.25,
            life: 3.5,
            color: '#ef4444',
            tickCd: 0.5
          });
          this.spawnParticles(ex, ey, '#ef4444', 3, 2);
        }
      },
      onDestroy: (ex, ey) => {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            if (!this.running) return;
            const r = 120 + i * 40;
            this.aoeExplosion(ex, ey, r, dmg * 0.8, '#ef4444');
            this.screenShake(10, 0.2);
            this.particles.push({ type: 'ring', x: ex, y: ey, r: 0, maxR: r, color: '#ef4444', life: 0.35, maxLife: 0.35 });
          }, i * 150);
        }
      }
    });
  }

  fireGenesisBloom(dmg, lv) {
    const p = this.player;
    const r = 240 * p.aoeMult;
    this.addFloat(p.x, p.y - 60, '🌹 GENESIS BLOOM!', '#22c55e');
    
    this.hazards.push({
      type: 'genesis_bloom',
      x: p.x, y: p.y,
      r: r,
      dmg: dmg * 0.35,
      life: 8.0,
      color: '#ec4899',
      slow: 0.6,
      tickCd: 0.5
    });
    
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      const dist = Math.random() * r * 0.9;
      const rx = p.x + Math.cos(a) * dist;
      const ry = p.y + Math.sin(a) * dist;
      this.particles.push({
        type: 'leaf',
        x: rx, y: ry,
        r: 10 + Math.random() * 8,
        rot: Math.random() * Math.PI * 2,
        color: i % 2 === 0 ? '#ec4899' : '#f43f5e',
        life: 8.0,
        maxLife: 8.0
      });
    }
  }

  fireGrimReaper(dmg, lv) {
    const p = this.player;
    this.addFloat(p.x, p.y - 60, '☠️ SUMMON GRIM REAPER!', '#1e293b');
    this.screenShake(10, 0.3);

    // LIMIT ACTIVE GRIM REAPERS (Capping)
    const maxReapers = 2 + (this.clsKey === 'necromancer' ? 1 : 0);
    const reapers = this.summons.filter(s => s.type === 'grim_reaper');
    const count = 1;

    if (reapers.length + count > maxReapers) {
      const toRemove = (reapers.length + count) - maxReapers;
      let removedCount = 0;
      for (let i = 0; i < this.summons.length; i++) {
        if (this.summons[i].type === 'grim_reaper') {
          this.summons.splice(i, 1);
          i--;
          removedCount++;
          if (removedCount >= toRemove) break;
        }
      }
    }

    this.summons.push({
      type: 'grim_reaper',
      x: p.x + (Math.random() - 0.5) * 60,
      y: p.y + (Math.random() - 0.5) * 60,
      r: 32,
      speed: 160,
      dmg: dmg * 1.5,
      color: '#3f3f46',
      attackCd: 800,
      lastAttack: 0,
      expiresAt: Date.now() + 20000
    });
  }

  fireGlacialSanctum(dmg, lv) {
    const p = this.player;
    const r = 260 * p.aoeMult;
    this.addFloat(p.x, p.y - 60, '❄️ GLACIAL SANCTUM!', '#93c5fd');
    
    this.hazards.push({
      type: 'glacial_sanctum',
      x: p.x, y: p.y,
      r: r,
      dmg: dmg * 0.4,
      life: 7.0,
      color: 'rgba(147, 197, 253, 0.4)',
      tickCd: 0.5
    });
    
    for (let i = 0; i < 25; i++) {
      const a = Math.random() * Math.PI * 2;
      const dist = Math.random() * r * 0.9;
      this.particles.push({
        type: 'snowflake',
        x: p.x + Math.cos(a) * dist,
        y: p.y + Math.sin(a) * dist,
        r: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI * 2,
        life: 7.0,
        maxLife: 7.0
      });
    }
  }

  fireArchangelLight(dmg, lv) {
    const p = this.player;
    this.addFloat(p.x, p.y - 60, '👼 ARCHANGEL LIGHT!', '#fde68a');
    this.screenShake(12, 0.4);
    
    p.hasArchangelPerk = true;
    
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        if (!this.running) return;
        const angle = (i / 12) * Math.PI * 2;
        const dist = 140;
        const bx = p.x + Math.cos(angle) * dist;
        const by = p.y + Math.sin(angle) * dist;
        
        this.particles.push({
          type: 'magic_beam',
          x: bx, y: by - 500,
          tx: bx, ty: by,
          color: '#fde68a',
          w: 12,
          life: 0.3, maxLife: 0.3
        });
        
        this.aoeExplosion(bx, by, 90, dmg * 0.5, '#fbbf24');
        this.spawnParticles(bx, by, '#fffbeb', 8, 3);
      }, i * 80);
    }
  }

  fireVoidDemon(dmg, lv) {
    const p = this.player;
    this.addFloat(p.x, p.y - 70, '😈 VOID DEMON TRANSFORM!', '#6d28d9');
    this.screenShake(15, 0.5);

    if (!p._originalRadius) {
      p._originalRadius = p.r;
      p._originalAtkMult = p.atkMult;
    }
    
    p.r = 35;
    p.atkMult = p._originalAtkMult * 1.8;
    p.voidDemonActiveUntil = Date.now() + 6000;
    
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        if (!this.running || Date.now() > p.voidDemonActiveUntil) return;
        const angle = Math.random() * Math.PI * 2;
        const sweepRange = 220;
        this.enemies.forEach(e => {
          if (e.hp <= 0) return;
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          if (dist < sweepRange) {
            this.dealDamage(e, dmg * 1.5, true);
            const pushAngle = Math.atan2(e.y - p.y, e.x - p.x);
            e.x += Math.cos(pushAngle) * 50;
            e.y += Math.sin(pushAngle) * 50;
          }
        });
        this.emitSlash(p.x, p.y, angle, sweepRange, '#6d28d9', 'fighter_slash');
        this.particles.push({ type: 'ring', x: p.x, y: p.y, r: 0, maxR: sweepRange, color: '#6d28d9', life: 0.3, maxLife: 0.3 });
        this.spawnParticles(p.x, p.y, '#c084fc', 12, 4);
      }, i * 1000);
    }
  }

  updateMerchantRescue(dt) {
    // ★ MERCHANT RANDOM SPAWN: check every 2-3 mins if merchant should appear
    if (!this.merchantRescueActive) {
      if (this.merchantSpawnNextCheck > 0) {
        this.merchantSpawnNextCheck -= dt;
        if (this.merchantSpawnNextCheck <= 0 && !this.merchant.active) {
          // 60% chance merchant re-appears
          if (Math.random() < 0.6) {
            this.merchant.active = true;
            this.merchant.hp = 1200;
            this.merchant.maxHp = 1200;
            // Spawn near but not on top of player
            const angle = Math.random() * Math.PI * 2;
            const dist = 200 + Math.random() * 150;
            this.merchant.x = Math.max(80, Math.min(WORLD_W - 80, this.player.x + Math.cos(angle) * dist));
            this.merchant.y = Math.max(80, Math.min(WORLD_H - 80, this.player.y + Math.sin(angle) * dist));
            this.addFloat(this.merchant.x, this.merchant.y - 50, '🧙 Thương Nhân xuất hiện!', '#eab308', true);
          }
          // Next check: 2-3 minutes later
          this.merchantSpawnNextCheck = 120 + Math.random() * 60;
        }
      }
    }

    // ★ RANDOM RESCUE TRIGGER: first rescue from min 15, random interval 8-12 min
    if (this.merchantRescueNextTrigger > 0 && !this.merchantRescueActive) {
      this.merchantRescueNextTrigger -= dt;
      if (this.merchantRescueNextTrigger <= 0) {
        if (!this.rescue1Triggered) {
          this.rescue1Triggered = true;
          this.merchantRescueNextTrigger = (480 + Math.random() * 240); // 8-12 min interval
          this.triggerMerchantRescueEvent();
        } else if (!this.rescue2Triggered) {
          this.rescue2Triggered = true;
          this.merchantRescueNextTrigger = -1; // No more auto triggers
          this.triggerMerchantRescueEvent();
        }
      }
    }
    
    if (this.merchantRescueActive) {
      this.merchantRescueTimer -= dt;
      
      // Mission-specific win conditions
      const mission = this.currentRescueMission;
      if (mission) {
        if (mission.type === 'kill_count' && this.merchantRescueKillCount >= mission.target) {
          this.endMerchantRescueEvent(true);
          return;
        }
        if (mission.type === 'reach' && Math.hypot(this.player.x - this.merchant.x, this.player.y - this.merchant.y) < 60) {
          this.endMerchantRescueEvent(true);
          return;
        }
      }

      if (this.merchant.hp <= 0) {
        this.endMerchantRescueEvent(false);
      } else if (this.merchantRescueTimer <= 0) {
        this.endMerchantRescueEvent(true);
      }
    }
  }

  // ★ RESCUE MISSIONS POOL - 5 different mission types
  triggerMerchantRescueEvent() {
    const RESCUE_MISSIONS = [
      {
        id: 'protect',
        type: 'survive',
        duration: 60,
        title: '🛡️ BẢO VỆ THƯƠNG NHÂN',
        desc: 'Bảo vệ thương nhân sống sót trong 60 giây!',
        enemies: 8,
        reward: 'discount'
      },
      {
        id: 'kill_escort',
        type: 'kill_count',
        target: 20,
        duration: 45,
        title: '⚔️ TIÊU DIỆT KẺ BẮT CÓC',
        desc: 'Tiêu diệt 20 quái trong 45 giây để cứu thương nhân!',
        enemies: 12,
        reward: 'gold'
      },
      {
        id: 'reach',
        type: 'reach',
        duration: 30,
        title: '💨 GIẢI CỨU KHẨN CẤP',
        desc: 'Đến nơi thương nhân trong 30 giây trước khi quái hạ gục!',
        enemies: 6,
        reward: 'discount'
      },
      {
        id: 'elite_boss',
        type: 'survive',
        duration: 60,
        title: '👺 HẠ THỦ LĨNH QUÁI',
        desc: 'Tiêu diệt Elite canh gác và bảo vệ thương nhân!',
        enemies: 4,
        eliteCount: 3,
        reward: 'gold'
      },
      {
        id: 'siege',
        type: 'survive',
        duration: 90,
        title: '🔥 CUỘC VÂY HÃM',
        desc: 'Chống đỡ cuộc tấn công tổng lực 90 giây liên tiếp!',
        enemies: 15,
        reward: 'both'
      }
    ];

    // Pick a random mission not same as last one
    let mission;
    do {
      mission = RESCUE_MISSIONS[Math.floor(Math.random() * RESCUE_MISSIONS.length)];
    } while (mission.id === this._lastRescueMissionId && RESCUE_MISSIONS.length > 1);
    this._lastRescueMissionId = mission.id;
    this.currentRescueMission = mission;
    this.merchantRescueKillCount = 0;

    this.merchantRescueActive = true;
    this.merchantRescueTimer = mission.duration;
    this.merchantRescueSuccess = false;
    
    this.merchant.hp = 1200;
    this.merchant.maxHp = 1200;
    this.merchant.active = true;
    
    // Random position near center of map
    const angle = Math.random() * Math.PI * 2;
    const offset = 100 + Math.random() * 150;
    this.merchant.x = Math.max(100, Math.min(WORLD_W - 100, WORLD_W / 2 + Math.cos(angle) * offset));
    this.merchant.y = Math.max(100, Math.min(WORLD_H - 100, WORLD_H / 2 + Math.sin(angle) * offset));
    
    // Notify player
    this.addFloat(this.player.x, this.player.y - 80, `🆘 ${mission.title}`, '#ef4444', true);
    this.addFloat(this.player.x, this.player.y - 55, mission.desc, '#fca5a5', false);
    this.screenShake(8, 0.3);

    // Spawn enemies around merchant
    const enemyCount = mission.enemies || 8;
    for (let i = 0; i < enemyCount; i++) {
      const ea = (i / enemyCount) * Math.PI * 2;
      const rx = this.merchant.x + Math.cos(ea) * 150;
      const ry = this.merchant.y + Math.sin(ea) * 150;
      this.spawnEnemy(rx, ry, { isElite: i < (mission.eliteCount || 0), forceSpawn: true });
    }

    // Show rescue UI pill
    const rescueEl = document.getElementById('pveRescueNum');
    const rescueDisplay = document.getElementById('pveRescueDisplay');
    if (rescueDisplay) rescueDisplay.classList.remove('hidden');
    if (rescueEl) rescueEl.textContent = `${mission.title} ${Math.round(mission.duration)}s`;
  }

  updateDayNightAndWeather(dt) {
    // 1. Day-Night cycle (90s Day, 90s Night)
    this.dayNightTimer += dt;
    if (this.dayNightCycle === 'day') {
      if (this.dayNightTimer >= 90) {
        this.dayNightCycle = 'night';
        this.dayNightTimer = 0;
        this.addFloat(this.player.x, this.player.y - 80, '🌙 BẮT ĐẦU BAN ĐÊM (Quái mạnh hơn!)', '#818cf8', true);
      }
    } else {
      if (this.dayNightTimer >= 90) {
        this.dayNightCycle = 'day';
        this.dayNightTimer = 0;
        this.addFloat(this.player.x, this.player.y - 80, '☀️ BẮT ĐẦU BAN NGÀY', '#fbbf24', true);
      }
    }

    // 2. Weather events (every 180s, event lasts 60s)
    this.weatherTimer += dt;
    if (this.currentWeather === 'clear') {
      if (this.weatherTimer >= this.nextWeatherEventIn) {
        const list = ['thunderstorm', 'blizzard', 'solar_flare'];
        this.currentWeather = list[Math.floor(Math.random() * list.length)];
        this.weatherTimer = 0;
        let weatherLabel = 'clear';
        let color = '#fff';
        if (this.currentWeather === 'thunderstorm') {
          weatherLabel = '⛈️ BÃO SÉT BẮT ĐẦU (Tránh sấm sét!)';
          color = '#eab308';
        } else if (this.currentWeather === 'blizzard') {
          weatherLabel = '❄️ BÃO TUYẾT BẮT ĐẦU (Tốc chạy giảm!)';
          color = '#38bdf8';
        } else if (this.currentWeather === 'solar_flare') {
          weatherLabel = '☀️ SOLAR FLARE BẮT ĐẦU (Đứng dưới bóng cây!)';
          color = '#ef4444';
        }
        this.addFloat(this.player.x, this.player.y - 100, weatherLabel, color, true);
      }
    } else {
      if (this.weatherTimer >= 60) {
        this.currentWeather = 'clear';
        this.weatherTimer = 0;
        this.nextWeatherEventIn = 120 + Math.random() * 60; // 2-3 mins
        this.addFloat(this.player.x, this.player.y - 100, '🌤️ THỜI TIẾT DỊU NHẸ TRỞ LẠI', '#4ade80', true);
      } else {
        if (this.currentWeather === 'thunderstorm') {
          this.updateThunderstorm(dt);
        } else if (this.currentWeather === 'blizzard') {
          this.updateBlizzard(dt);
        } else if (this.currentWeather === 'solar_flare') {
          this.updateSolarFlare(dt);
        }
      }
    }
  }

  updateThunderstorm(dt) {
    if (!this.lastLightningStrike) this.lastLightningStrike = 0;
    const now = Date.now();
    if (now - this.lastLightningStrike > 2000) {
      this.lastLightningStrike = now;
      
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 280;
      const tx = this.player.x + Math.cos(angle) * dist;
      const ty = this.player.y + Math.sin(angle) * dist;
      
      const warnR = 80;
      // 1. Spawn warning zone first (1.5s)
      this.hazards.push({
        type: 'lightning_warning',
        x: tx, y: ty,
        r: warnR,
        life: 1.5, maxLife: 1.5,
        color: 'rgba(239, 68, 68, 0.45)',
        tickCd: 99
      });
      
      // 2. After 1.5s, strike lightning and deal damage
      setTimeout(() => {
        if (!this.running) return;
        // Draw lightning bolt particle
        const steps = 8;
        const path = [{ x: tx, y: ty - 400 }];
        for (let i = 1; i <= steps; i++) {
          const px = tx + (Math.random() - 0.5) * 60 * (1 - i / steps);
          const py = ty - 400 + (400 / steps) * i + (Math.random() - 0.5) * 30;
          path.push({ x: px, y: py });
        }
        path.push({ x: tx, y: ty });
        
        this.particles.push({
          type: 'lightning',
          path: path,
          color: '#fde047',
          glow: '#fef9c3',
          life: 0.35, maxLife: 0.35,
          alpha: 1
        });
        
        // Screen flash
        this.screenShake(6, 0.15);
        this.addFloat(tx, ty - 60, '⚡ SÉT ⚡', '#fde047');
        
        // Damage enemies in strike zone
        const strikeR = 90;
        this.enemies.forEach(e => {
          if (e.hp > 0 && Math.hypot(e.x - tx, e.y - ty) < strikeR) {
            const lightningDmg = 80 + this.wave * 15;
            this.dealDamage(e, lightningDmg);
            e.stunUntil = Math.max(e.stunUntil || 0, Date.now() + 1500);
            this.spawnParticles(e.x, e.y, '#fde047', 8, 3);
          }
        });
        
        // Damage player if too close
        if (!this.player.invincible && Math.hypot(this.player.x - tx, this.player.y - ty) < strikeR * 0.7) {
          this.takeDamage(35);
          this.addFloat(this.player.x, this.player.y - 40, '-35 HP ⚡', '#fde047');
        }
        
        // Impact particles
        this.spawnParticles(tx, ty, '#fde047', 18, 5);
      }, 1500);
    }
  }

  updateBlizzard(dt) {
    // Apply blizzard speed slow to player every frame
    // This is handled in movement via currentWeather check,
    // but we also spawn ice particles periodically around player
    if (!this.lastBlizzardTick) this.lastBlizzardTick = 0;
    const now = Date.now();
    if (now - this.lastBlizzardTick > 400) {
      this.lastBlizzardTick = now;
      const p = this.player;
      // Spawn snowflake particles around player to indicate slow effect
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = 30 + Math.random() * 80;
        this.particles.push({
          type: 'snowflake',
          x: p.x + Math.cos(a) * d,
          y: p.y + Math.sin(a) * d - 20,
          r: 4 + Math.random() * 4,
          rot: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 20,
          vy: 15 + Math.random() * 20,
          life: 0.8 + Math.random() * 0.6,
          maxLife: 0.8 + Math.random() * 0.6
        });
      }
    }
  }

  updateSolarFlare(dt) {
    if (!this.lastSolarFlareTick) this.lastSolarFlareTick = 0;
    const now = Date.now();
    if (now - this.lastSolarFlareTick > 1000) {
      this.lastSolarFlareTick = now;
      
      let inShade = false;
      const p = this.player;
      if (this.staticObstacles) {
        for (let i = 0; i < this.staticObstacles.length; i++) {
          const obs = this.staticObstacles[i];
          if (obs.type === 'tree' || obs.type === 'rock') {
            const dist = Math.hypot(p.x - obs.x, p.y - obs.y);
            if (dist < obs.r * 1.8) {
              inShade = true;
              break;
            }
          }
        }
      }
      
      if (!inShade) {
        this.takeDamage(3);
        this.addFloat(p.x, p.y - 45, '-3 HP ☀️', '#ef4444', false);
      } else {
        this.addFloat(p.x, p.y - 45, '🛡️ Trong bóng mát', '#4ade80', false);
      }
    }
  }

  drawNightOverlay(ctx) {
    if (this.dayNightCycle !== 'night') return;
    
    if (!this.maskCanvas) {
      this.maskCanvas = document.createElement('canvas');
      this.maskCtx = this.maskCanvas.getContext('2d', { alpha: true, willReadFrequently: false });
    }
    if (this.maskCanvas.width !== this.canvas.width || this.maskCanvas.height !== this.canvas.height) {
      this.maskCanvas.width = this.canvas.width;
      this.maskCanvas.height = this.canvas.height;
    }
    
    const mctx = this.maskCtx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    mctx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
    mctx.fillStyle = 'rgba(6, 8, 24, 0.84)';
    mctx.fillRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
    
    mctx.globalCompositeOperation = 'destination-out';
    
    const drawWorldLight = (wx, wy, radius, intensity = 1.0) => {
      const sx = wx - this.cam.x + this.canvas.width / 2;
      const sy = wy - this.cam.y + this.canvas.height / 2;
      
      const grad = mctx.createRadialGradient(sx, sy, 5, sx, sy, radius);
      grad.addColorStop(0, `rgba(0, 0, 0, ${intensity})`);
      grad.addColorStop(0.3, `rgba(0, 0, 0, ${intensity * 0.8})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      mctx.fillStyle = grad;
      mctx.beginPath();
      mctx.arc(sx, sy, radius, 0, Math.PI * 2);
      mctx.fill();
    };
    
    drawWorldLight(this.player.x, this.player.y, 220, 1.0);
    
    if (this.merchant && this.merchant.active) {
      drawWorldLight(this.merchant.x, this.merchant.y, 160, 1.0);
    }
    
    if (this.shrines) {
      this.shrines.forEach(s => {
        if (s.active) {
          drawWorldLight(s.x, s.y, 100, 0.8);
        }
      });
    }
    
    if (this.demonicAltar && this.demonicAltar.active) {
      drawWorldLight(this.demonicAltar.x, this.demonicAltar.y, 120, 0.8);
    }
    
    this.projectiles.forEach(p => {
      if (p.color === '#ef4444' || p.color === '#f97316' || p.color === '#fde047' || p.isVoidReaver) {
        drawWorldLight(p.x, p.y, p.radius * 4, 0.7);
      }
    });
    
    ctx.drawImage(this.maskCanvas, 0, 0);
    ctx.restore();
  }

  drawWeatherEffects(ctx) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const t = Date.now();
    
    if (this.currentWeather === 'blizzard') {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      // Blue tint overlay for freezing cold atmosphere
      ctx.fillStyle = 'rgba(186, 230, 253, 0.12)';
      ctx.fillRect(0, 0, W, H);
      
      const wind = Math.sin(t * 0.0003) * 30; // Wind sway simulation
      
      for (let i = 0; i < 90; i++) {
        const seed = i * 137.508;
        const speed = 0.06 + (i % 5) * 0.02;
        const x = ((seed * 97 + t * speed + wind) % W + W) % W;
        const y = ((seed * 53 + t * (speed * 1.4)) % H + H) % H;
        const size = 1.5 + (i % 4) * 0.8;
        const alpha = 0.5 + Math.sin(t * 0.002 + i) * 0.25;
        
        // Render 6-pointed simplified snowflake star
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 0.001 + i);
        ctx.strokeStyle = `rgba(226, 232, 240, ${alpha})`;
        ctx.lineWidth = size * 0.4;
        ctx.shadowColor = '#bfdbfe';
        ctx.shadowBlur = 4;
        
        for (let arm = 0; arm < 3; arm++) {
          ctx.beginPath();
          ctx.moveTo(-size, 0);
          ctx.lineTo(size, 0);
          ctx.stroke();
          ctx.rotate(Math.PI / 3);
        }
        ctx.restore();
      }
      
      // Ground snow accumulation effect waves at bottom
      ctx.fillStyle = 'rgba(248, 250, 252, 0.22)';
      ctx.beginPath();
      let started = false;
      for (let x = 0; x <= W; x += 20) {
        const snowH = 8 + Math.sin(x * 0.05 + t * 0.0002) * 4;
        if (!started) {
          ctx.moveTo(x, H - snowH);
          started = true;
        } else {
          ctx.lineTo(x, H - snowH);
        }
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }
    else if (this.currentWeather === 'thunderstorm') {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      // Dark stormy purple overlay
      ctx.fillStyle = 'rgba(30, 20, 60, 0.18)';
      ctx.fillRect(0, 0, W, H);
      
      // Dynamic glowing blue-white rain drops
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.55)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 80; i++) {
        const x = (i * 67 + t * 0.4) % W;
        const y = (i * 113 + t * 0.8) % H;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 4, y + 18);
        ctx.stroke();
      }
      
      // Periodic lightning bolts flashing the arena
      const lightPhase = Math.floor(t / 2500) % 10;
      if (lightPhase < 2) {
        const lx = ((Math.floor(t / 2500) * 137) % (W - 100)) + 50;
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 18;
        
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx + 15, H * 0.28);
        ctx.lineTo(lx - 10, H * 0.52);
        ctx.lineTo(lx + 20, H);
        ctx.stroke();
        
        // Bright environmental flash overlay
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(253, 224, 71, 0.05)';
        ctx.fillRect(0, 0, W, H);
      }
      
      ctx.restore();
    }
    else if (this.currentWeather === 'solar_flare') {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const alpha = 0.12 + Math.sin(t / 600) * 0.04;
      ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  triggerWallSlam(e, obs) {
    if (e.lastWallSlam && Date.now() - e.lastWallSlam < 1000) return;
    e.lastWallSlam = Date.now();
    
    // Damage enemy
    const slamDmg = Math.round(e.dmg * 1.5 + 40 * this.player.dmgMult);
    this.dealDamage(e, slamDmg);
    e.stunUntil = Math.max(e.stunUntil || 0, Date.now() + 2000);
    this.addFloat(e.x, e.y - e.r - 20, '💥 WALL SLAM!', '#f97316', true);
    
    // Damage obstacle
    if (obs.hp !== undefined) {
      obs.hp -= 35;
      if (obs.hp <= 0) {
        this.destroyObstacle(obs);
      }
    }
    
    // Spawn particles based on obstacle type
    let color = '#78350f';
    if (obs.type === 'rock') color = '#94a3b8';
    else if (obs.type === 'void_pillar') color = '#7c3aed';
    else if (obs.type === 'bookcase') color = '#b45309';
    
    this.spawnParticles(obs.x, obs.y, color, 10, 3.5);
    this.screenShake(6, 0.15);
  }

  destroyObstacle(obs, index) {
    if (index === undefined && this.staticObstacles) {
      index = this.staticObstacles.indexOf(obs);
    }
    if (index !== -1 && index !== undefined && this.staticObstacles) {
      this.staticObstacles.splice(index, 1);
    }
    
    let color = '#78350f';
    if (obs.type === 'rock') color = '#94a3b8';
    else if (obs.type === 'void_pillar') color = '#7c3aed';
    else if (obs.type === 'bookcase') color = '#b45309';
    
    this.spawnParticles(obs.x, obs.y, color, 12, 4.5);
    
    const goldCount = 4 + Math.floor(Math.random() * 5);
    const goldBonus = this.player.goldBonus || 1.0;
    for (let i = 0; i < goldCount; i++) {
      const angleG = Math.random() * Math.PI * 2;
      const speedG = 40 + Math.random() * 80;
      const value = Math.round((2 + Math.floor(Math.random() * 3)) * goldBonus);
      this.particles.push({
        type: 'gold_orb',
        x: obs.x,
        y: obs.y,
        vx: Math.cos(angleG) * speedG,
        vy: Math.sin(angleG) * speedG,
        r: 6,
        color: '#fbbf24',
        value: value,
        life: 35,
        maxLife: 35,
        glow: true
      });
    }
    
    const xpBonus = this.player.xpGainMult || 1.0;
    for (let i = 0; i < 2; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 45 + Math.random() * 65;
      const value = Math.round(8 * xpBonus);
      this.particles.push({
        type: 'xp_orb',
        gemTier: 'medium',
        x: obs.x + (Math.random() - 0.5) * 20,
        y: obs.y + (Math.random() - 0.5) * 20,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        r: 6,
        color: '#38bdf8',
        value: value,
        life: 40,
        maxLife: 40,
        glow: true,
        pulse: Math.random() * Math.PI * 2
      });
    }
    
    this.screenShake(5, 0.12);
  }

  // ─── ROUND 3 UPDATES & HELPERS: PART 2 ──────────────────────
  // NOTE: updateMerchantRescue and triggerMerchantRescueEvent are defined above (~line 9041)
  // The duplicate definitions below were removed to prevent method override bugs.

  endMerchantRescueEvent(success) {
    this.merchantRescueActive = false;
    const mission = this.currentRescueMission;
    this.currentRescueMission = null;

    // Hide rescue HUD pill
    const rescueDisplay = document.getElementById('pveRescueDisplay');
    if (rescueDisplay) rescueDisplay.classList.add('hidden');

    if (success) {
      this.merchantRescueSuccess = true;
      const reward = mission ? mission.reward : 'discount';

      if (reward === 'discount' || reward === 'both') {
        this.merchantPriceDiscount = 0.5;
        this.merchantDiscountExpires = Date.now() + 300000;
      }
      if (reward === 'gold' || reward === 'both') {
        // Drop extra gold orbs as reward
        const bonusGold = 80 + Math.floor(Math.random() * 80);
        this.totalGold += bonusGold;
        this.addFloat(this.merchant.x, this.merchant.y - 40, `+${bonusGold}🪙 Phần thưởng giải cứu!`, '#fbbf24', true);
      }

      const successMsg = mission ? `✅ ${mission.title} — THÀNH CÔNG!` : '✅ GIẢI CỨU THÀNH CÔNG!';
      const rewardNote = reward === 'discount' ? ' (Giảm giá 50%)' : reward === 'gold' ? ' (+Vàng thưởng)' : ' (Giảm giá + Vàng)';
      this.addFloat(this.player.x, this.player.y - 120, successMsg + rewardNote, '#4ade80', true);
      this.spawnGoldenEgg(this.merchant.x, this.merchant.y);
      this.screenShake(5, 0.15);
    } else {
      this.merchantRescueSuccess = false;
      this.merchant.active = false;
      this.merchantRespawnTime = Date.now() + 180000;
      this.merchantPriceDiscount = 1.3;
      const failMsg = mission ? `❌ ${mission.title} — THẤT BẠI!` : '❌ THƯƠNG NHÂN ĐÃ HY SINH!';
      this.addFloat(this.player.x, this.player.y - 120, failMsg + ' (Tăng giá 30%)', '#ef4444', true);
    }
  }

  spawnGoldenEgg(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40;
    this.particles.push({
      type: 'golden_egg',
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 12,
      color: '#fbbf24',
      life: 9999,
      maxLife: 9999,
      glow: true
    });
  }

  collectGoldenEgg() {
    const p = this.player;
    this.spawnParticles(p.x, p.y, '#fbbf24', 40, 6);
    this.screenShake(10, 0.3);
    
    const stats = ['might', 'speed', 'regen', 'maxHp', 'crit'];
    const chosen = stats[Math.floor(Math.random() * stats.length)];
    
    let label = '';
    if (chosen === 'might') {
      p.eggDmgBonus = (p.eggDmgBonus || 0.0) + 0.10;
      label = '🔥 Cường hóa lực đánh (+10% Sát thương)';
    } else if (chosen === 'speed') {
      p.eggSpeedBonus = (p.eggSpeedBonus || 0) + 20;
      label = '💨 Thần phong bộ (+20 Tốc độ)';
    } else if (chosen === 'regen') {
      p.eggRegenBonus = (p.eggRegenBonus || 0) + 3;
      label = '💚 Sinh mệnh hồi phục (+3 HP/s)';
    } else if (chosen === 'maxHp') {
      p.eggMaxHpBonus = (p.eggMaxHpBonus || 0) + 50;
      p.hp = Math.min(p.maxHp + 50, p.hp + 50);
      label = '❤️ Long cốt thể chất (+50 Max HP)';
    } else if (chosen === 'crit') {
      p.eggCritBonus = (p.eggCritBonus || 0.0) + 0.05;
      label = '🍀 Linh nhãn chí mạng (+5% Crit)';
    }
    
    this.recalculatePassiveStats();
    
    this.addFloat(p.x, p.y - 60, '🥚 NHẬN TRỨNG VÀNG!', '#fbbf24', true);
    this.addFloat(p.x, p.y - 90, label, '#fffbeb', true);
  }

  updateShrinesAndAltars(dt) {
    if (this.activeShrineBuffs) {
      if (this.activeShrineBuffs.speed > 0) this.activeShrineBuffs.speed -= dt;
      if (this.activeShrineBuffs.power > 0) this.activeShrineBuffs.power -= dt;
      if (this.activeShrineBuffs.gold > 0) this.activeShrineBuffs.gold -= dt;
    }
    
    if (this.shrines) {
      this.shrines.forEach(s => {
        if (!s.active) {
          s.cooldownRemaining -= dt;
          if (s.cooldownRemaining <= 0) {
            s.active = true;
            s.cooldownRemaining = 0;
            this.addFloat(s.x, s.y - 64, '✨ ĐÃ HỒI PHỤC!', '#34d399', false);
          }
        }
      });
    }

    if (this.merchant && !this.merchant.active && this.merchantRespawnTime) {
      if (Date.now() > this.merchantRespawnTime) {
        this.merchant.active = true;
        this.merchant.hp = 1200;
        this.merchant.maxHp = 1200;
        this.merchant.x = this.player.x + (Math.random() - 0.5) * 200;
        this.merchant.y = this.player.y + (Math.random() - 0.5) * 200;
        this.addFloat(this.player.x, this.player.y - 120, '⚖️ THƯƠNG NHÂN ĐÃ TRỞ LẠI!', '#fbbf24', true);
      }
    }

    if (this.merchantDiscountExpires && Date.now() > this.merchantDiscountExpires) {
      this.merchantPriceDiscount = 1.0;
      this.merchantDiscountExpires = null;
      this.addFloat(this.player.x, this.player.y - 120, 'ℹ️ Hết thời hạn giảm giá shop!', '#94a3b8', false);
    }
  }

  activateShrine(s) {
    s.active = false;
    s.cooldownRemaining = 180;
    
    let buffType = s.type;
    this.activeShrineBuffs[buffType] = 45;
    
    let label = '';
    let color = '';
    if (buffType === 'speed') {
      label = '⚡ SPEED SHRINE ACTIVATED! (+40% Tốc chạy)';
      color = '#38bdf8';
    } else if (buffType === 'power') {
      label = '💥 POWER SHRINE ACTIVATED! (+50% Sát thương)';
      color = '#ef4444';
    } else if (buffType === 'gold') {
      label = '🪙 GOLD SHRINE ACTIVATED! (Nhân đôi Vàng nhặt)';
      color = '#fbbf24';
    }
    
    this.addFloat(this.player.x, this.player.y - 60, label, color, true);
    this.spawnParticles(s.x, s.y, color, 30, 5);
    this.screenShake(5, 0.15);
  }

  drawShrine(ctx, s) {
    const t = Date.now();
    ctx.save();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 10, s.r * 1.2, s.r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const baseColor = '#475569';
    ctx.fillStyle = baseColor;
    ctx.fillRect(s.x - 12, s.y - 30, 24, 40);
    
    ctx.fillStyle = '#64748b';
    ctx.fillRect(s.x - 16, s.y - 36, 32, 8);
    
    let color = '#38bdf8';
    if (s.type === 'power') color = '#ef4444';
    if (s.type === 'gold') color = '#fbbf24';
    
    if (s.active) {
      const pulseY = Math.sin(t / 150) * 3;
      const orbY = s.y - 48 + pulseY;
      
      ctx.shadowColor = color;
      ctx.shadowBlur = 12 + Math.sin(t / 150) * 4;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(s.x, orbY, 7, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      
      const dist = Math.hypot(this.player.x - s.x, this.player.y - s.y);
      if (dist < 80) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 11px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText('[Phím E]', s.x, s.y - 64);
      }
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(s.x, s.y - 48, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ef4444';
      ctx.font = '700 10px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(s.cooldownRemaining)}s`, s.x, s.y - 64);
    }
    
    ctx.restore();
  }

  drawDemonicAltar(ctx, alt) {
    const t = Date.now();
    const pulse = Math.sin(t / 300);
    const pulse2 = Math.sin(t / 180 + 1.2);
    ctx.save();
    ctx.translate(alt.x, alt.y);

    // --- Ground shadow / lava pool ---
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 10, alt.r * 1.8, alt.r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Hell fire rings (animated, rotating) ---
    for (let ring = 0; ring < 3; ring++) {
      const ringR = alt.r * (0.7 + ring * 0.35);
      const alpha = 0.4 - ring * 0.1;
      const rot = (t / (900 + ring * 300)) * (ring % 2 === 0 ? 1 : -1);
      ctx.strokeStyle = `rgba(239,${68 + ring * 20},${68 - ring * 15},${alpha})`;
      ctx.lineWidth = 2.5 - ring * 0.5;
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 12 + pulse * 5;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.ellipse(0, 0, ringR, ringR * 0.45, rot, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // --- Stone altar base ---
    ctx.fillStyle = '#1a0000';
    ctx.beginPath();
    ctx.rect(-alt.r * 0.8, -alt.r * 0.3, alt.r * 1.6, alt.r * 0.9);
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Blood rune on altar face ---
    ctx.fillStyle = `rgba(220,38,38,${0.5 + pulse2 * 0.3})`;
    ctx.font = `bold ${12 + Math.round(pulse)}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText('✦ ☠ ✦', 0, 2);

    // --- Demon body (main figure) ---
    const bobY = Math.sin(t / 500) * 2;

    // Demon body
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 20 + pulse * 8;
    ctx.fillStyle = '#3b0000';
    ctx.beginPath();
    ctx.ellipse(0, -alt.r * 0.9 + bobY, alt.r * 0.52, alt.r * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Demon belly highlight
    ctx.fillStyle = 'rgba(127,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(0, -alt.r * 0.85 + bobY, alt.r * 0.28, alt.r * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Demon head
    ctx.fillStyle = '#2d0000';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, -alt.r * 1.65 + bobY, alt.r * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Left horn
    ctx.fillStyle = '#1a0000';
    ctx.beginPath();
    ctx.moveTo(-alt.r * 0.25, -alt.r * 1.85 + bobY);
    ctx.lineTo(-alt.r * 0.5, -alt.r * 2.3 + bobY);
    ctx.lineTo(-alt.r * 0.1, -alt.r * 1.95 + bobY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 1; ctx.stroke();

    // Right horn
    ctx.fillStyle = '#1a0000';
    ctx.beginPath();
    ctx.moveTo(alt.r * 0.25, -alt.r * 1.85 + bobY);
    ctx.lineTo(alt.r * 0.5, -alt.r * 2.3 + bobY);
    ctx.lineTo(alt.r * 0.1, -alt.r * 1.95 + bobY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d'; ctx.stroke();

    // Glowing eyes
    const eyeGlow = 8 + pulse2 * 6;
    ctx.shadowColor = '#ff4500';
    ctx.shadowBlur = eyeGlow;
    ctx.fillStyle = '#ff4500';
    ctx.beginPath();
    ctx.ellipse(-alt.r * 0.14, -alt.r * 1.68 + bobY, 3.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(alt.r * 0.14, -alt.r * 1.68 + bobY, 3.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Demon smile (evil grin)
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ff4500';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -alt.r * 1.57 + bobY, alt.r * 0.18, 0.2, Math.PI - 0.2, false);
    ctx.stroke();

    // Wings (left)
    ctx.fillStyle = 'rgba(127, 0, 0, 0.6)';
    ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-alt.r * 0.5, -alt.r * 1.2 + bobY);
    ctx.bezierCurveTo(-alt.r * 1.3, -alt.r * 1.8 + bobY, -alt.r * 1.5, -alt.r * 0.8 + bobY, -alt.r * 0.5, -alt.r * 0.6 + bobY);
    ctx.closePath();
    ctx.fill();

    // Wings (right)
    ctx.beginPath();
    ctx.moveTo(alt.r * 0.5, -alt.r * 1.2 + bobY);
    ctx.bezierCurveTo(alt.r * 1.3, -alt.r * 1.8 + bobY, alt.r * 1.5, -alt.r * 0.8 + bobY, alt.r * 0.5, -alt.r * 0.6 + bobY);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Floating lava sparks
    const now2 = t * 0.001;
    for (let i = 0; i < 5; i++) {
      const sa = (i / 5) * Math.PI * 2 + now2 * 0.7;
      const sr = alt.r * (0.6 + Math.sin(now2 + i) * 0.2);
      const sy = Math.sin(now2 * 1.5 + i * 1.3) * alt.r * 0.3;
      ctx.fillStyle = `rgba(239,${68 + i * 18},0,${0.6 + Math.sin(now2 + i) * 0.3})`;
      ctx.shadowColor = '#ff4500'; ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(Math.cos(sa) * sr, -alt.r * 0.5 + sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // --- Label above ---
    ctx.fillStyle = '#ef4444';
    ctx.font = '800 11px Outfit';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 10; ctx.shadowColor = '#ef4444';
    ctx.fillText('👹 GIAO KÈO ÁC QUỶ 👹', 0, -alt.r * 2.6 + bobY);
    ctx.shadowBlur = 0;

    const dist = Math.hypot(this.player.x - alt.x, this.player.y - alt.y);
    if (dist < 80) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 11px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText('[E] Giao Kèo', 0, -alt.r * 2.9 + bobY);
    }

    ctx.restore();
  }

  openDemonicAltar() {
    this.pause();
    this._demonicAltarOpen = true;

    // ★ RANDOM DEMONIC DEALS: pick 3 different deals from pool each time
    const DEMONIC_DEALS_POOL = [
      {
        id: 'blood',
        icon: '🩸',
        title: 'HỢP ĐỒNG HUYẾT TẾ',
        cost: 'Mất vĩnh viễn -25% Máu tối đa',
        reward: '+40% Sát thương kỹ năng',
        costColor: '#fca5a5',
        rewardColor: '#fbbf24',
        apply: () => this.acceptDemonicDeal('blood')
      },
      {
        id: 'curse',
        icon: '💀',
        title: 'LỜI NGUYỀN CỦA QUỶ',
        cost: 'Quái vật sinh nhanh hơn 35%',
        reward: '+20% Tỷ lệ chí mạng',
        costColor: '#fca5a5',
        rewardColor: '#fbbf24',
        apply: () => this.acceptDemonicDeal('curse')
      },
      {
        id: 'void',
        icon: '🌀',
        title: 'VÒNG XOÁY HƯ VÔ',
        cost: 'Khóa vĩnh viễn hồi máu tự nhiên',
        reward: '+5% Hút máu (Lifesteal)',
        costColor: '#fca5a5',
        rewardColor: '#34d399',
        apply: () => this.acceptDemonicDeal('void')
      },
      {
        id: 'soul',
        icon: '👻',
        title: 'HIẾN DÂNG LINH HỒN',
        cost: '-30% Tốc độ di chuyển vĩnh viễn',
        reward: '+60% Sát thương tất cả kỹ năng',
        costColor: '#fca5a5',
        rewardColor: '#a78bfa',
        apply: () => this.acceptDemonicDealCustom({ spdMult: 0.70, dmgMult: 1.60 }, '👻 Hiến dâng linh hồn: -30% Tốc độ, +60% Sát thương!')
      },
      {
        id: 'pain',
        icon: '⚡',
        title: 'KHOAN KHOÁI TRONG ĐAU KHỔ',
        cost: 'Mỗi đòn trúng bạn mất 5 HP',
        reward: '+35% Sát thương + Phản 15% sát thương nhận vào',
        costColor: '#fca5a5',
        rewardColor: '#fbbf24',
        apply: () => this.acceptDemonicDealCustom({ masochist: true, dmgMult: 1.35, thorns: 0.15 }, '⚡ Đau khổ & Sức mạnh: Mất 5HP/đòn, +35% STH, Gai 15%!')
      },
      {
        id: 'frenzy',
        icon: '🔥',
        title: 'PHẪN NỘ ĐỊA NGỤC',
        cost: '-40% Phòng thủ vĩnh viễn',
        reward: '+25% Tốc đánh + AoE kỹ năng rộng hơn 20%',
        costColor: '#fca5a5',
        rewardColor: '#f97316',
        apply: () => this.acceptDemonicDealCustom({ defMult: 0.60, atkMult: 1.25, aoeMult: 1.20 }, '🔥 Phẫn Nộ Địa Ngục: -40% Giáp, +25% Tốc đánh, +20% AoE!')
      },
      {
        id: 'ghost',
        icon: '🌑',
        title: 'ĐỐI MẶT HƯ VÔ',
        cost: 'Mất 50% vàng hiện tại trong trận',
        reward: '+3 Kỹ năng random + Tốc độ hồi chiêu -20%',
        costColor: '#fca5a5',
        rewardColor: '#818cf8',
        apply: () => this.acceptDemonicDealGhost()
      },
      {
        id: 'dark_pact',
        icon: '🌙',
        title: 'ĐÊM VĨ ĐẠI',
        cost: 'Toàn bộ màn hình tối hơn (tầm nhìn -40%)',
        reward: '+50% Sát thương ban đêm + Nhìn xuyên màn đêm',
        costColor: '#94a3b8',
        rewardColor: '#c084fc',
        apply: () => this.acceptDemonicDealCustom({ darkSight: true, nightDmgBonus: 0.50 }, '🌙 Đêm Vĩ Đại: Tầm nhìn hẹp, +50% STH ban đêm!')
      },
      {
        id: 'lich',
        icon: '☠️',
        title: 'HIỆP ƯỚC THẦN CHẾT',
        cost: 'Không thể hồi sinh (mất trang bị Phoenix)',
        reward: 'Hút máu +8% + Mỗi kill hồi 2% MaxHP',
        costColor: '#fca5a5',
        rewardColor: '#34d399',
        apply: () => this.acceptDemonicDealCustom({ noRevive: true, lifesteal: 0.08, killHealPct: 0.02 }, '☠️ Hiệp Ước Thần Chết: Không hồi sinh, +8% Hút máu, hồi máu mỗi kill!')
      }
    ];

    // Shuffle and pick 3 random deals
    const shuffled = DEMONIC_DEALS_POOL.slice().sort(() => 0.5 - Math.random());
    const pickedDeals = shuffled.slice(0, 3);

    const container = document.getElementById('demonicChoices');
    if (container) {
      container.innerHTML = '';
      pickedDeals.forEach(deal => {
        const btn = document.createElement('button');
        btn.className = 'pve-btn pve-btn-primary';
        btn.style.cssText = 'background: linear-gradient(135deg, #7f1d1d, #450a0a); border: 1px solid #ef4444; width: 100%; margin: 0; text-align: left; padding: 14px 20px; cursor:pointer;';
        btn.innerHTML = `
          <span style="font-size:16px;font-weight:800;color:#fca5a5;display:block;">${deal.icon} ${deal.title}</span>
          <span style="font-size:11px;display:block;margin-top:5px;">
            <span style="color:${deal.costColor};">⬇ ${deal.cost}</span>
            <br><span style="color:${deal.rewardColor};font-weight:700;">⬆ ${deal.reward}</span>
          </span>`;
        btn.onclick = () => { deal.apply(); };
        container.appendChild(btn);
      });
    }

    document.getElementById('demonicAltarModal').classList.remove('hidden');
  }

  closeDemonicAltarModal() {
    this.resume();
    this._demonicAltarOpen = false;
    document.getElementById('demonicAltarModal').classList.add('hidden');
  }

  acceptDemonicDeal(type) {
    const p = this.player;
    this.screenShake(15, 0.4);
    
    if (type === 'blood') {
      p.demonicMaxHpLossPct = (p.demonicMaxHpLossPct || 0.0) + 0.25;
      p.demonicDmgMult = (p.demonicDmgMult || 1.0) + 0.40;
      this.recalculatePassiveStats();
      this.addFloat(p.x, p.y - 60, `🩸 Huyết tế: Mất 25% Max HP, +40% Sát thương!`, '#ef4444', true);
    } 
    else if (type === 'curse') {
      p.spawnRateMult = (p.spawnRateMult || 1.0) * 1.35;
      p.demonicCritChance = (p.demonicCritChance || 0.0) + 0.20;
      this.recalculatePassiveStats();
      this.addFloat(p.x, p.y - 60, `💀 Lời nguyền: Quái sinh nhanh hơn 35%, +20% Chí mạng!`, '#f87171', true);
    } 
    else if (type === 'void') {
      p.hasDemonicVoidRegenBan = true;
      p.demonicLifesteal = (p.demonicLifesteal || 0.0) + 0.05;
      this.recalculatePassiveStats();
      this.addFloat(p.x, p.y - 60, `🌀 Hư vô: Khóa hồi máu tự nhiên, +5% Hút máu!`, '#7c3aed', true);
    }
    
    if (this.demonicAltar) {
      this.demonicAltar.active = false;
    }
    
    this.closeDemonicAltarModal();
  }

  // ★ Custom demonic deal - applies generic stat modifiers
  acceptDemonicDealCustom(mods, floatMsg) {
    const p = this.player;
    this.screenShake(15, 0.4);
    
    if (mods.spdMult !== undefined)   p.spdMult   = (p.spdMult   || 1.0) * mods.spdMult;
    if (mods.dmgMult !== undefined)   p.dmgMult   = (p.dmgMult   || 1.0) * mods.dmgMult;
    if (mods.defMult !== undefined)   p.demonicDefMult   = (p.demonicDefMult   || 1.0) * mods.defMult;
    if (mods.atkMult !== undefined)   p.atkMult   = (p.atkMult   || 1.0) * mods.atkMult;
    if (mods.aoeMult !== undefined)   p.aoeMult   = (p.aoeMult   || 1.0) * mods.aoeMult;
    if (mods.cdMult  !== undefined)   p.cdMult    = (p.cdMult    || 1.0) * mods.cdMult;
    if (mods.lifesteal !== undefined) p.lifesteal = (p.lifesteal || 0)   + mods.lifesteal;
    if (mods.thorns  !== undefined)   p.thorns    = (p.thorns    || 0)   + mods.thorns;
    if (mods.masochist)               p.demonicMasochist = true;
    if (mods.darkSight)               p.demonicDarkSight = true;
    if (mods.nightDmgBonus !== undefined) p.demonicNightDmgBonus = (p.demonicNightDmgBonus || 0) + mods.nightDmgBonus;
    if (mods.killHealPct !== undefined)   p.demonicKillHealPct  = (p.demonicKillHealPct  || 0) + mods.killHealPct;
    if (mods.noRevive) { p.noRevive = true; p.reviveUsed = true; }

    this.recalculatePassiveStats();
    this.addFloat(p.x, p.y - 60, floatMsg || '😈 Giao kèo hoàn thành!', '#ef4444', true);
    this.spawnParticles(p.x, p.y, '#ef4444', 25, 5);

    if (this.demonicAltar) this.demonicAltar.active = false;
    this.closeDemonicAltarModal();
  }

  // ★ Ghost deal: sacrifice 50% gold, gain 3 random skills + -20% cooldown
  acceptDemonicDealGhost() {
    const p = this.player;
    this.screenShake(12, 0.35);

    // Sacrifice gold
    const goldLost = Math.floor(this.totalGold * 0.5);
    this.totalGold = Math.max(0, this.totalGold - goldLost);

    // Grant 3 random branch skills if possible
    const branch = p.branch || 'assassin';
    const ownedIds = this.skills.map(s => s.id);
    const branchSkills = Object.keys(SKILL_DEFS).filter(id => {
      const d = SKILL_DEFS[id];
      return !d.isLegendary && d.branch === branch && !ownedIds.includes(id);
    });
    let added = 0;
    for (const id of branchSkills.sort(() => 0.5 - Math.random())) {
      if (added >= 3) break;
      this.addSkill(id);
      added++;
    }

    // Reduce cooldown
    p.cdMult = (p.cdMult || 1.0) * 0.80;
    this.recalculatePassiveStats();

    this.addFloat(p.x, p.y - 60, `🌑 Đối Mặt Hư Vô: Mất ${goldLost}🪙, +${added} kỹ năng, -20% Hồi chiêu!`, '#818cf8', true);
    this.spawnParticles(p.x, p.y, '#818cf8', 30, 6);

    if (this.demonicAltar) this.demonicAltar.active = false;
    this.closeDemonicAltarModal();
  }
}

const EVO_COMBOS = [
  { baseSkill: 'magic_missile', passiveItem: 'empty_tome', evolvedSkill: 'spell_storm', type: 'EVOLUTION' },
  { baseSkill: 'piercing_arrow', passiveItem: 'wings', evolvedSkill: 'wind_runner', type: 'EVOLUTION' },
  { baseSkill: 'shadow_blades', passiveItem: 'clover', evolvedSkill: 'void_reaver', type: 'EVOLUTION' },
  { baseSkill: 'shield_bash', passiveItem: 'armor_plate', evolvedSkill: 'aegis_smash', type: 'EVOLUTION' },
  { baseSkill: 'fireball', passiveItem: 'spinach', evolvedSkill: 'hellfire_meteor', type: 'EVOLUTION' },
  { baseSkill: 'briar_patch', passiveItem: 'hollow_heart', evolvedSkill: 'genesis_bloom', type: 'EVOLUTION' },
  { baseSkill: 'summon_skeleton', passiveItem: 'attractorb', evolvedSkill: 'grim_reaper', type: 'EVOLUTION' },
  { baseSkill: 'holy_light', passiveItem: 'empty_tome', evolvedSkill: 'archangel_light', type: 'GIFT' },
  { baseSkill: 'shadow_clone', passiveItem: 'clover', evolvedSkill: 'void_demon', type: 'MORPH' }
];

const UNION_COMBOS = [
  { baseSkill1: 'frost_aura', baseSkill2: 'consecration', evolvedSkill: 'glacial_sanctum', type: 'UNION' },
  { baseSkill1: 'magic_missile', baseSkill2: 'thunder_ring', evolvedSkill: 'spell_storm', type: 'UNION' },
  { baseSkill1: 'piercing_arrow', baseSkill2: 'arrow_rain', evolvedSkill: 'wind_runner', type: 'UNION' },
  { baseSkill1: 'briar_patch', baseSkill2: 'vine_whip', evolvedSkill: 'genesis_bloom', type: 'UNION' },
  { baseSkill1: 'summon_skeleton', baseSkill2: 'death_grasp', evolvedSkill: 'grim_reaper', type: 'UNION' }
];

function closeEvolutionModal() {
  const screen = document.getElementById('pveEvolutionScreen');
  if (screen) screen.classList.add('hidden');
  if (G) G.resume();
}
window.closeEvolutionModal = closeEvolutionModal;


// ─── UTILITY ──────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
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

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// ══════════════════════════════════════════════════════════════
//  CHARACTER DRAWING — Ported from game.js
// ══════════════════════════════════════════════════════════════
function drawCharacter(sp, cp, ctx) {
  let skin = getCharacterSkin(sp.brnch, sp.lvl);
  if (sp.isMorphed) {
    skin = {
      bodyHL: '#ef4444',
      body1: '#7f1d1d',
      body2: '#450a0a',
      outline: '#f87171',
      aura: '#ef4444',
      skinType: 'demon'
    };
  }
  const r    = sp.radius;
  const t    = Date.now();
  const isMe = sp.isPlayer;
  const hitFlash   = (t - cp.lastHit) < 175;
  const moving = sp.vx !== 0 || sp.vy !== 0;

  ctx.save();
  if (sp.stealth) {
    ctx.globalAlpha = 0.5;
  }
  ctx.translate(cp.x, cp.y);

  // Ground shadow
  ctx.beginPath(); ctx.ellipse(0, r * 0.9, r * 0.9, r * 0.45, 0, 0, Math.PI*2); ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fill();

  // Omega gravity ring (Lv10)
  if (sp.lvl === 10) drawOmegaRing(ctx, r, t);

  // Aura ring (Lv2+)
  if (sp.lvl >= 2 && skin.aura) drawAuraRing(ctx, r, skin.aura, sp.lvl, t);

  // Boss fire ring (Lv6+)
  if (sp.isBoss || sp.lvl >= 6) drawBossFireRing(ctx, r, t, sp.lvl);

  // Elite Neon Ring
  if (sp.isElite) drawEliteNeonRing(ctx, r, t);

  // Shadow blink ghost (Lv8)
  if (sp.lvl === 8 && moving) drawShadowGhost(ctx, r, t, cp);

  // Draw 2.5D Feet (Under the body sphere)
  drawFeet(ctx, r, t, moving, skin);

  // Waddle + Breathe + Leaning + Bobbing
  const breathY = Math.sin(t/190)*0.048;
  let squashX = 1 + breathY;
  let squashY = 1 - breathY;

  // Stride bobbing
  const moveBob = moving ? Math.abs(Math.sin(t / 120)) * r * 0.08 : 0;
  // Leaning in velocity direction
  const leanAngle = moving ? sp.vx * 0.06 : 0;

  let waddleA = moving ? Math.sin(t/(75+sp.lvl*8))*0.12 : 0;

  // Attack animation state
  let attacking = false;
  let attackProgress = 0;
  if (cp.attackAnim) {
    const elapsed = t - cp.attackAnim.t;
    if (elapsed < cp.attackAnim.duration) {
      attacking = true;
      attackProgress = elapsed / cp.attackAnim.duration;
    }
  }

  ctx.save();
  ctx.translate(0, -moveBob);
  ctx.rotate(leanAngle);

  if (attacking) {
    if (sp.brnch === 'assassin') {
      const dashDist = Math.sin(attackProgress * Math.PI) * r * 0.35;
      ctx.translate(dashDist, 0);
      ctx.rotate(-Math.sin(attackProgress * Math.PI) * 0.2);
    } else if (sp.brnch === 'fighter') {
      const swingTilt = Math.sin(attackProgress * Math.PI) * 0.25;
      ctx.rotate(swingTilt);
    } else if (sp.brnch === 'mage') {
      const tilt = Math.sin(attackProgress * Math.PI) * 0.15;
      ctx.rotate(tilt);
    } else {
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

  // Draw Armor Overlay (Overlay on top of body sphere)
  if (isMe && sp.equippedArmor) {
    drawArmorOverlay(ctx, r, t, sp.equippedArmor.id);
  }

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

  // Equipped Weapon or default branch equipments
  if (isMe && sp.equippedWeapon) {
    drawWeaponById(ctx, r, t, attacking, attackProgress, sp.equippedWeapon.id, sp.brnch);
  } else {
    // default branch weapons for enemies/bots or if player has no weapon
    drawWeaponById(ctx, r, t, attacking, attackProgress, null, sp.brnch);
  }

  // Extra off-hand shield for fighter class
  if (sp.brnch === 'fighter' && (!isMe || !sp.equippedWeapon || sp.equippedWeapon.id !== 'excalibur')) {
    drawFighterShield(ctx, r, attacking, attackProgress);
  }

  // Draw 2.5D Hands overlaying body & weapon
  const wpnType = (isMe && sp.equippedWeapon) ? sp.equippedWeapon.id : sp.brnch;
  drawHands(ctx, r, t, moving, attacking, attackProgress, skin, wpnType);

  drawEyes(ctx, r, cp, sp, skin, t);

  if (sp.lvl <= 4) drawCheeks(ctx, r);

  ctx.restore(); // waddle + translate offsets

  // Status overlays
  if (sp.stn)  drawStunStars(ctx,r,t);
  if (sp.shld) drawShieldHex(ctx,r,t);
  if (sp.slw)  drawSlowRings(ctx,r,t);
  if (sp.rage) drawRageFlames(ctx,r,t);

  ctx.restore(); // translate

  drawNameplate(ctx, cp, sp, r, isMe);
}

// ─── PROCEDURAL DRAWING UTILITIES FOR PROGRESSION & ANIMATION ───
function getCharacterSkin(brnch, lvl) {
  if (lvl >= 5 && brnch) {
    const brSkin = BRANCH_SKINS[brnch]?.[lvl];
    if (brSkin) return brSkin;
  }
  
  if (brnch) {
    const classBase = CLASSES[brnch];
    if (classBase) {
      const skinsDb = {
        assassin: {
          1: { name: 'Tập sự Sát Thủ', body1: '#4c1d95', body2: '#1e1b4b', bodyHL: '#c7d2fe', eye: '#a855f7', outline: '#0f172a', aura: null, skinType: 'leaf' },
          2: { name: 'Nhẫn giả', body1: '#6d28d9', body2: '#2e1065', bodyHL: '#ddd6fe', eye: '#c084fc', outline: '#000000', aura: '#c084fc', skinType: 'neko' },
          3: { name: 'Thợ săn bóng tối', body1: '#5b21b6', body2: '#1e1b4b', bodyHL: '#e9d5ff', eye: '#22d3ee', outline: '#000000', aura: '#8b5cf6', skinType: 'horns' },
          4: { name: 'Bóng ma', body1: '#1e1b4b', body2: '#090514', bodyHL: '#c7d2fe', eye: '#ec4899', outline: '#000000', aura: '#a855f7', skinType: 'shadow' }
        },
        fighter: {
          1: { name: 'Đấu sĩ tập sự', body1: '#b45309', body2: '#451a03', bodyHL: '#fde68a', eye: '#ca8a04', outline: '#27120f', aura: null, skinType: 'horns' },
          2: { name: 'Chiến binh', body1: '#d97706', body2: '#78350f', bodyHL: '#fef3c7', eye: '#fbbf24', outline: '#451a03', aura: '#fbbf24', skinType: 'horns' },
          3: { name: 'Hộ vệ thép', body1: '#f59e0b', body2: '#78350f', bodyHL: '#fffbeb', eye: '#ef4444', outline: '#451a03', aura: '#f97316', skinType: 'panda' },
          4: { name: 'Cuồng chiến sĩ', body1: '#dc2626', body2: '#7f1d1d', bodyHL: '#fecaca', eye: '#fbbf24', outline: '#450a0a', aura: '#ef4444', skinType: 'demon' }
        },
        mage: {
          1: { name: 'Học sinh Pháp thuật', body1: '#0369a1', body2: '#0c4a6e', bodyHL: '#bae6fd', eye: '#0ea5e9', outline: '#082f49', aura: null, skinType: 'leaf' },
          2: { name: 'Pháp sư tập sự', body1: '#0284c7', body2: '#0f172a', bodyHL: '#e0f2fe', eye: '#22d3ee', outline: '#0f172a', aura: '#38bdf8', skinType: 'neko' },
          3: { name: 'Nguyên tố sư', body1: '#2563eb', body2: '#1e3a8a', bodyHL: '#dbeafe', eye: '#ffffff', outline: '#1e1b4b', aura: '#818cf8', skinType: 'horns' },
          4: { name: 'Đại Pháp sư', body1: '#3b0764', body2: '#1e1b4b', bodyHL: '#f3e8ff', eye: '#c084fc', outline: '#000000', aura: '#a855f7', skinType: 'celestial' }
        },
        ranger: {
          1: { name: 'Thợ săn tập sự', body1: '#166534', body2: '#052e16', bodyHL: '#bbf7d0', eye: '#10b981', outline: '#052e16', aura: null, skinType: 'leaf' },
          2: { name: 'Cung thủ rừng xanh', body1: '#15803d', body2: '#064e3b', bodyHL: '#dcfce7', eye: '#4ade80', outline: '#000000', aura: '#4ade80', skinType: 'neko' },
          3: { name: 'Cung thủ tinh anh', body1: '#047857', body2: '#064e3b', bodyHL: '#a7f3d0', eye: '#22d3ee', outline: '#000000', aura: '#34d399', skinType: 'horns' },
          4: { name: 'Kiểm lâm thần thánh', body1: '#065f46', body2: '#022c22', bodyHL: '#e6fffa', eye: '#ffffff', outline: '#000000', aura: '#00f2fe', skinType: 'celestial' }
        },
        paladin: {
          1: { name: 'Hộ vệ ánh sáng', body1: '#a16207', body2: '#451a03', bodyHL: '#fef9c3', eye: '#ca8a04', outline: '#422006', aura: null, skinType: 'leaf' },
          2: { name: 'Kỵ sĩ tập sự', body1: '#ca8a04', body2: '#78350f', bodyHL: '#fde68a', eye: '#f59e0b', outline: '#451a03', aura: '#eab308', skinType: 'neko' },
          3: { name: 'Hiệp sĩ Thánh', body1: '#eab308', body2: '#7c2d12', bodyHL: '#fffbeb', eye: '#ffffff', outline: '#000000', aura: '#fbbf24', skinType: 'celestial' },
          4: { name: 'Vệ binh Ánh sáng', body1: '#fbbf24', body2: '#92400e', bodyHL: '#ffffff', eye: '#ffffff', outline: '#451a03', aura: '#fbbf24', skinType: 'celestial' }
        },
        necromancer: {
          1: { name: 'Tập tế Vong hồn', body1: '#475569', body2: '#1e293b', bodyHL: '#cbd5e1', eye: '#a855f7', outline: '#0f172a', aura: null, skinType: 'leaf' },
          2: { name: 'Thuật sĩ Xương', body1: '#334155', body2: '#0f172a', bodyHL: '#94a3b8', eye: '#22d3ee', outline: '#000000', aura: '#475569', skinType: 'horns' },
          3: { name: 'Triệu hồi sư quỷ', body1: '#1e1b4b', body2: '#0f0e26', bodyHL: '#c7d2fe', eye: '#f87171', outline: '#000000', aura: '#8b5cf6', skinType: 'demon' },
          4: { name: 'Chúa tể Vong linh', body1: '#3b0764', body2: '#090514', bodyHL: '#ddd6fe', eye: '#c084fc', outline: '#000000', aura: '#a855f7', skinType: 'shadow' }
        },
        druid: {
          1: { name: 'Dân rừng hoang', body1: '#14532d', body2: '#022c22', bodyHL: '#bbf7d0', eye: '#22c55e', outline: '#052e16', aura: null, skinType: 'leaf' },
          2: { name: 'Mộc nhân sư', body1: '#166534', body2: '#052e16', bodyHL: '#dcfce7', eye: '#4ade80', outline: '#052e16', aura: '#86efac', skinType: 'neko' },
          3: { name: 'Pháp sư Thiên nhiên', body1: '#15803d', body2: '#7c2d12', bodyHL: '#e8f5e9', eye: '#fbbf24', outline: '#000000', aura: '#4ade80', skinType: 'panda' },
          4: { name: 'Thần linh Rừng rậm', body1: '#047857', body2: '#064e3b', bodyHL: '#a7f3d0', eye: '#ffffff', outline: '#000000', aura: '#10b981', skinType: 'celestial' }
        }
      };
      
      const classSkins = skinsDb[brnch];
      if (classSkins && classSkins[lvl]) {
        return classSkins[lvl];
      }
    }
  }

  return SKINS[lvl] || SKINS[1];
}

function drawFeet(ctx, r, t, moving, skin) {
  ctx.save();
  const stride = moving ? (t / 100) : 0;
  const footR = r * 0.28;
  
  // Left Foot
  ctx.save();
  const leftY = r * 0.85 + (moving ? Math.sin(stride) * r * 0.15 : 0);
  const leftX = -r * 0.45 + (moving ? Math.cos(stride) * r * 0.08 : 0);
  ctx.translate(leftX, leftY);
  ctx.beginPath();
  ctx.ellipse(0, 0, footR * 1.2, footR * 0.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = skin.body2;
  ctx.fill();
  ctx.strokeStyle = skin.outline;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
  
  // Right Foot
  ctx.save();
  const rightY = r * 0.85 - (moving ? Math.sin(stride) * r * 0.15 : 0);
  const rightX = r * 0.45 - (moving ? Math.cos(stride) * r * 0.08 : 0);
  ctx.translate(rightX, rightY);
  ctx.beginPath();
  ctx.ellipse(0, 0, footR * 1.2, footR * 0.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = skin.body2;
  ctx.fill();
  ctx.strokeStyle = skin.outline;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
  
  ctx.restore();
}

function drawHands(ctx, r, t, moving, attacking, attackProgress, skin, wpnType) {
  ctx.save();
  const swing = moving ? Math.sin(t / 120) * r * 0.12 : 0;
  const bob = Math.sin(t / 190) * r * 0.03;
  const handR = r * 0.22;
  
  // Left Hand (Shield / Free Hand)
  ctx.save();
  let leftX = -r * 0.85 + swing;
  let leftY = r * 0.15 + bob;
  
  if (attacking && (wpnType === 'fighter' || wpnType === 'shield')) {
    // Push shield forward
    leftX -= attackProgress * r * 0.25;
    leftY -= attackProgress * r * 0.1;
  }
  ctx.translate(leftX, leftY);
  ctx.beginPath();
  ctx.arc(0, 0, handR, 0, Math.PI * 2);
  ctx.fillStyle = skin.body1;
  ctx.fill();
  ctx.strokeStyle = skin.outline;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
  
  // Right Hand (Weapon Hand)
  ctx.save();
  let rightX = r * 0.85 - swing;
  let rightY = r * 0.15 + bob;
  
  let wpnCat = 'sword';
  if (typeof wpnType === 'string') {
    if (wpnType.includes('bow') || wpnType === 'ranger') wpnCat = 'bow';
    else if (wpnType.includes('staff') || wpnType === 'mage' || wpnType === 'necromancer' || wpnType === 'druid') wpnCat = 'staff';
    else if (wpnType.includes('hammer') || wpnType === 'paladin') wpnCat = 'hammer';
    else if (wpnType.includes('axe')) wpnCat = 'axe';
    else if (wpnType === 'assassin') wpnCat = 'shuriken';
  }
  
  if (attacking) {
    if (wpnCat === 'sword' || wpnCat === 'hammer' || wpnCat === 'axe') {
      const swingAngle = -Math.PI / 4 + attackProgress * Math.PI * 1.1;
      rightX = Math.cos(swingAngle) * r * 1.0;
      rightY = Math.sin(swingAngle) * r * 0.8;
    } else if (wpnCat === 'bow') {
      const pull = Math.sin(attackProgress * Math.PI) * r * 0.15;
      rightX = r * 0.85 - pull;
      rightY = r * 0.15 + pull * 0.5;
    } else if (wpnCat === 'staff') {
      rightX = r * 0.85 + Math.sin(attackProgress * Math.PI) * r * 0.3;
      rightY = r * 0.15 - Math.sin(attackProgress * Math.PI) * r * 0.15;
    } else {
      rightX = r * 0.85 + Math.sin(attackProgress * Math.PI) * r * 0.3;
    }
  }
  ctx.translate(rightX, rightY);
  ctx.beginPath();
  ctx.arc(0, 0, handR, 0, Math.PI * 2);
  ctx.fillStyle = skin.body1;
  ctx.fill();
  ctx.strokeStyle = skin.outline;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
  
  ctx.restore();
}

function drawWeaponById(ctx, r, t, attacking, attackProgress, wpnId, branch) {
  let type = 'sword';
  if (wpnId) {
    if (wpnId.includes('bow')) type = 'bow';
    else if (wpnId.includes('staff')) type = 'staff';
    else if (wpnId.includes('hammer')) type = 'hammer';
    else if (wpnId.includes('axe')) type = 'axe';
    else type = 'sword';
  } else {
    if (branch === 'ranger') type = 'bow';
    else if (branch === 'mage') type = 'staff';
    else if (branch === 'paladin') type = 'hammer';
    else if (branch === 'necromancer') type = 'staff';
    else if (branch === 'druid') type = 'staff';
    else if (branch === 'assassin') type = 'shuriken';
    else type = 'sword';
  }

  if (type === 'shuriken') {
    drawShuriken(ctx, r, t, attacking, attackProgress);
    return;
  }

  ctx.save();
  if (type === 'bow') {
    if (attacking) {
      const pull = Math.sin(attackProgress * Math.PI) * r * 0.2;
      ctx.translate(r * 1.05 + pull, -r * 0.1);
      ctx.rotate(Math.PI / 4 - pull);
    } else {
      ctx.translate(r * 1.05, -r * 0.1);
      ctx.rotate(Math.PI / 4);
    }
    
    const id = wpnId || 'wood_bow';
    if (id === 'artemis_bow') {
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 4;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.85, -Math.PI * 0.65, Math.PI * 0.65, false);
      ctx.stroke();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.95, -Math.PI * 0.4, Math.PI * 0.4, false);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#fff';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.55);
      ctx.lineTo(0, r * 0.55);
      ctx.stroke();
    } else if (id === 'frost_bow') {
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#60a5fa';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, -Math.PI * 0.6, Math.PI * 0.6, false);
      ctx.stroke();
      ctx.fillStyle = '#dbeafe';
      [[-r*0.4, -r*0.3], [r*0.4, r*0.3]].forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 5, sy - 8);
        ctx.lineTo(sx + 10, sy);
        ctx.closePath();
        ctx.fill();
      });
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.5);
      ctx.lineTo(0, r * 0.5);
      ctx.stroke();
    } else if (id === 'hunter_bow') {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.78, -Math.PI * 0.6, Math.PI * 0.6, false);
      ctx.stroke();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.83, -Math.PI * 0.2, Math.PI * 0.2, false);
      ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.5);
      ctx.lineTo(0, r * 0.5);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.75, -Math.PI * 0.6, Math.PI * 0.6, false);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.5);
      ctx.lineTo(0, r * 0.5);
      ctx.stroke();
    }
  } else if (type === 'staff') {
    if (attacking) {
      const staffX = r * 1.05 + attackProgress * r * 0.4;
      const staffY = -r * 0.15 - attackProgress * r * 0.25;
      ctx.translate(staffX, staffY);
      ctx.rotate(attackProgress * Math.PI * 0.3);
    } else {
      ctx.translate(r * 1.05, -r * 0.15);
    }
    
    const id = wpnId || (branch === 'necromancer' ? 'dark_staff' : branch === 'druid' ? 'druid_staff' : 'flame_staff');
    if (id === 'staff_ancient') {
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2.0;
      ctx.fillRect(-4, 0, 8, r * 1.45);
      ctx.strokeRect(-4, 0, 8, r * 1.45);
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.moveTo(-12, -r * 0.1);
      ctx.lineTo(-18, -r * 0.4);
      ctx.lineTo(0, -r * 0.6);
      ctx.lineTo(18, -r * 0.4);
      ctx.lineTo(12, -r * 0.1);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      const glow = Math.sin(t / 150) * 0.15 + 1.0;
      ctx.save();
      ctx.translate(0, -r * 0.5);
      ctx.scale(glow, glow);
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 12);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (id === 'dark_staff' || branch === 'necromancer') {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, r * 1.35);
      ctx.lineTo(0, -r * 0.2);
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -r * 0.35, 10, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a855f7';
      ctx.shadowBlur = 6; ctx.shadowColor = '#a855f7';
      ctx.beginPath(); ctx.arc(-3, -r * 0.35, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(3, -r * 0.35, 2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    } else if (id === 'druid_staff' || branch === 'druid') {
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, r * 1.35);
      ctx.lineTo(0, -r * 0.2);
      ctx.stroke();
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.35, 12, 8, -0.4 + Math.sin(t/150)*0.1, 0, Math.PI*2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#b45309';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-3, 0, 6, r * 1.25);
      ctx.strokeRect(-3, 0, 6, r * 1.25);
      ctx.fillStyle = '#fb923c';
      ctx.shadowBlur = 10; ctx.shadowColor = '#f97316';
      ctx.beginPath();
      ctx.arc(0, -8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  } else if (type === 'hammer') {
    if (attacking) {
      const swingAngle = Math.PI / 4 - Math.PI / 2 + attackProgress * Math.PI * 1.35;
      const swingX = r * 1.05 + Math.sin(attackProgress * Math.PI) * r * 0.3;
      const swingY = -r * 0.15 - Math.sin(attackProgress * Math.PI) * r * 0.2;
      ctx.translate(swingX, swingY);
      ctx.rotate(swingAngle);
    } else {
      ctx.translate(r * 1.05, -r * 0.15);
      ctx.rotate(Math.PI / 4);
    }
    
    const id = wpnId || 'iron_hammer';
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.fillRect(-10, -r * 1.1, 20, 14);
    ctx.strokeRect(-10, -r * 1.1, 20, 14);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-2.5, -r * 0.7, 5, r * 1.1);
    
    if (id !== 'iron_hammer') {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-10, -r * 1.1 + 4, 20, 3);
    }
  } else if (type === 'axe') {
    if (attacking) {
      const swingAngle = Math.PI / 4 - Math.PI / 2 + attackProgress * Math.PI * 1.35;
      const swingX = r * 1.05 + Math.sin(attackProgress * Math.PI) * r * 0.3;
      const swingY = -r * 0.15 - Math.sin(attackProgress * Math.PI) * r * 0.2;
      ctx.translate(swingX, swingY);
      ctx.rotate(swingAngle);
    } else {
      ctx.translate(r * 1.05, -r * 0.15);
      ctx.rotate(Math.PI / 4);
    }
    
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-2.5, -r * 0.5, 5, r * 1.25);
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 10; ctx.shadowColor = '#0ea5e9';
    ctx.beginPath();
    ctx.moveTo(-2, -r * 0.6);
    ctx.bezierCurveTo(-14, -r * 0.8, -16, -r * 0.1, -2, -r * 0.2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2, -r * 0.6);
    ctx.bezierCurveTo(14, -r * 0.8, 16, -r * 0.1, 2, -r * 0.2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    if (attacking) {
      const swingAngle = Math.PI / 4 - Math.PI / 2 + attackProgress * Math.PI * 1.35;
      const swingX = r * 1.05 + Math.sin(attackProgress * Math.PI) * r * 0.3;
      const swingY = -r * 0.15 - Math.sin(attackProgress * Math.PI) * r * 0.2;
      ctx.translate(swingX, swingY);
      ctx.rotate(swingAngle);
    } else {
      ctx.translate(r * 1.05, -r * 0.15);
      ctx.rotate(Math.PI / 4 + Math.sin(t / 350) * 0.08);
    }
    
    const id = wpnId || 'iron_sword';
    if (id === 'excalibur') {
      ctx.fillStyle = '#fffbeb';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(-4, -r * 1.3);
      ctx.lineTo(0, -r * 1.55);
      ctx.lineTo(4, -r * 1.3);
      ctx.lineTo(4, 0);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(0, -r * 1.25);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-13, -3, 26, 6);
      ctx.strokeRect(-13, -3, 26, 6);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-2.5, 3, 5, r * 0.4);
    } else if (id === 'silver_sword') {
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-3.5, 0);
      ctx.lineTo(-3.5, -r * 1.2);
      ctx.lineTo(0, -r * 1.4);
      ctx.lineTo(3.5, -r * 1.2);
      ctx.lineTo(3.5, 0);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-10, -3, 20, 5);
      ctx.strokeRect(-10, -3, 20, 5);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-2, 2, 4, r * 0.35);
    } else {
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(-3, -r * 1.1);
      ctx.lineTo(0, -r * 1.3);
      ctx.lineTo(3, -r * 1.1);
      ctx.lineTo(3, 0);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-8, -3, 16, 4);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-2, 1, 4, r * 0.3);
    }
  }
  ctx.restore();
}

function drawArmorOverlay(ctx, r, t, armorId) {
  if (!armorId) return;
  ctx.save();
  
  if (armorId === 'leather_vest') {
    ctx.fillStyle = '#92400e';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 0.85, 0, Math.PI);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#3b1d11';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.2);
    ctx.lineTo(-r * 0.2, r * 0.6);
    ctx.moveTo(r * 0.5, -r * 0.2);
    ctx.lineTo(r * 0.2, r * 0.6);
    ctx.stroke();
  } else if (armorId === 'chain_mail') {
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 0.85, 0, Math.PI);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.arc(0, r * 0.15, r * 0.7, 0, Math.PI);
    ctx.arc(0, r * 0.15, r * 0.5, 0, Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    [[-1], [1]].forEach(([s]) => {
      ctx.beginPath();
      ctx.arc(s * r * 0.8, -r * 0.2, r * 0.22, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    });
  } else if (armorId === 'steel_plate') {
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 0.88, 0, Math.PI);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(0, r * 0.1);
    ctx.lineTo(0, r * 0.95);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    [[-r*0.5, r*0.4], [r*0.5, r*0.4], [0, r*0.75]].forEach(([rx, ry]) => {
      ctx.beginPath(); ctx.arc(rx, ry, 2, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    [[-1], [1]].forEach(([s]) => {
      ctx.save();
      ctx.translate(s * r * 0.82, -r * 0.22);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    });
  } else if (armorId === 'shadow_cloak') {
    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, r * 0.15, r * 0.9, 0, Math.PI);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#4c1d95';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, r * 0.15);
    ctx.quadraticCurveTo(0, r * 0.7, -r * 0.3, r * 0.95);
    ctx.moveTo(r * 0.4, r * 0.15);
    ctx.quadraticCurveTo(0, r * 0.7, r * 0.3, r * 0.95);
    ctx.stroke();
  } else if (armorId === 'dragon_scale') {
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 0.9, 0, Math.PI);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b91c1c';
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 0.8;
    [[-r*0.4, r*0.3], [0, r*0.3], [r*0.4, r*0.3], [-r*0.2, r*0.55], [r*0.2, r*0.55], [0, r*0.75]].forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.arc(sx, sy, 4.5, 0, Math.PI);
      ctx.fill(); ctx.stroke();
    });
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    [[-1], [1]].forEach(([s]) => {
      ctx.save();
      ctx.translate(s * r * 0.82, -r * 0.22);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(s * -4, -6);
      ctx.lineTo(s * 8, -16);
      ctx.lineTo(s * 4, 6);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
    });
  }
  
  ctx.restore();
}

function drawEyes(ctx, r, cp, sp, skin, t) {
  ctx.save();
  ctx.rotate(sp.a);

  const eyeSpread = r * 0.34;
  const eyeFwd    = r * 0.4;
  const eyeR      = r * 0.18;
  const pupR      = r * 0.09;

  [[-eyeSpread],[eyeSpread]].forEach(([ey]) => {
    ctx.beginPath(); ctx.arc(eyeFwd, ey, eyeR, 0, Math.PI*2);
    ctx.fillStyle='#fff'; ctx.fill();
    ctx.strokeStyle=skin.outline; ctx.lineWidth=2; ctx.stroke();
    ctx.beginPath(); ctx.arc(eyeFwd + 2, ey, pupR, 0, Math.PI*2);
    ctx.fillStyle=skin.eye; ctx.fill();
    ctx.beginPath(); ctx.arc(eyeFwd + pupR*0.4, ey - pupR*0.5, pupR*0.42, 0, Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.fill();
    if (sp.lvl >= 4) {
      ctx.strokeStyle=skin.outline; ctx.lineWidth=2.5; ctx.lineCap='round';
      const bx1 = eyeFwd - eyeR*0.9, bx2 = eyeFwd + eyeR*0.9;
      const by1 = ey - eyeR - 2, by2 = ey - eyeR + (ey<0?4:-4);
      ctx.beginPath(); ctx.moveTo(bx1, by1); ctx.lineTo(bx2, by2); ctx.stroke();
    }
  });
  ctx.restore();
}

function drawAuraRing(ctx,r,color,lvl,t) {
  const pulse=r+14+Math.sin(t/110)*5;
  ctx.save();
  if (lvl>=5) { ctx.rotate((t/700)%(Math.PI*2)); ctx.setLineDash([9,7]); }
  ctx.beginPath();
  ctx.ellipse(0, 0, pulse, pulse * 0.6, 0, 0, Math.PI * 2);
  const alpha = 0.5+Math.sin(t/95)*0.18;
  
  // Outer soft glow stroke
  ctx.strokeStyle = color;
  ctx.lineWidth = (3+Math.sin(t/80)) * 2.5;
  ctx.globalAlpha = alpha * 0.3;
  ctx.stroke();
  
  // Inner core stroke
  ctx.lineWidth = 3+Math.sin(t/80);
  ctx.globalAlpha = alpha;
  ctx.stroke();
  
  ctx.setLineDash([]);
  ctx.restore();
}

function drawEliteNeonRing(ctx, r, t) {
  ctx.save();
  
  // Outer soft glow stroke
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
  ctx.lineWidth = (3 + Math.sin(t/100) * 1.5) * 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.25, r * 1.25 * 0.6, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Inner core stroke
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 3 + Math.sin(t/100) * 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.25, r * 1.25 * 0.6, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  // Outer rotating spikes
  ctx.rotate(-t / 300);
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    ctx.moveTo(cos * r * 1.25, sin * r * 1.25 * 0.6);
    ctx.lineTo(cos * r * 1.45, sin * r * 1.45 * 0.6);
  }
  ctx.stroke();
  ctx.restore();
}

function drawBossFireRing(ctx,r,t,lvl) {
  const count = 6 + Math.min(8, lvl - 5);
  const ringR = r + 18 + (lvl-6)*4;
  const rot=(t/480)%(Math.PI*2);
  for(let i=0;i<count;i++){
    const a=rot+(Math.PI*2/count)*i;
    const fx=Math.cos(a)*ringR,fy=Math.sin(a)*ringR*0.6;
    const fs=8+Math.sin(t/100+i)*3;
    const g=ctx.createRadialGradient(fx,fy,1,fx,fy,fs*1.6);
    g.addColorStop(0,'#fff');g.addColorStop(0.4,'#fbbf24');g.addColorStop(1,'rgba(249,115,22,0)');
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(fx, fy, fs * 1.6, fs * 1.6 * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle=g;ctx.fill();
    ctx.restore();
  }
}

function drawOmegaRing(ctx,r,t) {
  const rot=(t/300)%(Math.PI*2);
  for(let ring=0;ring<3;ring++){
    ctx.save(); ctx.rotate(rot+ring*(Math.PI*2/3));
    ctx.beginPath();
    const rad = r+22+ring*14;
    ctx.ellipse(0, 0, rad, rad * 0.6, 0, 0, Math.PI * 2);
    const colStr = `rgba(251,191,36,${0.6-ring*0.15})`;
    
    // Soft outer glow stroke
    ctx.strokeStyle = colStr;
    ctx.lineWidth = (3-ring*0.5) * 2.2;
    ctx.globalAlpha = 0.25;
    ctx.setLineDash([12,8]);
    ctx.stroke();
    
    // Core stroke
    ctx.lineWidth = 3-ring*0.5;
    ctx.globalAlpha = 1.0;
    ctx.stroke();
    
    ctx.setLineDash([]); ctx.restore();
  }
}

function drawShadowGhost(ctx,r,t,cp) {
  ctx.save(); ctx.globalAlpha=0.2+Math.sin(t/80)*0.1;
  ctx.translate(-cp.vx*18||0, -cp.vy*18||0);
  ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2);
  ctx.fillStyle='#6d28d9'; ctx.fill(); ctx.restore();
}

function drawDemonWings(ctx,r,t) {
  const flap=Math.sin(t/95)*0.25;
  ctx.fillStyle='#1e1b4b'; ctx.strokeStyle='#0f0e26'; ctx.lineWidth=2.5;
  [-1,1].forEach(s=>{
    ctx.save(); ctx.translate(s*r*.65,-r*.15); ctx.rotate(s*(-Math.PI/5+flap));
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(s*-r*.95,-r*.5); ctx.lineTo(s*-r*.8,r*.1); ctx.lineTo(s*-r*.4,r*.28); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.restore();
  });
}

function drawDragonWings(ctx,r,t) {
  const flap=Math.sin(t/80)*0.3;
  ctx.fillStyle='#7f1d1d'; ctx.strokeStyle='#450a0a'; ctx.lineWidth=2.5;
  [-1,1].forEach(s=>{
    ctx.save(); ctx.translate(s*r*.72,-r*.1); ctx.rotate(s*(-Math.PI/4+flap));
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(s*-r*1.2,-r*.65); ctx.lineTo(s*-r*.8,r*.1);
    ctx.quadraticCurveTo(s*-r*.5,r*.3,0,r*.1);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle='rgba(239,68,68,0.4)'; ctx.lineWidth=1;
    for(let wi=1;wi<=3;wi++){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(s*-r*.4*wi,-r*.2*wi);ctx.stroke();}
    ctx.restore();
  });
}

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

function drawHalo(ctx,r,t) {
  ctx.save(); ctx.translate(0,-r-8); ctx.rotate((t/600)%(Math.PI*2));
  const g=ctx.createRadialGradient(0,0,5,0,0,r*.75);
  g.addColorStop(0,'rgba(255,255,255,0.8)'); g.addColorStop(1,'rgba(129,140,248,0)');
  ctx.beginPath(); ctx.ellipse(0,0,r*.75,r*.18,0,0,Math.PI*2);
  ctx.fillStyle=g; ctx.fill();
  ctx.strokeStyle='rgba(199,210,254,0.9)'; ctx.lineWidth=3;
  ctx.shadowColor='#818cf8'; ctx.shadowBlur=12; ctx.stroke();
  for(let i=0;i<6;i++){const a=(Math.PI*2/6)*i;starPath(ctx,Math.cos(a)*r*.55,Math.sin(a)*r*.18*0.7,5,2.5,5);ctx.fillStyle='#e0e7ff';ctx.fill();}
  ctx.restore();
}

function drawOmegaSymbol(ctx,r,t) {
  ctx.save(); ctx.translate(0,-r-20);
  const sparkle=0.7+Math.sin(t/100)*0.3;
  ctx.font=`bold ${r*.85}px Outfit`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle=`rgba(251,191,36,${sparkle})`; ctx.shadowColor='#fbbf24'; ctx.shadowBlur=20;
  ctx.fillText('Ω',0,0); ctx.restore();
}

function drawDragonHorns(ctx,r,t) {
  ctx.fillStyle='#dc2626'; ctx.strokeStyle='#450a0a'; ctx.lineWidth=2.5;
  [-1,1].forEach(s=>{
    ctx.save(); ctx.translate(s*r*.5,-r*.55);
    ctx.beginPath(); ctx.moveTo(-8,12); ctx.lineTo(s*-3,-20); ctx.lineTo(s*5,-30); ctx.lineTo(s*8,-18); ctx.lineTo(8,12); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.restore();
  });
}

function drawShadowMask(ctx,r,t) {
  ctx.save();
  ctx.globalAlpha=0.4+Math.sin(t/120)*0.2;
  ctx.fillStyle='#1e1b4b'; ctx.beginPath();
  ctx.arc(r*.3,-r*.15,r*.35,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1; ctx.shadowColor='#c084fc'; ctx.shadowBlur=18;
  ctx.fillStyle='#c084fc';
  [{y:-r*.25},{y:r*.05}].forEach(({y})=>{
    ctx.beginPath(); ctx.ellipse(r*.35,y,r*.13,r*.07,0,0,Math.PI*2); ctx.fill();
  });
  ctx.restore();
}

function drawLeaf(ctx,r,t) {
  ctx.save(); ctx.translate(0,-r*.88); ctx.rotate(Math.sin(t/260)*0.2);
  ctx.fillStyle='#22c55e'; ctx.strokeStyle='#052e16'; ctx.lineWidth=2;
  ctx.save();ctx.rotate(-0.4);ctx.beginPath();ctx.ellipse(-5,-9,8,4,-0.3,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
  ctx.save();ctx.rotate(0.4);ctx.beginPath();ctx.ellipse(5,-9,8,4,0.3,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
  ctx.strokeStyle='#4ade80';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-7);ctx.stroke();
  ctx.restore();
}

function drawHorns(ctx,r) {
  ctx.fillStyle='#e2e8f0';ctx.strokeStyle='#1e293b';ctx.lineWidth=2.5;
  [[-1],[1]].forEach(([s])=>{
    ctx.save();ctx.translate(s*r*.52,-r*.62);
    ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(s*13,-17,s*8,-28);ctx.quadraticCurveTo(s*4,-17,0,0);ctx.closePath();
    ctx.fill();ctx.stroke();ctx.restore();
  });
}

function drawNekoEars(ctx,r,skin) {
  ctx.fillStyle=skin.body1;ctx.strokeStyle=skin.outline;ctx.lineWidth=3;
  [[-1],[1]].forEach(([s])=>{
    ctx.save();ctx.translate(s*r*.74,-r*.56);
    ctx.beginPath();ctx.moveTo(-12,10);ctx.lineTo(s*-3,-17);ctx.lineTo(12,10);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#fbcfe8';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-6,6);ctx.lineTo(0,-8);ctx.lineTo(6,6);ctx.closePath();ctx.fill();
    ctx.restore();
  });
}

function drawPandaEars(ctx,r,skin) {
  ctx.fillStyle='#1c0303';ctx.strokeStyle=skin.outline;ctx.lineWidth=3;
  [-r*.63,r*.63].forEach(ex=>{
    ctx.beginPath();ctx.arc(ex,-r*.72,11,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#7f1d1d';ctx.beginPath();ctx.arc(ex,-r*.72,5,0,Math.PI*2);ctx.fill();
  });
}

function drawDemonHorns(ctx,r) {
  ctx.fillStyle='#ef4444';ctx.strokeStyle='#000';ctx.lineWidth=2.5;
  [-1,1].forEach(s=>{ctx.save();ctx.translate(s*r*.42,-r*.67);ctx.beginPath();ctx.moveTo(-6,10);ctx.lineTo(s*-4,-15);ctx.lineTo(6,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();});
}

function drawCrown(ctx,r,t) {
  ctx.save();ctx.translate(0,-r*.9);
  const sparkle=0.85+Math.sin(t/110)*0.15;
  ctx.fillStyle=`rgba(251,191,36,${sparkle})`;ctx.strokeStyle='#451a03';ctx.lineWidth=3.5;
  ctx.beginPath();ctx.moveTo(-25,4);ctx.lineTo(-25,-7);ctx.lineTo(-17,-24);ctx.lineTo(-6,-11);ctx.lineTo(0,-32);ctx.lineTo(6,-11);ctx.lineTo(17,-24);ctx.lineTo(25,-7);ctx.lineTo(25,4);ctx.closePath();ctx.fill();ctx.stroke();
  [[-14,-16],[0,-26],[14,-16]].forEach(([gx,gy])=>{ctx.fillStyle='#ef4444';ctx.beginPath();ctx.arc(gx,gy,3.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#7f1d1d';ctx.lineWidth=1.5;ctx.stroke();});
  [[-17,-24],[0,-32],[17,-24]].forEach(([sx,sy])=>{ctx.fillStyle='#fbbf24';ctx.beginPath();ctx.arc(sx,sy,4.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#92400e';ctx.lineWidth=1.5;ctx.stroke();});
  ctx.restore();
}

function drawCloak(ctx, r) {
  ctx.save();
  ctx.fillStyle = '#7c2d12';
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

function drawShuriken(ctx, r, t, attacking = false, attackProgress = 0) {
  ctx.save();
  if (attacking) {
    const throwX = r * 1.15 + Math.sin(attackProgress * Math.PI) * r * 0.9;
    const throwY = r * 0.25 - Math.sin(attackProgress * Math.PI) * r * 0.15;
    ctx.translate(throwX, throwY);
    ctx.rotate((t / 35) % (Math.PI * 2));
    const scale = 1 + Math.sin(attackProgress * Math.PI) * 0.35;
    ctx.scale(scale, scale);
  } else {
    ctx.translate(r * 1.15, r * 0.25);
    ctx.rotate((t / 120) % (Math.PI * 2));
  }
  ctx.fillStyle = '#94a3b8';
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
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.restore();
}

function drawFighterSword(ctx, r, attacking = false, attackProgress = 0) {
  ctx.save();
  if (attacking) {
    const swingAngle = Math.PI / 4 - Math.PI / 2 + attackProgress * Math.PI * 1.35;
    const swingX = r * 1.05 + Math.sin(attackProgress * Math.PI) * r * 0.3;
    const swingY = -r * 0.15 - Math.sin(attackProgress * Math.PI) * r * 0.2;
    ctx.translate(swingX, swingY);
    ctx.rotate(swingAngle);
  } else {
    ctx.translate(r * 1.05, -r * 0.15);
    ctx.rotate(Math.PI / 4 + Math.sin(Date.now() / 350) * 0.08);
  }
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
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-11, -3, 22, 5);
  ctx.strokeRect(-11, -3, 22, 5);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-2.5, 2, 5, r * 0.35);
  ctx.beginPath();
  ctx.arc(0, 2 + r * 0.35, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawFighterShield(ctx, r, attacking = false, attackProgress = 0) {
  ctx.save();
  if (attacking) {
    const shieldX = -r * 1.1 - attackProgress * r * 0.15;
    const shieldY = r * 0.15 - attackProgress * r * 0.08;
    ctx.translate(shieldX, shieldY);
    ctx.rotate(-Math.PI / 8 - attackProgress * Math.PI * 0.2);
  } else {
    ctx.translate(-r * 1.1, r * 0.15);
    ctx.rotate(-Math.PI / 8);
  }
  ctx.fillStyle = '#64748b';
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
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMageHat(ctx, r) {
  ctx.save();
  ctx.translate(0, -r * 0.82);
  ctx.fillStyle = '#4c1d95';
  ctx.strokeStyle = '#1e1b4b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.15, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.65, -2);
  ctx.bezierCurveTo(-r * 0.5, -r * 1.35, -r * 0.1, -r * 1.6, r * 0.2, -r * 1.7);
  ctx.bezierCurveTo(r * 0.1, -r * 1.2, r * 0.3, -r * 0.7, r * 0.55, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#eab308';
  ctx.fillRect(-r * 0.42, -5, r * 0.84, 5);
  ctx.restore();
}

function drawMageStaff(ctx, r, t, attacking = false, attackProgress = 0) {
  ctx.save();
  if (attacking) {
    const staffX = r * 1.05 + attackProgress * r * 0.4;
    const staffY = -r * 0.15 - attackProgress * r * 0.25;
    ctx.translate(staffX, staffY);
    ctx.rotate(attackProgress * Math.PI * 0.3);
  } else {
    ctx.translate(r * 1.05, -r * 0.15);
  }
  ctx.fillStyle = '#78350f';
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-3, 0, 6, r * 1.35);
  ctx.strokeRect(-3, 0, 6, r * 1.35);
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, -r * 0.1, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const crystalGlow = Math.sin(t / 180) * 0.15 + 0.95;
  ctx.save();
  ctx.translate(0, -r * 0.28);
  ctx.scale(crystalGlow, crystalGlow);
  ctx.fillStyle = '#22d3ee';
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

function drawRangerBow(ctx, r, attacking = false, attackProgress = 0) {
  ctx.save();
  if (attacking) {
    const pull = Math.sin(attackProgress * Math.PI) * r * 0.2;
    ctx.translate(r * 1.05 + pull, -r * 0.1);
    ctx.rotate(Math.PI / 4 - pull);
  } else {
    ctx.translate(r * 1.05, -r * 0.1);
    ctx.rotate(Math.PI / 4);
  }
  ctx.strokeStyle = '#86efac'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.75, -Math.PI * 0.6, Math.PI * 0.6, false); ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, -r * 0.5); ctx.lineTo(0, r * 0.5); ctx.stroke();
  ctx.restore();
}

function drawPaladinHammer(ctx, r, attacking = false, attackProgress = 0) {
  ctx.save();
  if (attacking) {
    const swingAngle = Math.PI / 4 - Math.PI / 2 + attackProgress * Math.PI * 1.35;
    const swingX = r * 1.05 + Math.sin(attackProgress * Math.PI) * r * 0.3;
    const swingY = -r * 0.15 - Math.sin(attackProgress * Math.PI) * r * 0.2;
    ctx.translate(swingX, swingY);
    ctx.rotate(swingAngle);
  } else {
    ctx.translate(r * 1.05, -r * 0.15);
    ctx.rotate(Math.PI / 4);
  }
  ctx.fillStyle = '#fde68a'; ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2;
  ctx.fillRect(-8, -r * 1.1, 16, 12);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-2.5, -r * 0.8, 5, r * 1.1);
  ctx.strokeRect(-8, -r * 1.1, 16, 12);
  ctx.restore();
}

function drawSkullStaff(ctx, r, attacking = false, attackProgress = 0) {
  ctx.save();
  if (attacking) {
    const staffX = r * 1.05 + attackProgress * r * 0.4;
    const staffY = -r * 0.15 - attackProgress * r * 0.25;
    ctx.translate(staffX, staffY);
    ctx.rotate(attackProgress * Math.PI * 0.3);
  } else {
    ctx.translate(r * 1.05, -r * 0.15);
  }
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, r * 0.5); ctx.lineTo(0, -(r + 8)); ctx.stroke();
  ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(0, -(r + 18), 10, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(-3, -(r + 18), 1.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(3, -(r + 18), 1.5, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawDruidStaff(ctx, r, t, attacking = false, attackProgress = 0) {
  ctx.save();
  if (attacking) {
    const staffX = r * 1.05 + attackProgress * r * 0.4;
    const staffY = -r * 0.15 - attackProgress * r * 0.25;
    ctx.translate(staffX, staffY);
    ctx.rotate(attackProgress * Math.PI * 0.3);
  } else {
    ctx.translate(r * 1.05, -r * 0.15);
  }
  ctx.strokeStyle = '#86efac'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, r * 0.5); ctx.lineTo(0, -(r + 8)); ctx.stroke();
  ctx.fillStyle = '#4ade80';
  ctx.beginPath(); ctx.ellipse(0, -(r + 18), 10, 7, -0.5 + Math.sin(t/150)*0.1, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawCheeks(ctx,r) {
  ctx.save();ctx.globalAlpha=0.45;ctx.fillStyle='#f9a8d4';
  ctx.beginPath();ctx.ellipse(-r*.52,r*.26,r*.23,r*.15,-0.2,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(r*.52,r*.26,r*.23,r*.15,0.2,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawStunStars(ctx,r,t) {
  ctx.save();ctx.translate(0,-r-20);ctx.rotate((t/270)%(Math.PI*2));
  for(let i=0;i<3;i++){const a=(Math.PI*2/3)*i;ctx.font='15px serif';ctx.fillText('⭐',Math.cos(a)*20-7,Math.sin(a)*10+4);}
  ctx.restore();
}

function drawShieldHex(ctx,r,t) {
  ctx.save();
  const pulse = 0.6 + Math.sin(t/150)*0.2;
  const sr = r + 15 + Math.sin(t/100)*2;
  const g = ctx.createRadialGradient(sr*0.3, -sr*0.3, 0, 0, 0, sr);
  g.addColorStop(0, 'rgba(255,255,255,0.4)');
  g.addColorStop(0.5, 'rgba(56,189,248,0.15)');
  g.addColorStop(0.8, 'rgba(14,165,233,0.3)');
  g.addColorStop(1, 'rgba(2,132,199,0.6)');
  ctx.beginPath(); ctx.arc(0, 0, sr, 0, Math.PI*2);
  ctx.fillStyle = g; ctx.fill();
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

function drawSlowRings(ctx,r,t) {
  ctx.save();const phase=(t/380)%1;
  [0,0.5].forEach(off=>{const p=(phase+off)%1;ctx.beginPath();ctx.arc(0,r*.65,r*(0.5+p*.5),0,Math.PI*2);ctx.strokeStyle=`rgba(96,165,250,${(1-p)*.65})`;ctx.lineWidth=2.5;ctx.stroke();});
  ctx.restore();
}

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

function drawNameplate(ctx, cp, sp, r, isMe) {
  const x = cp.x, y = cp.y;
  const barW = Math.max(50, 40 + r * 0.65);
  const barH = 8;
  const barX = x - barW/2;
  const barY = y - r - 12;
  const labelY = y - r - 22;
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
  ctx.font = `bold ${isMe?14:11}px 'Outfit',sans-serif`;
  ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  let label = sp.n;
  if (sp.lvl >= 9)      label = `✨ ${sp.n}`;
  else if (sp.lvl >= 6) label = `👑 ${sp.n}`;
  ctx.fillStyle = isMe ? '#67e8f9' : sp.rage ? '#fca5a5' : '#f3f4f6';
  ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=6;
  ctx.fillText(label, x, labelY);

  // HP bar background
  ctx.fillStyle='rgba(0,0,0,0.6)'; roundRect(ctx,barX,barY,barW,barH,4); ctx.fill();

  // HP fill
  const hpPct = Math.max(0, Math.min(1, (sp.hp||0) / (sp.mhp||1)));
  if (hpPct > 0) {
    ctx.save(); ctx.beginPath(); roundRect(ctx,barX,barY,barW*hpPct,barH,4); ctx.clip();
    const g=ctx.createLinearGradient(barX,0,barX+barW,0);
    g.addColorStop(0,'#ef4444'); g.addColorStop(0.5,'#eab308'); g.addColorStop(1,'#22c55e');
    ctx.fillStyle=g; ctx.fillRect(barX,barY,barW,barH); ctx.restore();
  }
  ctx.strokeStyle='rgba(0,0,0,0.6)'; ctx.lineWidth=1.5; roundRect(ctx,barX,barY,barW,barH,4); ctx.stroke();

  // HP text
  ctx.font='bold 8px Outfit'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#fff'; ctx.shadowBlur=0;
  ctx.fillText(`${Math.round(sp.hp||0)}/${sp.mhp||0}`, x, barY+barH/2);

  ctx.restore();
}

// ─── HELPER ──────────────────────────────────────────────────
function lightenColor(col, amt) {
  let r = parseInt(col.slice(1,3),16), g = parseInt(col.slice(3,5),16), b = parseInt(col.slice(5,7),16);
  r = Math.min(255,r+amt); g = Math.min(255,g+amt); b = Math.min(255,b+amt);
  return '#' + [r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
}

// ─── EXPOSE FOR HTML ──────────────────────────────────────────
window.selectClass   = selectClass;
window.openChest     = openChest;
window.closeChestModal = closeChestModal;
window.equipItem     = equipItem;
window.unequipItem   = unequipItem;
window.startPveGame  = startPveGame;
window.pausePve      = pausePve;
window.resumePve     = resumePve;
window.quitToLobby   = quitToLobby;
window.goToLobby     = goToLobby;
window.restartPve    = restartPve;
window.openPowerupModal = openPowerupModal;
window.closePowerupModal = closePowerupModal;


function updatePauseStatsPanel() {
  const container = document.getElementById('pauseStatsContainer');
  if (!container || !G) return;
  
  const p = G.player;
  const activePetName = G.save.activePet ? (PETS_DEFS[G.save.activePet]?.name || G.save.activePet) : 'Không';
  
  const tarotNames = G.activeArcanas.size > 0 
    ? Array.from(G.activeArcanas).map(id => {
        const matchingArc = [
          { id: 'arcana_the_fool', name: 'Fool 🃏' },
          { id: 'arcana_the_magician', name: 'Magician 🧙‍♂️' },
          { id: 'arcana_the_empress', name: 'Empress 👑' },
          { id: 'arcana_the_emperor', name: 'Emperor ⚔️' },
          { id: 'arcana_the_lovers', name: 'Lovers 💞' },
          { id: 'arcana_the_chariot', name: 'Chariot 🏎️' },
          { id: 'arcana_the_hermit', name: 'Hermit 🛖' },
          { id: 'arcana_wheel_of_fortune', name: 'Wheel 🎡' },
          { id: 'arcana_death', name: 'Death 💀' },
          { id: 'arcana_the_tower', name: 'Tower 🗼' },
          { id: 'arcana_the_sun', name: 'Sun ☀️' }
        ].find(a => a.id === id);
        return matchingArc ? matchingArc.name : id;
      }).join(', ')
    : 'Không';

  const stats = [
    { label: '⚔️ Sức Mạnh (ATK)', val: Math.round(p.dmgMult * p.atkMult * 100) + '%' },
    { label: '💨 Tốc Độ (SPD)', val: Math.round(p.speed) },
    { label: '❤️ Máu', val: Math.round(p.hp) + ' / ' + Math.round(p.maxHp) },
    { label: '💚 Hồi Phục', val: '+' + Math.round(p.hpRegen) + '/s' },
    { label: '🛡️ Phòng Thủ (ARM)', val: Math.round(p.defMult * 100) + '%' },
    { label: '⚡ Giảm Hồi Chiêu (CDR)', val: Math.round((1 - p.cdMult) * 100) + '%' },
    { label: '🧲 Tầm Hút (Magnet)', val: Math.round(G.magnetRadius) + 'px' },
    { label: '🍀 Chí Mạng (Crit)', val: Math.round(p.critChance * 100) + '%' },
    { label: '🩸 Hút Máu (Lifesteal)', val: Math.round(p.lifesteal * 100) + '%' },
    { label: '🪙 Vàng Thu Thập', val: G.totalGold + ' 🪙' },
    { label: '⭐ Cấp Độ & XP', val: 'Lv.' + p.level + ' (' + p.xp + '/' + p.xpToNext + ')' },
    { label: '🐾 Thần Thú', val: activePetName },
    { label: '🔮 Bài Tarot', val: tarotNames, fullWidth: true }
  ];
  
  container.innerHTML = '';
  stats.forEach(stat => {
    const item = document.createElement('div');
    if (stat.fullWidth) {
      item.style.gridColumn = '1 / -1';
      item.style.borderTop = '1px solid rgba(255,255,255,0.06)';
      item.style.paddingTop = '6px';
      item.style.marginTop = '4px';
    }
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.fontSize = '11px';
    
    item.innerHTML = `
      <span style="color: #94a3b8;">${stat.label}:</span>
      <span style="font-weight: 700; color: #fbbf24;">${stat.val}</span>
    `;
    container.appendChild(item);
  });
}
window.updatePauseStatsPanel = updatePauseStatsPanel;

// ════════════════════════════════════════════════════════════════
// ── HÀM VẼ QUÁI ĐỘC LẬP (STANDALONE ENEMY DRAW FUNCTIONS) ──────
// Mỗi hàm vẽ hoàn toàn khác biệt, có hình dạng và animation riêng
// Không tái sử dụng drawCharacter() — thiết kế riêng cho kẻ thù
// ════════════════════════════════════════════════════════════════

// ── HELPER: Vẽ mắt đơn giản ────────────────────────────────────
function drawEyePair(ctx, cx, cy, rx, ry, pupilColor, eyeColor) {
  ctx.fillStyle = eyeColor || '#fff';
  ctx.beginPath(); ctx.ellipse(cx - rx, cy, 3.5, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + rx, cy, 3.5, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = pupilColor || '#000';
  ctx.beginPath(); ctx.ellipse(cx - rx, cy, 1.8, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + rx, cy, 1.8, 2, 0, 0, Math.PI*2); ctx.fill();
}

// ── HELPER: Flash overlay khi bị hit ───────────────────────────
function applyHitFlash(ctx, hitFlash) {
  if (hitFlash) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillRect(-200, -200, 400, 400);
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ──────────────────────────────────────────────────────────────
// SLIME — Blob nhầy xanh lá, bounce animation
// ──────────────────────────────────────────────────────────────
function drawEnemySlime(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const bob = Math.sin(t / 180) * 0.12;
  const squashX = 1 + bob * 0.5;
  const squashY = 1 - bob * 0.4;
  const isKing = e.type === 'slime_king_jr';
  const baseCol = rage ? '#22c55e' : (isKing ? '#16a34a' : '#4ade80');

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(squashX, squashY);

  // Body
  const g = ctx.createRadialGradient(-r*0.3, -r*0.35, r*0.05, 0, 0, r);
  g.addColorStop(0, hitFlash ? '#fff' : '#bbf7d0');
  g.addColorStop(0.5, hitFlash ? '#fff' : baseCol);
  g.addColorStop(1, '#14532d');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rage ? '#ef4444' : '#15803d';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Highlight blob
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.ellipse(-r*0.3, -r*0.3, r*0.3, r*0.2, -0.5, 0, Math.PI*2); ctx.fill();

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(-r*0.28, -r*0.1, 4, 5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.28, -r*0.1, 4, 5, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#1a2e05';
  ctx.beginPath(); ctx.ellipse(-r*0.28, -r*0.08, 2.2, 2.8, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.28, -r*0.08, 2.2, 2.8, 0, 0, Math.PI*2); ctx.fill();

  // Smile
  ctx.strokeStyle = '#166534'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, r*0.15, r*0.22, 0.1, Math.PI-0.1); ctx.stroke();

  // Crown for Slime King Jr
  if (isKing) {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-r*0.5, -r*0.8);
    ctx.lineTo(-r*0.5, -r*1.05);
    ctx.lineTo(-r*0.22, -r*0.88);
    ctx.lineTo(0, -r*1.12);
    ctx.lineTo(r*0.22, -r*0.88);
    ctx.lineTo(r*0.5, -r*1.05);
    ctx.lineTo(r*0.5, -r*0.8);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#d97706'; ctx.lineWidth = 1.5; ctx.stroke();
  }

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// BAT — Dơi nhỏ tím, cánh vỗ liên tục
// ──────────────────────────────────────────────────────────────
function drawEnemyBat(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const wingFlap = Math.sin(t / 80) * 0.6;

  ctx.save();
  ctx.translate(x, y);

  // Left wing
  ctx.fillStyle = hitFlash ? '#fff' : (rage ? '#7c3aed' : '#4c1d95');
  ctx.beginPath();
  ctx.moveTo(-r*0.15, 0);
  ctx.bezierCurveTo(-r*1.4, -r * 0.1 + wingFlap * r * 0.8, -r*1.6, r*0.5, -r*0.9, r*0.3);
  ctx.closePath();
  ctx.fill();
  // Right wing
  ctx.beginPath();
  ctx.moveTo(r*0.15, 0);
  ctx.bezierCurveTo(r*1.4, -r * 0.1 + wingFlap * r * 0.8, r*1.6, r*0.5, r*0.9, r*0.3);
  ctx.closePath();
  ctx.fill();
  // Wing membrane lines
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
  for (let wi = 0; wi < 3; wi++) {
    const wx = (wi - 1) * r * 0.35;
    ctx.beginPath(); ctx.moveTo(wx, 0); ctx.lineTo(wx - r*0.5 + wi*r*0.1, r*0.28); ctx.stroke();
  }

  // Body
  ctx.fillStyle = hitFlash ? '#fff' : (rage ? '#6d28d9' : '#312e81');
  ctx.beginPath(); ctx.ellipse(0, 0, r*0.52, r*0.7, 0, 0, Math.PI*2); ctx.fill();

  // Ears
  ctx.fillStyle = '#4c1d95';
  ctx.beginPath(); ctx.moveTo(-r*0.28, -r*0.55); ctx.lineTo(-r*0.42, -r*0.95); ctx.lineTo(-r*0.1, -r*0.6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(r*0.28, -r*0.55); ctx.lineTo(r*0.42, -r*0.95); ctx.lineTo(r*0.1, -r*0.6); ctx.closePath(); ctx.fill();

  // Eyes (red, glowing)
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.ellipse(-r*0.2, -r*0.08, 3, 2.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.2, -r*0.08, 3, 2.5, 0, 0, Math.PI*2); ctx.fill();

  // Fangs
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(-r*0.1, r*0.28); ctx.lineTo(-r*0.16, r*0.44); ctx.lineTo(-r*0.02, r*0.28); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(r*0.1, r*0.28); ctx.lineTo(r*0.16, r*0.44); ctx.lineTo(r*0.02, r*0.28); ctx.closePath(); ctx.fill();

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// GOBLIN — Nhỏ xanh lá, tai nhọn, tay cầm dao
// ──────────────────────────────────────────────────────────────
function drawEnemyGoblin(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const walk = Math.sin(t / 130) * 0.15;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(walk);

  // Body
  ctx.fillStyle = hitFlash ? '#fff' : (rage ? '#84cc16' : '#65a30d');
  ctx.beginPath(); ctx.ellipse(0, r*0.05, r*0.55, r*0.65, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#3f6212'; ctx.lineWidth = 2; ctx.stroke();

  // Head
  ctx.fillStyle = hitFlash ? '#fff' : '#84cc16';
  ctx.beginPath(); ctx.arc(0, -r*0.65, r*0.48, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#3f6212'; ctx.lineWidth = 1.5; ctx.stroke();

  // Pointy ears
  ctx.fillStyle = '#84cc16';
  ctx.beginPath(); ctx.moveTo(-r*0.45, -r*0.72); ctx.lineTo(-r*0.75, -r*1.1); ctx.lineTo(-r*0.2, -r*0.88); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(r*0.45, -r*0.72); ctx.lineTo(r*0.75, -r*1.1); ctx.lineTo(r*0.2, -r*0.88); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3f6212'; ctx.lineWidth = 1; ctx.stroke();

  // Eyes (angry)
  ctx.fillStyle = '#fef08a';
  ctx.beginPath(); ctx.ellipse(-r*0.2, -r*0.68, 4.5, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.2, -r*0.68, 4.5, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#dc2626';
  ctx.beginPath(); ctx.ellipse(-r*0.2, -r*0.67, 2.2, 2.4, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.2, -r*0.67, 2.2, 2.4, 0, 0, Math.PI*2); ctx.fill();
  // Angry brows
  ctx.strokeStyle = '#1a2e05'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-r*0.35, -r*0.82); ctx.lineTo(-r*0.1, -r*0.76); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(r*0.35, -r*0.82); ctx.lineTo(r*0.1, -r*0.76); ctx.stroke();

  // Dagger (right hand)
  ctx.save();
  ctx.translate(r*0.55, -r*0.2);
  ctx.rotate(-0.6 + walk);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-2, -r*0.55, 4, r*0.55);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-3, 0, 6, r*0.22);
  ctx.restore();

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// SPIDER — 8 chân nhện, thân oval đen bóng
// ──────────────────────────────────────────────────────────────
function drawEnemySpider(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const legWave = Math.sin(t / 100);

  ctx.save();
  ctx.translate(x, y);

  // 8 chân (4 mỗi bên)
  const legAngles = [-0.45, -0.75, -1.05, -1.35];
  for (let side = -1; side <= 1; side += 2) {
    for (let li = 0; li < 4; li++) {
      const ang = legAngles[li] * side;
      const legBob = Math.sin(t/90 + li * 0.8) * 0.12;
      ctx.strokeStyle = hitFlash ? '#fff' : '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(side * r * 0.42, 0);
      // Elbow
      const ex1 = side * r * (1.0 + li * 0.1);
      const ey1 = (li - 1.5) * r * 0.35 + legBob * r * 0.4;
      // Foot
      const ex2 = side * r * (1.3 + li * 0.1);
      const ey2 = (li - 1) * r * 0.45 + legBob * r * 0.5;
      ctx.lineTo(ex1, ey1);
      ctx.lineTo(ex2, ey2);
      ctx.stroke();
    }
  }

  // Abdomen (back)
  ctx.fillStyle = hitFlash ? '#fff' : '#1e1b4b';
  ctx.beginPath(); ctx.ellipse(0, r*0.18, r*0.58, r*0.52, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5; ctx.stroke();

  // Hourglass marking
  ctx.fillStyle = rage ? '#ef4444' : '#dc2626';
  ctx.beginPath(); ctx.ellipse(0, r*0.15, r*0.15, r*0.1, 0, 0, Math.PI*2); ctx.fill();

  // Cephalothorax (head+thorax)
  ctx.fillStyle = hitFlash ? '#fff' : '#0f172a';
  ctx.beginPath(); ctx.ellipse(0, -r*0.12, r*0.45, r*0.4, 0, 0, Math.PI*2); ctx.fill();

  // 8 mắt (2x4 grid)
  ctx.fillStyle = '#f9a8d4';
  for (let mi = 0; mi < 4; mi++) {
    const mx = (mi - 1.5) * r * 0.2;
    ctx.beginPath(); ctx.ellipse(mx, -r*0.2, 2.5, 2, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(mx, -r*0.05, 1.8, 1.5, 0, 0, Math.PI*2); ctx.fill();
  }

  // Chelicerae (fangs)
  ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-r*0.12, r*0.08); ctx.lineTo(-r*0.2, r*0.25); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(r*0.12, r*0.08); ctx.lineTo(r*0.2, r*0.25); ctx.stroke();
  ctx.fillStyle = '#475569';
  ctx.beginPath(); ctx.arc(-r*0.2, r*0.25, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(r*0.2, r*0.25, 3, 0, Math.PI*2); ctx.fill();

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// WOLF — Quadruped sói, đầu nhọn, răng nanh
// ──────────────────────────────────────────────────────────────
function drawEnemyWolf(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const isHellhound = e.type === 'hellhound';
  const bodyCol = isHellhound ? '#7f1d1d' : (rage ? '#92400e' : '#78716c');
  const darkCol = isHellhound ? '#450a0a' : '#44403c';
  const run = Math.sin(t / 110);

  ctx.save();
  ctx.translate(x, y);

  // Body
  ctx.fillStyle = hitFlash ? '#fff' : bodyCol;
  ctx.beginPath(); ctx.ellipse(0, 0, r*0.88, r*0.55, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = darkCol; ctx.lineWidth = 1.5; ctx.stroke();

  // 4 legs
  const legPairs = [[-r*0.5, r*0.45], [r*0.5, r*0.45], [-r*0.3, r*0.45], [r*0.3, r*0.45]];
  legPairs.forEach(([lx, ly], li) => {
    const lbob = Math.sin(t/100 + li * 1.2) * 0.15 * r;
    ctx.strokeStyle = hitFlash ? '#fff' : darkCol;
    ctx.lineWidth = r * 0.15;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lx, ly * 0.4);
    ctx.lineTo(lx, ly + lbob);
    ctx.stroke();
  });

  // Head
  ctx.fillStyle = hitFlash ? '#fff' : bodyCol;
  ctx.beginPath(); ctx.ellipse(-r*0.62, -r*0.18, r*0.38, r*0.3, -0.3, 0, Math.PI*2); ctx.fill();

  // Snout
  ctx.fillStyle = hitFlash ? '#fff' : darkCol;
  ctx.beginPath(); ctx.ellipse(-r*0.92, -r*0.22, r*0.2, r*0.15, -0.3, 0, Math.PI*2); ctx.fill();

  // Ears
  ctx.fillStyle = bodyCol;
  ctx.beginPath(); ctx.moveTo(-r*0.55, -r*0.42); ctx.lineTo(-r*0.72, -r*0.68); ctx.lineTo(-r*0.38, -r*0.46); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-r*0.4, -r*0.4); ctx.lineTo(-r*0.52, -r*0.64); ctx.lineTo(-r*0.25, -r*0.42); ctx.closePath(); ctx.fill();

  // Eye
  ctx.fillStyle = isHellhound ? '#ef4444' : '#fbbf24';
  ctx.beginPath(); ctx.ellipse(-r*0.68, -r*0.22, 3.5, 3, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(-r*0.68, -r*0.22, 1.5, 2, 0, 0, Math.PI*2); ctx.fill();

  // Fangs
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(-r*0.84, -r*0.14); ctx.lineTo(-r*0.88, -r*0.05); ctx.lineTo(-r*0.79, -r*0.14); ctx.closePath(); ctx.fill();

  // Tail
  ctx.strokeStyle = hitFlash ? '#fff' : bodyCol;
  ctx.lineWidth = r * 0.14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(r*0.82, -r*0.05);
  ctx.quadraticCurveTo(r*1.15, -r*0.35 + run*r*0.15, r*0.92, -r*0.55 + run*r*0.1);
  ctx.stroke();

  // Hellhound fire effect
  if (isHellhound) {
    ctx.globalAlpha = 0.5;
    for (let fi = 0; fi < 4; fi++) {
      const fa = t/200 + fi * 1.57;
      ctx.fillStyle = ['#ef4444','#f97316','#fbbf24'][fi % 3];
      ctx.beginPath();
      ctx.ellipse(-r*0.62 + Math.cos(fa)*r*0.5, -r*0.18 + Math.sin(fa)*r*0.3 - r*0.3, 4, 8, fa, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// KNIGHT — Hiệp sĩ giáp thép, khiên tròn + kiếm
// ──────────────────────────────────────────────────────────────
function drawEnemyKnight(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const isDK = e.type === 'death_knight';
  const armorCol = hitFlash ? '#fff' : (isDK ? '#1e1b4b' : (rage ? '#475569' : '#94a3b8'));
  const darkArmorCol = isDK ? '#0f0f1a' : '#475569';
  const walk = Math.sin(t / 150) * 0.06;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(walk);

  // Torso armor
  ctx.fillStyle = armorCol;
  ctx.beginPath(); ctx.roundRect(-r*0.45, -r*0.15, r*0.9, r*0.75, 5); ctx.fill();
  ctx.strokeStyle = darkArmorCol; ctx.lineWidth = 2; ctx.stroke();
  // Pauldrons (shoulder plates)
  ctx.fillStyle = armorCol;
  ctx.beginPath(); ctx.ellipse(-r*0.52, -r*0.1, r*0.2, r*0.15, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.52, -r*0.1, r*0.2, r*0.15, 0, 0, Math.PI*2); ctx.fill();

  // Legs
  for (let side = -1; side <= 1; side += 2) {
    ctx.fillStyle = armorCol;
    ctx.beginPath(); ctx.roundRect(side*r*0.08, r*0.55, r*0.32, r*0.42, 3); ctx.fill();
    ctx.strokeStyle = darkArmorCol; ctx.lineWidth = 1.5; ctx.stroke();
  }

  // Helmet
  ctx.fillStyle = armorCol;
  ctx.beginPath(); ctx.arc(0, -r*0.5, r*0.38, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = darkArmorCol; ctx.lineWidth = 2; ctx.stroke();
  // Visor slit
  ctx.fillStyle = isDK ? '#a855f7' : '#ef4444';
  ctx.fillRect(-r*0.22, -r*0.55, r*0.44, r*0.08);

  // Shield (left side)
  ctx.fillStyle = isDK ? '#312e81' : '#1d4ed8';
  ctx.beginPath(); ctx.arc(-r*0.82, -r*0.05, r*0.32, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath(); ctx.moveTo(-r*0.82, -r*0.2); ctx.lineTo(-r*0.73, r*0.1); ctx.lineTo(-r*0.82, r*0.15); ctx.lineTo(-r*0.91, r*0.1); ctx.closePath(); ctx.fill();

  // Sword (right side)
  ctx.save();
  ctx.translate(r*0.7, -r*0.3);
  ctx.rotate(0.3 + walk * 2);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(-2.5, -r*0.7, 5, r*0.7);
  ctx.fillStyle = '#fbbf24'; ctx.fillRect(-6, 0, 12, 5);
  ctx.fillStyle = '#78350f'; ctx.fillRect(-3, 4, 6, r*0.25);
  ctx.restore();

  // Death Knight glow
  if (isDK) {
    ctx.strokeStyle = `rgba(168,85,247,${0.4 + Math.sin(t/200)*0.3})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, -r*0.2, r*1.15, 0, Math.PI*2); ctx.stroke();
  }

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// ORC — Thân to xanh lá, bắp thịt lồi, nanh dưới
// ──────────────────────────────────────────────────────────────
function drawEnemyOrc(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const walk = Math.sin(t / 145) * 0.08;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(walk);

  // Huge body
  ctx.fillStyle = hitFlash ? '#fff' : (rage ? '#65a30d' : '#4d7c0f');
  ctx.beginPath(); ctx.ellipse(0, 0, r*0.78, r*0.88, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#1a2e05'; ctx.lineWidth = 2.5; ctx.stroke();

  // Muscle bumps
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.ellipse(-r*0.28, -r*0.12, r*0.22, r*0.15, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.28, -r*0.12, r*0.22, r*0.15, 0.3, 0, Math.PI*2); ctx.fill();

  // Arms
  ctx.fillStyle = hitFlash ? '#fff' : '#4d7c0f';
  ctx.beginPath(); ctx.ellipse(-r*0.9, r*0.05, r*0.25, r*0.4, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.9, r*0.05, r*0.25, r*0.4, 0.3, 0, Math.PI*2); ctx.fill();

  // Axe (right hand)
  ctx.save();
  ctx.translate(r*1.1, -r*0.1);
  ctx.rotate(0.5);
  ctx.fillStyle = '#475569';
  ctx.fillRect(-3, -r*0.45, 6, r*0.45);
  ctx.beginPath();
  ctx.moveTo(-r*0.25, -r*0.48);
  ctx.lineTo(r*0.05, -r*0.28);
  ctx.lineTo(-r*0.05, -r*0.12);
  ctx.lineTo(-r*0.35, -r*0.32);
  ctx.closePath();
  ctx.fillStyle = '#94a3b8'; ctx.fill();
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();

  // Head
  ctx.fillStyle = hitFlash ? '#fff' : '#65a30d';
  ctx.beginPath(); ctx.ellipse(0, -r*0.72, r*0.5, r*0.46, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#1a2e05'; ctx.lineWidth = 1.5; ctx.stroke();

  // Eyes
  ctx.fillStyle = '#fef08a';
  ctx.beginPath(); ctx.ellipse(-r*0.2, -r*0.75, 4, 4.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.2, -r*0.75, 4, 4.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath(); ctx.ellipse(-r*0.2, -r*0.74, 2, 2.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.2, -r*0.74, 2, 2.5, 0, 0, Math.PI*2); ctx.fill();

  // Tusks (nanh dưới)
  ctx.fillStyle = '#fef9c3';
  ctx.beginPath(); ctx.moveTo(-r*0.18, -r*0.42); ctx.lineTo(-r*0.24, -r*0.26); ctx.lineTo(-r*0.1, -r*0.42); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(r*0.18, -r*0.42); ctx.lineTo(r*0.24, -r*0.26); ctx.lineTo(r*0.1, -r*0.42); ctx.closePath(); ctx.fill();

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// DARK MAGE — Áo choàng tím đen, orb ma thuật
// ──────────────────────────────────────────────────────────────
function drawEnemyDarkMage(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const hover = Math.sin(t / 250) * r * 0.08;
  const orbPulse = 0.8 + Math.sin(t / 180) * 0.2;

  ctx.save();
  ctx.translate(x, y - hover);

  // Robe (large cloak)
  ctx.fillStyle = hitFlash ? '#fff' : (rage ? '#4c1d95' : '#1e1b4b');
  ctx.beginPath();
  ctx.moveTo(0, -r*0.95);
  ctx.bezierCurveTo(-r*0.85, -r*0.3, -r*0.95, r*0.5, -r*0.7, r*0.95);
  ctx.lineTo(r*0.7, r*0.95);
  ctx.bezierCurveTo(r*0.95, r*0.5, r*0.85, -r*0.3, 0, -r*0.95);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2; ctx.stroke();

  // Robe trim
  ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-r*0.1, -r*0.9);
  ctx.lineTo(-r*0.05, r*0.92);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r*0.1, -r*0.9);
  ctx.lineTo(r*0.05, r*0.92);
  ctx.stroke();

  // Head
  ctx.fillStyle = hitFlash ? '#fff' : '#2e1065';
  ctx.beginPath(); ctx.arc(0, -r*0.72, r*0.35, 0, Math.PI*2); ctx.fill();

  // Pointed hat
  ctx.fillStyle = hitFlash ? '#fff' : (rage ? '#7c3aed' : '#3b0764');
  ctx.beginPath();
  ctx.moveTo(-r*0.4, -r*0.88);
  ctx.lineTo(0, -r*1.6);
  ctx.lineTo(r*0.4, -r*0.88);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 1.5; ctx.stroke();
  // Hat brim
  ctx.fillStyle = '#3b0764';
  ctx.beginPath(); ctx.ellipse(0, -r*0.88, r*0.45, r*0.1, 0, 0, Math.PI*2); ctx.fill();

  // Eyes (glowing white/purple)
  const eyeGlow = `rgba(${rage?'239,68,68':'168,85,247'},${orbPulse})`;
  ctx.fillStyle = eyeGlow;
  ctx.beginPath(); ctx.ellipse(-r*0.15, -r*0.74, 3.5, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.15, -r*0.74, 3.5, 4, 0, 0, Math.PI*2); ctx.fill();

  // Magic orb (right hand)
  ctx.save();
  ctx.translate(r*0.62, -r*0.2 + Math.sin(t/150)*r*0.1);
  // Orb glow
  const orbG = ctx.createRadialGradient(0, 0, 0, 0, 0, r*0.28);
  orbG.addColorStop(0, '#fff');
  orbG.addColorStop(0.4, rage ? '#ef4444' : '#a855f7');
  orbG.addColorStop(1, 'transparent');
  ctx.fillStyle = orbG;
  ctx.globalAlpha = orbPulse;
  ctx.beginPath(); ctx.arc(0, 0, r*0.28, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  // Staff
  ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, r*0.25); ctx.lineTo(0, -r*0.65); ctx.stroke();
  ctx.restore();

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// SKELETON — Xương người trắng ngà, kiếm gãy
// ──────────────────────────────────────────────────────────────
function drawEnemySkeletonBone(ctx, x1, y1, x2, y2, w) {
  ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

function drawEnemySkeleton(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const walk = Math.sin(t / 140) * 0.1;
  const boneCol = hitFlash ? '#fff' : (rage ? '#fef08a' : '#e2e8f0');

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(walk);
  ctx.strokeStyle = boneCol;

  // Legs
  drawEnemySkeletonBone(ctx, -r*0.2, r*0.4, -r*0.25, r*0.8 + Math.sin(t/130)*r*0.1, r*0.1);
  drawEnemySkeletonBone(ctx, r*0.2, r*0.4, r*0.25, r*0.8 - Math.sin(t/130)*r*0.1, r*0.1);

  // Spine
  drawEnemySkeletonBone(ctx, 0, -r*0.2, 0, r*0.4, r*0.09);

  // Ribcage
  for (let ri = 0; ri < 4; ri++) {
    const ry = -r*0.05 + ri * r*0.12;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-r*0.06, ry, r*0.28, -0.3, Math.PI+0.3); ctx.stroke();
    ctx.beginPath(); ctx.arc(r*0.06, ry, r*0.28, -Math.PI-0.3, 0.3); ctx.stroke();
  }

  // Arms
  drawEnemySkeletonBone(ctx, -r*0.1, -r*0.05, -r*0.55, r*0.25 + Math.sin(t/140)*r*0.1, r*0.09);
  drawEnemySkeletonBone(ctx, r*0.1, -r*0.05, r*0.6, r*0.05 - Math.sin(t/140)*r*0.1, r*0.09);

  // Skull
  ctx.fillStyle = boneCol;
  ctx.beginPath(); ctx.arc(0, -r*0.55, r*0.36, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = rage ? '#ef4444' : '#94a3b8'; ctx.lineWidth = 1.5; ctx.stroke();

  // Jaw
  ctx.fillStyle = boneCol;
  ctx.beginPath(); ctx.arc(0, -r*0.28, r*0.2, 0, Math.PI); ctx.fill();
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1; ctx.stroke();

  // Eye sockets (empty/dark)
  ctx.fillStyle = rage ? '#ef444488' : '#0f172a';
  ctx.beginPath(); ctx.ellipse(-r*0.16, -r*0.58, 5, 6, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.16, -r*0.58, 5, 6, 0, 0, Math.PI*2); ctx.fill();

  // Broken sword (left hand)
  ctx.save();
  ctx.translate(-r*0.6, r*0.18);
  ctx.rotate(0.4 + walk);
  ctx.fillStyle = '#475569';
  ctx.fillRect(-2, -r*0.32, 4, r*0.28);
  ctx.fillStyle = '#64748b';
  ctx.beginPath(); ctx.moveTo(0, -r*0.32); ctx.lineTo(-r*0.14, -r*0.52); ctx.lineTo(r*0.14, -r*0.52); ctx.closePath(); ctx.fill();
  ctx.restore();

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// SHADOW — Hình nhân bóng tối, viền tím
// ──────────────────────────────────────────────────────────────
function drawEnemyShadow(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const drift = Math.sin(t / 200) * r * 0.06;
  const flicker = 0.65 + Math.sin(t / 80) * 0.25;

  ctx.save();
  ctx.translate(x, y + drift);
  ctx.globalAlpha = flicker;

  // Dark body with gradient
  const g = ctx.createRadialGradient(-r*0.2, -r*0.3, r*0.05, 0, 0, r*1.1);
  g.addColorStop(0, hitFlash ? '#fff' : (rage ? '#4c1d95' : '#2e1065'));
  g.addColorStop(0.6, hitFlash ? '#ddd' : '#1e1b4b');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, 0, r*0.82, r, 0, 0, Math.PI*2); ctx.fill();

  // Purple outline glow
  ctx.strokeStyle = rage ? '#a21caf' : '#7c3aed';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.8;
  ctx.beginPath(); ctx.ellipse(0, 0, r*0.82, r, 0, 0, Math.PI*2); ctx.stroke();
  ctx.globalAlpha = flicker;

  // Ethereal wisps at bottom
  for (let wi = 0; wi < 3; wi++) {
    const wa = (wi / 3) * Math.PI + t / 300;
    ctx.fillStyle = 'rgba(124,58,237,0.4)';
    ctx.beginPath();
    ctx.ellipse(Math.cos(wa) * r * 0.3, r * 0.65 + Math.sin(t/150+wi)*r*0.15, r*0.12, r*0.22, wa, 0, Math.PI*2);
    ctx.fill();
  }

  // Eyes (white glowing slits)
  ctx.globalAlpha = 1;
  ctx.fillStyle = hitFlash ? '#f0f' : (rage ? '#ef4444' : '#e879f9');
  ctx.beginPath(); ctx.ellipse(-r*0.2, -r*0.15, 4.5, 2.5, 0.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.2, -r*0.15, 4.5, 2.5, -0.2, 0, Math.PI*2); ctx.fill();

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// VAMPIRE — Choàng đen đỏ, nanh, cánh bat
// ──────────────────────────────────────────────────────────────
function drawEnemyVampire(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const hover = Math.sin(t / 200) * r * 0.05;
  const wingFlap = Math.sin(t / 180) * 0.4;

  ctx.save();
  ctx.translate(x, y + hover);

  // Cape wings (small bat wings)
  ctx.fillStyle = hitFlash ? '#fff' : '#1c0a09';
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.2, -r*0.3);
    ctx.bezierCurveTo(side * r * 1.2, -r*0.1 + wingFlap*r*0.5, side * r * 1.4, r*0.4, side * r * 0.9, r*0.5);
    ctx.lineTo(side * r * 0.3, r*0.1);
    ctx.closePath(); ctx.fill();
    // Wing membrane
    ctx.strokeStyle = '#450a0a'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(side*r*0.2, -r*0.3);
    ctx.lineTo(side*r*0.9, r*0.45);
    ctx.stroke();
  }

  // Body (cloak)
  ctx.fillStyle = hitFlash ? '#fff' : (rage ? '#7f1d1d' : '#1c0a09');
  ctx.beginPath();
  ctx.moveTo(-r*0.42, -r*0.4);
  ctx.lineTo(r*0.42, -r*0.4);
  ctx.lineTo(r*0.6, r*0.9);
  ctx.lineTo(-r*0.6, r*0.9);
  ctx.closePath(); ctx.fill();
  // Red inner cloak
  ctx.fillStyle = hitFlash ? '#fff' : '#991b1b';
  ctx.beginPath();
  ctx.moveTo(-r*0.2, -r*0.4);
  ctx.lineTo(r*0.2, -r*0.4);
  ctx.lineTo(r*0.3, r*0.9);
  ctx.lineTo(-r*0.3, r*0.9);
  ctx.closePath(); ctx.fill();

  // Head
  ctx.fillStyle = hitFlash ? '#fff' : '#fce7f3';
  ctx.beginPath(); ctx.arc(0, -r*0.62, r*0.35, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#be185d'; ctx.lineWidth = 1.5; ctx.stroke();

  // Hair
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(0, -r*0.78, r*0.32, Math.PI, 0);
  ctx.lineTo(r*0.35, -r*0.62);
  ctx.closePath(); ctx.fill();
  // Side peaks
  ctx.beginPath(); ctx.moveTo(-r*0.32, -r*0.72); ctx.lineTo(-r*0.45, -r*0.98); ctx.lineTo(-r*0.15, -r*0.76); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(r*0.32, -r*0.72); ctx.lineTo(r*0.45, -r*0.98); ctx.lineTo(r*0.15, -r*0.76); ctx.closePath(); ctx.fill();

  // Eyes (red glowing)
  const eyeG = 0.7 + Math.sin(t/120)*0.3;
  ctx.fillStyle = `rgba(220,38,38,${eyeG})`;
  ctx.beginPath(); ctx.ellipse(-r*0.15, -r*0.64, 4, 3.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.15, -r*0.64, 4, 3.5, 0, 0, Math.PI*2); ctx.fill();

  // Fangs
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(-r*0.1, -r*0.46); ctx.lineTo(-r*0.14, -r*0.34); ctx.lineTo(-r*0.04, -r*0.46); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(r*0.1, -r*0.46); ctx.lineTo(r*0.14, -r*0.34); ctx.lineTo(r*0.04, -r*0.46); ctx.closePath(); ctx.fill();

  // Blood drip
  if (rage) {
    ctx.fillStyle = '#dc2626';
    ctx.beginPath(); ctx.arc(-r*0.14, -r*0.32, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-r*0.14, -r*0.3); ctx.lineTo(-r*0.16, -r*0.22); ctx.lineTo(-r*0.12, -r*0.22); ctx.closePath(); ctx.fill();
  }

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// GOLEM — Khối đất đá to, nứt nẻ phát sáng cam
// ──────────────────────────────────────────────────────────────
function drawEnemyGolem(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const walk = Math.sin(t / 250) * 0.04;
  const crackGlow = `rgba(251,146,60,${0.6 + Math.sin(t/150)*0.4})`;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(walk);

  // Body (huge rock-like)
  ctx.fillStyle = hitFlash ? '#fff' : (rage ? '#92400e' : '#57534e');
  ctx.beginPath();
  ctx.moveTo(-r*0.75, r*0.9);
  ctx.lineTo(-r*0.88, -r*0.2);
  ctx.lineTo(-r*0.55, -r*0.85);
  ctx.lineTo(r*0.55, -r*0.85);
  ctx.lineTo(r*0.88, -r*0.2);
  ctx.lineTo(r*0.75, r*0.9);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#292524'; ctx.lineWidth = 3; ctx.stroke();

  // Stone texture lines
  ctx.strokeStyle = '#292524'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-r*0.4, -r*0.5); ctx.lineTo(-r*0.6, r*0.3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(r*0.3, -r*0.6); ctx.lineTo(r*0.5, r*0.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r*0.2, r*0.1); ctx.lineTo(r*0.35, r*0.2); ctx.stroke();

  // Glowing cracks (lava-like)
  ctx.strokeStyle = crackGlow;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(-r*0.3, -r*0.3); ctx.lineTo(-r*0.1, r*0.2); ctx.lineTo(-r*0.4, r*0.55); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(r*0.2, -r*0.55); ctx.lineTo(r*0.4, r*0.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r*0.5, r*0.3); ctx.lineTo(r*0.3, r*0.6); ctx.stroke();

  // Huge fist arms
  ctx.fillStyle = hitFlash ? '#fff' : '#78716c';
  ctx.beginPath(); ctx.ellipse(-r*1.05, r*0.05, r*0.38, r*0.42, -0.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*1.05, r*0.05, r*0.38, r*0.42, 0.2, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#292524'; ctx.lineWidth = 2; ctx.stroke();
  // Fist details
  for (let fi = 0; fi < 3; fi++) {
    ctx.strokeStyle = '#44403c'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-r*1.18 + fi*r*0.12, r*0.15); ctx.lineTo(-r*1.18 + fi*r*0.12, r*0.28); ctx.stroke();
  }

  // Head (boulder-like)
  ctx.fillStyle = hitFlash ? '#fff' : '#78716c';
  ctx.beginPath(); ctx.ellipse(0, -r*0.72, r*0.42, r*0.38, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#292524'; ctx.lineWidth = 2; ctx.stroke();

  // Glowing eyes (magma)
  ctx.fillStyle = crackGlow;
  ctx.beginPath(); ctx.ellipse(-r*0.18, -r*0.76, 5.5, 4.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.18, -r*0.76, 5.5, 4.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(-r*0.18, -r*0.77, 2.5, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.18, -r*0.77, 2.5, 2, 0, 0, Math.PI*2); ctx.fill();

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// BERSERKER — Chiến binh cơ bắp to, axe hai tay
// ──────────────────────────────────────────────────────────────
function drawEnemyBerserker(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const walk = Math.sin(t / 120) * 0.1;
  const rageSwing = rage ? Math.sin(t / 80) * 0.3 : 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(walk);

  // Muscular body
  ctx.fillStyle = hitFlash ? '#fff' : (rage ? '#dc2626' : '#b91c1c');
  ctx.beginPath(); ctx.ellipse(0, 0, r*0.72, r*0.88, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 2; ctx.stroke();

  // Chest muscles
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(-r*0.24, -r*0.1, r*0.22, r*0.18, -0.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.24, -r*0.1, r*0.22, r*0.18, 0.2, 0, Math.PI*2); ctx.fill();

  // Huge arms
  ctx.fillStyle = hitFlash ? '#fff' : '#b91c1c';
  ctx.beginPath(); ctx.ellipse(-r*0.9, -r*0.1, r*0.28, r*0.48, -0.35 + rageSwing, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.9, -r*0.1, r*0.28, r*0.48, 0.35 - rageSwing, 0, Math.PI*2); ctx.fill();

  // TWO-HANDED AXE (behind the berserker, spanning both sides)
  ctx.save();
  ctx.translate(0, -r*0.2);
  ctx.rotate(rageSwing * 0.5);
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-r*1.2, 0); ctx.lineTo(r*1.2, 0); ctx.stroke();
  // Left axe head
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(-r*1.0, 0);
  ctx.lineTo(-r*1.4, -r*0.35);
  ctx.lineTo(-r*1.5, r*0.08);
  ctx.lineTo(-r*1.2, r*0.22);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1.5; ctx.stroke();
  // Right axe head
  ctx.beginPath();
  ctx.moveTo(r*1.0, 0);
  ctx.lineTo(r*1.4, -r*0.35);
  ctx.lineTo(r*1.5, r*0.08);
  ctx.lineTo(r*1.2, r*0.22);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();

  // Head
  ctx.fillStyle = hitFlash ? '#fff' : '#ef4444';
  ctx.beginPath(); ctx.arc(0, -r*0.68, r*0.42, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 2; ctx.stroke();

  // Wild red hair
  ctx.fillStyle = '#dc2626';
  for (let hi = 0; hi < 5; hi++) {
    const ha = -Math.PI*0.9 + hi * Math.PI*0.22;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ha)*r*0.38, -r*0.68 + Math.sin(ha)*r*0.38);
    ctx.lineTo(Math.cos(ha)*r*0.62, -r*0.68 + Math.sin(ha)*r*0.62 - r*0.12);
    ctx.lineWidth = 4; ctx.strokeStyle = '#dc2626'; ctx.stroke();
  }

  // Eyes (fury)
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath(); ctx.ellipse(-r*0.18, -r*0.72, 5, 4.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.18, -r*0.72, 5, 4.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(-r*0.18, -r*0.7, 2.5, 3, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.18, -r*0.7, 2.5, 3, 0, 0, Math.PI*2); ctx.fill();
  // Rage veins
  if (rage) {
    ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-r*0.38, -r*0.82); ctx.lineTo(-r*0.2, -r*0.78); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r*0.38, -r*0.82); ctx.lineTo(r*0.2, -r*0.78); ctx.stroke();
  }

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// PHANTOM — Hồn ma trong suốt, đuôi khói
// ──────────────────────────────────────────────────────────────
function drawEnemyPhantom(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const drift = Math.sin(t / 220) * r * 0.08;
  const glow = 0.5 + Math.sin(t / 150) * 0.35;
  const tailWave = Math.sin(t / 170);

  ctx.save();
  ctx.translate(x, y + drift);

  // Ghost tail (wispy smoke)
  for (let ti = 0; ti < 4; ti++) {
    const tw = (ti / 4) * Math.PI;
    const tr = r * (0.45 - ti * 0.08);
    const ty = r * (0.4 + ti * 0.38) + tailWave * r * 0.12 * (ti+1);
    ctx.globalAlpha = (0.5 - ti * 0.1) * glow;
    ctx.fillStyle = hitFlash ? '#fff' : (rage ? '#a21caf' : '#a5b4fc');
    ctx.beginPath(); ctx.ellipse(tailWave * r * 0.08 * ti, ty, tr, tr * 0.55, 0, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Main body
  const bodyG = ctx.createRadialGradient(-r*0.2, -r*0.25, r*0.05, 0, 0, r*0.85);
  bodyG.addColorStop(0, hitFlash ? '#fff' : (rage ? '#c084fc' : '#e0e7ff'));
  bodyG.addColorStop(0.5, hitFlash ? '#ccf' : (rage ? '#7c3aed' : '#6366f1'));
  bodyG.addColorStop(1, 'rgba(99,102,241,0)');
  ctx.fillStyle = bodyG;
  ctx.globalAlpha = 0.78 * glow;
  ctx.beginPath(); ctx.ellipse(0, -r*0.1, r*0.72, r*0.88, 0, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;

  // Glow outline
  ctx.strokeStyle = rage ? '#a855f7' : '#818cf8';
  ctx.lineWidth = 2;
  ctx.globalAlpha = glow;
  ctx.beginPath(); ctx.ellipse(0, -r*0.1, r*0.72, r*0.88, 0, 0, Math.PI*2); ctx.stroke();
  ctx.globalAlpha = 1;

  // Eyes (neon cyan/blue)
  ctx.fillStyle = rage ? '#f0abfc' : '#22d3ee';
  ctx.beginPath(); ctx.ellipse(-r*0.22, -r*0.25, 5, 6.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.22, -r*0.25, 5, 6.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(-r*0.22, -r*0.26, 2.5, 3, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.22, -r*0.26, 2.5, 3, 0, 0, Math.PI*2); ctx.fill();

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// DRAGON — Rồng nhỏ đỏ cam, cánh vỗ, mắt vàng
// ──────────────────────────────────────────────────────────────
function drawEnemyDragon(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const wingFlap = Math.sin(t / 140);
  const walk = Math.sin(t / 160) * 0.05;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(walk);

  // Wings
  const wingCol = hitFlash ? '#fff' : (rage ? '#dc2626' : '#c2410c');
  for (let side = -1; side <= 1; side += 2) {
    ctx.fillStyle = wingCol;
    ctx.beginPath();
    ctx.moveTo(side*r*0.28, -r*0.3);
    ctx.bezierCurveTo(side*r*1.2, -r*0.5 + wingFlap*r*0.4, side*r*1.55, r*0.1, side*r*0.9, r*0.2);
    ctx.lineTo(side*r*0.3, r*0.0);
    ctx.closePath(); ctx.fill();
    // Wing ribs
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5;
    for (let wr = 0; wr < 3; wr++) {
      const wrProgress = (wr + 1) / 4;
      ctx.beginPath();
      ctx.moveTo(side*r*0.28, -r*0.15 + r*0.15*wrProgress);
      ctx.lineTo(side*r*(0.9 + wr*0.15), r*0.0 + r*0.06*wr + wingFlap*r*0.1*wrProgress);
      ctx.stroke();
    }
  }

  // Body
  ctx.fillStyle = hitFlash ? '#fff' : (rage ? '#ef4444' : '#ea580c');
  ctx.beginPath(); ctx.ellipse(0, r*0.05, r*0.65, r*0.52, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 2; ctx.stroke();

  // Belly scales (lighter)
  ctx.fillStyle = 'rgba(254,215,170,0.4)';
  ctx.beginPath(); ctx.ellipse(0, r*0.12, r*0.38, r*0.32, 0, 0, Math.PI*2); ctx.fill();

  // Head
  ctx.fillStyle = hitFlash ? '#fff' : '#ea580c';
  ctx.beginPath(); ctx.ellipse(-r*0.6, -r*0.22, r*0.42, r*0.32, -0.25, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 1.5; ctx.stroke();

  // Snout
  ctx.fillStyle = hitFlash ? '#fff' : '#c2410c';
  ctx.beginPath(); ctx.ellipse(-r*0.9, -r*0.26, r*0.22, r*0.16, -0.2, 0, Math.PI*2); ctx.fill();

  // Horn
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath(); ctx.moveTo(-r*0.52, -r*0.45); ctx.lineTo(-r*0.45, -r*0.72); ctx.lineTo(-r*0.38, -r*0.46); ctx.closePath(); ctx.fill();

  // Eye
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath(); ctx.ellipse(-r*0.68, -r*0.26, 4.5, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#1c1917';
  ctx.beginPath(); ctx.ellipse(-r*0.68, -r*0.24, 2, 3, 0, 0, Math.PI*2); ctx.fill();

  // Tail
  ctx.strokeStyle = hitFlash ? '#fff' : '#ea580c';
  ctx.lineWidth = r*0.18; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(r*0.6, r*0.02);
  ctx.quadraticCurveTo(r*1.1, r*0.3, r*0.95, -r*0.25);
  ctx.stroke();

  // Fire breath (if rage)
  if (rage) {
    ctx.globalAlpha = 0.7;
    for (let fi = 0; fi < 5; fi++) {
      const fa = -0.2 + fi * 0.12;
      const fl = r * (0.4 + fi * 0.2);
      const fc = ['#fbbf24','#f97316','#ef4444'][fi % 3];
      ctx.fillStyle = fc;
      ctx.beginPath();
      ctx.arc(-r*0.9 + Math.cos(fa)*fl - r*0.6, -r*0.26 + Math.sin(fa)*fl*0.3, r*0.06*(5-fi), 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// NECROMANCER — Phù thủy xương, skull staff
// ──────────────────────────────────────────────────────────────
function drawEnemyNecromancer(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const hover = Math.sin(t / 240) * r * 0.06;
  const orbPulse = 0.7 + Math.sin(t / 160) * 0.3;
  const staffOrbCol = rage ? '#ef4444' : '#64748b';

  ctx.save();
  ctx.translate(x, y + hover);

  // Robe (dark tattered)
  ctx.fillStyle = hitFlash ? '#fff' : (rage ? '#1e1b4b' : '#0f172a');
  ctx.beginPath();
  ctx.moveTo(0, -r*0.9);
  ctx.bezierCurveTo(-r*0.9, -r*0.3, -r*1.0, r*0.4, -r*0.8, r*0.95);
  ctx.lineTo(r*0.8, r*0.95);
  ctx.bezierCurveTo(r*1.0, r*0.4, r*0.9, -r*0.3, 0, -r*0.9);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.stroke();

  // Tattered robe edges
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
  for (let ti = 0; ti < 5; ti++) {
    const tx = -r*0.7 + ti * r*0.35;
    ctx.beginPath(); ctx.moveTo(tx, r*0.9); ctx.lineTo(tx + r*0.1, r*1.05); ctx.lineTo(tx + r*0.2, r*0.9); ctx.stroke();
  }

  // Skull face
  ctx.fillStyle = hitFlash ? '#fff' : '#d4d4d4';
  ctx.beginPath(); ctx.arc(0, -r*0.65, r*0.34, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1; ctx.stroke();
  // Eye sockets
  ctx.fillStyle = rage ? '#ef444488' : '#0f172a';
  ctx.beginPath(); ctx.ellipse(-r*0.14, -r*0.68, 5, 6.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.14, -r*0.68, 5, 6.5, 0, 0, Math.PI*2); ctx.fill();
  // Nasal cavity
  ctx.fillStyle = '#0f172a';
  ctx.beginPath(); ctx.ellipse(0, -r*0.56, 3, 3.5, 0, 0, Math.PI*2); ctx.fill();
  // Teeth
  ctx.fillStyle = '#d4d4d4';
  for (let ti = 0; ti < 5; ti++) {
    ctx.fillRect(-r*0.22 + ti * r*0.11, -r*0.47, r*0.08, r*0.08);
  }

  // Hood (skull cap)
  ctx.fillStyle = hitFlash ? '#fff' : '#1e293b';
  ctx.beginPath();
  ctx.arc(0, -r*0.72, r*0.35, Math.PI, 0);
  ctx.closePath(); ctx.fill();

  // Skull staff (right side)
  ctx.save();
  ctx.translate(r*0.62, -r*0.15 + Math.sin(t/180)*r*0.1);
  ctx.strokeStyle = '#64748b'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, r*0.8); ctx.lineTo(0, -r*0.55); ctx.stroke();
  // Skull atop staff
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath(); ctx.arc(0, -r*0.65, r*0.2, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = staffOrbCol;
  ctx.globalAlpha = orbPulse;
  ctx.beginPath(); ctx.ellipse(-r*0.1, -r*0.67, 3.5, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.1, -r*0.67, 3.5, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;
  // Orb glow around skull
  const sog = ctx.createRadialGradient(0, -r*0.65, 0, 0, -r*0.65, r*0.38);
  sog.addColorStop(0, `${staffOrbCol}88`);
  sog.addColorStop(1, 'transparent');
  ctx.fillStyle = sog;
  ctx.beginPath(); ctx.arc(0, -r*0.65, r*0.38, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// BANSHEE — Yêu nữ trắng bạch, tóc bay, miệng mở
// ──────────────────────────────────────────────────────────────
function drawEnemyBanshee(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const hover = Math.sin(t / 190) * r * 0.1;
  const screamPulse = e._screamTimer > 4.5 ? Math.sin(t/40)*0.3 : 0;
  const hairWave = Math.sin(t / 120);

  ctx.save();
  ctx.translate(x, y + hover);

  // Ethereal body
  const bG = ctx.createRadialGradient(0, 0, 0, 0, 0, r*1.1);
  bG.addColorStop(0, hitFlash ? '#fff' : (rage ? '#fce7f3' : '#f0fdf4'));
  bG.addColorStop(0.5, hitFlash ? '#eee' : '#e0f2fe');
  bG.addColorStop(1, 'rgba(240,253,244,0)');
  ctx.fillStyle = bG;
  ctx.globalAlpha = 0.82;
  ctx.beginPath(); ctx.ellipse(0, r*0.1, r*0.65, r*0.9, 0, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;

  // Hair tendrils (flying)
  ctx.strokeStyle = hitFlash ? '#fff' : (rage ? '#be185d' : '#e0f2fe');
  ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let hi = 0; hi < 6; hi++) {
    const hAngle = -Math.PI * 0.8 + hi * Math.PI * 0.32;
    const hLen = r * (0.6 + hi * 0.05);
    const hBend = hairWave * r * 0.18 * (hi % 2 === 0 ? 1 : -1);
    ctx.beginPath();
    ctx.moveTo(Math.cos(hAngle)*r*0.28, -r*0.62 + Math.sin(hAngle)*r*0.28);
    ctx.quadraticCurveTo(
      Math.cos(hAngle)*hLen + hBend,
      -r*0.62 + Math.sin(hAngle)*hLen + hBend * 0.5,
      Math.cos(hAngle)*hLen*1.3 + hBend*1.8,
      -r*0.62 + Math.sin(hAngle)*hLen*1.3
    );
    ctx.stroke();
  }

  // Face
  ctx.fillStyle = hitFlash ? '#fff' : '#f0fdf4';
  ctx.beginPath(); ctx.ellipse(0, -r*0.5, r*0.38, r*0.44, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#bae6fd'; ctx.lineWidth = 1.5; ctx.stroke();

  // Empty eye sockets
  ctx.fillStyle = rage ? '#9d174d' : '#0ea5e9';
  ctx.beginPath(); ctx.ellipse(-r*0.16, -r*0.54, 5, 7, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.16, -r*0.54, 5, 7, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(-r*0.16, -r*0.55, 2.5, 3, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.16, -r*0.55, 2.5, 3, 0, 0, Math.PI*2); ctx.fill();

  // Open mouth (SCREAMING)
  const mouthOpen = r * (0.14 + screamPulse * 0.08);
  ctx.fillStyle = '#0f172a';
  ctx.beginPath(); ctx.ellipse(0, -r*0.28, mouthOpen, mouthOpen * 0.7, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#bae6fd'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, -r*0.28, mouthOpen, 0, Math.PI); ctx.stroke();

  // Scream energy rings
  if (screamPulse > 0) {
    for (let si = 0; si < 3; si++) {
      ctx.strokeStyle = `rgba(125,211,252,${0.5 - si*0.15})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, -r*0.28, r*(0.5 + si*0.35 + screamPulse*0.2), 0, Math.PI*2); ctx.stroke();
    }
  }

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// EXECUTIONER — Đao phủ to đen, mặt nạ, rìu lớn
// ──────────────────────────────────────────────────────────────
function drawEnemyExecutioner(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const walk = Math.sin(t / 180) * 0.06;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(walk);

  // Huge body
  ctx.fillStyle = hitFlash ? '#fff' : (rage ? '#292524' : '#1c1917');
  ctx.beginPath(); ctx.ellipse(0, r*0.05, r*0.82, r, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#57534e'; ctx.lineWidth = 2.5; ctx.stroke();

  // Hood (executioner's hood)
  ctx.fillStyle = hitFlash ? '#fff' : '#1c1917';
  ctx.beginPath(); ctx.arc(0, -r*0.7, r*0.45, 0, Math.PI*2); ctx.fill();
  // Hood drape
  ctx.beginPath();
  ctx.moveTo(-r*0.45, -r*0.7);
  ctx.lineTo(-r*0.55, -r*0.15);
  ctx.lineTo(r*0.55, -r*0.15);
  ctx.lineTo(r*0.45, -r*0.7);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#292524'; ctx.lineWidth = 2; ctx.stroke();

  // Mask (black leather with eye holes)
  ctx.fillStyle = '#0c0a09';
  ctx.beginPath(); ctx.ellipse(0, -r*0.72, r*0.32, r*0.36, 0, 0, Math.PI*2); ctx.fill();
  // Eye holes
  ctx.fillStyle = rage ? '#ef4444' : '#78716c';
  ctx.beginPath(); ctx.ellipse(-r*0.14, -r*0.76, 3.5, 3, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.14, -r*0.76, 3.5, 3, 0, 0, Math.PI*2); ctx.fill();

  // HUGE AXE (right side)
  ctx.save();
  ctx.translate(r*0.85, -r*0.35);
  ctx.rotate(0.3 + Math.sin(t/150) * 0.05);
  // Shaft
  ctx.strokeStyle = '#78350f'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -r*0.3); ctx.lineTo(0, r*0.7); ctx.stroke();
  // Axe head
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(0, -r*0.35);
  ctx.lineTo(-r*0.6, -r*0.6);
  ctx.lineTo(-r*0.7, -r*0.05);
  ctx.lineTo(-r*0.2, r*0.1);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.stroke();
  // Axe glint
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-r*0.1, -r*0.3); ctx.lineTo(-r*0.55, -r*0.5); ctx.stroke();
  ctx.restore();

  // Left fist
  ctx.fillStyle = hitFlash ? '#fff' : '#1c1917';
  ctx.beginPath(); ctx.ellipse(-r*0.82, r*0.05, r*0.28, r*0.32, 0.2, 0, Math.PI*2); ctx.fill();

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// ICE WITCH — Phù thủy băng, tóc trắng, gậy tinh thể
// ──────────────────────────────────────────────────────────────
function drawEnemyIceWitch(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const hover = Math.sin(t / 220) * r * 0.07;
  const crystalPulse = 0.7 + Math.sin(t / 170) * 0.3;

  ctx.save();
  ctx.translate(x, y + hover);

  // Ice robe
  const robeG = ctx.createLinearGradient(0, -r, 0, r);
  robeG.addColorStop(0, hitFlash ? '#fff' : '#bfdbfe');
  robeG.addColorStop(0.5, hitFlash ? '#ddd' : '#60a5fa');
  robeG.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = robeG;
  ctx.beginPath();
  ctx.moveTo(0, -r*0.88);
  ctx.bezierCurveTo(-r*0.85, -r*0.3, -r*0.95, r*0.45, -r*0.75, r*0.95);
  ctx.lineTo(r*0.75, r*0.95);
  ctx.bezierCurveTo(r*0.95, r*0.45, r*0.85, -r*0.3, 0, -r*0.88);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 2; ctx.stroke();

  // Ice crystal decorations on robe
  ctx.fillStyle = 'rgba(147,197,253,0.4)';
  for (let ci = 0; ci < 5; ci++) {
    const cx2 = (ci - 2) * r * 0.3;
    const cy2 = r * (0.1 + ci*0.15);
    ctx.beginPath();
    ctx.moveTo(cx2, cy2 - r*0.12);
    ctx.lineTo(cx2 + r*0.06, cy2);
    ctx.lineTo(cx2, cy2 + r*0.12);
    ctx.lineTo(cx2 - r*0.06, cy2);
    ctx.closePath(); ctx.fill();
  }

  // Head
  ctx.fillStyle = hitFlash ? '#fff' : '#e0f2fe';
  ctx.beginPath(); ctx.arc(0, -r*0.65, r*0.34, 0, Math.PI*2); ctx.fill();

  // White hair (flowing)
  ctx.fillStyle = hitFlash ? '#fff' : '#f8fafc';
  ctx.beginPath();
  ctx.arc(0, -r*0.78, r*0.3, Math.PI, 0);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-r*0.3, -r*0.72); ctx.lineTo(-r*0.48, -r*0.38); ctx.lineTo(-r*0.36, -r*0.72); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(r*0.3, -r*0.72); ctx.lineTo(r*0.48, -r*0.38); ctx.lineTo(r*0.36, -r*0.72); ctx.closePath(); ctx.fill();

  // Ice crown
  ctx.fillStyle = '#93c5fd';
  for (let cri = 0; cri < 5; cri++) {
    const crA = -Math.PI + cri * Math.PI/4;
    const crH = r * (0.12 + (cri%2)*0.08);
    ctx.beginPath();
    ctx.moveTo(Math.cos(crA-0.15)*r*0.32, -r*0.65 + Math.sin(crA-0.15)*r*0.32);
    ctx.lineTo(Math.cos(crA)*r*(0.32+crH/r), -r*0.65 + Math.sin(crA)*r*(0.32+crH/r));
    ctx.lineTo(Math.cos(crA+0.15)*r*0.32, -r*0.65 + Math.sin(crA+0.15)*r*0.32);
    ctx.closePath(); ctx.fill();
  }

  // Ice blue eyes
  ctx.fillStyle = '#7dd3fc';
  ctx.beginPath(); ctx.ellipse(-r*0.14, -r*0.67, 4, 4.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.14, -r*0.67, 4, 4.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#0c4a6e';
  ctx.beginPath(); ctx.ellipse(-r*0.14, -r*0.66, 2, 2.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.14, -r*0.66, 2, 2.5, 0, 0, Math.PI*2); ctx.fill();

  // Ice crystal staff (right)
  ctx.save();
  ctx.translate(r*0.6, -r*0.2 + Math.sin(t/200)*r*0.08);
  ctx.strokeStyle = '#bfdbfe'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, r*0.75); ctx.lineTo(0, -r*0.5); ctx.stroke();
  // Crystal tip
  ctx.fillStyle = `rgba(147,197,253,${crystalPulse})`;
  ctx.beginPath();
  ctx.moveTo(0, -r*0.52);
  ctx.lineTo(-r*0.16, -r*0.28);
  ctx.lineTo(0, -r*0.12);
  ctx.lineTo(r*0.16, -r*0.28);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 1.5; ctx.stroke();
  // Crystal glow
  const cG = ctx.createRadialGradient(0, -r*0.32, 0, 0, -r*0.32, r*0.3);
  cG.addColorStop(0, `rgba(125,211,252,${crystalPulse*0.5})`);
  cG.addColorStop(1, 'transparent');
  ctx.fillStyle = cG;
  ctx.beginPath(); ctx.arc(0, -r*0.32, r*0.3, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// VOID CRAWLER — Sinh vật hư không tím, 6 xúc tu, nhiều mắt
// ──────────────────────────────────────────────────────────────
function drawEnemyVoidCrawler(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const isTitan = e.type === 'titan_minion';
  const bodyCol = hitFlash ? '#fff' : (rage ? '#6d28d9' : (isTitan ? '#4c1d95' : '#312e81'));
  const tentacleWave = Math.sin(t / 130);
  const eyeGlow = 0.7 + Math.sin(t / 150) * 0.3;

  ctx.save();
  ctx.translate(x, y);

  // 6 Tentacles
  ctx.strokeStyle = hitFlash ? '#fff' : '#4c1d95';
  ctx.lineCap = 'round';
  for (let ti = 0; ti < 6; ti++) {
    const tAngle = (ti / 6) * Math.PI * 2 + tentacleWave * 0.2;
    const tLen = r * (1.2 + (ti % 2) * 0.3);
    const tbend = Math.sin(t/120 + ti * 1.2) * r * 0.25;
    ctx.lineWidth = r * 0.12 * (1 - ti * 0.05);
    ctx.beginPath();
    ctx.moveTo(Math.cos(tAngle)*r*0.5, Math.sin(tAngle)*r*0.5);
    ctx.quadraticCurveTo(
      Math.cos(tAngle)*tLen*0.6 + tbend,
      Math.sin(tAngle)*tLen*0.6 + tbend*0.5,
      Math.cos(tAngle)*tLen,
      Math.sin(tAngle)*tLen
    );
    ctx.stroke();

    // Tentacle suction cups
    ctx.fillStyle = '#6d28d9';
    for (let si = 0; si < 3; si++) {
      const sp = (si + 1) / 4;
      const sx = Math.cos(tAngle) * tLen * sp;
      const sy = Math.sin(tAngle) * tLen * sp;
      ctx.beginPath(); ctx.arc(sx, sy, r * 0.04, 0, Math.PI*2); ctx.fill();
    }
  }

  // Core body
  const bodyG = ctx.createRadialGradient(-r*0.2, -r*0.2, r*0.05, 0, 0, r*0.9);
  bodyG.addColorStop(0, hitFlash ? '#fff' : (rage ? '#7c3aed' : '#4c1d95'));
  bodyG.addColorStop(0.6, bodyCol);
  bodyG.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = bodyG;
  ctx.beginPath(); ctx.arc(0, 0, r*0.75, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#4c1d95'; ctx.lineWidth = 3; ctx.stroke();

  // Highlight
  ctx.fillStyle = 'rgba(167,139,250,0.2)';
  ctx.beginPath(); ctx.ellipse(-r*0.28, -r*0.28, r*0.28, r*0.2, -0.5, 0, Math.PI*2); ctx.fill();

  // Multiple eyes (pattern)
  const eyePositions = [[-r*0.28,-r*0.22], [r*0.28,-r*0.22], [0,-r*0.05], [-r*0.14,r*0.22], [r*0.14,r*0.22]];
  eyePositions.forEach(([ex, ey], ei) => {
    const eyeSize = ei === 2 ? 7.5 : 5;
    ctx.fillStyle = `rgba(250,204,21,${eyeGlow})`;
    ctx.beginPath(); ctx.ellipse(ex, ey, eyeSize, eyeSize*0.85, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.beginPath(); ctx.ellipse(ex, ey, eyeSize*0.45, eyeSize*0.6, 0, 0, Math.PI*2); ctx.fill();
  });

  // Void energy pulsing from center
  ctx.strokeStyle = `rgba(139,92,246,${0.3 + eyeGlow*0.2})`;
  ctx.lineWidth = 2;
  for (let vr = 0; vr < 3; vr++) {
    const vrSize = r * (0.82 + vr * 0.18) + Math.sin(t/100 + vr) * r * 0.05;
    ctx.globalAlpha = 0.3 - vr * 0.08;
    ctx.beginPath(); ctx.arc(0, 0, vrSize, 0, Math.PI*2); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

// ════════════════════════════════════════════════════════════════
// ── HÀM VẼ BOSS ĐỘC LẬP ──────────────────────────────────────
// ════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────
// BOSS: SLIME KING — Slime khổng lồ xanh, vương miện, rung bần bật
// ──────────────────────────────────────────────────────────────
function drawBossSlimeKing(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const bob = Math.sin(t / 150);
  const jelly = 1 + bob * 0.08;
  const jellyY = 1 - bob * 0.06;
  const slimeRun = Math.sin(t / 200) * r * 0.04;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(jelly, jellyY);

  // Boss fire ring
  drawBossFireRing(ctx, r, t, 8);

  // Dripping slime at bottom
  ctx.fillStyle = 'rgba(74,222,128,0.4)';
  for (let di = 0; di < 5; di++) {
    const dx = (di - 2) * r * 0.4;
    const dLen = r * (0.15 + Math.sin(t/200 + di) * 0.1);
    ctx.beginPath(); ctx.ellipse(dx, r*0.92 + dLen, r*0.08, dLen, 0, 0, Math.PI*2); ctx.fill();
  }

  // Main body
  const g = ctx.createRadialGradient(-r*0.3, -r*0.3, r*0.05, 0, 0, r*1.05);
  g.addColorStop(0, hitFlash ? '#fff' : '#bbf7d0');
  g.addColorStop(0.4, hitFlash ? '#fff' : (rage ? '#22c55e' : '#4ade80'));
  g.addColorStop(0.85, '#14532d');
  g.addColorStop(1, '#052e16');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, 0, r*0.96, r*0.88, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = rage ? '#ef4444' : '#15803d';
  ctx.lineWidth = 4; ctx.stroke();

  // Slime bubbles
  ctx.fillStyle = 'rgba(187,247,208,0.25)';
  ctx.beginPath(); ctx.arc(-r*0.38, -r*0.28, r*0.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(r*0.28, -r*0.15, r*0.14, 0, Math.PI*2); ctx.fill();

  // Eyes (large angry)
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(-r*0.32, -r*0.1, r*0.2, r*0.22, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.32, -r*0.1, r*0.2, r*0.22, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = rage ? '#ef4444' : '#1a2e05';
  ctx.beginPath(); ctx.ellipse(-r*0.3, -r*0.08, r*0.1, r*0.14, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.34, -r*0.08, r*0.1, r*0.14, 0, 0, Math.PI*2); ctx.fill();
  // Angry brows
  ctx.strokeStyle = '#166534'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-r*0.52, -r*0.3); ctx.lineTo(-r*0.15, -r*0.22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(r*0.52, -r*0.3); ctx.lineTo(r*0.15, -r*0.22); ctx.stroke();

  // Wide grin
  ctx.strokeStyle = '#166534'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, r*0.2, r*0.45, 0.15, Math.PI-0.15); ctx.stroke();
  // Teeth
  ctx.fillStyle = '#f0fdf4';
  for (let ti = 0; ti < 6; ti++) {
    const ta = 0.4 + ti * (Math.PI - 0.8) / 5;
    ctx.beginPath();
    ctx.arc(Math.cos(ta)*r*0.45, r*0.2 + Math.sin(ta)*r*0.45, 6, 0, Math.PI*2); ctx.fill();
  }

  // CROWN (royal gold)
  ctx.fillStyle = '#fbbf24';
  const crownY = -r * 1.0;
  ctx.beginPath();
  ctx.moveTo(-r*0.55, crownY + r*0.12);
  ctx.lineTo(-r*0.55, crownY - r*0.08);
  ctx.lineTo(-r*0.35, crownY + r*0.08);
  ctx.lineTo(-r*0.18, crownY - r*0.18);
  ctx.lineTo(0, crownY + r*0.04);
  ctx.lineTo(r*0.18, crownY - r*0.18);
  ctx.lineTo(r*0.35, crownY + r*0.08);
  ctx.lineTo(r*0.55, crownY - r*0.08);
  ctx.lineTo(r*0.55, crownY + r*0.12);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2.5; ctx.stroke();
  // Crown jewels
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(0, crownY - r*0.16, 6, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath(); ctx.arc(-r*0.38, crownY + r*0.06, 4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(r*0.38, crownY + r*0.06, 4, 0, Math.PI*2); ctx.fill();

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// BOSS: DARK LORD — Lãnh chúa áo giáp đen hào quang
// ──────────────────────────────────────────────────────────────
function drawBossDarkLord(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const hover = Math.sin(t / 240) * r * 0.06;
  const auraRot = t / 500;
  const orbPulse = 0.7 + Math.sin(t / 180) * 0.3;

  ctx.save();
  ctx.translate(x, y + hover);

  // Boss fire ring (dark purple version)
  drawBossFireRing(ctx, r, t, 9);

  // Outer aura (rotating dark energy)
  for (let ai = 0; ai < 8; ai++) {
    const aa = auraRot + (ai / 8) * Math.PI * 2;
    ctx.fillStyle = `rgba(124,58,237,${0.15 + Math.sin(aa*3)*0.1})`;
    ctx.beginPath();
    ctx.ellipse(Math.cos(aa)*r*1.08, Math.sin(aa)*r*1.08, r*0.18, r*0.35, aa, 0, Math.PI*2);
    ctx.fill();
  }

  // Armor body (massive, dark)
  const armorG = ctx.createRadialGradient(-r*0.3, -r*0.3, r*0.05, 0, 0, r*1.05);
  armorG.addColorStop(0, hitFlash ? '#fff' : (rage ? '#4c1d95' : '#1e1b4b'));
  armorG.addColorStop(0.6, hitFlash ? '#ddd' : '#0f172a');
  armorG.addColorStop(1, '#020617');
  ctx.fillStyle = armorG;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 4; ctx.stroke();

  // Armor plates (vertical lines)
  ctx.strokeStyle = 'rgba(99,102,241,0.4)'; ctx.lineWidth = 2;
  for (let pi = -2; pi <= 2; pi++) {
    const px = pi * r * 0.3;
    ctx.beginPath(); ctx.moveTo(px, -r*0.85); ctx.lineTo(px, r*0.85); ctx.stroke();
  }

  // Shoulder spikes
  ctx.fillStyle = '#6d28d9';
  for (let si = 0; si < 4; si++) {
    const sa = -Math.PI * 0.75 + si * Math.PI * 0.5;
    const sr = r * (si % 2 === 0 ? 0.95 : 1.05);
    ctx.beginPath();
    ctx.moveTo(Math.cos(sa)*r*0.82, Math.sin(sa)*r*0.82);
    ctx.lineTo(Math.cos(sa)*sr, Math.sin(sa)*sr + (si < 2 ? -r*0.12 : r*0.12));
    ctx.lineTo(Math.cos(sa+0.3)*r*0.78, Math.sin(sa+0.3)*r*0.78);
    ctx.closePath(); ctx.fill();
  }

  // Helmet/face (dark visor)
  ctx.fillStyle = hitFlash ? '#fff' : '#0f172a';
  ctx.beginPath(); ctx.arc(0, -r*0.42, r*0.42, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#4c1d95'; ctx.lineWidth = 3; ctx.stroke();

  // Visor slit (glowing purple)
  const visorG = ctx.createLinearGradient(-r*0.35, -r*0.42, r*0.35, -r*0.42);
  visorG.addColorStop(0, 'transparent');
  visorG.addColorStop(0.3, `rgba(168,85,247,${orbPulse})`);
  visorG.addColorStop(0.7, `rgba(168,85,247,${orbPulse})`);
  visorG.addColorStop(1, 'transparent');
  ctx.fillStyle = visorG;
  ctx.fillRect(-r*0.35, -r*0.47, r*0.7, r*0.1);

  // Shadow Barrage orbs (orbiting when skill active)
  if (e._barrageTimer > (e.phase >= 3 ? 4.5 : e.phase >= 2 ? 6.5 : 9.5)) {
    for (let bi = 0; bi < 8; bi++) {
      const ba = (bi / 8) * Math.PI * 2 + auraRot * 3;
      ctx.fillStyle = `rgba(129,140,248,${0.6 + Math.sin(ba*2)*0.3})`;
      ctx.beginPath(); ctx.arc(Math.cos(ba)*r*1.35, Math.sin(ba)*r*1.35, r*0.1, 0, Math.PI*2); ctx.fill();
    }
  }

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// BOSS: DRAGON QUEEN — Rồng cái lớn, cánh rộng, vương miện ngọc
// ──────────────────────────────────────────────────────────────
function drawBossDragonQueen(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const wingFlap = Math.sin(t / 155);
  const headBob = Math.sin(t / 210) * r * 0.04;

  ctx.save();
  ctx.translate(x, y);

  // Boss ring
  drawBossFireRing(ctx, r, t, 9);

  // MASSIVE WINGS (dragon queen has wide wings)
  const wingCol = hitFlash ? '#fff' : (rage ? '#dc2626' : '#c2410c');
  for (let side = -1; side <= 1; side += 2) {
    ctx.fillStyle = wingCol;
    ctx.beginPath();
    ctx.moveTo(side*r*0.35, -r*0.4);
    ctx.bezierCurveTo(side*r*1.5, -r*0.8 + wingFlap*r*0.5, side*r*2.0, r*0.2, side*r*1.4, r*0.5);
    ctx.lineTo(side*r*0.4, r*0.1);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 2; ctx.stroke();
    // Wing ribs
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2;
    for (let wr = 0; wr < 4; wr++) {
      const wrProgress = (wr + 1) / 5;
      const wrAngle = -0.4 + side * 0.2 + wr * 0.15;
      ctx.beginPath();
      ctx.moveTo(side*r*0.35, -r*0.2);
      ctx.lineTo(side*r*(0.8 + wr*0.35), r*0.0 + r*0.12*wr + wingFlap*r*0.12*wrProgress);
      ctx.stroke();
    }
    // Wing membrane membrane detail
    ctx.fillStyle = 'rgba(180,50,10,0.15)';
    ctx.beginPath();
    ctx.moveTo(side*r*0.4, r*0.0);
    ctx.lineTo(side*r*1.35, r*0.42);
    ctx.lineTo(side*r*0.4, r*0.1);
    ctx.closePath(); ctx.fill();
  }

  // Dragon body (large oval)
  const bodyG = ctx.createRadialGradient(-r*0.3, -r*0.3, r*0.1, 0, 0, r);
  bodyG.addColorStop(0, hitFlash ? '#fff' : '#f97316');
  bodyG.addColorStop(0.55, hitFlash ? '#eee' : '#c2410c');
  bodyG.addColorStop(1, '#7c2d12');
  ctx.fillStyle = bodyG;
  ctx.beginPath(); ctx.arc(0, 0, r*0.85, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#431407'; ctx.lineWidth = 4; ctx.stroke();

  // Scale pattern
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5;
  for (let row = 0; row < 4; row++) {
    for (let col = -2; col <= 2; col++) {
      const sx = col * r*0.28 + (row%2)*r*0.14;
      const sy = -r*0.3 + row * r*0.2;
      ctx.beginPath(); ctx.arc(sx, sy, r*0.12, Math.PI, 0); ctx.stroke();
    }
  }

  // Belly (lighter)
  ctx.fillStyle = 'rgba(254,215,170,0.3)';
  ctx.beginPath(); ctx.ellipse(0, r*0.18, r*0.48, r*0.38, 0, 0, Math.PI*2); ctx.fill();

  // Long neck + head
  ctx.fillStyle = hitFlash ? '#fff' : '#ea580c';
  ctx.beginPath(); ctx.ellipse(0, -r*0.95 + headBob, r*0.32, r*0.42, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 2; ctx.stroke();

  // Snout
  ctx.fillStyle = hitFlash ? '#fff' : '#c2410c';
  ctx.beginPath(); ctx.ellipse(0, -r*1.26 + headBob, r*0.22, r*0.18, 0, 0, Math.PI*2); ctx.fill();
  // Nostril slits
  ctx.fillStyle = '#7c2d12';
  ctx.beginPath(); ctx.ellipse(-r*0.08, -r*1.3 + headBob, 2.5, 2, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.08, -r*1.3 + headBob, 2.5, 2, 0, 0, Math.PI*2); ctx.fill();

  // DRAGON QUEEN CROWN (gem-encrusted)
  ctx.fillStyle = '#fbbf24';
  const crY = -r*1.38 + headBob;
  for (let cpi = 0; cpi < 5; cpi++) {
    const cpa = -Math.PI*0.5 - 0.5 + cpi * 0.25;
    const cpH = r * (0.1 + (cpi%2)*0.06);
    ctx.beginPath();
    ctx.moveTo(Math.cos(cpa - 0.12)*r*0.22, crY + Math.sin(cpa-0.12)*r*0.22);
    ctx.lineTo(Math.cos(cpa)*r*(0.22+cpH/r), crY + Math.sin(cpa)*r*(0.22+cpH/r));
    ctx.lineTo(Math.cos(cpa+0.12)*r*0.22, crY + Math.sin(cpa+0.12)*r*0.22);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath(); ctx.arc(0, crY - r*0.22, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#f472b6';
  ctx.beginPath(); ctx.arc(-r*0.12, crY - r*0.16, 3.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(r*0.12, crY - r*0.16, 3.5, 0, Math.PI*2); ctx.fill();

  // Eyes (golden)
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath(); ctx.ellipse(-r*0.1, -r*1.0 + headBob, 5, 5.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.1, -r*1.0 + headBob, 5, 5.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#1c1917';
  ctx.beginPath(); ctx.ellipse(-r*0.1, -r*1.0 + headBob, 2.5, 3.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.1, -r*1.0 + headBob, 2.5, 3.5, 0, 0, Math.PI*2); ctx.fill();

  // Tail
  ctx.strokeStyle = hitFlash ? '#fff' : '#ea580c';
  ctx.lineWidth = r*0.16; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(r*0.8, r*0.1);
  ctx.bezierCurveTo(r*1.4, r*0.4, r*1.55, -r*0.2, r*1.2, -r*0.55);
  ctx.stroke();

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// BOSS: VOID TITAN — Titan khổng lồ tím, nhiều mắt, cánh tay dài
// ──────────────────────────────────────────────────────────────
function drawBossVoidTitan(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const pulse = Math.sin(t / 200);
  const armSway = Math.sin(t / 250) * 0.12;
  const eyeGlow = 0.6 + Math.sin(t / 140) * 0.4;
  const singActive = e._singActive;

  ctx.save();
  ctx.translate(x, y);

  // Boss ring + omega
  drawBossFireRing(ctx, r, t, 10);

  // Singularity rings (when active)
  if (singActive) {
    for (let sr = 0; sr < 4; sr++) {
      const srSize = r * (1.2 + sr * 0.45) + pulse * r * 0.1;
      ctx.strokeStyle = `rgba(139,92,246,${0.5 - sr * 0.1})`;
      ctx.lineWidth = 3 - sr * 0.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.arc(0, 0, srSize, 0, Math.PI*2); ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Massive arms (elongated, multi-jointed)
  ctx.strokeStyle = hitFlash ? '#fff' : '#4c1d95';
  ctx.lineCap = 'round';
  for (let side = -1; side <= 1; side += 2) {
    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    ctx.moveTo(side * r * 0.62, -r * 0.15);
    ctx.lineTo(side * r * 1.18, r * 0.28 + armSway * side * r * 0.3);
    ctx.stroke();
    // Forearm
    ctx.lineWidth = r * 0.16;
    ctx.beginPath();
    ctx.moveTo(side * r * 1.18, r * 0.28 + armSway * side * r * 0.3);
    ctx.lineTo(side * r * 1.7, -r * 0.15 + armSway * side * r * 0.5);
    ctx.stroke();
    // Clawed hand
    ctx.fillStyle = hitFlash ? '#fff' : '#6d28d9';
    ctx.beginPath(); ctx.ellipse(side*r*1.72, -r*0.12 + armSway*side*r*0.5, r*0.18, r*0.22, armSway*side, 0, Math.PI*2); ctx.fill();
    // Claws
    for (let ci = 0; ci < 3; ci++) {
      const ca = (ci - 1) * 0.4 + armSway * side * 0.2;
      ctx.fillStyle = hitFlash ? '#fff' : '#4c1d95';
      ctx.beginPath();
      ctx.moveTo(side*r*1.72 + Math.cos(ca)*r*0.12, -r*0.12 + armSway*side*r*0.5 + Math.sin(ca)*r*0.12);
      ctx.lineTo(side*r*1.72 + Math.cos(ca)*r*0.35, -r*0.12 + armSway*side*r*0.5 + Math.sin(ca)*r*0.35);
      ctx.lineTo(side*r*1.72 + Math.cos(ca+0.15)*r*0.28, -r*0.12 + armSway*side*r*0.5 + Math.sin(ca+0.15)*r*0.28);
      ctx.closePath(); ctx.fill();
    }
  }

  // Main body (huge, angular)
  const bodyG = ctx.createRadialGradient(-r*0.25, -r*0.25, r*0.08, 0, 0, r*1.0);
  bodyG.addColorStop(0, hitFlash ? '#fff' : (rage ? '#6d28d9' : '#4c1d95'));
  bodyG.addColorStop(0.55, hitFlash ? '#ddd' : '#2d1b69');
  bodyG.addColorStop(1, '#0f0720');
  ctx.fillStyle = bodyG;
  ctx.beginPath(); ctx.arc(0, 0, r*0.9, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 5; ctx.stroke();

  // Body void cracks (energy lines)
  ctx.strokeStyle = `rgba(167,139,250,${0.3 + pulse * 0.2})`;
  ctx.lineWidth = 2.5;
  const cracks = [[-r*0.4,-r*0.3,r*0.1,r*0.4],[-r*0.1,-r*0.6,r*0.3,r*0.1],[r*0.2,-r*0.4,r*0.5,r*0.35]];
  cracks.forEach(([x1,y1,x2,y2]) => {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });

  // Multiple eyes (scattered across body)
  const voidEyes = [[-r*0.3,-r*0.4],[r*0.35,-r*0.35],[0,-r*0.12],[-r*0.45,r*0.2],[r*0.38,r*0.22],[0,r*0.48]];
  voidEyes.forEach(([ex, ey], ei) => {
    const eSize = ei === 2 ? 9 : 6.5;
    ctx.fillStyle = `rgba(250,204,21,${eyeGlow})`;
    ctx.beginPath(); ctx.ellipse(ex, ey, eSize, eSize*0.82, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1c1917';
    ctx.beginPath(); ctx.ellipse(ex, ey, eSize*0.45, eSize*0.6, 0, 0, Math.PI*2); ctx.fill();
    // Eye glow halo
    ctx.strokeStyle = `rgba(250,204,21,${eyeGlow*0.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ex, ey, eSize*1.6, 0, Math.PI*2); ctx.stroke();
  });

  // Horns
  ctx.fillStyle = hitFlash ? '#fff' : '#6d28d9';
  ctx.beginPath(); ctx.moveTo(-r*0.32,-r*0.88); ctx.lineTo(-r*0.42,-r*1.22); ctx.lineTo(-r*0.15,-r*0.88); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(r*0.32,-r*0.88); ctx.lineTo(r*0.42,-r*1.22); ctx.lineTo(r*0.15,-r*0.88); ctx.closePath(); ctx.fill();

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// BOSS: DEATH HERALD — Tử thần nhỏ cưỡi ngựa khói
// ──────────────────────────────────────────────────────────────
function drawBossDeathHerald(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const bob = Math.sin(t / 200) * r * 0.05;
  const horseRun = Math.sin(t / 130);
  const cloakWave = Math.sin(t / 170);

  ctx.save();
  ctx.translate(x, y + bob);

  // Boss fire ring
  drawBossFireRing(ctx, r, t, 9);

  // Ghost horse (below, wisps of smoke)
  ctx.fillStyle = 'rgba(100,116,139,0.35)';
  ctx.beginPath(); ctx.ellipse(0, r*0.55, r*0.72, r*0.38, 0, 0, Math.PI*2); ctx.fill();
  // Horse legs (wisps)
  for (let li = 0; li < 4; li++) {
    const lx = -r*0.55 + li * r*0.35;
    const lBob = Math.sin(t/130 + li * 0.9) * r * 0.1;
    ctx.strokeStyle = 'rgba(100,116,139,0.4)'; ctx.lineWidth = r*0.08;
    ctx.beginPath(); ctx.moveTo(lx, r*0.72); ctx.lineTo(lx, r*0.95 + lBob); ctx.stroke();
  }
  // Horse head
  ctx.fillStyle = 'rgba(71,85,105,0.5)';
  ctx.beginPath(); ctx.ellipse(-r*0.7, r*0.35, r*0.22, r*0.18, -0.4, 0, Math.PI*2); ctx.fill();
  // Horse mane (wisps)
  ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.lineWidth = 3;
  for (let mi = 0; mi < 3; mi++) {
    ctx.beginPath();
    ctx.moveTo(-r*0.65 - mi*r*0.05, r*0.24);
    ctx.lineTo(-r*0.68 + mi*r*0.08 + cloakWave*r*0.05, r*0.05);
    ctx.stroke();
  }

  // Dark cloak / rider body
  ctx.fillStyle = hitFlash ? '#fff' : (rage ? '#1e1b4b' : '#0f172a');
  ctx.beginPath();
  ctx.moveTo(0, -r*0.85);
  ctx.bezierCurveTo(-r*0.9, -r*0.28, -r*1.0, r*0.35, -r*0.62, r*0.48);
  ctx.lineTo(r*0.62, r*0.48);
  ctx.bezierCurveTo(r*1.0, r*0.35, r*0.9, -r*0.28, 0, -r*0.85);
  ctx.closePath(); ctx.fill();
  // Cloak detail (hood)
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-r*0.05, -r*0.82); ctx.lineTo(-r*0.04, r*0.48); ctx.stroke();

  // Skull face
  ctx.fillStyle = hitFlash ? '#fff' : '#e2e8f0';
  ctx.beginPath(); ctx.arc(0, -r*0.52, r*0.28, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath(); ctx.ellipse(-r*0.12, -r*0.55, 5, 6, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.12, -r*0.55, 5, 6, 0, 0, Math.PI*2); ctx.fill();
  // Glowing eyes
  ctx.fillStyle = `rgba(148,163,184,${0.7 + Math.sin(t/150)*0.3})`;
  ctx.beginPath(); ctx.ellipse(-r*0.12, -r*0.55, 2.5, 3, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.12, -r*0.55, 2.5, 3, 0, 0, Math.PI*2); ctx.fill();

  // Scythe
  ctx.save();
  ctx.translate(r*0.65, -r*0.38 + Math.sin(t/180)*r*0.06);
  ctx.rotate(0.4);
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, r*0.38); ctx.lineTo(0, -r*0.32); ctx.stroke();
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(0, -r*0.3);
  ctx.bezierCurveTo(r*0.32, -r*0.55, r*0.55, -r*0.38, r*0.48, -r*0.14);
  ctx.lineTo(r*0.22, -r*0.12);
  ctx.bezierCurveTo(r*0.3, -r*0.28, r*0.15, -r*0.42, 0, -r*0.28);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// BOSS: REAPER FORM 1 — Tử thần đang thức dậy, bán thân
// ──────────────────────────────────────────────────────────────
function drawBossReaperForm1(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const rise = Math.sin(t / 280) * r * 0.06; // đang trồi lên
  const scytheSwing = Math.sin(t / 180) * 0.25;
  const auraAlpha = 0.5 + Math.sin(t / 120) * 0.3;
  const scytheWarning = e._scytheWarning;

  ctx.save();
  ctx.translate(x, y + rise);

  // Boss fire ring (red)
  drawBossFireRing(ctx, r, t, 9);

  // Ground smoke (emanating from below)
  for (let si = 0; si < 5; si++) {
    const sAngle = (si / 5) * Math.PI + t / 400;
    ctx.fillStyle = `rgba(15,23,42,${0.35 - si * 0.05})`;
    ctx.beginPath();
    ctx.ellipse(Math.cos(sAngle)*r*0.55, r*0.8, r*(0.22 - si*0.03), r*0.14, 0, 0, Math.PI*2);
    ctx.fill();
  }

  // Dark robe body (immense)
  const robeG = ctx.createRadialGradient(0, 0, r*0.1, 0, 0, r*1.05);
  robeG.addColorStop(0, hitFlash ? '#fff' : (rage ? '#450a0a' : '#1e1b4b'));
  robeG.addColorStop(0.7, hitFlash ? '#ddd' : '#0f172a');
  robeG.addColorStop(1, '#020617');
  ctx.fillStyle = robeG;
  ctx.beginPath(); ctx.arc(0, 0, r*0.95, 0, Math.PI*2); ctx.fill();

  // Energy tears (red cracks on robe - form breaking open)
  ctx.strokeStyle = `rgba(220,38,38,${auraAlpha})`;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-r*0.3, -r*0.5); ctx.lineTo(-r*0.1, r*0.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(r*0.2, -r*0.6); ctx.lineTo(r*0.4, r*0.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r*0.5, r*0.1); ctx.lineTo(r*0.2, r*0.5); ctx.stroke();

  // Skull (large, cracked)
  ctx.fillStyle = hitFlash ? '#fff' : '#d4d4d4';
  ctx.beginPath(); ctx.arc(0, -r*0.42, r*0.42, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 2.5; ctx.stroke();
  // Skull crack
  ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(r*0.05, -r*0.82); ctx.lineTo(-r*0.05, -r*0.42); ctx.lineTo(r*0.08, -r*0.2); ctx.stroke();

  // Eye sockets — glowing red (awakening)
  ctx.fillStyle = `rgba(239,68,68,${auraAlpha})`;
  ctx.beginPath(); ctx.ellipse(-r*0.18, -r*0.46, 8, 9, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.18, -r*0.46, 8, 9, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(-r*0.18, -r*0.47, 4, 5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.18, -r*0.47, 4, 5, 0, 0, Math.PI*2); ctx.fill();

  // SCYTHE (massive, death scythe — one hand)
  ctx.save();
  ctx.translate(r*0.7, -r*0.25);
  ctx.rotate(scytheSwing + (scytheWarning ? Math.sin(t/40)*0.2 : 0));
  // Handle
  ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(0, r*0.55); ctx.lineTo(0, -r*0.55); ctx.stroke();
  // Blade (curved)
  ctx.fillStyle = hitFlash ? '#fff' : '#475569';
  ctx.beginPath();
  ctx.moveTo(0, -r*0.55);
  ctx.bezierCurveTo(-r*0.5, -r*0.85, -r*0.95, -r*0.55, -r*0.88, -r*0.15);
  ctx.lineTo(-r*0.55, -r*0.14);
  ctx.bezierCurveTo(-r*0.65, -r*0.45, -r*0.32, -r*0.68, 0, -r*0.5);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.stroke();
  // Blade edge (sharp)
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -r*0.55);
  ctx.bezierCurveTo(-r*0.45, -r*0.8, -r*0.88, -r*0.48, -r*0.88, -r*0.15);
  ctx.stroke();
  // Warning glow on blade
  if (scytheWarning) {
    ctx.strokeStyle = `rgba(220,38,38,${0.6+Math.sin(t/50)*0.4})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -r*0.55);
    ctx.bezierCurveTo(-r*0.45, -r*0.8, -r*0.88, -r*0.48, -r*0.88, -r*0.15);
    ctx.stroke();
  }
  ctx.restore();

  // Dark aura rings
  for (let ar = 0; ar < 3; ar++) {
    ctx.strokeStyle = `rgba(220,38,38,${(0.25-ar*0.07)*auraAlpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, r*(1.08 + ar*0.22), 0, Math.PI*2); ctx.stroke();
  }

  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// BOSS: DEATH REAPER (Red Death) — Tử thần tối thượng
// 4 phases, phase-based anim, lưỡi hái plasma, floating
// ──────────────────────────────────────────────────────────────
function drawBossDeathReaper(ctx, e, t, hitFlash, rage) {
  const x = e.x, y = e.y, r = e.r;
  const hpPct = e.hp / e.maxHp;
  const phase = hpPct > 0.70 ? 1 : hpPct > 0.45 ? 2 : hpPct > 0.20 ? 3 : 4;
  const float = Math.sin(t / 200) * r * 0.08; // floating animation
  const cloakSway = Math.sin(t / 280) * 0.06;
  const scytheRot = t / 600; // slowly rotating scythe
  const auraAlpha = 0.5 + Math.sin(t / 100) * 0.35;
  const isClone = e._isDeathClone;

  ctx.save();
  ctx.translate(x, y + float);
  ctx.rotate(cloakSway);

  // OMEGA RING (Lv10 boss)
  if (!isClone) drawOmegaRing(ctx, r, t);

  // Phase-based outer aura
  const auraColors = ['#7c3aed', '#7c3aed', '#dc2626', '#ef4444'];
  const auraCol = auraColors[phase - 1];
  for (let ai = 0; ai < 4; ai++) {
    const aSize = r * (1.15 + ai * 0.28) + Math.sin(t / 80 + ai) * r * 0.05;
    ctx.strokeStyle = `rgba(${phase >= 3 ? '220,38,38' : '124,58,237'},${(0.35 - ai * 0.07) * auraAlpha})`;
    ctx.lineWidth = 3.5 - ai * 0.5;
    ctx.beginPath(); ctx.arc(0, 0, aSize, 0, Math.PI*2); ctx.stroke();
  }

  // SHADOW CLOAK (immense, billowing)
  const cloakG = ctx.createRadialGradient(0, 0, r*0.15, 0, 0, r*1.1);
  cloakG.addColorStop(0, hitFlash ? '#fff' : (phase >= 4 ? '#1c0000' : '#020617'));
  cloakG.addColorStop(0.6, hitFlash ? '#aaa' : '#0a0014');
  cloakG.addColorStop(1, 'rgba(0,0,10,0)');
  ctx.fillStyle = cloakG;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2); ctx.fill();

  // Phase 2+: Dark wings
  if (phase >= 2 && !isClone) {
    const wingFlap = Math.sin(t / 180);
    ctx.fillStyle = hitFlash ? '#fff' : (phase >= 3 ? '#450a0a' : '#0f0720');
    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      ctx.moveTo(side*r*0.3, -r*0.3);
      ctx.bezierCurveTo(side*r*1.3, -r*0.5 + wingFlap*r*0.3, side*r*1.7, r*0.2, side*r*1.1, r*0.5);
      ctx.lineTo(side*r*0.35, r*0.1);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = auraCol + '88'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(side*r*0.3, -r*0.3);
      ctx.bezierCurveTo(side*r*1.3, -r*0.5 + wingFlap*r*0.3, side*r*1.7, r*0.2, side*r*1.1, r*0.5);
      ctx.stroke();
    }
  }

  // Skull face (massive, phase-colored eyes)
  ctx.fillStyle = hitFlash ? '#fff' : (isClone ? '#3a1a1a' : '#d4d4d4');
  ctx.beginPath(); ctx.arc(0, -r*0.28, r*0.45, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = phase >= 3 ? '#dc2626' : '#6d28d9'; ctx.lineWidth = 3; ctx.stroke();

  // Eye sockets — GLOWING
  const eyeCol = phase >= 3 ? '#ef4444' : '#a855f7';
  ctx.fillStyle = eyeCol;
  ctx.beginPath(); ctx.ellipse(-r*0.2, -r*0.32, 9, 11, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.2, -r*0.32, 9, 11, 0, 0, Math.PI*2); ctx.fill();
  // Inner glow
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(-r*0.2, -r*0.33, 4.5, 6, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r*0.2, -r*0.33, 4.5, 6, 0, 0, Math.PI*2); ctx.fill();
  // Eye halo glow
  ctx.strokeStyle = eyeCol; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(-r*0.2, -r*0.32, r*0.22, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(r*0.2, -r*0.32, r*0.22, 0, Math.PI*2); ctx.stroke();

  // Skull crack (phase 3+)
  if (phase >= 3) {
    ctx.strokeStyle = `rgba(220,38,38,${auraAlpha})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-r*0.08, -r*0.7); ctx.lineTo(r*0.05, -r*0.28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r*0.05, -r*0.28); ctx.lineTo(r*0.18, -r*0.15); ctx.stroke();
  }

  // Jaw (opening/closing slowly)
  const jawOpen = r*0.12 + Math.sin(t/220) * r*0.04;
  ctx.fillStyle = hitFlash ? '#fff' : '#b0b0b0';
  ctx.beginPath(); ctx.arc(0, -r*0.08, r*0.28, 0, Math.PI); ctx.fill();
  ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 1.5; ctx.stroke();
  // Teeth
  ctx.fillStyle = hitFlash ? '#ddd' : '#e2e8f0';
  for (let ti = 0; ti < 7; ti++) {
    const ta = (ti / 6) * Math.PI;
    ctx.fillRect(Math.cos(ta)*r*0.26 - 3, -r*0.08 - 2, 6, jawOpen * 0.6);
  }

  // PLASMA SCYTHE (rotating, phase-colored blade)
  if (!isClone) {
    ctx.save();
    ctx.translate(r*0.82, -r*0.1);
    ctx.rotate(scytheRot + Math.sin(t/200)*0.1);

    // Handle
    ctx.strokeStyle = '#1c1917'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(0, r*0.65); ctx.lineTo(0, -r*0.62); ctx.stroke();

    // Plasma blade glow
    const bladeGCol = phase >= 3 ? '#ef4444' : '#a855f7';
    ctx.shadowBlur = 18; ctx.shadowColor = bladeGCol;
    ctx.fillStyle = bladeGCol;
    ctx.beginPath();
    ctx.moveTo(0, -r*0.62);
    ctx.bezierCurveTo(-r*0.6, -r*1.0, -r*1.1, -r*0.68, -r*1.02, -r*0.2);
    ctx.lineTo(-r*0.6, -r*0.18);
    ctx.bezierCurveTo(-r*0.7, -r*0.55, -r*0.38, -r*0.82, 0, -r*0.58);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;

    // Blade edge (bright)
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -r*0.62);
    ctx.bezierCurveTo(-r*0.58, -r*0.98, -r*1.05, -r*0.65, -r*1.02, -r*0.2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Plasma energy particles on blade
    for (let pi = 0; pi < 5; pi++) {
      const pa = -Math.PI*0.3 - pi * 0.25;
      const pr = r * (0.35 + pi * 0.15);
      ctx.fillStyle = phase >= 3 ? `rgba(239,68,68,${0.8-pi*0.1})` : `rgba(168,85,247,${0.8-pi*0.1})`;
      ctx.beginPath(); ctx.arc(Math.cos(pa)*pr, Math.sin(pa)*pr - r*0.4, r*(0.07-pi*0.01), 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();
  }

  // Phase 4: Fire particles emanating from body
  if (phase >= 4 && !isClone) {
    ctx.globalAlpha = 0.6;
    for (let fi = 0; fi < 8; fi++) {
      const fa = (fi/8) * Math.PI * 2 + t/400;
      const fr = r*(1.0 + Math.sin(t/100+fi)*0.12);
      ctx.fillStyle = fi%2 === 0 ? '#ef4444' : '#f97316';
      ctx.beginPath();
      ctx.ellipse(Math.cos(fa)*fr, Math.sin(fa)*fr, r*0.07, r*0.16, fa, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Clone visual (slightly transparent + blue tint)
  if (isClone) {
    ctx.strokeStyle = `rgba(99,102,241,${0.3 + Math.sin(t/150)*0.2})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.arc(0, 0, r*1.05, 0, Math.PI*2); ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}


// ----------------------------------------------------------------
// -- HELPER FUNCTIONS CHO BOSS RENDER -------------------------
// ----------------------------------------------------------------

// V? v�ng l?a xung quanh boss (level-scaled)
function drawBossFireRing(ctx, r, t, bossLevel) {
  const ringCount = Math.min(bossLevel, 12);
  const ringRot = t / 400;
  ctx.save();
  for (let ri = 0; ri < ringCount; ri++) {
    const angle = (ri / ringCount) * Math.PI * 2 + ringRot;
    const fr = r * 1.25 + Math.sin(t / 100 + ri) * r * 0.08;
    const alpha = 0.4 + Math.sin(t / 80 + ri * 0.8) * 0.3;
    const col = bossLevel >= 9 ? [168,85,247] : [239,68,68];
    ctx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + alpha + ')';
    ctx.beginPath();
    ctx.ellipse(Math.cos(angle) * fr, Math.sin(angle) * fr, r * 0.06, r * 0.14, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// V? v�ng Omega cho boss c?p cao nh?t (Level 10 / Red Death)
function drawOmegaRing(ctx, r, t) {
  const segments = 12;
  const ringRot = t / 700;
  ctx.save();
  for (let si = 0; si < segments; si++) {
    const angle = (si / segments) * Math.PI * 2 + ringRot;
    const nextAngle = ((si + 0.65) / segments) * Math.PI * 2 + ringRot;
    const ringR = r * 1.55 + Math.sin(t / 120 + si) * r * 0.04;
    ctx.strokeStyle = 'rgba(239,68,68,' + (0.4 + Math.sin(t/100+si)*0.25) + ')';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, ringR, angle, nextAngle);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(168,85,247,' + (0.25 + Math.sin(t/150)*0.15) + ')';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}


/* ═══════════════════════════════════════════════════════════════
   FLIPFIGHT AUDIO INTEGRATION v2 — Complete & Bug-Fixed
   Hooks into ALL major game events
═══════════════════════════════════════════════════════════════ */

// ── AUDIO WIDGET CONTROLLER ────────────────────────────────────
let _audioPanelOpen = false;

function audioWidgetToggle() {
  _audioPanelOpen = !_audioPanelOpen;
  const panel = document.getElementById('audioPanel');
  const btn = document.getElementById('audioToggleBtn');
  if (panel) {
    if (_audioPanelOpen) {
      panel.classList.add('open');
      panel.style.display = 'flex';
    } else {
      panel.classList.remove('open');
      panel.style.display = 'none';
    }
  }
  if (btn) btn.classList.toggle('active', _audioPanelOpen);
  if (typeof FlipAudio !== 'undefined') {
    FlipAudio.init();
    FlipAudio.playSfx('click');
  }
}

function audioToggleMusic(el) {
  if (typeof FlipAudio === 'undefined') return;
  FlipAudio.init();
  const on = FlipAudio.toggleMusic();
  const btn = document.getElementById('audioToggleBtn');
  if (btn) btn.textContent = on ? '🎵' : '🔇';
  _audioUpdateNowPlaying();
}

function audioToggleSfx(el) {
  if (typeof FlipAudio === 'undefined') return;
  FlipAudio.init();
  FlipAudio.toggleSfx();
}

function audioSetMusicVol(val) {
  if (typeof FlipAudio === 'undefined') return;
  FlipAudio.setMusicVolume(parseInt(val) / 100);
  const display = document.getElementById('musicVolVal');
  if (display) display.textContent = val + '%';
}

function audioSetSfxVol(val) {
  if (typeof FlipAudio === 'undefined') return;
  FlipAudio.setSfxVolume(parseInt(val) / 100);
  const display = document.getElementById('sfxVolVal');
  if (display) display.textContent = val + '%';
}

// Update now playing label + sync widget UI
const THEME_NAMES = {
  lobby:   '🏛 Angel Arena Anthem',
  battle:  '⚔️ Eternal Siege',
  boss:    '💀 Wrath of the Reaper',
  victory: '🏆 Angels Ascend',
  gameover:'😔 Fallen Hero',
  none:    '— Dừng —',
};

function _audioUpdateNowPlaying() {
  if (typeof FlipAudio === 'undefined') return;
  const state = FlipAudio.getState();
  const nameEl = document.getElementById('audioNowPlaying');
  const dotEl  = document.getElementById('audioPlayingDot');
  if (nameEl) nameEl.textContent = THEME_NAMES[state.currentTheme] || '—';
  if (dotEl) {
    const playing = state.musicEnabled && state.currentTheme && state.currentTheme !== 'none';
    dotEl.classList.toggle('paused', !playing);
  }
  // Sync toggle/slider UI from saved state
  const els = {
    mToggle: document.getElementById('musicToggle'),
    sToggle: document.getElementById('sfxToggle'),
    mSlider: document.getElementById('musicVolSlider'),
    sSlider: document.getElementById('sfxVolSlider'),
    mVal:    document.getElementById('musicVolVal'),
    sVal:    document.getElementById('sfxVolVal'),
  };
  if (els.mToggle) els.mToggle.checked = state.musicEnabled;
  if (els.sToggle) els.sToggle.checked = state.sfxEnabled;
  if (els.mSlider) els.mSlider.value = Math.round(state.musicVolume * 100);
  if (els.sSlider) els.sSlider.value = Math.round(state.sfxVolume * 100);
  if (els.mVal) els.mVal.textContent = Math.round(state.musicVolume * 100) + '%';
  if (els.sVal) els.sVal.textContent = Math.round(state.sfxVolume * 100) + '%';
}

function _audioStartLobby() {
  if (typeof FlipAudio === 'undefined') return;
  FlipAudio.init();
  FlipAudio.playTheme('lobby');
  _audioUpdateNowPlaying();
}

// ── THROTTLE HELPERS ───────────────────────────────────────────
let _lastGoldSfxTime = 0, _lastXpSfxTime = 0, _lastHitSfxTime = 0, _lastHurtSfxTime = 0;
let _lastLowHpWarnTime = 0;

function _sfxThrottle(name, throttleMs, lastTimeRef, args) {
  // lastTimeRef is a getter/setter pair
  const now = Date.now();
  if (now - lastTimeRef.get() > throttleMs) {
    lastTimeRef.set(now);
    if (typeof FlipAudio !== 'undefined') FlipAudio.playSfx(name, ...(args||[]));
  }
}

// ── GLOBAL FUNCTION PATCHES ────────────────────────────────────

// startPveGame — play war horn + transition to battle music
const _origStartPveGame = window.startPveGame || startPveGame;
window.startPveGame = function() {
  _origStartPveGame();
  if (typeof FlipAudio !== 'undefined') {
    FlipAudio.init();
    FlipAudio.playSfx('gameStart');
    setTimeout(() => {
      FlipAudio.playTheme('battle');
      _audioUpdateNowPlaying();
    }, 1000);
  }
};

// quitToLobby — back to lobby music
const _origQuitToLobby = window.quitToLobby || quitToLobby;
window.quitToLobby = function() {
  _origQuitToLobby();
  if (typeof FlipAudio !== 'undefined') {
    FlipAudio.playTheme('lobby');
    _audioUpdateNowPlaying();
  }
};

// restartPve — also transition back to battle
const _origRestartPve = window.restartPve || (typeof restartPve !== 'undefined' ? restartPve : null);
if (_origRestartPve) {
  window.restartPve = function() {
    _origRestartPve();
    if (typeof FlipAudio !== 'undefined') {
      FlipAudio.playSfx('gameStart');
      setTimeout(() => { FlipAudio.playTheme('battle'); _audioUpdateNowPlaying(); }, 800);
    }
  };
}

// pausePve / resumePve
const _origPausePve = window.pausePve || pausePve;
window.pausePve = function() {
  _origPausePve();
  if (typeof FlipAudio !== 'undefined') FlipAudio.playSfx('pauseToggle');
};

const _origResumePve = window.resumePve || resumePve;
window.resumePve = function() {
  _origResumePve();
  if (typeof FlipAudio !== 'undefined') FlipAudio.playSfx('pauseToggle');
};

// ── PVECLASS PROTOTYPE PATCHES ─────────────────────────────────
(function patchPveGameAudio() {
  if (typeof PveGame === 'undefined') return;
  const proto = PveGame.prototype;

  // ── 1. dealDamage → hit / critHit SFX (throttled 80ms) ─
  const _origDealDamage = proto.dealDamage;
  proto.dealDamage = function(enemy, rawDmg) {
    const result = _origDealDamage.call(this, enemy, rawDmg);
    if (typeof FlipAudio !== 'undefined' && result > 0) {
      const now = Date.now();
      if (now - _lastHitSfxTime > 80) {
        _lastHitSfxTime = now;
        // 25% chance on normal, always on crit (result > 1.5x raw accounting for crits)
        const isCrit = result > rawDmg * 1.3;
        if (isCrit || Math.random() < 0.25) {
          FlipAudio.playSfx(isCrit ? 'critHit' : 'hit');
        }
      }
    }
    return result;
  };

  // ── 2. takeDamage → playerHurt SFX (throttled 200ms) ───
  const _origTakeDamage = proto.takeDamage;
  proto.takeDamage = function(amt, sourceType) {
    const pHpBefore = this.player ? this.player.hp : 0;
    _origTakeDamage.call(this, amt, sourceType);
    if (typeof FlipAudio !== 'undefined' && this.player) {
      const now = Date.now();
      if (this.player.hp < pHpBefore && now - _lastHurtSfxTime > 200) {
        _lastHurtSfxTime = now;
        FlipAudio.playSfx('playerHurt');
        // Low HP warning (throttle to 3s)
        if (this.player.hp / this.player.maxHp < 0.25 && now - _lastLowHpWarnTime > 3000) {
          _lastLowHpWarnTime = now;
          FlipAudio.playSfx('lowHp');
        }
      }
    }
  };

  // ── 3. killEnemy → enemyDie / bossDie SFX ──────────────
  const _origKillEnemy = proto.killEnemy;
  proto.killEnemy = function(enemy) {
    const wasBoss = enemy && enemy.isBoss;
    const wasElite = enemy && enemy.isElite;
    _origKillEnemy.call(this, enemy);
    if (typeof FlipAudio !== 'undefined') {
      if (wasBoss) {
        FlipAudio.playSfx('bossDie');
        // Return to battle music 2s after boss death
        setTimeout(() => {
          if (typeof FlipAudio !== 'undefined') {
            FlipAudio.playTheme('battle');
            _audioUpdateNowPlaying();
          }
        }, 2000);
      } else if (wasElite) {
        FlipAudio.playSfx('enemyDie'); // Always play for elites
      } else if (Math.random() < 0.07) {
        FlipAudio.playSfx('enemyDie'); // 7% for normal mobs
      }
    }
  };

  // ── 4. FIX: triggerBossEncounter = where boss actually spawns (not spawnBoss)
  const _origTriggerBossEncounter = proto.triggerBossEncounter;
  if (_origTriggerBossEncounter) {
    proto.triggerBossEncounter = function(typeId) {
      _origTriggerBossEncounter.call(this, typeId);
      if (typeof FlipAudio !== 'undefined') {
        FlipAudio.playSfx('bossSpawn');
        setTimeout(() => {
          if (typeof FlipAudio !== 'undefined') {
            FlipAudio.playTheme('boss');
            _audioUpdateNowPlaying();
          }
        }, 600);
      }
    };
  }

  // ── 5. onLevelUp → levelUp SFX ─────────────────────────
  const _origOnLevelUp = proto.onLevelUp;
  proto.onLevelUp = function() {
    _origOnLevelUp.call(this);
    if (typeof FlipAudio !== 'undefined') FlipAudio.playSfx('levelUp');
  };

  // ── 6. gameOver → gameover theme ───────────────────────
  const _origGameOver = proto.gameOver;
  proto.gameOver = function() {
    _origGameOver.call(this);
    if (typeof FlipAudio !== 'undefined') {
      FlipAudio.playTheme('gameover');
      _audioUpdateNowPlaying();
    }
  };

  // ── 7. victory → victory fanfare ───────────────────────
  const _origVictory = proto.victory;
  proto.victory = function() {
    _origVictory.call(this);
    if (typeof FlipAudio !== 'undefined') {
      FlipAudio.playTheme('victory');
      _audioUpdateNowPlaying();
    }
  };

  // ── 8. FIX: Gold pickup — hook into particle collection ─
  // Gold is collected in updateParticles via this.totalGold += finalVal
  // We patch the collection inline by wrapping updateParticles
  const _origUpdateParticles = proto.updateParticles;
  if (_origUpdateParticles) {
    proto.updateParticles = function(dt) {
      const goldBefore = this.totalGold;
      const xpBefore = this.player ? this.player.xp : 0;
      _origUpdateParticles.call(this, dt);
      if (typeof FlipAudio !== 'undefined') {
        const now = Date.now();
        // Gold collected
        if (this.totalGold > goldBefore && now - _lastGoldSfxTime > 350) {
          _lastGoldSfxTime = now;
          FlipAudio.playSfx('goldPickup');
        }
        // XP collected (player.xp changed — before level-up resets it)
        if (this.player && this.player.xp !== xpBefore && now - _lastXpSfxTime > 250) {
          _lastXpSfxTime = now;
          FlipAudio.playSfx('xpPickup');
        }
      }
    };
  }

  // ── 9. fireSkill → SFX by skill type (throttled) ───────
  const _origFireSkill = proto.fireSkill;
  let _lastSkillSfxTime = 0;
  proto.fireSkill = function(id, level, def) {
    _origFireSkill.call(this, id, level, def);
    if (typeof FlipAudio === 'undefined') return;
    const now = Date.now();
    if (now - _lastSkillSfxTime < 50) return; // prevent rapid double-fire
    _lastSkillSfxTime = now;
    const s = id || '';
    if      (s.includes('arrow_rain') || s.includes('rain_arrow')) FlipAudio.playSfx('arrowRain');
    else if (s.includes('arrow') || s.includes('shot') || s.includes('ranger') || s.includes('bow')) FlipAudio.playSfx('shoot');
    else if (s.includes('slash') || s.includes('blade') || s.includes('strike') || s.includes('assassin')) FlipAudio.playSfx('slash');
    else if (s.includes('thunder') || s.includes('lightning') || s.includes('bolt')) FlipAudio.playSfx('lightning');
    else if (s.includes('frost') || s.includes('ice') || s.includes('blizzard') || s.includes('freeze')) FlipAudio.playSfx('freeze');
    else if (s.includes('wolf') || s.includes('spirit_wolf')) FlipAudio.playSfx('wolfHowl');
    else if (s.includes('summon') || s.includes('skeleton') || s.includes('revenant')) FlipAudio.playSfx('summon');
    else if (s.includes('shadow') || s.includes('clone') || s.includes('phantom')) FlipAudio.playSfx('shadowClone');
    else if (s.includes('explosion') || s.includes('bomb') || s.includes('detonate')) FlipAudio.playSfx('explosion');
    else if (s.includes('ground') || s.includes('slam') || s.includes('quake') || s.includes('thorn')) FlipAudio.playSfx('groundSlam');
    else if (s.includes('heal') || s.includes('holy') || s.includes('divine') || s.includes('regen')) FlipAudio.playSfx('heal');
    else if (s.includes('magic') || s.includes('missile') || s.includes('arcane') || s.includes('mage')) FlipAudio.playSfx('magic');
    else FlipAudio.playSfx('skillCast');
  };

  // ── 10. showSkillLevelUp → skillUnlock / legendaryUnlock ─
  const _origShowSkillLevelUp = proto.showSkillLevelUp;
  proto.showSkillLevelUp = function(id, level) {
    _origShowSkillLevelUp.call(this, id, level);
    if (typeof FlipAudio !== 'undefined') {
      FlipAudio.playSfx(level >= 8 ? 'legendaryUnlock' : 'skillUnlock');
    }
  };

  // ── 11. showLegendaryBanner → legendary SFX ────────────
  const _origShowLegendaryBanner = proto.showLegendaryBanner;
  if (_origShowLegendaryBanner) {
    proto.showLegendaryBanner = function(skillDef) {
      _origShowLegendaryBanner.call(this, skillDef);
      if (typeof FlipAudio !== 'undefined') FlipAudio.playSfx('legendaryUnlock');
    };
  }

  // ── 12. buyMerchantItem → purchase / heal / error SFX ──
  const _origBuyMerchantItem = proto.buyMerchantItem;
  if (_origBuyMerchantItem) {
    proto.buyMerchantItem = function(id, cost, name) {
      const goldBefore = this.totalGold;
      _origBuyMerchantItem.call(this, id, cost, name);
      if (typeof FlipAudio !== 'undefined') {
        if (this.totalGold < goldBefore) {
          // Purchase went through
          if (id === 'chicken' || id === 'invuln_potion') {
            FlipAudio.playSfx('heal');
          } else {
            FlipAudio.playSfx('purchase');
          }
        } else {
          // Gold didn't change — couldn't afford
          FlipAudio.playSfx('error');
        }
      }
    };
  }

  // ── 13. openMerchantShop → shop SFX ────────────────────
  const _origOpenMerchantShop = proto.openMerchantShop;
  if (_origOpenMerchantShop) {
    proto.openMerchantShop = function() {
      _origOpenMerchantShop.call(this);
      if (typeof FlipAudio !== 'undefined') FlipAudio.playSfx('magic');
    };
  }

  // ── 14. triggerArcanaSelection → magic SFX ─────────────
  const _origTriggerArcana = proto.triggerArcanaSelection;
  if (_origTriggerArcana) {
    proto.triggerArcanaSelection = function(cb) {
      _origTriggerArcana.call(this, cb);
      if (typeof FlipAudio !== 'undefined') {
        setTimeout(() => FlipAudio.playSfx('legendaryUnlock'), 200);
      }
    };
  }

  // ── 15. showEvolutionModal → legendary evolution SFX ───
  const _origShowEvolutionModal = proto.showEvolutionModal;
  if (_origShowEvolutionModal) {
    proto.showEvolutionModal = function(...args) {
      _origShowEvolutionModal.call(this, ...args);
      if (typeof FlipAudio !== 'undefined') {
        FlipAudio.playSfx('legendaryUnlock');
      }
    };
  }

  // ── 16. updateDayNightAndWeather → day/night + weather SFX
  const _origUpdateDayNight = proto.updateDayNightAndWeather;
  if (_origUpdateDayNight) {
    proto.updateDayNightAndWeather = function(dt) {
      const prevCycle = this.dayNightCycle;
      const prevWeather = this.currentWeather;
      _origUpdateDayNight.call(this, dt);
      if (typeof FlipAudio !== 'undefined') {
        // Day/night transition
        if (this.dayNightCycle !== prevCycle) {
          if (this.dayNightCycle === 'night') {
            FlipAudio.playSfx('magic'); // Eerie night start
          } else {
            FlipAudio.playSfx('waveClear'); // Dawn chime
          }
        }
        // Weather event started
        if (this.currentWeather !== prevWeather && this.currentWeather !== 'clear') {
          if (this.currentWeather === 'thunderstorm') {
            FlipAudio.playSfx('lightning');
          } else if (this.currentWeather === 'blizzard') {
            FlipAudio.playSfx('freeze');
          } else {
            FlipAudio.playSfx('groundSlam');
          }
        }
      }
    };
  }

  // ── 17. confirmSuicide → dark thud SFX ─────────────────
  const _origConfirmSuicide = proto.confirmSuicide;
  if (_origConfirmSuicide) {
    proto.confirmSuicide = function() {
      _origConfirmSuicide.call(this);
      if (typeof FlipAudio !== 'undefined') FlipAudio.playSfx('error');
    };
  }

  // ── 18. screenShake → sub-bass thud for big shakes ─────
  const _origScreenShake = proto.screenShake;
  if (_origScreenShake) {
    let _lastShakeSfxTime = 0;
    proto.screenShake = function(intensity, duration) {
      _origScreenShake.call(this, intensity, duration);
      if (typeof FlipAudio !== 'undefined' && intensity >= 12) {
        const now = Date.now();
        if (now - _lastShakeSfxTime > 500) {
          _lastShakeSfxTime = now;
          FlipAudio.playSfx('groundSlam');
        }
      }
    };
  }

  // ── 19. stop() — stop music properly on game end ────────
  const _origStop = proto.stop;
  proto.stop = function() {
    _origStop.call(this);
    // Don't stop music here — gameOver/victory/quitToLobby handle theme transitions
  };

})();

// ── LOBBY INTERACTION SOUNDS ───────────────────────────────────
// Attach hover/click SFX once DOM is ready
(function attachLobbyHoverSfx() {
  const addSfx = (selector) => {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('mouseenter', () => {
        if (typeof FlipAudio !== 'undefined') FlipAudio.playSfx('hover');
      }, { passive: true });
      el.addEventListener('click', () => {
        if (typeof FlipAudio !== 'undefined') FlipAudio.playSfx('click');
      }, { passive: true });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addSfx('.class-chip');
      addSfx('.stage-card-fancy');
      addSfx('.start-btn-epic');
      addSfx('.pve-btn');
      addSfx('.powerup-trigger-card');
    });
  } else {
    addSfx('.class-chip');
    addSfx('.stage-card-fancy');
    addSfx('.start-btn-epic');
    addSfx('.pve-btn');
    addSfx('.powerup-trigger-card');
  }
})();

// ── AUTO LOBBY MUSIC on first interaction ──────────────────────
(function() {
  let _lobbyMusicStarted = false;
  const startLobbyOnce = () => {
    if (_lobbyMusicStarted) return;
    _lobbyMusicStarted = true;
    _audioStartLobby();
    // Sync UI with saved settings
    setTimeout(_audioUpdateNowPlaying, 300);
  };
  document.addEventListener('click',   startLobbyOnce, { once: true, passive: true });
  document.addEventListener('keydown', startLobbyOnce, { once: true, passive: true });
})();

// ── CLOSE PANEL ON OUTSIDE CLICK ─────────────────────────────
document.addEventListener('click', (e) => {
  if (!_audioPanelOpen) return;
  const widget = document.getElementById('audioWidget');
  if (widget && !widget.contains(e.target)) {
    _audioPanelOpen = false;
    const panel = document.getElementById('audioPanel');
    const btn   = document.getElementById('audioToggleBtn');
    if (panel) { panel.classList.remove('open'); panel.style.display = 'none'; }
    if (btn)   btn.classList.remove('active');
  }
}, { passive: true });

/* ── ADDITIONAL MISSING AUDIO HOOKS v2 ────────────────────────
   All patches below fix missing events found in code audit
────────────────────────────────────────────────────────────── */
(function patchMissingAudio() {
  if (typeof PveGame === 'undefined' || typeof FlipAudio === 'undefined') return;
  const proto = PveGame.prototype;

  // ── Chest Open → skillUnlock chime ─────────────────────
  const _origOpenBossChest = proto.openBossChest;
  if (_origOpenBossChest) {
    proto.openBossChest = function(...args) {
      _origOpenBossChest.call(this, ...args);
      if (typeof FlipAudio !== 'undefined') FlipAudio.playSfx('skillUnlock');
    };
  }

  // ── _buyPowerupInGame → purchase or error SFX ─────────
  const _origBuyPowerupInGame = proto._buyPowerupInGame;
  if (_origBuyPowerupInGame) {
    proto._buyPowerupInGame = function(id) {
      const goldBefore = this.totalGold;
      _origBuyPowerupInGame.call(this, id);
      if (typeof FlipAudio !== 'undefined') {
        if (this.totalGold < goldBefore) {
          FlipAudio.playSfx('purchase');
        } else {
          FlipAudio.playSfx('error');
        }
      }
    };
  }

  // ── openDemonicAltar → ominous summon sound ────────────
  const _origOpenDemonicAltar = proto.openDemonicAltar;
  if (_origOpenDemonicAltar) {
    proto.openDemonicAltar = function() {
      _origOpenDemonicAltar.call(this);
      if (typeof FlipAudio !== 'undefined') {
        FlipAudio.playSfx('bossSpawn'); // Ominous dramatic sound
      }
    };
  }

  // ── acceptDemonicDeal → legendary + groundSlam combo ──
  const _origAcceptDemonicDeal = proto.acceptDemonicDeal;
  if (_origAcceptDemonicDeal) {
    proto.acceptDemonicDeal = function(...args) {
      _origAcceptDemonicDeal.call(this, ...args);
      if (typeof FlipAudio !== 'undefined') {
        FlipAudio.playSfx('groundSlam');
        setTimeout(() => FlipAudio.playSfx('legendaryUnlock'), 300);
      }
    };
  }
  const _origAcceptDemonicDealCustom = proto.acceptDemonicDealCustom;
  if (_origAcceptDemonicDealCustom) {
    proto.acceptDemonicDealCustom = function(...args) {
      _origAcceptDemonicDealCustom.call(this, ...args);
      if (typeof FlipAudio !== 'undefined') {
        FlipAudio.playSfx('groundSlam');
        setTimeout(() => FlipAudio.playSfx('legendaryUnlock'), 300);
      }
    };
  }

  // ── updateWave milestone → countdown SFX ──────────────
  // Add warning sounds at the 28/29 minute countdown
  const _origUpdateWave = proto.updateWave;
  if (_origUpdateWave) {
    let _lastWaveWarnAudio = '';
    proto.updateWave = function(dt) {
      const warned28Before = this._warned28;
      const warned29Before = this._warned29;
      const warned2930Before = this._warned2930;
      const reaperBefore = this._deathReaperSpawned;
      _origUpdateWave.call(this, dt);
      if (typeof FlipAudio !== 'undefined') {
        // 28 min warning — screen shake + lightning
        if (!warned28Before && this._warned28) {
          FlipAudio.playSfx('lightning');
          setTimeout(() => FlipAudio.playSfx('lightning'), 400);
        }
        // 29 min warning — bossSpawn ominous
        if (!warned29Before && this._warned29) {
          FlipAudio.playSfx('bossSpawn');
        }
        // 29:30 warning — rapid danger
        if (!warned2930Before && this._warned2930) {
          FlipAudio.playSfx('lightning');
        }
        // Death Reaper spawned
        if (!reaperBefore && this._deathReaperSpawned) {
          FlipAudio.playSfx('bossSpawn');
          setTimeout(() => {
            FlipAudio.playTheme('boss');
            _audioUpdateNowPlaying();
          }, 800);
        }
      }
    };
  }

  // ── Arcana at minute 15 — patch the arcana screen card clicks ─
  // Instead of patching triggerArcanaSelection (already done),
  // intercept the arcana card select buttons via DOM mutation
  const arcanaObserver = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.id === 'pveArcanaScreen') {
          // Arcana screen appeared - add click sounds to cards
          setTimeout(() => {
            node.querySelectorAll('.arcana-card, .arcana-option, [onclick*="selectArcana"]').forEach(card => {
              card.addEventListener('click', () => {
                if (typeof FlipAudio !== 'undefined') FlipAudio.playSfx('legendaryUnlock');
              }, { once: true, passive: true });
            });
          }, 100);
        }
      });
    });
  });
  arcanaObserver.observe(document.body, { childList: true, subtree: true });

  // ── Surrender (Đầu Hàng button in confirmSuicide modal) ─
  // Intercept the modal creation and add SFX to surrender button
  const _origConfirmSuicide2 = proto.confirmSuicide;
  if (_origConfirmSuicide2) {
    proto.confirmSuicide = function() {
      _origConfirmSuicide2.call(this);
      // The modal is appended asynchronously; wait a tick to add listener
      setTimeout(() => {
        const modal = document.getElementById('suicideConfirmModal');
        if (!modal) return;
        // The surrender button triggers goToLobby — intercept it
        const surrenderBtn = modal.querySelector('button:last-child');
        if (surrenderBtn) {
          surrenderBtn.addEventListener('click', () => {
            if (typeof FlipAudio !== 'undefined') {
              FlipAudio.playTheme('gameover');
              _audioUpdateNowPlaying();
            }
          }, { passive: true });
        }
      }, 50);
    };
  }

})();

