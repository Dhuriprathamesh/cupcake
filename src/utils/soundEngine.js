// src/utils/soundEngine.js
// ─── Web Audio API Sound Engine ───────────────────────────────────────────────
// All sounds generated programmatically — no files needed.
// Uses oscillators, gain envelopes, noise buffers, and frequency sweeps.

let _ctx = null;
let _muted = localStorage.getItem('cupcake_muted') === 'true';

// ── Lazy AudioContext (must be created after user gesture) ────────────────────
function ctx() {
  if (!_ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      _ctx = new AC();
    } catch (e) {
      return null;
    }
  }
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// ── Master volume ─────────────────────────────────────────────────────────────
export function setMuted(val) {
  _muted = val;
  localStorage.setItem('cupcake_muted', val ? 'true' : 'false');
}
export function isMuted() { return _muted; }

// ── Core helpers ──────────────────────────────────────────────────────────────
function osc(type, freq, startTime, duration, gainPeak = 0.3, ac = ctx()) {
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = type;
  o.frequency.setValueAtTime(freq, startTime);
  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  o.start(startTime);
  o.stop(startTime + duration + 0.01);
}

function sweep(type, fromFreq, toFreq, startTime, duration, gainPeak = 0.25, ac = ctx()) {
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = type;
  o.frequency.setValueAtTime(fromFreq, startTime);
  o.frequency.exponentialRampToValueAtTime(toFreq, startTime + duration);
  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(gainPeak, startTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  o.start(startTime);
  o.stop(startTime + duration + 0.05);
}

function noise(startTime, duration, gainPeak = 0.15, ac = ctx()) {
  if (!ac) return;
  const bufSize = ac.sampleRate * duration;
  const buffer  = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data    = buffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const src = ac.createBufferSource();
  const g   = ac.createGain();
  const flt = ac.createBiquadFilter();
  src.buffer = buffer;
  flt.type = 'bandpass'; flt.frequency.value = 3000; flt.Q.value = 0.5;
  src.connect(flt); flt.connect(g); g.connect(ac.destination);
  g.gain.setValueAtTime(gainPeak, startTime);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  src.start(startTime); src.stop(startTime + duration + 0.01);
}

function arp(notes, startTime, step, duration, gainPeak = 0.25, type = 'sine', ac = ctx()) {
  if (!ac) return;
  notes.forEach((freq, i) => osc(type, freq, startTime + i * step, duration, gainPeak, ac));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOUNDS LIBRARY
// ═══════════════════════════════════════════════════════════════════════════════

// ── UNO ───────────────────────────────────────────────────────────────────────

export function playCardFlip() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  noise(t, 0.08, 0.18, ac);
  osc('triangle', 600, t, 0.06, 0.08, ac);
}

export function playWild() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  // Rainbow arpeggio: C-E-G-C (magical)
  arp([523, 659, 784, 1047], t, 0.10, 0.18, 0.22, 'sine', ac);
  sweep('sine', 300, 1200, t, 0.4, 0.10, ac);
}

export function playDrawTwo() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  osc('sawtooth', 300, t,        0.15, 0.20, ac);
  osc('sawtooth', 200, t + 0.18, 0.20, 0.22, ac);
  noise(t, 0.05, 0.12, ac);
}

export function playDrawFour() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  // Four dramatic descending hits
  [440, 370, 310, 220].forEach((f, i) => {
    osc('sawtooth', f, t + i * 0.15, 0.14, 0.25, ac);
    noise(t + i * 0.15, 0.04, 0.10, ac);
  });
}

export function playSkip() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  osc('square', 880, t, 0.06, 0.18, ac);
  osc('square', 440, t + 0.08, 0.08, 0.12, ac);
}

export function playReverse() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  sweep('sine', 800, 200, t, 0.20, 0.22, ac);
  sweep('sine', 200, 800, t + 0.22, 0.22, 0.20, ac);
}

export function playUno() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  // Short dramatic 3-note fanfare
  arp([523, 659, 1047], t, 0.12, 0.20, 0.35, 'square', ac);
  osc('sawtooth', 80, t, 0.5, 0.15, ac); // bass thud
}

// ── General game sounds ───────────────────────────────────────────────────────

export function playWin() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  // Joyful ascending arpeggio
  arp([523, 659, 784, 1047, 1319], t, 0.09, 0.22, 0.28, 'sine', ac);
  osc('triangle', 2000, t + 0.45, 0.3, 0.12, ac);
}

export function playLose() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  sweep('sawtooth', 400, 100, t, 0.6, 0.25, ac);
  osc('triangle', 60, t, 0.6, 0.15, ac);
}

export function playCorrect() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  osc('sine', 800, t, 0.08, 0.25, ac);
  osc('sine', 1200, t + 0.09, 0.12, 0.28, ac);
}

export function playWrong() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  osc('sawtooth', 150, t, 0.28, 0.25, ac);
  osc('sawtooth', 120, t + 0.05, 0.28, 0.20, ac);
}

export function playClick() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  osc('triangle', 1000, t, 0.04, 0.18, ac);
  noise(t, 0.03, 0.10, ac);
}

export function playDing() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  osc('sine', 1480, t, 0.25, 0.30, ac);
  osc('sine', 2960, t, 0.25, 0.10, ac);
}

export function playXP() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  // Coin collect — quick ascending ping
  arp([880, 1100, 1320], t, 0.06, 0.10, 0.20, 'sine', ac);
}

export function playMatch() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  osc('sine', 660, t, 0.12, 0.28, ac);
  osc('sine', 880, t + 0.10, 0.18, 0.28, ac);
}

export function playClash() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  // Dissonant chord
  [200, 213, 320].forEach(f => osc('sawtooth', f, t, 0.3, 0.15, ac));
}

// ── Reaction Blitz ────────────────────────────────────────────────────────────
export function playTargetAppear() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  sweep('sine', 200, 1000, t, 0.12, 0.30, ac);
  osc('triangle', 1200, t + 0.12, 0.08, 0.20, ac);
}

export function playTargetHit() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  osc('square', 600, t, 0.05, 0.30, ac);
  osc('square', 900, t + 0.06, 0.08, 0.28, ac);
  noise(t, 0.05, 0.15, ac);
}

// ── Chaos T&D ─────────────────────────────────────────────────────────────────
export function playWheelSpin() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  sweep('sawtooth', 100, 600, t, 0.8, 0.15, ac);
  sweep('sawtooth', 150, 800, t + 0.4, 0.6, 0.10, ac);
}

export function playTruthLand() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  arp([523, 659, 784], t, 0.12, 0.18, 0.25, 'sine', ac);
}

export function playDareLand() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  arp([784, 659, 523, 440], t, 0.10, 0.16, 0.28, 'sawtooth', ac);
  osc('triangle', 80, t, 0.5, 0.18, ac);
}

export function playTimerTick() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  osc('square', 1200, t, 0.03, 0.12, ac);
}

export function playTimerEnd() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  [0, 0.15, 0.30, 0.45].forEach(d =>
    osc('sawtooth', 880, t + d, 0.12, 0.25, ac)
  );
}

// ── Who Knows Better ──────────────────────────────────────────────────────────
export function playReveal() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  // Drum roll effect
  for (let i = 0; i < 8; i++) {
    noise(t + i * 0.04, 0.03, 0.08 + i * 0.01, ac);
  }
  osc('sine', 440, t + 0.35, 0.2, 0.25, ac);
}

export function playRoast() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  sweep('sawtooth', 500, 100, t, 0.4, 0.20, ac);
  osc('triangle', 60, t, 0.4, 0.15, ac);
}

// ── Hot Takes ─────────────────────────────────────────────────────────────────
export function playAgree() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  osc('sine', 660, t, 0.10, 0.25, ac);
  osc('sine', 990, t + 0.08, 0.12, 0.20, ac);
}

export function playDisagree() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const ac2 = ac;
  const t = ac2.currentTime;
  osc('square', 200, t, 0.20, 0.22, ac2);
}

// ── Card game start / deal ────────────────────────────────────────────────────
export function playDeal() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  for (let i = 0; i < 7; i++) {
    noise(t + i * 0.08, 0.06, 0.12, ac);
    osc('triangle', 500 + i * 50, t + i * 0.08, 0.05, 0.08, ac);
  }
}

export function playGameStart() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  arp([262, 330, 392, 523], t, 0.10, 0.18, 0.28, 'sine', ac);
  osc('triangle', 80, t, 0.4, 0.20, ac);
}

// ── Emoji Quiz ───────────────────────────────────────────────────────────────
export function playQuizCorrect() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  arp([523, 784, 1047], t, 0.08, 0.15, 0.28, 'sine', ac);
}

export function playQuizWrong() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  osc('sawtooth', 180, t, 0.25, 0.22, ac);
  osc('sawtooth', 140, t + 0.12, 0.20, 0.20, ac);
}

// ── Approved / Resend (CTD) ───────────────────────────────────────────────────
export function playApproved() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  arp([440, 660, 880], t, 0.08, 0.14, 0.25, 'sine', ac);
}

export function playResend() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  osc('square', 300, t, 0.10, 0.20, ac);
  osc('square', 240, t + 0.12, 0.10, 0.18, ac);
}

// ── Emoji Challenge ───────────────────────────────────────────────────────────
export function playEmojiSend() {
  if (_muted) return;
  const ac = ctx(); if (!ac) return;
  const t = ac.currentTime;
  sweep('sine', 400, 900, t, 0.15, 0.22, ac);
}