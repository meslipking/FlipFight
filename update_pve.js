const fs = require('fs');
const path = require('path');

const pvePath = path.join(__dirname, 'public', 'pve.js');
let code = fs.readFileSync(pvePath, 'utf8');

// 1. Insert SKINS and BRANCH_SKINS right after LEGENDARY_COMBOS
const legendaryCombosTarget = `const LEGENDARY_COMBOS = [
  { branch:'assassin',   needs:['shadow_blades','shadow_clone','void_pulse','poison_dart'], unlocks:'specter_storm' },
  { branch:'mage',       needs:['frost_aura','magic_missile','thunder_ring','meteor'],      unlocks:'celestial_nova' },
  { branch:'fighter',    needs:['shield_bash','earthquake','grid_bash','rally'],            unlocks:'titan_fortress' }, // wait, check if it was grid_bash or iron_wall?
  // Let's replace whatever is there for LEGENDARY_COMBOS to be safe.
];`;

// Let's find LEGENDARY_COMBOS definition in pve.js
const combosStart = code.indexOf('const LEGENDARY_COMBOS = [');
const combosEnd = code.indexOf('];', combosStart) + 2;
const originalCombos = code.substring(combosStart, combosEnd);

const skinsCode = `
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
`;

code = code.replace(originalCombos, originalCombos + skinsCode);

// 2. Add this.slashEffects in Constructor
code = code.replace(
  `this.hazards    = [];  // ground effects (briar patch, consecration, etc)`,
  `this.hazards    = [];  // ground effects (briar patch, consecration, etc)
    this.slashEffects = []; // slashes`
);

// 3. Update PveGame.update method
code = code.replace(
  `this.updateProjectiles(dt);
    this.updateParticles(dt);`,
  `this.updateProjectiles(dt);
    this.updateSlashEffects(dt);
    this.updateParticles(dt);`
);

// 4. Update updatePlayer movement vx/vy and attack animation decay
const originalUpdatePlayer = `  updatePlayer(dt) {
    const p = this.player;
    let dx = 0, dy = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp'])    dy -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown'])  dy += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft'])  dx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

    if (this.joystickVec) { dx = this.joystickVec.x; dy = this.joystickVec.y; }

    const len = Math.hypot(dx, dy);
    if (len > 0) { dx /= len; dy /= len; }

    const spd = p.speed * p.spdMult * (Date.now() < p.rallyUntil ? 1.5 : 1) * dt;
    p.x = Math.max(p.r, Math.min(WORLD_W - p.r, p.x + dx * spd));
    p.y = Math.max(p.r, Math.min(WORLD_H - p.r, p.y + dy * spd));

    if (len > 0) p.angle = Math.atan2(dy, dx);
    p.attackAnim = Math.max(0, p.attackAnim - dt * 4);

    // Invincibility frames
    if (p.invincible && Date.now() > p.invincibleUntil) p.invincible = false;
  }`;

const newUpdatePlayer = `  updatePlayer(dt) {
    const p = this.player;
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

    const spd = p.speed * p.spdMult * (Date.now() < p.rallyUntil ? 1.5 : 1) * dt;
    p.x = Math.max(p.r, Math.min(WORLD_W - p.r, p.x + dx * spd));
    p.y = Math.max(p.r, Math.min(WORLD_H - p.r, p.y + dy * spd));

    if (len > 0) p.angle = Math.atan2(dy, dx);
    p.attackAnim = Math.max(0, p.attackAnim - dt * 4);

    if (p.attackAnimObj && Date.now() - p.attackAnimObj.t > p.attackAnimObj.duration) {
      p.attackAnimObj = null;
    }

    // Invincibility frames
    if (p.invincible && Date.now() > p.invincibleUntil) p.invincible = false;
  }`;

code = code.replace(originalUpdatePlayer, newUpdatePlayer);

// 5. Update resume to prevent duplicate loops
const originalResume = `  resume() {
    this.paused = false;
    this.lastTime = performance.now();
    document.getElementById('pvePauseOverlay').classList.add('hidden');
    this.raf = requestAnimationFrame(t => this.loop(t));
  }`;

const newResume = `  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.lastTime = performance.now();
    document.getElementById('pvePauseOverlay').classList.add('hidden');
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(t => this.loop(t));
  }`;

code = code.replace(originalResume, newResume);

// 6. Update onLevelUp to pause first and pass callback
const originalOnLevelUp = `  onLevelUp() {
    const p = this.player;
    this.addFloat(p.x, p.y - 50, \`⬆️ LEVEL \${p.level}!\`, '#a78bfa', true);
    this.spawnParticles(p.x, p.y, '#a78bfa', 25, 6);
    this.showUpgradeChoice();
  }`;

const newOnLevelUp = `  onLevelUp() {
    const p = this.player;
    this.addFloat(p.x, p.y - 50, \`⬆️ LEVEL \${p.level}!\`, '#a78bfa', true);
    this.spawnParticles(p.x, p.y, '#a78bfa', 25, 6);
    this.pause();
    this.showUpgradeChoice(() => {
      this.resume();
    });
  }`;

code = code.replace(originalOnLevelUp, newOnLevelUp);

// 7. Update showUpgradeChoice card click handler
const originalCardClick = `      card.onclick = () => {
        choice.apply();
        screen.classList.add('hidden');
        if (callback) callback();
        else { this.spawnWave(this.wave); this.resume(); }
      };`;

const newCardClick = `      card.onclick = () => {
        choice.apply();
        screen.classList.add('hidden');
        if (callback) callback();
      };`;

code = code.replace(originalCardClick, newCardClick);

// 8. Update fireSkill start
code = code.replace(
  `fireSkill(id, level, def) {
    const p = this.player;
    const dmgScale = p.dmgMult * p.atkMult * (1 + (level - 1) * 0.35);`,
  `fireSkill(id, level, def) {
    const p = this.player;
    p.attackAnimObj = { t: Date.now(), duration: 200 }; // Trigger swing
    const dmgScale = p.dmgMult * p.atkMult * (1 + (level - 1) * 0.35);`
);

// 9. Update fireShieldBash to trigger fighter_slash
const originalShieldBash = `  fireShieldBash(dmg, lv) {
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
    p.attackAnim = 1;
    this.particles.push({ type:'ring', x: p.x, y: p.y, r: 0, maxR: r, color:'#facc15', life: 0.3, maxLife: 0.3 });
    this.spawnParticles(p.x, p.y, '#facc15', 15, 4);
  }`;

const newShieldBash = `  fireShieldBash(dmg, lv) {
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
    this.particles.push({ type:'ring', x: p.x, y: p.y, r: 0, maxR: r, color:'#facc15', life: 0.3, maxLife: 0.3 });
    this.spawnParticles(p.x, p.y, '#facc15', 15, 4);
  }`;

code = code.replace(originalShieldBash, newShieldBash);

// 10. Update fireVineWhip to trigger slash
const originalVineWhip = `  fireVineWhip(dmg, lv) {
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
  }`;

const newVineWhip = `  fireVineWhip(dmg, lv) {
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
  }`;

code = code.replace(originalVineWhip, newVineWhip);

// 11. Update fireVoidPulse to trigger assassin_slash
const originalVoidPulse = `  fireVoidPulse(dmg, lv) {
    const p = this.player;
    const r = (150 + lv * 40) * p.aoeMult;
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
    // Expanding ring
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (!this.running) return;
        this.particles.push({ type:'ring', x: p.x, y: p.y, r: 0, maxR: r * (0.5 + i * 0.25), color:'#7c3aed', life: 0.4, maxLife: 0.4 });
      }, i * 80);
    }
  }`;

const newVoidPulse = `  fireVoidPulse(dmg, lv) {
    const p = this.player;
    const r = (150 + lv * 40) * p.aoeMult;
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
  }`;

code = code.replace(originalVoidPulse, newVoidPulse);

// 12. Update fireThunderRing with lightning effect
const originalThunderRing = `  fireThunderRing(dmg, lv) {
    const p = this.player;
    const count = 8 + lv * 2;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this.spawnProjectile({ x: p.x, y: p.y, angle, speed: 380, dmg, radius: 7,
        color: '#fde047', trail: true, trailColor: '#eab308', pierce: true, maxPierces: 2,
        maxDist: 350 + lv * 50
      });
    }
    this.spawnParticles(p.x, p.y, '#fde047', 12, 3.5);
  }`;

const newThunderRing = `  fireThunderRing(dmg, lv) {
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
        maxDist: dist
      });
    }
    this.spawnParticles(p.x, p.y, '#fde047', 12, 3.5);
  }`;

code = code.replace(originalThunderRing, newThunderRing);

// 13. Update DOMContentLoaded handler to include chest history & equip bonuses
const originalDomLoaded = `window.addEventListener('DOMContentLoaded', () => {
  loadSaveData();
  renderInventory();
  updateEquipSlots();
  updateGoldDisplay();
  drawClassPreview('assassin');
  updateClassStats('assassin');
  buildInventoryGrid();
});`;

const newDomLoaded = `window.addEventListener('DOMContentLoaded', () => {
  loadSaveData();
  renderInventory();
  updateEquipSlots();
  updateGoldDisplay();
  updateEquipBonuses();
  updateChestHistory();
  drawClassPreview('assassin');
  updateClassStats('assassin');
  buildInventoryGrid();
});`;

code = code.replace(originalDomLoaded, newDomLoaded);

// 14. Inject drawSlashEffects call in draw()
code = code.replace(
  `    this.drawPlayer(ctx);
    this.drawProjectiles_(ctx);`,
  `    this.drawPlayer(ctx);
    this.drawProjectiles_(ctx);
    this.drawSlashEffects(ctx);`
);

// 15. Update updateParticles and drawParticles_ methods to support new spark, star, lightning, boom particles
const originalUpdateParticles = `  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      if (p.type === 'dot') {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.92; p.vy *= 0.92;
      }
      if (p.type === 'ring') {
        p.r += (p.maxR / p.maxLife) * dt;
      }
      if (p.type === 'orb') {
        // Fly toward player
        const dx = this.player.x - p.x, dy = this.player.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 30) { this.particles.splice(i, 1); continue; }
        const spd = 250 + (1 - p.life/p.maxLife) * 400;
        p.x += (dx/dist)*spd*dt; p.y += (dy/dist)*spd*dt;
      }
    }
  }`;

const newUpdateParticles = `  emitLightningEffect(fromX, fromY, toX, toY, color, glow) {
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
      
      if (p.type === 'dot') {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.92; p.vy *= 0.92;
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
      else if (p.type === 'orb') {
        const dx = this.player.x - p.x, dy = this.player.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 30) { this.particles.splice(i, 1); continue; }
        const spd = 250 + (1 - p.life/p.maxLife) * 400;
        p.x += (dx/dist)*spd*dt; p.y += (dy/dist)*spd*dt;
      }
    }
  }`;

code = code.replace(originalUpdateParticles, newUpdateParticles);

const originalDrawParticles = `  drawParticles_(ctx) {
    this.particles.forEach(p => {
      const alpha = Math.max(0, p.life / (p.maxLife || p.life));
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'dot') {
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, p.r * alpha), 0, Math.PI*2);
        ctx.fillStyle = p.color; ctx.shadowBlur = 8; ctx.shadowColor = p.color; ctx.fill();
      } else if (p.type === 'ring') {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.strokeStyle = p.color; ctx.lineWidth = 2 * alpha;
        ctx.shadowBlur = 10; ctx.shadowColor = p.color; ctx.stroke();
      } else if (p.type === 'orb') {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = p.color; ctx.shadowBlur = 10; ctx.shadowColor = p.color; ctx.fill();
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
      }
      ctx.restore();
    });
  }`;

const newDrawParticles = `  drawParticles_(ctx) {
    this.particles.forEach(p => {
      const alpha = Math.max(0, p.life / (p.maxLife || p.life));
      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'dot') {
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, p.r * alpha), 0, Math.PI*2);
        ctx.fillStyle = p.color; ctx.shadowBlur = 8; ctx.shadowColor = p.color; ctx.fill();
      } else if (p.type === 'spark') {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = p.color; ctx.shadowBlur = 6; ctx.shadowColor = p.color; ctx.fill();
      } else if (p.type === 'lvlup_star') {
        ctx.shadowColor = p.color; ctx.shadowBlur = 8;
        starPath(ctx, p.x, p.y, p.r, p.r * 0.4, 5);
        ctx.fillStyle = p.color; ctx.fill();
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
        ctx.font = \`bold \${fs}px Outfit\`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.strokeText('BOOM!', p.x, p.y);
        ctx.fillStyle = '#fff'; ctx.fillText('BOOM!', p.x, p.y);
      } else if (p.type === 'ring') {
        ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI*2); // fix relative to translation
        ctx.strokeStyle = p.color; ctx.lineWidth = 2 * alpha;
        ctx.shadowBlur = 10; ctx.shadowColor = p.color; ctx.stroke();
      } else if (p.type === 'orb') {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = p.color; ctx.shadowBlur = 10; ctx.shadowColor = p.color; ctx.fill();
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
      }
      ctx.restore();
    });
  }`;

code = code.replace(originalDrawParticles, newDrawParticles);

// 16. Replace drawPlayer and drawEnemies completely
const originalDrawPlayer = `  drawPlayer(ctx) {
    const p = this.player;
    const t = Date.now();
    ctx.save();
    ctx.translate(p.x, p.y);

    // Invincible flash
    if (p.invincible) { ctx.globalAlpha = 0.5 + Math.sin(t/60)*0.5; }

    // Shield glow
    if (p.shieldHp > 0) {
      ctx.beginPath(); ctx.arc(0, 0, p.r + 12, 0, Math.PI*2);
      ctx.strokeStyle = \`rgba(148,163,184,\${0.4 + Math.sin(t/100)*0.3})\`; ctx.lineWidth = 4; ctx.stroke();
    }

    // Rally speed glow
    if (Date.now() < p.rallyUntil) {
      ctx.beginPath(); ctx.arc(0, 0, p.r + 8, 0, Math.PI*2);
      ctx.strokeStyle = \`rgba(234,179,8,\${0.5 + Math.sin(t/80)*0.4})\`; ctx.lineWidth = 3; ctx.stroke();
    }

    // Shadow
    ctx.beginPath(); ctx.ellipse(3, p.r*0.7, p.r*0.9, p.r*0.3, 0, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill();

    // Body
    ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI*2);
    const grad = ctx.createRadialGradient(-p.r*0.3, -p.r*0.3, 0, 0, 0, p.r);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.4, p.color);
    grad.addColorStop(1, shadeColor(p.color, -50));
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.stroke();

    // Armor overlay
    if (this.save.equipped.armor) this.drawArmorOverlay(ctx, p);

    // Eyes
    this.drawPlayerEyes(ctx, p);

    // Weapon
    ctx.rotate(p.angle + Math.PI / 2);
    this.drawPlayerWeapon(ctx, p, t);
    ctx.rotate(-(p.angle + Math.PI / 2));

    // Accessory glow ring
    if (this.save.equipped.accessory) {
      const accColor = RARITY_COLOR[this.save.equipped.accessory.rarity] || '#fbbf24';
      ctx.beginPath(); ctx.arc(0, 0, p.r + 5 + Math.sin(t/120)*3, 0, Math.PI*2);
      ctx.strokeStyle = accColor + '88'; ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]); ctx.lineDashOffset = (t / 20) % 10;
      ctx.stroke(); ctx.setLineDash([]);
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    // HP bar above player
    this.drawHpBar(ctx, p.x, p.y - p.r - 8, p.r * 2, 5, p.hp / p.maxHp, '#ef4444');
  }`;

const newDrawPlayer = `  drawPlayer(ctx) {
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
      hp: p.hp,
      mhp: p.maxHp,
      n: p.name || this.cls.name,
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
      ctx.strokeStyle = \`rgba(147, 197, 253, \${0.15 + Math.sin(t/300)*0.05})\`;
      ctx.lineWidth = 4 + Math.sin(t/150);
      ctx.stroke();
      ctx.fillStyle = \`rgba(147, 197, 253, \${0.03 + Math.sin(t/300)*0.01})\`;
      ctx.fill();
      ctx.restore();
    }

    drawCharacter(sp, cp, ctx);
  }`;

code = code.replace(originalDrawPlayer, newDrawPlayer);

const originalDrawEnemies = `  drawEnemies(ctx) {
    const t = Date.now();
    this.enemies.forEach(e => {
      if (e.hp <= 0) return;
      ctx.save();
      ctx.translate(e.x, e.y);

      // Stun stars
      if (Date.now() < e.stunUntil) {
        ctx.fillStyle = '#fbbf24';
        for (let i = 0; i < 3; i++) {
          const a = (i/3)*Math.PI*2 + t/200;
          ctx.beginPath(); ctx.arc(Math.cos(a)*(e.r+8), Math.sin(a)*(e.r+8)-e.r, 4, 0, Math.PI*2); ctx.fill();
        }
      }

      // Stealth alpha
      ctx.globalAlpha = e.stealth > 0 ? 0.35 + Math.sin(t/200)*0.1 : 1;

      // Shadow
      ctx.beginPath(); ctx.ellipse(2, e.r*0.65, e.r*0.85, e.r*0.3, 0, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();

      // Body
      ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI*2);
      const bossGrad = ctx.createRadialGradient(-e.r*0.25, -e.r*0.25, 0, 0, 0, e.r);
      bossGrad.addColorStop(0, e.isBoss ? '#fff' : lightenColor(e.color, 40));
      bossGrad.addColorStop(1, e.color);
      ctx.fillStyle = bossGrad; ctx.fill();
      ctx.strokeStyle = shadeColor(e.color, -60); ctx.lineWidth = e.isBoss ? 4 : 2; ctx.stroke();

      // Boss crown
      if (e.isBoss) {
        ctx.fillStyle = '#fbbf24';
        for (let i = 0; i < 5; i++) {
          const a = ((i - 2) / 4) * Math.PI * 0.8 - Math.PI / 2;
          ctx.beginPath(); ctx.arc(Math.cos(a)*(e.r+5), Math.sin(a)*(e.r+5), 5, 0, Math.PI*2); ctx.fill();
        }
      }

      // Emoji
      ctx.globalAlpha = 1;
      ctx.font = \`\${e.r * 1.2}px serif\`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(e.emoji || '👾', 0, 0);

      ctx.restore();

      // HP bar
      if (!e.isBoss) {
        this.drawHpBar(ctx, e.x, e.y - e.r - 6, e.r * 2, 3, e.hp / e.maxHp, '#ef4444');
      } else {
        this.drawHpBar(ctx, e.x, e.y - e.r - 10, e.r * 3, 8, e.hp / e.maxHp, '#ef4444');
      }
    });
  }`;

const newDrawEnemies = `  drawEnemies(ctx) {
    const t = Date.now();
    this.enemies.forEach(e => {
      if (e.hp <= 0) return;

      let lvl = 1;
      let branch = null;
      let isBoss = e.isBoss;
      
      if (e.type === 'slime') {
        lvl = 1;
      } else if (e.type === 'goblin') {
        lvl = 4;
        branch = 'ranger';
      } else if (e.type === 'knight') {
        lvl = 5;
        branch = 'fighter';
      } else if (e.type === 'dark_mage') {
        lvl = 6;
        branch = 'mage';
      } else if (e.type === 'shadow') {
        lvl = 8;
        branch = 'assassin';
      } else if (e.type === 'berserker') {
        lvl = 6;
        branch = 'fighter';
      } else if (e.type === 'necromancer') {
        lvl = 8;
        branch = 'necromancer';
      } else if (e.type === 'dragon') {
        lvl = 7;
        branch = 'druid';
      } else if (e.type === 'boss_slime_king') {
        lvl = 6;
      } else if (e.type === 'boss_dark_lord') {
        lvl = 8;
        branch = 'necromancer';
      } else if (e.type === 'boss_dragon_queen') {
        lvl = 9;
        branch = 'druid';
      } else if (e.type === 'boss_void_titan') {
        lvl = 10;
        branch = 'necromancer';
      }

      const rage = e.enrageThreshold > 0 && e.hp / e.maxHp < e.enrageThreshold;

      const sp = {
        id: e.type + '_' + e.x,
        isPlayer: false,
        isBoss,
        lvl,
        brnch: branch,
        radius: e.r,
        angle: Math.atan2(this.player.y - e.y, this.player.x - e.x),
        a: Math.atan2(this.player.y - e.y, this.player.x - e.x),
        vx: Math.cos(Math.atan2(this.player.y - e.y, this.player.x - e.x)),
        vy: Math.sin(Math.atan2(this.player.y - e.y, this.player.x - e.x)),
        shld: false,
        rage,
        stn: Date.now() < e.stunUntil,
        slw: Date.now() < e.slowUntil,
        dash: false,
        stealth: e.stealth > 0 && Date.now() % 1000 < 500,
        hp: e.hp,
        mhp: e.maxHp,
        n: e.isBoss ? \`👹 \${ENEMY_TYPES[e.type].name}\` : ENEMY_TYPES[e.type].name,
      };

      const cp = {
        x: e.x,
        y: e.y,
        lastHit: e.lastHitTime || 0,
        attackAnim: null,
        chatText: null,
        chatTTL: 0,
      };

      drawCharacter(sp, cp, ctx);
    });
  }`;

code = code.replace(originalDrawEnemies, newDrawEnemies);

// 17. Update drawClassPreview for rich character lobby preview
const originalDrawClassPreview = `function drawClassPreview(cls) {
  const canvas = document.getElementById('classPreviewCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const def = CLASSES[cls];
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const r = 35;
  ctx.clearRect(0, 0, W, H);

  // Aura glow
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
  grad.addColorStop(0, def.color + '55');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  // Body
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const bg = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
  bg.addColorStop(0, '#fff'); bg.addColorStop(0.4, def.color); bg.addColorStop(1, shadeColor(def.color, -40));
  ctx.fillStyle = bg; ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.stroke();

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(cx - r * 0.3, cy - r * 0.1, r * 0.18, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + r * 0.3, cy - r * 0.1, r * 0.18, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.beginPath(); ctx.arc(cx - r * 0.28, cy - r * 0.08, r * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.28, cy - r * 0.08, r * 0.1, 0, Math.PI * 2); ctx.fill();

  // Class-specific weapon/accessory drawn
  drawLobbyWeapon(ctx, cls, cx, cy, r, def.color);
}`;

const newDrawClassPreview = `function drawClassPreview(cls) {
  const canvas = document.getElementById('classPreviewCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const def = CLASSES[cls];
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const r = 35;
  ctx.clearRect(0, 0, W, H);

  // Aura glow background
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2);
  grad.addColorStop(0, def.color + '55');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

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
    y: cy + 10,
    lastHit: 0,
    attackAnim: null,
  };

  drawCharacter(sp, cp, ctx);
}`;

code = code.replace(originalDrawClassPreview, newDrawClassPreview);

// 18. Append ported character drawing helpers right before lightenColor
const lightenColorIndex = code.indexOf('function lightenColor(');

const drawingHelpers = `
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

// ══════════════════════════════════════════════════════════════
//  CHARACTER DRAWING — Ported from game.js
// ══════════════════════════════════════════════════════════════
function drawCharacter(sp, cp, ctx) {
  let skin = SKINS[sp.lvl] || SKINS[1];
  if (sp.lvl >= 5 && sp.brnch) {
    skin = BRANCH_SKINS[sp.brnch]?.[sp.lvl] || skin;
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
  ctx.beginPath(); ctx.ellipse(0,r-2,r*0.88,8,0,0,Math.PI*2); ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fill();

  // Omega gravity ring (Lv10)
  if (sp.lvl === 10) drawOmegaRing(ctx, r, t);

  // Aura ring (Lv2+)
  if (sp.lvl >= 2 && skin.aura) drawAuraRing(ctx, r, skin.aura, sp.lvl, t);

  // Boss fire ring (Lv6+)
  if (sp.isBoss || sp.lvl >= 6) drawBossFireRing(ctx, r, t, sp.lvl);

  // Shadow blink ghost (Lv8)
  if (sp.lvl === 8 && moving) drawShadowGhost(ctx, r, t, cp);

  // Waddle + Breathe
  const breathY = Math.sin(t/190)*0.048;
  let squashX = 1 + breathY;
  let squashY = 1 - breathY;
  let waddleA = moving ? Math.sin(t/(75+sp.lvl*8))*0.15 : 0;

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
    g.addColorStop(0,skin.bodyHL); g.addColorStop(0.5,\`rgba(239,68,68,\${rp})\`); g.addColorStop(1,skin.body2);
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
  } else if (sp.brnch === 'ranger') {
    drawRangerBow(ctx, r, attacking, attackProgress);
  } else if (sp.brnch === 'paladin') {
    drawPaladinHammer(ctx, r, attacking, attackProgress);
  } else if (sp.brnch === 'necromancer') {
    drawSkullStaff(ctx, r, attacking, attackProgress);
  } else if (sp.brnch === 'druid') {
    drawDruidStaff(ctx, r, t, attacking, attackProgress);
  }

  drawEyes(ctx, r, cp, sp, skin, t);

  if (sp.lvl <= 4) drawCheeks(ctx, r);

  ctx.restore(); // waddle

  // Status overlays
  if (sp.stn)  drawStunStars(ctx,r,t);
  if (sp.shld) drawShieldHex(ctx,r,t);
  if (sp.slw)  drawSlowRings(ctx,r,t);
  if (sp.rage) drawRageFlames(ctx,r,t);

  ctx.restore(); // translate

  drawNameplate(ctx, cp, sp, r, isMe);
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
  ctx.beginPath(); ctx.arc(0,0,pulse,0,Math.PI*2);
  ctx.strokeStyle=color; ctx.lineWidth=3+Math.sin(t/80); ctx.globalAlpha=0.5+Math.sin(t/95)*0.18;
  ctx.shadowColor=color; ctx.shadowBlur=14; ctx.stroke(); ctx.setLineDash([]); ctx.restore();
}

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

function drawOmegaRing(ctx,r,t) {
  const rot=(t/300)%(Math.PI*2);
  for(let ring=0;ring<3;ring++){
    ctx.save(); ctx.rotate(rot+ring*(Math.PI*2/3));
    ctx.beginPath(); ctx.arc(0,0,r+22+ring*14,0,Math.PI*2);
    ctx.strokeStyle=\`rgba(251,191,36,\${0.6-ring*0.15})\`; ctx.lineWidth=3-ring*0.5;
    ctx.setLineDash([12,8]); ctx.shadowColor='#fbbf24'; ctx.shadowBlur=10; ctx.stroke();
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
  ctx.font=\`bold \${r*.85}px Outfit\`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle=\`rgba(251,191,36,\${sparkle})\`; ctx.shadowColor='#fbbf24'; ctx.shadowBlur=20;
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
  ctx.fillStyle=\`rgba(251,191,36,\${sparkle})\`;ctx.strokeStyle='#451a03';ctx.lineWidth=3.5;
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
  ctx.strokeStyle = \`rgba(125,211,252,\${pulse})\`;
  ctx.lineWidth = 1.5; ctx.setLineDash([12, 8]);
  ctx.stroke();
  ctx.rotate(-(t/400) % (Math.PI*2));
  ctx.strokeStyle = \`rgba(186,230,253,\${pulse*0.7})\`;
  ctx.setLineDash([25, 15, 5, 15]);
  ctx.stroke();
  ctx.restore();
}

function drawSlowRings(ctx,r,t) {
  ctx.save();const phase=(t/380)%1;
  [0,0.5].forEach(off=>{const p=(phase+off)%1;ctx.beginPath();ctx.arc(0,r*.65,r*(0.5+p*.5),0,Math.PI*2);ctx.strokeStyle=\`rgba(96,165,250,\${(1-p)*.65})\`;ctx.lineWidth=2.5;ctx.stroke();});
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
  ctx.font = \`bold \${isMe?14:11}px 'Outfit',sans-serif\`;
  ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  let label = sp.n;
  if (sp.lvl >= 9)      label = \`✨ \${sp.n}\`;
  else if (sp.lvl >= 6) label = \`👑 \${sp.n}\`;
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
  ctx.fillText(\`\${Math.round(sp.hp||0)}/\${sp.mhp||0}\`, x, barY+barH/2);

  ctx.restore();
}
`;

code = code.replace(
  `// ─── HELPER ──────────────────────────────────────────────────`,
  drawingHelpers + `\n// ─── HELPER ──────────────────────────────────────────────────`
);

// 19. Add updateSlashEffects(dt) and drawSlashEffects(ctx) to PveGame prototype or class body
code = code.replace(
  `  takeDamage(amt) {`,
  `  emitSlash(x, y, angle, r, color, type) {
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

  takeDamage(amt) {`
);

fs.writeFileSync(pvePath, code, 'utf8');
console.log('pve.js updated successfully!');
