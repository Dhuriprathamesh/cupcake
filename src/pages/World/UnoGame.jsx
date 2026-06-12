// src/pages/World/UnoGame.jsx
// ─── Full UNO for Two Players ────────────────────────────────────────────────
// Rules implemented:
//  • 108-card deck (4 colors × 25 + 8 wilds)
//  • Match by color OR number/symbol
//  • Skip → opponent loses turn (in 2p same as Reverse)
//  • Reverse → in 2p: acts as Skip (current player goes again)
//  • Draw Two → opponent draws 2, loses turn
//  • Wild → change color, play on anything
//  • Wild Draw Four → opponent draws 4, loses turn; only legal if no matching color
//  • Drawing: draw 1; if playable you MAY play it immediately
//  • UNO auto-detected at 1 card
//  • Stacking: Draw 2 can stack onto Draw 2 (cumulative)
//  • First to empty hand wins

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCcw, Zap, Trophy, AlertTriangle } from 'lucide-react';
import {
  playCardFlip, playWild, playDrawTwo, playDrawFour,
  playSkip, playReverse, playUno, playWin, playLose,
  playDeal, playGameStart, playXP, playClick,
} from '../../utils/soundEngine';

// ═══════════════════════════════════════════════════════════════════
// CARD ENGINE
// ═══════════════════════════════════════════════════════════════════
const COLORS  = ['red','green','blue','yellow'];
const WILDS   = ['wild','wild4'];
const NUMBERS = ['0','1','2','3','4','5','6','7','8','9'];
const ACTIONS = ['skip','reverse','draw2'];

// Color display values
const COLOR_HEX = { red:'#E53E3E', green:'#38A169', blue:'#3182CE', yellow:'#D69E2E', wild:'#6B46C1' };
const COLOR_BG  = { red:'#FED7D7', green:'#C6F6D5', blue:'#BEE3F8', yellow:'#FEFCBF', wild:'#E9D8FD' };
const COLOR_DARK= { red:'#9B2C2C', green:'#276749', blue:'#2C5282', yellow:'#975A16', wild:'#553C9A' };

// Build 108-card deck
function buildDeck() {
  const deck = [];
  let id = 0;
  COLORS.forEach(color => {
    // 0: one card
    deck.push({ id: id++, color, type:'0' });
    // 1-9, skip, reverse, draw2: two each
    [...NUMBERS.slice(1), ...ACTIONS].forEach(type => {
      deck.push({ id:id++, color, type });
      deck.push({ id:id++, color, type });
    });
  });
  // 4 Wilds + 4 Wild Draw 4
  for (let i=0;i<4;i++) {
    deck.push({ id:id++, color:'wild', type:'wild'  });
    deck.push({ id:id++, color:'wild', type:'wild4' });
  }
  return deck; // 108 cards
}

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i=a.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

// Deal initial hands and set up draw pile + first discard
function dealGame() {
  let deck = shuffle(buildDeck());
  const hostHand  = deck.splice(0,7);
  const guestHand = deck.splice(0,7);
  // First discard must be a number card (re-shuffle until top is number)
  let topIdx = deck.findIndex(c => NUMBERS.includes(c.type));
  if (topIdx === -1) topIdx = 0;
  const [top] = deck.splice(topIdx, 1);
  return { drawPile:deck, hostHand, guestHand, topCard:top };
}

// Can a card be played on top of the current discard?
function canPlay(card, topCard, currentColor) {
  if (card.type === 'wild' || card.type === 'wild4') return true;
  const activeColor = currentColor || topCard.color;
  return card.color === activeColor || card.type === topCard.type;
}

// ═══════════════════════════════════════════════════════════════════
// CARD VISUAL
// ═══════════════════════════════════════════════════════════════════
function CardFace({ card, size = 'md', selected = false, playable = false, onClick, faceDown = false }) {
  const S = { sm:{ w:48,h:72,text:'text-sm',corner:'text-[10px]', sym:'text-2xl' },
               md:{ w:60,h:88,text:'text-lg',corner:'text-xs',    sym:'text-3xl' },
               lg:{ w:76,h:112,text:'text-2xl',corner:'text-sm',  sym:'text-4xl' } }[size];

  if (faceDown) {
    return (
      <div className="rounded-xl border-2 border-white/20 flex items-center justify-center select-none"
        style={{ width:S.w, height:S.h, background:'linear-gradient(135deg,#1a0a2e,#0d0520)', flexShrink:0 }}>
        <div className="rounded-lg border-2 border-white/15 w-4/5 h-4/5 flex items-center justify-center">
          <span className="text-2xl opacity-50">🃏</span>
        </div>
      </div>
    );
  }

  const isWild = card.color === 'wild';
  const label  = card.type === 'wild' ? '🌈' : card.type === 'wild4' ? '+4' : card.type === 'skip' ? '⊘'
               : card.type === 'reverse' ? '↩' : card.type === 'draw2' ? '+2' : card.type;
  const isAction = !NUMBERS.includes(card.type);

  return (
    <motion.div
      whileHover={playable ? { y:-8, scale:1.08 } : {}}
      whileTap={playable ? { scale:0.94 } : {}}
      animate={selected ? { y:-16, scale:1.12 } : {}}
      onClick={onClick}
      className={`rounded-xl border-3 select-none relative overflow-hidden transition-shadow ${
        playable ? 'cursor-pointer' : 'cursor-default'
      } ${selected ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent' : ''}`}
      style={{
        width:S.w, height:S.h, flexShrink:0,
        background: isWild
          ? 'conic-gradient(from 0deg,#E53E3E,#D69E2E,#38A169,#3182CE,#E53E3E)'
          : COLOR_HEX[card.color],
        borderColor: isWild ? 'rgba(255,255,255,0.4)' : COLOR_DARK[card.color],
        boxShadow: selected
          ? `0 0 20px ${isWild?'rgba(255,255,255,0.6)':COLOR_HEX[card.color]+'99'}`
          : playable
          ? `0 4px 12px ${isWild?'rgba(255,255,255,0.3)':COLOR_HEX[card.color]+'66'}`
          : '0 2px 6px rgba(0,0,0,0.4)',
      }}>

      {/* Inner white oval */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full flex items-center justify-center bg-white/90"
          style={{ width:'70%', height:'78%', transform:'rotate(-30deg)' }}>
          <span className={`font-black ${S.sym} ${isAction?'':'font-black'}`}
            style={{ color: isWild ? '#553C9A' : COLOR_HEX[card.color], transform:'rotate(30deg)', display:'block', lineHeight:1 }}>
            {label}
          </span>
        </div>
      </div>

      {/* Corner labels */}
      <span className={`absolute top-1.5 left-2 font-black ${S.corner} leading-none`}
        style={{ color:'rgba(255,255,255,0.95)' }}>{label}</span>
      <span className={`absolute bottom-1.5 right-2 font-black ${S.corner} leading-none rotate-180`}
        style={{ color:'rgba(255,255,255,0.95)' }}>{label}</span>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COLOR PICKER (for wild cards)
// ═══════════════════════════════════════════════════════════════════
function ColorPicker({ onPick, label="Choose a color" }) {
  return (
    <motion.div initial={{ scale:0.8,opacity:0 }} animate={{ scale:1,opacity:1 }}
      exit={{ scale:0.8,opacity:0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-2xl"
      style={{ background:'rgba(0,0,0,0.90)', backdropFilter:'blur(12px)' }}>
      <p className="text-sm font-black text-white" style={{ fontFamily:'Syne,sans-serif' }}>{label}</p>
      <div className="grid grid-cols-2 gap-3">
        {COLORS.map(color => (
          <motion.button key={color} whileHover={{ scale:1.12 }} whileTap={{ scale:0.88 }}
            onClick={() => onPick(color)}
            className="w-16 h-16 rounded-2xl border-4 border-white/30 cursor-pointer shadow-lg font-black text-white text-xs uppercase"
            style={{ background:COLOR_HEX[color], boxShadow:`0 0 20px ${COLOR_HEX[color]}80` }}>
            {color}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ACTION TOAST
// ═══════════════════════════════════════════════════════════════════
function ActionToast({ text, color }) {
  return (
    <motion.div initial={{ scale:0.5,opacity:0,y:20 }} animate={{ scale:1,opacity:1,y:0 }}
      exit={{ scale:0.5,opacity:0,y:-20 }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none px-5 py-3 rounded-2xl border-2 text-sm font-black text-white text-center whitespace-nowrap"
      style={{ background:COLOR_HEX[color]||'rgba(0,0,0,0.85)', borderColor:'rgba(255,255,255,0.3)', boxShadow:`0 0 30px ${COLOR_HEX[color]||'rgba(255,255,255,0.2)'}80` }}>
      {text}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN UNO COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function UnoGame({ user, partner, isHost, gameState, updateGameState, addXP, markXpAwarded, resetGame }) {

  // ── Pull state ────────────────────────────────────────────────────
  const phase         = gameState.unoPhase       ?? 'idle';
  const drawPile      = gameState.unoDrawPile     ?? [];
  const topCard       = gameState.unoDiscardTop   ?? null;
  const currentColor  = gameState.unoCurrentColor ?? null;
  const hostHand      = gameState.unoHostHand     ?? [];
  const guestHand     = gameState.unoGuestHand    ?? [];
  const turn          = gameState.unoTurn         ?? null;
  const pending       = gameState.unoPending      ?? null;
  const winner        = gameState.unoWinner       ?? null;
  const xpDone        = gameState.unoXpAwarded    === true;
  const unoCalled     = gameState.unoUnoCalled    ?? null;
  const lastAction    = gameState.unoLastAction   ?? '';

  const myHand      = isHost ? hostHand  : guestHand;
  const partnerHand = isHost ? guestHand : hostHand;
  const isMyTurn    = turn === (isHost ? 'host' : 'guest');
  const myRole      = isHost ? 'host' : 'guest';
  const partRole    = isHost ? 'guest' : 'host';

  // ── Local UI state ────────────────────────────────────────────────
  const [selectedIdx,   setSelectedIdx]   = useState(null);
  const [showPicker,    setShowPicker]    = useState(false);
  const [pendingWild,   setPendingWild]   = useState(null); // card waiting for color pick
  const [toast,         setToast]         = useState(null);
  const [dealing,       setDealing]       = useState(false);
  const [justDrew,      setJustDrew]      = useState(null); // card just drawn, can play
  const handScrollRef = useRef(null);

  // ── XP on win ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!winner || xpDone) return;
    if (winner !== user.uid) playLose();
    const iWon = winner === user.uid;
    const run = async () => { await addXP(iWon ? 250 : 80); await markXpAwarded('unoXpAwarded'); setTimeout(() => playXP(), 400); };
    run();
  }, [winner, xpDone]);

  // ── Auto-clear toast ──────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Show last action as toast ─────────────────────────────────────
  useEffect(() => {
    if (!lastAction) return;
    setToast({ text:lastAction, color: topCard?.color ?? 'wild' });
  }, [lastAction]);

  // ── Helpers: write game state ─────────────────────────────────────
  const write = useCallback(async (patch) => {
    await updateGameState(patch);
  }, [updateGameState]);

  // ── START GAME ────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!isHost || dealing) return;
    setDealing(true);
    const { drawPile:pile, hostHand:hh, guestHand:gh, topCard:top } = dealGame();
    await write({
      unoPhase:        'playing',
      unoDrawPile:     pile,
      unoDiscardTop:   top,
      unoCurrentColor: top.color,
      unoHostHand:     hh,
      unoGuestHand:    gh,
      unoTurn:         'host',
      unoPending:      null,
      unoWinner:       null,
      unoXpAwarded:    false,
      unoUnoCalled:    null,
      unoLastAction:   'Game started! Host goes first.',
    });
    setDealing(false);
    setSelectedIdx(null);
    setJustDrew(null);
    playDeal();
    setTimeout(() => playGameStart(), 650);
  };

  // ── PLAY CARD ─────────────────────────────────────────────────────
  const handlePlay = async (card, handIdx) => {
    if (!isMyTurn || phase !== 'playing' || winner) return;

    // If pending draw effect on me, I can't play (must draw first)
    if (pending && pending.target === myRole) return;

    if (!canPlay(card, topCard, currentColor)) return;

    // Wild needs color pick
    if (card.type === 'wild' || card.type === 'wild4') {
      setPendingWild({ card, handIdx });
      setShowPicker(true);
      return;
    }

    await applyCardPlay(card, handIdx, null);
  };

  const applyCardPlay = async (card, handIdx, chosenColor) => {
    // Sound for card type
    if (card.type === 'wild')    playWild();
    else if (card.type === 'wild4')  playDrawFour();
    else if (card.type === 'draw2')  playDrawTwo();
    else if (card.type === 'skip')   playSkip();
    else if (card.type === 'reverse')playReverse();
    else                             playCardFlip();

    // Remove card from hand
    const newHand = myHand.filter((_,i) => i !== handIdx);
    const newPile = [...drawPile];

    // Check win
    if (newHand.length === 0) {
      playWin();
      await write({
        unoDiscardTop:   card,
        unoCurrentColor: chosenColor ?? card.color,
        ...(isHost ? { unoHostHand:[] } : { unoGuestHand:[] }),
        unoPhase:        'gameover',
        unoWinner:       user.uid,
        unoLastAction:   `${user.name} played their last card! 🏆`,
      });
      return;
    }

    // Determine next action
    let nextTurn = turn === 'host' ? 'guest' : 'host';
    let newPending = null;
    let action = `${user.name} played ${card.type.toUpperCase()}`;

    if (card.type === 'skip' || card.type === 'reverse') {
      nextTurn = myRole; // in 2p, skip/reverse = go again
      action = card.type==='skip' ? `${user.name} skipped ${partner?.name || 'partner'}! ⊘` : `${user.name} reversed! Goes again ↩`;
    } else if (card.type === 'draw2') {
      // Check if opponent can stack draw2
      newPending = { type:'draw2', count:2, target:partRole };
      nextTurn = partRole; // opponent must deal with it
      action = `${user.name} played Draw Two! ${partner?.name || 'Partner'} draws 2 ✌️`;
    } else if (card.type === 'wild4') {
      newPending = { type:'draw4', count:4, target:partRole };
      nextTurn = partRole;
      action = `${user.name} played Wild Draw Four! ${partner?.name || 'Partner'} draws 4 😈`;
    } else if (card.type === 'wild') {
      action = `${user.name} changed color to ${chosenColor?.toUpperCase()} 🌈`;
    }

    // Detect UNO
    const unoUid = newHand.length === 1 ? user.uid : null;
    if (unoUid) setTimeout(() => playUno(), 200);

    await write({
      unoDiscardTop:   card,
      unoCurrentColor: chosenColor ?? card.color,
      unoDrawPile:     newPile,
      ...(isHost ? { unoHostHand:newHand } : { unoGuestHand:newHand }),
      unoTurn:         nextTurn,
      unoPending:      newPending,
      unoUnoCalled:    unoUid,
      unoLastAction:   action,
    });

    setSelectedIdx(null);
    setJustDrew(null);
  };

  // ── COLOR PICKED (wild) ───────────────────────────────────────────
  const handleColorPick = async (color) => {
    setShowPicker(false);
    if (!pendingWild) return;
    await applyCardPlay(pendingWild.card, pendingWild.handIdx, color);
    setPendingWild(null);
  };

  // ── DRAW CARD ─────────────────────────────────────────────────────
  const handleDraw = async () => {
    if (!isMyTurn || phase !== 'playing' || winner) return;

    let pile = [...drawPile];
    let hand = [...myHand];
    let action = '';
    let nextTurn = turn === 'host' ? 'guest' : 'host';
    let newPending = null;

    // If pending effect targets me, resolve it
    if (pending && pending.target === myRole) {
      const count = pending.count ?? 2;
      // Reshuffle if needed
      if (pile.length < count) pile = shuffle([...pile, ...buildDeck().slice(0, 52)]);
      const drawn = pile.splice(0, count);
      hand = [...hand, ...drawn];
      action = `${user.name} drew ${count} cards 😬`;
      nextTurn = partRole; // after forced draw, turn passes
      newPending = null;
    } else {
      // Normal draw: draw 1
      if (pile.length === 0) pile = shuffle(buildDeck().slice(0, 52));
      playCardFlip();
      const [drawn] = pile.splice(0, 1);
      hand = [...hand, drawn];
      action = `${user.name} drew a card`;
      // If drawn card is playable, player may play it
      if (canPlay(drawn, topCard, currentColor)) {
        setJustDrew({ card:drawn, handIdx:hand.length-1 });
        action += ' — can play it!';
        // Don't advance turn yet — player decides
        await write({
          unoDrawPile:  pile,
          ...(isHost ? { unoHostHand:hand } : { unoGuestHand:hand }),
          unoLastAction: action,
          // keep same turn
        });
        return;
      }
      // Can't play drawn card: turn passes
      action += ' (no match, turn passes)';
    }

    await write({
      unoDrawPile:  pile,
      ...(isHost ? { unoHostHand:hand } : { unoGuestHand:hand }),
      unoTurn:      nextTurn,
      unoPending:   newPending,
      unoLastAction: action,
    });
    setJustDrew(null);
  };

  // ── PASS after drawing unplayable ─────────────────────────────────
  const handlePass = async () => {
    const nextTurn = turn === 'host' ? 'guest' : 'host';
    await write({ unoTurn:nextTurn, unoLastAction:`${user.name} passed` });
    setJustDrew(null);
  };

  // ── RESET ─────────────────────────────────────────────────────────
  const handleReset = async () => {
    await write({
      unoPhase:'idle', unoDrawPile:[], unoDiscardTop:null, unoCurrentColor:null,
      unoHostHand:[], unoGuestHand:[], unoTurn:null, unoPending:null,
      unoWinner:null, unoXpAwarded:false, unoUnoCalled:null, unoLastAction:'',
    });
    setSelectedIdx(null); setJustDrew(null);
  };

  const activeColor = currentColor ?? topCard?.color ?? 'wild';
  const partnerHandCount = partnerHand.length;
  const isPartnerHere = !!partner;

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  // ── GAME OVER ─────────────────────────────────────────────────────
  if (phase === 'gameover' && winner) {
    const iWon = winner === user.uid;
    return (
      <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }}
        className="rounded-3xl border overflow-hidden relative"
        style={{ background:iWon?'linear-gradient(135deg,#1a2e0a,#0a2818)':'linear-gradient(135deg,#2e0a0a,#1a0808)',
          borderColor:iWon?'rgba(52,211,153,0.4)':'rgba(255,107,151,0.4)',
          boxShadow:`0 0 60px ${iWon?'rgba(52,211,153,0.3)':'rgba(255,107,151,0.2)'}` }}>
        {/* Confetti */}
        {iWon && Array.from({length:22}).map((_,i)=>(
          <motion.div key={i} initial={{ x:'50%',y:'100%',scale:0,opacity:1 }}
            animate={{ x:`${5+Math.random()*90}%`,y:`${Math.random()*80}%`,scale:1,opacity:0 }}
            transition={{ duration:1.2,delay:i*0.04 }}
            className="absolute w-3 h-3 rounded-full pointer-events-none"
            style={{ background:['#E53E3E','#38A169','#3182CE','#D69E2E','#fff'][i%5] }} />
        ))}
        <div className="relative z-10 p-6 md:p-8 flex flex-col items-center text-center gap-5">
          <motion.div initial={{ scale:0,rotate:-20 }} animate={{ scale:1,rotate:0 }}
            transition={{ type:'spring',stiffness:200,delay:0.15 }}
            className="text-7xl">{iWon?'🏆':'💀'}</motion.div>
          <div>
            <h3 className="text-3xl font-black text-white" style={{ fontFamily:'Syne,sans-serif' }}>
              {iWon ? 'UNO! YOU WIN!' : 'YOU LOSE!'}
            </h3>
            <p className="text-cozy-muted text-sm mt-1">
              {iWon ? `${partner?.name||'Partner'} couldn't handle your cards 😤` : `${partner?.name||'Partner'} emptied their hand first`}
            </p>
          </div>
          <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.4,type:'spring' }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border text-base font-bold"
            style={{ background:iWon?'rgba(52,211,153,0.2)':'rgba(255,107,151,0.15)',
              borderColor:iWon?'#34D399':'#FF6B97', color:iWon?'#34D399':'#FF6B97' }}>
            <Zap className="w-5 h-5" /> +{iWon?250:80} XP Saved
          </motion.div>
          <motion.button initial={{ y:16,opacity:0 }} animate={{ y:0,opacity:1 }} transition={{ delay:0.55 }}
            whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
            onClick={handleReset}
            className="px-8 py-4 rounded-2xl font-black text-base cursor-pointer border-2 flex items-center gap-3"
            style={{ background:'linear-gradient(135deg,#553C9A,#E53E3E)',color:'#fff',borderColor:'rgba(255,255,255,0.25)',fontFamily:'Syne,sans-serif' }}>
            <RefreshCcw className="w-5 h-5" /> PLAY AGAIN
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // ── IDLE / WAITING ────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="rounded-3xl border overflow-hidden p-6 md:p-8 flex flex-col items-center gap-6 text-center"
        style={{ background:'linear-gradient(135deg,#0d0520,#1a0a2e)', borderColor:'rgba(139,92,246,0.3)',
          boxShadow:'0 0 60px rgba(139,92,246,0.15)' }}>
        {/* UNO logo */}
        <motion.div animate={{ rotate:[0,-3,3,-2,0] }} transition={{ repeat:Infinity,duration:4 }}>
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl font-black border-4 border-white/20 shadow-2xl"
            style={{ background:'conic-gradient(from 0deg,#E53E3E,#D69E2E,#38A169,#3182CE,#E53E3E)',
              boxShadow:'0 0 40px rgba(139,92,246,0.5), 0 0 80px rgba(139,92,246,0.2)' }}>
            <span className="text-white" style={{ fontFamily:'Syne,sans-serif',textShadow:'0 2px 10px rgba(0,0,0,0.5)' }}>UNO</span>
          </div>
        </motion.div>

        <div>
          <h3 className="text-2xl font-black text-white" style={{ fontFamily:'Syne,sans-serif' }}>UNO for Two</h3>
          <p className="text-cozy-muted text-sm mt-1">108 cards · Full rules · No mercy</p>
        </div>

        {/* Rules quick reference */}
        <div className="w-full max-w-sm space-y-2 text-left">
          {[
            { card:'🔴🟡🟢🔵', label:'Number',   rule:'Match color or number' },
            { card:'⊘',         label:'Skip',     rule:'Opponent loses their turn' },
            { card:'↩',         label:'Reverse',  rule:'In 2P: you go again!' },
            { card:'+2',        label:'Draw Two', rule:'Opponent draws 2, loses turn' },
            { card:'🌈',        label:'Wild',     rule:'Play anytime, choose color' },
            { card:'+4',        label:'Wild +4',  rule:'Opponent draws 4, you pick color' },
          ].map(({ card,label,rule }) => (
            <div key={label} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-white/5"
              style={{ background:'rgba(255,255,255,0.03)' }}>
              <span className="text-lg w-8 text-center flex-shrink-0">{card}</span>
              <div>
                <p className="text-xs font-bold text-white">{label}</p>
                <p className="text-[9px] text-cozy-muted font-light">{rule}</p>
              </div>
            </div>
          ))}
        </div>

        {isPartnerHere ? (
          isHost ? (
            <motion.button whileHover={{ scale:1.05,boxShadow:'0 0 40px rgba(139,92,246,0.5)' }}
              whileTap={{ scale:0.96 }}
              onClick={handleStart} disabled={dealing}
              className="px-10 py-4 rounded-2xl font-black text-base cursor-pointer border-2 disabled:opacity-60 flex items-center gap-3"
              style={{ background:'linear-gradient(135deg,#7C3AED,#E53E3E)',color:'#fff',borderColor:'rgba(255,255,255,0.25)',fontFamily:'Syne,sans-serif',
                boxShadow:'0 8px 30px rgba(124,58,237,0.4)' }}>
              {dealing ? <><Loader2 className="w-5 h-5 animate-spin" /> Shuffling 108 cards...</>
                       : <><span className="text-xl">🃏</span> DEAL THE CARDS</>}
            </motion.button>
          ) : (
            <div className="text-center space-y-2">
              <motion.div animate={{ opacity:[1,0.4,1] }} transition={{ repeat:Infinity,duration:1.5 }}
                className="text-3xl">⏳</motion.div>
              <p className="text-sm font-bold text-white" style={{ fontFamily:'Syne,sans-serif' }}>
                Waiting for {partner?.name||'host'} to deal...
              </p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-50">
            <Loader2 className="w-8 h-8 text-cozy-muted animate-spin" />
            <p className="text-sm text-cozy-muted">Waiting for partner to join</p>
          </div>
        )}
      </div>
    );
  }

  // ── PLAYING ───────────────────────────────────────────────────────
  const pendingOnMe = pending && pending.target === myRole;
  const canDraw     = isMyTurn && !showPicker;
  const drawBtnLabel= pendingOnMe
    ? `DRAW ${pending.count} (forced)` : justDrew ? 'PASS TURN' : 'DRAW CARD';

  return (
    <div className="space-y-3 select-none">

      {/* ── OPPONENT HAND (face down) ── */}
      <div className="rounded-2xl border p-3 space-y-2"
        style={{ background:'rgba(0,0,0,0.4)', borderColor:`${COLOR_HEX[activeColor]}30` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cozy-soft border border-white/10 flex items-center justify-center text-lg">
              {partner?.avatar||'👤'}
            </div>
            <div>
              <p className="text-xs font-black text-white" style={{ fontFamily:'Syne,sans-serif' }}>
                {partner?.name||'Partner'}
              </p>
              <p className="text-[9px] font-mono" style={{ color: turn===partRole?COLOR_HEX[activeColor]:'#9E97B8' }}>
                {turn===partRole ? '← THEIR TURN' : 'waiting...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unoCalled === (isHost ? partner?.uid : user.uid) && (
              <motion.div animate={{ scale:[1,1.2,1] }} transition={{ repeat:Infinity,duration:0.6 }}
                className="px-2 py-0.5 rounded-full text-[10px] font-black border"
                style={{ background:'rgba(229,62,62,0.2)',borderColor:'#E53E3E',color:'#E53E3E' }}>
                UNO! 🃏
              </motion.div>
            )}
            <span className="text-[10px] font-mono font-bold text-white px-2 py-1 rounded-xl border border-white/10"
              style={{ background:'rgba(255,255,255,0.06)' }}>
              {partnerHandCount} cards
            </span>
          </div>
        </div>

        {/* Face-down cards row */}
        <div className="flex gap-1 overflow-x-auto pb-1 justify-center">
          {Array.from({length:Math.min(partnerHandCount,10)}).map((_,i)=>(
            <motion.div key={i} initial={{ rotateY:180 }} animate={{ rotateY:0 }}
              transition={{ delay:i*0.05 }}>
              <CardFace faceDown size="sm" />
            </motion.div>
          ))}
          {partnerHandCount > 10 && (
            <div className="flex items-center text-cozy-muted text-xs font-mono self-center ml-1">+{partnerHandCount-10}</div>
          )}
        </div>
      </div>

      {/* ── CENTER: GAME BOARD ── */}
      <div className="relative rounded-2xl border overflow-hidden p-4"
        style={{ background:`linear-gradient(135deg,rgba(0,0,0,0.7),${COLOR_HEX[activeColor]}15)`,
          borderColor:`${COLOR_HEX[activeColor]}40`,
          boxShadow:`0 0 30px ${COLOR_HEX[activeColor]}20` }}>

        {/* Color indicator top line */}
        <motion.div key={activeColor}
          initial={{ scaleX:0 }} animate={{ scaleX:1 }}
          className="absolute top-0 inset-x-0 h-1.5 rounded-t-2xl"
          style={{ background:COLOR_HEX[activeColor], transformOrigin:'left' }} />

        {/* Wild color picker overlay */}
        <AnimatePresence>
          {showPicker && <ColorPicker onPick={handleColorPick} label="Choose a color for Wild" />}
        </AnimatePresence>

        {/* Action toast */}
        <AnimatePresence>
          {toast && <ActionToast key={toast.text} text={toast.text} color={toast.color} />}
        </AnimatePresence>

        <div className="flex items-center justify-between gap-4">
          {/* Draw pile */}
          <div className="flex flex-col items-center gap-1.5">
            <motion.div whileHover={{ scale:canDraw&&!justDrew?1.05:{} }} whileTap={{ scale:canDraw&&!justDrew?0.95:{} }}
              onClick={canDraw && !justDrew ? handleDraw : undefined}
              className={canDraw && !justDrew ? 'cursor-pointer' : 'cursor-default'}>
              <CardFace faceDown size="md" />
            </motion.div>
            <span className="text-[9px] font-mono text-cozy-muted">{drawPile.length} left</span>
          </div>

          {/* Center info */}
          <div className="flex flex-col items-center gap-2 flex-1">
            {/* Active color badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
              style={{ background:`${COLOR_HEX[activeColor]}20`, borderColor:`${COLOR_HEX[activeColor]}50` }}>
              <div className="w-3 h-3 rounded-full" style={{ background:COLOR_HEX[activeColor] }} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white">
                {activeColor}
              </span>
            </div>

            {/* Turn indicator */}
            <motion.div animate={{ opacity:isMyTurn?[1,0.6,1]:1 }} transition={{ repeat:Infinity,duration:0.8 }}
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg"
              style={{ background:isMyTurn?`${COLOR_HEX[activeColor]}25`:'rgba(255,255,255,0.05)',
                color:isMyTurn?COLOR_HEX[activeColor]:'#9E97B8' }}>
              {isMyTurn ? '→ YOUR TURN' : `→ ${partner?.name?.split(' ')[0]||'THEIR'} TURN`}
            </motion.div>

            {/* Pending effect warning */}
            {pendingOnMe && (
              <motion.div animate={{ scale:[1,1.05,1] }} transition={{ repeat:Infinity,duration:0.5 }}
                className="flex items-center gap-1.5 text-[10px] font-black text-white px-2 py-1 rounded-lg"
                style={{ background:'rgba(229,62,62,0.25)', border:'1px solid rgba(229,62,62,0.5)' }}>
                <AlertTriangle className="w-3 h-3 text-red-400" />
                Draw {pending.count} forced!
              </motion.div>
            )}

            {/* Just drew — can play banner */}
            {justDrew && isMyTurn && (
              <motion.div initial={{ scale:0.8 }} animate={{ scale:1 }}
                className="text-[10px] font-bold text-emerald-400 font-mono text-center">
                ✓ You drew — play it or pass
              </motion.div>
            )}

            {/* Last action log */}
            {lastAction && (
              <p className="text-[8px] font-mono text-cozy-muted/60 text-center max-w-[120px] leading-snug line-clamp-2">{lastAction}</p>
            )}
          </div>

          {/* Discard pile (top card) */}
          <div className="flex flex-col items-center gap-1.5">
            <AnimatePresence mode="wait">
              {topCard && (
                <motion.div key={topCard.id}
                  initial={{ scale:0.5,rotate:-15,opacity:0,y:-20 }}
                  animate={{ scale:1,rotate:0,opacity:1,y:0 }}
                  exit={{ scale:0.7,opacity:0 }}
                  transition={{ type:'spring',stiffness:300,damping:20 }}>
                  <CardFace card={topCard} size="md" />
                </motion.div>
              )}
            </AnimatePresence>
            <span className="text-[9px] font-mono text-cozy-muted">discard</span>
          </div>
        </div>

        {/* Draw / Pass button */}
        {isMyTurn && (
          <div className="mt-3 flex justify-center">
            <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.95 }}
              onClick={justDrew ? handlePass : handleDraw}
              className="px-6 py-2.5 rounded-2xl font-black text-xs cursor-pointer border-2 flex items-center gap-2 transition-all"
              style={{
                background: pendingOnMe ? 'rgba(229,62,62,0.2)' : justDrew ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.08)',
                borderColor: pendingOnMe ? '#E53E3E' : justDrew ? '#34D399' : 'rgba(255,255,255,0.15)',
                color: pendingOnMe ? '#FC8181' : justDrew ? '#34D399' : '#E2E0F0',
                fontFamily: 'Syne,sans-serif',
              }}>
              {pendingOnMe
                ? `🃏 DRAW ${pending.count} CARDS`
                : justDrew
                ? '⏩ PASS TURN'
                : '🃏 DRAW A CARD'}
            </motion.button>
          </div>
        )}
      </div>

      {/* ── MY HAND ── */}
      <div className="rounded-2xl border p-3 space-y-2"
        style={{ background:'rgba(0,0,0,0.5)', borderColor:isMyTurn?`${COLOR_HEX[activeColor]}40`:'rgba(255,255,255,0.06)',
          boxShadow:isMyTurn?`0 0 20px ${COLOR_HEX[activeColor]}20`:'' }}>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cozy-soft border border-white/10 flex items-center justify-center text-lg">
              {user?.avatar||'🧁'}
            </div>
            <div>
              <p className="text-xs font-black text-white" style={{ fontFamily:'Syne,sans-serif' }}>
                {user?.name||'You'}
              </p>
              <p className="text-[9px] font-mono" style={{ color:isMyTurn?COLOR_HEX[activeColor]:'#9E97B8' }}>
                {isMyTurn ? '← YOUR TURN' : 'wait...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unoCalled === user.uid && (
              <motion.div animate={{ scale:[1,1.15,1] }} transition={{ repeat:Infinity,duration:0.6 }}
                className="px-2 py-0.5 rounded-full text-[10px] font-black border"
                style={{ background:'rgba(229,62,62,0.2)',borderColor:'#E53E3E',color:'#FC8181' }}>
                UNO! 🃏
              </motion.div>
            )}
            <span className="text-[10px] font-mono font-bold text-white px-2 py-1 rounded-xl border border-white/10"
              style={{ background:'rgba(255,255,255,0.06)' }}>
              {myHand.length} cards
            </span>
          </div>
        </div>

        {/* My hand - horizontal scroll */}
        <div ref={handScrollRef}
          className="flex gap-1.5 overflow-x-auto pb-2 pt-1"
          style={{ scrollSnapType:'x mandatory', WebkitOverflowScrolling:'touch' }}>
          {myHand.map((card,i) => {
            const playable = isMyTurn && !showPicker && canPlay(card,topCard,currentColor) && !pendingOnMe;
            const isJustDrew = justDrew && justDrew.handIdx === i;
            return (
              <div key={card.id} style={{ scrollSnapAlign:'start' }}
                className={isJustDrew ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-transparent rounded-xl' : ''}>
                <CardFace
                  card={card}
                  size="md"
                  playable={playable}
                  selected={selectedIdx === i}
                  onClick={() => {
                    if (!isMyTurn || showPicker) return;
                    if (pendingOnMe) return;
                    if (!playable) { playClick(); setSelectedIdx(selectedIdx===i?null:i); return; }
                    if (selectedIdx === i) {
                      handlePlay(card, i);
                    } else {
                      setSelectedIdx(i);
                    }
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Hint text */}
        <p className="text-[8px] font-mono text-cozy-muted/40 text-center">
          {isMyTurn
            ? selectedIdx !== null
              ? 'Tap again to play the selected card'
              : 'Tap a card to select, tap again to play'
            : 'Wait for your turn'
          }
        </p>
      </div>
    </div>
  );
}