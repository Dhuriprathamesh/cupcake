// src/pages/WelcomePage.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSpace } from '../context/SpaceContext';
import { ArrowRight, Gamepad2, Music, MessageSquare, Sparkles, Flame, Dices, Smile } from 'lucide-react';
import StickyFooter from '../components/ui/StickyFooter';

const ZONES = [
  { emoji:'🕹️', title:'Arcade Arena',  desc:'Real-time Firebase games. Tic-Tac-Toe, Emoji Quiz, Reaction Blitz. All synced.', color:'#FCD34D', bg:'rgba(252,211,77,0.10)', border:'rgba(252,211,77,0.25)', label:'GAMES' },
  { emoji:'💬', title:'Chat Room',     desc:'Live messages, sticker packs, emoji reactions, and typing indicators.', color:'#FF6B97', bg:'rgba(255,107,151,0.10)', border:'rgba(255,107,151,0.22)', label:'CHAT' },
  { emoji:'🎵', title:'Music Room',    desc:'Synced vinyl player. Both of you hear the same track at the same time.', color:'#06B6D4', bg:'rgba(6,182,212,0.10)', border:'rgba(6,182,212,0.22)', label:'MUSIC' },
  { emoji:'🤖', title:'AI Prompt Lab', desc:'Icebreakers, chaos mode, deep talk. Typewriter AI. +10 XP per roll.', color:'#8B5CF6', bg:'rgba(139,92,246,0.10)', border:'rgba(139,92,246,0.22)', label:'AI' },
];

const FUNNY_QUOTES = [
  "According to our servers, you two are 300% more chaotic together. That's a feature. 💀",
  "Warning: Entering this world may cause infinite inside jokes. We are not responsible. 🤡",
  "Error 404: Single energy not found. Proceeding to chaos mode. 🔥",
  "Scientists confirm: duo connections formed in Cupcake World last 2x longer. Source: trust us. 🧪",
  "Our AI predicts you two will fight over the playlist within 10 minutes. Place your bets. 😤",
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const { user } = useSpace();
  const [mood, setMood] = useState('🧁 Ready');
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [clickedEgg, setClickedEgg] = useState(false);

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col"
      style={{ background:'linear-gradient(180deg, #06040e 0%, #0a0616 50%, #07050F 100%)' }}>

      {/* Ambient bg */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div animate={{ scale:[1,1.2,1], opacity:[0.3,0.6,0.3] }} transition={{ repeat:Infinity, duration:10 }}
          className="absolute -top-1/3 left-1/4 w-[55vw] h-[55vw] rounded-full blur-[130px]"
          style={{ background:'rgba(255,107,151,0.10)' }} />
        <motion.div animate={{ scale:[1,1.15,1] }} transition={{ repeat:Infinity, duration:13, delay:3 }}
          className="absolute -bottom-1/3 right-1/4 w-[50vw] h-[50vw] rounded-full blur-[120px]"
          style={{ background:'rgba(139,92,246,0.10)' }} />
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center border-b-2 border-dashed border-white/8 px-5 md:px-8 py-5 gap-4">
        <div className="flex items-center gap-3">
          <motion.div animate={{ rotate:[0,-5,5,0] }} transition={{ repeat:Infinity, duration:4 }}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-xl"
            style={{ background:'linear-gradient(135deg, #8B5CF6, #FF6B97)', boxShadow:'0 0 25px rgba(139,92,246,0.4)' }}>
            🧁
          </motion.div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2" style={{ fontFamily:'Syne, sans-serif' }}>
              Cupcake Universe
              <motion.span animate={{ opacity:[1,0.5,1] }} transition={{ repeat:Infinity, duration:1.5 }}
                className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-accent-pink/10 border border-accent-pink/25 text-accent-pink">
                LIVE
              </motion.span>
            </h4>
            <p className="text-[9px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              Connection Active
            </p>
          </div>
        </div>

        {/* User badge */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl border border-white/8"
          style={{ background:'rgba(255,255,255,0.03)' }}>
          <span className="text-2xl">{user?.avatar || '🧁'}</span>
          <div>
            <p className="text-xs font-black text-white leading-none" style={{ fontFamily:'Syne, sans-serif' }}>{user?.name || 'Player'}</p>
            <p className="text-[8px] font-mono text-accent-pink mt-0.5">All systems go 🚀</p>
          </div>
        </div>
      </header>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <main className="flex-grow relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8 py-5 grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* ── LEFT: zone previews ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-[9px] font-mono tracking-widest text-yellow-400 uppercase font-black">
              🚀 Gate Phase: Pre-Entry Checklist
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase leading-tight" style={{ fontFamily:'Syne, sans-serif' }}>
              Your World is<br />
              <span className="text-rainbow">Fully Baked! 🍰</span>
            </h2>
            <p className="text-cozy-muted text-xs font-light max-w-md">
              Four custom zones, each with a completely different UI personality. Check them out before you enter.
            </p>
          </div>

          {/* Zone grid */}
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {ZONES.map((zone, i) => (
              <motion.div key={zone.title}
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:i*0.08, type:'spring', stiffness:180 }}
                whileHover={{ y:-5, scale:1.02 }}
                className="relative p-3 md:p-5 rounded-2xl border overflow-hidden group transition-all duration-300 cursor-default h-36 md:h-44 flex flex-col justify-between"
                style={{ background:zone.bg, borderColor:zone.border }}>
                {/* Top glow on hover */}
                <div className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background:`linear-gradient(90deg, transparent, ${zone.color}, transparent)` }} />

                <div className="flex items-start justify-between">
                  <motion.div whileHover={{ scale:1.2, rotate:[-5,5,0] }} transition={{ duration:0.3 }}
                    className="text-3xl">{zone.emoji}</motion.div>
                  <span className="text-[8px] font-mono font-black px-2 py-0.5 rounded-full border"
                    style={{ background:`${zone.color}20`, borderColor:`${zone.color}40`, color:zone.color }}>
                    {zone.label}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-black text-white mb-1 group-hover:text-rainbow transition-all"
                    style={{ fontFamily:'Syne, sans-serif' }}>{zone.title}</h3>
                  <p className="text-[10px] text-cozy-muted font-light leading-relaxed">{zone.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: widgets ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Mood picker */}
          <div className="rounded-2xl border border-white/5 p-4 space-y-3" style={{ background:'rgba(15,10,30,0.6)', backdropFilter:'blur(12px)' }}>
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5" style={{ fontFamily:'Syne, sans-serif' }}>
              <Smile className="w-4 h-4 text-accent-pink" /> Pre-Entry Mood
            </h4>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label:'🔥 Chaos',   value:'🔥 Chaos Mode',  color:'#FB923C' },
                { label:'🦖 Gremlin', value:'🦖 Gremlin',     color:'#34D399' },
                { label:'💤 Cozy',    value:'💤 Cozy Mode',   color:'#8B5CF6' },
              ].map(m => (
                <motion.button key={m.label} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                  onClick={() => setMood(m.value)}
                  className="py-2 px-1 rounded-xl border text-[9px] font-black uppercase tracking-wide cursor-pointer text-center transition-all"
                  style={{
                    background:  mood === m.value ? `${m.color}20` : 'rgba(255,255,255,0.03)',
                    borderColor: mood === m.value ? `${m.color}50` : 'rgba(255,255,255,0.06)',
                    color:       mood === m.value ? m.color : '#9E97B8',
                    fontFamily:  'Space Grotesk, sans-serif',
                  }}>
                  {m.label}
                </motion.button>
              ))}
            </div>
            <div className="p-2 rounded-xl border border-white/5 text-[9px] font-mono text-center"
              style={{ background:'rgba(0,0,0,0.3)' }}>
              Vibe: <span className="text-white font-bold">{mood}</span>
            </div>
          </div>

          {/* AI Reality Check */}
          <div className="rounded-2xl border border-white/5 p-4 space-y-3" style={{ background:'rgba(15,10,30,0.6)', backdropFilter:'blur(12px)' }}>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5" style={{ fontFamily:'Syne, sans-serif' }}>
                <Flame className="w-4 h-4 text-orange-400 animate-pulse" /> AI Reality Check
              </h4>
              <motion.button whileHover={{ rotate:180, scale:1.1 }} transition={{ duration:0.3 }}
                onClick={() => setQuoteIdx(i => (i + 1) % FUNNY_QUOTES.length)}
                className="p-1.5 rounded-lg hover:bg-white/8 cursor-pointer transition-all">
                <Dices className="w-3.5 h-3.5 text-cozy-muted" />
              </motion.button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={quoteIdx}
                initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-5 }}
                className="p-3 rounded-xl border border-white/5 min-h-[60px] flex items-center"
                style={{ background:'rgba(0,0,0,0.3)' }}>
                <p className="text-[10px] font-mono italic text-yellow-200/80 leading-relaxed">
                  "{FUNNY_QUOTES[quoteIdx]}"
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Easter egg */}
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
            onClick={() => setClickedEgg(true)}
            className="w-full p-3 rounded-xl border border-red-500/15 text-[9px] font-mono text-cozy-muted text-center cursor-pointer transition-all"
            style={{ background:'rgba(239,68,68,0.05)' }}>
            {clickedEgg ? '🎉 Achievement Unlocked: Button Pusher! +0 XP lmao' : '🚨 DO NOT CLICK THIS BUTTON'}
          </motion.button>
        </div>
      </main>

      {/* ── FOOTER CTA ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 md:px-8 py-5 border-t-2 border-dashed border-white/8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <p className="text-[9px] font-mono text-cozy-muted uppercase tracking-wider">
            Ready to link up? Your partner is waiting.
          </p>
          <p className="text-[8px] font-mono text-accent-pink/70 mt-0.5">
            ⚠️ You'll need to host or join a room from the Lobby.
          </p>
        </div>
        <motion.button
          whileHover={{ scale:1.05, boxShadow:'0 0 35px rgba(139,92,246,0.45)' }}
          whileTap={{ scale:0.97 }}
          onClick={() => navigate('/lobby')}
          className="px-8 py-3.5 rounded-2xl font-black text-sm text-white flex items-center gap-2.5 cursor-pointer border-2 border-white/15"
          style={{ background:'linear-gradient(135deg, #8B5CF6, #FF6B97)', fontFamily:'Syne, sans-serif' }}
        >
          Enter The World Arena
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
      <StickyFooter variant="lobby" />
    </div>
  );
}