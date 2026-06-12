// src/pages/LobbyPage.jsx
import React, { useState, useEffect } from 'react';
import { useSpace } from '../context/SpaceContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Copy, Check, AlertCircle, CheckCircle, UserCheck, UserX, Bell, Flame, Dices, Shield, Users, LogOut, Sparkles } from 'lucide-react';
import StickyFooter from '../components/ui/StickyFooter';

const FUNNY_QUOTES = [
  "According to my calculations, you two are 99.8% likely to fight over who picks the playlist. 😤",
  "Error 404: Single energy not found. Initiating couple chaos mode. 💀",
  "Warning: Entering this world may cause infinite inside jokes that no one else understands. 🤣",
  "Our servers detect your partner is waiting. Stop reading this and go. 🚀",
  "Duo sync complete. Sanity backup sequence... failed. Good luck. 🤡",
  "Scientists confirm: people who share a private digital world are 300% more chaotic. 🧪",
];

const MOODS = [
  { label:'🔥 Chaos',     value:'🔥 Chaos Mode',   color:'#FB923C' },
  { label:'🦖 Gremlin',   value:'🦖 Full Gremlin',  color:'#34D399' },
  { label:'💤 Cozy LoFi', value:'💤 Sleepy Cozy',   color:'#8B5CF6' },
  { label:'⚡ Cracked',   value:'⚡ Turbo Mode',    color:'#FCD34D' },
  { label:'🌙 Midnight',  value:'🌙 Midnight Mood', color:'#06B6D4' },
];

// ── Animated bg particles ─────────────────────────────────────────────────────
function BgParticles() {
  const items = ['🧁','✨','💫','⭐','🌟','❤️','🎮','🎵'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((e, i) => (
        <motion.div key={e}
          animate={{ y:['110vh','-20vh'], opacity:[0, 0.3, 0.3, 0], rotate:[0, 360] }}
          transition={{ duration:12+i*2, delay:i*1.5, repeat:Infinity, ease:'linear' }}
          className="absolute select-none text-2xl"
          style={{ left:`${5+i*12}%`, filter:'blur(0.5px)' }}
        >{e}</motion.div>
      ))}
    </div>
  );
}

export default function LobbyPage() {
  const { user, roomData, roomCode, isLinked, generateRoomCode, connectWithCode, approveGuest, declineGuest } = useSpace();
  const navigate = useNavigate();

  const [step,          setStep]          = useState('choose');
  const [inputCode,     setInputCode]     = useState('');
  const [joinError,     setJoinError]     = useState('');
  const [joining,       setJoining]       = useState(false);
  const [generating,    setGenerating]    = useState(false);
  const [copied,        setCopied]        = useState(false);
  const [mood,          setMood]          = useState(MOODS[0]);
  const [aiQuoteIdx,    setAiQuoteIdx]    = useState(0);
  const [approving,     setApproving]     = useState(false);
  const [easterEgg,     setEasterEgg]     = useState(false);
  const [eggCount,      setEggCount]      = useState(0);

  useEffect(() => {
    if (isLinked) {
      const t = setTimeout(() => navigate('/room', { replace:true }), 1800);
      return () => clearTimeout(t);
    }
  }, [isLinked, navigate]);

  useEffect(() => {
    if (step === 'pending-approval' && roomData?.joinStatus === 'declined' && roomData?.guestUid === user?.uid) {
      setStep('declined');
    }
  }, [roomData, step, user?.uid]);

  const pendingGuest = step === 'waiting' && roomData?.joinStatus === 'pending' && roomData?.guestUid !== user?.uid
    ? { name:roomData.guestName || 'Someone', avatar:roomData.guestAvatar || '👤' }
    : null;

  const handleHostRoom = async () => {
    setGenerating(true);
    try { await generateRoomCode(); setStep('waiting'); }
    catch (err) { console.error(err); }
    finally { setGenerating(false); }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!inputCode.trim() || inputCode.length !== 6) return;
    setJoining(true); setJoinError('');
    try {
      const result = await connectWithCode(inputCode.trim());
      if      (result === 'pending')   setStep('pending-approval');
      else if (result === 'not_found') setJoinError('No room found. Check the code with your partner.');
      else if (result === 'full')      setJoinError('This room is already occupied!');
      else if (result === 'self')      setJoinError("That's YOUR code! Share it with your partner 😂");
      else                             setJoinError('Something went wrong. Try again.');
    } catch { setJoinError('Connection error. Please try again.'); }
    finally { setJoining(false); }
  };

  const handleApprove = async () => {
    setApproving(true);
    try { await approveGuest(); } finally { setApproving(false); }
  };

  const handleEasterEgg = () => {
    setEggCount(p => p + 1);
    if (eggCount >= 4) { setEasterEgg(true); }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col"
      style={{ background:'linear-gradient(180deg, #06030e 0%, #0a0518 50%, #07050F 100%)' }}>

      {/* Animated bg */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div animate={{ scale:[1,1.2,1], opacity:[0.4,0.8,0.4] }} transition={{ repeat:Infinity, duration:10 }}
          className="absolute -top-40 -left-20 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background:'rgba(139,92,246,0.15)' }} />
        <motion.div animate={{ scale:[1,1.15,1] }} transition={{ repeat:Infinity, duration:14, delay:3 }}
          className="absolute -bottom-40 -right-20 w-[450px] h-[450px] rounded-full blur-[100px]"
          style={{ background:'rgba(255,107,151,0.10)' }} />
        <motion.div animate={{ scale:[1,1.1,1] }} transition={{ repeat:Infinity, duration:8, delay:1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[80px]"
          style={{ background:`rgba(${mood.color === '#FCD34D' ? '252,211,77' : '6,182,212'},0.06)` }} />
      </div>
      <BgParticles />

      {/* Easter egg popup */}
      <AnimatePresence>
        {easterEgg && (
          <motion.div
            initial={{ opacity:0, scale:0.5, rotate:-10 }}
            animate={{ opacity:1, scale:1, rotate:0 }}
            exit={{ opacity:0, scale:0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background:'rgba(0,0,0,0.85)', backdropFilter:'blur(20px)' }}
            onClick={() => setEasterEgg(false)}
          >
            <div className="text-center space-y-4">
              <div className="text-8xl">🧁</div>
              <h2 className="text-3xl font-black text-white" style={{ fontFamily:'Syne, sans-serif' }}>
                ACHIEVEMENT UNLOCKED
              </h2>
              <p className="text-lg text-accent-pink font-mono">Button Masher 🎮</p>
              <p className="text-cozy-muted text-sm">+0 XP — but you did it 5 times so respect 🫡</p>
              <p className="text-[10px] text-cozy-muted font-mono">tap anywhere to close</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex justify-between items-center px-5 md:px-8 pt-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate:[0,-8,8,-4,0], scale:[1,1.05,1] }}
            transition={{ repeat:Infinity, duration:5, ease:'easeInOut' }}
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-xl"
            style={{ background:'linear-gradient(135deg, #8B5CF6, #FF6B97)', boxShadow:'0 0 30px rgba(139,92,246,0.4)' }}
          >🧁</motion.div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2" style={{ fontFamily:'Syne, sans-serif' }}>
              Cupcake Universe
              <motion.span animate={{ opacity:[1,0.5,1] }} transition={{ repeat:Infinity, duration:1.5 }}
                className="text-[8px] font-mono px-1.5 py-0.5 rounded-full border border-accent-pink/30 bg-accent-pink/10 text-accent-pink">
                LIVE
              </motion.span>
            </h4>
            <p className="text-[9px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
              <motion.span animate={{ scale:[1,1.4,1] }} transition={{ repeat:Infinity, duration:1 }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Connection Stable
            </p>
          </div>
        </div>

        {/* User badge */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl border border-white/8"
          style={{ background:'rgba(255,255,255,0.03)' }}>
          <span className="text-xl">{user?.avatar || '🧁'}</span>
          <div>
            <p className="text-xs font-black text-white leading-none" style={{ fontFamily:'Space Grotesk, sans-serif' }}>{user?.name || 'Player'}</p>
            <p className="text-[8px] font-mono mt-0.5" style={{ color:mood.color }}>{mood.value}</p>
          </div>
        </div>
      </header>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <main className="flex-grow relative z-10 w-full max-w-6xl mx-auto px-4 md:px-8 py-5 md:py-8 grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-8 items-start lg:items-center">

        {/* ── LEFT: action panel ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="space-y-2">
            <motion.span
              animate={{ boxShadow:['0 0 0px rgba(252,211,77,0)', '0 0 15px rgba(252,211,77,0.4)', '0 0 0px rgba(252,211,77,0)'] }}
              transition={{ repeat:Infinity, duration:2 }}
              className="inline-block px-3 py-1 rounded-full border border-yellow-400/30 bg-yellow-400/10 text-[9px] font-mono tracking-widest text-yellow-400 uppercase font-black"
            >
              🚀 Gate Phase: Setup Room
            </motion.span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase leading-tight" style={{ fontFamily:'Syne, sans-serif' }}>
              Your Private World<br/>
              <span className="text-rainbow">Awaits Activation!</span>
            </h2>
            <p className="text-cozy-muted text-xs font-light max-w-md">
              Create a space and share the code, or enter your partner's code to knock on their world.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-white/8 overflow-hidden relative"
            style={{ background:'rgba(15,10,30,0.75)', backdropFilter:'blur(24px)' }}>
            {/* Dynamic color top line */}
            <div className="h-0.5 w-full" style={{ background:`linear-gradient(90deg, #8B5CF6, #FF6B97, #06B6D4)` }} />

            <div className="p-4 md:p-8 min-h-[260px] flex flex-col justify-center">
              <AnimatePresence mode="wait">

                {/* ── CHOOSE ── */}
                {step === 'choose' && (
                  <motion.div key="choose" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { icon:'🏠', title:'Create New Space', desc:'Generate a secret code. Your partner knocks, you approve them in.', color:'#8B5CF6', action:handleHostRoom, loading:generating },
                      { icon:'🔑', title:'Enter Invite Code', desc:'Have a code? Enter it to send a join request to your partner.', color:'#FF6B97', action:() => setStep('join-form'), loading:false },
                    ].map((card, i) => (
                      <motion.button key={card.title}
                        custom={i} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                        transition={{ delay:i*0.1, type:'spring', stiffness:200 }}
                        whileHover={{ y:-4, borderColor:`${card.color}60` }}
                        whileTap={{ scale:0.97 }}
                        onClick={card.action}
                        disabled={card.loading}
                        className="p-6 rounded-2xl border border-white/8 text-left transition-all cursor-pointer disabled:opacity-60 group"
                        style={{ background:'rgba(255,255,255,0.02)' }}
                      >
                        <motion.div
                          whileHover={{ scale:1.2, rotate:[-5,5,0] }}
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl mb-4 border"
                          style={{ background:`${card.color}15`, borderColor:`${card.color}30` }}
                        >
                          {card.loading ? <Loader2 className="w-5 h-5 animate-spin" style={{ color:card.color }} /> : card.icon}
                        </motion.div>
                        <h4 className="text-white font-black text-sm mb-1.5" style={{ fontFamily:'Syne, sans-serif' }}>{card.title}</h4>
                        <p className="text-cozy-muted text-[10px] font-light leading-relaxed">{card.desc}</p>
                        <div className="mt-3 text-[8px] font-mono font-bold uppercase tracking-wider" style={{ color:`${card.color}70` }}>
                          {i === 0 ? '🔒 PRIVATE · INVITE-ONLY' : '⚡ INSTANT CONNECTION'}
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* ── JOIN FORM ── */}
                {step === 'join-form' && (
                  <motion.div key="join" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
                    className="space-y-5">
                    <div>
                      <h3 className="text-white font-black text-lg" style={{ fontFamily:'Syne, sans-serif' }}>Enter Duo Key</h3>
                      <p className="text-cozy-muted text-[10px] mt-0.5">Your partner's 6-character code. They'll get a knock notification.</p>
                    </div>
                    <form onSubmit={handleJoinSubmit} className="space-y-3">
                      <div className="relative">
                        <input type="text" maxLength={6} value={inputCode}
                          onChange={e => { setInputCode(e.target.value.toUpperCase()); setJoinError(''); }}
                          placeholder="X8Y2KA"
                          autoFocus
                          className="w-full rounded-2xl py-5 px-6 text-center font-mono text-3xl md:text-4xl font-black text-white tracking-[0.5em] focus:outline-none transition-all border uppercase placeholder:text-cozy-soft/20 placeholder:text-2xl placeholder:tracking-normal"
                          style={{ background:'rgba(0,0,0,0.5)', borderColor: joinError ? 'rgba(239,68,68,0.5)' : 'rgba(139,92,246,0.25)' }}
                        />
                      </div>
                      <AnimatePresence>
                        {joinError && (
                          <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
                            className="flex items-center gap-2 text-[10px] text-red-400 font-mono bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{joinError}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => { setStep('choose'); setJoinError(''); setInputCode(''); }}
                          className="px-4 py-3 rounded-xl border border-white/10 text-cozy-muted hover:text-white text-xs font-mono transition-all cursor-pointer hover:border-white/20">
                          ← Back
                        </button>
                        <motion.button type="submit" disabled={inputCode.length !== 6 || joining}
                          whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                          className="flex-1 py-3 font-black text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-xl border-2 transition-all"
                          style={{ background:'linear-gradient(135deg, #8B5CF6, #FF6B97)', color:'#fff', borderColor:'rgba(255,255,255,0.15)', fontFamily:'Syne, sans-serif' }}>
                          {joining ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Bell className="w-4 h-4" /> Send Join Request</>}
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* ── PENDING APPROVAL ── */}
                {step === 'pending-approval' && (
                  <motion.div key="pending" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                    className="flex flex-col items-center text-center py-6 space-y-5">
                    <div className="relative">
                      <motion.div animate={{ scale:[1,1.4,1], opacity:[0.2,0.5,0.2] }} transition={{ repeat:Infinity, duration:1.5 }}
                        className="absolute inset-[-16px] rounded-full bg-accent-purple/20" />
                      <motion.div animate={{ scale:[1,1.2,1] }} transition={{ repeat:Infinity, duration:1, delay:0.3 }}
                        className="absolute inset-[-8px] rounded-full bg-accent-purple/15" />
                      <div className="w-16 h-16 rounded-full bg-accent-purple/20 border border-accent-purple/40 flex items-center justify-center text-3xl relative">
                        ⏳
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-black text-base" style={{ fontFamily:'Syne, sans-serif' }}>Request Sent!</h4>
                      <p className="text-cozy-muted text-xs font-light mt-1 max-w-xs">
                        Waiting for <span className="text-accent-pink font-semibold">your partner</span> to approve. They'll see a knock notification.
                      </p>
                    </div>
                    <motion.p animate={{ opacity:[0.4,1,0.4] }} transition={{ repeat:Infinity, duration:1.5 }}
                      className="text-[9px] font-mono text-accent-purple flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Listening for response...
                    </motion.p>
                    <button onClick={() => { setStep('choose'); setInputCode(''); }}
                      className="text-[9px] text-cozy-muted underline underline-offset-2 hover:text-white transition-colors cursor-pointer font-mono">
                      Cancel Request
                    </button>
                  </motion.div>
                )}

                {/* ── DECLINED ── */}
                {step === 'declined' && (
                  <motion.div key="declined" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                    className="flex flex-col items-center text-center py-6 space-y-4">
                    <motion.div initial={{ rotate:-10 }} animate={{ rotate:0 }} transition={{ type:'spring', stiffness:200 }}
                      className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-3xl">
                      🚫
                    </motion.div>
                    <div>
                      <h4 className="text-white font-black text-base" style={{ fontFamily:'Syne, sans-serif' }}>Entry Declined 💀</h4>
                      <p className="text-cozy-muted text-[10px] mt-1 max-w-xs font-light">
                        Your partner declined. Maybe check if it's actually the right person lmao.
                      </p>
                    </div>
                    <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                      onClick={() => { setStep('choose'); setInputCode(''); }}
                      className="px-6 py-2.5 rounded-xl border border-white/10 text-xs text-white font-mono hover:bg-white/5 transition-all cursor-pointer">
                      Try Again →
                    </motion.button>
                  </motion.div>
                )}

                {/* ── WAITING (host) ── */}
                {step === 'waiting' && (
                  <motion.div key="waiting" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                    className="space-y-5">

                    {/* Knock notification */}
                    <AnimatePresence>
                      {pendingGuest && !isLinked && (
                        <motion.div key="knock"
                          initial={{ opacity:0, y:-12, scale:0.96 }}
                          animate={{ opacity:1, y:0,   scale:1    }}
                          exit={{    opacity:0, y:-12              }}
                          className="rounded-2xl border p-4 space-y-3"
                          style={{ background:'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(255,107,151,0.08))', borderColor:'rgba(139,92,246,0.4)' }}>
                          <div className="flex items-center gap-1.5 text-[9px] font-mono font-black uppercase tracking-widest text-accent-pink">
                            <motion.span animate={{ scale:[1,1.3,1] }} transition={{ repeat:Infinity, duration:0.6 }}>
                              <Bell className="w-3 h-3" />
                            </motion.span>
                            Someone's Knocking!
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-cozy-soft border border-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                              {pendingGuest.avatar}
                            </div>
                            <div>
                              <p className="text-white font-black text-sm" style={{ fontFamily:'Syne, sans-serif' }}>{pendingGuest.name}</p>
                              <p className="text-cozy-muted text-[9px]">wants to enter your private world</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.96 }}
                              onClick={handleApprove} disabled={approving}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-xs cursor-pointer disabled:opacity-60 border-2 border-emerald-500/30"
                              style={{ background:'rgba(52,211,153,0.15)', color:'#34D399', fontFamily:'Syne, sans-serif' }}>
                              {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserCheck className="w-4 h-4" /> ACCEPT</>}
                            </motion.button>
                            <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.96 }}
                              onClick={declineGuest}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-xs cursor-pointer border-2 border-red-500/30"
                              style={{ background:'rgba(239,68,68,0.10)', color:'#f87171', fontFamily:'Syne, sans-serif' }}>
                              <UserX className="w-4 h-4" /> DECLINE
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Room code */}
                    {!isLinked && (
                      <div className="text-center space-y-3">
                        <p className="text-[9px] font-mono text-cozy-muted uppercase tracking-widest">Share this code with your partner</p>
                        <div className="relative inline-block">
                          <div className="px-8 py-4 rounded-2xl border border-dashed"
                            style={{ background:'rgba(0,0,0,0.5)', borderColor:'rgba(255,255,255,0.15)' }}>
                            <span className="font-mono text-3xl md:text-5xl font-black tracking-[0.3em] text-rainbow">
                              {roomCode || '······'}
                            </span>
                          </div>
                          <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                            onClick={() => { navigator.clipboard.writeText(roomCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                            style={{ background:'rgba(255,255,255,0.08)' }}>
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cozy-muted" />}
                          </motion.button>
                        </div>
                        <motion.p animate={{ opacity:[0.5,1,0.5] }} transition={{ repeat:Infinity, duration:1.5 }}
                          className="text-xs text-cozy-muted flex items-center justify-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-purple" />
                          {pendingGuest ? 'Respond to the knock above ↑' : 'Waiting for your partner to knock...'}
                        </motion.p>
                      </div>
                    )}

                    {/* Linked success */}
                    {isLinked && (
                      <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
                        transition={{ type:'spring', stiffness:200 }}
                        className="text-center space-y-3 py-4">
                        <motion.div animate={{ scale:[1,1.2,1] }} transition={{ repeat:Infinity, duration:1 }}>
                          <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
                        </motion.div>
                        <h4 className="text-lg font-black text-white" style={{ fontFamily:'Syne, sans-serif' }}>
                          SESSION BRIDGED! 🎉
                        </h4>
                        <motion.p animate={{ opacity:[0.5,1,0.5] }} transition={{ repeat:Infinity, duration:1 }}
                          className="text-xs font-mono text-emerald-400">
                          Whisking you both into the world...
                        </motion.p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── RIGHT: widgets ──────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Mood picker */}
          <div className="rounded-2xl border border-white/5 p-4 space-y-3" style={{ background:'rgba(15,10,30,0.6)', backdropFilter:'blur(12px)' }}>
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5" style={{ fontFamily:'Syne, sans-serif' }}>
              <Sparkles className="w-4 h-4 text-accent-pink" /> Your Vibe
            </h4>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-2">
              {MOODS.map(m => (
                <motion.button key={m.label} whileHover={{ scale:1.04 }} whileTap={{ scale:0.95 }}
                  onClick={() => setMood(m)}
                  className="py-2 px-2 rounded-xl border text-[9px] font-black uppercase tracking-wide transition-all cursor-pointer text-center"
                  style={{
                    background:  mood.value === m.value ? `${m.color}20` : 'rgba(255,255,255,0.03)',
                    borderColor: mood.value === m.value ? `${m.color}60` : 'rgba(255,255,255,0.06)',
                    color:       mood.value === m.value ? m.color : '#9E97B8',
                    boxShadow:   mood.value === m.value ? `0 0 15px ${m.color}25` : 'none',
                    fontFamily:  'Space Grotesk, sans-serif',
                  }}>
                  {m.label}
                </motion.button>
              ))}
            </div>
            <div className="p-2 rounded-xl border border-white/5 text-center text-[9px] font-mono"
              style={{ background:'rgba(0,0,0,0.3)' }}>
              Current: <span className="font-bold" style={{ color:mood.color }}>{mood.value}</span>
            </div>
          </div>

          {/* AI Reality Check */}
          <div className="rounded-2xl border border-white/5 p-4 space-y-3" style={{ background:'rgba(15,10,30,0.6)', backdropFilter:'blur(12px)' }}>
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5" style={{ fontFamily:'Syne, sans-serif' }}>
                <Flame className="w-4 h-4 text-orange-400 animate-pulse" /> AI Reality Check
              </h4>
              <motion.button whileHover={{ rotate:180, scale:1.1 }} transition={{ duration:0.3 }}
                onClick={() => setAiQuoteIdx(i => (i + 1) % FUNNY_QUOTES.length)}
                className="p-1.5 rounded-lg hover:bg-white/8 cursor-pointer transition-all">
                <Dices className="w-3.5 h-3.5 text-cozy-muted" />
              </motion.button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={aiQuoteIdx}
                initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-5 }}
                transition={{ duration:0.2 }}
                className="p-3 rounded-xl border border-white/5 min-h-[60px] flex items-center"
                style={{ background:'rgba(0,0,0,0.3)' }}>
                <p className="text-[10px] font-mono italic leading-relaxed text-yellow-200/80">
                  "{FUNNY_QUOTES[aiQuoteIdx]}"
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Info pills */}
          <div className="space-y-1.5">
            {[
              { icon:Shield, text:'End-to-end encrypted room',   color:'#34D399' },
              { icon:Users,  text:'Invite-only · 2 players max', color:'#06B6D4' },
              { icon:Bell,   text:'Host approves every request', color:'#FF6B97' },
            ].map(({ icon:Icon, text, color }) => (
              <div key={text} className="flex items-center gap-2 text-[9px] font-mono text-cozy-muted px-2">
                <Icon className="w-3 h-3 flex-shrink-0" style={{ color }} />{text}
              </div>
            ))}
          </div>

          {/* Easter egg */}
          <motion.button
            whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
            onClick={handleEasterEgg}
            className="w-full p-3 rounded-xl border border-red-500/15 text-[9px] font-mono text-center cursor-pointer transition-all"
            style={{ background:'rgba(239,68,68,0.06)' }}>
            {eggCount === 0 ? '🚨 DO NOT CLICK THIS BUTTON'
              : eggCount < 3 ? `🚨 I SAID DON'T (${eggCount}/5)`
              : eggCount < 5 ? `😤 STOP IT (${eggCount}/5)`
              : '💀 why'}
          </motion.button>
        </div>
      </main>

      <footer className="relative z-10 w-full border-t border-white/5 py-3 px-5 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <p className="text-[8px] font-mono text-cozy-muted/60 uppercase tracking-widest">
            Cupcake Private World · Encrypted · Invite-Only · Made for Two ✦
          </p>
          <p className="text-[8px] font-mono text-cozy-muted/40">© {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}