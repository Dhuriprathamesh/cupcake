// src/pages/Landing/LandingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, Gamepad2, Layers, ArrowRight, Radio, Zap, Globe } from 'lucide-react';
import StickyFooter from '../../components/ui/StickyFooter';

const FEATURES = [
  { icon:Radio,    title:'The Duo Room',       desc:'Continuous synced space. Activities, presence, and live reactions designed for proximity.',                        color:'#8B5CF6', emoji:'🌐' },
  { icon:Gamepad2, title:'Co-op Mini Games',   desc:'Tic-Tac-Toe, Emoji Quiz, Reaction Blitz — all synced to Firebase with XP rewards.',                               color:'#FCD34D', emoji:'🕹️' },
  { icon:Layers,   title:'Memories Timeline',  desc:'Save moments, milestones, wins, and late-night highlights. Grid or timeline view. Cards flip to reveal details.',  color:'#FF6B97', emoji:'📸' },
  { icon:Sparkles, title:'AI Prompt Lab',       desc:'Icebreakers, deep talk, chaos mode, dares. AI typing effect, session history, +10 XP per roll.',                 color:'#06B6D4', emoji:'🤖' },
];

const STAT_ITEMS = [
  { value:'∞',   label:'Memories possible', color:'#FF6B97' },
  { value:'5+',  label:'Games to play',     color:'#FCD34D' },
  { value:'40+', label:'AI prompts',        color:'#8B5CF6' },
  { value:'2',   label:'People only',       color:'#06B6D4' },
];

// ── Detect mobile once ────────────────────────────────────────────────────
const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768;

// ── Auto-cycling hero preview ─────────────────────────────────────────────
function HeroVisual() {
  const [active, setActive] = useState(0);
  const previews = [
    { emoji:'🕹️', title:'Arcade Arena',   sub:'Tic-Tac-Toe · Emoji Quiz · Reaction Blitz', color:'#8B5CF6' },
    { emoji:'💬', title:'Chat Room',       sub:'Live messages · Stickers · Reactions',       color:'#FF6B97' },
    { emoji:'🎵', title:'Music Room',      sub:'Synced playback · Shared playlist',          color:'#06B6D4' },
    { emoji:'🤖', title:'AI Prompt Lab',   sub:'Icebreakers · Chaos mode · Deep talk',       color:'#FCD34D' },
  ];

  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % previews.length), 2800);
    return () => clearInterval(t);
  }, []);

  const p = previews[active];

  return (
    <div className="relative w-full max-w-3xl mx-auto mt-10 md:mt-16 px-0">
      {/* Outer glow — hidden on mobile for perf */}
      <div className="absolute inset-[-16px] rounded-[2.5rem] pointer-events-none hidden md:block"
        style={{ background:`${p.color}18`, filter:'blur(30px)', transition:'background 0.5s' }} />

      {/* Main frame */}
      <div className="relative rounded-2xl md:rounded-3xl border border-white/10 overflow-hidden"
        style={{ background:'rgba(10,6,22,0.95)' }}>

        {/* Window chrome */}
        <div className="flex items-center gap-2 px-3 md:px-4 py-2.5 border-b border-white/5">
          <div className="flex gap-1.5">
            {['#FF5F57','#FEBC2E','#28C840'].map(c => (
              <div key={c} className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full" style={{ background:c }} />
            ))}
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-mono text-cozy-muted flex items-center gap-2">
              <Globe className="w-3 h-3" />
              cupcake.world/room
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex" style={{ minHeight: IS_MOBILE ? 140 : 180 }}>
          {/* Mini sidebar */}
          <div className="w-11 md:w-14 border-r border-white/5 flex flex-col items-center gap-2 py-3"
            style={{ background:'rgba(5,3,15,0.6)' }}>
            {['🏠','🕹️','💬','🎵','📸','🤖'].map((e, i) => (
              <div key={e}
                className="w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center text-sm transition-all duration-300"
                style={{ background: i === active ? `${p.color}30` : 'rgba(255,255,255,0.04)',
                  transform: i === active ? 'scale(1.15)' : 'scale(1)' }}>
                {e}
              </div>
            ))}
          </div>

          {/* Preview pane */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div key={active}
                initial={{ opacity:0, y:8 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:-8 }}
                transition={{ duration:0.3 }}
                className="text-center space-y-2 px-4 md:px-8">
                <div className="text-3xl md:text-4xl">{p.emoji}</div>
                <h3 className="text-sm md:text-base font-black" style={{ fontFamily:'Syne, sans-serif', color:p.color }}>
                  {p.title}
                </h3>
                <p className="text-cozy-muted text-[10px] md:text-xs font-mono">{p.sub}</p>
                {/* Dot indicators */}
                <div className="flex justify-center gap-1.5 pt-1">
                  {previews.map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                      style={{ background: i === active ? p.color : 'rgba(255,255,255,0.15)',
                        transform: i === active ? 'scale(1.4)' : 'scale(1)' }} />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Presence bubbles */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-xl border border-white/5 text-[8px] font-mono"
              style={{ background:'rgba(0,0,0,0.5)' }}>
              <span>🧁</span>
              <div className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <motion.div key={i}
                    animate={{ opacity:[0.3,1,0.3] }}
                    transition={{ repeat:Infinity, duration:0.9, delay:i*0.25 }}
                    className="w-1 h-1 rounded-full" style={{ background:p.color }} />
                ))}
              </div>
              <span>🐱</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full relative overflow-x-hidden flex flex-col"
      style={{ background:'#07050F' }}>

      {/* ── Static background (no animation on mobile) ────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Static blobs on mobile — animated only on desktop */}
        <div className="absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full md:hidden"
          style={{ background:'rgba(139,92,246,0.13)', filter:'blur(60px)' }} />
        <div className="absolute -bottom-1/4 -right-1/4 w-[60vw] h-[60vw] rounded-full md:hidden"
          style={{ background:'rgba(255,107,151,0.07)', filter:'blur(50px)' }} />
        {/* Animated on desktop */}
        <motion.div className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full blur-[120px] hidden md:block"
          style={{ background:'rgba(139,92,246,0.15)' }}
          animate={{ scale:[1,1.15,1], opacity:[0.4,0.7,0.4] }}
          transition={{ repeat:Infinity, duration:12, ease:'easeInOut' }} />
        <motion.div className="absolute -bottom-1/4 -right-1/4 w-[55vw] h-[55vw] rounded-full blur-[100px] hidden md:block"
          style={{ background:'rgba(255,107,151,0.08)' }}
          animate={{ scale:[1,1.12,1] }}
          transition={{ repeat:Infinity, duration:16, delay:4, ease:'easeInOut' }} />
      </div>

      {/* ── Subtle floating emojis — desktop only ─────────────────────── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 hidden md:block">
        {['🧁','✨','💫','🎮','❤️','🌟','⚡','🎵'].map((e, i) => (
          <motion.div key={e}
            animate={{ y:[0,-25,0], opacity:[0.05,0.12,0.05] }}
            transition={{ repeat:Infinity, duration:5+i*1.2, delay:i*0.6, ease:'easeInOut' }}
            className="absolute select-none"
            style={{ left:`${4+i*12}%`, top:`${8+i*9}%`, fontSize:16+i*2 }}>
            {e}
          </motion.div>
        ))}
      </div>

      {/* ── Page content ──────────────────────────────────────────────── */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full flex-grow flex flex-col">

        {/* ── NAVBAR ────────────────────────────────────────────────────── */}
        <header className="w-full py-4 md:py-5 flex justify-between items-center border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2 font-black text-lg text-white" style={{ fontFamily:'Syne, sans-serif' }}>
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg shadow-lg flex-shrink-0"
              style={{ background:'linear-gradient(135deg, #8B5CF6, #FF6B97)', boxShadow:'0 0 20px rgba(139,92,246,0.4)' }}>
              🧁
            </div>
            CUPCAKE
          </div>
          <Link to="/auth">
            <button
              className="px-4 md:px-5 py-2 md:py-2.5 rounded-2xl text-xs font-black text-white border border-white/15 transition-all cursor-pointer active:scale-95"
              style={{ background:'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(255,107,151,0.2))', fontFamily:'Space Grotesk, sans-serif' }}>
              Enter World →
            </button>
          </Link>
        </header>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="pt-10 md:pt-20 pb-8 flex flex-col items-center text-center relative">

          {/* Badge */}
          <motion.div
            initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }}
            transition={{ duration:0.4, type:'spring' }}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 mb-6 md:mb-8 text-xs font-mono"
            style={{ background:'rgba(139,92,246,0.12)' }}>
            <span className="w-2 h-2 rounded-full bg-accent-pink flex-shrink-0 animate-pulse" />
            <span className="text-accent-pink font-bold">Designed Exclusively for Two</span>
          </motion.div>

          {/* Headline — no word-break issues on mobile */}
          <motion.h1
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5, delay:0.1 }}
            className="font-black tracking-tight text-white leading-tight mb-4 md:mb-5 px-2"
            style={{ fontFamily:'Syne, sans-serif', fontSize:'clamp(2rem, 8vw, 4.5rem)' }}>
            Spend time together{' '}
            <span style={{
              background:'linear-gradient(90deg, #FF6B97, #8B5CF6, #06B6D4)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              backgroundClip:'text',
            }}>
              from anywhere.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5, delay:0.2 }}
            className="text-sm md:text-base text-cozy-muted max-w-sm md:max-w-xl leading-relaxed font-light mb-7 md:mb-8 px-2">
            No feeds. No algorithms. No noise. A cozy, interactive, multiplayer world
            custom-built for you and your favourite person.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5, delay:0.3 }}
            className="flex flex-col gap-3 w-full max-w-xs sm:max-w-none sm:flex-row sm:justify-center">
            <Link to="/auth" className="w-full sm:w-auto">
              <button
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-base text-white flex items-center gap-3 cursor-pointer border-2 border-white/15 justify-center active:scale-95 transition-transform"
                style={{ background:'linear-gradient(135deg, #8B5CF6, #FF6B97)', boxShadow:'0 6px 24px rgba(139,92,246,0.35)', fontFamily:'Syne, sans-serif' }}>
                Create Your Space <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link to="/auth" className="w-full sm:w-auto">
              <button
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-base text-white border-2 border-white/10 cursor-pointer active:scale-95 transition-transform"
                style={{ background:'rgba(255,255,255,0.05)', fontFamily:'Syne, sans-serif' }}>
                Join Partner
              </button>
            </Link>
          </motion.div>

          {/* Hero visual */}
          <HeroVisual />
        </section>

        {/* ── STATS ─────────────────────────────────────────────────────── */}
        <section className="py-10 md:py-12 border-y border-white/5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 text-center">
            {STAT_ITEMS.map(({ value, label, color }, i) => (
              <motion.div key={label}
                initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ delay:i*0.08, duration:0.4 }}>
                <p className="text-3xl md:text-4xl font-black mb-1" style={{ fontFamily:'Syne, sans-serif', color }}>{value}</p>
                <p className="text-[10px] font-mono text-cozy-muted uppercase tracking-wider">{label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────────────────── */}
        <section className="py-12 md:py-20">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
            <motion.h2
              initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }}
              className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4"
              style={{ fontFamily:'Syne, sans-serif' }}>
              Everything you need to feel close
            </motion.h2>
            <p className="text-cozy-muted font-light text-sm">
              Four fully built, Firebase-synced experiences. Each one with a completely different visual personality.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div key={idx}
                  initial={{ opacity:0, y:20 }}
                  whileInView={{ opacity:1, y:0 }}
                  viewport={{ once:true, margin:'-60px' }}
                  transition={{ duration:0.4, delay:idx*0.08 }}
                  className="relative rounded-2xl border p-4 md:p-6 overflow-hidden"
                  style={{ background:'rgba(13,10,26,0.85)', borderColor:`${feature.color}20` }}>
                  {/* Corner glow */}
                  <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none"
                    style={{ background:`radial-gradient(circle at 0% 0%, ${feature.color}15 0%, transparent 70%)` }} />

                  <div className="relative z-10">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 border"
                      style={{ background:`${feature.color}15`, borderColor:`${feature.color}30` }}>
                      <span className="text-xl">{feature.emoji}</span>
                    </div>
                    <h3 className="text-base md:text-lg font-black mb-1.5 text-white" style={{ fontFamily:'Syne, sans-serif' }}>
                      {feature.title}
                    </h3>
                    <p className="text-cozy-muted text-sm font-light leading-relaxed">{feature.desc}</p>
                    <div className="mt-3 flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider"
                      style={{ color:`${feature.color}80` }}>
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:feature.color }} />
                      LIVE &amp; SYNCED
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
        <section className="py-12 md:py-16 text-center">
          <motion.div
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }}
            transition={{ duration:0.5 }}
            className="relative rounded-2xl md:rounded-3xl border border-white/8 p-7 md:p-14 overflow-hidden"
            style={{ background:'linear-gradient(135deg, rgba(19,15,38,0.95), rgba(28,23,54,0.8))' }}>
            {/* Static blobs inside CTA */}
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full pointer-events-none"
              style={{ background:'rgba(139,92,246,0.25)', filter:'blur(40px)' }} />
            <div className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full pointer-events-none"
              style={{ background:'rgba(255,107,151,0.18)', filter:'blur(35px)' }} />

            <div className="relative z-10 space-y-4">
              <div className="text-4xl md:text-5xl">🧁</div>
              <h2 className="text-2xl md:text-4xl font-black text-white leading-tight" style={{ fontFamily:'Syne, sans-serif' }}>
                "We may be far, but we have{' '}
                <span style={{
                  background:'linear-gradient(90deg, #FF6B97, #8B5CF6, #06B6D4)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
                }}>our own world."</span>
              </h2>
              <p className="text-cozy-muted font-light max-w-sm mx-auto text-sm">
                Two players. One private space. Infinite memories.
              </p>
              <Link to="/auth">
                <button
                  className="px-8 py-4 rounded-2xl font-black text-base text-white flex items-center gap-3 cursor-pointer mx-auto mt-4 border-2 border-white/15 active:scale-95 transition-transform justify-center"
                  style={{ background:'linear-gradient(135deg, #8B5CF6, #FF6B97)', fontFamily:'Syne, sans-serif' }}>
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </motion.div>
        </section>

        <StickyFooter variant="full" />
      </div>
    </div>
  );
}