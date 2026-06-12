// src/layouts/DuoRoomLayout.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSpace } from '../context/SpaceContext';
import { useStreak } from '../hooks/useStreak';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Gamepad2, Music, Layers,
  Sparkles, Flame, LogOut, Radio, MessageSquare,
  Menu, X,
} from 'lucide-react';
import SoundToggle from '../components/ui/SoundToggle';
import FloatingChat from '../components/FloatingChat';
import NavPermissionManager, { useNavPermission } from '../components/NavPermission';

// ── Per-route zone config ──────────────────────────────────────────────────
const ZONE_CONFIG = {
  '/room':          { key:'home',     label:'Home Base',    emoji:'🏠', bg:'linear-gradient(135deg,#0f0822 0%,#1a0f3a 40%,#07050F 100%)', blob1:'rgba(139,92,246,0.18)', blob2:'rgba(255,107,151,0.08)', accent:'#8B5CF6', sidebarBg:'rgba(10,6,24,0.97)',  headerBg:'rgba(10,6,24,0.95)',  particle:'⭐', particleCount:5, funny:"You two are the main characters 🎬" },
  '/room/games':    { key:'games',    label:'Arcade Arena', emoji:'🕹️', bg:'linear-gradient(135deg,#0a0500 0%,#1a0800 40%,#07050F 100%)', blob1:'rgba(251,191,36,0.20)',  blob2:'rgba(234,88,12,0.12)',   accent:'#FCD34D', sidebarBg:'rgba(15,8,0,0.97)',   headerBg:'rgba(15,8,0,0.95)',   particle:'🎮', particleCount:6, funny:"No rage-quitting allowed 😤" },
  '/room/chat':     { key:'chat',     label:'Chat Room',    emoji:'💬', bg:'linear-gradient(135deg,#060010 0%,#1a0535 40%,#07050F 100%)', blob1:'rgba(255,107,151,0.18)', blob2:'rgba(139,92,246,0.10)', accent:'#FF6B97', sidebarBg:'rgba(8,0,16,0.97)',   headerBg:'rgba(8,0,16,0.95)',   particle:'💭', particleCount:4, funny:"No ghosting allowed in here 👻" },
  '/room/music':    { key:'music',    label:'Music Room',   emoji:'🎵', bg:'linear-gradient(135deg,#00080f 0%,#001a2e 40%,#07050F 100%)', blob1:'rgba(6,182,212,0.18)',   blob2:'rgba(139,92,246,0.08)', accent:'#06B6D4', sidebarBg:'rgba(0,8,18,0.97)',   headerBg:'rgba(0,8,18,0.95)',   particle:'🎶', particleCount:5, funny:"DJ mode: activated 🎧" },
  '/room/memories': { key:'memories', label:'Duo Archives', emoji:'📸', bg:'linear-gradient(135deg,#0a0800 0%,#1a1400 40%,#07050F 100%)', blob1:'rgba(252,211,77,0.15)',  blob2:'rgba(255,107,151,0.08)',accent:'#FCD34D', sidebarBg:'rgba(12,10,0,0.97)',  headerBg:'rgba(12,10,0,0.95)',  particle:'🌟', particleCount:5, funny:"Every moment saved forever 📸" },
  '/room/ai-zone':  { key:'ai',       label:'AI Lab',       emoji:'🤖', bg:'linear-gradient(135deg,#040008 0%,#0d001a 40%,#07050F 100%)', blob1:'rgba(139,92,246,0.22)', blob2:'rgba(6,182,212,0.10)',   accent:'#A78BFA', sidebarBg:'rgba(6,0,14,0.97)',   headerBg:'rgba(6,0,14,0.95)',   particle:'✨', particleCount:7, funny:"AI says you're 99.9% compatible 🤝" },
};

const EMOJIS    = ['❤️','✨','🔥','😂','😮','🧩','💀','🎉'];
const NAV_ITEMS = [
  { to:'/room',          icon:LayoutDashboard, label:'HOME',    end:true,  emoji:'🏠' },
  { to:'/room/games',    icon:Gamepad2,         label:'ARCADE',           emoji:'🕹️' },
  { to:'/room/chat',     icon:MessageSquare,    label:'CHAT',             emoji:'💬' },
  { to:'/room/music',    icon:Music,            label:'MUSIC',            emoji:'🎵' },
  { to:'/room/memories', icon:Layers,           label:'DUO',              emoji:'📸' },
  { to:'/room/ai-zone',  icon:Sparkles,         label:'AI LAB',           emoji:'🤖' },
];

// ── Detect mobile for perf optimisations ──────────────────────────────────
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

// ── Floating bg particles — DESKTOP ONLY ─────────────────────────────────
function FloatingParticle({ emoji, delay, duration, x, size }) {
  return (
    <motion.div
      initial={{ y:'110vh', opacity:0, rotate:0 }}
      animate={{ y:'-20vh', opacity:[0,1,1,0], rotate:360 }}
      transition={{ duration, delay, repeat:Infinity, ease:'linear' }}
      className="absolute pointer-events-none select-none z-0 hidden md:block"
      style={{ left:`${x}%`, fontSize:size }}
    >{emoji}</motion.div>
  );
}

// ── Blobs — static on mobile, animated on desktop ────────────────────────
function BlobField({ zone }) {
  const mobile = isMobile();
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Blob 1 */}
      {mobile ? (
        <div className="absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full"
          style={{ background: zone.blob1, filter:'blur(60px)', opacity:0.7 }} />
      ) : (
        <motion.div
          animate={{ scale:[1,1.12,1], opacity:[0.6,0.9,0.6] }}
          transition={{ duration:10, repeat:Infinity, ease:'easeInOut' }}
          className="absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full blur-[100px]"
          style={{ background:zone.blob1 }} />
      )}
      {/* Blob 2 */}
      {mobile ? (
        <div className="absolute -bottom-1/4 -right-1/4 w-[60vw] h-[60vw] rounded-full"
          style={{ background: zone.blob2, filter:'blur(50px)', opacity:0.6 }} />
      ) : (
        <motion.div
          animate={{ scale:[1,1.15,0.95,1] }}
          transition={{ duration:13, repeat:Infinity, ease:'easeInOut', delay:2 }}
          className="absolute -bottom-1/4 -right-1/4 w-[60vw] h-[60vw] rounded-full blur-[90px]"
          style={{ background:zone.blob2 }} />
      )}
    </div>
  );
}

export default function DuoRoomLayout() {
  const { user, partner, myProgression, progression, roomData, liveReactions, triggerLiveReaction, logout } = useSpace();
  const prog = myProgression ?? progression ?? { streak:0, level:1, xp:0, xpToNextLevel:100 };

  const navigate = useNavigate();
  const location = useLocation();

  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileNavOpen,      setMobileNavOpen]      = useState(false);
  const [localFlings,        setLocalFlings]        = useState([]);
  const [showFunny,          setShowFunny]          = useState(false);
  const [funnyText,          setFunnyText]          = useState('');

  useStreak(user, roomData);
  const { permNav, pending, pendingTo, denied, cancelPending } = useNavPermission();

  const zone = ZONE_CONFIG[location.pathname] ?? ZONE_CONFIG['/room'];

  // Close mobile nav on route change
  useEffect(() => { setMobileNavOpen(false); }, [location.pathname]);

  // Funny toast
  useEffect(() => {
    setFunnyText(zone.funny);
    setShowFunny(true);
    const t = setTimeout(() => setShowFunny(false), 3000);
    return () => clearTimeout(t);
  }, [location.pathname]);

  // Sync live reactions
  useEffect(() => {
    if (liveReactions?.length) {
      const fresh = liveReactions.filter(r => !localFlings.find(l => l.id === r.id));
      if (fresh.length) setLocalFlings(p => [...p, ...fresh]);
    }
  }, [liveReactions]);

  useEffect(() => {
    if (!localFlings.length) return;
    const t = setTimeout(() => setLocalFlings([]), 2500);
    return () => clearTimeout(t);
  }, [localFlings]);

  const handleFling = (emoji) => {
    const id = `local_${Math.random().toString(36).substring(2)}`;
    setLocalFlings(p => [...p, { id, emoji }]);
    triggerLiveReaction?.(emoji);
  };

  const handleDisconnect = async () => {
    await logout();
    navigate('/auth', { replace:true });
  };

  const particles = Array.from({ length: zone.particleCount }, (_, i) => ({
    id:i, emoji:zone.particle,
    delay: i * (12 / zone.particleCount),
    duration: 12 + (i%3)*4,
    x: 5 + (i * (88 / zone.particleCount)),
    size: `${10 + (i%3)*6}px`,
  }));

  // ── Sidebar nav content (shared desktop + mobile drawer) ──────────────
  const NavContent = ({ onClose }) => (
    <>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5 flex-shrink-0">
        <motion.div
          animate={{ rotate:[0,-8,8,-4,0] }}
          transition={{ repeat:Infinity, duration:5, ease:'easeInOut' }}
          className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 shadow-lg"
          style={{ background:`linear-gradient(135deg,${zone.accent}50,${zone.accent}90)`, boxShadow:`0 0 20px ${zone.accent}40` }}>
          🧁
        </motion.div>
        <div className="min-w-0">
          <p className="text-[11px] font-black tracking-widest text-white truncate" style={{ fontFamily:'Syne,sans-serif' }}>CUPCAKE PRIVATE</p>
          <p className="text-[8px] font-mono mt-0.5 truncate" style={{ color:zone.accent }}>{zone.emoji} {zone.label}</p>
        </div>
        {onClose && (
          <button onClick={onClose}
            className="ml-auto p-1.5 rounded-xl text-cozy-muted hover:text-white hover:bg-white/10 transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, end, emoji }) => (
          <NavLink key={to} to={to} end={end}
            onClick={e => { e.preventDefault(); permNav(to); onClose?.(); }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer ${
                isActive ? 'text-white' : 'text-cozy-muted hover:text-white hover:bg-white/5'
              }`}
            style={({ isActive }) => isActive ? {
              background:`linear-gradient(135deg,${zone.accent}25,${zone.accent}10)`,
              border:`1px solid ${zone.accent}30`,
              boxShadow:`0 0 12px ${zone.accent}20`,
            } : {}}>
            <span className="text-xl flex-shrink-0">{emoji}</span>
            <span className="text-sm truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 pt-3 border-t border-white/5 space-y-2 flex-shrink-0">
        <div className="rounded-2xl p-3 space-y-2 border border-white/5" style={{ background:'rgba(255,255,255,0.03)' }}>
          <div className="flex justify-between items-center text-[9px] font-mono">
            <span className="flex items-center gap-1 text-cozy-muted">
              <Flame className="w-3 h-3 text-accent-pink" />
              <strong className="text-white">{prog.streak}d Streak</strong>
            </span>
            <span className="font-bold" style={{ color:zone.accent }}>LVL {prog.level}</span>
          </div>
          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ background:`linear-gradient(90deg,${zone.accent},${zone.accent}aa)`,
                width:`${Math.min((prog.xp/prog.xpToNextLevel)*100,100)}%` }} />
          </div>
          <div className="flex justify-between text-[8px] font-mono text-cozy-muted">
            <span>{prog.xp} XP</span><span>{prog.xpToNextLevel} NEXT</span>
          </div>
        </div>
        <button onClick={handleDisconnect}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] text-cozy-muted hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/15 transition-all cursor-pointer">
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-mono">Disconnect</span>
        </button>
      </div>
    </>
  );

  const isChat = location.pathname === '/room/chat';

  return (
    // Root: full viewport, no overflow
    <div className="fixed inset-0 flex text-cozy-text overflow-hidden">

      {/* ── Zone background (static on mobile, animated on desktop) ────── */}
      <div className="absolute inset-0 z-0 transition-colors duration-700" style={{ background:zone.bg }} />
      <div className="absolute inset-0 z-0">
        <BlobField zone={zone} />
      </div>

      {/* ── Particles — desktop only ─────────────────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none hidden md:block">
        {particles.map(p => <FloatingParticle key={`${zone.key}-${p.id}`} {...p} />)}
      </div>

      {/* ── Emoji flings ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {localFlings.map(r => (
            <motion.span key={r.id}
              initial={{ opacity:1, scale:0.5, x:`${30+Math.random()*40}vw`, y:'90vh' }}
              animate={{ opacity:0, scale:2.5, x:`${10+Math.random()*80}vw`, y:'-10vh' }}
              transition={{ duration:1.6, ease:'easeOut' }}
              className="absolute text-4xl select-none"
              style={{ filter:'drop-shadow(0 0 16px white)' }}>
              {r.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Funny zone toast ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showFunny && (
          <motion.div
            initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:40 }}
            transition={{ duration:0.3 }}
            className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-2xl border text-[11px] font-mono font-bold text-white pointer-events-none whitespace-nowrap max-w-[90vw] text-center"
            style={{ background:'rgba(0,0,0,0.85)', borderColor:`${zone.accent}60`,
              boxShadow:`0 0 20px ${zone.accent}40`, backdropFilter:'blur(12px)' }}>
            {zone.emoji} {funnyText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════
          DESKTOP SIDEBAR — hidden on mobile
      ════════════════════════════════════════════════════════════════ */}
      <motion.aside
        animate={{ width: desktopSidebarOpen ? 230 : 62 }}
        transition={{ duration:0.28, ease:'easeInOut' }}
        className="relative z-20 h-full flex-shrink-0 flex-col border-r border-white/5 overflow-hidden hidden md:flex"
        style={{ background:zone.sidebarBg, backdropFilter:'blur(20px)' }}>

        <div className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background:`linear-gradient(90deg,transparent,${zone.accent}80,transparent)` }} />

        <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
          onClick={() => setDesktopSidebarOpen(p => !p)}
          className="absolute -right-3.5 top-7 w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-cozy-muted hover:text-white z-30 cursor-pointer shadow-lg transition-all"
          style={{ background:zone.sidebarBg }}>
          <motion.span animate={{ rotate: desktopSidebarOpen ? 0 : 180 }} transition={{ duration:0.28 }}>‹</motion.span>
        </motion.button>

        {/* Logo */}
        <div className="flex items-center gap-3 px-3.5 h-16 border-b border-white/5 flex-shrink-0 overflow-hidden">
          <motion.div animate={{ rotate:[0,-8,8,-4,0] }} transition={{ repeat:Infinity, duration:5 }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background:`linear-gradient(135deg,${zone.accent}50,${zone.accent}90)`, boxShadow:`0 0 20px ${zone.accent}40` }}>
            🧁
          </motion.div>
          <AnimatePresence>
            {desktopSidebarOpen && (
              <motion.div initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }} transition={{ duration:0.18 }}>
                <p className="text-[11px] font-black tracking-widest text-white whitespace-nowrap" style={{ fontFamily:'Syne,sans-serif' }}>CUPCAKE PRIVATE</p>
                <p className="text-[8px] font-mono mt-0.5 whitespace-nowrap" style={{ color:zone.accent }}>{zone.emoji} {zone.label}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map(({ to, label, end, emoji }) => (
            <NavLink key={to} to={to} end={end}
              onClick={e => { e.preventDefault(); permNav(to); }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2.5 py-2.5 rounded-xl font-semibold transition-all cursor-pointer overflow-hidden ${
                  isActive ? 'text-white' : 'text-cozy-muted hover:text-white hover:bg-white/5'
                }`}
              style={({ isActive }) => isActive ? {
                background:`linear-gradient(135deg,${zone.accent}25,${zone.accent}10)`,
                border:`1px solid ${zone.accent}30`,
              } : {}}>
              <span className="text-lg flex-shrink-0">{emoji}</span>
              <AnimatePresence>
                {desktopSidebarOpen && (
                  <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.15 }}
                    className="text-xs whitespace-nowrap">{label}</motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* XP + logout */}
        <div className="px-2 pb-3 pt-3 border-t border-white/5 space-y-2 flex-shrink-0">
          <AnimatePresence>
            {desktopSidebarOpen && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} className="overflow-hidden mb-2">
                <div className="rounded-2xl p-3 space-y-2 border border-white/5" style={{ background:'rgba(255,255,255,0.03)' }}>
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="flex items-center gap-1 text-cozy-muted"><Flame className="w-3 h-3 text-accent-pink" /><strong className="text-white">{prog.streak}d</strong></span>
                    <span style={{ color:zone.accent }} className="font-bold">LVL {prog.level}</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ background:`linear-gradient(90deg,${zone.accent},${zone.accent}aa)`,
                        width:`${Math.min((prog.xp/prog.xpToNextLevel)*100,100)}%` }} />
                  </div>
                  <div className="flex justify-between text-[8px] font-mono text-cozy-muted"><span>{prog.xp} XP</span><span>{prog.xpToNextLevel} NEXT</span></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={handleDisconnect}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] text-cozy-muted hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/15 cursor-pointer transition-all">
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            <AnimatePresence>
              {desktopSidebarOpen && (
                <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="font-mono whitespace-nowrap">Disconnect</motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* ════════════════════════════════════════════════════════════════
          MOBILE DRAWER OVERLAY
      ════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)' }}
              onClick={() => setMobileNavOpen(false)} />
            <motion.div
              initial={{ x:'-100%' }} animate={{ x:0 }} exit={{ x:'-100%' }}
              transition={{ type:'spring', stiffness:320, damping:32 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col md:hidden"
              style={{ background:zone.sidebarBg, backdropFilter:'blur(20px)', borderRight:'1px solid rgba(255,255,255,0.06)' }}>
              <div className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background:`linear-gradient(90deg,transparent,${zone.accent}80,transparent)` }} />
              <NavContent onClose={() => setMobileNavOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════
          MAIN WORKSPACE
      ════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">

        {/* ── STICKY HEADER (top) ─────────────────────────────────────── */}
        <header className="flex-shrink-0 h-14 flex items-center justify-between px-3 md:px-5 border-b border-white/8 z-30"
          style={{ background:zone.headerBg, backdropFilter:'blur(20px)' }}>

          {/* Left */}
          <div className="flex items-center gap-2 overflow-hidden min-w-0">

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-cozy-muted hover:text-white transition-all cursor-pointer flex-shrink-0 md:hidden active:scale-90"
              style={{ background:'rgba(255,255,255,0.06)' }}>
              <Menu className="w-4 h-4" />
            </button>

            {/* Zone badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-mono font-bold uppercase tracking-wider flex-shrink-0 border"
              style={{ background:`${zone.accent}15`, borderColor:`${zone.accent}40`, color:zone.accent }}>
              {zone.emoji} {zone.label}
            </div>

            {/* On mobile: show current zone emoji only */}
            <div className="flex sm:hidden items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex-shrink-0 border"
              style={{ background:`${zone.accent}15`, borderColor:`${zone.accent}40`, color:zone.accent }}>
              {zone.emoji} <span className="text-[8px]">{zone.label}</span>
            </div>

            <div className="w-px h-4 bg-white/5 flex-shrink-0" />

            {/* Me */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="relative w-7 h-7 rounded-xl bg-cozy-soft border border-white/10 flex items-center justify-center text-sm flex-shrink-0">
                {user?.avatar || '🧁'}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-cozy-dark" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-bold text-white leading-none">{user?.name || 'You'}</p>
                <p className="text-[8px] text-cozy-muted truncate max-w-[70px]">{user?.currentActivity || 'Online'}</p>
              </div>
            </div>

            {/* Sync dots */}
            <div className="flex items-center gap-0.5 opacity-40 flex-shrink-0">
              {[0,1,2].map(i => (
                <motion.span key={i}
                  animate={{ scale:[1,1.5,1], opacity:[0.4,1,0.4] }}
                  transition={{ repeat:Infinity, duration:1.4, delay:i*0.4 }}
                  className="w-1 h-1 rounded-full"
                  style={{ background:zone.accent }} />
              ))}
            </div>

            {/* Partner */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="relative w-7 h-7 rounded-xl bg-cozy-soft border border-white/10 flex items-center justify-center text-sm flex-shrink-0">
                {partner?.avatar || '❓'}
                <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-cozy-dark ${partner ? 'bg-emerald-500' : 'bg-gray-600'}`} />
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-bold text-white leading-none">{partner?.name || 'Waiting...'}</p>
                <p className="text-[8px] truncate max-w-[70px]" style={{ color: partner ? zone.accent : '#9E97B8' }}>
                  {partner?.currentActivity || (partner ? 'Online' : 'Offline')}
                </p>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <SoundToggle />
            <div className="flex items-center rounded-xl p-1 border border-white/5" style={{ background:'rgba(255,255,255,0.03)' }}>
              {EMOJIS.slice(0,4).map(emoji => (
                <button key={emoji} onClick={() => handleFling(emoji)}
                  className="w-7 h-7 text-sm flex items-center justify-center rounded-lg hover:bg-white/10 active:scale-75 cursor-pointer transition-colors">
                  {emoji}
                </button>
              ))}
              {EMOJIS.slice(4).map(emoji => (
                <button key={emoji} onClick={() => handleFling(emoji)}
                  className="w-7 h-7 text-sm hidden sm:flex items-center justify-center rounded-lg hover:bg-white/10 active:scale-75 cursor-pointer transition-colors">
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT — scrolls between header and bottom nav ───── */}
        <main className={`flex-1 min-h-0 relative ${isChat ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname}
              initial={{ opacity:0, y:8 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-6 }}
              transition={{ duration:0.2, ease:'easeOut' }}
              className="min-h-full">
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ── MOBILE BOTTOM NAV — fixed at bottom ─────────────────────── */}
        <nav className="md:hidden flex-shrink-0 border-t border-white/8 z-30"
          style={{
            background: zone.sidebarBg,
            backdropFilter: 'blur(20px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}>
          {/* Active indicator bar */}
          <div className="relative flex items-center justify-around px-1 pt-1 pb-2">
            {NAV_ITEMS.map(({ to, label, end, emoji }) => (
              <NavLink key={to} to={to} end={end} className="flex-1"
                onClick={e => { e.preventDefault(); permNav(to); }}>
                {({ isActive }) => (
                  <div
                    className="flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl cursor-pointer min-w-0 relative transition-colors duration-200 active:scale-90"
                    style={{ background: isActive ? `${zone.accent}20` : 'transparent' }}>
                    {/* Active top dot */}
                    {isActive && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                        style={{ background: zone.accent }} />
                    )}
                    <span className="text-xl leading-none"
                      style={{ filter: isActive ? `drop-shadow(0 0 6px ${zone.accent})` : 'none' }}>
                      {emoji}
                    </span>
                    <span className="text-[7px] font-mono font-bold uppercase tracking-wide leading-none truncate w-full text-center"
                      style={{ color: isActive ? zone.accent : '#6B6585' }}>
                      {label}
                    </span>
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      {/* Floating Chat */}
      <FloatingChat />

      {/* Navigation Permission Manager */}
      <NavPermissionManager
        permNav={permNav}
        pending={pending}
        pendingTo={pendingTo}
        denied={denied}
        cancelPending={cancelPending}
      />
    </div>
  );
}