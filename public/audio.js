/* ═══════════════════════════════════════════════════════════════
   FLIPFIGHT EXCLUSIVE AUDIO ENGINE — audio.js
   100% Procedural — Web Audio API — No External Files
   Exclusive original chiptune/orchestral hybrid music system
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const FlipAudio = (() => {

  // ── CORE STATE ──────────────────────────────────────────────
  let ctx = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let musicEnabled = true;
  let sfxEnabled = true;
  let musicVolume = 0.45;
  let sfxVolume = 0.60;

  // Music state
  let currentMusicLoop = null;
  let currentTheme = null;
  let musicNodes = [];
  let bpm = 128;
  let beat = 0;
  let scheduledTimeout = null;

  // ── AUDIO CONTEXT INIT ─────────────────────────────────────
  function ensureCtx() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 1.0;
      masterGain.connect(ctx.destination);

      musicGain = ctx.createGain();
      musicGain.gain.value = musicVolume;
      musicGain.connect(masterGain);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = sfxVolume;
      sfxGain.connect(masterGain);

      return true;
    } catch (e) {
      console.warn('FlipAudio: Web Audio API not supported', e);
      return false;
    }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  // ── REVERB CONVOLVER ───────────────────────────────────────
  function createReverb(duration = 1.5, decay = 2.0) {
    if (!ctx) return null;
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * duration);
    const buf = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    const conv = ctx.createConvolver();
    conv.buffer = buf;
    return conv;
  }

  // ── BASIC WAVEFORM HELPERS ─────────────────────────────────
  function playTone(freq, type, startTime, duration, vol, dest, detune = 0, attack = 0.01, release = 0.05) {
    if (!ctx) return null;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + attack);
    gain.gain.setValueAtTime(vol, startTime + duration - release);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.connect(gain);
    gain.connect(dest || sfxGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
    return { osc, gain };
  }

  function noise(startTime, duration, vol, filterFreq = 4000, dest) {
    if (!ctx) return;
    const bufLen = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest || sfxGain);
    src.start(startTime);
    src.stop(startTime + duration + 0.01);
  }

  // ══════════════════════════════════════════════════════════════
  //  MUSIC ENGINE — Exclusive Procedural Compositions
  // ══════════════════════════════════════════════════════════════

  // Scale helpers
  const PENTATONIC_MINOR = [0, 3, 5, 7, 10]; // A minor pent
  const SCALE_DARK_FANTASY = [0, 2, 3, 5, 7, 8, 10]; // Dorian
  const NOTE_FREQ = (note, octave = 4) => 440 * Math.pow(2, (note - 9 + (octave - 4) * 12) / 12);
  const NOTES = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };

  // Stop all music nodes cleanly
  function stopAllMusic() {
    if (scheduledTimeout) clearTimeout(scheduledTimeout);
    scheduledTimeout = null;
    musicNodes.forEach(n => { try { n.osc && n.osc.stop(); n.src && n.src.stop(); } catch(e) {} });
    musicNodes = [];
    currentTheme = null;
  }

  // ── THEME: LOBBY — "Angel Arena Anthem" ───────────────────
  // Chill, epic orchestral-chiptune hybrid. Majestic, not aggressive.
  function scheduleLobbyTheme() {
    if (!musicEnabled || !ctx) return;
    stopAllMusic();
    currentTheme = 'lobby';
    const secPerBeat = 60 / 105; // 105 BPM — relaxed but heroic
    const t0 = ctx.currentTime + 0.1;

    // Main melody — "The Arena Awaits"
    const melody = [
      { n: 'A', o: 4, dur: 1 }, { n: 'C', o: 5, dur: 0.5 }, { n: 'E', o: 5, dur: 0.5 },
      { n: 'D', o: 5, dur: 1 }, { n: 'C', o: 5, dur: 1 }, { n: 'A', o: 4, dur: 2 },
      { n: 'G', o: 4, dur: 1 }, { n: 'A', o: 4, dur: 0.5 }, { n: 'C', o: 5, dur: 0.5 },
      { n: 'E', o: 5, dur: 1 }, { n: 'D', o: 5, dur: 1 }, { n: 'E', o: 5, dur: 2 },
      { n: 'F', o: 5, dur: 1 }, { n: 'E', o: 5, dur: 0.5 }, { n: 'C', o: 5, dur: 0.5 },
      { n: 'A', o: 4, dur: 1 }, { n: 'G', o: 4, dur: 1 }, { n: 'A', o: 4, dur: 2 },
    ];

    // Bass line
    const bass = [
      { n: 'A', o: 2, dur: 2 }, { n: 'D', o: 2, dur: 2 }, { n: 'E', o: 2, dur: 2 }, { n: 'G', o: 2, dur: 2 },
      { n: 'A', o: 2, dur: 2 }, { n: 'C', o: 3, dur: 2 }, { n: 'D', o: 2, dur: 2 }, { n: 'E', o: 2, dur: 2 },
    ];

    // Pad chords
    const chords = [
      [['A',3], ['C',4], ['E',4]], // Am
      [['D',3], ['F',3], ['A',3]], // Dm
      [['E',3], ['G',3], ['B',3]], // Em
      [['G',3], ['B',3], ['D',4]], // G
    ];

    const loop = () => {
      if (currentTheme !== 'lobby' || !musicEnabled) return;
      const now = ctx.currentTime + 0.05;

      // Pad chords (ambient background)
      chords.forEach((chord, ci) => {
        chord.forEach(([note, oct]) => {
          const f = NOTE_FREQ(NOTES[note], oct);
          const n = playTone(f, 'sine', now + ci * secPerBeat * 4, secPerBeat * 4, 0.08, musicGain, 0, 0.3, 0.8);
          if (n) musicNodes.push(n);
        });
      });

      // Bass (sawtooth, muted)
      let bt = 0;
      bass.forEach(b => {
        const f = NOTE_FREQ(NOTES[b.n], b.o);
        const n = playTone(f, 'sawtooth', now + bt * secPerBeat, b.dur * secPerBeat, 0.12, musicGain, 0, 0.01, 0.2);
        if (n) musicNodes.push(n);
        bt += b.dur;
      });

      // Melody (triangle — warm, not harsh)
      let mt = 2;
      melody.forEach(m => {
        const f = NOTE_FREQ(NOTES[m.n], m.o);
        const n = playTone(f, 'triangle', now + mt * secPerBeat, m.dur * secPerBeat, 0.18, musicGain, 0, 0.02, 0.15);
        if (n) musicNodes.push(n);
        mt += m.dur;
      });

      // Soft percussion (kick on beats 1&3, hihat on every beat)
      for (let i = 0; i < 16; i++) {
        const bTime = now + i * secPerBeat;
        if (i % 4 === 0 || i % 4 === 2) {
          // Kick
          const kick = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kick.frequency.setValueAtTime(80, bTime);
          kick.frequency.exponentialRampToValueAtTime(30, bTime + 0.15);
          kickGain.gain.setValueAtTime(0.2, bTime);
          kickGain.gain.exponentialRampToValueAtTime(0.001, bTime + 0.3);
          kick.connect(kickGain);
          kickGain.connect(musicGain);
          kick.start(bTime);
          kick.stop(bTime + 0.35);
          musicNodes.push({ osc: kick });
        }
        // Hihat
        noise(bTime, 0.06, i % 2 === 0 ? 0.04 : 0.02, 8000, musicGain);
      }

      const loopLength = 16 * secPerBeat;
      scheduledTimeout = setTimeout(loop, loopLength * 1000 - 50);
    };

    loop();
  }

  // ── THEME: BATTLE — "Eternal Siege" ─────────────────────
  // Intense, dark, driving. Full chiptune-orchestral war music.
  function scheduleBattleTheme() {
    if (!musicEnabled || !ctx) return;
    stopAllMusic();
    currentTheme = 'battle';
    const spb = 60 / 138; // 138 BPM — intense battle pace
    const t0 = ctx.currentTime + 0.1;

    // Aggressive minor scale bass riff in A Dorian
    const bassRiff = [
      { n: 'A', o: 2, d: 0.5 }, { n: 'A', o: 2, d: 0.25 }, { n: 'C', o: 3, d: 0.25 },
      { n: 'D', o: 3, d: 0.5 }, { n: 'E', o: 3, d: 0.5 },
      { n: 'G', o: 2, d: 0.5 }, { n: 'A', o: 2, d: 0.25 }, { n: 'Bb', o: 2, d: 0.25 },
      { n: 'A', o: 2, d: 0.5 }, { n: 'G', o: 2, d: 0.25 }, { n: 'F', o: 2, d: 0.25 },
      { n: 'E', o: 2, d: 1.0 },
    ];

    // Lead synth melody — epic and dark
    const lead = [
      { n: 'E', o: 5, d: 0.5 }, { n: 'D', o: 5, d: 0.5 }, { n: 'C', o: 5, d: 0.5 }, { n: 'A', o: 4, d: 0.5 },
      { n: 'G', o: 4, d: 0.25 }, { n: 'A', o: 4, d: 0.25 }, { n: 'C', o: 5, d: 0.5 }, { n: 'D', o: 5, d: 0.5 },
      { n: 'E', o: 5, d: 1.0 }, { n: 'E', o: 5, d: 0.25 }, { n: 'F', o: 5, d: 0.25 },
      { n: 'E', o: 5, d: 0.5 }, { n: 'D', o: 5, d: 0.5 }, { n: 'C', o: 5, d: 0.5 }, { n: 'B', o: 4, d: 0.5 },
      { n: 'A', o: 4, d: 2.0 },
    ];

    // Counter melody — adds harmony depth
    const counter = [
      { n: 'A', o: 4, d: 1.0 }, { n: 'G', o: 4, d: 1.0 }, { n: 'F', o: 4, d: 1.0 }, { n: 'E', o: 4, d: 1.0 },
      { n: 'D', o: 4, d: 1.0 }, { n: 'E', o: 4, d: 1.0 }, { n: 'F', o: 4, d: 1.0 }, { n: 'E', o: 4, d: 1.0 },
    ];

    const loop = () => {
      if (currentTheme !== 'battle' || !musicEnabled) return;
      const now = ctx.currentTime + 0.05;

      // Distorted bass riff
      let bt = 0;
      bassRiff.forEach(b => {
        const f = NOTE_FREQ(NOTES[b.n], b.o);
        const n = playTone(f, 'sawtooth', now + bt * spb, b.d * spb, 0.20, musicGain, 0, 0.005, 0.10);
        if (n) musicNodes.push(n);
        // Harmonize a 5th up
        const n2 = playTone(f * 1.5, 'square', now + bt * spb, b.d * spb, 0.06, musicGain, 0, 0.005, 0.1);
        if (n2) musicNodes.push(n2);
        bt += b.d;
      });

      // Lead melody (square wave — classic chiptune heroic)
      let lt = 4;
      lead.forEach(l => {
        const f = NOTE_FREQ(NOTES[l.n], l.o);
        const n = playTone(f, 'square', now + lt * spb, l.d * spb, 0.14, musicGain, 0, 0.005, 0.08);
        if (n) musicNodes.push(n);
        // Slight detuned double for thickness
        const n2 = playTone(f, 'triangle', now + lt * spb, l.d * spb, 0.06, musicGain, 10, 0.005, 0.08);
        if (n2) musicNodes.push(n2);
        lt += l.d;
      });

      // Counter melody (sine — soft harmonic bed)
      let ct = 0;
      counter.forEach(c => {
        const f = NOTE_FREQ(NOTES[c.n], c.o);
        const n = playTone(f, 'sine', now + ct * spb, c.d * spb, 0.10, musicGain, 0, 0.1, 0.3);
        if (n) musicNodes.push(n);
        ct += c.d;
      });

      // Epic drum pattern: kick, snare, hihat
      const pattern = [
        // [type, beat, vol]
        ['kick', 0, 0.3], ['kick', 0.5, 0.15],
        ['kick', 2, 0.3], ['snare', 2, 0.25],
        ['kick', 4, 0.3], ['kick', 4.5, 0.15],
        ['snare', 6, 0.3],
        ['kick', 8, 0.3], ['kick', 8.5, 0.15],
        ['kick', 10, 0.3], ['snare', 10, 0.25],
        ['kick', 12, 0.3],
        ['snare', 14, 0.3], ['kick', 14, 0.15],
        ['kick', 15.5, 0.2],
      ];

      pattern.forEach(([type, beat, vol]) => {
        const bTime = now + beat * spb;
        if (type === 'kick') {
          const k = ctx.createOscillator();
          const kg = ctx.createGain();
          k.frequency.setValueAtTime(100, bTime);
          k.frequency.exponentialRampToValueAtTime(35, bTime + 0.12);
          kg.gain.setValueAtTime(vol, bTime);
          kg.gain.exponentialRampToValueAtTime(0.001, bTime + 0.25);
          k.connect(kg); kg.connect(musicGain);
          k.start(bTime); k.stop(bTime + 0.3);
          musicNodes.push({ osc: k });
        } else if (type === 'snare') {
          noise(bTime, 0.12, vol, 3000, musicGain);
          const s = ctx.createOscillator();
          const sg = ctx.createGain();
          s.frequency.value = 200;
          s.type = 'triangle';
          sg.gain.setValueAtTime(vol * 0.5, bTime);
          sg.gain.exponentialRampToValueAtTime(0.001, bTime + 0.1);
          s.connect(sg); sg.connect(musicGain);
          s.start(bTime); s.stop(bTime + 0.15);
          musicNodes.push({ osc: s });
        }
      });

      // Hihat: 16ths
      for (let i = 0; i < 16; i++) {
        noise(now + i * spb, 0.04, i % 2 === 0 ? 0.05 : 0.03, 9000, musicGain);
      }

      // Crash on downbeat
      noise(now, 0.5, 0.08, 12000, musicGain);

      const loopLen = 16 * spb;
      scheduledTimeout = setTimeout(loop, loopLen * 1000 - 50);
    };

    loop();
  }

  // ── THEME: BOSS — "Wrath of the Reaper" ────────────────────
  // Ominous, heavy, relentless. Low drones + aggressive percussion.
  function scheduleBossTheme() {
    if (!musicEnabled || !ctx) return;
    stopAllMusic();
    currentTheme = 'boss';
    const spb = 60 / 150; // 150 BPM — punishing pace

    const bassline = [
      { n: 'A', o: 1, d: 1 }, { n: 'A', o: 1, d: 0.5 }, { n: 'G', o: 1, d: 0.5 },
      { n: 'F', o: 1, d: 1 }, { n: 'E', o: 1, d: 1 },
      { n: 'D', o: 1, d: 1 }, { n: 'E', o: 1, d: 0.5 }, { n: 'F', o: 1, d: 0.5 },
      { n: 'G', o: 1, d: 1 }, { n: 'A', o: 1, d: 1 },
    ];

    const shriek = [
      { n: 'A', o: 5, d: 0.25 }, { n: 'G', o: 5, d: 0.25 }, { n: 'E', o: 5, d: 0.5 },
      { n: 'F', o: 5, d: 0.25 }, { n: 'D', o: 5, d: 0.25 }, { n: 'E', o: 5, d: 0.5 },
      { n: 'C', o: 5, d: 0.25 }, { n: 'D', o: 5, d: 0.25 }, { n: 'C', o: 5, d: 1.0 },
      { n: 'A', o: 5, d: 0.25 }, { n: 'G', o: 5, d: 0.25 }, { n: 'A', o: 5, d: 0.5 },
      { n: 'F', o: 5, d: 0.25 }, { n: 'G', o: 5, d: 0.25 }, { n: 'A', o: 5, d: 1.0 },
    ];

    const loop = () => {
      if (currentTheme !== 'boss' || !musicEnabled) return;
      const now = ctx.currentTime + 0.05;

      // Dark drone (low ominous pad)
      ['A', 'E'].forEach((note, i) => {
        const f = NOTE_FREQ(NOTES[note], 2 + i);
        const n = playTone(f, 'sine', now, 8 * spb, 0.12, musicGain, i * 5, 0.5, 1.0);
        if (n) musicNodes.push(n);
      });

      // Heavy bass
      let bt = 0;
      bassline.forEach(b => {
        const f = NOTE_FREQ(NOTES[b.n], b.o);
        const n = playTone(f, 'sawtooth', now + bt * spb, b.d * spb, 0.22, musicGain, 0, 0.005, 0.05);
        if (n) musicNodes.push(n);
        bt += b.d;
      });

      // Shrieking lead (square, high octave — danger sound)
      let st = 4;
      shriek.forEach(s => {
        const f = NOTE_FREQ(NOTES[s.n], s.o);
        const n = playTone(f, 'square', now + st * spb, s.d * spb, 0.10, musicGain, -10, 0.005, 0.05);
        if (n) musicNodes.push(n);
        st += s.d;
      });

      // Boss drums: relentless double-kick pattern
      const drump = [0, 0.25, 0.5, 1, 1.25, 1.75, 2, 2.5, 2.75, 3, 3.5, 3.75,
                     4, 4.5, 5, 5.5, 6, 6.25, 6.75, 7, 7.5];
      drump.forEach(b => {
        const bTime = now + b * spb;
        const k = ctx.createOscillator();
        const kg = ctx.createGain();
        k.frequency.setValueAtTime(110, bTime);
        k.frequency.exponentialRampToValueAtTime(30, bTime + 0.1);
        kg.gain.setValueAtTime(0.35, bTime);
        kg.gain.exponentialRampToValueAtTime(0.001, bTime + 0.2);
        k.connect(kg); kg.connect(musicGain);
        k.start(bTime); k.stop(bTime + 0.25);
        musicNodes.push({ osc: k });
      });

      // Snare on 2 & 4 beats
      [1, 3, 5, 7].forEach(b => {
        const bTime = now + b * spb;
        noise(bTime, 0.15, 0.3, 2500, musicGain);
      });

      // Hihat blast: 32nds for extra intensity
      for (let i = 0; i < 32; i++) {
        noise(now + i * spb * 0.25, 0.03, 0.03 + (i % 4 === 0 ? 0.04 : 0), 10000, musicGain);
      }

      const loopLen = 8 * spb;
      scheduledTimeout = setTimeout(loop, loopLen * 1000 - 50);
    };

    loop();
  }

  // ── THEME: VICTORY — "Angels Ascend" ──────────────────────
  // Triumphant, soaring, emotional. Major key, full resolution.
  function playVictoryTheme() {
    if (!musicEnabled || !ctx) return;
    stopAllMusic();
    currentTheme = 'victory';
    const spb = 60 / 90;
    const now = ctx.currentTime + 0.2;

    const fanfare = [
      { n: 'C', o: 5, d: 0.5 }, { n: 'E', o: 5, d: 0.5 }, { n: 'G', o: 5, d: 0.5 }, { n: 'C', o: 6, d: 1.0 },
      { n: 'B', o: 5, d: 0.25 }, { n: 'A', o: 5, d: 0.25 }, { n: 'G', o: 5, d: 0.5 },
      { n: 'E', o: 5, d: 0.5 }, { n: 'F', o: 5, d: 0.5 }, { n: 'G', o: 5, d: 0.5 }, { n: 'A', o: 5, d: 0.5 },
      { n: 'G', o: 5, d: 0.25 }, { n: 'F', o: 5, d: 0.25 }, { n: 'E', o: 5, d: 1.0 },
      { n: 'C', o: 5, d: 0.5 }, { n: 'D', o: 5, d: 0.5 }, { n: 'E', o: 5, d: 0.5 }, { n: 'F', o: 5, d: 0.25 }, { n: 'E', o: 5, d: 0.25 },
      { n: 'D', o: 5, d: 0.5 }, { n: 'C', o: 5, d: 0.5 }, { n: 'G', o: 4, d: 1.5 },
      { n: 'C', o: 5, d: 0.5 }, { n: 'E', o: 5, d: 0.5 }, { n: 'G', o: 5, d: 0.5 }, { n: 'C', o: 6, d: 3.0 },
    ];

    let ft = 0;
    fanfare.forEach(f => {
      const freq = NOTE_FREQ(NOTES[f.n], f.o);
      playTone(freq, 'triangle', now + ft * spb, f.d * spb, 0.25, musicGain, 0, 0.01, 0.15);
      playTone(freq * 0.5, 'sine', now + ft * spb, f.d * spb, 0.12, musicGain, 0, 0.05, 0.3);
      ft += f.d;
    });

    // Triumphant bells
    [523, 659, 784, 1047].forEach((freq, i) => {
      playTone(freq, 'sine', now + i * 0.4, 2.0, 0.15, musicGain, 0, 0.01, 1.0);
    });
  }

  // ── THEME: GAME OVER — "Fallen Hero" ──────────────────────
  // Somber, dark, accepting. Descending minor progression.
  function playGameOverTheme() {
    if (!musicEnabled || !ctx) return;
    stopAllMusic();
    currentTheme = 'gameover';
    const now = ctx.currentTime + 0.3;

    const dirge = [
      { n: 'A', o: 4, d: 0.8 }, { n: 'G', o: 4, d: 0.8 }, { n: 'F', o: 4, d: 0.8 },
      { n: 'E', o: 4, d: 1.2 }, { n: 'D', o: 4, d: 0.8 }, { n: 'C', o: 4, d: 0.8 },
      { n: 'B', o: 3, d: 0.8 }, { n: 'A', o: 3, d: 2.5 },
    ];

    let dt = 0;
    dirge.forEach(d => {
      const f = NOTE_FREQ(NOTES[d.n], d.o);
      playTone(f, 'sine', now + dt, d.d, 0.18, musicGain, 0, 0.1, 0.4);
      playTone(f * 0.5, 'sine', now + dt, d.d, 0.08, musicGain, 0, 0.15, 0.5);
      dt += d.d;
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  SOUND EFFECTS — Full set of exclusive procedural SFX
  // ══════════════════════════════════════════════════════════════

  const SFX = {

    // ── COMBAT SFX ─────────────────────────────────────────

    // Player attacks — fast, punchy
    slash() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      noise(now, 0.08, 0.35, 4500);
      playTone(800, 'sawtooth', now, 0.06, 0.15, sfxGain, 0, 0.001, 0.05);
      playTone(600, 'sawtooth', now + 0.03, 0.05, 0.10, sfxGain, 0, 0.001, 0.04);
    },

    // Arrow/projectile launch
    shoot() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.12);
      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(g); g.connect(sfxGain);
      osc.start(now); osc.stop(now + 0.2);
      noise(now, 0.08, 0.12, 6000);
    },

    // Enemy hit by player
    hit() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      noise(now, 0.05, 0.3, 3000);
      playTone(350, 'square', now, 0.04, 0.15, sfxGain, 0, 0.001, 0.03);
    },

    // Critical hit
    critHit() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      noise(now, 0.06, 0.4, 2500);
      playTone(500, 'square', now, 0.06, 0.20, sfxGain, 0, 0.001, 0.04);
      playTone(700, 'sine', now + 0.03, 0.12, 0.22, sfxGain, 0, 0.01, 0.1);
    },

    // Player takes damage
    playerHurt() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      noise(now, 0.1, 0.4, 1500);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(g); g.connect(sfxGain);
      osc.start(now); osc.stop(now + 0.25);
    },

    // Enemy dies
    enemyDie() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      noise(now, 0.15, 0.25, 2000);
      playTone(250, 'sawtooth', now, 0.1, 0.12, sfxGain, 0, 0.001, 0.08);
    },

    // Boss spawns — dramatic booming
    bossSpawn() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      // Deep boom
      for (let i = 0; i < 3; i++) {
        const k = ctx.createOscillator();
        const kg = ctx.createGain();
        const t = now + i * 0.15;
        k.frequency.setValueAtTime(80, t);
        k.frequency.exponentialRampToValueAtTime(25, t + 0.4);
        kg.gain.setValueAtTime(0.5 - i * 0.1, t);
        kg.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        k.connect(kg); kg.connect(sfxGain);
        k.start(t); k.stop(t + 0.6);
      }
      // Screech
      playTone(880, 'sawtooth', now, 0.5, 0.15, sfxGain, 0, 0.01, 0.3);
      noise(now, 0.5, 0.2, 8000);
    },

    // Boss dies — epic
    bossDie() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      [100, 150, 200, 250].forEach((f, i) => {
        const k = ctx.createOscillator();
        const kg = ctx.createGain();
        const t = now + i * 0.12;
        k.frequency.setValueAtTime(f * 2, t);
        k.frequency.exponentialRampToValueAtTime(f * 0.3, t + 0.6);
        kg.gain.setValueAtTime(0.35 - i * 0.05, t);
        kg.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        k.connect(kg); kg.connect(sfxGain);
        k.start(t); k.stop(t + 0.9);
      });
      noise(now, 0.8, 0.3, 5000);
      // Victory chime
      [523, 659, 784].forEach((f, i) => {
        playTone(f, 'sine', now + 0.5 + i * 0.2, 0.6, 0.2, sfxGain, 0, 0.02, 0.3);
      });
    },

    // ── SKILL SFX ──────────────────────────────────────────

    // Skill cast (generic powerful)
    skillCast() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.25);
      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(g); g.connect(sfxGain);
      osc.start(now); osc.stop(now + 0.35);
      noise(now, 0.12, 0.15, 5000);
    },

    // Magic / spell cast
    magic() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      [440, 554, 659, 880].forEach((f, i) => {
        playTone(f, 'sine', now + i * 0.04, 0.3, 0.18 - i * 0.03, sfxGain, 0, 0.005, 0.2);
      });
    },

    // Lightning strike
    lightning() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      noise(now, 0.05, 0.6, 12000);
      noise(now + 0.03, 0.2, 0.4, 4000);
      playTone(80, 'sawtooth', now, 0.3, 0.3, sfxGain, 0, 0.001, 0.25);
    },

    // Ice / freeze
    freeze() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        playTone(1200 + i * 200, 'sine', now + i * 0.03, 0.12, 0.1, sfxGain, 0, 0.005, 0.08);
      }
      noise(now, 0.2, 0.15, 8000);
    },

    // Fire / explosion
    explosion() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      noise(now, 0.4, 0.5, 1500);
      noise(now, 0.15, 0.4, 8000);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
      g.gain.setValueAtTime(0.4, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(g); g.connect(sfxGain);
      osc.start(now); osc.stop(now + 0.55);
    },

    // Summon (necromancer / pets)
    summon() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      [220, 277, 330, 440, 554].forEach((f, i) => {
        playTone(f, 'sine', now + i * 0.06, 0.5 - i * 0.05, 0.15, sfxGain, i * 7, 0.02, 0.3);
      });
      noise(now + 0.1, 0.3, 0.1, 3000);
    },

    // Shadow clone / stealth
    shadowClone() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      [440, 392, 330, 277].forEach((f, i) => {
        playTone(f, 'triangle', now + i * 0.05, 0.2, 0.15 - i * 0.02, sfxGain, -10 + i * 5, 0.01, 0.15);
      });
    },

    // Spirit wolf howl
    wolfHowl() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.4);
      osc.frequency.linearRampToValueAtTime(450, now + 0.7);
      osc.frequency.linearRampToValueAtTime(380, now + 1.0);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.3, now + 0.1);
      g.gain.setValueAtTime(0.25, now + 0.8);
      g.gain.linearRampToValueAtTime(0, now + 1.1);
      osc.connect(g); g.connect(sfxGain);
      osc.start(now); osc.stop(now + 1.2);
    },

    // Arrow rain begins
    arrowRain() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      for (let i = 0; i < 8; i++) {
        const t = now + i * 0.08;
        noise(t, 0.07, 0.15, 6000);
        playTone(400 + Math.random() * 200, 'sawtooth', t, 0.06, 0.08, sfxGain, 0, 0.002, 0.04);
      }
    },

    // AoE / ground slam
    groundSlam() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      noise(now, 0.3, 0.5, 800);
      const k = ctx.createOscillator();
      const kg = ctx.createGain();
      k.type = 'sine';
      k.frequency.setValueAtTime(150, now);
      k.frequency.exponentialRampToValueAtTime(25, now + 0.5);
      kg.gain.setValueAtTime(0.45, now);
      kg.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      k.connect(kg); kg.connect(sfxGain);
      k.start(now); k.stop(now + 0.65);
    },

    // ── UI SFX ─────────────────────────────────────────────

    // Level up — celebratory ascending arpeggio
    levelUp() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      [523, 659, 784, 1047, 1319].forEach((f, i) => {
        playTone(f, 'sine', now + i * 0.08, 0.3 + i * 0.05, 0.20 - i * 0.01, sfxGain, 0, 0.01, 0.15);
      });
      noise(now + 0.35, 0.2, 0.1, 8000);
    },

    // Gold pickup
    goldPickup() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      [1047, 1319, 1568].forEach((f, i) => {
        playTone(f, 'sine', now + i * 0.04, 0.12, 0.15, sfxGain, 0, 0.005, 0.08);
      });
    },

    // XP pickup
    xpPickup() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      playTone(880, 'sine', now, 0.08, 0.12, sfxGain, 0, 0.002, 0.06);
      playTone(1108, 'sine', now + 0.04, 0.08, 0.10, sfxGain, 0, 0.002, 0.06);
    },

    // Skill unlock / upgrade
    skillUnlock() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      [440, 554, 659, 880, 1108, 1319].forEach((f, i) => {
        playTone(f, 'sine', now + i * 0.06, 0.35, 0.18 - i * 0.01, sfxGain, 0, 0.01, 0.2);
      });
      noise(now + 0.3, 0.2, 0.12, 7000);
    },

    // Legendary skill unlock — EPIC fanfare
    legendaryUnlock() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      // Big chord strike
      [523, 659, 784, 1047].forEach((f, i) => {
        playTone(f, 'triangle', now, 1.5, 0.20, sfxGain, i * 8, 0.01, 0.8);
        playTone(f * 2, 'sine', now + 0.05, 1.2, 0.10, sfxGain, -i * 5, 0.02, 0.6);
      });
      noise(now, 0.3, 0.2, 8000);
      // Ascending arp after
      [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => {
        playTone(f, 'sine', now + 0.4 + i * 0.07, 0.4, 0.18, sfxGain, 0, 0.005, 0.25);
      });
    },

    // Button click — soft, satisfying
    click() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      playTone(800, 'sine', now, 0.06, 0.2, sfxGain, 0, 0.001, 0.04);
    },

    // Hover — very subtle
    hover() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      playTone(1200, 'sine', now, 0.04, 0.08, sfxGain, 0, 0.001, 0.03);
    },

    // Game start — war horn blast
    gameStart() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      const horn = ctx.createOscillator();
      const hg = ctx.createGain();
      horn.type = 'sawtooth';
      horn.frequency.setValueAtTime(220, now);
      horn.frequency.linearRampToValueAtTime(330, now + 0.3);
      horn.frequency.setValueAtTime(330, now + 0.3);
      horn.frequency.linearRampToValueAtTime(440, now + 0.6);
      hg.gain.setValueAtTime(0, now);
      hg.gain.linearRampToValueAtTime(0.4, now + 0.05);
      hg.gain.setValueAtTime(0.35, now + 0.5);
      hg.gain.linearRampToValueAtTime(0, now + 0.9);
      horn.connect(hg); hg.connect(sfxGain);
      horn.start(now); horn.stop(now + 1.0);
      noise(now, 0.8, 0.15, 3000);
    },

    // Wave clear
    waveClear() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      [392, 494, 587, 784].forEach((f, i) => {
        playTone(f, 'triangle', now + i * 0.1, 0.4, 0.18, sfxGain, 0, 0.01, 0.2);
      });
    },

    // Screen shake (deep sub boom for screen shakes)
    screenShakeSfx() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      noise(now, 0.08, 0.2, 200);
    },

    // Pause / unpause
    pauseToggle() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      playTone(600, 'sine', now, 0.08, 0.2, sfxGain, 0, 0.005, 0.06);
      playTone(450, 'sine', now + 0.05, 0.08, 0.15, sfxGain, 0, 0.005, 0.06);
    },

    // Buy / purchase
    purchase() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      [440, 554, 659].forEach((f, i) => {
        playTone(f, 'sine', now + i * 0.06, 0.25, 0.18, sfxGain, 0, 0.01, 0.15);
      });
    },

    // Error / can't afford
    error() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      playTone(200, 'square', now, 0.08, 0.2, sfxGain, 0, 0.001, 0.05);
      playTone(150, 'square', now + 0.1, 0.08, 0.2, sfxGain, 0, 0.001, 0.05);
    },

    // Low HP warning — pulsing alarm
    lowHp() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      [0, 0.5].forEach(delay => {
        playTone(220, 'sawtooth', now + delay, 0.15, 0.25, sfxGain, 0, 0.005, 0.1);
        noise(now + delay, 0.1, 0.1, 1000);
      });
    },

    // Heal / regen
    heal() {
      if (!sfxEnabled || !ctx) return;
      const now = ctx.currentTime;
      [523, 659, 784].forEach((f, i) => {
        playTone(f, 'sine', now + i * 0.08, 0.3, 0.12, sfxGain, 0, 0.02, 0.2);
      });
    },

    // Volume change feedback
    volumeChange(vol) {
      if (!ctx) return;
      const now = ctx.currentTime;
      const f = 400 + vol * 600;
      playTone(f, 'sine', now, 0.12, 0.2, sfxGain, 0, 0.005, 0.08);
    }
  };

  // ══════════════════════════════════════════════════════════════
  //  PUBLIC API
  // ══════════════════════════════════════════════════════════════

  function init() {
    if (!ensureCtx()) return;
    loadSettings();
    updateGains();
  }

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem('flipfight_audio') || '{}');
      if (saved.musicEnabled !== undefined) musicEnabled = saved.musicEnabled;
      if (saved.sfxEnabled !== undefined) sfxEnabled = saved.sfxEnabled;
      if (saved.musicVolume !== undefined) musicVolume = saved.musicVolume;
      if (saved.sfxVolume !== undefined) sfxVolume = saved.sfxVolume;
    } catch(e) {}
  }

  function saveSettings() {
    try {
      localStorage.setItem('flipfight_audio', JSON.stringify({
        musicEnabled, sfxEnabled, musicVolume, sfxVolume
      }));
    } catch(e) {}
  }

  function updateGains() {
    if (!ctx) return;
    if (musicGain) musicGain.gain.setTargetAtTime(musicEnabled ? musicVolume : 0, ctx.currentTime, 0.05);
    if (sfxGain) sfxGain.gain.setTargetAtTime(sfxEnabled ? sfxVolume : 0, ctx.currentTime, 0.05);
  }

  function toggleMusic() {
    musicEnabled = !musicEnabled;
    updateGains();
    if (musicEnabled && currentTheme) {
      // Restart current theme
      const t = currentTheme;
      setTimeout(() => playTheme(t), 100);
    } else if (!musicEnabled) {
      stopAllMusic();
    }
    saveSettings();
    return musicEnabled;
  }

  function toggleSfx() {
    sfxEnabled = !sfxEnabled;
    updateGains();
    saveSettings();
    return sfxEnabled;
  }

  function setMusicVolume(v) {
    musicVolume = Math.max(0, Math.min(1, v));
    if (musicEnabled && musicGain) musicGain.gain.setTargetAtTime(musicVolume, ctx.currentTime, 0.05);
    saveSettings();
    SFX.volumeChange(musicVolume);
  }

  function setSfxVolume(v) {
    sfxVolume = Math.max(0, Math.min(1, v));
    if (sfxEnabled && sfxGain) sfxGain.gain.setTargetAtTime(sfxVolume, ctx.currentTime, 0.05);
    saveSettings();
    SFX.volumeChange(sfxVolume);
  }

  function playTheme(theme) {
    if (!ensureCtx()) return;
    resume();
    switch (theme) {
      case 'lobby':   scheduleLobbyTheme(); break;
      case 'battle':  scheduleBattleTheme(); break;
      case 'boss':    scheduleBossTheme(); break;
      case 'victory': playVictoryTheme(); break;
      case 'gameover': playGameOverTheme(); break;
      case 'none':    stopAllMusic(); break;
    }
  }

  function playSfx(name, ...args) {
    if (!ensureCtx()) return;
    resume();
    if (SFX[name]) SFX[name](...args);
  }

  // Expose getters for UI
  function getState() {
    return { musicEnabled, sfxEnabled, musicVolume, sfxVolume, currentTheme };
  }

  return {
    init, playTheme, playSfx, stopAllMusic,
    toggleMusic, toggleSfx,
    setMusicVolume, setSfxVolume,
    getState, resume,
    sfx: SFX // Direct access
  };

})();

// Auto-init on first user interaction
(function() {
  const autoInit = (e) => {
    FlipAudio.init();
    document.removeEventListener('click', autoInit);
    document.removeEventListener('keydown', autoInit);
  };
  document.addEventListener('click', autoInit, { once: true });
  document.addEventListener('keydown', autoInit, { once: true });
})();
