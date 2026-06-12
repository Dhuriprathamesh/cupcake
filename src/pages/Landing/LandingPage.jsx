// src/pages/Landing/LandingPage.jsx
import React, { useState, useEffect } from 'react';
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
  { value:'∞', label:'Memories possible',  color:'#FF6B97' },
  { value:'5+', label:'Games to play',     color:'#FCD34D' },
  { value:'40+', label:'AI prompts',       color:'#8B5CF6' },
  { value:'2', label:'People only',        color:'#06B6D4' },
];

// Floating background emojis
function FloatingBg() {
  const items = ['🧁','✨','💫','🎮','❤️','🌟','⚡','🎵','🤖','📸','💬','🏆'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((e, i) => (
        <motion.div key={e}
          animate={{ y:[0, -30, 0], opacity:[0.04, 0.12, 0.04], rotate:[0, 10, -10, 0] }}
          transition={{ repeat:Infinity, duration:5+i*1.5, delay:i*0.7 }}
          className="absolute select-none"
          style={{ left:`${3+i*8.5}%`, top:`${5+i*7}%`, fontSize:18+i*2 }}
        >{e}</motion.div>
      ))}
    </div>
  );
}

// Animated hero visual
function HeroVisual() {
  const [activeFeature, setActiveFeature] = useState(0);
  const previews = [
    { bg:'rgba(139,92,246,0.15)', border:'rgba(139,92,246,0.30)', content:'🕹️ Arcade Arena', sub:'Tic-Tac-Toe · Emoji Quiz · Reaction Blitz', color:'#8B5CF6' },
    { bg:'rgba(255,107,151,0.12)', border:'rgba(255,107,151,0.25)', content:'💬 Chat Room', sub:'Live messages · Stickers · Reactions', color:'#FF6B97' },
    { bg:'rgba(6,182,212,0.12)', border:'rgba(6,182,212,0.25)', content:'🎵 Music Room', sub:'Synced playback · Shared playlist', color:'#06B6D4' },
    { bg:'rgba(252,211,77,0.10)', border:'rgba(252,211,77,0.22)', content:'🤖 AI Prompt Lab', sub:'Icebreakers · Chaos mode · Deep talk', color:'#FCD34D' },
  ];

  useEffect(() => {
    const t = setInterval(() => setActiveFeature(p => (p + 1) % previews.length), 2800);
    return () => clearInterval(t);
  }, []);

  const p = previews[activeFeature];

  return (
    <motion.div
      initial={{ opacity:0, y:40 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.8, delay:0.5 }}
      className="relative w-full max-w-4xl mx-auto mt-14 md:mt-20"
    >
      {/* Outer glow */}
      <AnimatePresence mode="wait">
        <motion.div key={activeFeature}
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          transition={{ duration:0.5 }}
          className="absolute inset-[-20px] rounded-[3rem] blur-2xl pointer-events-none"
          style={{ background:`${p.color}20` }} />
      </AnimatePresence>

      {/* Main frame */}
      <div className="relative rounded-3xl border border-white/8 overflow-hidden"
        style={{ background:'rgba(10,6,22,0.90)', backdropFilter:'blur(20px)', aspectRatio:'16/7' }}>

        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <div className="flex gap-1.5">
            {['#FF5F57','#FEBC2E','#28C840'].map(c => (
              <div key={c} className="w-3 h-3 rounded-full" style={{ background:c }} />
            ))}
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1 rounded-lg bg-white/5 border border-white/5 text-[9px] font-mono text-cozy-muted flex items-center gap-2">
              <Globe className="w-3 h-3" />
              cupcake.world/room
              <motion.span animate={{ opacity:[1,0,1] }} transition={{ repeat:Infinity, duration:1.5 }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
          </div>
        </div>

        {/* Content preview */}
        <div className="flex h-full">
          {/* Sidebar preview */}
          <div className="w-14 border-r border-white/5 flex flex-col items-center gap-3 py-4"
            style={{ background:'rgba(5,3,15,0.6)' }}>
            {['🏠','🕹️','💬','🎵','📸','🤖'].map((e, i) => (
              <motion.div key={e}
                animate={i === activeFeature ? { scale:1.2 } : { scale:1 }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                style={{ background: i === activeFeature ? `${p.color}25` : 'rgba(255,255,255,0.04)' }}>
                {e}
              </motion.div>
            ))}
          </div>

          {/* Main content area */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div key={activeFeature}
                initial={{ opacity:0, scale:0.95, y:10 }}
                animate={{ opacity:1, scale:1,    y:0  }}
                exit={{    opacity:0, scale:0.95, y:-10 }}
                transition={{ duration:0.4 }}
                className="text-center space-y-3 px-8"
              >
                <motion.div
                  animate={{ scale:[1,1.1,1], rotate:[-2,2,-2,0] }}
                  transition={{ repeat:Infinity, duration:3 }}
                  className="text-5xl"
                >
                  {p.content.split(' ')[0]}
                </motion.div>
                <h3 className="text-white font-black text-xl" style={{ fontFamily:'Syne, sans-serif', color:p.color }}>
                  {p.content.slice(p.content.indexOf(' ')+1)}
                </h3>
                <p className="text-cozy-muted text-xs font-mono">{p.sub}</p>
                {/* Mini "live" dots */}
                <div className="flex justify-center gap-2">
                  {previews.map((_, i) => (
                    <motion.div key={i}
                      animate={{ scale: i === activeFeature ? 1.3 : 1 }}
                      className="w-1.5 h-1.5 rounded-full transition-all"
                      style={{ background: i === activeFeature ? p.color : 'rgba(255,255,255,0.15)' }}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Presence bubbles */}
            <div className="absolute top-3 right-3 flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-white/5 text-[9px] font-mono"
              style={{ background:'rgba(0,0,0,0.4)' }}>
              <span className="text-base">🧁</span>
              <div className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <motion.div key={i}
                    animate={{ opacity:[0.3,1,0.3] }}
                    transition={{ repeat:Infinity, duration:0.8, delay:i*0.2 }}
                    className="w-1 h-1 rounded-full" style={{ background:p.color }} />
                ))}
              </div>
              <span className="text-base">🐱</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col">

      {/* Global bg */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div animate={{ scale:[1,1.2,1], opacity:[0.3,0.6,0.3] }} transition={{ repeat:Infinity, duration:12 }}
          className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full blur-[150px]"
          style={{ background:'rgba(139,92,246,0.15)' }} />
        <motion.div animate={{ scale:[1,1.15,1] }} transition={{ repeat:Infinity, duration:16, delay:4 }}
          className="absolute -bottom-1/4 -right-1/4 w-[55vw] h-[55vw] rounded-full blur-[130px]"
          style={{ background:'rgba(255,107,151,0.08)' }} />
      </div>
      <FloatingBg />

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-grow flex flex-col">

        {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
        <header className="w-full py-5 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-2.5 font-black text-lg text-white" style={{ fontFamily:'Syne, sans-serif' }}>
            <motion.div
              animate={{ rotate:[0,-5,5,-3,0] }}
              transition={{ repeat:Infinity, duration:4 }}
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg shadow-lg"
              style={{ background:'linear-gradient(135deg, #8B5CF6, #FF6B97)', boxShadow:'0 0 20px rgba(139,92,246,0.4)' }}>
              🧁
            </motion.div>
            CUPCAKE
          </div>
          <Link to="/auth">
            <motion.button
              whileHover={{ scale:1.04, boxShadow:'0 0 25px rgba(139,92,246,0.4)' }}
              whileTap={{ scale:0.96 }}
              className="px-5 py-2.5 rounded-2xl text-xs font-black text-white border border-white/15 transition-all cursor-pointer"
              style={{ background:'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(255,107,151,0.2))', fontFamily:'Space Grotesk, sans-serif' }}>
              Enter World →
            </motion.button>
          </Link>
        </header>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="pt-16 md:pt-24 pb-10 flex flex-col items-center text-center relative">

          {/* Badge */}
          <motion.div
            initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
            transition={{ duration:0.5, type:'spring' }}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 mb-8 text-xs font-mono"
            style={{ background:'rgba(139,92,246,0.12)' }}
          >
            <motion.span animate={{ scale:[1,1.3,1] }} transition={{ repeat:Infinity, duration:1.5 }}
              className="w-2 h-2 rounded-full bg-accent-pink" />
            <span className="text-accent-pink font-bold">Designed Exclusively for Two</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.7, delay:0.1 }}
            className="text-3xl sm:text-6xl md:text-7xl font-black tracking-tight max-w-4xl leading-[1.05] text-white mb-5"
            style={{ fontFamily:'Syne, sans-serif' }}
          >
            Spend time together{' '}
            <span className="text-rainbow">from anywhere.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.7, delay:0.2 }}
            className="text-base sm:text-lg text-cozy-muted max-w-xl leading-relaxed font-light mb-8"
          >
            No feeds. No algorithms. No noise. A cozy, interactive, multiplayer world
            custom-built for you and your favourite person.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.7, delay:0.3 }}
            className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
          >
            <Link to="/auth">
              <motion.button
                whileHover={{ scale:1.04, boxShadow:'0 0 40px rgba(139,92,246,0.5)' }}
                whileTap={{ scale:0.97 }}
                className="px-8 py-4 rounded-2xl font-black text-base text-white flex items-center gap-3 cursor-pointer border-2 border-white/15 w-full sm:w-auto justify-center"
                style={{ background:'linear-gradient(135deg, #8B5CF6, #FF6B97)', boxShadow:'0 8px 30px rgba(139,92,246,0.35)', fontFamily:'Syne, sans-serif' }}
              >
                Create Your Space <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <Link to="/auth">
              <motion.button
                whileHover={{ scale:1.03, borderColor:'rgba(255,107,151,0.5)' }}
                whileTap={{ scale:0.97 }}
                className="px-8 py-4 rounded-2xl font-black text-base text-white border-2 border-white/10 cursor-pointer w-full sm:w-auto"
                style={{ background:'rgba(255,255,255,0.04)', fontFamily:'Syne, sans-serif' }}
              >
                Join Partner
              </motion.button>
            </Link>
          </motion.div>

          {/* Hero visual */}
          <HeroVisual />
        </section>

        {/* ── STATS ────────────────────────────────────────────────────────── */}
        <section className="py-12 border-y border-white/5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {STAT_ITEMS.map(({ value, label, color }, i) => (
              <motion.div key={label}
                initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }} transition={{ delay:i*0.1 }}>
                <p className="text-3xl md:text-4xl font-black mb-1" style={{ fontFamily:'Syne, sans-serif', color }}>{value}</p>
                <p className="text-[10px] font-mono text-cozy-muted uppercase tracking-wider">{label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────────────────── */}
        <section className="py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <motion.h2
              initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }}
              className="text-3xl sm:text-4xl font-black text-white mb-4"
              style={{ fontFamily:'Syne, sans-serif' }}
            >
              Everything you need to feel close
            </motion.h2>
            <p className="text-cozy-muted font-light text-sm">
              Four fully built, Firebase-synced experiences. Each one with a completely different visual personality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity:0, y:30 }}
                  whileInView={{ opacity:1, y:0 }}
                  viewport={{ once:true, margin:'-80px' }}
                  transition={{ duration:0.5, delay:idx*0.1 }}
                  whileHover={{ y:-6, scale:1.01 }}
                  className="relative rounded-2xl md:rounded-3xl border p-5 md:p-7 overflow-hidden group transition-all duration-300 cursor-default"
                  style={{ background:'rgba(13,10,26,0.7)', borderColor:`${feature.color}20`, backdropFilter:'blur(16px)' }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
                    style={{ background:`radial-gradient(ellipse at 30% 30%, ${feature.color}12 0%, transparent 60%)` }} />

                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border transition-transform group-hover:scale-110 duration-300"
                      style={{ background:`${feature.color}15`, borderColor:`${feature.color}30` }}>
                      <span className="text-2xl">{feature.emoji}</span>
                    </div>
                    <h3 className="text-xl font-black mb-2 text-white" style={{ fontFamily:'Syne, sans-serif' }}>
                      {feature.title}
                    </h3>
                    <p className="text-cozy-muted text-sm font-light leading-relaxed">{feature.desc}</p>
                    <div className="mt-4 flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider"
                      style={{ color:`${feature.color}80` }}>
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:feature.color }} />
                      LIVE & SYNCED
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── CTA FOOTER ────────────────────────────────────────────────────── */}
        <section className="py-16 text-center relative">
          <motion.div
            initial={{ opacity:0, scale:0.9 }} whileInView={{ opacity:1, scale:1 }}
            viewport={{ once:true }}
            className="relative rounded-3xl border border-white/8 p-10 md:p-16 overflow-hidden"
            style={{ background:'linear-gradient(135deg, rgba(19,15,38,0.9), rgba(28,23,54,0.7))' }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <motion.div animate={{ scale:[1,1.2,1], opacity:[0.3,0.6,0.3] }} transition={{ repeat:Infinity, duration:6 }}
                className="absolute -top-10 -left-10 w-48 h-48 rounded-full blur-3xl" style={{ background:'rgba(139,92,246,0.3)' }} />
              <motion.div animate={{ scale:[1,1.15,1] }} transition={{ repeat:Infinity, duration:8, delay:2 }}
                className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl" style={{ background:'rgba(255,107,151,0.2)' }} />
            </div>
            <div className="relative z-10 space-y-5">
              <motion.div animate={{ rotate:[0,-5,5,-3,0] }} transition={{ repeat:Infinity, duration:4 }}
                className="text-5xl">🧁</motion.div>
              <h2 className="text-3xl md:text-4xl font-black text-white" style={{ fontFamily:'Syne, sans-serif' }}>
                "We may be far, but we have{' '}
                <span className="text-rainbow">our own world."</span>
              </h2>
              <p className="text-cozy-muted font-light max-w-md mx-auto">
                Two players. One private space. Infinite memories.
              </p>
              <Link to="/auth">
                <motion.button
                  whileHover={{ scale:1.05, boxShadow:'0 0 50px rgba(139,92,246,0.5)' }}
                  whileTap={{ scale:0.97 }}
                  className="px-10 py-4 rounded-2xl font-black text-base text-white flex items-center gap-3 cursor-pointer mx-auto mt-3 border-2 border-white/15"
                  style={{ background:'linear-gradient(135deg, #8B5CF6, #FF6B97)', fontFamily:'Syne, sans-serif' }}
                >
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </section>

      <StickyFooter variant="full" />
      </div>
    </div>
  );
}