// src/pages/World/DashboardHome.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpace } from '../../context/SpaceContext';
import { Gamepad2, Sparkles, ArrowUpRight, Zap, Music, MessageSquare, Layers, RefreshCw, Trophy, Flame, Heart, Shield, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const AI_SUGGESTIONS = [
  { title:'Late-Night Philosophy',  prompt:"If our duo had a theme song written by an AI, what genre would it be and why?",                     tag:'🧠', color:'#8B5CF6' },
  { title:'Chaos Mode',             prompt:"Name one thing about the other person that would genuinely surprise a stranger. No lying.",            tag:'🔥', color:'#FB923C' },
  { title:'Memory Lane',            prompt:"What's the first moment you knew this person was going to be important to you?",                      tag:'💭', color:'#06B6D4' },
  { title:'Future Vision',          prompt:"Describe what we'll both be doing exactly 5 years from today. Be embarrassingly specific.",           tag:'🚀', color:'#34D399' },
  { title:'Appreciation Dump',      prompt:"3 things the other person does that you've never said thank you for. Go.",                           tag:'❤️', color:'#FF6B97' },
  { title:'Hot Take Corner',        prompt:"Most controversial opinion on something totally trivial. Defend it with your life.",                  tag:'⚡', color:'#FCD34D' },
];

const GATES = [
  { to:'/room/games',    emoji:'🕹️', title:'Arcade Room',    desc:'Real-time games synced to Firebase. Compete!',        badge:'4 GAMES',     accent:'#FCD34D', bg:'rgba(252,211,77,0.08)',  border:'rgba(252,211,77,0.25)' },
  { to:'/room/chat',     emoji:'💬', title:'Chat Room',      desc:'Live messages, emoji reactions, typing indicator.',   badge:'LIVE SYNC',   accent:'#FF6B97', bg:'rgba(255,107,151,0.08)', border:'rgba(255,107,151,0.25)'},
  { to:'/room/music',    emoji:'🎵', title:'Music Room',     desc:'Synced playback. Both hear the same track live.',     badge:'SYNC READY',  accent:'#06B6D4', bg:'rgba(6,182,212,0.08)',   border:'rgba(6,182,212,0.25)'  },
  { to:'/room/ai-zone',  emoji:'🤖', title:'AI Prompt Lab',  desc:'AI dares, icebreakers, chaos mode prompts.',         badge:'AI POWERED',  accent:'#A78BFA', bg:'rgba(167,139,250,0.08)', border:'rgba(167,139,250,0.25)'},
  { to:'/room/memories', emoji:'📸', title:'Duo Archives',   desc:'Save your moments, wins, and milestones.',           badge:'MEMORIES',    accent:'#FCD34D', bg:'rgba(252,211,77,0.08)',  border:'rgba(252,211,77,0.25)' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return { text:'Still awake?',     emoji:'🌙', sub:"hope there's a good reason" };
  if (h < 12) return { text:'Good morning',      emoji:'☀️', sub:'coffee first, everything second'};
  if (h < 17) return { text:'Good afternoon',    emoji:'🌤️', sub:'peak hours activated'         };
  if (h < 21) return { text:'Good evening',      emoji:'🌆', sub:'golden hour energy'            };
  return              { text:'Late night session',emoji:'🌃', sub:'the real ones stay up late'   };
}

export default function DashboardHome() {
  const { user, partner, myProgression, partnerProgression } = useSpace();
  const progression = myProgression; // shorthand
  const [aiIdx,  setAiIdx]  = useState(0);
  const [aiAnim, setAiAnim] = useState(false);
  const greeting = getGreeting();
  const sug      = AI_SUGGESTIONS[aiIdx];

  const rollAI = () => {
    if (aiAnim) return;
    setAiAnim(true);
    setTimeout(() => { setAiIdx(i => (i + 1) % AI_SUGGESTIONS.length); setAiAnim(false); }, 280);
  };

  return (
    <div className="relative min-h-full">
      {/* Ambient bg — static on mobile, subtle animation on desktop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-20 w-80 h-80 rounded-full blur-3xl hidden md:block"
          style={{ background:'rgba(139,92,246,0.15)' }} />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full blur-3xl hidden md:block"
          style={{ background:'rgba(255,107,151,0.10)' }} />
        {/* Subtle static blobs for mobile (no animation = no jank) */}
        <div className="absolute -top-32 -left-20 w-64 h-64 rounded-full md:hidden"
          style={{ background:'rgba(139,92,246,0.12)', filter:'blur(50px)' }} />
        <div className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full md:hidden"
          style={{ background:'rgba(255,107,151,0.08)', filter:'blur(40px)' }} />
        {/* Floating emojis — desktop only */}
        {['⭐','💫','✨','🌟'].map((e,i) => (
          <motion.div key={e}
            animate={{ y:[0,-30,0], opacity:[0.3,0.7,0.3] }}
            transition={{ repeat:Infinity, duration:4+i*1.5, delay:i*0.8, ease:'easeInOut' }}
            className="absolute text-xl pointer-events-none select-none hidden md:block"
            style={{ left:`${15+i*22}%`, top:`${10+i*8}%` }}>{e}</motion.div>
        ))}
      </div>


      <div className="relative z-10 p-3 md:p-7 space-y-5 max-w-6xl mx-auto w-full">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
          className="relative rounded-3xl overflow-hidden border border-white/8 p-4 md:p-8"
          style={{ background:'linear-gradient(135deg, rgba(19,15,38,0.95) 0%, rgba(28,23,54,0.7) 100%)' }}>
          <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full blur-3xl pointer-events-none" style={{ background:'rgba(255,107,151,0.12)' }} />
          <div className="absolute -bottom-6  -left-6  w-40 h-40 rounded-full blur-2xl pointer-events-none" style={{ background:'rgba(139,92,246,0.10)' }} />

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <motion.span animate={{ rotate:[0,-10,10,0] }} transition={{ repeat:Infinity, duration:3 }} className="text-xl">{greeting.emoji}</motion.span>
                <div>
                  <span className="text-[9px] font-mono text-cozy-muted uppercase tracking-widest">{greeting.text}</span>
                  <span className="text-[9px] text-cozy-muted/50 ml-2 italic">· {greeting.sub}</span>
                </div>
              </div>
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight" style={{ fontFamily:'Syne, sans-serif' }}>
                {user?.name || 'Welcome back'}
              </h1>
              <p className="text-cozy-muted text-sm font-light leading-relaxed max-w-sm">
                {partner
                  ? <><span className="text-white font-semibold">{partner.name}</span> {partner.avatar} is {partner.currentActivity || 'online'} · <span style={{ color:'#34D399' }}>synced ✓</span></>
                  : <span className="opacity-60">Your partner hasn't joined yet. Share your room code from lobby.</span>
                }
              </p>
            </div>

            {/* Live stat card */}
            <div className="flex-shrink-0 rounded-2xl border border-white/8 p-4 space-y-2 min-w-[150px]" style={{ background:'rgba(0,0,0,0.4)' }}>
              <div className="flex items-center gap-1 text-[8px] font-mono text-cozy-muted uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Session Live
              </div>
              {[
                { icon:Trophy, label:`Lv ${myProgression.level} (You)`,      color:'#FCD34D' },
                { icon:Star,   label:`Lv ${partnerProgression.level} (${partner?.name?.split(' ')[0] || 'Partner'})`, color:'#FF6B97' },
                { icon:Flame,  label:`${myProgression.streak}d Streak`,      color:'#FB923C' },
                { icon:Heart,  label:`${myProgression.milestonesCount} Saved`, color:'#FF6B97' },
              ].map(({ icon:Icon, label, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                  <span className="text-[10px] text-white font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* XP bar — YOUR personal progress */}
          <div className="relative z-10 mt-5 space-y-1">
            <div className="flex justify-between text-[8px] font-mono text-cozy-muted">
              <span>Your XP: {myProgression.xp}</span>
              <span>{myProgression.xpToNextLevel} → Level {myProgression.level + 1}</span>
            </div>
            <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full"
                style={{ background:'linear-gradient(90deg, #8B5CF6, #FF6B97, #06B6D4)' }}
                initial={{ width:0 }}
                animate={{ width:`${Math.min((myProgression.xp/myProgression.xpToNextLevel)*100,100)}%` }}
                transition={{ duration:1.2, ease:'easeOut', delay:0.3 }} />
            </div>
            {/* Partner XP bar */}
            {partner && (
              <>
                <div className="flex justify-between text-[8px] font-mono text-cozy-muted mt-2">
                  <span style={{ color:'#FF6B97' }}>{partner.name}&apos;s XP: {partnerProgression.xp}</span>
                  <span style={{ color:'#FF6B97' }}>{partnerProgression.xpToNextLevel} → Level {partnerProgression.level + 1}</span>
                </div>
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    style={{ background:'linear-gradient(90deg, #FF6B97, #F472B6)' }}
                    initial={{ width:0 }}
                    animate={{ width:`${Math.min((partnerProgression.xp/partnerProgression.xpToNextLevel)*100,100)}%` }}
                    transition={{ duration:1.2, ease:'easeOut', delay:0.5 }} />
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* ── GRID ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── LEFT: gates + AI ────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            <p className="text-[9px] font-mono uppercase tracking-widest text-cozy-muted flex items-center gap-2">
              <Zap className="w-3 h-3 text-accent-cyan" /> CO-OP SECTORS
            </p>

            {/* Gate grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              {GATES.map((g, i) => (
                <motion.div key={g.to}
                  initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:i*0.07, duration:0.3 }}>
                  <Link to={g.to} className="group block h-full">
                    <motion.div
                      whileHover={{ y:-4, scale:1.02 }}
                      whileTap={{ scale:0.98 }}
                      className="h-full flex flex-col justify-between p-3 md:p-4 rounded-2xl border transition-all duration-300 cursor-pointer"
                      style={{ background:g.bg, borderColor:g.border }}>
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <motion.span className="text-2xl" whileHover={{ rotate:[-5,5,0], scale:1.2 }} transition={{ duration:0.3 }}>
                            {g.emoji}
                          </motion.span>
                          <span className="text-[7px] font-mono font-black px-1.5 py-0.5 rounded-full border"
                            style={{ background:`${g.accent}20`, borderColor:`${g.accent}40`, color:g.accent }}>
                            {g.badge}
                          </span>
                        </div>
                        <h4 className="text-white font-black text-sm mb-1" style={{ fontFamily:'Syne, sans-serif' }}>{g.title}</h4>
                        <p className="text-[10px] text-cozy-muted font-light leading-relaxed">{g.desc}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color:`${g.accent}80` }}>
                          ● ENTER
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color:g.accent }} />
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* AI suggestion */}
            <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
              className="relative rounded-3xl border border-white/8 p-5 overflow-hidden"
              style={{ background:'linear-gradient(135deg, rgba(13,10,26,0.9) 0%, rgba(139,92,246,0.05) 100%)' }}>
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-2xl pointer-events-none" style={{ background:`${sug.color}20` }} />

              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" style={{ color:sug.color }} />
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color:sug.color }}>AI PROMPT SUGGESTION</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-mono px-2 py-0.5 rounded-full border"
                    style={{ background:`${sug.color}15`, borderColor:`${sug.color}30`, color:sug.color }}>
                    {sug.tag} {sug.title}
                  </span>
                  <motion.button whileHover={{ rotate:180 }} transition={{ duration:0.3 }}
                    onClick={rollAI}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-cozy-muted hover:text-white cursor-pointer transition-all">
                    <RefreshCw className={`w-3.5 h-3.5 ${aiAnim ? 'animate-spin' : ''}`} />
                  </motion.button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.p key={aiIdx}
                  initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }}
                  transition={{ duration:0.22 }}
                  className="text-sm text-white font-light leading-relaxed relative z-10 italic border-l-2 pl-3"
                  style={{ borderColor:`${sug.color}50` }}>
                  "{sug.prompt}"
                </motion.p>
              </AnimatePresence>

              <div className="mt-4 flex justify-end relative z-10">
                <Link to="/room/ai-zone" className="text-[9px] font-mono font-bold transition-colors hover:opacity-80" style={{ color:sug.color }}>
                  OPEN AI ENGINE →
                </Link>
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT: partner + stats ───────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-[9px] font-mono uppercase tracking-widest text-cozy-muted flex items-center gap-2">
              <Heart className="w-3 h-3 text-accent-pink" /> DUO STATUS
            </p>

            {/* Partner card — shows partner's level too */}
            <motion.div initial={{ opacity:0, x:14 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }}
              className="rounded-2xl border border-white/5 p-4" style={{ background:'rgba(13,10,26,0.7)' }}>
              <p className="text-[8px] font-mono text-cozy-muted uppercase tracking-wider mb-3">Partner</p>
              {partner ? (
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-cozy-soft border border-white/10 flex items-center justify-center text-2xl">
                      {partner.avatar || '👤'}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-cozy-dark animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold truncate" style={{ fontFamily:'Syne, sans-serif' }}>{partner.name}</p>
                    <p className="text-[9px] text-accent-pink font-light">{partner.currentActivity || 'Online'}</p>
                    {/* Partner's individual level */}
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Trophy className="w-3 h-3" style={{ color:'#FF6B97' }} />
                      <span className="text-[9px] font-mono" style={{ color:'#FF6B97' }}>Level {partnerProgression.level} · {partnerProgression.xp} XP</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 opacity-40">
                  <div className="w-11 h-11 rounded-2xl bg-cozy-soft border border-white/10 flex items-center justify-center text-xl flex-shrink-0">❓</div>
                  <div>
                    <p className="text-white font-bold text-sm">Not joined yet</p>
                    <p className="text-[9px] text-cozy-muted font-light">Share room code</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Stats — your individual stats */}
            {[
              { label:'Your Level',   value:`${myProgression.level}`,          color:'#FCD34D', icon:Trophy  },
              { label:'Day Streak',   value:`${myProgression.streak}d`,        color:'#FF6B97', icon:Flame   },
              { label:'Your XP',      value:`${myProgression.xp}`,             color:'#06B6D4', icon:Zap     },
              { label:'Milestones',   value:`${myProgression.milestonesCount}`,color:'#8B5CF6', icon:Layers  },
            ].map(({ label, value, color, icon:Icon }, i) => (
              <motion.div key={label}
                initial={{ opacity:0, x:14 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.15+i*0.05 }}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-white/5"
                style={{ background:'rgba(13,10,26,0.55)' }}>
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <span className="text-[9px] text-cozy-muted font-mono uppercase tracking-wide">{label}</span>
                </div>
                <span className="text-xs text-white font-black" style={{ fontFamily:'Syne, sans-serif' }}>{value}</span>
              </motion.div>
            ))}

            {/* Memory link */}
            <motion.div initial={{ opacity:0, x:14 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.4 }}>
              <Link to="/room/memories"
                className="flex flex-col gap-1.5 p-4 rounded-2xl border transition-all hover:border-accent-pink/30 group"
                style={{ background:'rgba(13,10,26,0.55)', borderColor:'rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-mono text-cozy-muted uppercase tracking-wider">Duo Archives</span>
                  <ArrowUpRight className="w-3 h-3 text-cozy-muted group-hover:text-accent-pink transition-colors" />
                </div>
                <p className="text-[10px] text-white font-light leading-relaxed">Your shared milestones, wins, and memories.</p>
                <span className="text-[8px] font-mono text-accent-pink">BROWSE TIMELINE →</span>
              </Link>
            </motion.div>

            {/* Session */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 text-[8px] font-mono text-cozy-muted"
              style={{ background:'rgba(6,182,212,0.03)' }}>
              <span className="flex items-center gap-1.5"><Shield className="w-2.5 h-2.5 text-emerald-400" /> Encrypted</span>
              <span>{progression.milestonesCount} saved</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}