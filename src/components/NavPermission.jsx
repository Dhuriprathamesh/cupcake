// src/components/NavPermission.jsx
// ─── Navigation Permission System ────────────────────────────────────────────
// When any user tries to navigate to a different page or switch games,
// the other player gets a popup asking to Accept or Deny.
// The requesting user waits and sees the result.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpace } from '../context/SpaceContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, X, Loader2, ArrowRight } from 'lucide-react';
import { playDing, playClick, playCorrect, playWrong } from '../utils/soundEngine';

// Page labels for display
const PAGE_LABELS = {
  '/room':          { label:'Home Base',    emoji:'🏠' },
  '/room/games':    { label:'Arcade Arena', emoji:'🕹️' },
  '/room/chat':     { label:'Chat Room',    emoji:'💬' },
  '/room/music':    { label:'Music Room',   emoji:'🎵' },
  '/room/memories': { label:'Duo Archives', emoji:'📸' },
  '/room/ai-zone':  { label:'AI Prompt Lab',emoji:'🤖' },
};

// ── Hook: useNavPermission ─────────────────────────────────────────────────────
// Returns a wrapped navigate function that asks partner first
export function useNavPermission() {
  const { user, partner, roomData, requestNav, respondNav } = useSpace();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [pending,   setPending]   = useState(false); // I am waiting for approval
  const [pendingTo, setPendingTo] = useState(null);  // { path, label, emoji, reqId }
  const [denied,    setDenied]    = useState(false);
  const timeoutRef = useRef(null);

  // Watch navRequest status changes — when my request gets accepted/denied
  useEffect(() => {
    if (!roomData?.navRequest || !user?.uid) return;
    const req = roomData.navRequest;

    // Only care about my own pending requests
    if (req.fromUid !== user.uid) return;

    if (req.status === 'accepted' && pendingTo) {
      playCorrect();
      navigate(pendingTo.path);
      setPending(false);
      setPendingTo(null);
      clearTimeout(timeoutRef.current);
    }

    if (req.status === 'denied') {
      playWrong();
      setDenied(true);
      setPending(false);
      setTimeout(() => setDenied(false), 3000);
      clearTimeout(timeoutRef.current);
    }
  }, [roomData?.navRequest?.status, roomData?.navRequest?.id]);

  // Navigate with permission — solo if no partner, ask if partner present
  const permNav = useCallback(async (path, extraLabel) => {
    if (!partner || path === location.pathname) {
      navigate(path); return;
    }
    const info = PAGE_LABELS[path] ?? { label: extraLabel || path, emoji:'📍' };
    const reqId = await requestNav(path, info.label, 'page');
    setPendingTo({ path, label:info.label, emoji:info.emoji, reqId });
    setPending(true);
    playDing();
    // Auto-expire after 25s (navigate anyway)
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setPending(false);
      setPendingTo(null);
      navigate(path); // auto-navigate if no response
    }, 25000);
  }, [partner, location.pathname, navigate, requestNav]);

  const cancelPending = useCallback(() => {
    setPending(false);
    setPendingTo(null);
    clearTimeout(timeoutRef.current);
  }, []);

  return { permNav, pending, pendingTo, denied, cancelPending };
}

// ── Incoming request popup — shown to the OTHER player ────────────────────────
function IncomingPopup({ req, onAccept, onDeny }) {
  const [timeLeft, setTimeLeft] = useState(25);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(id); onDeny(); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(id);
  }, []);

  const pct = (timeLeft / 25) * 100;

  return (
    <motion.div
      initial={{ opacity:0, y:-40, scale:0.9 }}
      animate={{ opacity:1, y:0,  scale:1   }}
      exit={{    opacity:0, y:-40, scale:0.9 }}
      transition={{ type:'spring', stiffness:280, damping:24 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4"
    >
      <div className="rounded-3xl border border-white/12 overflow-hidden shadow-2xl"
        style={{ background:'rgba(10,5,25,0.97)', backdropFilter:'blur(32px)',
          boxShadow:'0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)' }}>

        {/* Timer bar */}
        <div className="h-1 w-full bg-black/40">
          <motion.div className="h-full rounded-full transition-all duration-1000"
            style={{ width:`${pct}%`,
              background: pct > 50 ? 'linear-gradient(90deg,#7C3AED,#EC4899)'
                : pct > 25 ? 'linear-gradient(90deg,#FB923C,#EC4899)'
                : 'linear-gradient(90deg,#E53E3E,#FF6B97)' }} />
        </div>

        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background:'rgba(124,58,237,0.2)', border:'1px solid rgba(124,58,237,0.3)' }}>
              {req.type === 'game' ? req.gameEmoji ?? '🎮' : PAGE_LABELS[req.toPath]?.emoji ?? '📍'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono text-cozy-muted uppercase tracking-wider">
                Navigation Request
              </p>
              <p className="text-sm font-black text-white mt-0.5" style={{ fontFamily:'Syne,sans-serif' }}>
                <span className="text-accent-pink">{req.fromName}</span>
                {req.type === 'game'
                  ? <> wants to play <span style={{ color:'#FCD34D' }}>{req.gameName}</span></>
                  : <> wants to go to <span style={{ color:'#FCD34D' }}>{req.toLabel}</span></>
                }
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[9px] font-mono text-cozy-muted">Auto-denies in</span>
                <span className="text-[9px] font-black font-mono"
                  style={{ color: timeLeft <= 8 ? '#FC8181' : '#FCD34D' }}>{timeLeft}s</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5">
            <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.95 }}
              onClick={onAccept}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl font-black text-sm cursor-pointer border-2"
              style={{ background:'rgba(52,211,153,0.18)', borderColor:'#34D399', color:'#34D399', fontFamily:'Syne,sans-serif' }}>
              <Check className="w-4 h-4" /> Accept
            </motion.button>
            <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.95 }}
              onClick={onDeny}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl font-black text-sm cursor-pointer border-2"
              style={{ background:'rgba(239,68,68,0.12)', borderColor:'rgba(239,68,68,0.5)', color:'#FC8181', fontFamily:'Syne,sans-serif' }}>
              <X className="w-4 h-4" /> Deny
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Waiting overlay — shown to the REQUESTER while waiting ────────────────────
function WaitingOverlay({ pendingTo, onCancel }) {
  return (
    <motion.div
      initial={{ opacity:0, y:60, scale:0.9 }}
      animate={{ opacity:1, y:0,  scale:1   }}
      exit={{    opacity:0, y:60, scale:0.9 }}
      transition={{ type:'spring', stiffness:260, damping:24 }}
      className="fixed bottom-36 left-1/2 -translate-x-1/2 z-[200] w-full max-w-xs px-4"
    >
      <div className="rounded-2xl border border-white/10 p-3.5 flex items-center gap-3 shadow-xl"
        style={{ background:'rgba(10,5,25,0.97)', backdropFilter:'blur(24px)' }}>
        <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1.2, ease:'linear' }}>
          <Loader2 className="w-4 h-4 text-accent-purple flex-shrink-0" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono text-cozy-muted">Asking partner...</p>
          <p className="text-xs font-bold text-white truncate flex items-center gap-1">
            {pendingTo.emoji} {pendingTo.label} <ArrowRight className="w-3 h-3 text-accent-pink" />
          </p>
        </div>
        <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.85 }}
          onClick={onCancel}
          className="text-cozy-muted hover:text-white cursor-pointer p-1 transition-all flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Denied toast ───────────────────────────────────────────────────────────────
function DeniedToast() {
  return (
    <motion.div
      initial={{ opacity:0, y:60, scale:0.9 }}
      animate={{ opacity:1, y:0,  scale:1   }}
      exit={{    opacity:0, y:60, scale:0.9 }}
      className="fixed bottom-36 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl border border-red-500/30 flex items-center gap-2.5 shadow-xl"
      style={{ background:'rgba(40,10,10,0.97)', backdropFilter:'blur(20px)', boxShadow:'0 0 20px rgba(239,68,68,0.2)' }}>
      <span className="text-xl">🚫</span>
      <div>
        <p className="text-xs font-black text-white" style={{ fontFamily:'Syne,sans-serif' }}>Navigation Denied</p>
        <p className="text-[9px] text-cozy-muted font-mono">Your partner said no 💀</p>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN: NavPermissionManager — mount once in DuoRoomLayout
// ══════════════════════════════════════════════════════════════════════════════
export default function NavPermissionManager({ permNav, pending, pendingTo, denied, cancelPending }) {
  const { user, partner, roomData, respondNav } = useSpace();
  const navigate = useNavigate();

  // Incoming request for ME to approve
  const incomingReq = roomData?.navRequest;
  const isForMe = incomingReq && incomingReq.fromUid !== user?.uid && incomingReq.status === 'pending';

  useEffect(() => {
    if (isForMe) playDing();
  }, [incomingReq?.id]);

  const handleAccept = async () => {
    playCorrect();
    await respondNav('accepted');
    // I also navigate to the same page for synchronized experience
    if (incomingReq?.toPath) navigate(incomingReq.toPath);
  };

  const handleDeny = async () => {
    playClick();
    await respondNav('denied');
  };

  return (
    <>
      {/* Incoming popup (for the non-requester) */}
      <AnimatePresence>
        {isForMe && partner && (
          <IncomingPopup key={incomingReq.id} req={incomingReq} onAccept={handleAccept} onDeny={handleDeny} />
        )}
      </AnimatePresence>

      {/* Waiting overlay (for the requester) */}
      <AnimatePresence>
        {pending && pendingTo && (
          <WaitingOverlay key="waiting" pendingTo={pendingTo} onCancel={cancelPending} />
        )}
      </AnimatePresence>

      {/* Denied feedback */}
      <AnimatePresence>
        {denied && <DeniedToast key="denied" />}
      </AnimatePresence>
    </>
  );
}

// useNavPermission is already exported above as: export function useNavPermission()