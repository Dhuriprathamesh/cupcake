// src/pages/AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSpace } from '../context/SpaceContext';
import { Sparkles, ArrowRight, User, ShieldCheck, Globe, Loader2, Heart, Zap } from 'lucide-react';
import StickyFooter from '../components/ui/StickyFooter';

const AVATARS  = ['🧁','🐱','🦊','🐻','🐼','🐸','🦋','🎮'];

const TAGLINES = [
  { text:'A private digital world for two. ✨',          color:'#8B5CF6' },
  { text:'No feeds. No noise. Just you two. 🌌',         color:'#FF6B97' },
  { text:'Built for chaos and cozy nights. 🎮',          color:'#06B6D4' },
  { text:'Long distance? Not anymore. ❤️',               color:'#FCD34D' },
  { text:"Your duo connection, leveled up. 🚀",          color:'#34D399' },
];

const FLOATING_EMOJIS = ['🧁','✨','💫','🎮','❤️','🌟','⚡','🎵','🦋','💎'];

function FloatingEmoji({ emoji, x, delay, duration }) {
  return (
    <motion.div
      initial={{ y:'110vh', opacity:0, rotate:0 }}
      animate={{ y:'-20vh', opacity:[0, 0.4, 0.4, 0], rotate:360 }}
      transition={{ duration, delay, repeat:Infinity, ease:'linear' }}
      className="absolute select-none pointer-events-none text-2xl"
      style={{ left:`${x}%` }}
    >
      {emoji}
    </motion.div>
  );
}

// ── Animated neon grid background ────────────────────────────────────────────
function NeonGrid({ color }) {
  return (
    <motion.div
      animate={{ opacity:[0.03, 0.07, 0.03] }}
      transition={{ repeat:Infinity, duration:4 }}
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(${color}40 1px, transparent 1px), linear-gradient(90deg, ${color}40 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }}
    />
  );
}

// ── Animated logo mark ────────────────────────────────────────────────────────
function AnimatedLogo() {
  return (
    <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6">
      {/* Outer orbit ring */}
      <motion.div
        animate={{ rotate:360 }}
        transition={{ repeat:Infinity, duration:8, ease:'linear' }}
        className="absolute inset-[-8px] rounded-full border border-dashed border-accent-purple/30"
      />
      {/* Mid ring */}
      <motion.div
        animate={{ rotate:-360 }}
        transition={{ repeat:Infinity, duration:5, ease:'linear' }}
        className="absolute inset-0 rounded-full border border-dashed border-accent-pink/20"
      />
      {/* Glow */}
      <motion.div
        animate={{ scale:[1,1.2,1], opacity:[0.4,0.8,0.4] }}
        transition={{ repeat:Infinity, duration:2.5 }}
        className="absolute inset-[-16px] rounded-full blur-2xl"
        style={{ background:'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)' }}
      />
      {/* Main icon */}
      <motion.div
        animate={{ y:[0,-6,0], rotate:[-3,3,-3] }}
        transition={{ repeat:Infinity, duration:4, ease:'easeInOut' }}
        className="w-full h-full rounded-3xl flex items-center justify-center text-5xl shadow-2xl border-2"
        style={{
          background: 'linear-gradient(135deg, #1a0f3a, #2a1050)',
          borderColor: 'rgba(139,92,246,0.4)',
          boxShadow: '0 0 40px rgba(139,92,246,0.5), inset 0 0 20px rgba(139,92,246,0.1)',
        }}
      >
        🧁
      </motion.div>
      {/* Orbit dot */}
      <motion.div
        animate={{ rotate:360 }}
        transition={{ repeat:Infinity, duration:3, ease:'linear' }}
        className="absolute inset-[-4px] rounded-full"
        style={{ transformOrigin:'center' }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-accent-pink shadow-lg"
          style={{ boxShadow:'0 0 10px #FF6B97' }} />
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  const { user, loginWithGoogle, updateProfile, loading } = useSpace();
  const navigate = useNavigate();

  const [step,           setStep]           = useState('login');
  const [name,           setName]           = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🧁');
  const [error,          setError]          = useState('');
  const [saving,         setSaving]         = useState(false);
  const [taglineIdx,     setTaglineIdx]     = useState(0);
  const [nameShake,      setNameShake]      = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTaglineIdx(i => (i + 1) % TAGLINES.length), 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.profileComplete) {
      navigate('/lobby', { replace:true });
    } else if (step === 'login') {
      setName(user.name || '');
      setStep('customize');
    }
  }, [user, navigate, step]);

  const handleGoogleLogin = async () => {
    setError('');
    try { await loginWithGoogle(); }
    catch { setError('Google sign-in failed. Please try again.'); }
  };

  const handleCustomizeSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Give yourself a nickname first! 😤');
      setNameShake(true);
      setTimeout(() => setNameShake(false), 500);
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name:name.trim(), avatar:selectedAvatar, profileComplete:true, currentActivity:'In the Lobby' });
      navigate('/lobby', { replace:true });
    } catch {
      setError('Something went wrong saving your profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentTagline = TAGLINES[taglineIdx];
  const floatingItems  = FLOATING_EMOJIS.map((e, i) => ({
    emoji:    e,
    x:        5 + (i * 9.5),
    delay:    i * 1.2,
    duration: 10 + (i % 4) * 3,
  }));

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-hidden"
      style={{ background:'linear-gradient(180deg, #04020c 0%, #08041a 50%, #07050F 100%)' }}>

      {/* Animated bg */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div animate={{ scale:[1,1.3,1], opacity:[0.3,0.6,0.3] }} transition={{ repeat:Infinity, duration:10 }}
          className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full blur-[140px]"
          style={{ background:'rgba(139,92,246,0.20)' }} />
        <motion.div animate={{ scale:[1,1.2,1] }} transition={{ repeat:Infinity, duration:13, delay:3 }}
          className="absolute -bottom-1/4 -right-1/4 w-[55vw] h-[55vw] rounded-full blur-[120px]"
          style={{ background:'rgba(255,107,151,0.12)' }} />
        <motion.div animate={{ scale:[1,1.15,1] }} transition={{ repeat:Infinity, duration:7, delay:1.5 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30vw] h-[30vw] rounded-full blur-[100px]"
          style={{ background:'rgba(6,182,212,0.06)' }} />
        <NeonGrid color={step === 'login' ? '#8B5CF6' : '#FF6B97'} />
      </div>

      {/* Floating emojis */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingItems.map(p => <FloatingEmoji key={p.emoji} {...p} />)}
      </div>

      {/* ── CARD ─────────────────────────────────────────────────── */}
      <div className="flex-grow flex items-center justify-center px-4 py-8">
      <AnimatePresence mode="wait">

        {/* ══════════════ LOGIN STEP ══════════════ */}
        {step === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity:0, scale:0.9, y:30 }}
            animate={{ opacity:1, scale:1,   y:0  }}
            exit={{    opacity:0, scale:0.9, y:-20 }}
            transition={{ duration:0.5, ease:[0.25, 0.46, 0.45, 0.94] }}
            className="w-full max-w-sm relative z-10"
          >
            {/* Card glow */}
            <div className="absolute inset-[-2px] rounded-[2.5rem] blur-xl opacity-50"
              style={{ background:'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(255,107,151,0.3))' }} />

            <div className="relative rounded-[2rem] md:rounded-[2.5rem] border border-white/10 p-6 md:p-10 text-center overflow-hidden"
              style={{ background:'rgba(12,8,28,0.90)', backdropFilter:'blur(30px)' }}>

              {/* Top accent line */}
              <div className="absolute top-0 inset-x-0 h-px"
                style={{ background:'linear-gradient(90deg, transparent, #8B5CF6, #FF6B97, transparent)' }} />

              {/* Logo */}
              <AnimatedLogo />

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1" style={{ fontFamily:'Syne, sans-serif' }}>
                Cupcake World
              </h1>

              {/* Rotating tagline */}
              <div className="h-7 flex items-center justify-center overflow-hidden mb-7">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={taglineIdx}
                    initial={{ opacity:0, y:8  }}
                    animate={{ opacity:1, y:0  }}
                    exit={{    opacity:0, y:-8 }}
                    transition={{ duration:0.35 }}
                    className="text-xs font-light tracking-wide"
                    style={{ color: currentTagline.color }}
                  >
                    {currentTagline.text}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-7">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[9px] font-mono text-cozy-muted/50 uppercase tracking-widest">Enter Your World</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {/* Google button */}
              <motion.button
                onClick={handleGoogleLogin}
                disabled={loading}
                whileHover={{ scale:1.02, boxShadow:'0 0 50px rgba(139,92,246,0.4)' }}
                whileTap={{ scale:0.97 }}
                className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all border-2 border-white/10"
                style={{ background:'linear-gradient(135deg, #8B5CF6, #a855f7, #FF6B97)', boxShadow:'0 8px 30px rgba(139,92,246,0.35)', fontFamily:'Syne, sans-serif' }}
              >
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <>
                      <Globe className="w-5 h-5" />
                      Continue with Google
                      <ArrowRight className="w-4 h-4" />
                    </>
                }
              </motion.button>

              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
                    className="mt-4 text-xs text-red-400 font-mono">{error}</motion.p>
                )}
              </AnimatePresence>

              {/* Trust */}
              <div className="mt-6 flex items-center justify-center gap-1.5 text-[8px] font-mono text-cozy-muted/40 uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Secure · Private · Just for Two
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════ CUSTOMIZE STEP ══════════════ */}
        {step === 'customize' && (
          <motion.div
            key="customize"
            initial={{ opacity:0, x:40 }}
            animate={{ opacity:1, x:0  }}
            exit={{    opacity:0, x:-40 }}
            transition={{ duration:0.45, ease:[0.25, 0.46, 0.45, 0.94] }}
            className="w-full max-w-sm relative z-10"
          >
            <div className="absolute inset-[-2px] rounded-[2.5rem] blur-xl opacity-40"
              style={{ background:'linear-gradient(135deg, rgba(255,107,151,0.4), rgba(139,92,246,0.3))' }} />

            <div className="relative rounded-[2rem] md:rounded-[2.5rem] border border-white/10 p-5 md:p-8 overflow-hidden"
              style={{ background:'rgba(12,8,28,0.92)', backdropFilter:'blur(30px)' }}>

              <div className="absolute top-0 inset-x-0 h-px"
                style={{ background:'linear-gradient(90deg, transparent, #FF6B97, #8B5CF6, transparent)' }} />

              {/* Selected avatar preview */}
              <div className="text-center mb-6">
                <motion.div
                  animate={{ y:[0,-8,0], rotate:[-2,2,-2] }}
                  transition={{ repeat:Infinity, duration:3 }}
                  className="text-6xl mb-3 inline-block"
                >
                  {selectedAvatar}
                </motion.div>
                <h2 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily:'Syne, sans-serif' }}>
                  Make It Yours
                </h2>
                <p className="text-[10px] text-cozy-muted font-light mt-1">
                  Your partner will see this in the shared world.
                </p>
              </div>

              <form onSubmit={handleCustomizeSubmit} className="space-y-5">

                {/* Nickname */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-cozy-muted font-bold flex items-center gap-1.5 pl-1">
                    <User className="w-3 h-3 text-accent-purple" /> Your Duo Nickname
                  </label>
                  <motion.input
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); setError(''); }}
                    maxLength={16}
                    placeholder="e.g. Sweetbaker, Alex..."
                    autoFocus
                    animate={nameShake ? { x:[-8,8,-6,6,-4,4,0] } : { x:0 }}
                    transition={{ duration:0.4 }}
                    className="w-full rounded-2xl py-4 px-5 text-sm text-white placeholder:text-cozy-muted/30 focus:outline-none transition-all font-light border"
                    style={{ background:'rgba(0,0,0,0.5)', borderColor: error ? 'rgba(239,68,68,0.5)' : 'rgba(255,107,151,0.20)' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,107,151,0.50)'}
                    onBlur={e => e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,107,151,0.20)'}
                  />
                  <AnimatePresence>
                    {error && (
                      <motion.p initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                        className="text-xs text-red-400 font-mono pl-1">{error}</motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Avatar grid */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase tracking-widest text-cozy-muted font-bold pl-1">
                    Pick Your Mascot
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {AVATARS.map(emoji => (
                      <motion.button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedAvatar(emoji)}
                        whileHover={{ scale:1.15, rotate:[-5,5,0] }}
                        whileTap={{ scale:0.85 }}
                        transition={{ duration:0.2 }}
                        className="py-3 text-2xl rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center"
                        style={{
                          background:   selectedAvatar === emoji ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.04)',
                          borderColor:  selectedAvatar === emoji ? '#8B5CF6' : 'rgba(255,255,255,0.08)',
                          boxShadow:    selectedAvatar === emoji ? '0 0 20px rgba(139,92,246,0.4)' : 'none',
                        }}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale:1.02, boxShadow:'0 0 40px rgba(255,107,151,0.35)' }}
                  whileTap={{ scale:0.97 }}
                  className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all border-2 border-white/10"
                  style={{ background:'linear-gradient(135deg, #FF6B97, #8B5CF6)', boxShadow:'0 8px 30px rgba(255,107,151,0.25)', fontFamily:'Syne, sans-serif' }}
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving your profile...</>
                    : <><Sparkles className="w-4 h-4 text-yellow-200" /> Enter The World <ArrowRight className="w-4 h-4" /></>
                  }
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
      </div>
      <StickyFooter variant="minimal" />
    </div>
  );
}