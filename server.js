const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, perMessageDeflate: false });

const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0, setHeaders: (res) => { res.set('Cache-Control', 'no-cache, no-store, must-revalidate'); } }));

app.get('/api/speedtest', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  if (req.query.ping === 'true') {
    return res.send('pong');
  }
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', 512 * 1024); // 512 KB zero-filled buffer for speed testing
  const buffer = Buffer.alloc(512 * 1024);
  res.send(buffer);
});

// ─── Game Configuration ──────────────────────────────────────
const MAP_SIZE   = 10000;
const TICK_RATE  = 20;
const TICK_TIME  = 1000 / TICK_RATE;
const MAX_BOTS   = 20;
const MAX_PARTICLES = 1600; // server-side limit hint

// ─── 10 Evolution Stages ─────────────────────────────────────
const EVOLUTION_PRESETS = {
  1:  { name:'Blobby',    radius:20,  maxHp:100,  speed:270, atkRange:140, atkCD:750, atkDmg:17, skillCD:3000  },
  2:  { name:'Brawler',   radius:26,  maxHp:170,  speed:250, atkRange:175, atkCD:638, atkDmg:22, skillCD:3300  },
  3:  { name:'Knight',    radius:34,  maxHp:280,  speed:230, atkRange:210, atkCD:525, atkDmg:29, skillCD:5500  }, // maxHp 260->280, skillCD 4200->5500
  4:  { name:'Champion',  radius:43,  maxHp:420,  speed:210, atkRange:245, atkCD:435, atkDmg:39, skillCD:4800  }, // maxHp 400->420
  5:  { name:'Hunter',    radius:53,  maxHp:580,  speed:195, atkRange:280, atkCD:360, atkDmg:50, skillCD:5100  },
  6:  { name:'Boss King', radius:66,  maxHp:900,  speed:175, atkRange:320, atkCD:285, atkDmg:64, skillCD:6000  },
  7:  { name:'Dragon',    radius:78,  maxHp:1400, speed:160, atkRange:360, atkCD:240, atkDmg:81, skillCD:6600  },
  8:  { name:'Shadow',    radius:88,  maxHp:2100, speed:185, atkRange:400, atkCD:195, atkDmg:101,skillCD:9600  }, // maxHp 2000->2100
  9:  { name:'Celestial', radius:100, maxHp:3100, speed:200, atkRange:440, atkCD:158, atkDmg:126,skillCD:7800  }, // maxHp 3000->3100
  10: { name:'Omega',     radius:116, maxHp:5200, speed:145, atkRange:500, atkCD:135, atkDmg:161,skillCD:9000  }  // maxHp 5000->5200
};

const BRANCH_PRESETS = {
  assassin: {
    5:  { name:'Rogue',         radius:45,  maxHp:500,  speed:234, atkRange:260, atkCD:280, atkDmg:42, skillCD:4500  }, // maxHp 460->500, atkCD 320->280, atkDmg 37->42
    6:  { name:'Shinobi',       radius:56,  maxHp:780,  speed:220, atkRange:160, atkCD:170, atkDmg:56, skillCD:8000  }, // maxHp 720->780, speed 210->220, atkRange 150->160, atkCD 200->170, atkDmg 44->56
    7:  { name:'Nightshade',    radius:66,  maxHp:1180, speed:192, atkRange:160, atkCD:180, atkDmg:66, skillCD:9000  }, // maxHp 1120->1180, atkRange 270->160, atkCD 220->180, atkDmg 29->66
    8:  { name:'Shadow Reaper', radius:75,  maxHp:1680, speed:222, atkRange:160, atkCD:150, atkDmg:88, skillCD:9000  }, // maxHp 1600->1680, atkCD 190->150, atkDmg 71->88
    9:  { name:'Void Stalker',  radius:85,  maxHp:2450, speed:240, atkRange:160, atkCD:120, atkDmg:106,skillCD:11000 }, // maxHp 2400->2450, atkRange 280->160, atkCD 150->120, atkDmg 55->106
    10: { name:'Specter Lord',  radius:98,  maxHp:3600, speed:174, atkRange:180, atkCD:130, atkDmg:95, skillCD:18000 }  // maxHp 4000->3600, atkRange 350->180, atkCD 110->130, atkDmg 109->95
  },
  fighter: {
    5:  { name:'Vanguard',      radius:61,  maxHp:750,  speed:175, atkRange:160, atkCD:360, atkDmg:42, skillCD:6000  }, // maxHp 780->750, atkDmg 45->42
    6:  { name:'Berserker',     radius:76,  maxHp:1100, speed:157, atkRange:160, atkCD:285, atkDmg:65, skillCD:11000 }, // maxHp 1210->1100, atkDmg 78->65, skillCD 10000->11000
    7:  { name:'Colossus',      radius:90,  maxHp:1650, speed:144, atkRange:160, atkCD:240, atkDmg:58, skillCD:8000  }, // maxHp 1890->1650, atkRange 140->160, atkDmg 55->58
    8:  { name:'Warlord',       radius:101, maxHp:2300, speed:166, atkRange:180, atkCD:195, atkDmg:72, skillCD:11000 }, // maxHp 2700->2300, atkRange 200->180, atkDmg 65->72, skillCD 9600->11000
    9:  { name:'Juggernaut',    radius:115, maxHp:3400, speed:180, atkRange:180, atkCD:158, atkDmg:92, skillCD:11000 }, // maxHp 4050->3400, atkDmg 90->92
    10: { name:'Immortal Titan',radius:133, maxHp:6200, speed:130, atkRange:200, atkCD:135, atkDmg:135,skillCD:20000 }  // maxHp 6750->6200, atkRange 220->200, atkDmg 130->135
  },
  mage: {
    5:  { name:'Adept',         radius:53,  maxHp:580,  speed:195, atkRange:350, atkCD:360, atkDmg:44, skillCD:5000  }, // atkDmg 38->44
    6:  { name:'Pyromancer',    radius:66,  maxHp:780,  speed:175, atkRange:400, atkCD:285, atkDmg:68, skillCD:8000  }, // maxHp 900->780, atkDmg 55->68
    7:  { name:'Cryomancer',    radius:78,  maxHp:1150, speed:160, atkRange:450, atkCD:240, atkDmg:78, skillCD:9000  }, // maxHp 1400->1150, atkDmg 22->78
    8:  { name:'Electromancer', radius:88,  maxHp:1650, speed:185, atkRange:500, atkCD:195, atkDmg:92, skillCD:9600  }, // maxHp 2000->1650, atkDmg 48->92
    9:  { name:'Archmage',      radius:100, maxHp:2450, speed:200, atkRange:550, atkCD:158, atkDmg:115,skillCD:11000 }, // maxHp 3000->2450, atkDmg 68->115
    10: { name:'Chrono Lord',   radius:116, maxHp:4000, speed:145, atkRange:625, atkCD:135, atkDmg:135,skillCD:18000 }  // maxHp 5000->4000, atkDmg 110->135
  }
};

function recalculateStats(player) {
  let p = null;
  if (player.level >= 5 && player.branch) {
    p = BRANCH_PRESETS[player.branch]?.[player.level];
  }
  if (!p) {
    p = EVOLUTION_PRESETS[player.level];
  }
  if (!p) return;

  let maxHpMult = 1.0;
  let dmgMult = 1.0;
  let speedMult = 1.0;
  let skillCdMult = 1.0;
  
  // Custom class-adaptive perk status effects
  player.ccReduction = 0;
  player.projSpeedBoost = 1.0;

  if (player.perks) {
    player.perks.forEach(perk => {
      if (perk === 'max_hp_boost') {
        if (player.branch === 'fighter') {
          maxHpMult += 0.10; // Prevent HP bloating on Fighter
          player.ccReduction = 0.15; // Shorten stun/slow durations by 15%
        } else if (player.branch === 'mage') {
          maxHpMult += 0.15; // Extra health for squishy Mage
        } else if (player.branch === 'assassin') {
          maxHpMult += 0.12; // Moderate health boost for Assassin
        } else {
          maxHpMult += 0.15; // Base level max HP boost
        }
      }
      if (perk === 'attack_dmg_boost') {
        dmgMult += 0.12; // Flat 12% across all classes
      }
      if (perk === 'speed_boost') {
        speedMult += 0.08; // Flat 8% to maintain kiting balance
        if (player.branch === 'mage') {
          player.projSpeedBoost = 1.05; // 5% projectile speed boost for Mage
        }
      }
      if (perk === 'cooldown_reduction') {
        if (player.branch === 'assassin') {
          skillCdMult -= 0.12; // Cap clone/vanish spamming
          dmgMult += 0.02; // Flat 2% extra damage to compensate
        } else {
          skillCdMult -= 0.15; // Flat 15% for Mage and Fighter
        }
      }
    });
  }

  const oldMaxHp = player.maxHp || p.maxHp;
  const hpPct = (player.hp || oldMaxHp) / oldMaxHp;

  player.maxHp = Math.round(p.maxHp * maxHpMult);
  player.hp = Math.round(player.maxHp * hpPct); // maintain current HP percentage
  player.radius = p.radius;
  player.speed = Math.round(p.speed * speedMult);
  player.attackRange = p.atkRange;
  player.attackCooldownTime = p.atkCD;
  player.attackDamage = Math.round(p.atkDmg * dmgMult);
  player.skillCooldownMax = Math.round(p.skillCD * skillCdMult);
}

// XP required to reach each level FROM previous level
const EXP_THRESHOLDS = {
  1: 300, 2: 800, 3: 1800, 4: 4000, 5: 8500,
  6: 16000, 7: 30000, 8: 55000, 9: 100000
};

// Auto-regen per tick (HP per second)
const REGEN_PER_TICK = {
  1:0.4, 2:0.6, 3:0.9, 4:1.4, 5:2.0,
  6:3.0, 7:4.5, 8:7.0, 9:11.0, 10:17.5
};

// Item probabilities
const ITEM_WEIGHTS = {
  potion:0.18, boot:0.16, shield_item:0.12,
  bomb_item:0.12, trap_item:0.08, net_item:0.08,
  missile_item:0.08, rage_item:0.06, lightning_item:0.12
};

// ─── State ───────────────────────────────────────────────────
const players    = {};
const projectiles= [];
let   items      = [];
const hazards    = [];
const killFeed   = []; // { text, ttl }
const grassPatches = [];
const speedPads = [];
let   projId = 0, itemId = 0, hazardId = 0;
let   matchTimer = 300; // 5 minute match
let   networkTickCount = 0;
let   globalTimeWarpTime = 0;
let   globalTimeWarpOwnerId = null;

// ─── Helpers ─────────────────────────────────────────────────
function genId() { return Math.random().toString(36).slice(2, 9); }

function rng(seed) {
  const x = Math.sin(seed + 1) * 43758.5453;
  return x - Math.floor(x);
}

function inSameGrassOrSmoke(p1, p2) {
  if (!p1 || !p2) return false;
  const sameGrass = grassPatches.some(g =>
    Math.hypot(p1.x - g.x, p1.y - g.y) < g.radius && Math.hypot(p2.x - g.x, p2.y - g.y) < g.radius
  );
  if (sameGrass) return true;

  const sameSmoke = hazards.some(hz =>
    hz.type === 'smoke_bomb' &&
    Math.hypot(p1.x - hz.x, p1.y - hz.y) < hz.radius &&
    Math.hypot(p2.x - hz.x, p2.y - hz.y) < hz.radius
  );
  return sameSmoke;
}

function isTargetVisible(viewer, target) {
  if (target.hp <= 0) return false;
  if (viewer && target.id === viewer.id) return true;

  const dist = viewer ? Math.hypot(target.x - viewer.x, target.y - viewer.y) : Infinity;

  // 1. Vanished or Void State players
  if (target.vanishTime > 0 || target.voidStateTime > 0) {
    if (!viewer) return false;
    return dist <= 100;
  }

  // 2. Players inside grass or smoke bombs
  if (target.inGrass) {
    if (!viewer) return false;
    
    // Check if target is inside a smoke bomb
    const inSmoke = hazards.some(hz => hz.type === 'smoke_bomb' && Math.hypot(target.x - hz.x, target.y - hz.y) < hz.radius);
    if (inSmoke) {
      if (dist <= 50) return true; // Close melee detection in smoke
      return inSameGrassOrSmoke(viewer, target);
    }
    
    // Standard grass behavior
    if (dist <= 120) return true; // Close range detection in grass
    return inSameGrassOrSmoke(viewer, target);
  }

  return true;
}


function randItemType() {
  const r = Math.random();
  let cum = 0;
  for (const [t, w] of Object.entries(ITEM_WEIGHTS)) {
    cum += w;
    if (r <= cum) return t;
  }
  return 'potion';
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ─── Entity Factories ─────────────────────────────────────────
function createPlayer(id, name, isBot = false, startLvl = null) {
  const margin = 150;
  if (isBot && startLvl === null) {
    // Các bot được sinh ra bình thường sẽ chọn cấp độ ngẫu nhiên từ 1-5
    startLvl = Math.floor(1 + Math.random() * 5); // 1, 2, 3, 4, 5
  } else if (startLvl === null) {
    startLvl = 1;
  }
  const preset = EVOLUTION_PRESETS[startLvl] || EVOLUTION_PRESETS[1];
  
  const p = {
    id, name, isBot,
    x: clamp(Math.random() * MAP_SIZE, margin, MAP_SIZE - margin),
    y: clamp(Math.random() * MAP_SIZE, margin, MAP_SIZE - margin),
    vx: 0, vy: 0,
    angle: Math.random() * Math.PI * 2,
    level: startLvl, exp: 0, nextExp: EXP_THRESHOLDS[startLvl] || 9999999,
    hp: preset.maxHp, maxHp: preset.maxHp,
    speed: preset.speed, radius: preset.radius,
    attackRange: preset.atkRange,
    attackCooldownTime: preset.atkCD,
    attackCooldown: 0,
    attackDamage: preset.atkDmg,
    skillCooldown: 0, skillCooldownMax: preset.skillCD,
    shieldTime: 1500,   // spawn shield
    inventory: [], activeItemIndex: 0, score: 0, kills: 0, killStreak: 0,
    survivalStart: Date.now(),
    stunDuration: 0, slowDuration: 0,
    speedBoostDuration: 0, rageDuration: 0,
    dashDuration: 0, dashVx: 0, dashVy: 0,
    reachedLv5Time: startLvl >= 5 ? Date.now() : null,
    // AI
    aiState: 'COLLECT', aiTimer: 0, chaseTargetId: null,
    branch: null, perks: [], pendingPerkChoices: null,
    chatText: null, chatTimer: 0, emote: null, emoteTimer: 0,
    lastCombatTime: Date.now(),
    lastBaitBotSpawnTime: Date.now() - 30000
  };

  if (isBot && startLvl >= 5) {
    p.branch = ['assassin', 'fighter', 'mage'][Math.floor(Math.random() * 3)];
    // Apply 1 perk per level above 5
    for (let l = 6; l <= startLvl; l++) {
      const perksPool = ['speed_boost', 'heal_boost', 'bomb_boost', 'max_hp_boost', 'attack_dmg_boost', 'cooldown_reduction'];
      p.perks.push(perksPool[Math.floor(Math.random() * perksPool.length)]);
    }
    // Set custom stats (defer slightly to ensure presets are defined)
    setTimeout(() => recalculateStats(p), 0);
  }

  return p;
}

function spawnItem(type, x = null, y = null, doBroadcast = true) {
  const margin = 80;
  const it = {
    id: ++itemId,
    x: x ?? clamp(Math.random() * MAP_SIZE, margin, MAP_SIZE - margin),
    y: y ?? clamp(Math.random() * MAP_SIZE, margin, MAP_SIZE - margin),
    type,
    radius: type === 'chest' ? 18 : type === 'heal_orb' ? 12 : 9,
    points: type === 'chest' ? 35 : type === 'heal_orb' ? 15 : 4
  };
  items.push(it);
  if (doBroadcast) {
    broadcast({ type: 'add_item', item: { id: it.id, x: Math.round(it.x), y: Math.round(it.y), t: it.type, r: it.radius } });
  }
}

function spawnProjectile(ownerId, x, y, angle, speed, damage, radius, type, targetId = null, options = {}) {
  const clampedX = clamp(x, 50, MAP_SIZE - 50);
  const clampedY = clamp(y, 50, MAP_SIZE - 50);
  
  let finalSpeed = speed;
  const owner = players[ownerId];
  if (owner && owner.projSpeedBoost) {
    finalSpeed *= owner.projSpeedBoost;
  }

  projectiles.push({
    id: ++projId, ownerId,
    x: clampedX, y: clampedY,
    vx: Math.cos(angle) * finalSpeed,
    vy: Math.sin(angle) * finalSpeed,
    damage, radius, type,
    duration: options.duration ?? (type === 'melee' ? 6 : type === 'missile' ? 240 : 50),
    targetId,
    piercing: options.piercing ?? false,
    hitIds: new Set()
  });
}

function spawnHazard(type, x = null, y = null, ownerId = null, doBroadcast = true) {
  const margin = 150;
  let radius = type === 'barrel' ? 22 : 28;
  let timer = type === 'bomb' ? 48 : (type === 'trap' ? 1200 : 0);
  if (type === 'smoke_bomb') {
    radius = 180;
    timer = 100;
  }
  const hz = {
    id: ++hazardId,
    ownerId,
    x: x ?? clamp(Math.random() * MAP_SIZE, margin, MAP_SIZE - margin),
    y: y ?? clamp(Math.random() * MAP_SIZE, margin, MAP_SIZE - margin),
    type,
    radius,
    hp: 60,
    timer
  };
  hazards.push(hz);
  if (doBroadcast) {
    broadcast({ type: 'add_hazard', hazard: { id: hz.id, x: Math.round(hz.x), y: Math.round(hz.y), t: hz.type, r: hz.radius, tm: hz.timer ?? 0, oid: hz.ownerId } });
  }
}

// ─── Level-up ────────────────────────────────────────────────

function addExp(player, amount) {
  const dx = player.x - 5000;
  const dy = player.y - 5000;
  if (Math.hypot(dx, dy) < 2200) {
    amount *= 2;
  }

  if (player.isBot) {
    amount = Math.max(1, Math.floor(amount * 0.25)); // Bots gain 75% less exp
    // Nếu là bot và đã đạt Level 6 trở lên, không cho tăng kinh nghiệm nữa
    if (player.level >= 6 && !player.isBoss) {
      player.score += amount;
      return;
    }
  }
  if (player.level >= 10) { player.score += amount; return; }
  player.exp   += amount;
  player.score += amount;

  const maxLvl = player.isBot ? (player.isBoss ? Math.max(player.level, 10) : Math.max(player.level, 6)) : 10;
  while (player.level < maxLvl && player.exp >= player.nextExp) {
    player.exp      -= player.nextExp;
    player.level++;
    player.nextExp   = EXP_THRESHOLDS[player.level] ?? 9999999;
    
    if (player.isBot) {
      // Auto-choose branch/perks for bot
      if (player.level === 5) {
        player.branch = ['assassin', 'fighter', 'mage'][Math.floor(Math.random() * 3)];
      }
      recalculateStats(player);
      broadcast({ type: 'level_up_effect', playerId: player.id, level: player.level });
    } else {
      recalculateStats(player);
      broadcast({ type: 'level_up_effect', playerId: player.id, level: player.level });
      
      const ws = wsClients.get(player.id);
      if (player.level === 5) {
        if (player.branch) {
          // Pre-selected from homepage! Evolve immediately without modal
          recalculateStats(player);
          broadcast({ type: 'announcement', text: `✨ ${player.name} evolved to ${player.branch.toUpperCase()}!` });
        } else {
          // Fallback: Open evolution branching screen
          player.choiceTimeout = Date.now() + 10000; // 10s countdown
          player.shieldTime = 999999; // Invulnerable while choosing
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'evolution_choice', timeout: 10000 }));
          }
        }
      }
    }

    // Ghi nhận thời điểm bot đạt Level 5 trở lên để đếm ngược 30 phút out game
    if (player.isBot && player.level >= 5 && !player.reachedLv5Time) {
      player.reachedLv5Time = Date.now();
    }

    // Announce big evolutions
    if (player.level >= 6) {
      const pPreset = player.branch ? BRANCH_PRESETS[player.branch]?.[player.level] : EVOLUTION_PRESETS[player.level];
      const pName = pPreset?.name ?? 'Hero';
      broadcast({ type: 'announcement', text: `⚡ ${player.name} evolved to ${pName} (Lv.${player.level})! BOUNTY ACTIVE!` });
    }
  }
}

// ─── Damage ──────────────────────────────────────────────────
function damagePlayer(victim, amount, attackerId) {
  const attacker = players[attackerId];
  if (victim.reflectDamageTime > 0 && attacker && attackerId !== victim.id) {
    damagePlayer(attacker, Math.round(amount * 0.5), victim.id);
  }
  if (victim.shieldTime > 0) return false;

  victim.lastCombatTime = Date.now();
  if (attacker) {
    attacker.lastCombatTime = Date.now();
  }

  if (attackerId) {
    victim.lastHitBy = attackerId;
  }
  // Level-difference scaling: lower levels take less relative damage
  let dmg = amount;
  if (attacker) {
    const lvlDiff = attacker.level - victim.level;
    if (lvlDiff > 3) dmg *= 0.75; // Anti-stomp protection
    
    // Rock-Paper-Scissors (Oẳn Tù Tì) branch counters:
    // - Assassin beats Mage (+30% dmg)
    // - Mage beats Fighter (+30% dmg)
    // - Fighter beats Assassin (+30% dmg)
    if (attacker.branch && victim.branch) {
      const aB = attacker.branch;
      const vB = victim.branch;
      let counterActive = false;
      if (aB === 'assassin' && vB === 'mage') counterActive = true;
      else if (aB === 'mage' && vB === 'fighter') counterActive = true;
      else if (aB === 'fighter' && vB === 'assassin') counterActive = true;
      
      if (counterActive) {
        dmg *= 1.30; // 30% bonus damage
      }
    }
  }
  victim.hp = Math.max(0, victim.hp - Math.round(dmg));

  broadcast({ type: 'hit_effect', victimId: victim.id, damage: Math.round(dmg), x: victim.x, y: victim.y });

  if (victim.hp <= 0) {
    handleDeath(victim, attackerId);
    return true; // dead
  }
  return false;
}

// ─── Death ───────────────────────────────────────────────────
function handleDeath(victim, killerId) {
  const killer = players[killerId] ?? players[victim.lastHitBy];
  let killerName = 'Environment';
  if (killer) {
    killerName = killer.name;
    killer.kills++;
    killer.killStreak = (killer.killStreak || 0) + 1;
    if (killer.killStreak % 3 === 0) {
      broadcast({ type: 'announcement', text: `🔥 ${killer.name} is on a KILL STREAK of ${killer.killStreak}! WANTED!` });
    }
    let bounty = Math.floor(60 + victim.level * victim.level * 50);
    if (victim.isBountyTarget) {
      bounty *= 2;
    }
    addExp(killer, bounty);

    if (killer.isBot) {
      killer.chatText = BOT_KILL_CHATS[Math.floor(Math.random() * BOT_KILL_CHATS.length)];
      killer.chatTimer = 2500;
      killer.emote = 'happy';
      killer.emoteTimer = 2500;
    }
  }
  victim.killStreak = 0;
  const survivalTime = Math.floor((Date.now() - victim.survivalStart) / 1000);

  // Drop loot
  const drops = 3 + victim.level * 2;
  for (let i = 0; i < drops; i++) {
    const a = (Math.PI * 2 / drops) * i;
    const d = 25 + Math.random() * 30;
    spawnItem('orb', victim.x + Math.cos(a) * d, victim.y + Math.sin(a) * d);
  }
  if (victim.level >= 5) { spawnItem('chest', victim.x + 24, victim.y); spawnItem('chest', victim.x - 24, victim.y); }
  if (victim.level >= 8) { for (let i = 0; i < 3; i++) spawnItem('chest', victim.x + Math.cos(i * 2.1) * 40, victim.y + Math.sin(i * 2.1) * 40); }

  // Kill feed
  const feedText = victim.level >= 7
    ? `👑 ${killerName} ELIMINATED ${victim.name} (Lv.${victim.level})!`
    : `${killerName} ⚔ ${victim.name}`;
  killFeed.unshift({ text: feedText, ttl: 8 });
  if (killFeed.length > 5) killFeed.pop();

  // Death broadcast for VFX
  let victimDeathChat = null;
  let victimDeathEmote = null;
  if (victim.isBot) {
    victimDeathChat = BOT_DEATH_CHATS[Math.floor(Math.random() * BOT_DEATH_CHATS.length)];
    victimDeathEmote = 'crying';
  }
  broadcast({
    type: 'death_effect',
    x: victim.x,
    y: victim.y,
    level: victim.level,
    color: getEvoColor(victim.level),
    chat: victimDeathChat,
    emote: victimDeathEmote,
    playerId: victim.id
  });

  // Personal death message
  const victimWs = wsClients.get(victim.id);
  if (victimWs?.readyState === WebSocket.OPEN) {
    let victimEvoName = 'Unknown';
    if (victim.level >= 5 && victim.branch) {
      victimEvoName = BRANCH_PRESETS[victim.branch]?.[victim.level]?.name ?? EVOLUTION_PRESETS[victim.level]?.name ?? 'Unknown';
    } else {
      victimEvoName = EVOLUTION_PRESETS[victim.level]?.name ?? 'Unknown';
    }

    victimWs.send(JSON.stringify({
      type: 'death',
      rank: getPlayerRank(victim.id),
      score: victim.score,
      kills: victim.kills,
      survivalTime,
      evolution: victimEvoName,
      level: victim.level,
      killedBy: killerName
    }));
  }

  // Announcement
  if (victim.isBountyTarget) {
    broadcast({ type: 'announcement', text: `🎯 ${killerName} defeated the Bounty Target ${victim.name} (Lv.${victim.level})! X2 EXP REWARDED!` });
  } else if (victim.level >= 6) {
    broadcast({ type: 'announcement', text: `🎯 ${killerName} defeated the Bounty Target ${victim.name} (Lv.${victim.level})!` });
  }

  delete players[victim.id];
}

function getEvoColor(lvl) {
  const colors = { 1:'#4ade80',2:'#38bdf8',3:'#f472b6',4:'#ef4444',5:'#a855f7',6:'#fbbf24',7:'#f97316',8:'#0f172a',9:'#e0e7ff',10:'#ffffff' };
  return colors[lvl] ?? '#ffffff';
}

function getPlayerRank(id) {
  const sorted = Object.values(players).sort((a,b) => b.score - a.score);
  const idx = sorted.findIndex(p => p.id === id);
  return idx >= 0 ? idx + 1 : Object.keys(players).length + 1;
}

// ─── Skills ──────────────────────────────────────────────────
function triggerSkill(player) {
  if (player.skillCooldown > 0 || player.stunDuration > 0) return;

  // Breaking stealth when triggering a skill (except if the skill itself is Vanish or Void Shift or Specter Army)
  const isStealthSkill = player.level >= 5 && player.branch === 'assassin' && (player.level === 6 || player.level === 9 || player.level === 10);
  if (!isStealthSkill) {
    if (player.vanishTime > 0) player.vanishTime = 0;
    if (player.voidStateTime > 0) player.voidStateTime = 0;
  }

  player.skillCooldown = player.skillCooldownMax;
  const lvl = player.level;
  const branch = player.branch;

  if (lvl >= 5 && branch) {
    if (branch === 'assassin') {
      if (lvl === 5) {
        // Shadow Dash: dash forward 280px + silence 0.5s
        const a = player.angle;
        player.dashDuration = 350; // snappy dash
        player.dashVx = Math.cos(a);
        player.dashVy = Math.sin(a);
        broadcast({ type: 'dash_effect', playerId: player.id, x: player.x, y: player.y, angle: player.angle });
        // Deal damage/silence to hit targets along dash
        Object.values(players).forEach(other => {
          if (other.id === player.id || other.hp <= 0) return;
          const dist = Math.hypot(other.x - player.x, other.y - player.y);
          if (dist < 280) {
            damagePlayer(other, 45, player.id);
            other.stunDuration = Math.max(other.stunDuration || 0, 500); // 0.5s silence
          }
        });
      } else if (lvl === 6) {
        // Vanish: invisible 4.5s, +35% speed
        player.vanishTime = 4500;
        player.speedBoostDuration = Math.max(player.speedBoostDuration || 0, 4500);
        broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 80, color: '#a855f7' });
      } else if (lvl === 7) {
        // Smoke Bomb: drop smoke screen (radius 180px)
        spawnHazard('smoke_bomb', player.x, player.y, player.id);
      } else if (lvl === 8) {
        // Reaper's Mark: teleport behind nearest within 650px + mark
        const nearest = Object.values(players)
          .filter(o => o.id !== player.id && o.hp > 0 && isTargetVisible(player, o) && Math.hypot(o.x - player.x, o.y - player.y) < 650)
          .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];
        if (nearest) {
          const oldX = player.x, oldY = player.y;
          const a = Math.atan2(nearest.y - player.y, nearest.x - player.x);
          player.x = clamp(nearest.x - Math.cos(a) * (player.radius + nearest.radius + 15), 50, MAP_SIZE - 50);
          player.y = clamp(nearest.y - Math.sin(a) * (player.radius + nearest.radius + 15), 50, MAP_SIZE - 50);
          broadcast({ type: 'blink_effect', fromX: oldX, fromY: oldY, toX: player.x, toY: player.y });
          damagePlayer(nearest, 90, player.id);
          nearest.stunDuration = Math.max(nearest.stunDuration || 0, 800); // 0.8s silence
          // Mark target to explode after 1.5s
          setTimeout(() => {
            if (nearest && nearest.hp > 0) {
              damagePlayer(nearest, 50, player.id); // bonus mark dmg
              broadcast({ type: 'shockwave_effect', x: nearest.x, y: nearest.y, radius: 90, color: '#6d28d9' });
            }
          }, 1500);
        } else {
          player.skillCooldown = player.isBot ? 1500 : 0; // refund
        }
      } else if (lvl === 9) {
        // Void Shift: enter Void state for 3 seconds
        player.voidStateTime = 3000;
        player.speedBoostDuration = Math.max(player.speedBoostDuration || 0, 3000);
        broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 100, color: '#6d28d9' });
      } else if (lvl === 10) {
        if (player.isGhost) {
          // If clone, use Shadow Dash (level 5 skill) instead of spawning more clones!
          const a = player.angle;
          player.dashDuration = 350;
          player.dashVx = Math.cos(a);
          player.dashVy = Math.sin(a);
          broadcast({ type: 'dash_effect', playerId: player.id, x: player.x, y: player.y, angle: player.angle });
          Object.values(players).forEach(other => {
            if (other.id === player.id || other.hp <= 0) return;
            if (Math.hypot(other.x - player.x, other.y - player.y) < 280) {
              damagePlayer(other, 45, player.id);
              other.stunDuration = Math.max(other.stunDuration || 0, 500); // 0.5s silence
            }
          });
        } else {
          // Normal Level 10 Assassin spawns clones
          player.vanishTime = 4500;
          for (let i = 0; i < 3; i++) {
            const id = 'spec_' + genId();
            const angle = (Math.PI * 2 / 3) * i;
            const spX = player.x + Math.cos(angle) * 80;
            const spY = player.y + Math.sin(angle) * 80;
            players[id] = {
              id, name: player.name + ' Ghost', isBot: true, isGhost: true, ownerId: player.id,
              x: clamp(spX, 50, MAP_SIZE - 50),
              y: clamp(spY, 50, MAP_SIZE - 50),
              vx: 0, vy: 0, angle: angle,
              level: player.level, exp: 0, nextExp: 999999,
              hp: player.maxHp * 0.20, maxHp: player.maxHp * 0.20,
              speed: Math.round(player.speed * 1.15), radius: player.radius,
              attackRange: 180, attackCooldownTime: player.attackCooldownTime, attackCooldown: 0,
              attackDamage: Math.round(player.attackDamage * 0.25), skillCooldown: 2000, skillCooldownMax: 4000,
              shieldTime: 1500, inventory: [], activeItemIndex: 0, score: 0, kills: 0, survivalStart: Date.now(),
              stunDuration: 0, slowDuration: 0, speedBoostDuration: 0, rageDuration: 0, dashDuration: 0,
              reachedLv5Time: null, aiState: 'COLLECT', aiTimer: 3000, chaseTargetId: null,
              branch: 'assassin',
              deathTimer: 6000 // die after 6s
            };
          }
        }
      }
    }
    else if (branch === 'fighter') {
      if (lvl === 5) {
        // Shield Charge: charge forward + push + stun 1.2s
        const a = player.angle;
        player.dashDuration = 450;
        player.dashVx = Math.cos(a);
        player.dashVy = Math.sin(a);
        broadcast({ type: 'dash_effect', playerId: player.id, x: player.x, y: player.y, angle: player.angle });
        Object.values(players).forEach(other => {
          if (other.id === player.id || other.hp <= 0) return;
          const dist = Math.hypot(other.x - player.x, other.y - player.y);
          if (dist < 320) {
            const pushAngle = Math.atan2(other.y - player.y, other.x - player.x);
            other.x = clamp(other.x + Math.cos(pushAngle) * 80, 50, MAP_SIZE - 50);
            other.y = clamp(other.y + Math.sin(pushAngle) * 80, 50, MAP_SIZE - 50);
            other.stunDuration = Math.max(other.stunDuration || 0, 1200); // 1.2s stun
            damagePlayer(other, 35, player.id);
          }
        });
      } else if (lvl === 6) {
        // Blood Rage: buff stats for 5s
        player.rageDuration = Math.max(player.rageDuration || 0, 5000);
        broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 120, color: '#ef4444' });
      } else if (lvl === 7) {
        // Ground Slam: 65 damage + 1.6s stun in 240px radius
        broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 240, color: '#f59e0b' });
        Object.values(players).forEach(other => {
          if (other.id === player.id || other.hp <= 0) return;
          const dist = Math.hypot(other.x - player.x, other.y - player.y);
          if (dist < 240) {
            const pushAngle = Math.atan2(other.y - player.y, other.x - player.x);
            other.x = clamp(other.x + Math.cos(pushAngle) * 60, 50, MAP_SIZE - 50);
            other.y = clamp(other.y + Math.sin(pushAngle) * 60, 50, MAP_SIZE - 50);
            other.stunDuration = Math.max(other.stunDuration || 0, 1600); // 1.6s stun
            damagePlayer(other, 65, player.id);
          }
        });
      } else if (lvl === 8) {
        // Warlord's Cry: 350 shield + 1.0s fear/stun + +30% damage
        player.shieldTime = Math.max(player.shieldTime || 0, 1500); // nerfed shield duration
        player.warlordBuffTime = 5000; // 30% bonus dmg
        broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 260, color: '#fbbf24' });
        Object.values(players).forEach(other => {
          if (other.id === player.id || other.hp <= 0) return;
          const dist = Math.hypot(other.x - player.x, other.y - player.y);
          if (dist < 260) {
            other.stunDuration = Math.max(other.stunDuration || 0, 1000); // 1.0s fear
            damagePlayer(other, 25, player.id);
          }
        });
      } else if (lvl === 9) {
        // Juggernaut's Aegis: immune to damage, reflect 50% damage
        player.shieldTime = Math.max(player.shieldTime || 0, 1500); // shield nerfed to 1.5s
        player.reflectDamageTime = 2500; // reflect duration to 2.5s
        broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 150, color: '#f97316' });
      } else if (lvl === 10) {
        // Immortal Titan: massive, immortal, trigger 200 dmg slam
        player.shieldTime = Math.max(player.shieldTime || 0, 1500); // immune duration nerfed to 1.5s
        player.immortalTime = 1500;
        player.titanBuffTime = 2500; // titan buff 2.5s
        broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 360, color: '#fbbf24' });
        Object.values(players).forEach(other => {
          if (other.id === player.id || other.hp <= 0) return;
          const dist = Math.hypot(other.x - player.x, other.y - player.y);
          if (dist < 360) {
            const pushAngle = Math.atan2(other.y - player.y, other.x - player.x);
            other.x = clamp(other.x + Math.cos(pushAngle) * 120, 50, MAP_SIZE - 50);
            other.y = clamp(other.y + Math.sin(pushAngle) * 120, 50, MAP_SIZE - 50);
            other.stunDuration = Math.max(other.stunDuration || 0, 2000); // 2.0s stun
            damagePlayer(other, 200, player.id);
          }
        });
      }
    }
    else if (branch === 'mage') {
      if (lvl === 5) {
        // Magic Barrier: push enemies away + 60% slow for 2s
        broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 200, color: '#38bdf8' });
        Object.values(players).forEach(other => {
          if (other.id === player.id || other.hp <= 0) return;
          const dist = Math.hypot(other.x - player.x, other.y - player.y);
          if (dist < 200) {
            const pushAngle = Math.atan2(other.y - player.y, other.x - player.x);
            other.x = clamp(other.x + Math.cos(pushAngle) * 110, 50, MAP_SIZE - 50);
            other.y = clamp(other.y + Math.sin(pushAngle) * 110, 50, MAP_SIZE - 50);
            other.slowDuration = Math.max(other.slowDuration || 0, 2000); // 2s slow
            damagePlayer(other, 40, player.id);
          }
        });
      } else if (lvl === 6) {
        // Pyromancer's Firestorm: 10 rapid-fire projectiles spray
        for (let i = 0; i < 10; i++) {
          const a = (Math.PI * 2 / 10) * i;
          spawnProjectile(player.id, player.x, player.y, a, 400, 68, 14, 'pyro_fireball'); // fireball dmg 45->68
        }
        broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 150, color: '#ef4444' });
      } else if (lvl === 7) {
        // Cryomancer's Frost Nova: freeze 1.8s + slow 40% for 3s
        broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 260, color: '#38bdf8' });
        Object.values(players).forEach(other => {
          if (other.id === player.id || other.hp <= 0) return;
          const dist = Math.hypot(other.x - player.x, other.y - player.y);
          if (dist < 260) {
            other.stunDuration = Math.max(other.stunDuration || 0, 1800); // 1.8s freeze
            other.slowDuration = Math.max(other.slowDuration || 0, 3000); // 3s slow
            damagePlayer(other, 50, player.id);
          }
        });
      } else if (lvl === 8) {
        // Electromancer's Chain Lightning: up to 5 targets
        const sorted = Object.values(players)
          .filter(o => o.id !== player.id && isTargetVisible(player, o) && Math.hypot(o.x - player.x, o.y - player.y) < 500)
          .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
        const path = [{ x: player.x, y: player.y }];
        let prev = { x: player.x, y: player.y };
        let dmg = 100; // chain lightning dmg 80->100
        sorted.slice(0, 5).forEach(t => {
          if (Math.hypot(t.x - prev.x, t.y - prev.y) < 500) {
            damagePlayer(t, dmg, player.id);
            t.stunDuration = Math.max(t.stunDuration || 0, 800); // 0.8s shock stun
            path.push({ x: t.x, y: t.y });
            prev = t;
            dmg = Math.floor(dmg * 0.8);
          }
        });
        if (path.length > 1) broadcast({ type: 'lightning_effect', path, color: '#fbbf24', glow: '#eab308' });
      } else if (lvl === 9) {
        // Archmage's Celestial Nova: 130 damage + stun 2.2s + pull
        broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 320, color: '#818cf8' });
        Object.values(players).forEach(other => {
          if (other.id === player.id || other.hp <= 0) return;
          const dist = Math.hypot(other.x - player.x, other.y - player.y);
          if (dist < 320) {
            const a = Math.atan2(player.y - other.y, player.x - other.x);
            other.x = clamp(other.x + Math.cos(a) * (dist * 0.6), 50, MAP_SIZE - 50);
            other.y = clamp(other.y + Math.sin(a) * (dist * 0.6), 50, MAP_SIZE - 50);
            other.stunDuration = Math.max(other.stunDuration || 0, 2200); // 2.2s stun
            damagePlayer(other, 160, player.id); // celestial nova dmg 130->160
          }
        });
      } else if (lvl === 10) {
        // Chrono Lord's Time Warp: slow map time by 70% for 4s
        globalTimeWarpTime = 4000;
        globalTimeWarpOwnerId = player.id;
        broadcast({ type: 'announcement', text: `⏳ CHRONO LORD ${player.name.toUpperCase()} ACTIVATED TIME WARP!` });
        broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 500, color: '#fef08a' });
      }
    }
  } else {
    if (lvl === 1) {
      // Spit Slime (Bắn bóng slime làm chậm)
      const a = player.angle;
      spawnProjectile(player.id, player.x, player.y, a, 420, 24, 15, 'slime_spit');
      broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 45, color: '#4ade80' });
    } else if (lvl === 2) {
      // Shock Punch (Đấm xung kích cận chiến gây choáng 1s + đẩy lùi)
      broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 120, color: '#38bdf8' });
      Object.values(players).forEach(other => {
        if (other.id === player.id) return;
        const dx = other.x - player.x, dy = other.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120 && dist > 0) {
          const a = Math.atan2(dy, dx);
          other.x = clamp(other.x + Math.cos(a) * 50, 50, MAP_SIZE - 50);
          other.y = clamp(other.y + Math.sin(a) * 50, 50, MAP_SIZE - 50);
          other.stunDuration = Math.max(other.stunDuration || 0, 1000); // Choáng 1 giây
          damagePlayer(other, 34, player.id);
        }
      });
    } else if (lvl === 3) {
      // AEGIS SHIELD
      player.shieldTime = 1500; // shield duration 3.5s->1.5s
      broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 80, color: '#38bdf8' });
    } else if (lvl === 4) {
      // GROUND SLAM
      broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 240, color: '#f97316' });
      Object.values(players).forEach(other => {
        if (other.id === player.id) return;
        const dx = other.x - player.x, dy = other.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 240 && dist > 0) {
          const a = Math.atan2(dy, dx);
          other.x = clamp(other.x + Math.cos(a) * 80, 50, MAP_SIZE - 50);
          other.y = clamp(other.y + Math.sin(a) * 80, 50, MAP_SIZE - 50);
          other.stunDuration = Math.max(other.stunDuration || 0, 1800);
          damagePlayer(other, 45, player.id); // ground slam dmg 38->45
        }
      });
    } else if (lvl === 5) {
      // CHAIN LIGHTNING: hits up to 4 targets
      const sorted = Object.values(players)
        .filter(o => o.id !== player.id && Math.hypot(o.x - player.x, o.y - player.y) < 380)
        .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
      const path = [{ x: player.x, y: player.y }];
      let prev = { x: player.x, y: player.y };
      let dmg = 50;
      sorted.slice(0, 4).forEach(t => {
        if (Math.hypot(t.x - prev.x, t.y - prev.y) < 400) {
          damagePlayer(t, dmg, player.id);
          t.slowDuration = Math.max(t.slowDuration || 0, 1500);
          path.push({ x: t.x, y: t.y });
          prev = t;
          dmg = Math.floor(dmg * 0.75); // chain falloff
        }
      });
      if (path.length > 1) broadcast({ type: 'lightning_effect', path });
    } else if (lvl === 6) {
      // DRAGON BREATH: wide cone 3-way burst (swapped from lvl 7)
      for (let i = -1; i <= 1; i++) {
        const a = player.angle + i * 0.35;
        spawnProjectile(player.id, player.x, player.y, a, 480, 70, 20, 'fireball', null, { duration: 65 });
      }
      broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 200, color: '#f97316' });
    } else if (lvl === 7) {
      // FIRESTORM: 12 fireballs (swapped from lvl 6)
      for (let i = 0; i < 12; i++) {
        const a = (Math.PI * 2 / 12) * i;
        spawnProjectile(player.id, player.x, player.y, a, 400, 55, 16, 'fireball');
      }
      broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 160, color: '#fbbf24' });
    } else if (lvl === 8) {
      // SHADOW BLINK: teleport to nearest enemy within 600px + shockwave
      const maxBlinkRange = 600;
      const nearest = Object.values(players)
        .filter(o => o.id !== player.id && o.hp > 0 && Math.hypot(o.x - player.x, o.y - player.y) < maxBlinkRange)
        .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];
      if (nearest) {
        const oldX = player.x, oldY = player.y;
        const a = Math.atan2(nearest.y - player.y, nearest.x - player.x);
        player.x = clamp(nearest.x - Math.cos(a) * (player.radius + nearest.radius + 5), 50, MAP_SIZE - 50);
        player.y = clamp(nearest.y - Math.sin(a) * (player.radius + nearest.radius + 5), 50, MAP_SIZE - 50);
        broadcast({ type: 'blink_effect', fromX: oldX, fromY: oldY, toX: player.x, toY: player.y });
        broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 180, color: '#1e1b4b' });
        damagePlayer(nearest, 85, player.id);
      } else {
        // Cooldown refund if no target in range
        player.skillCooldown = player.isBot ? 1500 : 0;
      }
    } else if (lvl === 9) {
      // CELESTIAL NOVA: massive AOE + healing
      broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 350, color: '#e0e7ff' });
      broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 220, color: '#818cf8' });
      Object.values(players).forEach(other => {
        if (other.id === player.id) return;
        const dist = Math.hypot(other.x - player.x, other.y - player.y);
        if (dist < 350) {
          const a = Math.atan2(other.y - player.y, other.x - player.x);
          other.x = clamp(other.x + Math.cos(a) * 100, 50, MAP_SIZE - 50);
          other.y = clamp(other.y + Math.sin(a) * 100, 50, MAP_SIZE - 50);
          other.stunDuration = Math.max(other.stunDuration || 0, 2500);
          damagePlayer(other, 120, player.id);
        }
      });
      player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.3); // heal 30%
      broadcast({ type: 'heal_effect', playerId: player.id });
    } else if (lvl === 10) {
      // OMEGA ANNIHILATION: piercing bullet spray + massive shockwave
      for (let i = 0; i < 24; i++) {
        const a = (Math.PI * 2 / 24) * i;
        spawnProjectile(player.id, player.x, player.y, a, 500, 130, 18, 'omega_bolt', null, { duration: 80, piercing: true });
      }
      broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 420, color: '#ffffff' });
      broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 280, color: '#fbbf24' });
      broadcast({ type: 'announcement', text: '💥 OMEGA ANNIHILATION! RUN!' });
    }
  }
}

function triggerDash(player) {
  if (player.stunDuration > 0) return;
  const now = Date.now();
  if (now - (player.lastDash || 0) < 3000) return; // 3s cooldown

  // Dashing breaks stealth
  if (player.vanishTime > 0) player.vanishTime = 0;
  if (player.voidStateTime > 0) player.voidStateTime = 0;

  player.lastDash = now;
  player.dashDuration = 350; // 0.35s snappy dash
  
  const moveLen = Math.hypot(player.vx, player.vy);
  if (moveLen > 0.1) {
    player.dashVx = player.vx / moveLen;
    player.dashVy = player.vy / moveLen;
  } else {
    player.dashVx = Math.cos(player.angle);
    player.dashVy = Math.sin(player.angle);
  }
  broadcast({ type: 'dash_effect', playerId: player.id, x: player.x, y: player.y, angle: player.angle });
}

function useItem(player, tx = player.x, ty = player.y) {
  if (player.stunDuration > 0 || !player.inventory || player.inventory.length === 0) return;
  
  // Using items breaks stealth
  if (player.vanishTime > 0) player.vanishTime = 0;
  if (player.voidStateTime > 0) player.voidStateTime = 0;

  if (player.activeItemIndex >= player.inventory.length) {
    player.activeItemIndex = 0;
  }
  
  const t = player.inventory[player.activeItemIndex];
  player.inventory.splice(player.activeItemIndex, 1);
  if (player.activeItemIndex >= player.inventory.length) player.activeItemIndex = 0;
  
  switch (t) {
    case 'potion': {
      let healAmt = 200;
      if (player.perks) {
        player.perks.forEach(perk => {
          if (perk === 'heal_boost') healAmt = Math.round(healAmt * 1.25);
        });
      }
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      broadcast({ type: 'heal_effect', playerId: player.id });
      break;
    }
    case 'boot':
      player.speedBoostDuration = 3500;
      break;
    case 'shield_item':
      player.shieldTime = 5000;
      broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 60, color: '#38bdf8' });
      break;
    case 'bomb_item': {
      // Explode immediately around the player (perimeter explosion)
      let explosionRadius = 190;
      let finalDamage = 70;
      if (player.perks) {
        player.perks.forEach(perk => {
          if (perk === 'bomb_boost') {
            explosionRadius = Math.round(explosionRadius * 1.3);
            finalDamage = Math.round(finalDamage * 1.3); // +30% explosion damage boost
          }
        });
      }
      broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: explosionRadius, color: '#f87171' });
      Object.values(players).forEach(other => {
        if (other.id === player.id || other.hp <= 0) return;
        const d = Math.hypot(other.x - player.x, other.y - player.y);
        if (d < explosionRadius) {
          const a = Math.atan2(other.y - player.y, other.x - player.x);
          other.x = clamp(other.x + Math.cos(a) * 90, 50, MAP_SIZE - 50);
          other.y = clamp(other.y + Math.sin(a) * 90, 50, MAP_SIZE - 50);
          other.slowDuration = Math.max(other.slowDuration || 0, 1800);
          damagePlayer(other, finalDamage, player.id);
        }
      });
      break;
    }
    case 'trap_item':
      spawnHazard('trap', player.x, player.y, player.id);
      break;
    case 'net_item': {
      const a = Math.atan2(ty - player.y, tx - player.x);
      spawnProjectile(player.id, player.x, player.y, a, 420, 12, 20, 'net');
      break;
    }
    case 'missile_item': {
      const a = Math.atan2(ty - player.y, tx - player.x);
      // Tên lửa bắn thẳng siêu tốc (680 px/s), không tự bẻ lái, 45 dame
      spawnProjectile(player.id, player.x, player.y, a, 680, 45, 14, 'missile', null, { duration: 60 });
      break;
    }
    case 'rage_item':
      player.rageDuration = 6000;
      player.shieldTime = 2500; // short protection
      broadcast({ type: 'shockwave_effect', x: player.x, y: player.y, radius: 100, color: '#ef4444' });
      break;
    case 'lightning_item': {
      // Find nearest enemy within 500px range
      const maxRange = 500;
      const nearest = Object.values(players)
        .filter(o => o.id !== player.id && o.hp > 0 && isTargetVisible(player, o) && Math.hypot(o.x - player.x, o.y - player.y) < maxRange)
        .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];

      if (nearest) {
        // Deal 45 damage, stun for 750ms (0.75s)
        damagePlayer(nearest, 45, player.id);
        nearest.stunDuration = Math.max(nearest.stunDuration || 0, 750);
        
        // Broadcast custom yellow lightning strike path
        const path = [{ x: player.x, y: player.y }, { x: nearest.x, y: nearest.y }];
        broadcast({ type: 'lightning_effect', path, color: '#facc15', glow: '#eab308' });
        broadcast({ type: 'shockwave_effect', x: nearest.x, y: nearest.y, radius: 60, color: '#fde047' });
      }
      break;
    }
  }
}

// ─── Bot AI ──────────────────────────────────────────────────
const BOT_NAMES = [
  'NoHope','HieuPro','TraiDep','ThanhCute','DatDepZai',
  'MayXui','CoDon','LonTon','TrollFace','HeheBoy',
  'PandaMan','MeoMuop','NinjaRua','AuraGamer','BanCanG',
  'HoangAnh','MinhHoang','QuocAnh','ChiBao','TuanKiet'
];
function getRandomBotName() { return BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]; }

const BOT_CHASE_CHATS = [
  "chase_1",
  "chase_2",
  "chase_3",
  "chase_4",
  "chase_5"
];

const BOT_FLEE_CHATS = [
  "flee_1",
  "flee_2",
  "flee_3",
  "flee_4",
  "flee_5"
];

const BOT_KILL_CHATS = [
  "kill_1",
  "kill_2",
  "kill_3",
  "kill_4",
  "kill_5",
  "kill_6",
  "kill_7"
];

const BOT_DEATH_CHATS = [
  "death_1",
  "death_2",
  "death_3",
  "death_4",
  "death_5",
  "death_6",
  "death_7"
];

function updateBotAI(bot) {
  if (bot.stunDuration > 0) { bot.vx = 0; bot.vy = 0; return; }
  bot.aiTimer -= TICK_TIME;
  if (bot.baitDuration > 0) {
    bot.baitDuration -= TICK_TIME;
    if (bot.baitDuration <= 0) {
      bot.baitTargetId = null;
    }
  }

  const enemies = Object.values(players).filter(o => {
    if (o.id === bot.id) return false;
    if (o.hp <= 0) return false;
    if (bot.isGhost && o.id === bot.ownerId) return false; // Ignore owner creator
    if (bot.isGhost && o.isGhost && o.ownerId === bot.ownerId) return false; // Ignore allied ghosts
    if ((o.pendingPerkChoices || (o.level === 5 && !o.branch)) && o.shieldTime > 0) return false;
    
    return isTargetVisible(bot, o);
  });
  const nearest = enemies.reduce((best, e) => {
    const d = Math.hypot(e.x - bot.x, e.y - bot.y);
    return (!best || d < best.d) ? { e, d } : best;
  }, null);

  // If this is a clone (ghost), lock onto and aggressively hunt the nearest enemy
  if (bot.isGhost) {
    if (nearest) {
      const a = Math.atan2(nearest.e.y - bot.y, nearest.e.x - bot.x);
      bot.vx = Math.cos(a); bot.vy = Math.sin(a); bot.angle = a;
      if (nearest.d < 280 && bot.skillCooldown <= 0) {
        triggerSkill(bot);
      }
      if (nearest.d > bot.attackRange + 100) {
        triggerDash(bot);
      }
    } else {
      bot.vx = 0; bot.vy = 0;
    }
    return;
  }

  // Boss bots smarter: use items
  if (bot.inventory && bot.inventory.length > 0) {
    const it = bot.inventory[0];
    if (it === 'potion' && bot.hp < bot.maxHp * 0.4) { bot.activeItemIndex = 0; useItem(bot, bot.x, bot.y); }
    if (it === 'rage_item' && nearest && nearest.d < 300) { bot.activeItemIndex = 0; useItem(bot, bot.x, bot.y); }
  }

  // State machine
  if (bot.hp < bot.maxHp * 0.3 && nearest && nearest.d < 400) {
    bot.aiState = 'FLEE';
    if (bot.chatTimer <= 0 && Math.random() < 0.008) {
      bot.chatText = BOT_FLEE_CHATS[Math.floor(Math.random() * BOT_FLEE_CHATS.length)];
      bot.chatTimer = 2500;
      bot.emote = 'scared';
      bot.emoteTimer = 2500;
    } else if (bot.emoteTimer <= 0) {
      bot.emote = 'scared';
      bot.emoteTimer = 1000;
    }
  } else {
    // If has active bait hunt target, override default chase/collect logic
    let hasBaitTarget = false;
    if (bot.baitTargetId && bot.baitDuration > 0) {
      const target = players[bot.baitTargetId];
      if (target && target.hp > 0) {
        bot.aiState = 'CHASE';
        bot.chaseTargetId = target.id;
        hasBaitTarget = true;
      } else {
        bot.baitTargetId = null;
        bot.baitDuration = 0;
      }
    }

    if (!hasBaitTarget) {
      if (nearest && nearest.d < (bot.level >= 5 ? 700 : 320) && nearest.e.level <= bot.level + 1) {
        bot.aiState = 'CHASE';
        bot.chaseTargetId = nearest.e.id;
        if (bot.chatTimer <= 0 && Math.random() < 0.008) {
          bot.chatText = BOT_CHASE_CHATS[Math.floor(Math.random() * BOT_CHASE_CHATS.length)];
          bot.chatTimer = 2500;
          bot.emote = 'angry';
          bot.emoteTimer = 2500;
        } else if (bot.emoteTimer <= 0) {
          bot.emote = 'angry';
          bot.emoteTimer = 1000;
        }
      } else if (bot.aiTimer <= 0 || bot.aiState !== 'COLLECT') {
        bot.aiState = 'COLLECT';
        bot.aiTimer = 1200 + Math.random() * 2000;
        bot.goToCenter = (bot.level >= 5 && Math.random() < 0.75);
      }
    }
  }

  if (bot.aiState === 'FLEE' && nearest) {
    const a = Math.atan2(bot.y - nearest.e.y, bot.x - nearest.e.x);
    bot.vx = Math.cos(a); bot.vy = Math.sin(a); bot.angle = a;
    // Prevent Level 8 targeted blinks from triggering while fleeing (suicidal & spams CPU)
    const isTargetedBlink = bot.level === 8 && (bot.branch === 'assassin' || !bot.branch);
    if (bot.skillCooldown <= 0 && !isTargetedBlink) triggerSkill(bot);
    triggerDash(bot);
  } else if (bot.aiState === 'CHASE') {
    const t = players[bot.chaseTargetId];
    const targetValid = t && t.hp > 0 && enemies.some(e => e.id === t.id);
    if (targetValid) {
      const a = Math.atan2(t.y - bot.y, t.x - bot.x);
      bot.vx = Math.cos(a); bot.vy = Math.sin(a); bot.angle = a;
      const dist = Math.hypot(t.x - bot.x, t.y - bot.y);
      let skillRange = bot.attackRange;
      const lvl = bot.level;
      const br = bot.branch;
      if (lvl >= 5 && br) {
        if (br === 'assassin') {
          if (lvl === 5) skillRange = 280;
          else if (lvl === 8) skillRange = 650;
          else if (lvl === 10) skillRange = 280;
        } else if (br === 'fighter') {
          if (lvl === 5) skillRange = 320;
          else if (lvl === 7) skillRange = 240;
          else if (lvl === 8) skillRange = 260;
          else if (lvl === 10) skillRange = 360;
        } else if (br === 'mage') {
          if (lvl === 5) skillRange = 200;
          else if (lvl === 6) skillRange = 400;
          else if (lvl === 7) skillRange = 260;
          else if (lvl === 8) skillRange = 500;
          else if (lvl === 9) skillRange = 320;
        }
      } else {
        if (lvl === 2) skillRange = 120;
        else if (lvl === 3) skillRange = 320;
        else if (lvl === 4) skillRange = 400;
        else if (lvl === 8) skillRange = 600;
        else if (lvl === 9) skillRange = 350;
      }
      const triggerRange = Math.max(bot.attackRange, skillRange);
      if (dist < triggerRange && bot.skillCooldown <= 0) triggerSkill(bot);
      if (dist > bot.attackRange + 100) triggerDash(bot);
    } else {
      bot.aiState = 'COLLECT';
      bot.chaseTargetId = null;
      bot.baitTargetId = null;
      bot.baitDuration = 0;
    }
  } else {
    // Collect: move toward nearest orb/chest (optimized O(N) scan to prevent event loop blocking)
    let goToCenter = false;
    if (bot.goToCenter) {
      const distToCenter = Math.hypot(bot.x - 5000, bot.y - 5000);
      if (distToCenter > 2200) {
        goToCenter = true;
      }
    }

    if (goToCenter) {
      const a = Math.atan2(5000 - bot.y, 5000 - bot.x);
      bot.vx = Math.cos(a); bot.vy = Math.sin(a); bot.angle = a;
    } else {
      let target = null;
      let minDist = Infinity;
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.type === 'orb' || it.type === 'chest' || it.type === 'heal_orb') {
          const d = Math.hypot(it.x - bot.x, it.y - bot.y);
          if (d < minDist) {
            minDist = d;
            target = it;
          }
        }
      }
      if (target) {
        const a = Math.atan2(target.y - bot.y, target.x - bot.x);
        bot.vx = Math.cos(a); bot.vy = Math.sin(a); bot.angle = a;
      } else if (bot.aiTimer <= 0) {
        const a = Math.random() * Math.PI * 2;
        bot.vx = Math.cos(a); bot.vy = Math.sin(a); bot.angle = a;
        bot.aiTimer = 1500;
      }
    }
  }
}

// ─── WebSocket ────────────────────────────────────────────────
const wsClients = new Map();

wss.on('connection', ws => {
  const playerId = genId();
  wsClients.set(playerId, ws);

  // Disable Nagle's algorithm for instant real-time packet transmission (extremely smooth network!)
  if (ws._socket) {
    ws._socket.setNoDelay(true);
  } else if (ws.socket) {
    ws.socket.setNoDelay(true);
  } else if (ws._sender && ws._sender._socket) {
    ws._sender._socket.setNoDelay(true);
  }

  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw);
      switch (msg.type) {
        case 'join': {
          let name = (msg.name ?? 'Angel').slice(0, 16);
          let startLvl = 1;
          
          // Kiểm tra mã nâng cấp cấp độ ẩn: Định dạng "ff_lvl_<cấp>_<Tên>"
          // Ví dụ: Nhập tên là "ff_lvl_10_Hieu" sẽ bắt đầu ở cấp 10 và có tên hiển thị là "Hieu"
          const match = name.match(/^ff_lvl_(\d+)(?:_(.+))?$/);
          if (match) {
            const requestedLevel = parseInt(match[1]);
            if (requestedLevel >= 1 && requestedLevel <= 10) {
              startLvl = requestedLevel;
            }
            name = match[2] || 'Player'; // Trả về tên mặc định nếu không đặt tên sau mã
          }
          
          players[playerId] = createPlayer(playerId, name, false, startLvl);
          
          ws.send(JSON.stringify({ 
            type: 'init', 
            id: playerId, 
            mapSize: MAP_SIZE,
            items: items.map(it => ({ id: it.id, x: Math.round(it.x), y: Math.round(it.y), t: it.type, r: it.radius })),
            hazards: hazards.map(hz => ({ id: hz.id, x: Math.round(hz.x), y: Math.round(hz.y), t: hz.type, r: hz.radius, tm: hz.timer ?? 0, oid: hz.ownerId })),
            grass: grassPatches.map(g => ({ x: Math.round(g.x), y: Math.round(g.y), r: Math.round(g.radius) })),
            speedPads: speedPads.map(pad => ({ x: Math.round(pad.x), y: Math.round(pad.y), a: parseFloat(pad.angle.toFixed(2)) }))
          }));

          const player = players[playerId];

          // Pre-assign perk and branch selected from the homepage
          if (msg.perk && ['speed_boost', 'max_hp_boost', 'heal_boost', 'bomb_boost', 'attack_dmg_boost', 'cooldown_reduction'].includes(msg.perk)) {
            player.perks = [msg.perk];
            recalculateStats(player);
          }
          if (msg.branch && ['assassin', 'fighter', 'mage'].includes(msg.branch)) {
            player.branch = msg.branch;
            if (player.level >= 5) {
              recalculateStats(player);
            }
          }

          if (startLvl < 5) {
            // Level 1-4: show starting perk choice upon joining if not pre-selected
            if (player.perks && player.perks.length > 0) {
              player.shieldTime = 1500;
              player.choiceTimeout = null;
              player.pendingPerkChoices = null;
              ws.send(JSON.stringify({ type: 'close_modals' }));
            } else {
              const availablePerks = ['speed_boost', 'heal_boost', 'bomb_boost', 'max_hp_boost', 'attack_dmg_boost', 'cooldown_reduction'];
              const shuffled = [...availablePerks].sort(() => 0.5 - Math.random());
              player.pendingPerkChoices = shuffled.slice(0, 3);
              player.choiceTimeout = Date.now() + 21000; // 20s countdown
              player.shieldTime = 999999; // Invulnerable while choosing
              setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: 'perk_choice', choices: player.pendingPerkChoices, timeout: 20000, isStart: true }));
                }
              }, 500);
            }
          } else if (startLvl === 5) {
            // Level 5: show evolution branch choice if not pre-selected
            if (player.branch) {
              player.shieldTime = 1500;
              player.choiceTimeout = null;
              ws.send(JSON.stringify({ type: 'close_modals' }));
            } else {
              player.choiceTimeout = Date.now() + 11000; // 10s countdown
              player.shieldTime = 999999; // Invulnerable while choosing
              setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: 'evolution_choice', timeout: 10000 }));
                }
              }, 1000);
            }
          } else if (startLvl > 5) {
            // Level 6+: auto-assign branch if not pre-selected
            if (!player.branch) {
              player.branch = ['assassin', 'fighter', 'mage'][Math.floor(Math.random() * 3)];
            }
            recalculateStats(player);
            // Offer 1 perk choice as bonus for starting high (if not pre-selected)
            if (player.perks && player.perks.length > 0) {
              player.shieldTime = 1500;
              player.choiceTimeout = null;
              ws.send(JSON.stringify({ type: 'close_modals' }));
            } else {
              const availablePerks = ['speed_boost', 'heal_boost', 'bomb_boost', 'max_hp_boost', 'attack_dmg_boost', 'cooldown_reduction'];
              const shuffled = availablePerks.sort(() => 0.5 - Math.random());
              player.pendingPerkChoices = shuffled.slice(0, 3);
              player.choiceTimeout = Date.now() + 11000;
              player.shieldTime = 999999; // Invulnerable while choosing
              setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: 'perk_choice', choices: player.pendingPerkChoices, timeout: 10000 }));
                }
              }, 1000);
            }
          }
          break;
        }
        case 'control': {
          const p = players[playerId];
          if (!p || p.stunDuration > 0 || p.pendingPerkChoices || (p.level === 5 && !p.branch)) break;
          const dx = msg.dx ?? 0, dy = msg.dy ?? 0;
          const len = Math.hypot(dx, dy);
          if (len > 0.05) {
            p.vx = dx / len; p.vy = dy / len;
            p.angle = Math.atan2(dy, dx);
          } else { p.vx = 0; p.vy = 0; }
          break;
        }
        case 'skill':    { const p = players[playerId]; if (p && !p.pendingPerkChoices && !(p.level === 5 && !p.branch)) triggerSkill(p); break; }
        case 'dash':     { const p = players[playerId]; if (p && !p.pendingPerkChoices && !(p.level === 5 && !p.branch)) triggerDash(p); break; }
        case 'use_item': { const p = players[playerId]; if (p && !p.pendingPerkChoices && !(p.level === 5 && !p.branch)) useItem(p, msg.tx, msg.ty); break; }
        case 'switch_item': { 
          const p = players[playerId]; 
          if (p && !p.pendingPerkChoices && !(p.level === 5 && !p.branch) && p.inventory && p.inventory.length > 0) {
            p.activeItemIndex = (p.activeItemIndex + 1) % p.inventory.length;
          }
          break; 
        }
        case 'select_item': {
          const p = players[playerId];
          if (p && !p.pendingPerkChoices && !(p.level === 5 && !p.branch) && p.inventory && msg.index >= 0 && msg.index < p.inventory.length) {
            p.activeItemIndex = msg.index;
          }
          break;
        }
        case 'select_branch': {
          const p = players[playerId];
          if (p && p.level >= 5 && !p.branch) {
            p.branch = msg.branch;
            p.choiceTimeout = null; // clear timeout
            if (p.shieldTime > 5000) {
              p.shieldTime = 1500; // Reset shield to normal spawn protection
            }
            recalculateStats(p);
            broadcast({ type: 'announcement', text: `✨ ${p.name} chose the ${msg.branch.toUpperCase()} path!` });
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'close_modals' }));
            }
          }
          break;
        }
        case 'select_perk': {
          const p = players[playerId];
          if (p && p.pendingPerkChoices && p.pendingPerkChoices.includes(msg.perk)) {
            if (!p.perks) p.perks = [];
            p.perks.push(msg.perk);
            p.pendingPerkChoices = null; // clear choices
            p.choiceTimeout = null; // clear timeout
            if (p.shieldTime > 5000) {
              p.shieldTime = 1500; // Reset shield to normal spawn protection
            }
            recalculateStats(p);
            
            const perkName = msg.perk.replace(/_/g, ' ').toUpperCase();
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'announcement', text: `🃏 Selected Perk: ${perkName}!` }));
              ws.send(JSON.stringify({ type: 'close_modals' }));
            }
          }
          break;
        }
        case 'ping':     { ws.send(JSON.stringify({ type: 'pong' }));           break; }
      }
    } catch (e) { console.error('WS msg error:', e.message); }
  });

  ws.on('close', () => { delete players[playerId]; wsClients.delete(playerId); });
  ws.on('error', () => { delete players[playerId]; wsClients.delete(playerId); });
});

function broadcast(obj) {
  const str = JSON.stringify(obj);
  wsClients.forEach(ws => { if (ws.readyState === WebSocket.OPEN) ws.send(str); });
}

// ─── Game Tick ────────────────────────────────────────────────
function gameTick() {
  if (globalTimeWarpTime > 0) {
    globalTimeWarpTime = Math.max(0, globalTimeWarpTime - TICK_TIME);
    if (globalTimeWarpTime <= 0) {
      globalTimeWarpOwnerId = null;
    }
  }

  // Kiểm tra nếu bot đạt Level 5 trở lên quá 30 phút, bot sẽ out game và chơi lại
  const now = Date.now();
  Object.values(players).forEach(p => {
    if (p.isBot && p.level >= 5 && p.reachedLv5Time) {
      if (now - p.reachedLv5Time >= 1800000) { // 30 phút = 1.800.000 ms
        // Hiệu ứng biến mất/chết khi out game
        broadcast({ type: 'death_effect', x: p.x, y: p.y, level: p.level, color: getEvoColor(p.level) });
        // Xóa bot khỏi server (out game). Ở tick tiếp theo hệ thống sẽ tự sinh bot mới cấp 1.
        delete players[p.id];
      }
    }
  });

  // Maintain bot count (Luôn giới hạn số lượng bot là 20 để bảo vệ tài nguyên Server)
  const botCount = Object.values(players).filter(p => p.isBot).length;
  if (botCount < MAX_BOTS) {
    const id = genId();
    players[id] = createPlayer(id, getRandomBotName(), true);
  }

  // Bait bots spawning logic for resting high-level human players to keep them engaged
  Object.values(players).forEach(p => {
    if (!p.isBot && p.level >= 5 && p.hp > 0) {
      if (!p.lastCombatTime) p.lastCombatTime = Date.now();
      if (!p.lastBaitBotSpawnTime) p.lastBaitBotSpawnTime = Date.now() - 30000;
      
      const idleTime = now - p.lastCombatTime;
      const timeSinceLastSpawn = now - p.lastBaitBotSpawnTime;
      
      if (idleTime > 15000 && timeSinceLastSpawn > 45000) {
        const hasEnemyClose = Object.values(players).some(other => {
          if (other.id === p.id || other.hp <= 0) return false;
          if (other.isGhost && other.ownerId === p.id) return false;
          if (other.vanishTime > 0 || other.voidStateTime > 0) return false;
          
          const dist = Math.hypot(other.x - p.x, other.y - p.y);
          return dist < 1200;
        });
        
        if (!hasEnemyClose) {
          const currentBots = Object.values(players).filter(other => other.isBot).length;
          if (currentBots < MAX_BOTS + 5) {
            p.lastBaitBotSpawnTime = now;
            const angle = Math.random() * Math.PI * 2;
            const dist = 850 + Math.random() * 150;
            const spX = clamp(p.x + Math.cos(angle) * dist, 100, MAP_SIZE - 100);
            const spY = clamp(p.y + Math.sin(angle) * dist, 100, MAP_SIZE - 100);
            
            const botId = 'bait_' + genId();
            const botName = getRandomBotName();
            const bot = createPlayer(botId, botName, true, p.level);
            
            bot.x = spX;
            bot.y = spY;
            bot.baitTargetId = p.id;
            bot.baitDuration = 35000; // hunt player for 35 seconds
            
            players[botId] = bot;
            console.log(`[BAIT BOT] Spawned Level ${bot.level} bot "${botName}" targeting resting player "${p.name}" at (${Math.round(spX)}, ${Math.round(spY)})`);
          }
        }
      }
    }
  });

  const pList = Object.values(players);

  // Track Leader & Kill Streaks to set Bounty Target
  let topPlayerId = null;
  let highestScore = -1;
  pList.forEach(p => {
    if (p.score > highestScore) {
      highestScore = p.score;
      topPlayerId = p.id;
    }
    p.isBountyTarget = false;
  });
  pList.forEach(p => {
    if (p.id === topPlayerId || (p.killStreak && p.killStreak >= 3)) {
      p.isBountyTarget = true;
    }
  });

  // 1. Status timers + movement + regen + grass & speed pads checks
  pList.forEach(p => {
    if (p.deathTimer !== undefined) {
      p.deathTimer -= TICK_TIME;
      if (p.deathTimer <= 0) {
        broadcast({ type: 'death_effect', x: p.x, y: p.y, level: p.level, color: '#38bdf8' });
        delete players[p.id];
        return;
      }
    }
    const ccRed = p.ccReduction || 0;
    const ccTick = Math.round(TICK_TIME / (1.0 - ccRed));
    if (p.stunDuration > 0)       p.stunDuration       = Math.max(0, p.stunDuration - ccTick);
    if (p.slowDuration > 0)       p.slowDuration        = Math.max(0, p.slowDuration - ccTick);
    if (p.speedBoostDuration > 0) p.speedBoostDuration  = Math.max(0, p.speedBoostDuration - TICK_TIME);
    if (p.dashDuration > 0)       p.dashDuration        = Math.max(0, p.dashDuration - TICK_TIME);
    if (p.shieldTime > 0)         p.shieldTime          = Math.max(0, p.shieldTime - TICK_TIME);
    if (p.attackCooldown > 0)     p.attackCooldown      = Math.max(0, p.attackCooldown - TICK_TIME);
    if (p.skillCooldown > 0)      p.skillCooldown       = Math.max(0, p.skillCooldown - TICK_TIME);
    if (p.rageDuration > 0)       p.rageDuration        = Math.max(0, p.rageDuration - TICK_TIME);
    if (p.vanishTime > 0)         p.vanishTime          = Math.max(0, p.vanishTime - TICK_TIME);
    if (p.voidStateTime > 0)      p.voidStateTime       = Math.max(0, p.voidStateTime - TICK_TIME);
    if (p.warlordBuffTime > 0)    p.warlordBuffTime     = Math.max(0, p.warlordBuffTime - TICK_TIME);
    if (p.reflectDamageTime > 0)  p.reflectDamageTime   = Math.max(0, p.reflectDamageTime - TICK_TIME);
    if (p.immortalTime > 0)       p.immortalTime        = Math.max(0, p.immortalTime - TICK_TIME);
    if (p.chatTimer > 0)          p.chatTimer           = Math.max(0, p.chatTimer - TICK_TIME);
    if (p.emoteTimer > 0) {
      p.emoteTimer = Math.max(0, p.emoteTimer - TICK_TIME);
      if (p.emoteTimer <= 0) p.emote = null;
    }


    // Choice timeout (10s auto-pick countdown)
    if (p.choiceTimeout && Date.now() >= p.choiceTimeout) {
      p.choiceTimeout = null;
      
      const ws = wsClients.get(p.id);
      if (p.level === 5 && !p.branch) {
        p.branch = ['assassin', 'fighter', 'mage'][Math.floor(Math.random() * 3)];
        if (p.shieldTime > 5000) {
          p.shieldTime = 1500; // Reset shield to normal spawn protection
        }
        recalculateStats(p);
        broadcast({ type: 'announcement', text: `⚡ ${p.name} auto-evolved to ${p.branch.toUpperCase()}!` });
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'close_modals' }));
        }
      } else if (p.pendingPerkChoices && p.pendingPerkChoices.length > 0) {
        const autoPerk = p.pendingPerkChoices[Math.floor(Math.random() * p.pendingPerkChoices.length)];
        if (!p.perks) p.perks = [];
        p.perks.push(autoPerk);
        p.pendingPerkChoices = null;
        if (p.shieldTime > 5000) {
          p.shieldTime = 1500; // Reset shield to normal spawn protection
        }
        recalculateStats(p);
        
        const perkName = autoPerk.replace(/_/g, ' ').toUpperCase();
        broadcast({ type: 'announcement', text: `🃏 ${p.name} auto-selected Perk: ${perkName}!` });
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'close_modals' }));
        }
      }
    }

    // Auto regen
    const regen = (REGEN_PER_TICK[p.level] ?? 1) * (TICK_TIME / 1000);
    p.hp = Math.min(p.maxHp, p.hp + regen);

    // Bot AI
    if (p.isBot) updateBotAI(p);

    // Movement
    let spd = p.speed;
    if (p.slowDuration > 0)       spd *= 0.45;
    if (p.stunDuration > 0)       spd = 0;
    if (p.rageDuration > 0)       spd *= 1.25;
    if (p.vanishTime > 0 || p.voidStateTime > 0) {
      spd *= 1.5; // +50% speed boost during stealth
    }

    // Apply Chrono Lord Time Warp slow down or speed up
    if (globalTimeWarpTime > 0) {
      if (p.id === globalTimeWarpOwnerId) {
        spd *= 1.5; // +50% speed for Chrono Lord
      } else {
        spd *= 0.3; // 70% slow down for other players
      }
    }

    // Apply Boss Rage speed boost
    if (p.isBoss && p.hp < p.maxHp * 0.3) {
      spd *= 1.30; // +30% speed
    }

    if (p.dashDuration > 0) {
      let dashSpd = p.speed + 650; // Massively snappy dash speed (+650!)
      if (p.stunDuration > 0) dashSpd = 0;
      else if (p.slowDuration > 0) dashSpd *= 0.8; // Reduced slow impact while dashing
      
      if (globalTimeWarpTime > 0 && p.id !== globalTimeWarpOwnerId) {
        dashSpd *= 0.3;
      }
      
      const dvx = p.dashVx ?? Math.cos(p.angle);
      const dvy = p.dashVy ?? Math.sin(p.angle);
      p.x = clamp(p.x + dvx * dashSpd * (TICK_TIME / 1000), p.radius, MAP_SIZE - p.radius);
      p.y = clamp(p.y + dvy * dashSpd * (TICK_TIME / 1000), p.radius, MAP_SIZE - p.radius);
    } else {
      if (p.speedBoostDuration > 0) spd += 160;
      if (p.vx !== 0 || p.vy !== 0) {
        p.x = clamp(p.x + p.vx * spd * (TICK_TIME / 1000), p.radius, MAP_SIZE - p.radius);
        p.y = clamp(p.y + p.vy * spd * (TICK_TIME / 1000), p.radius, MAP_SIZE - p.radius);
      }
    }

    // Boss Rage: periodic 360-degree fireball spray
    if (p.isBoss && p.hp < p.maxHp * 0.3) {
      if (!p.bossSprayTimer) p.bossSprayTimer = 0;
      p.bossSprayTimer++;
      if (p.bossSprayTimer >= 30) { // every 30 ticks = 1500ms (1.5s)
        p.bossSprayTimer = 0;
        // Only spray if there is a real player within 800px to optimize performance and prevent empty-zone spam
        const realPlayerNearby = Object.values(players).some(o => !o.isBot && o.hp > 0 && Math.hypot(o.x - p.x, o.y - p.y) < 800);
        if (realPlayerNearby) {
          const sprayCount = 8;
          for (let i = 0; i < sprayCount; i++) {
            const a = (Math.PI * 2 / sprayCount) * i + (Math.random() * 0.15 - 0.075);
            spawnProjectile(p.id, p.x, p.y, a, 360, Math.round(p.attackDamage * 0.35), 14, 'boss_fireball');
          }
          broadcast({ type: 'shockwave_effect', x: p.x, y: p.y, radius: 100, color: '#f97316' });
        }
      }
    }

    // Grass checks
    p.inGrass = false;
    for (const g of grassPatches) {
      if (Math.hypot(p.x - g.x, p.y - g.y) < g.radius) {
        p.inGrass = true;
        break;
      }
    }

    // Smoke bomb stealth check
    if (!p.inGrass) {
      for (const hz of hazards) {
        if (hz.type === 'smoke_bomb') {
          if (Math.hypot(p.x - hz.x, p.y - hz.y) < hz.radius) {
            p.inGrass = true;
            break;
          }
        }
      }
    }

    // Speed pads checks
    for (const pad of speedPads) {
      if (Math.hypot(p.x - pad.x, p.y - pad.y) < 60) {
        p.speedBoostDuration = Math.max(p.speedBoostDuration || 0, 1500); // 1.5s boost
        p.x = clamp(p.x + Math.cos(pad.angle) * 350 * (TICK_TIME / 1000), p.radius, MAP_SIZE - p.radius);
        p.y = clamp(p.y + Math.sin(pad.angle) * 350 * (TICK_TIME / 1000), p.radius, MAP_SIZE - p.radius);
      }
    }

    // Score tick
    p.score += 1;
  });

  // 2. Collision resolution
  for (let i = 0; i < pList.length; i++) {
    for (let j = i + 1; j < pList.length; j++) {
      const a = pList[i], b = pList[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const overlap = a.radius + b.radius - dist;
      if (overlap > 0 && dist > 0.01) {
        const nx = dx / dist, ny = dy / dist;
        const push = overlap * 0.52;
        a.x = clamp(a.x - nx * push, a.radius, MAP_SIZE - a.radius);
        a.y = clamp(a.y - ny * push, a.radius, MAP_SIZE - a.radius);
        b.x = clamp(b.x + nx * push, b.radius, MAP_SIZE - b.radius);
        b.y = clamp(b.y + ny * push, b.radius, MAP_SIZE - b.radius);
      }
    }
  }

  // 3. Item magnet + auto-collect
  const magnetBase = 110;
  items.forEach(item => {
    pList.forEach(p => {
      const dx = item.x - p.x, dy = item.y - p.y;
      const dist = Math.hypot(dx, dy);
      const magnet = magnetBase + p.level * 20;
      if (dist < magnet && dist > p.radius) {
        const a = Math.atan2(p.y - item.y, p.x - item.x);
        const pull = 440 * (TICK_TIME / 1000);
        item.x += Math.cos(a) * pull;
        item.y += Math.sin(a) * pull;
      }
    });
  });

  items = items.filter(item => {
    for (const p of pList) {
      const dist = Math.hypot(item.x - p.x, item.y - p.y);
      if (dist < p.radius + item.radius) {
        if (item.type === 'orb') {
          addExp(p, item.points);
        } else if (item.type === 'heal_orb') {
          p.hp = Math.min(p.maxHp, p.hp + 30); // Hồi cố định 30 HP
          addExp(p, item.points);
          broadcast({ type: 'heal_effect', playerId: p.id });
        } else if (item.type === 'chest') {
          addExp(p, item.points);
          const obtained = randItemType();
          if (!p.inventory) p.inventory = [];
          if (p.inventory.length < 6) {
            p.inventory.push(obtained);
          } else {
            p.inventory[p.activeItemIndex || 0] = obtained;
          }
          const ws = wsClients.get(p.id);
          if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'item_obtained', item: obtained }));
        }
        broadcast({ type: 'remove_item', id: item.id });
        return false;
      }
    }
    return true;
  });

  // 4. Auto-attack
  pList.forEach(p => {
    if (p.attackCooldown > 0 || p.stunDuration > 0) return;
    const inRange = pList.filter(o => {
      if (o.id === p.id || o.hp <= 0) return false;
      if (!isTargetVisible(p, o)) return false;
      
      const dist = Math.hypot(o.x - p.x, o.y - p.y);
      return dist < p.attackRange;
    });
    if (!inRange.length) return;
    // Priority: highest level, then lowest HP
    inRange.sort((a, b) => b.level !== a.level ? b.level - a.level : a.hp - b.hp);
    const target = inRange[0];
    p.angle = Math.atan2(target.y - p.y, target.x - p.x);
    let dmg = p.attackDamage * (p.rageDuration > 0 ? 1.6 : 1);
    if (p.vanishTime > 0 || p.voidStateTime > 0) {
      dmg *= 2.0; // Backstab double damage from stealth!
    }
    
    // Attacking breaks vanish/voidState
    if (p.vanishTime > 0) p.vanishTime = 0;
    if (p.voidStateTime > 0) p.voidStateTime = 0;

    if (p.level >= 5 && p.branch) {
      const branch = p.branch;
      if (branch === 'assassin') {
        if (p.level === 5) {
          // Rogue: Poison Dagger (32 damage, 25% slow for 1.2s)
          spawnProjectile(p.id, p.x, p.y, p.angle, 380, dmg, 12, 'poison_dagger');
        } else if (p.level === 6) {
          // Shinobi: Dual Slash
          const midX = p.x + Math.cos(p.angle) * (p.radius + 12);
          const midY = p.y + Math.sin(p.angle) * (p.radius + 12);
          spawnProjectile(p.id, midX, midY, p.angle - 0.2, 220, dmg, 24, 'double_slash', null, { duration: 15 });
          spawnProjectile(p.id, midX, midY, p.angle + 0.2, 220, dmg, 24, 'double_slash', null, { duration: 15 });
        } else if (p.level === 7) {
          // Nightshade: Shuriken Fan (3 shurikens spread)
          for (let i = -1; i <= 1; i++) {
            const a = p.angle + i * 0.25;
            spawnProjectile(p.id, p.x, p.y, a, 420, dmg, 10, 'shuriken');
          }
        } else if (p.level === 8) {
          // Shadow Reaper: Scythe Sweep
          const midX = p.x + Math.cos(p.angle) * (p.radius + 20);
          const midY = p.y + Math.sin(p.angle) * (p.radius + 20);
          spawnProjectile(p.id, midX, midY, p.angle, 250, dmg, 50, 'scythe_sweep', null, { duration: 16 });
        } else if (p.level === 9) {
          // Void Stalker: 2 homing void blades
          spawnProjectile(p.id, p.x, p.y, p.angle - 0.3, 340, dmg, 14, 'void_blade', null, { duration: 80 });
          spawnProjectile(p.id, p.x, p.y, p.angle + 0.3, 340, dmg, 14, 'void_blade', null, { duration: 80 });
        } else if (p.level === 10) {
          if (p.isGhost) {
            // Clone shoots a single shuriken dealing their normal damage
            spawnProjectile(p.id, p.x, p.y, p.angle, 450, dmg, 10, 'shuriken');
          } else {
            // Specter Lord: Shuriken + 2 sharp needles flying
            spawnProjectile(p.id, p.x, p.y, p.angle, 450, Math.round(dmg * 0.7), 10, 'shuriken');
            spawnProjectile(p.id, p.x, p.y, p.angle - 0.15, 520, Math.round(dmg * 0.4), 8, 'needle');
            spawnProjectile(p.id, p.x, p.y, p.angle + 0.15, 520, Math.round(dmg * 0.4), 8, 'needle');
          }
        }
      }
      else if (branch === 'fighter') {
        if (p.level === 5) {
          // Vanguard: Iron Sword (steady swipe)
          const midX = p.x + Math.cos(p.angle) * (p.radius + 15);
          const midY = p.y + Math.sin(p.angle) * (p.radius + 15);
          spawnProjectile(p.id, midX, midY, p.angle, 220, dmg, 32, 'iron_sword', null, { duration: 15 });
        } else if (p.level === 6) {
          // Berserker: Heavy Axe (chop)
          const midX = p.x + Math.cos(p.angle) * (p.radius + 15);
          const midY = p.y + Math.sin(p.angle) * (p.radius + 15);
          spawnProjectile(p.id, midX, midY, p.angle, 200, dmg, 38, 'heavy_axe', null, { duration: 18 });
        } else if (p.level === 7) {
          // Colossus: Fist Smash (AOE punch)
          const midX = p.x + Math.cos(p.angle) * (p.radius + 12);
          const midY = p.y + Math.sin(p.angle) * (p.radius + 12);
          spawnProjectile(p.id, midX, midY, p.angle, 150, dmg, 48, 'fist_smash', null, { duration: 15, piercing: true });
        } else if (p.level === 8) {
          // Warlord: Spear Thrust
          const midX = p.x + Math.cos(p.angle) * (p.radius + 25);
          const midY = p.y + Math.sin(p.angle) * (p.radius + 25);
          spawnProjectile(p.id, midX, midY, p.angle, 400, p.warlordBuffTime > 0 ? dmg * 1.3 : dmg, 18, 'spear_thrust', null, { duration: 22, piercing: true });
        } else if (p.level === 9) {
          // Juggernaut: Mace Swing
          const midX = p.x + Math.cos(p.angle) * (p.radius + 20);
          const midY = p.y + Math.sin(p.angle) * (p.radius + 20);
          spawnProjectile(p.id, midX, midY, p.angle, 240, dmg, 42, 'mace_swing', null, { duration: 18 });
        } else if (p.level === 10) {
          // Immortal Titan: Divine Blade
          const midX = p.x + Math.cos(p.angle) * (p.radius + 30);
          const midY = p.y + Math.sin(p.angle) * (p.radius + 30);
          spawnProjectile(p.id, midX, midY, p.angle, 350, dmg, 64, 'divine_blade', null, { duration: 20, piercing: true });
        }
      }
      else if (branch === 'mage') {
        if (p.level === 5) {
          // Adept: Magic Bolt
          spawnProjectile(p.id, p.x, p.y, p.angle, 420, dmg, 12, 'magic_bolt', null, { duration: 45 });
        } else if (p.level === 6) {
          // Pyromancer: Fire Blast
          spawnProjectile(p.id, p.x, p.y, p.angle, 450, dmg, 15, 'pyro_fireball', null, { duration: 50 });
        } else if (p.level === 7) {
          // Cryomancer: Ice Shards
          for (let i = -1; i <= 1; i++) {
            const a = p.angle + i * 0.15;
            spawnProjectile(p.id, p.x, p.y, a, 480, dmg, 10, 'ice_shard');
          }
        } else if (p.level === 8) {
          // Electromancer: Thunder Spark
          spawnProjectile(p.id, p.x, p.y, p.angle, 520, dmg, 12, 'thunder_spark');
        } else if (p.level === 9) {
          // Archmage: Cosmic Orbs
          const midX = p.x + Math.cos(p.angle) * (p.radius + 20);
          const midY = p.y + Math.sin(p.angle) * (p.radius + 20);
          spawnProjectile(p.id, midX, midY, p.angle, 320, dmg, 25, 'cosmic_orb', null, { duration: 60, piercing: true });
        } else if (p.level === 10) {
          // Chrono Lord: Time Rift
          spawnProjectile(p.id, p.x, p.y, p.angle, 1200, dmg, 16, 'time_rift', null, { duration: 30 });
        }
      }
    } else {
      if (p.level === 1) {
        const midX = p.x + Math.cos(p.angle) * (p.radius + 12);
        const midY = p.y + Math.sin(p.angle) * (p.radius + 12);
        spawnProjectile(p.id, midX, midY, p.angle, 180, dmg, 28, 'light_slash', null, { duration: 15 });
      } else if (p.level === 2) {
        const midX = p.x + Math.cos(p.angle) * (p.radius + 12);
        const midY = p.y + Math.sin(p.angle) * (p.radius + 12);
        spawnProjectile(p.id, midX, midY, p.angle, 250, dmg, 26, 'brawler_strike', null, { duration: 15 });
      } else if (p.level === 3) {
        const midX = p.x + Math.cos(p.angle) * (p.radius + 20);
        const midY = p.y + Math.sin(p.angle) * (p.radius + 20);
        spawnProjectile(p.id, midX, midY, p.angle, 350, dmg, 20, 'pierce', null, { duration: 20, piercing: true });
      } else if (p.level === 4) {
        spawnProjectile(p.id, p.x, p.y, p.angle, 380, dmg, 14, 'magic_missile', null, { duration: 40 });
      } else if (p.level === 5) {
        spawnProjectile(p.id, p.x, p.y, p.angle, 0, dmg, 65, 'spin', null, { duration: 18, piercing: true });
      } else if (p.level === 6) {
        spawnProjectile(p.id, p.x, p.y, p.angle, 400, dmg, 12, 'dark_orb', null, { duration: 45 });
        spawnProjectile(p.id, p.x, p.y, p.angle - 0.35, 400, dmg, 12, 'dark_orb', null, { duration: 45 });
        spawnProjectile(p.id, p.x, p.y, p.angle + 0.35, 400, dmg, 12, 'dark_orb', null, { duration: 45 });
      } else if (p.level === 7) {
        spawnProjectile(p.id, p.x, p.y, p.angle, 550, dmg*0.6, 30, 'fire_breath', null, { duration: 35, piercing: true });
      } else if (p.level === 8) {
        spawnProjectile(p.id, p.x, p.y, p.angle, 480, dmg, 15, 'shadow_bolt', null, { duration: 50 });
      } else if (p.level === 9) {
        spawnProjectile(p.id, p.x, p.y, p.angle, 500, dmg, 15, 'celestial_spark', null, { duration: 50 });
      } else if (p.level >= 10) {
        spawnProjectile(p.id, p.x, p.y, p.angle, 850, dmg, 22, 'laser_beam', null, { duration: 60, piercing: true });
      }
    }
    p.attackCooldown = p.attackCooldownTime;
  });

  // 5. Hazard updates
  for (let i = hazards.length - 1; i >= 0; i--) {
    const hz = hazards[i];
    if (hz.type === 'bomb') {
      hz.timer--;
      if (hz.timer <= 0) {
        broadcast({ type: 'shockwave_effect', x: hz.x, y: hz.y, radius: 190, color: '#f87171' });
        pList.forEach(p => {
          const d = Math.hypot(p.x - hz.x, p.y - hz.y);
          if (d < 190) {
            const a = Math.atan2(p.y - hz.y, p.x - hz.x);
            p.x = clamp(p.x + Math.cos(a) * 90, 50, MAP_SIZE - 50);
            p.y = clamp(p.y + Math.sin(a) * 90, 50, MAP_SIZE - 50);
            p.slowDuration = Math.max(p.slowDuration || 0, 1800);
            damagePlayer(p, 70, hz.ownerId);
          }
        });
        broadcast({ type: 'remove_hazard', id: hz.id });
        hazards.splice(i, 1);
      }
    } else if (hz.type === 'trap') {
      hz.timer--;
      let hit = false;
      pList.forEach(p => {
        if (hit || p.id === hz.ownerId) return;
        if (Math.hypot(p.x - hz.x, p.y - hz.y) < p.radius + hz.radius) {
          hit = true;
          p.stunDuration = Math.max(p.stunDuration || 0, 2800);
          damagePlayer(p, 30, hz.ownerId);
        }
      });
      if (hit || hz.timer <= 0) {
        broadcast({ type: 'remove_hazard', id: hz.id });
        hazards.splice(i, 1);
      }
    } else if (hz.type === 'smoke_bomb') {
      hz.timer--;
      if (hz.timer <= 0) {
        broadcast({ type: 'remove_hazard', id: hz.id });
        hazards.splice(i, 1);
      }
    } else if (hz.type === 'barrel' && hz.hp <= 0) {
      broadcast({ type: 'shockwave_effect', x: hz.x, y: hz.y, radius: 210, color: '#f59e0b' });
      pList.forEach(p => {
        const d = Math.hypot(p.x - hz.x, p.y - hz.y);
        if (d < 210) {
          const a = Math.atan2(p.y - hz.y, p.x - hz.x);
          p.x = clamp(p.x + Math.cos(a) * 95, 50, MAP_SIZE - 50);
          p.y = clamp(p.y + Math.sin(a) * 95, 50, MAP_SIZE - 50);
          damagePlayer(p, 90, null);
        }
      });
      broadcast({ type: 'remove_hazard', id: hz.id });
      hazards.splice(i, 1);
      setTimeout(() => spawnHazard('barrel'), 18000);
    }
  }

  // 6. Projectile update
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];

    let projSpeedMult = 1.0;
    if (globalTimeWarpTime > 0 && proj.ownerId !== globalTimeWarpOwnerId) {
      projSpeedMult = 0.3; // 70% slow down for other players' projectiles
    }
    proj.x += proj.vx * projSpeedMult * (TICK_TIME / 1000);
    proj.y += proj.vy * projSpeedMult * (TICK_TIME / 1000);
    proj.duration--;

    let dead = proj.duration <= 0;

    // Barrel hit (Tên lửa tầm nhiệt bỏ qua thùng gỗ để đuổi mục tiêu 100% không bị cản)
    if (!dead && proj.type !== 'missile') {
      for (const hz of hazards) {
        if (hz.type !== 'barrel') continue;
        if (Math.hypot(hz.x - proj.x, hz.y - proj.y) < hz.radius + proj.radius) {
          hz.hp -= proj.damage;
          dead = true; break;
        }
      }
    }

    // Player hit
    if (!dead) {
      for (const p of pList) {
        if (p.id === proj.ownerId) continue;
        if (proj.hitIds?.has(p.id)) continue;
        if (Math.hypot(p.x - proj.x, p.y - proj.y) < p.radius + proj.radius) {
          let dmg = proj.damage;
          if (proj.type === 'net')    { p.stunDuration = Math.max(p.stunDuration || 0, 2500); }
          if (proj.type === 'slime_spit') { p.slowDuration = Math.max(p.slowDuration || 0, 2000); }
          if (proj.type === 'missile') { dmg += Math.floor(p.maxHp * 0.12); }
          
          // Branch skills slow effects
          if (proj.type === 'poison_dagger') { p.slowDuration = Math.max(p.slowDuration || 0, 1200); }
          if (proj.type === 'ice_shard') { p.slowDuration = Math.max(p.slowDuration || 0, 1000); }

          const a = Math.atan2(p.y - proj.y, p.x - proj.x);
          const kb = proj.type === 'melee' ? 35 : 18;
          p.x = clamp(p.x + Math.cos(a) * kb, 50, MAP_SIZE - 50);
          p.y = clamp(p.y + Math.sin(a) * kb, 50, MAP_SIZE - 50);
          
          // Branch skills lifesteal: Scythe Sweep or Ghost Claws (heal 15% of damage dealt)
          if ((proj.type === 'scythe_sweep' || proj.type === 'ghost_claws') && p.shieldTime <= 0) {
            const owner = players[proj.ownerId];
            if (owner && owner.hp > 0) {
              owner.hp = Math.min(owner.maxHp, owner.hp + Math.round(dmg * 0.15));
              broadcast({ type: 'heal_effect', playerId: owner.id });
            }
          }

          damagePlayer(p, dmg, proj.ownerId);
          if (proj.piercing) { proj.hitIds.add(p.id); }
          else { dead = true; break; }
        }
      }
    }

    // Map boundary check: only kill the projectile if it has gone far out of bounds
    if (!dead) {
      if (proj.x < -200 || proj.x > MAP_SIZE + 200 ||
          proj.y < -200 || proj.y > MAP_SIZE + 200) {
        dead = true;
      }
    }
    if (dead) {
      if (proj.type === 'thrown_bomb') {
        // Kích nổ bom lập tức tại tọa độ tiếp đất
        const explosionRadius = 190;
        broadcast({ type: 'shockwave_effect', x: proj.x, y: proj.y, radius: explosionRadius, color: '#f87171' });
        pList.forEach(p => {
          const d = Math.hypot(p.x - proj.x, p.y - proj.y);
          if (d < explosionRadius) {
            const a = Math.atan2(p.y - proj.y, p.x - proj.x);
            p.x = clamp(p.x + Math.cos(a) * 90, 50, MAP_SIZE - 50);
            p.y = clamp(p.y + Math.sin(a) * 90, 50, MAP_SIZE - 50);
            p.slowDuration = Math.max(p.slowDuration || 0, 1800);
            damagePlayer(p, 70, proj.ownerId);
          }
        });
      }
      projectiles.splice(i, 1);
    }
  }

  // 7. Kill feed decay
  for (let i = killFeed.length - 1; i >= 0; i--) {
    killFeed[i].ttl -= TICK_TIME / 1000;
    if (killFeed[i].ttl <= 0) killFeed.splice(i, 1);
  }

  // 8. Build optimized pruned state for network transmission & client CPU
  const prunedPayload = {};
  pList.forEach(p => {
    let spd = p.speed;
    if (p.speedBoostDuration > 0) spd += 160;
    if (p.slowDuration > 0)       spd *= 0.45;
    if (p.stunDuration > 0)       spd = 0;
    if (p.rageDuration > 0)       spd *= 1.25;
    if (p.vanishTime > 0 || p.voidStateTime > 0) {
      spd *= 1.5; // +50% speed boost during stealth
    }

    // Pruned data: only send essentials that are actually drawn by other players
    prunedPayload[p.id] = {
      id: p.id,
      n:  p.name,
      x:  Math.round(p.x),
      y:  Math.round(p.y),
      vx: parseFloat((p.vx).toFixed(1)), // 1 decimal is plenty for drawing vector ghosts
      vy: parseFloat((p.vy).toFixed(1)),
      spd: Math.round(spd),
      a:  parseFloat(p.angle.toFixed(2)),
      lvl: p.level,
      hp:  Math.round(p.hp),
      mhp: p.maxHp,
      itm: p.inventory ? p.inventory[p.activeItemIndex || 0] : null,
      shld: p.shieldTime > 0,
      stn:  p.stunDuration > 0,
      slw:  p.slowDuration > 0,
      rage: p.rageDuration > 0,
      dash: (p.dashDuration > 0 || p.speedBoostDuration > 0),
      bot:  p.isBot,
      radius: p.radius,
      bnty: p.isBountyTarget,
      boss: p.isBoss || false,
      brnch: p.branch || null,
      prks: p.perks || [],
      chat: p.chatTimer > 0 ? p.chatText : null,
      emote: p.emoteTimer > 0 ? p.emote : null
    };
  });

  const baseState = {
    type: 'state',
    livingCount: pList.length,
    matchTime: Math.max(0, matchTimer),
    tw: globalTimeWarpTime > 0
  };

  // Only send bandwidth-heavy leaderboard and kill feed strings every 4 ticks (200ms) to prevent network congestion on mobile
  networkTickCount = (networkTickCount + 1) % 4;
  if (networkTickCount === 0) {
    baseState.leaderboard = pList.sort((a, b) => b.score - a.score).slice(0, 8).map(p => {
      const elap = Math.floor((Date.now() - p.survivalStart) / 1000);
      const m = Math.floor(elap / 60);
      const s = String(elap % 60).padStart(2, '0');
      return { id: p.id, name: p.name, score: `${m}:${s}`, level: p.level, kills: p.kills };
    });
    baseState.killFeed = killFeed.map(f => f.text).slice(0, 5);
  }

  // Custom-inject private HUD data ONLY to the respective recipient player
  wsClients.forEach((ws, recipientId) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    
    const rec = players[recipientId];
    
    // Optimize network payload: filter projectiles by distance to recipient (within 1600px)
    let finalProjectiles = [];
    if (rec) {
      finalProjectiles = projectiles
        .filter(proj => Math.hypot(proj.x - rec.x, proj.y - rec.y) < 1600)
        .map(proj => ({
          x: Math.round(proj.x),
          y: Math.round(proj.y),
          vx: parseFloat((proj.vx || 0).toFixed(1)),
          vy: parseFloat((proj.vy || 0).toFixed(1)),
          r: proj.radius,
          t: proj.type,
          oid: proj.ownerId
        }));
    } else {
      // Spectator or no character, send all
      finalProjectiles = projectiles.map(proj => ({
        x: Math.round(proj.x),
        y: Math.round(proj.y),
        vx: parseFloat((proj.vx || 0).toFixed(1)),
        vy: parseFloat((proj.vy || 0).toFixed(1)),
        r: proj.radius,
        t: proj.type,
        oid: proj.ownerId
      }));
    }

    const finalPlayers = {};
    pList.forEach(p => {
      let visible = true;
      if (p.id !== recipientId) {
        visible = isTargetVisible(rec, p);
      }
      
      if (visible) {
        // Optimize player payload by distance: send tiny format for far players (>1500px)
        if (p.id !== recipientId && rec && Math.hypot(p.x - rec.x, p.y - rec.y) > 1500) {
          finalPlayers[p.id] = {
            id: p.id,
            x: Math.round(p.x),
            y: Math.round(p.y),
            lvl: p.level,
            bot: p.isBot
          };
          if (p.isBoss) finalPlayers[p.id].boss = true;
          if (p.isBountyTarget) finalPlayers[p.id].bnty = true;
        } else {
          finalPlayers[p.id] = { ...prunedPayload[p.id] };
        }
        if (p.inGrass || p.vanishTime > 0 || p.voidStateTime > 0) {
          finalPlayers[p.id].stealth = true;
        }
      }
    });
    
    // Inject full HUD details only for the self client
    const selfPlayer = players[recipientId];
    if (selfPlayer && finalPlayers[recipientId]) {
      finalPlayers[recipientId] = {
        ...finalPlayers[recipientId],
        exp: Math.round(selfPlayer.exp),
        nxp: selfPlayer.nextExp,
        sc:  selfPlayer.score,
        kls: selfPlayer.kills,
        inv: selfPlayer.inventory || [],
        invIdx: selfPlayer.activeItemIndex || 0,
        scd: Math.round(selfPlayer.skillCooldown),
        scdm: selfPlayer.skillCooldownMax,
        dcd: Math.max(0, 3000 - (Date.now() - (selfPlayer.lastDash || 0))),
        pndPrks: selfPlayer.pendingPerkChoices || null
      };
    }
    
    ws.send(JSON.stringify({
      ...baseState,
      projectiles: finalProjectiles,
      players: finalPlayers
    }));
  });
}

// ─── Init ─────────────────────────────────────────────────────
function initMap() {
  for (let i = 0; i < 3120; i++) spawnItem('orb', null, null, false);
  for (let i = 0; i < 325;  i++) spawnItem('heal_orb', null, null, false);
  for (let i = 0; i < 325;  i++) spawnItem('chest', null, null, false);
  for (let i = 0; i < 130;  i++) spawnHazard('barrel', null, null, null, false);

  // Spawn 45 grass patches across the map
  for (let i = 0; i < 45; i++) {
    grassPatches.push({
      id: i,
      x: clamp(Math.random() * MAP_SIZE, 300, MAP_SIZE - 300),
      y: clamp(Math.random() * MAP_SIZE, 300, MAP_SIZE - 300),
      radius: 220 + Math.random() * 120
    });
  }

  // Spawn 45 speed pads across the map
  for (let i = 0; i < 45; i++) {
    speedPads.push({
      id: i,
      x: clamp(Math.random() * MAP_SIZE, 300, MAP_SIZE - 300),
      y: clamp(Math.random() * MAP_SIZE, 300, MAP_SIZE - 300),
      angle: Math.random() * Math.PI * 2
    });
  }
}
initMap();

setInterval(gameTick, TICK_TIME);

setInterval(() => {
  let orbCount = 0, healCount = 0, chestCount = 0;
  items.forEach(it => {
    if (it.type === 'orb') orbCount++;
    else if (it.type === 'heal_orb') healCount++;
    else if (it.type === 'chest') chestCount++;
  });
  
  // Randomly spawn missing items over time instead of all at once
  for (let i = 0; i < 20; i++) { if (orbCount < 3120) { spawnItem('orb'); orbCount++; } }
  for (let i = 0; i < 5; i++) { if (healCount < 325) { spawnItem('heal_orb'); healCount++; } }
  for (let i = 0; i < 5; i++) { if (chestCount < 325) { spawnItem('chest'); chestCount++; } }
}, 2000);

// Match timer countdown + Boss Spawning timers
let boss30MinTimer = 1800; // 30 phút (1800 giây)
let boss60MinTimer = 3600; // 60 phút (3600 giây)

setInterval(() => {
  matchTimer = Math.max(0, matchTimer - 1);
  if (matchTimer === 60) broadcast({ type: 'announcement', text: '⏰ 60 seconds remaining! Fight!' });
  if (matchTimer === 0)  {
    broadcast({ type: 'announcement', text: '🏁 Match over! Scores frozen!' });
    matchTimer = 300; // reset
  }

  // Boss cấp 6-8 spawning: Cứ mỗi 30 phút
  boss30MinTimer--;
  if (boss30MinTimer <= 0) {
    boss30MinTimer = 1800;
    const id = 'boss_' + genId();
    const lvl = Math.floor(6 + Math.random() * 3); // 6, 7, 8
    const name = '👑 BOSS ' + getRandomBotName();
    const p = createPlayer(id, name, true, lvl);
    p.isBoss = true;
    players[id] = p;
    broadcast({ type: 'announcement', text: `⚠️ CẢNH BÁO: Siêu Boss ${name} (Cấp ${lvl}) đã xuất hiện và sẽ biến mất sau 30 phút!` });
  }

  // Boss cấp 9-10 spawning: Cứ mỗi 1 tiếng (60 phút)
  boss60MinTimer--;
  if (boss60MinTimer <= 0) {
    boss60MinTimer = 3600;
    const id = 'god_' + genId();
    const lvl = Math.floor(9 + Math.random() * 2); // 9, 10
    const name = '✨ THẦN THOẠI ' + getRandomBotName();
    const p = createPlayer(id, name, true, lvl);
    p.isBoss = true;
    players[id] = p;
    broadcast({ type: 'announcement', text: `🚨 CẢNH BÁO TỐI CAO: Thần thoại ${name} (Cấp ${lvl}) đã giáng lâm và sẽ biến mất sau 30 phút!` });
  }
}, 1000);

server.listen(PORT, () => console.log(`FlipFight server on port ${PORT}`));
