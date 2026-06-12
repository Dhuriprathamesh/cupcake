// src/pages/World/GamesHub.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpace } from '../../context/SpaceContext';
import {
  Gamepad2, Trophy, Zap, RefreshCcw, Loader2,
  Swords, Brain, CheckCircle, XCircle,
  Crown, Flame, Star, Clock, History, Send,
} from 'lucide-react';
import UnoGame from './UnoGame';
import {
  playCorrect, playWrong, playClick, playWin, playLose, playXP,
  playTargetAppear, playTargetHit, playMatch, playClash,
  playRoast, playReveal, playQuizCorrect, playQuizWrong,
  playWheelSpin, playTruthLand, playDareLand, playTimerTick,
  playTimerEnd, playApproved, playResend, playGameStart,
  playAgree, playDisagree,
} from '../../utils/soundEngine';

// ─── Constants ───────────────────────────────────────────────────────────────
const WIN_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const XP = { win:150, draw:50, loss:25 };

const EMOJI_ROUNDS = [
  { clue:'🦁👑',    answer:'Lion King',          options:['Lion King','Jungle Book','Tarzan','Madagascar']         },
  { clue:'🕷️🕸️👦', answer:'Spider-Man',         options:['Spider-Man','Batman','Ant-Man','Iron Man']              },
  { clue:'🧊❄️👸',  answer:'Frozen',             options:['Frozen','Cinderella','Tangled','Brave']                 },
  { clue:'🚀👨‍🚀🌌', answer:'Interstellar',       options:['Gravity','Interstellar','Avatar','Arrival']             },
  { clue:'🍕🤢👻',  answer:'Ghostbusters',       options:['Ghostbusters','Gremlins','Beetlejuice','IT']             },
  { clue:'💍🧙‍♂️🗡️', answer:'Lord of the Rings', options:['Lord of the Rings','Harry Potter','Narnia','Eragon']    },
  { clue:'🐠🌊🔍',  answer:'Finding Nemo',       options:['Finding Nemo','Finding Dory','Shark Tale','Ponyo']       },
  { clue:'🤖❤️🌿',  answer:'WALL-E',             options:['WALL-E','Big Hero 6','A.I.','Short Circuit']             },
];

function calcWinner(board) {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a]===board[b] && board[a]===board[c]) return board[a];
  }
  return board.every(Boolean) ? 'Draw' : null;
}

// ─── Per-game themes ──────────────────────────────────────────────────────────
const GAME_THEMES = {
  ttt:      { bg:'linear-gradient(135deg,#0d0500,#1a0800,#0a0400)', accent:'#FCD34D', accent2:'#FB923C', cardBg:'#FFDF80', cardText:'#1a0800', border:'#2C1A00', blob1:'rgba(251,191,36,0.25)', blob2:'rgba(234,88,12,0.15)', particle:'⭕', particle2:'❌', label:'🎮 TIC TAC TOE', font:'Nunito,sans-serif' },
  emoji:    { bg:'linear-gradient(135deg,#000d1a,#001a35,#000810)', accent:'#06B6D4', accent2:'#8B5CF6', cardBg:'#0a1628', cardText:'#E2F8FF', border:'rgba(6,182,212,0.4)', blob1:'rgba(6,182,212,0.20)', blob2:'rgba(139,92,246,0.12)', particle:'🎬', particle2:'🤔', label:'🧠 EMOJI QUIZ', font:'Space Grotesk,sans-serif' },
  reaction: { bg:'linear-gradient(135deg,#0a0014,#140028,#060010)', accent:'#FF6B97', accent2:'#8B5CF6', cardBg:'#120020', cardText:'#FFE4F0', border:'rgba(255,107,151,0.4)', blob1:'rgba(255,107,151,0.22)', blob2:'rgba(139,92,246,0.15)', particle:'⚡', particle2:'💥', label:'⚡ REACTION BLITZ', font:'Syne,sans-serif' },
  wkb:      { bg:'linear-gradient(135deg,#0a1400,#001a0f,#050a00)', accent:'#34D399', accent2:'#06B6D4', cardBg:'#041a0f', cardText:'#E0FFF4', border:'rgba(52,211,153,0.4)',  blob1:'rgba(52,211,153,0.18)',  blob2:'rgba(6,182,212,0.12)',   particle:'🤔', particle2:'💭', label:'🧠 WHO KNOWS BETTER', font:'Space Grotesk,sans-serif' },
  ctd:      { bg:'linear-gradient(135deg,#14000a,#28001a,#0a0005)', accent:'#F472B6', accent2:'#FB923C', cardBg:'#160010', cardText:'#FFE4F0', border:'rgba(244,114,182,0.4)', blob1:'rgba(244,114,182,0.20)', blob2:'rgba(251,146,60,0.14)',   particle:'🎡', particle2:'🎯', label:'🎲 CHAOS TRUTH OR DARE', font:'Nunito,sans-serif' },
  ecc:      { bg:'linear-gradient(135deg,#00100f,#001a18,#000a08)', accent:'#2DD4BF', accent2:'#818CF8', cardBg:'#001814', cardText:'#E0FFFD', border:'rgba(45,212,191,0.4)',  blob1:'rgba(45,212,191,0.18)',  blob2:'rgba(129,140,248,0.12)', particle:'🎨', particle2:'✨', label:'🎨 EMOJI CHALLENGE', font:'Space Grotesk,sans-serif' },
  ht:       { bg:'linear-gradient(135deg,#140500,#200a00,#0a0200)', accent:'#FF6B35', accent2:'#FF2D78', cardBg:'#180600', cardText:'#FFE4D4', border:'rgba(255,107,53,0.4)',  blob1:'rgba(255,107,53,0.22)',  blob2:'rgba(255,45,120,0.14)',  particle:'🔥', particle2:'💀', label:'🔥 HOT TAKES BATTLE', font:'Nunito,sans-serif'  },
  uno:      { bg:'linear-gradient(135deg,#0a0020,#160030,#080015)', accent:'#9333EA', accent2:'#E53E3E', cardBg:'#0d0028', cardText:'#F0E6FF', border:'rgba(147,51,234,0.45)', blob1:'rgba(147,51,234,0.28)', blob2:'rgba(229,62,62,0.18)',   particle:'🃏', particle2:'✨', label:'🃏 UNO', font:'Syne,sans-serif' },
};

// ─── Floating bg particles ────────────────────────────────────────────────────
function GameParticles({ theme }) {
  const items = Array.from({ length: 8 }, (_, i) => ({
    id:i, emoji:i%2===0?theme.particle:theme.particle2,
    x:5+i*11, delay:i*1.4, duration:9+(i%3)*3, size:10+(i%3)*7,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {items.map(p => (
        <motion.div key={`${theme.label}-${p.id}`}
          initial={{ y:'110%', opacity:0 }}
          animate={{ y:'-20%', opacity:[0,0.35,0.35,0] }}
          transition={{ duration:p.duration, delay:p.delay, repeat:Infinity, ease:'linear' }}
          className="absolute select-none hidden md:block"
          style={{ left:`${p.x}%`, fontSize:p.size, filter:`drop-shadow(0 0 6px ${theme.accent}60)` }}>
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Win Overlay ──────────────────────────────────────────────────────────────
function WinOverlay({ winner, partnerName, xpGained, onPlayAgain, theme }) {
  const isDraw = winner==='Draw', iWon=winner==='X';
  const msgs = iWon
    ? ['ABSOLUTE WINNER! 🏆','YOU DESTROYED THEM 💀','GET REKT 😤','SKILL DIFF 🔥']
    : isDraw
    ? ['TIE?! REALLY?! 😭','NOBODY WINS 🤝','COWARDS 😂']
    : ['L + RATIO 😂','GET GOOD 💀','SKILL ISSUE 🤣','DESTROYED 💥'];
  const [msg]     = useState(() => msgs[Math.floor(Math.random()*msgs.length)]);
  const glowColor = iWon ? theme.accent : isDraw ? '#9E97B8' : theme.accent2;

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="absolute inset-0 z-40 flex items-center justify-center rounded-3xl overflow-hidden"
      style={{ background:'rgba(0,0,0,0.92)', backdropFilter:'blur(18px)' }}>

      {/* ── Firework confetti ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({length:36}).map((_,i)=>(
          <motion.div key={i}
            initial={{ x:'50%', y:'60%', scale:0, opacity:1, rotate:0 }}
            animate={{
              x:`${5+Math.random()*90}%`,
              y:`${5+Math.random()*90}%`,
              scale:[0,1.4,0],
              opacity:[1,0.9,0],
              rotate: Math.random()*360,
            }}
            transition={{ duration:0.8+Math.random()*0.5, delay:i*0.025, ease:'easeOut' }}
            className="absolute rounded-sm pointer-events-none"
            style={{ width:4+Math.random()*6, height:4+Math.random()*6,
              background:[theme.accent,theme.accent2,'#fff','#FFD700','#FF6B97'][i%5] }} />
        ))}
      </div>

      {/* ── Floating game emojis ── */}
      {(iWon ? ['🏆','⭐','🎉','✨','🔥','💎'] : isDraw ? ['🤝','💭','🎭'] : ['💀','😈','🗡️']).map((e,i)=>(
        <motion.div key={e+i}
          initial={{ opacity:0, y:60, x:`${20+i*12}%` }}
          animate={{ opacity:[0,0.7,0], y:[-20,-80-i*20], rotate:[0,(i%2===0?15:-15)] }}
          transition={{ duration:1.8, delay:0.3+i*0.12, ease:'easeOut' }}
          className="absolute text-2xl pointer-events-none select-none"
          style={{ bottom:0 }}>{e}</motion.div>
      ))}

      {/* ── Glow pulse ring ── */}
      <motion.div
        animate={{ scale:[0.8,1.4,0.8], opacity:[0.2,0.5,0.2] }}
        transition={{ repeat:Infinity, duration:2, ease:'easeInOut' }}
        className="absolute w-32 h-32 rounded-full pointer-events-none"
        style={{ background:`radial-gradient(circle, ${glowColor}60 0%, transparent 70%)` }} />

      <div className="text-center space-y-4 px-5 relative z-10">
        <motion.div
          initial={{ scale:0, rotate:-30 }}
          animate={{ scale:1, rotate:0 }}
          transition={{ type:'spring', stiffness:260, damping:12, delay:0.1 }}
          className="text-7xl filter drop-shadow-2xl">
          {isDraw?'🤝':iWon?'🏆':'💀'}
        </motion.div>

        <motion.div initial={{ y:24, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.28 }}>
          <motion.h3
            animate={{ textShadow:[`0 0 20px ${glowColor}`,`0 0 50px ${glowColor}`,`0 0 20px ${glowColor}`] }}
            transition={{ repeat:Infinity, duration:1.8 }}
            className="text-2xl font-black text-white" style={{ fontFamily:theme.font }}>
            {msg}
          </motion.h3>
          <p className="text-cozy-muted text-xs mt-1 font-mono">
            {iWon?`${partnerName} has been eliminated`:isDraw?'Both equally mediocre':`${partnerName} outplayed you`}
          </p>
        </motion.div>

        <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.5, type:'spring' }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border font-mono font-bold text-sm"
          style={{ background:`${glowColor}22`, borderColor:`${glowColor}55`, color:glowColor,
            boxShadow:`0 0 16px ${glowColor}40` }}>
          <Zap className="w-4 h-4" /> +{xpGained} XP saved
        </motion.div>

        <motion.button initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.65 }}
          whileHover={{ scale:1.07, boxShadow:`0 0 30px ${theme.accent}80` }}
          whileTap={{ scale:0.93 }}
          onClick={onPlayAgain}
          className="px-7 py-3 rounded-2xl font-black text-sm cursor-pointer flex items-center gap-2 mx-auto border-2"
          style={{ background:theme.accent, color:'#000', fontFamily:theme.font,
            border:`2px solid ${theme.border}`, boxShadow:`4px 4px 0px ${theme.border}` }}>
          <RefreshCcw className="w-4 h-4" /> PLAY AGAIN
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Score bar (animated score pop on change) ────────────────────────────────
function ScoreBar({ userName, userScore, partnerName, partnerScore, isMyTurn, label, theme }) {
  const [prevUser,    setPrevUser]    = useState(userScore);
  const [prevPartner, setPrevPartner] = useState(partnerScore);
  const [userPop,     setUserPop]     = useState(false);
  const [partnerPop,  setPartnerPop]  = useState(false);

  useEffect(() => {
    if (userScore !== prevUser)    { setUserPop(true);    setPrevUser(userScore);    setTimeout(()=>setUserPop(false),   600); }
  }, [userScore]);
  useEffect(() => {
    if (partnerScore !== prevPartner) { setPartnerPop(true); setPrevPartner(partnerScore); setTimeout(()=>setPartnerPop(false), 600); }
  }, [partnerScore]);

  return (
    <div className="flex items-center gap-2 p-3 rounded-2xl border"
      style={{ background:`${theme.accent}10`, borderColor:`${theme.accent}30` }}>

      {/* You */}
      <motion.div
        animate={isMyTurn===true ? { boxShadow:[`0 0 0px ${theme.accent}00`,`0 0 14px ${theme.accent}60`,`0 0 0px ${theme.accent}00`] } : {}}
        transition={{ repeat:Infinity, duration:1.2 }}
        className={`flex-1 text-center px-2 py-2 rounded-xl transition-all ${isMyTurn===true?'ring-2':'opacity-60'}`}
        style={{ background:isMyTurn===true?`${theme.accent}15`:'transparent' }}>
        <p className="text-[8px] font-mono text-cozy-muted uppercase tracking-wider">You</p>
        <AnimatePresence mode="wait">
          <motion.p key={userScore}
            initial={userPop?{ scale:1.8, color:'#FFD700' }:{}}
            animate={{ scale:1, color:theme.accent }}
            transition={{ type:'spring', stiffness:400, damping:14 }}
            className="font-black text-lg leading-none" style={{ fontFamily:theme.font }}>
            {userScore}
          </motion.p>
        </AnimatePresence>
        <p className="text-[8px] text-white/60 truncate">{userName}</p>
      </motion.div>

      {/* VS center */}
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
        <span className="text-[7px] font-mono text-cozy-muted uppercase">{label}</span>
        <motion.span
          animate={{ textShadow:isMyTurn!==null?[`0 0 6px ${theme.accent}00`,`0 0 10px ${theme.accent}80`,`0 0 6px ${theme.accent}00`]:[] }}
          transition={{ repeat:Infinity, duration:1.5 }}
          className="font-black text-xs text-cozy-muted">VS</motion.span>
        {isMyTurn!==null&&(
          <motion.span
            animate={{ opacity:[1,0.6,1] }} transition={{ repeat:Infinity, duration:0.9 }}
            className="text-[7px] font-mono px-1.5 py-0.5 rounded-full font-bold"
            style={{ background:`${theme.accent}20`, color:theme.accent }}>
            {isMyTurn?'YOUR TURN':'THEIR TURN'}
          </motion.span>
        )}
      </div>

      {/* Partner */}
      <motion.div
        animate={isMyTurn===false ? { boxShadow:[`0 0 0px ${theme.accent2}00`,`0 0 14px ${theme.accent2}60`,`0 0 0px ${theme.accent2}00`] } : {}}
        transition={{ repeat:Infinity, duration:1.2 }}
        className={`flex-1 text-center px-2 py-2 rounded-xl transition-all ${isMyTurn===false?'ring-2':'opacity-60'}`}
        style={{ background:isMyTurn===false?`${theme.accent2}15`:'transparent' }}>
        <p className="text-[8px] font-mono text-cozy-muted uppercase tracking-wider">Partner</p>
        <AnimatePresence mode="wait">
          <motion.p key={partnerScore}
            initial={partnerPop?{ scale:1.8, color:'#FFD700' }:{}}
            animate={{ scale:1, color:theme.accent2 }}
            transition={{ type:'spring', stiffness:400, damping:14 }}
            className="font-black text-lg leading-none" style={{ fontFamily:theme.font }}>
            {partnerScore}
          </motion.p>
        </AnimatePresence>
        <p className="text-[8px] text-white/60 truncate">{partnerName}</p>
      </motion.div>
    </div>
  );
}

// ─── GAME 1: TIC TAC TOE ─────────────────────────────────────────────────────
// XP guard: gameState.xpAwardedForGame — set to true in Firestore when XP fires.
// So even if you close and reopen, the useEffect sees xpAwardedForGame===true and skips.
function TicTacToe({ user, partner, isHost, gameState, scores, updateGameState, addXP, recordWin, markXpAwarded, onReset }) {
  const board    = gameState.board     ?? Array(9).fill(null);
  const isXNext  = gameState.isXNext   ?? true;
  const winner   = gameState.winner    ?? null;
  const xpDone   = gameState.xpAwardedForGame === true;  // Firestore guard
  const myMark   = isHost ? 'X' : 'O';
  const isMyTurn = isXNext ? isHost : !isHost;
  const theme    = GAME_THEMES.ttt;

  // ── XP + win recording: only if xpAwardedForGame is false in Firestore ──
  useEffect(() => {
    if (!winner || xpDone) return;

    const iWon     = winner === myMark;
    const isDraw   = winner === 'Draw';
    const amount   = isDraw ? XP.draw : iWon ? XP.win : XP.loss;

    const run = async () => {
      await addXP(amount);

      if (!isDraw) {
        const winnerUid = winner === 'X'
          ? (isHost ? user.uid : partner?.uid)
          : (!isHost ? user.uid : partner?.uid);
        if (winnerUid) {
          // recordWin also sets xpAwardedForGame:true atomically
          await recordWin(winnerUid, 'ttt', 'xpAwardedForGame');
        }
      } else {
        // Draw — just mark XP awarded
        await markXpAwarded('xpAwardedForGame');
      }
    };
    run();
  }, [winner, xpDone]);

  const handleClick = async (idx) => {
    if (!isMyTurn || board[idx] || winner) return;
    const nb = [...board]; nb[idx] = myMark;
    playClick();
    const newWinner = calcWinner(nb);
    if (newWinner && newWinner !== 'Draw') playWin();
    else if (newWinner === 'Draw') playClash();
    await updateGameState({ board:nb, isXNext:!isXNext, winner:newWinner??null });
  };

  const userScore    = isHost ? (scores.host??0) : (scores.guest??0);
  const partnerScore = isHost ? (scores.guest??0) : (scores.host??0);
  const xpGained     = winner ? (winner==='Draw'?XP.draw:winner===myMark?XP.win:XP.loss) : 0;

  return (
    <div className="space-y-3">
      <ScoreBar userName={user?.name} userScore={userScore} partnerName={partner?.name||'Partner'}
        partnerScore={partnerScore} isMyTurn={isMyTurn} label="WINS" theme={theme} />

      <div className="relative rounded-3xl p-4 md:p-6 border-4 overflow-hidden"
        style={{ background:theme.cardBg, borderColor:theme.border, boxShadow:`6px 6px 0px ${theme.border}` }}>
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage:'radial-gradient(circle,rgba(0,0,0,0.15) 1px,transparent 1px)', backgroundSize:'16px 16px' }} />

        <AnimatePresence>
          {winner && <WinOverlay winner={winner===myMark?'X':winner==='Draw'?'Draw':'O'}
            partnerName={partner?.name||'Partner'} xpGained={xpGained} onPlayAgain={onReset} theme={theme} />}
        </AnimatePresence>

        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="px-3 py-1.5 rounded-xl border-2 text-xs font-black uppercase"
            style={{ fontFamily:theme.font, borderColor:theme.border,
              background:isMyTurn&&!winner?theme.accent:'rgba(0,0,0,0.1)',
              color:isMyTurn&&!winner?'#000':theme.cardText,
              boxShadow:isMyTurn&&!winner?`2px 2px 0 ${theme.border}`:'none' }}>
            {winner?'🎯 GAME OVER':isMyTurn?`🎯 YOUR TURN · ${myMark}`:`⏳ ${partner?.name||'Partner'}'s TURN`}
          </div>
          <motion.button whileHover={{ rotate:180 }} transition={{ duration:0.3 }} onClick={onReset}
            className="w-8 h-8 rounded-xl border-2 flex items-center justify-center cursor-pointer"
            style={{ borderColor:theme.border, background:'rgba(0,0,0,0.1)', color:theme.cardText }}>
            <RefreshCcw className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-3 max-w-[260px] sm:max-w-[280px] mx-auto relative z-10">
          {board.map((cell,idx)=>{
            const isWinCell = winner && winner!=='Draw' && WIN_LINES.some(([a,b,c])=>(a===idx||b===idx||c===idx)&&board[a]&&board[a]===board[b]&&board[a]===board[c]);
            const cellColor = cell==='X'?'#06B6D4':'#FF6B97';
            return (
              <motion.button key={idx}
                layout
                whileHover={isMyTurn&&!cell&&!winner?{scale:1.10,rotate:[-3,3,0],boxShadow:`0 0 18px ${theme.accent}60`}:{}}
                whileTap={isMyTurn&&!cell&&!winner?{scale:0.84}:{}}
                animate={isWinCell
                  ? { boxShadow:[`0 0 0px ${cellColor}`,`0 0 24px ${cellColor}cc`,`0 0 0px ${cellColor}`], scale:[1,1.08,1] }
                  : isMyTurn&&!cell&&!winner
                  ? { opacity:[0.85,1,0.85] }
                  : {}}
                transition={isWinCell
                  ? { repeat:Infinity, duration:0.8 }
                  : isMyTurn&&!cell&&!winner
                  ? { repeat:Infinity, duration:1.4, delay:idx*0.08 }
                  : {}}
                onClick={()=>handleClick(idx)}
                disabled={!!cell||!isMyTurn||!!winner}
                className="aspect-square rounded-xl md:rounded-2xl border-3 flex items-center justify-center text-2xl md:text-3xl font-black relative overflow-hidden"
                style={{
                  borderColor: isWinCell ? cellColor : cell==='X'?'#06B6D4':cell==='O'?'#FF6B97':theme.border,
                  background:  cell==='X'?'rgba(6,182,212,0.18)':cell==='O'?'rgba(255,107,151,0.18)':'rgba(255,255,255,0.38)',
                  boxShadow:   isWinCell ? `0 0 20px ${cellColor}99, 3px 3px 0 ${cellColor}` : cell?`3px 3px 0 ${cellColor}`:`3px 3px 0 ${theme.border}`,
                  cursor:isMyTurn&&!cell&&!winner?'pointer':'not-allowed',
                  fontFamily:theme.font,
                }}>
                <AnimatePresence>
                  {cell && (
                    <motion.span
                      initial={{ scale:0, rotate:-30, opacity:0 }}
                      animate={{ scale:1, rotate:0,   opacity:1 }}
                      exit={{ scale:0, opacity:0 }}
                      transition={{ type:'spring', stiffness:420, damping:14 }}
                      style={{ color:cellColor, textShadow:`0 0 12px ${cellColor}80` }}>
                      {cell}
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* Ripple on click */}
                {!cell && isMyTurn && !winner && (
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    animate={{ background:['rgba(255,255,255,0)','rgba(255,255,255,0.08)','rgba(255,255,255,0)'] }}
                    transition={{ repeat:Infinity, duration:1.6, delay:idx*0.1 }} />
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="flex justify-center gap-6 mt-4 text-xs font-black relative z-10" style={{ fontFamily:theme.font, color:theme.cardText }}>
          <span style={{color:'#06B6D4'}}>X = {isHost?user?.name||'You':partner?.name||'Partner'}</span>
          <span style={{color:'#FF6B97'}}>O = {!isHost?user?.name||'You':partner?.name||'Partner'}</span>
        </div>
      </div>
    </div>
  );
}

// ─── GAME 2: EMOJI QUIZ ───────────────────────────────────────────────────────
// XP guard: gameState.emojiXpAwarded
function EmojiQuiz({ user, partner, isHost, gameState, updateGameState, addXP, markXpAwarded, onReset }) {
  const round        = gameState.emojiRound       ?? 0;
  const scoreHost    = gameState.emojiScoreHost   ?? 0;
  const scoreGuest   = gameState.emojiScoreGuest  ?? 0;
  const chosenAnswer = gameState.emojiAnswer      ?? null;
  const revealed     = gameState.emojiRevealed    ?? false;
  const xpDone       = gameState.emojiXpAwarded   === true;
  const totalRounds  = EMOJI_ROUNDS.length;
  const gameOver     = round >= totalRounds;
  const current      = EMOJI_ROUNDS[Math.min(round, totalRounds-1)];
  const myScore      = isHost ? scoreHost  : scoreGuest;
  const partScore    = isHost ? scoreGuest : scoreHost;
  const theme        = GAME_THEMES.emoji;
  const [localChosen, setLocalChosen] = useState(null);
  const [showResult,  setShowResult]  = useState(false);

  useEffect(() => { setLocalChosen(null); setShowResult(false); }, [round]);

  useEffect(() => {
    if (!revealed||!chosenAnswer) return;
    setShowResult(true);
    const t = setTimeout(async () => {
      setShowResult(false);
      await updateGameState({ emojiRound:round+1, emojiAnswer:null, emojiRevealed:false });
    }, 2000);
    return ()=>clearTimeout(t);
  }, [revealed]);

  // XP only if emojiXpAwarded is false in Firestore
  useEffect(() => {
    if (!gameOver || xpDone) return;
    const amount = myScore>partScore ? XP.win : myScore===partScore ? XP.draw : XP.loss;
    const run = async () => {
      await addXP(amount);
      await markXpAwarded('emojiXpAwarded');
      setTimeout(() => { if (myScore>partScore) playWin(); else if (myScore<partScore) playLose(); playXP(); }, 300);
    };
    run();
  }, [gameOver, xpDone]);

  const handleAnswer = async (option) => {
    if (localChosen||revealed||gameOver) return;
    setLocalChosen(option);
    const correct    = option===current.answer;
    const hD         = (isHost&&correct)  ? 1 : 0;
    const gD         = (!isHost&&correct) ? 1 : 0;
    await updateGameState({
      emojiAnswer:option, emojiRevealed:true,
      emojiScoreHost:scoreHost+hD, emojiScoreGuest:scoreGuest+gD,
    });
  };

  return (
    <div className="space-y-3">
      <ScoreBar userName={user?.name} userScore={myScore} partnerName={partner?.name||'Partner'}
        partnerScore={partScore} isMyTurn={null} label={`${round}/${totalRounds}`} theme={theme} />

      <div className="relative rounded-3xl border overflow-hidden p-4 md:p-6 space-y-4"
        style={{ background:theme.cardBg, borderColor:theme.border, boxShadow:`0 0 40px ${theme.accent}25` }}>

        <AnimatePresence>
          {gameOver&&<WinOverlay winner={myScore>partScore?'X':myScore<partScore?'O':'Draw'}
            partnerName={partner?.name||'Partner'}
            xpGained={myScore>partScore?XP.win:myScore===partScore?XP.draw:XP.loss}
            onPlayAgain={onReset} theme={theme} />}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-cozy-muted uppercase tracking-widest">Round {Math.min(round+1,totalRounds)} of {totalRounds}</span>
          <div className="flex gap-1">
            {EMOJI_ROUNDS.map((_,i)=>(
              <div key={i} className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background:i<round?theme.accent:i===round?theme.accent:'rgba(255,255,255,0.15)' }} />
            ))}
          </div>
        </div>

        <div className="text-center py-4">
          <motion.div key={round} initial={{scale:0.4,opacity:0,rotate:-10}} animate={{scale:1,opacity:1,rotate:0}}
            transition={{type:'spring',stiffness:300,damping:15}} className="text-5xl tracking-widest mb-2">
            {current.clue}
          </motion.div>
          <p className="text-[9px] font-mono uppercase tracking-widest" style={{color:theme.accent}}>🎬 What movie / show is this?</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {current.options.map((option,oi)=>{
            const isCorrect=option===current.answer, isChosen=option===chosenAnswer;
            let bdr=`${theme.accent}40`,bg='rgba(255,255,255,0.04)',txt=theme.cardText,shdw='none';
            if(revealed){
              if(isCorrect){ bdr='#34D399'; bg='rgba(52,211,153,0.25)'; txt='#34D399'; shdw='0 0 20px rgba(52,211,153,0.6)'; }
              else if(isChosen){ bdr='#FF6B97'; bg='rgba(255,107,151,0.2)'; txt='#FF6B97'; }
              else{ bg='rgba(0,0,0,0.3)'; txt='rgba(255,255,255,0.25)'; bdr='rgba(255,255,255,0.04)'; }
            } else if(localChosen===option){ bg=`${theme.accent}25`; bdr=theme.accent; }
            return (
              <motion.button key={option}
                initial={{ opacity:0, y:10 }}
                animate={revealed && isCorrect
                  ? { scale:[1,1.08,1.04,1], boxShadow:['0 0 0px #34D39900','0 0 30px #34D39988','0 0 20px #34D39944'] }
                  : revealed && isChosen && !isCorrect
                  ? { x:[0,-8,8,-6,6,-3,3,0] }
                  : { opacity:1, y:0 }}
                transition={revealed && isCorrect
                  ? { duration:0.5, ease:'easeOut' }
                  : revealed && isChosen && !isCorrect
                  ? { duration:0.4, ease:'easeOut' }
                  : { delay:oi*0.06 }}
                whileHover={!revealed?{scale:1.04,y:-3}:{}}
                whileTap={!revealed?{scale:0.94}:{}}
                onClick={()=>handleAnswer(option)} disabled={!!localChosen||revealed||gameOver}
                className="px-2 py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer relative overflow-hidden"
                style={{borderColor:bdr,background:bg,color:txt,boxShadow:shdw,fontFamily:theme.font}}>
                {revealed&&isCorrect&&<CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{color:'#34D399'}}/>}
                {revealed&&isChosen&&!isCorrect&&<XCircle className="w-3.5 h-3.5 flex-shrink-0" style={{color:'#FF6B97'}}/>}
                {option}
                {/* correct answer shimmer */}
                {revealed && isCorrect && (
                  <motion.div className="absolute inset-0 pointer-events-none"
                    animate={{ opacity:[0,0.4,0] }} transition={{ repeat:Infinity, duration:1.2 }}
                    style={{ background:'linear-gradient(90deg,transparent,rgba(52,211,153,0.3),transparent)' }} />
                )}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {showResult&&chosenAnswer&&(
            <motion.div
              initial={{opacity:0,scale:0.6,y:10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.6}}
              transition={{type:'spring',stiffness:350,damping:18}}
              className="text-center text-sm font-black py-2 px-3 rounded-xl" style={{fontFamily:theme.font,
                background: chosenAnswer===current.answer?'rgba(52,211,153,0.15)':'rgba(255,107,151,0.12)',
                color:chosenAnswer===current.answer?'#34D399':'#FF6B97',
                border:`1px solid ${chosenAnswer===current.answer?'rgba(52,211,153,0.3)':'rgba(255,107,151,0.3)'}`,
                boxShadow:`0 0 16px ${chosenAnswer===current.answer?'rgba(52,211,153,0.3)':'rgba(255,107,151,0.2)'}`}}>
              {chosenAnswer===current.answer ? '✅ CORRECT! LETS GOOO!' : '❌ WRONG! Answer: ' + current.answer}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── GAME 3: REACTION BLITZ ───────────────────────────────────────────────────
// XP guard: gameState.reactionXpAwarded
function ReactionBlitz({ user, partner, isHost, gameState, updateGameState, addXP, recordWin, markXpAwarded, onReset }) {
  const target      = gameState.reactionTarget       ?? null;
  const rWinner     = gameState.reactionWinner       ?? null;
  const myRounds    = isHost?(gameState.reactionHostRounds??0):(gameState.reactionGuestRounds??0);
  const partRounds  = isHost?(gameState.reactionGuestRounds??0):(gameState.reactionHostRounds??0);
  const xpDone      = gameState.reactionXpAwarded    === true;
  const MAX_ROUNDS  = 5;
  const gameOver    = myRounds>=MAX_ROUNDS || partRounds>=MAX_ROUNDS;
  const theme       = GAME_THEMES.reaction;
  const [countdown, setCountdown] = useState(null);
  const [localHit,  setLocalHit]  = useState(false);

  useEffect(()=>{
    if(!isHost||target!==null||gameOver||rWinner!==null) return;
    const delay=1500+Math.random()*2500;
    let tick=Math.ceil(delay/1000);
    setCountdown(tick);
    const interval=setInterval(()=>{tick-=1;setCountdown(tick>0?tick:null);},1000);
    const timeout=setTimeout(async()=>{
      clearInterval(interval);setCountdown(null);
      const targets=['🎯','⚡','🔥','💥','🌟','🎮','💎','🚀','👾','🎪'];
      playTargetAppear();
      await updateGameState({reactionTarget:targets[Math.floor(Math.random()*targets.length)],reactionWinner:null,reactionStartedAt:Date.now()});
    },delay);
    return()=>{clearTimeout(timeout);clearInterval(interval);};
  },[target,isHost,gameOver,rWinner]);

  useEffect(()=>{
    if(!rWinner) return;
    setLocalHit(false);
    const t=setTimeout(async()=>{
      await updateGameState({reactionTarget:null,reactionWinner:null,reactionStartedAt:null});
    },2000);
    return()=>clearTimeout(t);
  },[rWinner]);

  // XP only if reactionXpAwarded is false in Firestore
  useEffect(()=>{
    if(!gameOver||xpDone) return;
    const iWon=myRounds>=MAX_ROUNDS;
    const run=async()=>{
      await addXP(iWon?XP.win:XP.loss);
      setTimeout(() => { iWon ? playWin() : playLose(); playXP(); }, 300);
      if(iWon) await recordWin(user.uid,'reaction','reactionXpAwarded');
      else if(partner?.uid) await recordWin(partner.uid,'reaction','reactionXpAwarded');
      else await markXpAwarded('reactionXpAwarded');
    };
    run();
  },[gameOver,xpDone]);

  const handleTap=async()=>{
    if(!target||rWinner||localHit) return;
    setLocalHit(true);
    playTargetHit();
    const hD=isHost?1:0,gD=!isHost?1:0;
    await updateGameState({
      reactionWinner:user.uid,
      reactionHostRounds:(gameState.reactionHostRounds??0)+hD,
      reactionGuestRounds:(gameState.reactionGuestRounds??0)+gD,
    });
  };

  const iWonRound=rWinner===user.uid;
  const roundWinnerName=rWinner?(rWinner===user.uid?'YOU':(partner?.name||'PARTNER').toUpperCase()):null;

  return (
    <div className="space-y-3">
      <ScoreBar userName={user?.name} userScore={myRounds} partnerName={partner?.name||'Partner'}
        partnerScore={partRounds} isMyTurn={null} label={`FIRST TO ${MAX_ROUNDS}`} theme={theme} />

      <div className="relative rounded-3xl border overflow-hidden p-4 md:p-6 min-h-[220px] md:min-h-[260px] flex flex-col items-center justify-center"
        style={{background:theme.cardBg,borderColor:theme.border,boxShadow:`0 0 50px ${theme.accent}25`}}>
        <AnimatePresence>
          {gameOver&&<WinOverlay winner={myRounds>=MAX_ROUNDS?'X':'O'} partnerName={partner?.name||'Partner'}
            xpGained={myRounds>=MAX_ROUNDS?XP.win:XP.loss} onPlayAgain={onReset} theme={theme}/>}
        </AnimatePresence>

        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{backgroundImage:`linear-gradient(${theme.accent}30 1px,transparent 1px),linear-gradient(90deg,${theme.accent}30 1px,transparent 1px)`,backgroundSize:'30px 30px'}}/>

        {!target&&!gameOver&&(
          <div className="text-center space-y-3 relative z-10">
            <p className="text-[9px] font-mono uppercase tracking-widest" style={{color:theme.accent}}>
              {isHost?'⚙️ GENERATING TARGET...':'👀 WATCHING FOR TARGET...'}
            </p>
            {countdown!==null&&(
              <motion.div key={countdown} initial={{scale:2,opacity:0}} animate={{scale:1,opacity:1}}
                className="text-6xl font-black" style={{fontFamily:theme.font,color:theme.accent,textShadow:`0 0 40px ${theme.accent}`}}>
                {countdown}
              </motion.div>
            )}
            {countdown===null&&!target&&(
              <motion.div animate={{opacity:[1,0.3,1]}} transition={{repeat:Infinity,duration:0.6}}
                className="text-xl font-black tracking-widest" style={{fontFamily:theme.font,color:theme.accent}}>
                GET READY...
              </motion.div>
            )}
          </div>
        )}

        {target&&!gameOver&&(
          <div className="text-center space-y-4 relative z-10">
            {!rWinner?(
              <>
                <motion.p
                  animate={{ opacity:[1,0.4,1], textShadow:[`0 0 10px ${theme.accent}`,`0 0 30px ${theme.accent}`,`0 0 10px ${theme.accent}`] }}
                  transition={{repeat:Infinity,duration:0.35}}
                  className="text-sm font-black uppercase tracking-widest"
                  style={{fontFamily:theme.font,color:theme.accent}}>
                  ⚡ TAP IT NOW! ⚡
                </motion.p>
                <div className="relative">
                  {/* Shockwave ring */}
                  <motion.div
                    animate={{ scale:[1,2.2], opacity:[0.7,0] }}
                    transition={{ repeat:Infinity, duration:1, ease:'easeOut' }}
                    className="absolute inset-0 m-auto w-28 h-28 md:w-32 md:h-32 rounded-3xl pointer-events-none"
                    style={{ border:`2px solid ${theme.accent}`, left:'50%', top:'50%', transform:'translate(-50%,-50%)' }} />
                  <motion.button
                    initial={{scale:0,opacity:0}}
                    animate={{ scale:[1,1.07,1], opacity:1, boxShadow:[`0 0 30px ${theme.accent}`,`0 0 70px ${theme.accent}aa`,`0 0 30px ${theme.accent}`] }}
                    transition={{ type:'spring',stiffness:500,damping:15, scale:{repeat:Infinity,duration:0.4}, boxShadow:{repeat:Infinity,duration:0.5} }}
                    whileTap={{scale:0.65}} onClick={handleTap} disabled={localHit}
                    className="w-28 h-28 md:w-32 md:h-32 rounded-3xl flex items-center justify-center text-5xl md:text-6xl cursor-pointer border-4"
                    style={{background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,borderColor:'#fff'}}>
                    {target}
                  </motion.button>
                </div>
              </>
            ):(
              <motion.div initial={{scale:0.4,opacity:0}} animate={{scale:1,opacity:1}}
                transition={{type:'spring',stiffness:320,damping:14}} className="text-center space-y-3">
                {/* Explosion particles */}
                <div className="relative w-32 h-24 mx-auto">
                  {Array.from({length:14}).map((_,i)=>(
                    <motion.div key={i}
                      initial={{ x:'50%', y:'50%', scale:0, opacity:1 }}
                      animate={{ x:`${10+Math.random()*80}%`, y:`${5+Math.random()*90}%`, scale:[0,1,0], opacity:[1,0.8,0] }}
                      transition={{ duration:0.6, delay:i*0.03, ease:'easeOut' }}
                      className="absolute w-3 h-3 rounded-full pointer-events-none"
                      style={{ background:[theme.accent,theme.accent2,'#fff','#FFD700'][i%4] }} />
                  ))}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <motion.div
                      animate={{ scale:[1,1.3,1], rotate:[0,10,-10,0] }}
                      transition={{ repeat:Infinity, duration:0.5 }}
                      className="text-4xl">{iWonRound?'⚡':'😤'}</motion.div>
                    <motion.p
                      animate={{ textShadow:[`0 0 10px ${iWonRound?'#34D399':'#FF6B97'}`,`0 0 25px ${iWonRound?'#34D399':'#FF6B97'}`,`0 0 10px ${iWonRound?'#34D399':'#FF6B97'}`] }}
                      transition={{ repeat:Infinity, duration:0.8 }}
                      className="text-base font-black" style={{fontFamily:theme.font,color:iWonRound?'#34D399':'#FF6B97'}}>
                      {roundWinnerName} GOT IT!
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Game history panel ───────────────────────────────────────────────────────
function GameHistoryPanel({ gameHistory, user, partner }) {
  const recent = [...gameHistory].sort((a,b)=>(b.playedAtTs??0)-(a.playedAtTs??0)).slice(0,8);
  const ICONS  = { ttt:'🎮', emoji:'🧠', reaction:'⚡' };

  if (!recent.length) return (
    <div className="text-center py-8 opacity-30 space-y-2">
      <History className="w-7 h-7 text-cozy-muted mx-auto" />
      <p className="text-[10px] text-cozy-muted font-mono">No games played yet</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {recent.map((entry,i) => {
        const iWon = entry.winnerUid === user?.uid;
        const date = entry.playedAt ? new Date(entry.playedAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '';
        return (
          <motion.div key={entry.id} initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
            className="flex items-center justify-between p-2.5 rounded-xl border border-white/5"
            style={{background:'rgba(255,255,255,0.03)'}}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base flex-shrink-0">{ICONS[entry.gameType]||'🎮'}</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-white capitalize">{entry.gameType?.replace('ttt','Tic-Tac-Toe')}</p>
                <p className="text-[8px] font-mono text-cozy-muted truncate">{date}</p>
              </div>
            </div>
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${iWon?'bg-emerald-500/15 text-emerald-400':'bg-red-500/10 text-red-400'}`}>
              {iWon?'WIN':'LOSS'}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// GAME 4: WHO KNOWS BETTER  (6 rounds · shuffled pool)
// ════════════════════════════════════════════════════════════════════════════
const WKB_QUESTIONS = [
  { q:"What's their go-to comfort food at 2am?",           options:["Pizza","Chips","Ice Cream","Instant Noodles","Anything sweet","Just water lol"] },
  { q:"Who takes longer to get ready?",                    options:["Me obviously","Them 100%","Both equally chaotic","Neither, we're fast"] },
  { q:"What's their biggest red flag?",                    options:["Replies too late","Overthinks everything","Too stubborn","Eats all your food","Watches shows without you","Cancels plans"] },
  { q:"Who gets hangry first?",                            options:["Me","Them","We both turn into gremlins","Neither, we're disciplined"] },
  { q:"What's their love language?",                       options:["Words of affirmation","Physical touch","Acts of service","Quality time","Gifts","They're just chaotic"] },
  { q:"Who would win in a roast battle?",                  options:["Me, no contest","Them, they're savage","It'd be a tie","Neither, we'd just giggle"] },
  { q:"What would they spend a lottery win on first?",     options:["Travel","Food","Gadgets","Clothes","Their family","Invest it (boring)"] },
  { q:"Their most used emoji right now?",                  options:["💀","😭","❤️","🔥","😂","😤"] },
  { q:"Who apologises first after an argument?",           options:["Me always","Them (eventually)","Neither — silent treatment","Both at the same time lol"] },
  { q:"What's their guilty pleasure TV show?",             options:["Reality TV trash","Anime","True crime","Rom-coms","Cartoons","They pretend to have taste"] },
  { q:"Who would survive a zombie apocalypse?",            options:["Me 100%","Them — they're unpredictable","Neither, we'd trip","Both, we're built different"] },
  { q:"Their reaction when plans get cancelled?",          options:["Secretly relieved","Actually upset","Fine either way","Already in bed tbh"] },
  { q:"What would their superpower be?",                   options:["Teleportation","Mind reading","Invisibility","Time travel","Never being tired","Eating without consequences"] },
  { q:"Their biggest irrational fear?",                    options:["Spiders","Being forgotten","The dark","Clowns","Commitment","Running out of snacks"] },
  { q:"Who texts 'I'm 5 mins away' and shows up 30 mins later?", options:["Me... sorry","Them, always","Both of us","We're actually on time"] },
  { q:"What's their current sleep schedule like?",         options:["Actually healthy","Midnight chaos","2-4am gang","Sleep? What's that?","Napping all day"] },
  { q:"How do they handle stress?",                        options:["Eats their feelings","Goes completely silent","Rants to everyone","Pretends everything's fine","Becomes weirdly productive"] },
  { q:"Their phone battery is at 3%. What do they do?",    options:["Panic immediately","Ignore it","Find a charger calmly","Turn on airplane mode","Post about it on stories"] },
  { q:"Who's more dramatic during an argument?",           options:["Me, I will not apologise","Them, Oscar-worthy","We're both unbearable","Neither, we communicate like adults (lie)"] },
  { q:"What energy are they at on a Monday morning?",      options:["Dead inside","Surprisingly okay","Full chaos","Pretending to be fine","Already planning the weekend"] },
  { q:"Their biggest personality trait?",                  options:["Overthinker","People-pleaser","Chaotic good","Too honest","Soft inside tough outside","Full villain arc"] },
  { q:"Who falls asleep during movies first?",             options:["Me, every time","Them without fail","Whoever picks the movie","We both survive"] },
  { q:"What's their relationship with punctuality?",       options:["15 mins early or they die","Always on time exactly","Fashionably late","Chronically late","Time is a construct to them"] },
  { q:"How do they eat food?",                             options:["All compartments separate","Mixes everything","Eats the best bits last","Finishes in 2 mins flat","Leaves the best bit then forgets it"] },
  { q:"Who spends more on food?",                          options:["Me, don't talk about it","Them, they're a menace","It's equal chaos","Neither, we're broke together"] },
  { q:"How long do they take to reply to texts?",          options:["Instant, like unhealthy fast","Few minutes","It depends on the vibe","Hours (they saw it)","Days (no excuse)"] },
  { q:"What's their go-to when they're sad?",              options:["Eat everything in sight","Watch comfort shows","Sleep for 14 hours","Call someone","Pretend they're fine","Revenge glow-up"] },
  { q:"Who's more competitive?",                           options:["Me, dangerously so","Them, it's a problem","We're both menaces","Neither, we're chill people (lie)"] },
  { q:"Their most chaotic late-night decision?",           options:["Ordering food at 3am","Redecorating their room","Starting a new TV show","Online shopping spree","Sending a risky text"] },
  { q:"Their social battery at a party?",                  options:["Dead after 30 minutes","Energised by the crowd","Only with close friends","Hides near the food table","Leaves early, no guilt"] },
  { q:"Best description of their humour?",                 options:["Dry and deadpan","Unhinged and chaotic","Self-deprecating","Observational and accurate","References only they understand"] },
  { q:"How do they handle being wrong?",                   options:["Never admits it","Admits it but changes topic fast","Says sorry immediately","Doubles down even harder","Admits it with full drama"] },
  { q:"Their vibe at 6am on a weekday?",                   options:["Fully awake and productive","Functioning zombie","Already late somehow","Alarm went off 4 times","Sent an email at 5am — unstoppable"] },
  { q:"Their most common excuse?",                         options:["'I forgot'","'I was going to'","'My phone died'","'I was busy'","'I thought you meant tomorrow'"] },
  { q:"How do they react when excited about something?",   options:["Tells everyone immediately","Keeps it to themselves","Sends 17 messages in a row","Cannot sit still","Makes a whole plan around it"] },
];

const WKB_ROASTS = [
  "Bro really thought that 💀",
  "That's the most wrong answer ever given 😭",
  "Do you even KNOW this person?! 💀",
  "Absolutely cooked that response 🔥",
  "Yikes, maybe get to know them better lol",
  "This is embarrassing for you specifically 😂",
  "Wrong. Spectacularly wrong. 💀",
  "How are you this wrong about someone you talk to daily 😭",
  "The audacity of being this incorrect 😤",
];

const COMPATIBILITY_MSGS = [
  { min:0, max:1, label:"Complete Strangers 👀", color:"#FF6B97", sub:"Do you two even talk?" },
  { min:2, max:2, label:"Getting There 🤔",      color:"#FB923C", sub:"You know the basics at least" },
  { min:3, max:3, label:"Pretty Compatible 😏",  color:"#FCD34D", sub:"You actually pay attention" },
  { min:4, max:5, label:"Scarily in Sync 😳",    color:"#34D399", sub:"Someone's been paying attention" },
  { min:6, max:6, label:"ONE BRAIN CELL 🧠👥",   color:"#8B5CF6", sub:"Are you literally the same person??" },
];

function shuffleIndices(len) {
  const arr = Array.from({ length: len }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const WKB_ROUNDS = 6;

function WhoKnowsBetter({ user, partner, isHost, gameState, updateGameState, addXP, markXpAwarded }) {
  const round       = gameState.wkbRound           ?? 0;
  const shuffled    = gameState.wkbShuffledIndices ?? [];
  const ansHost     = gameState.wkbAnswerHost      ?? null;
  const ansGuest    = gameState.wkbAnswerGuest     ?? null;
  const revealed    = gameState.wkbRevealed        ?? false;
  const hostScore   = gameState.wkbHostScore       ?? 0;
  const guestScore  = gameState.wkbGuestScore      ?? 0;
  const xpDone      = gameState.wkbXpAwarded       === true;
  const customQPool = gameState.wkbCustomQuestions ?? [];
  const gameNumber  = gameState.wkbGameNumber      ?? 0;
  const gameOver    = round >= WKB_ROUNDS;

  const myAns     = isHost ? ansHost  : ansGuest;
  const partAns   = isHost ? ansGuest : ansHost;
  const myScore   = isHost ? hostScore  : guestScore;
  const partScore = isHost ? guestScore : hostScore;

  const allQuestions = [...WKB_QUESTIONS, ...customQPool];
  const curIdx       = shuffled[round] ?? (round % allQuestions.length);
  const question     = allQuestions[curIdx % allQuestions.length];

  const [localAns,       setLocalAns]       = useState(null);
  const [showResult,     setShowResult]     = useState(false);
  const [roastMsg,       setRoastMsg]       = useState('');
  const [showCustomQ,    setShowCustomQ]    = useState(false);
  const [customQText,    setCustomQText]    = useState('');
  const [customOpts,     setCustomOpts]     = useState(['','','','']);
  const [customError,    setCustomError]    = useState('');
  const [customAnswer,   setCustomAnswer]   = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [showAllCustom,  setShowAllCustom]  = useState(false);

  // Host initialises shuffle at game start / new game
  useEffect(() => {
    if (!isHost) return;
    if (shuffled.length === WKB_ROUNDS && round > 0) return;
    if (shuffled.length === 0) {
      updateGameState({ wkbShuffledIndices: shuffleIndices(allQuestions.length).slice(0, WKB_ROUNDS) });
    }
  }, [gameNumber, isHost]);

  useEffect(() => {
    setLocalAns(null); setShowResult(false); setRoastMsg('');
    setShowOtherInput(false); setCustomAnswer('');
  }, [round]);

  // Both answered → auto reveal
  useEffect(() => {
    if (!ansHost || !ansGuest || revealed) return;
    playReveal();
    updateGameState({ wkbRevealed: true });
  }, [ansHost, ansGuest]);

  // Revealed → show 3s then advance
  useEffect(() => {
    if (!revealed || !ansHost || !ansGuest) return;
    setShowResult(true);
    if (ansHost !== ansGuest) { setRoastMsg(WKB_ROASTS[Math.floor(Math.random() * WKB_ROASTS.length)]); playRoast(); } else { playMatch(); }
    const t = setTimeout(async () => {
      const matched = ansHost === ansGuest;
      await updateGameState({
        wkbRound: round + 1, wkbAnswerHost: null, wkbAnswerGuest: null,
        wkbRevealed: false,
        wkbHostScore:  hostScore  + (matched ? 1 : 0),
        wkbGuestScore: guestScore + (matched ? 1 : 0),
      });
      setShowResult(false);
    }, 3000);
    return () => clearTimeout(t);
  }, [revealed]);

  useEffect(() => {
    if (!gameOver || xpDone) return;
    const matched = Math.max(hostScore, guestScore);
    const amount  = matched >= 5 ? 200 : matched >= 3 ? 150 : 80;
    const run = async () => { await addXP(amount); await markXpAwarded('wkbXpAwarded'); };
    run();
  }, [gameOver, xpDone]);

  const handleHandleCustomAnswer = async () => {
    if (!customAnswer.trim()) return;
    const opt = customAnswer.trim();
    setLocalAns(opt); setShowOtherInput(false);
    await updateGameState(isHost ? { wkbAnswerHost: opt } : { wkbAnswerGuest: opt });
  };

  const handleAnswer = async (option) => {
    if (myAns || revealed) return;
    if (option === '__other__') { setShowOtherInput(true); return; }
    setLocalAns(option);
    playClick();
    await updateGameState(isHost ? { wkbAnswerHost: option } : { wkbAnswerGuest: option });
  };

  const handleAddCustomQuestion = async () => {
    if (!customQText.trim()) { setCustomError('Write a question first!'); return; }
    const validOpts = customOpts.filter(o => o.trim());
    if (validOpts.length < 2) { setCustomError('Add at least 2 options!'); return; }
    const newQ = { q: customQText.trim(), options: [...validOpts, 'Something else entirely'], isCustom: true };
    await updateGameState({ wkbCustomQuestions: [...customQPool, newQ] });
    setCustomQText(''); setCustomOpts(['','','','']); setCustomError(''); setShowCustomQ(false);
  };

  const handleDeleteCustomQ = async (idx) => {
    await updateGameState({ wkbCustomQuestions: customQPool.filter((_, i) => i !== idx) });
  };

  const handlePlayAgain = async () => {
    const newIdx = shuffleIndices(allQuestions.length).slice(0, WKB_ROUNDS);
    await updateGameState({
      wkbRound: 0, wkbShuffledIndices: newIdx,
      wkbAnswerHost: null, wkbAnswerGuest: null,
      wkbRevealed: false, wkbHostScore: 0, wkbGuestScore: 0,
      wkbXpAwarded: false, wkbGameNumber: gameNumber + 1,
    });
  };

  const matchCount = Math.max(hostScore, guestScore);
  const compatData = COMPATIBILITY_MSGS.find(c => matchCount >= c.min && matchCount <= c.max) ?? COMPATIBILITY_MSGS[0];
  const theme = GAME_THEMES.wkb;

  // ── Full-screen result page — shown instead of the game when done ─────
  if (gameOver) {
    return (
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        transition={{ duration:0.4 }}
        className="rounded-3xl border overflow-hidden relative"
        style={{ background:theme.cardBg, borderColor:`${compatData.color}40`, boxShadow:`0 0 60px ${compatData.color}25` }}>
        {/* Confetti burst */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({length:24}).map((_,i)=>(
            <motion.div key={i}
              initial={{ x:'50%', y:'100%', scale:0, opacity:1 }}
              animate={{ x:`${5+Math.random()*90}%`, y:`${Math.random()*80}%`, scale:1, opacity:0 }}
              transition={{ duration:1.2, delay:i*0.04, ease:'easeOut' }}
              className="absolute w-3 h-3 rounded-full"
              style={{ background:[theme.accent,theme.accent2,'#fff','#FCD34D'][i%4] }} />
          ))}
        </div>

        <div className="relative z-10 p-6 md:p-8 flex flex-col items-center text-center gap-5">
          {/* Emoji */}
          <motion.div initial={{ scale:0, rotate:-20 }} animate={{ scale:1, rotate:0 }}
            transition={{ type:'spring', stiffness:200, delay:0.15 }}
            className="text-7xl">🧠</motion.div>

          {/* Score breakdown */}
          <div className="flex items-center gap-4 w-full max-w-xs">
            <div className="flex-1 rounded-2xl p-3 text-center border"
              style={{ background:`${theme.accent}15`, borderColor:`${theme.accent}30` }}>
              <p className="text-[8px] font-mono text-cozy-muted uppercase mb-1">You</p>
              <p className="text-2xl font-black text-white" style={{ fontFamily:theme.font }}>{myScore}</p>
              <p className="text-[9px] text-white/60 truncate">{user?.name}</p>
            </div>
            <div className="text-center flex-shrink-0">
              <p className="text-[9px] font-mono text-cozy-muted uppercase">Matched</p>
              <p className="text-lg font-black" style={{ color:compatData.color, fontFamily:theme.font }}>{matchCount}/{WKB_ROUNDS}</p>
            </div>
            <div className="flex-1 rounded-2xl p-3 text-center border"
              style={{ background:`${theme.accent2}15`, borderColor:`${theme.accent2}30` }}>
              <p className="text-[8px] font-mono text-cozy-muted uppercase mb-1">Partner</p>
              <p className="text-2xl font-black text-white" style={{ fontFamily:theme.font }}>{partScore}</p>
              <p className="text-[9px] text-white/60 truncate">{partner?.name}</p>
            </div>
          </div>

          {/* Big % */}
          <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
            transition={{ type:'spring', stiffness:160, delay:0.3 }}>
            <p className="text-[10px] font-mono uppercase tracking-widest text-cozy-muted mb-1">Compatibility Score</p>
            <p className="text-7xl font-black leading-none"
              style={{ fontFamily:theme.font, color:compatData.color, textShadow:`0 0 40px ${compatData.color}60` }}>
              {Math.round((matchCount/WKB_ROUNDS)*100)}%
            </p>
          </motion.div>

          {/* Label */}
          <motion.div initial={{ y:16, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.45 }}
            className="space-y-1">
            <h3 className="text-2xl font-black text-white" style={{ fontFamily:theme.font }}>{compatData.label}</h3>
            <p className="text-sm text-cozy-muted italic">"{compatData.sub}"</p>
          </motion.div>

          {/* XP */}
          {xpDone && (
            <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.6, type:'spring' }}
              className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold"
              style={{ background:`${compatData.color}20`, borderColor:`${compatData.color}40`, color:compatData.color }}>
              <Zap className="w-4 h-4" /> +{matchCount>=5?200:matchCount>=3?150:80} XP Saved!
            </motion.div>
          )}

          {/* Play Again */}
          <motion.button initial={{ y:16, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.7 }}
            whileHover={{ scale:1.05, boxShadow:`0 0 30px ${theme.accent}50` }}
            whileTap={{ scale:0.96 }}
            onClick={handlePlayAgain}
            className="px-8 py-4 rounded-2xl font-black text-base cursor-pointer border-2 flex items-center gap-3 shadow-xl"
            style={{ background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`, color:'#000', fontFamily:theme.font, borderColor:'rgba(255,255,255,0.25)' }}>
            <RefreshCcw className="w-5 h-5" /> PLAY AGAIN
          </motion.button>

          <p className="text-[9px] font-mono text-cozy-muted/50">
            Fresh 6 questions shuffled from {allQuestions.length}-question pool
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Score bar */}
      <div className="flex items-center gap-2 p-3 rounded-2xl border"
        style={{ background:`${theme.accent}10`, borderColor:`${theme.accent}30` }}>
        <div className="flex-1 text-center px-2 py-1.5 rounded-xl" style={{ background:`${theme.accent}15` }}>
          <p className="text-[8px] font-mono text-cozy-muted uppercase">You</p>
          <p className="font-black text-xl text-white" style={{ fontFamily:theme.font }}>{myScore}</p>
          <p className="text-[8px] text-white/60 truncate">{user?.name}</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <span className="text-[7px] font-mono text-cozy-muted uppercase">MATCHED</span>
          <span className="font-black text-xs text-white">/{WKB_ROUNDS}</span>
          <span className="text-[7px] font-mono px-1.5 py-0.5 rounded-full"
            style={{ background:`${theme.accent}20`, color:theme.accent }}>Q {round+1}</span>
        </div>
        <div className="flex-1 text-center px-2 py-1.5 rounded-xl" style={{ background:`${theme.accent2}15` }}>
          <p className="text-[8px] font-mono text-cozy-muted uppercase">Partner</p>
          <p className="font-black text-xl text-white" style={{ fontFamily:theme.font }}>{partScore}</p>
          <p className="text-[8px] text-white/60 truncate">{partner?.name}</p>
        </div>
      </div>

      <div className="relative rounded-3xl border overflow-hidden p-4 space-y-4"
        style={{ background:theme.cardBg, borderColor:theme.border, boxShadow:`0 0 40px ${theme.accent}20` }}>


        {/* Progress */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color:theme.accent }}>
            Round {round+1}/{WKB_ROUNDS}
          </span>
          <div className="flex gap-1">
            {Array.from({length:WKB_ROUNDS}).map((_,i)=>(
              <div key={i} className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: i < round ? theme.accent : i === round ? theme.accent : 'rgba(255,255,255,0.1)',
                  transform:  i === round ? 'scale(1.4)' : 'scale(1)',
                }} />
            ))}
          </div>
          <span className="text-[8px] font-mono text-cozy-muted">{allQuestions.length} in pool</span>
        </div>

        {/* Question */}
        {question && !gameOver && (
          <motion.div key={round} initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }}
            className="text-center py-3 space-y-1">
            {question.isCustom && (
              <span className="text-[8px] font-mono px-2 py-0.5 rounded-full"
                style={{ background:`${theme.accent}20`, color:theme.accent }}>
                ✏️ Custom Question
              </span>
            )}
            <p className="text-[9px] font-mono uppercase tracking-widest"
              style={{ color:`${theme.accent}80` }}>🤔 The Question Is...</p>
            <h3 className="text-base md:text-lg font-black text-white leading-snug"
              style={{ fontFamily:theme.font }}>{question.q}</h3>
          </motion.div>
        )}

        {/* Answer status */}
        <div className="flex justify-center gap-4 text-[9px] font-mono">
          <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${ansHost ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-cozy-muted'}`}>
            {user?.avatar} {ansHost ? '✓ Locked in' : '⏳ Thinking...'}
          </span>
          <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${ansGuest ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-cozy-muted'}`}>
            {partner?.avatar} {ansGuest ? '✓ Locked in' : '⏳ Thinking...'}
          </span>
        </div>

        {/* Both players can add custom questions */}
        {!gameOver && !myAns && (
          <div className="flex gap-2 flex-wrap">
            <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
              onClick={() => { setShowCustomQ(p => !p); setShowAllCustom(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-mono font-bold uppercase tracking-wide cursor-pointer transition-all"
              style={{
                background:  showCustomQ ? `${theme.accent}20` : 'rgba(255,255,255,0.04)',
                borderColor: showCustomQ ? theme.accent : 'rgba(255,255,255,0.10)',
                color:       showCustomQ ? theme.accent : '#9E97B8',
              }}>
              ✏️ {showCustomQ ? 'Cancel' : 'Add Question (both can add)'}
            </motion.button>
            {customQPool.length > 0 && (
              <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                onClick={() => { setShowAllCustom(p => !p); setShowCustomQ(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-mono font-bold uppercase tracking-wide cursor-pointer transition-all"
                style={{
                  background:  showAllCustom ? `${theme.accent2}20` : 'rgba(255,255,255,0.04)',
                  borderColor: showAllCustom ? theme.accent2 : 'rgba(255,255,255,0.10)',
                  color:       showAllCustom ? theme.accent2 : '#9E97B8',
                }}>
                📋 My Qs ({customQPool.length})
              </motion.button>
            )}
          </div>
        )}

        {/* Custom question form */}
        <AnimatePresence>
          {showCustomQ && !gameOver && (
            <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }}
              exit={{ opacity:0,height:0 }} className="overflow-hidden">
              <div className="space-y-3 p-4 rounded-2xl border border-white/10"
                style={{ background:'rgba(0,0,0,0.4)' }}>
                <p className="text-[9px] font-mono uppercase tracking-widest"
                  style={{ color:theme.accent }}>
                  ✏️ Create Custom Question — added to both players' pool
                </p>
                <input type="text" value={customQText}
                  onChange={e => { setCustomQText(e.target.value); setCustomError(''); }}
                  placeholder="e.g. What's my biggest annoying habit?" maxLength={120}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-cozy-muted/30 focus:outline-none border border-white/10 transition-all"
                  style={{ background:'rgba(0,0,0,0.4)', fontSize:'16px' }} />
                <div className="grid grid-cols-2 gap-2">
                  {customOpts.map((opt,i) => (
                    <input key={i} type="text" value={opt}
                      onChange={e => { const n=[...customOpts]; n[i]=e.target.value; setCustomOpts(n); setCustomError(''); }}
                      placeholder={`Option ${i+1}${i < 2 ? ' *' : ' (optional)'}`} maxLength={50}
                      className="rounded-xl px-3 py-2 text-xs text-white placeholder:text-cozy-muted/30 focus:outline-none border border-white/8 transition-all"
                      style={{ background:'rgba(0,0,0,0.4)', fontSize:'16px' }} />
                  ))}
                </div>
                {customError && <p className="text-[9px] text-red-400 font-mono">{customError}</p>}
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  onClick={handleAddCustomQuestion}
                  className="w-full py-2 rounded-xl font-black text-xs cursor-pointer border-2 flex items-center justify-center gap-1.5"
                  style={{ background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`, color:'#000', borderColor:'rgba(255,255,255,0.2)', fontFamily:theme.font }}>
                  ✅ Add to Question Pool (appears in next shuffle)
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom questions list */}
        <AnimatePresence>
          {showAllCustom && !gameOver && (
            <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }}
              exit={{ opacity:0,height:0 }} className="overflow-hidden">
              <div className="space-y-2 p-3 rounded-2xl border border-white/10 max-h-40 overflow-y-auto"
                style={{ background:'rgba(0,0,0,0.4)' }}>
                <p className="text-[8px] font-mono uppercase tracking-widest text-cozy-muted">
                  Custom questions — both players see these
                </p>
                {customQPool.map((q,i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-xl border border-white/5"
                    style={{ background:'rgba(255,255,255,0.03)' }}>
                    <p className="flex-1 text-[10px] text-white font-light line-clamp-1">{q.q}</p>
                    <button onClick={() => handleDeleteCustomQ(i)}
                      className="text-red-400/60 hover:text-red-400 text-xs cursor-pointer flex-shrink-0 transition-colors">✕</button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answer options */}
        {!gameOver && question && (
          <div className="grid grid-cols-2 gap-2">
            {[...question.options, '__other__'].map((opt) => {
              const isOther      = opt === '__other__';
              const displayOpt   = isOther ? '✏️ Type my own answer...' : opt;
              const isMyChoice   = !isOther && (localAns === opt || myAns === opt);
              const isPartChoice = revealed && partAns === opt;
              const isMatch      = revealed && !isOther && opt === ansHost && ansHost === ansGuest;

              let bg = 'rgba(255,255,255,0.04)', border = `${theme.accent}30`, textCol = '#E2DDF0';
              if (isOther)  { bg = 'rgba(255,255,255,0.02)'; border = 'rgba(255,255,255,0.12)'; textCol = '#9E97B8'; }
              if (isMatch)  { bg = 'rgba(52,211,153,0.2)'; border = '#34D399'; textCol = '#34D399'; }
              else if (isMyChoice && revealed && !isMatch) { bg = `${theme.accent}20`; border = theme.accent; }
              else if (isPartChoice && !isMatch)           { bg = `${theme.accent2}20`; border = theme.accent2; }
              else if (isMyChoice && !revealed)            { bg = `${theme.accent}25`; border = theme.accent; }

              if (isOther && (myAns || revealed)) return null;

              return (
                <motion.button key={opt}
                  whileHover={!myAns && !revealed ? { scale:1.03, y:-2 } : {}}
                  whileTap={!myAns && !revealed   ? { scale:0.96 } : {}}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!myAns || revealed}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left leading-snug ${isOther ? 'col-span-2 italic' : ''}`}
                  style={{ background:bg, borderColor:border, color:textCol, fontFamily:theme.font }}>
                  {isMatch && '✓ '}{displayOpt}
                  {isMyChoice  && revealed && !isMatch && ' (you)'}
                  {isPartChoice && revealed && !isMatch && ' (them)'}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Custom text answer */}
        <AnimatePresence>
          {showOtherInput && (
            <motion.div initial={{ opacity:0,y:6 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:6 }}
              className="flex gap-2">
              <input type="text" value={customAnswer}
                onChange={e => setCustomAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleHandleCustomAnswer()}
                placeholder="Type your answer..." autoFocus maxLength={80}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-cozy-muted/30 focus:outline-none border border-white/10 transition-all"
                style={{ background:'rgba(0,0,0,0.5)', fontSize:'16px' }} />
              <motion.button whileHover={{ scale:1.06 }} whileTap={{ scale:0.9 }}
                onClick={handleHandleCustomAnswer} disabled={!customAnswer.trim()}
                className="px-4 py-2.5 rounded-xl font-black text-xs cursor-pointer disabled:opacity-40 border-2 flex-shrink-0"
                style={{ background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`, color:'#000', borderColor:'rgba(255,255,255,0.2)', fontFamily:theme.font }}>
                ✓ SET
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result reveal */}
        <AnimatePresence>
          {showResult && ansHost && ansGuest && (
            <motion.div initial={{ opacity:0,scale:0.9 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0 }}
              className="text-center p-3 rounded-2xl border"
              style={{ background:'rgba(0,0,0,0.4)', borderColor:`${theme.accent}30` }}>
              {ansHost === ansGuest ? (
                <div className="space-y-1">
                  <p className="text-2xl">🎉</p>
                  <p className="font-black text-emerald-400 text-sm" style={{ fontFamily:theme.font }}>SAME ANSWER! You matched!</p>
                  <p className="text-[10px] text-cozy-muted font-mono">Both said: "{ansHost}"</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-2xl">💀</p>
                  <p className="font-black text-sm" style={{ fontFamily:theme.font, color:theme.accent }}>{roastMsg}</p>
                  <p className="text-[9px] font-mono text-cozy-muted">
                    {user?.name}: "{isHost ? ansHost : ansGuest}" · {partner?.name}: "{isHost ? ansGuest : ansHost}"
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waiting */}
        {myAns && !partAns && !revealed && (
          <motion.div animate={{ opacity:[0.5,1,0.5] }} transition={{ repeat:Infinity, duration:1.2 }}
            className="text-center text-[10px] font-mono py-2" style={{ color:theme.accent }}>
            Waiting for {partner?.name || 'partner'} to answer... 👀
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// GAME 5: CHAOS TRUTH OR DARE
// Turn flow:
//  1. spinnerUid spins the wheel → result (truth/dare) visible to both
//  2. spinner TYPES the question/dare text → sends it
//  3. recipient sees the card, completes it, types their response / proof
//  4. spinner reviews: APPROVE (done) or RESEND (do it again)
//  5. turns alternate: next round spinner = other player
// ════════════════════════════════════════════════════════════════════════════
const CTD_TRUTH_POOL = [
  "What's the most embarrassing thing you've searched on Google this week?",
  "Reveal your most used emoji and why. Be honest.",
  "What's something you've done that you'd never admit to your parents?",
  "Rate your rizz from 1-10. Then explain the rating.",
  "What's a habit you have that you'd be embarrassed about if this person saw?",
  "What's the pettiest thing you've ever done?",
  "What's your most chaotic 3am thought from this week?",
  "Describe the other person in 3 emojis. Explain each one.",
  "What's the weirdest thing you find attractive in a person?",
  "What's an opinion you have that would start an argument right now?",
  "What would the title of your life's documentary be?",
  "On a scale of 1-10, how much do you actually have your life together?",
  "What's the last lie you told? Even a small one.",
  "What's something you pretend to like but actually hate?",
  "Confess a purchase you made that you immediately regretted.",
  "What's the most embarrassing song on your playlist right now?",
  "Describe your worst personality trait in one sentence. Be honest.",
  "What's a secret talent you've never told this person about?",
  "What do you actually think about when you go quiet for too long?",
  "Who's the last person you subtly stalked on social media? First name only.",
  "What's the funniest thing you've done when no one was watching?",
  "Read out the last voice note you sent. Word for word.",
  "What's a red flag you've ignored in yourself recently?",
  "How long did you last go without checking your phone? Be honest.",
  "What's something you always say you'll do but never actually will?",
];

const CTD_DARE_POOL = [
  "Send your current camera roll photo to this person right now. No filtering.",
  "Talk like a movie villain for the next 2 minutes. In character only.",
  "Send a voice note of you singing your current most-played song. No skipping.",
  "Type only in CAPS for your next 3 messages in this app.",
  "Send a selfie with the weirdest face you can make. No retakes.",
  "Screen record your home screen and send it. Full chaos reveal.",
  "Send the last meme you saved. Absolutely no context given.",
  "Describe a 10-second dance you just did. In detail.",
  "Text someone random in your contacts just the word 'pineapple'. Screenshot proof.",
  "Read your last 3 google searches out loud right now.",
  "Send the oldest photo on your camera roll. No context needed.",
  "Write a dramatic 3-sentence apology to someone you wronged once. Read it aloud.",
  "Do your best impression of the other person for 30 seconds. Describe it.",
  "Send a voice note of you ordering from an imaginary drive-through. Be specific.",
  "Screenshot your battery usage screen and send it. Judged immediately.",
  "Send the notification that's been sitting unread the longest.",
  "Type a message as if you're 70 years old explaining what TikTok is.",
  "Set an embarrassing alarm label and leave it for 24 hours. Screenshot it.",
  "Send your most recent selfie from 2 years ago.",
  "Voice note yourself listing 5 things you're irrationally proud of.",
  "Send your most chaotic WhatsApp status from the last 3 months.",
  "Go to your profile and change your bio to something embarrassing for 10 mins.",
  "Send a screenshot of your notes app. First page only.",
  "Do the most dramatic reading of the last text you sent.",
];

const DARE_TIMER_SECS = 120;

function ChaosTruthOrDare({ user, partner, isHost, gameState, updateGameState, addXP, markXpAwarded }) {
  // ── State from Firestore ──────────────────────────────────────────────────
  const spinnerUid    = gameState.ctdSpinnerUid    ?? null;
  const spinResult    = gameState.ctdSpinResult    ?? null;  // 'truth'|'dare' from spin
  const spinning      = gameState.ctdSpinning      ?? false;
  const card          = gameState.ctdCard          ?? null;  // typed by spinner
  const cardType      = gameState.ctdCardType      ?? null;
  const timerEnd      = gameState.ctdTimerEnd      ?? null;
  const response      = gameState.ctdResponse      ?? null;  // typed by recipient
  const respStatus    = gameState.ctdResponseStatus ?? null; // 'submitted'|'approved'|'resent'
  const round         = gameState.ctdRound         ?? 0;
  const skips         = gameState.ctdSkips         ?? 0;
  const xpDone        = gameState.ctdXpAwarded     === true;
  const customCards   = gameState.ctdCustomCards   ?? [];
  const ROUNDS        = 8;
  const gameOver      = round >= ROUNDS;

  // Who am I in this round?
  const isSpinner     = spinnerUid === user.uid;
  const isRecipient   = spinnerUid !== null && spinnerUid !== user.uid;

  // ── Local state ───────────────────────────────────────────────────────────
  const [wheelAngle,     setWheelAngle]     = useState(0);
  const [timeLeft,       setTimeLeft]       = useState(null);
  const [typedCard,      setTypedCard]      = useState('');
  const [typedResponse,  setTypedResponse]  = useState('');
  const [showAddCard,    setShowAddCard]    = useState(false);
  const [customCardText, setCustomCardText] = useState('');
  const [customCardType, setCustomCardType] = useState('truth');
  const [customCardError,setCustomCardError]= useState('');
  const [showCustomPool, setShowCustomPool] = useState(false);

  // ── Initialise spinner for first round (host goes first) ─────────────────
  useEffect(() => {
    if (spinnerUid !== null || !isHost) return;
    updateGameState({ ctdSpinnerUid: user.uid });
  }, [spinnerUid, isHost]);

  // ── Dare countdown timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (!timerEnd) { setTimeLeft(null); return; }
    const tick = () => setTimeLeft(Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [timerEnd]);

  // ── XP on game over ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameOver || xpDone) return;
    const run = async () => { await addXP(120); await markXpAwarded('ctdXpAwarded'); };
    run();
  }, [gameOver, xpDone]);

  // ── SPIN ─────────────────────────────────────────────────────────────────
  const handleSpin = async () => {
    if (!isSpinner || spinning || spinResult) return;
    const spins  = 5 + Math.floor(Math.random() * 6);
    const extra  = Math.floor(Math.random() * 360);
    setWheelAngle(prev => prev + spins * 360 + extra);
    playWheelSpin();
    await updateGameState({ ctdSpinning: true });
    setTimeout(async () => {
      const result = extra < 180 ? 'truth' : 'dare';
      if (result === 'truth') playTruthLand(); else playDareLand();
      await updateGameState({ ctdSpinning: false, ctdSpinResult: result });
    }, 2500);
  };

  // ── SPINNER sends the card text ───────────────────────────────────────────
  const handleSendCard = async () => {
    if (!typedCard.trim() || !spinResult) return;
    const isDare = spinResult === 'dare';
    await updateGameState({
      ctdCard:    typedCard.trim(),
      ctdCardType: spinResult,
      ctdTimerEnd: isDare ? Date.now() + DARE_TIMER_SECS * 1000 : null,
    });
    setTypedCard('');
  };

  // ── RECIPIENT submits their response / proof ──────────────────────────────
  const handleSubmitResponse = async () => {
    if (!typedResponse.trim()) return;
    await updateGameState({ ctdResponse: typedResponse.trim(), ctdResponseStatus: 'submitted' });
    setTypedResponse('');
  };

  // ── SPINNER approves ──────────────────────────────────────────────────────
  const handleApprove = async () => {
    playApproved();
    // Advance round, swap spinner
    const nextSpinner = spinnerUid === user.uid ? (partner?.uid ?? null) : user.uid;
    await updateGameState({
      ctdRound:        round + 1,
      ctdSpinnerUid:   nextSpinner,
      ctdSpinResult:   null,
      ctdCard:         null,
      ctdCardType:     null,
      ctdTimerEnd:     null,
      ctdResponse:     null,
      ctdResponseStatus: null,
    });
  };

  // ── SPINNER resends (tells recipient to redo) ─────────────────────────────
  const handleResend = async () => {
    playResend();
    await updateGameState({ ctdResponse: null, ctdResponseStatus: 'resent' });
  };

  // ── Custom card handlers ──────────────────────────────────────────────────
  const handleAddCustomCard = async () => {
    if (!customCardText.trim()) { setCustomCardError('Write the card first!'); return; }
    const pool = [...customCards, { text: customCardText.trim(), type: customCardType }];
    await updateGameState({ ctdCustomCards: pool });
    setCustomCardText(''); setCustomCardError(''); setShowAddCard(false);
  };

  const handlePlayCustomCard = async (c) => {
    const isDare = c.type === 'dare';
    await updateGameState({
      ctdSpinResult: c.type,
      ctdCard:       c.text,
      ctdCardType:   c.type,
      ctdTimerEnd:   isDare ? Date.now() + DARE_TIMER_SECS * 1000 : null,
    });
    setShowCustomPool(false);
  };

  const theme     = GAME_THEMES.ctd;
  const timerPct  = timerEnd ? Math.max(0, ((timerEnd - Date.now()) / (DARE_TIMER_SECS * 1000)) * 100) : 100;

  // ── Phase labels ──────────────────────────────────────────────────────────
  const getPhaseLabel = () => {
    if (!spinnerUid)             return '⏳ Initialising...';
    if (!spinResult && !spinning) return isSpinner ? '🎡 Your turn to spin!' : `⏳ Waiting for ${partner?.name || 'partner'} to spin`;
    if (spinning)                return '🎡 Spinning...';
    if (spinResult && !card)     return isSpinner ? `Got ${spinResult.toUpperCase()}! Now type your ${spinResult} for them` : `${partner?.name || 'Partner'} got ${spinResult?.toUpperCase()}! Waiting for their question...`;
    if (card && !response)       return isRecipient ? `Your ${cardType?.toUpperCase()}! Complete it and submit proof` : `Waiting for ${partner?.name || 'partner'} to complete the ${cardType}`;
    if (response && respStatus === 'submitted') return isSpinner ? 'Review their response — approve or resend' : 'Submitted! Waiting for review...';
    if (respStatus === 'resent') return isRecipient ? '🔄 Resent! Try again and resubmit' : 'Waiting for them to redo it...';
    return '';
  };

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="flex items-center justify-between p-3 rounded-2xl border"
        style={{ background:`${theme.accent}10`, borderColor:`${theme.accent}30` }}>
        <div className="text-center">
          <p className="text-[8px] font-mono text-cozy-muted uppercase">Round</p>
          <p className="font-black text-lg text-white" style={{ fontFamily:theme.font }}>{round}/{ROUNDS}</p>
        </div>
        <div className="text-center">
          <p className="text-[8px] font-mono text-cozy-muted uppercase">Turn</p>
          <p className="text-xs font-bold text-white truncate max-w-[80px]">
            {spinnerUid === user.uid ? '🎡 You spin' : `🎡 ${partner?.name || 'Partner'}`}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[8px] font-mono text-cozy-muted uppercase">Skips</p>
          <p className="font-black text-lg" style={{ fontFamily:theme.font, color: skips > 2 ? '#FF6B97' : '#fff' }}>
            {skips}{skips > 2 ? ' 💀' : ''}
          </p>
        </div>
      </div>

      <div className="relative rounded-3xl border overflow-hidden p-4 space-y-4"
        style={{ background:theme.cardBg, borderColor:theme.border, boxShadow:`0 0 50px ${theme.accent}20` }}>

        {/* Retro grid bg */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage:`linear-gradient(${theme.accent}40 1px,transparent 1px),linear-gradient(90deg,${theme.accent}40 1px,transparent 1px)`, backgroundSize:'28px 28px' }} />

        {/* GAME OVER */}
        <AnimatePresence>
          {gameOver && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="absolute inset-0 z-40 flex items-center justify-center rounded-3xl"
              style={{ background:'rgba(0,0,0,0.92)', backdropFilter:'blur(16px)' }}>
              <div className="text-center space-y-4 px-5">
                <div className="text-5xl">🎪</div>
                <h3 className="text-2xl font-black text-white" style={{ fontFamily:theme.font }}>CHAOS COMPLETE!</h3>
                <p className="text-sm text-cozy-muted">{ROUNDS} rounds done · {skips} skips used</p>
                {skips > 2 && <p className="text-xs text-accent-pink font-mono">Skipped too much... coward 💀</p>}
                <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.3, type:'spring' }}
                  className="text-3xl font-black py-2" style={{ color:theme.accent, fontFamily:theme.font }}>
                  +120 XP EARNED
                </motion.div>
                <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                  onClick={() => updateGameState({
                    ctdRound:0, ctdSpinnerUid:null, ctdSpinResult:null, ctdCard:null,
                    ctdCardType:null, ctdTimerEnd:null, ctdResponse:null, ctdResponseStatus:null,
                    ctdSkips:0, ctdXpAwarded:false
                  })}
                  className="px-7 py-3 rounded-2xl font-black text-sm cursor-pointer border-2 flex items-center gap-2 mx-auto"
                  style={{ background:theme.accent, color:'#000', fontFamily:theme.font }}>
                  <RefreshCcw className="w-4 h-4" /> GO AGAIN
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase label */}
        <div className="relative z-10">
          <motion.div key={getPhaseLabel()}
            initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}
            className="text-center text-xs font-bold py-2 px-3 rounded-xl border"
            style={{ background:`${theme.accent}15`, borderColor:`${theme.accent}30`, color:theme.accent, fontFamily:theme.font }}>
            {getPhaseLabel()}
          </motion.div>
        </div>

        {/* ── PHASE 1: SPIN WHEEL ─────────────────────────────────────────── */}
        {!spinResult && !gameOver && (
          <div className="flex flex-col items-center space-y-4 relative z-10 py-2">
            {/* Wheel */}
            <div className="relative w-40 h-40">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 text-xl">▼</div>
              <motion.div
                animate={{ rotate: wheelAngle }}
                transition={{ duration:2.5, ease:[0.17,0.67,0.35,1.0] }}
                className="w-full h-full rounded-full border-4 relative overflow-hidden"
                style={{ borderColor:theme.border, cursor: isSpinner && !spinning && !spinResult ? 'pointer' : 'default' }}
                onClick={isSpinner && !spinning && !spinResult ? handleSpin : undefined}
              >
                <div className="absolute inset-0" style={{ clipPath:'polygon(50% 50%,0% 0%,100% 0%)', background:theme.accent, opacity:0.9 }}>
                  <span className="absolute top-7 left-1/2 -translate-x-1/2 text-[10px] font-black text-black" style={{ fontFamily:theme.font }}>TRUTH</span>
                </div>
                <div className="absolute inset-0" style={{ clipPath:'polygon(50% 50%,0% 100%,100% 100%)', background:theme.accent2, opacity:0.9 }}>
                  <span className="absolute bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-black text-black" style={{ fontFamily:theme.font }}>DARE</span>
                </div>
                <div className="absolute inset-0" style={{ clipPath:'polygon(50% 50%,0% 0%,0% 100%)', background:theme.accent, opacity:0.6 }} />
                <div className="absolute inset-0" style={{ clipPath:'polygon(50% 50%,100% 0%,100% 100%)', background:theme.accent2, opacity:0.6 }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
                    {spinning ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : '🎯'}
                  </div>
                </div>
              </motion.div>
            </div>

            {isSpinner ? (
              <div className="space-y-3 w-full">
                <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.9 }}
                  onClick={handleSpin} disabled={spinning || !!spinResult || gameOver}
                  className="w-full px-6 py-3 rounded-2xl font-black text-sm cursor-pointer border-2 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`, color:'#fff', borderColor:theme.border, fontFamily:theme.font }}>
                  {spinning ? <><Loader2 className="w-4 h-4 animate-spin" /> SPINNING...</> : '🎡 SPIN THE WHEEL'}
                </motion.button>

                {/* Custom card options */}
                <div className="flex gap-2 flex-wrap justify-center">
                  <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                    onClick={() => { setShowAddCard(p=>!p); setShowCustomPool(false); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[9px] font-mono font-bold uppercase cursor-pointer transition-all"
                    style={{ background:showAddCard?`${theme.accent}20`:'rgba(255,255,255,0.04)', borderColor:showAddCard?theme.accent:'rgba(255,255,255,0.10)', color:showAddCard?theme.accent:'#9E97B8' }}>
                    ✏️ {showAddCard ? 'Cancel' : 'Add Card'}
                  </motion.button>
                  {customCards.length > 0 && (
                    <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                      onClick={() => { setShowCustomPool(p=>!p); setShowAddCard(false); }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[9px] font-mono font-bold uppercase cursor-pointer transition-all"
                      style={{ background:showCustomPool?`${theme.accent2}20`:'rgba(255,255,255,0.04)', borderColor:showCustomPool?theme.accent2:'rgba(255,255,255,0.10)', color:showCustomPool?theme.accent2:'#9E97B8' }}>
                      📋 Cards ({customCards.length})
                    </motion.button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-cozy-muted font-light text-center">
                {partner?.name || 'Host'} will spin for you both 🎪
              </p>
            )}
          </div>
        )}

        {/* ── PHASE 2: SPINNER TYPES THE CARD ────────────────────────────── */}
        {spinResult && !card && !gameOver && (
          <div className="space-y-4 relative z-10">
            <div className="flex justify-center">
              <motion.div animate={{ scale:[1,1.05,1] }} transition={{ repeat:Infinity, duration:1.5 }}
                className="px-5 py-2 rounded-2xl font-black text-sm border-2"
                style={{
                  background:   spinResult === 'dare' ? `linear-gradient(135deg,${theme.accent},${theme.accent2})` : `${theme.accent}30`,
                  borderColor:  theme.accent,
                  color:        spinResult === 'dare' ? '#fff' : theme.accent,
                  fontFamily:   theme.font,
                }}>
                {spinResult === 'truth' ? '🤍 TRUTH' : '🔥 DARE'} — {spinResult.toUpperCase()} CARD LANDED!
              </motion.div>
            </div>

            {isSpinner ? (
              <div className="space-y-3">
                <p className="text-[10px] text-cozy-muted font-light text-center">
                  Type the {spinResult} you want to give to {partner?.name || 'partner'} (or pick a suggestion below)
                </p>
                <textarea value={typedCard} onChange={e => setTypedCard(e.target.value)}
                  placeholder={spinResult === 'truth'
                    ? "e.g. What's your biggest regret this year?"
                    : "e.g. Send your most embarrassing selfie right now"}
                  rows={3} maxLength={200}
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-cozy-muted/30 focus:outline-none border border-white/10 transition-all resize-none"
                  style={{ background:'rgba(0,0,0,0.5)', fontSize:'16px' }} />
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  onClick={handleSendCard} disabled={!typedCard.trim()}
                  className="w-full py-3 rounded-2xl font-black text-sm cursor-pointer disabled:opacity-40 border-2 flex items-center justify-center gap-2"
                  style={{ background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`, color:'#fff', borderColor:'rgba(255,255,255,0.2)', fontFamily:theme.font }}>
                  🚀 SEND {spinResult.toUpperCase()} TO THEM
                </motion.button>

                {/* Quick suggestions */}
                <div className="space-y-1.5">
                  <p className="text-[8px] font-mono text-cozy-muted uppercase tracking-widest">Quick suggestions (tap to use):</p>
                  <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                    {(spinResult === 'truth' ? CTD_TRUTH_POOL : CTD_DARE_POOL).slice(0,5).map((s,i) => (
                      <motion.button key={i} whileHover={{ x:3 }} whileTap={{ scale:0.98 }}
                        onClick={() => setTypedCard(s)}
                        className="text-left px-3 py-2 rounded-xl border border-white/5 text-[10px] text-cozy-muted hover:text-white hover:border-white/15 transition-all cursor-pointer"
                        style={{ background:'rgba(255,255,255,0.03)' }}>
                        {s}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <motion.div animate={{ opacity:[1,0.4,1] }} transition={{ repeat:Infinity, duration:1.5 }}
                  className="text-4xl">⌛</motion.div>
                <p className="text-sm font-bold text-white" style={{ fontFamily:theme.font }}>
                  {partner?.name || 'Partner'} is writing your {spinResult}...
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── PHASE 3: RECIPIENT COMPLETES THE CARD ──────────────────────── */}
        {card && !response && !gameOver && (
          <div className="space-y-4 relative z-10">
            {/* Card display */}
            <div className="flex justify-center">
              <span className="px-4 py-1.5 rounded-2xl font-black text-xs border-2"
                style={{ background:cardType==='dare'?`${theme.accent}30`:`${theme.accent2}30`, borderColor:cardType==='dare'?theme.accent:theme.accent2, color:cardType==='dare'?theme.accent:theme.accent2, fontFamily:theme.font }}>
                {cardType === 'dare' ? '🔥 DARE' : '🤍 TRUTH'}
              </span>
            </div>
            <div className="p-4 rounded-2xl border text-center"
              style={{ background:'rgba(0,0,0,0.5)', borderColor:`${theme.accent}30` }}>
              <p className="text-sm md:text-base font-bold text-white leading-relaxed" style={{ fontFamily:theme.font }}>
                {card}
              </p>
            </div>

            {/* Dare timer */}
            {cardType === 'dare' && timerEnd && (
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono">
                  <span style={{ color:theme.accent }}>⏱️ TIME REMAINING</span>
                  <span className="font-black text-white">{timeLeft}s</span>
                </div>
                <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width:`${timerPct}%`,
                      background: timerPct > 50 ? `linear-gradient(90deg,${theme.accent},${theme.accent2})`
                        : timerPct > 25 ? 'linear-gradient(90deg,#FB923C,#FF6B97)'
                        : 'linear-gradient(90deg,#FF0000,#FF6B97)' }} />
                </div>
                {timeLeft === 0 && (
                  <motion.p animate={{ opacity:[1,0.5,1] }} transition={{ repeat:Infinity, duration:0.4 }}
                    className="text-center text-accent-pink font-black text-sm" style={{ fontFamily:theme.font }}>
                    ⏰ TIME IS UP!
                  </motion.p>
                )}
              </div>
            )}

            {isRecipient ? (
              <div className="space-y-3">
                <p className="text-[10px] text-cozy-muted text-center">
                  {cardType === 'dare' ? 'Complete the dare and describe what you did / submit proof text below' : 'Type your honest answer below'}
                </p>
                {respStatus === 'resent' && (
                  <p className="text-[10px] text-accent-pink font-mono text-center animate-pulse">
                    🔄 Resent! {partner?.name || 'Partner'} wasn't satisfied — try again!
                  </p>
                )}
                <textarea value={typedResponse} onChange={e => setTypedResponse(e.target.value)}
                  placeholder={cardType === 'dare' ? "Describe what you did / your proof..." : "Type your honest answer..."}
                  rows={3} maxLength={300}
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-cozy-muted/30 focus:outline-none border border-white/10 transition-all resize-none"
                  style={{ background:'rgba(0,0,0,0.5)', fontSize:'16px' }} />
                <div className="flex gap-2">
                  <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                    onClick={handleSubmitResponse} disabled={!typedResponse.trim()}
                    className="flex-1 py-2.5 rounded-xl font-black text-xs cursor-pointer disabled:opacity-40 border-2 flex items-center justify-center gap-1.5"
                    style={{ background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`, color:'#fff', borderColor:'rgba(255,255,255,0.2)', fontFamily:theme.font }}>
                    ✅ SUBMIT RESPONSE
                  </motion.button>
                  <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                    onClick={() => updateGameState({ ctdResponse: null, ctdCard: null, ctdCardType: null, ctdTimerEnd: null, ctdSpinResult: null, ctdSkips: skips + 1 })}
                    className="px-3 py-2.5 rounded-xl font-black text-xs cursor-pointer border-2 flex items-center justify-center"
                    style={{ background:'rgba(239,68,68,0.1)', borderColor:'rgba(239,68,68,0.3)', color:'#f87171', fontFamily:theme.font }}>
                    ⏭️ Skip
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <motion.div animate={{ opacity:[1,0.4,1] }} transition={{ repeat:Infinity, duration:1.5 }}
                  className="text-4xl">⌛</motion.div>
                <p className="text-sm font-bold text-white" style={{ fontFamily:theme.font }}>
                  Waiting for {partner?.name || 'partner'} to complete the {cardType}...
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── PHASE 4: SPINNER REVIEWS RESPONSE ──────────────────────────── */}
        {response && respStatus === 'submitted' && !gameOver && (
          <div className="space-y-4 relative z-10">
            <div className="p-4 rounded-2xl border" style={{ background:'rgba(0,0,0,0.5)', borderColor:`${theme.accent}30` }}>
              <p className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color:theme.accent }}>
                {isSpinner ? `${partner?.name || 'Partner'}'s Response:` : 'Your submitted response:'}
              </p>
              <p className="text-sm text-white font-light leading-relaxed">{response}</p>
            </div>

            {isSpinner ? (
              <div className="flex gap-3">
                <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                  onClick={handleApprove}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm cursor-pointer border-2"
                  style={{ background:'rgba(52,211,153,0.2)', borderColor:'#34D399', color:'#34D399', fontFamily:theme.font }}>
                  ✅ APPROVED! Next round
                </motion.button>
                <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                  onClick={handleResend}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm cursor-pointer border-2"
                  style={{ background:'rgba(251,146,60,0.15)', borderColor:'#FB923C', color:'#FB923C', fontFamily:theme.font }}>
                  🔄 RESEND (not good enough)
                </motion.button>
              </div>
            ) : (
              <div className="text-center py-2">
                <motion.p animate={{ opacity:[0.5,1,0.5] }} transition={{ repeat:Infinity, duration:1.5 }}
                  className="text-sm font-bold text-white" style={{ fontFamily:theme.font }}>
                  ⏳ {partner?.name || 'Partner'} is reviewing your response...
                </motion.p>
              </div>
            )}
          </div>
        )}

        {/* ── ADD CUSTOM CARD (when on spin phase) ──────────────────────── */}
        <AnimatePresence>
          {showAddCard && !spinResult && !gameOver && (
            <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }}
              exit={{ opacity:0,height:0 }} className="overflow-hidden relative z-10">
              <div className="space-y-3 p-4 rounded-2xl border border-white/10" style={{ background:'rgba(0,0,0,0.5)' }}>
                <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color:theme.accent }}>
                  ✏️ Write a Custom Card — both players can add
                </p>
                <div className="flex gap-2">
                  {['truth','dare'].map(t => (
                    <button key={t} onClick={() => setCustomCardType(t)}
                      className="flex-1 py-2 rounded-xl text-xs font-black uppercase border-2 cursor-pointer transition-all"
                      style={{
                        background: customCardType===t ? (t==='dare'?`${theme.accent}30`:`${theme.accent2}30`) : 'rgba(255,255,255,0.04)',
                        borderColor: customCardType===t ? (t==='dare'?theme.accent:theme.accent2) : 'rgba(255,255,255,0.10)',
                        color:       customCardType===t ? (t==='dare'?theme.accent:theme.accent2) : '#9E97B8',
                        fontFamily:  theme.font,
                      }}>
                      {t==='truth' ? '🤍 TRUTH' : '🔥 DARE'}
                    </button>
                  ))}
                </div>
                <textarea value={customCardText}
                  onChange={e => { setCustomCardText(e.target.value); setCustomCardError(''); }}
                  placeholder={customCardType==='truth' ? "e.g. What's something you've never admitted to me?" : "e.g. Send your most embarrassing selfie right now"}
                  rows={3} maxLength={200}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-cozy-muted/30 focus:outline-none border border-white/10 transition-all resize-none"
                  style={{ background:'rgba(0,0,0,0.4)', fontSize:'16px' }} />
                {customCardError && <p className="text-[9px] text-red-400 font-mono">{customCardError}</p>}
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} onClick={handleAddCustomCard}
                  className="w-full py-2 rounded-xl font-black text-xs cursor-pointer border-2 flex items-center justify-center gap-1.5"
                  style={{ background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`, color:'#000', borderColor:'rgba(255,255,255,0.2)', fontFamily:theme.font }}>
                  ✅ Save to Card Pool
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom card pool browser */}
        <AnimatePresence>
          {showCustomPool && customCards.length > 0 && !spinResult && !gameOver && (
            <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }}
              exit={{ opacity:0,height:0 }} className="overflow-hidden relative z-10">
              <div className="space-y-2 p-3 rounded-2xl border border-white/10 max-h-48 overflow-y-auto"
                style={{ background:'rgba(0,0,0,0.4)' }}>
                <p className="text-[8px] font-mono uppercase tracking-widest text-cozy-muted">Tap to play immediately (bypasses spin)</p>
                {customCards.map((c,i) => (
                  <motion.button key={i} whileHover={{ scale:1.02,x:3 }} whileTap={{ scale:0.98 }}
                    onClick={() => handlePlayCustomCard(c)}
                    className="w-full text-left p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2"
                    style={{ background:'rgba(255,255,255,0.04)', borderColor:c.type==='dare'?`${theme.accent}40`:`${theme.accent2}40` }}>
                    <span className="text-base flex-shrink-0">{c.type==='dare'?'🔥':'🤍'}</span>
                    <p className="text-[10px] text-white font-light leading-snug line-clamp-2">{c.text}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// GAME 6: HOT TAKES BATTLE
// Both players secretly vote Agree / Disagree on spicy statements.
// Reveal together — match = point, no match = instant debate!
// 10 rounds. Funny roasts on mismatches. Debate prompt if you disagree.
// ════════════════════════════════════════════════════════════════════════════
const HOT_TAKES = [
  { statement:"Pineapple absolutely belongs on pizza",                debate:"Defend your position. You have 30 seconds." },
  { statement:"Cereal should always go before the milk",             debate:"This is a hill you will die on. Explain." },
  { statement:"Replying 'K' to a message is passive aggressive",     debate:"Context matters. Or does it?" },
  { statement:"Silent treatment is a valid strategy in an argument", debate:"Is it or is it emotional manipulation?" },
  { statement:"Breakfast food can be eaten at any time of day",      debate:"Breakfast is a mood, not a schedule." },
  { statement:"Being 10 minutes late is basically on time",          debate:"Time is flexible. Disagree? You're wrong." },
  { statement:"Skipping ads on YouTube is morally acceptable",       debate:"Creator economy vs your time. Go." },
  { statement:"Talking on the phone is better than texting",         debate:"One of you is an introvert. Prove me wrong." },
  { statement:"Horror movies are not actually scary",                debate:"Jump scares vs psychological terror. Argue." },
  { statement:"Napping is a superpower, not laziness",               debate:"Society hates rest. Or are you just tired?" },
  { statement:"The movie is almost always better than the book",     debate:"You said what you said. Now defend it." },
  { statement:"Spoilers don't actually ruin anything",               debate:"Plot isn't the point. Or is it everything?" },
  { statement:"Coffee is overrated and people are addicted to the aesthetic", debate:"Be honest. Is it the taste or the personality?" },
  { statement:"Ghosts definitely exist",                             debate:"Science vs vibes. Pick your side." },
  { statement:"Sleeping with the fan on is non-negotiable",          debate:"White noise supremacy or it's just cold." },
  { statement:"Confronting problems immediately is always better than waiting", debate:"Strike while hot or wait to calm down?" },
  { statement:"Crying at movies makes you more emotionally intelligent", debate:"Empathy or just easily manipulated?" },
  { statement:"Scrolling social media before bed is harmless",       debate:"Sleep science vs doom scrolling habits." },
  { statement:"Dogs are better pets than cats",                      debate:"Loyal chaos vs elegant indifference. Choose." },
  { statement:"Online friendships are just as real as in-person ones", debate:"Distance is irrelevant. Or is it?" },
  { statement:"Working from home is objectively better than going to an office", debate:"Commute bad, but human interaction good?" },
  { statement:"A messy room means a creative mind",                  debate:"Chaos is a valid organisation system." },
  { statement:"You can tell a lot about someone from their music taste", debate:"Personality test or gatekeeping?" },
  { statement:"The best part of a road trip is the journey, not the destination", debate:"Romantic notion or just bad at planning?" },
  { statement:"Introversion is a superpower in a world that never shuts up", debate:"Quiet confidence vs just being shy?" },
  { statement:"Your zodiac sign says nothing meaningful about you",  debate:"Personality types are just patterns. Or not." },
  { statement:"Eating alone at a restaurant is actually relaxing",   debate:"Confidence or just avoiding people?" },
  { statement:"Comfort rewatching shows is peak mental health",      debate:"Safety or avoiding new experiences?" },
  { statement:"Making your bed every morning is pointless",          debate:"Discipline or just performative tidiness?" },
  { statement:"The first person to apologise after an argument is the stronger one", debate:"Who blinks first and why?" },
];

const HT_AGREE_GIFS  = ["HARD AGREE 🔥","FACTS ONLY 💯","FINALLY SOMEONE SAID IT 😤","THIS IS THE TRUTH 👆","I SAID WHAT I SAID 💅"];
const HT_DISAGREE_GIFS = ["ABSOLUTELY NOT 💀","WRONG AND YOU KNOW IT 😭","HOW DARE YOU 😤","THIS IS A WAR CRIME 🚨","RATIO + L + BOZO 💀"];
const HT_MATCH_MSGS  = ["SAME BRAIN! 🧠💥","HIVEMIND ACTIVATED ✨","TOTALLY SYNCED 🔗","YOU TWO ARE THE SAME 😭","ONE BRAIN CELL SHARED 🤝"];
const HT_CLASH_MSGS  = ["DEBATE TIME 🔥","IRRECONCILABLE DIFFERENCES 💀","THIS FRIENDSHIP IS TESTED 😤","CHAOS. PURE CHAOS. 🌪️","Y'ALL NEED TO TALK 💬"];

const HT_ROUNDS = 10;

function HotTakesBattle({ user, partner, isHost, gameState, updateGameState, addXP, markXpAwarded }) {
  const round     = gameState.htRound     ?? 0;
  const voteHost  = gameState.htVoteHost  ?? null;   // 'agree'|'disagree'
  const voteGuest = gameState.htVoteGuest ?? null;
  const revealed  = gameState.htRevealed  ?? false;
  const hostScore = gameState.htHostScore ?? 0;
  const guestScore= gameState.htGuestScore?? 0;
  const xpDone    = gameState.htXpAwarded === true;
  const shuffled  = gameState.htShuffled  ?? [];
  const gameNum   = gameState.htGameNum   ?? 0;
  const gameOver  = round >= HT_ROUNDS;

  const myVote    = isHost ? voteHost  : voteGuest;
  const partVote  = isHost ? voteGuest : voteHost;
  const myScore   = isHost ? hostScore  : guestScore;
  const partScore = isHost ? guestScore : hostScore;

  const curIdx    = shuffled[round] ?? (round % HOT_TAKES.length);
  const take      = HOT_TAKES[curIdx % HOT_TAKES.length];

  const [showReveal, setShowReveal] = useState(false);
  const [matchMsg,   setMatchMsg]   = useState('');
  const [clashMsg,   setClashMsg]   = useState('');

  // Host shuffles on init / new game
  useEffect(() => {
    if (!isHost) return;
    if (shuffled.length === HT_ROUNDS && round > 0) return;
    if (shuffled.length === 0) {
      const arr = Array.from({length:HOT_TAKES.length},(_,i)=>i);
      for (let i=arr.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]; }
      updateGameState({ htShuffled: arr.slice(0,HT_ROUNDS) });
    }
  }, [gameNum, isHost]);

  useEffect(() => { setShowReveal(false); setMatchMsg(''); setClashMsg(''); }, [round]);

  // Both voted → reveal
  useEffect(() => {
    if (!voteHost || !voteGuest || revealed) return;
    updateGameState({ htRevealed: true });
  }, [voteHost, voteGuest]);

  // Revealed → show 4s then advance
  useEffect(() => {
    if (!revealed || !voteHost || !voteGuest) return;
    const match = voteHost === voteGuest;
    setShowReveal(true);
    if (match) playMatch(); else playClash();
    setMatchMsg(match
      ? HT_MATCH_MSGS[Math.floor(Math.random()*HT_MATCH_MSGS.length)]
      : HT_CLASH_MSGS[Math.floor(Math.random()*HT_CLASH_MSGS.length)]);
    setClashMsg(match ? '' : take.debate);
    const t = setTimeout(async () => {
      await updateGameState({
        htRound: round+1, htVoteHost:null, htVoteGuest:null, htRevealed:false,
        htHostScore:  hostScore  + (match?1:0),
        htGuestScore: guestScore + (match?1:0),
      });
      setShowReveal(false);
    }, match ? 3000 : 5000);
    return () => clearTimeout(t);
  }, [revealed]);

  // XP
  useEffect(() => {
    if (!gameOver || xpDone) return;
    const run = async () => {
      await addXP(Math.max(hostScore,guestScore) >= 7 ? 180 : Math.max(hostScore,guestScore) >= 5 ? 120 : 70);
      await markXpAwarded('htXpAwarded');
    };
    run();
  }, [gameOver, xpDone]);

  const handleVote = async (vote) => {
    if (myVote || revealed) return;
    if (vote==='agree') playAgree(); else playDisagree();
    await updateGameState(isHost ? { htVoteHost:vote } : { htVoteGuest:vote });
  };

  const handlePlayAgain = async () => {
    const arr = Array.from({length:HOT_TAKES.length},(_,i)=>i);
    for (let i=arr.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]; }
    await updateGameState({
      htRound:0, htVoteHost:null, htVoteGuest:null, htRevealed:false,
      htHostScore:0, htGuestScore:0, htXpAwarded:false,
      htShuffled:arr.slice(0,HT_ROUNDS), htGameNum:gameNum+1,
    });
  };

  const theme = GAME_THEMES.ht;
  const matchCount = Math.max(hostScore, guestScore);

  // ── Full result screen ──────────────────────────────────────────────────
  if (gameOver) {
    const syncPct  = Math.round((matchCount/HT_ROUNDS)*100);
    const syncMsg  = syncPct >= 80 ? {label:"HIVEMIND 🧠", color:"#8B5CF6", sub:"You basically share one brain"}
                   : syncPct >= 60 ? {label:"MOSTLY ALIGNED ✨", color:"#34D399", sub:"Minor differences, major compatibility"}
                   : syncPct >= 40 ? {label:"CHAOTIC DUO 🔥", color:"#FCD34D", sub:"Opposites that make it work"}
                   : {label:"UNHINGED PAIR 💀", color:"#FF6B97", sub:"How are you two still friends"};
    return (
      <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }}
        transition={{ duration:0.4 }}
        className="rounded-3xl border overflow-hidden relative"
        style={{ background:theme.cardBg, borderColor:`${syncMsg.color}40`, boxShadow:`0 0 60px ${syncMsg.color}25` }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({length:22}).map((_,i)=>(
            <motion.div key={i} initial={{ x:'50%',y:'100%',scale:0,opacity:1 }}
              animate={{ x:`${5+Math.random()*90}%`,y:`${Math.random()*80}%`,scale:1,opacity:0 }}
              transition={{ duration:1.2,delay:i*0.04 }}
              className="absolute w-3 h-3 rounded-full"
              style={{ background:[theme.accent,theme.accent2,'#fff','#FCD34D'][i%4] }} />
          ))}
        </div>
        <div className="relative z-10 p-6 md:p-8 flex flex-col items-center text-center gap-5">
          <motion.div initial={{ scale:0,rotate:-20 }} animate={{ scale:1,rotate:0 }}
            transition={{ type:'spring',stiffness:200,delay:0.15 }} className="text-7xl">🔥</motion.div>
          <div className="flex items-center gap-4 w-full max-w-xs">
            <div className="flex-1 rounded-2xl p-3 text-center border" style={{ background:`${theme.accent}15`,borderColor:`${theme.accent}30` }}>
              <p className="text-[8px] font-mono text-cozy-muted uppercase mb-1">You</p>
              <p className="text-2xl font-black text-white" style={{ fontFamily:theme.font }}>{myScore}</p>
              <p className="text-[9px] text-white/60 truncate">{user?.name}</p>
            </div>
            <div className="text-center flex-shrink-0">
              <p className="text-[8px] font-mono text-cozy-muted uppercase">Matched</p>
              <p className="text-lg font-black" style={{ color:syncMsg.color,fontFamily:theme.font }}>{matchCount}/{HT_ROUNDS}</p>
            </div>
            <div className="flex-1 rounded-2xl p-3 text-center border" style={{ background:`${theme.accent2}15`,borderColor:`${theme.accent2}30` }}>
              <p className="text-[8px] font-mono text-cozy-muted uppercase mb-1">Partner</p>
              <p className="text-2xl font-black text-white" style={{ fontFamily:theme.font }}>{partScore}</p>
              <p className="text-[9px] text-white/60 truncate">{partner?.name}</p>
            </div>
          </div>
          <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring',delay:0.3 }}>
            <p className="text-[10px] font-mono uppercase tracking-widest text-cozy-muted mb-1">Opinion Sync</p>
            <p className="text-7xl font-black leading-none"
              style={{ fontFamily:theme.font,color:syncMsg.color,textShadow:`0 0 40px ${syncMsg.color}60` }}>
              {syncPct}%
            </p>
          </motion.div>
          <motion.div initial={{ y:16,opacity:0 }} animate={{ y:0,opacity:1 }} transition={{ delay:0.45 }} className="space-y-1">
            <h3 className="text-2xl font-black text-white" style={{ fontFamily:theme.font }}>{syncMsg.label}</h3>
            <p className="text-sm text-cozy-muted italic">"{syncMsg.sub}"</p>
          </motion.div>
          {xpDone && (
            <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.6,type:'spring' }}
              className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold"
              style={{ background:`${syncMsg.color}20`,borderColor:`${syncMsg.color}40`,color:syncMsg.color }}>
              <Zap className="w-4 h-4" /> +{matchCount>=7?180:matchCount>=5?120:70} XP Saved!
            </motion.div>
          )}
          <motion.button initial={{ y:16,opacity:0 }} animate={{ y:0,opacity:1 }} transition={{ delay:0.7 }}
            whileHover={{ scale:1.05,boxShadow:`0 0 30px ${theme.accent}50` }} whileTap={{ scale:0.96 }}
            onClick={handlePlayAgain}
            className="px-8 py-4 rounded-2xl font-black text-base cursor-pointer border-2 flex items-center gap-3"
            style={{ background:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,color:'#fff',fontFamily:theme.font,borderColor:'rgba(255,255,255,0.25)' }}>
            <RefreshCcw className="w-5 h-5" /> PLAY AGAIN
          </motion.button>
          <p className="text-[9px] font-mono text-cozy-muted/50">New 10 hot takes shuffled fresh</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Score */}
      <div className="flex items-center gap-2 p-3 rounded-2xl border" style={{ background:`${theme.accent}10`,borderColor:`${theme.accent}30` }}>
        <div className="flex-1 text-center px-2 py-1.5 rounded-xl" style={{ background:`${theme.accent}15` }}>
          <p className="text-[8px] font-mono text-cozy-muted uppercase">You</p>
          <p className="font-black text-xl text-white" style={{ fontFamily:theme.font }}>{myScore}</p>
          <p className="text-[8px] text-white/60 truncate">{user?.name}</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <span className="text-[7px] font-mono text-cozy-muted uppercase">SYNCED</span>
          <span className="font-black text-xs text-white">/{HT_ROUNDS}</span>
          <span className="text-[7px] font-mono px-1.5 py-0.5 rounded-full" style={{ background:`${theme.accent}20`,color:theme.accent }}>
            {round+1}/{HT_ROUNDS}
          </span>
        </div>
        <div className="flex-1 text-center px-2 py-1.5 rounded-xl" style={{ background:`${theme.accent2}15` }}>
          <p className="text-[8px] font-mono text-cozy-muted uppercase">Partner</p>
          <p className="font-black text-xl text-white" style={{ fontFamily:theme.font }}>{partScore}</p>
          <p className="text-[8px] text-white/60 truncate">{partner?.name}</p>
        </div>
      </div>

      <div className="relative rounded-3xl border overflow-hidden p-4 space-y-4"
        style={{ background:theme.cardBg,borderColor:theme.border,boxShadow:`0 0 40px ${theme.accent}20` }}>
        {/* Noise bg */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage:`radial-gradient(${theme.accent} 1px, transparent 1px)`,backgroundSize:'20px 20px' }} />

        {/* Progress */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color:theme.accent }}>
            Hot Take {round+1}/{HT_ROUNDS}
          </span>
          <div className="flex gap-0.5">
            {Array.from({length:HT_ROUNDS}).map((_,i)=>(
              <div key={i} className="h-1.5 rounded-full transition-all"
                style={{ width:i===round?16:8, background:i<round?theme.accent:i===round?theme.accent:'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
        </div>

        {/* The hot take statement */}
        <motion.div key={round} initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }}
          transition={{ type:'spring',stiffness:200 }}
          className="relative z-10 text-center py-4 px-2 space-y-2">
          <span className="text-[9px] font-mono px-3 py-1 rounded-full border font-bold uppercase tracking-widest"
            style={{ background:`${theme.accent}20`,borderColor:`${theme.accent}40`,color:theme.accent }}>
            🔥 Hot Take
          </span>
          <h3 className="text-base md:text-lg font-black text-white leading-snug mt-2"
            style={{ fontFamily:theme.font }}>
            "{take.statement}"
          </h3>
        </motion.div>

        {/* Vote status */}
        <div className="relative z-10 flex justify-center gap-4 text-[9px] font-mono">
          <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${myVote?'bg-emerald-500/20 text-emerald-400':'bg-white/5 text-cozy-muted'}`}>
            {user?.avatar} {myVote?`✓ ${myVote.toUpperCase()}`:'⏳ Deciding...'}
          </span>
          <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${partVote?'bg-emerald-500/20 text-emerald-400':'bg-white/5 text-cozy-muted'}`}>
            {partner?.avatar} {partVote?'✓ Voted':'⏳ Deciding...'}
          </span>
        </div>

        {/* Vote buttons */}
        {!myVote && !revealed && (
          <div className="relative z-10 grid grid-cols-2 gap-3">
            {[
              { vote:'agree',    label:'AGREE 🔥',    bg:`linear-gradient(135deg,${theme.accent},${theme.accent2})`,  color:'#000' },
              { vote:'disagree', label:'NOPE 💀',      bg:`rgba(255,255,255,0.06)`, color:'#fff', border:'rgba(255,255,255,0.15)' },
            ].map(({ vote,label,bg,color,border }) => (
              <motion.button key={vote}
                whileHover={{ scale:1.05,y:-3 }} whileTap={{ scale:0.93 }}
                onClick={() => handleVote(vote)}
                className="py-4 rounded-2xl font-black text-sm cursor-pointer border-2 flex items-center justify-center"
                style={{ background:bg,color,borderColor:border??theme.accent,fontFamily:theme.font,
                  boxShadow:vote==='agree'?`0 0 20px ${theme.accent}40`:'none' }}>
                {label}
              </motion.button>
            ))}
          </div>
        )}

        {/* Waiting */}
        {myVote && !partVote && !revealed && (
          <motion.div animate={{ opacity:[0.5,1,0.5] }} transition={{ repeat:Infinity,duration:1.2 }}
            className="relative z-10 text-center text-[10px] font-mono py-2" style={{ color:theme.accent }}>
            Waiting for {partner?.name||'partner'} to vote... 👀
          </motion.div>
        )}

        {/* Reveal */}
        <AnimatePresence>
          {showReveal && voteHost && voteGuest && (
            <motion.div key="reveal" initial={{ opacity:0,scale:0.9 }} animate={{ opacity:1,scale:1 }} exit={{ opacity:0 }}
              className="relative z-10 rounded-2xl border p-4 space-y-3 text-center"
              style={{ background:'rgba(0,0,0,0.5)',borderColor:`${theme.accent}30` }}>
              {/* Both votes */}
              <div className="flex justify-center gap-4 text-xs font-bold">
                <div className="text-center">
                  <p className="text-[8px] font-mono text-cozy-muted">{user?.name}</p>
                  <p className="text-lg font-black" style={{ color:voteHost==='agree'?theme.accent:'#FF6B97', fontFamily:theme.font }}>
                    {(isHost?voteHost:voteGuest).toUpperCase()}
                  </p>
                </div>
                <div className="text-2xl self-center">vs</div>
                <div className="text-center">
                  <p className="text-[8px] font-mono text-cozy-muted">{partner?.name}</p>
                  <p className="text-lg font-black" style={{ color:voteGuest==='agree'?theme.accent:'#FF6B97', fontFamily:theme.font }}>
                    {(isHost?voteGuest:voteHost).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Match or clash */}
              <div>
                <motion.p initial={{ scale:0.5 }} animate={{ scale:1 }} transition={{ type:'spring',stiffness:300 }}
                  className="font-black text-sm" style={{ fontFamily:theme.font,
                    color:voteHost===voteGuest?'#34D399':'#FF6B97' }}>
                  {voteHost===voteGuest ? matchMsg : clashMsg.split('.')[0]+'! 🔥'}
                </motion.p>
                {voteHost!==voteGuest && (
                  <p className="text-[10px] text-cozy-muted mt-1 italic">
                    Debate prompt: {take.debate}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Roster config ────────────────────────────────────────────────────────────
const ROSTER = [
  { id:'ttt',      emoji:'🎮', title:'Tic Tac Toe',        tag:'Classic',  desc:'Cartoon grid duel. Host=X, Guest=O.',        theme:GAME_THEMES.ttt      },
  { id:'emoji',    emoji:'🧠', title:'Emoji Quiz',         tag:'Quiz',     desc:'Guess the movie from emojis. 8 rounds.',     theme:GAME_THEMES.emoji    },
  { id:'reaction', emoji:'⚡', title:'Reaction Blitz',     tag:'Action',   desc:'Tap the target first. First to 5.',          theme:GAME_THEMES.reaction },
  { id:'wkb',      emoji:'🤔', title:'Who Knows Better',   tag:'Duo',      desc:'Answer about each other. See if you match!', theme:GAME_THEMES.wkb      },
  { id:'ctd',      emoji:'🎲', title:'Chaos Truth or Dare',tag:'Chaos',    desc:'Spin the wheel. Truth or dare. No mercy.',   theme:GAME_THEMES.ctd      },
  { id:'ht',       emoji:'🔥', title:'Hot Takes Battle',   tag:'Spicy',    desc:'Agree or disagree on spicy opinions. Debate!', theme:GAME_THEMES.ht       },
  { id:'uno',      emoji:'🃏', title:'UNO',                tag:'Card Game', desc:'108 cards · Full rules · No mercy. Classic!',   theme:GAME_THEMES.uno      },
];

// ─── MAIN GAMESHUB ────────────────────────────────────────────────────────────
export default function GamesHub() {
  const {
    user, partner, isHost, myProgression, partnerProgression, scores,
    gameState, gameHistory, updateGameState,
    addXP, recordWin, markXpAwarded, resetGame, updateActivity,
    requestNav,
  } = useSpace();

  // backward compat alias used in a few places below
  const progression = myProgression;

  const [selectedGame, setSelectedGame] = useState(gameState?.activeGame ?? 'ttt');
  const [tab,          setTab]          = useState('play'); // 'play' | 'history'
  const isPartnerHere = !!partner;
  const theme         = GAME_THEMES[selectedGame] ?? GAME_THEMES.ttt;

  // ── Announce activity ──────────────────────────────────────────────────
  useEffect(() => {
    updateActivity('🕹️ In Arcade Arena');
    return () => updateActivity('🌐 In the World');
  }, []);

  // ── Auto-reset game when BOTH players are on the games page ────────────
  // This ensures a fresh board every session. XP cannot re-fire because
  // xpAwardedForGame is reset to false by resetGame().
  useEffect(() => {
    if (!isPartnerHere || !user?.activeRoomId) return;

    // Only reset if the previous game already has a result (winner set)
    // and XP was already awarded — meaning the game is fully complete
    const gs = gameState;
    const prevGameComplete =
      (gs.winner !== null        && gs.xpAwardedForGame === true)  ||
      (gs.emojiRound >= 8        && gs.emojiXpAwarded   === true)  ||
      ((gs.reactionHostRounds >= 5 || gs.reactionGuestRounds >= 5) && gs.reactionXpAwarded === true) ||
      (gs.wkbRound >= 10         && gs.wkbXpAwarded     === true)  ||
      (gs.ctdRound >= 8          && gs.ctdXpAwarded      === true) ||
      (gs.htRound  >= 10         && gs.htXpAwarded       === true) ||
      (gs.unoPhase === 'gameover' && gs.unoXpAwarded      === true);

    if (prevGameComplete) {
      // Small delay so both players see the completed state briefly before reset
      const t = setTimeout(() => resetGame(true), 1500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line
  }, [isPartnerHere]);

  // ── Keep selectedGame in sync with Firestore (partner's switch propagates)
  useEffect(() => {
    if (gameState?.activeGame && gameState.activeGame !== selectedGame) {
      setSelectedGame(gameState.activeGame);
    }
  }, [gameState?.activeGame]);

  const switchGame = async (id) => {
    // If partner is connected, ask permission before switching
    if (partner) {
      const gameInfo = ROSTER.find(r => r.id === id);
      const reqId = await requestNav(
        '/room/games',
        gameInfo?.title ?? id,
        'game',
        { gameId: id, gameName: gameInfo?.title ?? id, gameEmoji: gameInfo?.emoji ?? '🎮' }
      );
      // Optimistically set locally and wait for sync
      // The NavPermissionManager will handle the response
      setSelectedGame(id);
      await updateGameState({ activeGame: id });
    } else {
      setSelectedGame(id);
      await updateGameState({ activeGame: id });
    }
  };

  // ── onReset: called from Play Again button — uses resetGame() ─────────
  const handleReset = async () => {
    await resetGame(true);
  };

  const userScore    = isHost ? (scores.host??0)  : (scores.guest??0);
  const partnerScore = isHost ? (scores.guest??0) : (scores.host??0);

  const commonProps = {
    user, partner, isHost, gameState, scores,
    updateGameState, addXP, recordWin, markXpAwarded,
    onReset: handleReset,
    resetGame,
  };

  return (
    <div className="relative min-h-full overflow-hidden">

      {/* Dynamic game background */}
      <AnimatePresence mode="wait">
        <motion.div key={selectedGame} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          transition={{duration:0.5}} className="absolute inset-0 z-0" style={{background:theme.bg}}>
          <motion.div animate={{scale:[1,1.2,1],opacity:[0.6,1,0.6]}} transition={{repeat:Infinity,duration:8,ease:'easeInOut'}}
            className="absolute -top-32 -left-32 w-72 h-72 md:w-96 md:h-96 rounded-full blur-3xl pointer-events-none"
            style={{background:theme.blob1}}/>
          <motion.div animate={{scale:[1,1.15,1]}} transition={{repeat:Infinity,duration:11,ease:'easeInOut',delay:2}}
            className="absolute -bottom-32 -right-32 w-72 h-72 md:w-96 md:h-96 rounded-full blur-3xl pointer-events-none"
            style={{background:theme.blob2}}/>
          <GameParticles theme={theme}/>
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 p-3 md:p-6 max-w-6xl mx-auto space-y-4">

        {/* Header */}
        <AnimatePresence mode="wait">
          <motion.div key={selectedGame} initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:12}}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/10">
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2"
                style={{fontFamily:theme.font,textShadow:`0 0 20px ${theme.accent}80`}}>
                <span className="text-xl">{ROSTER.find(r=>r.id===selectedGame)?.emoji}</span>
                {ROSTER.find(r=>r.id===selectedGame)?.title.toUpperCase()}
              </h1>
              <p className="text-[9px] text-cozy-muted mt-0.5 font-mono">
                XP + history saved permanently · board resets each new session
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* All-time score */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono"
                style={{background:`${theme.accent}15`,borderColor:`${theme.accent}40`,color:theme.accent}}>
                <Trophy className="w-3.5 h-3.5"/>
                <span className="font-bold">{userScore}</span>
                <span className="text-cozy-muted">–</span>
                <span className="font-bold">{partnerScore}</span>
                <span className="text-[8px] text-cozy-muted">all-time</span>
              </div>
              {/* Tab toggle */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl p-1">
                {[{id:'play',icon:'🎮',label:'Play'},{id:'history',icon:'📋',label:'History'}].map(t=>(
                  <button key={t.id} onClick={()=>setTab(t.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wide transition-all cursor-pointer ${
                      tab===t.id?'text-white':'text-cozy-muted hover:text-white'
                    }`}
                    style={{background:tab===t.id?`${theme.accent}30`:'transparent'}}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">

          {/* ── PLAY TAB ── */}
          {tab==='play'&&(
            <motion.div key="play" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Game canvas */}
              <div className="lg:col-span-2">
                <AnimatePresence mode="wait">
                  {!isPartnerHere?(
                    <motion.div key="waiting" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                      className="rounded-3xl border p-8 md:p-12 flex flex-col items-center justify-center min-h-[260px] text-center space-y-4"
                      style={{background:`${theme.accent}08`,borderColor:`${theme.accent}25`}}>
                      <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:2,ease:'linear'}}>
                        <Loader2 className="w-9 h-9" style={{color:theme.accent}}/>
                      </motion.div>
                      <div>
                        <h3 className="text-base font-black text-white" style={{fontFamily:theme.font}}>WAITING FOR PLAYER 2...</h3>
                        <p className="text-xs text-cozy-muted font-mono mt-1 max-w-xs">Both players must be connected before games unlock.</p>
                      </div>
                    </motion.div>
                  ):(
                    <motion.div key={`game-${selectedGame}`} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.22}}>
                      {selectedGame==='ttt'      && <TicTacToe        {...commonProps}/>}
                      {selectedGame==='emoji'    && <EmojiQuiz        {...commonProps}/>}
                      {selectedGame==='reaction' && <ReactionBlitz    {...commonProps}/>}
                      {selectedGame==='wkb'      && <WhoKnowsBetter   {...commonProps}/>}
                      {selectedGame==='ctd'      && <ChaosTruthOrDare {...commonProps}/>}
                      {selectedGame==='ht'       && <HotTakesBattle   {...commonProps}/>}
                      {selectedGame==='uno'      && <UnoGame          {...commonProps}/>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Roster + XP */}
              <div className="space-y-3">
                <p className="text-[9px] font-mono uppercase tracking-widest flex items-center gap-1.5" style={{color:theme.accent}}>
                  <Zap className="w-3 h-3"/> GAME ROSTER ({ROSTER.length} games)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                  {ROSTER.map(game=>{
                    const active=selectedGame===game.id, t=game.theme;
                    return (
                      <motion.button key={game.id} onClick={()=>switchGame(game.id)}
                        whileHover={{x:3,scale:1.01}} whileTap={{scale:0.98}}
                        className="w-full text-left p-3 rounded-2xl border transition-all cursor-pointer"
                        style={{background:active?`${t.accent}18`:'rgba(255,255,255,0.02)',
                          borderColor:active?`${t.accent}60`:'rgba(255,255,255,0.06)',
                          boxShadow:active?`0 0 20px ${t.accent}20`:'none'}}>
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{game.emoji}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-black text-white" style={{fontFamily:t.font}}>{game.title}</span>
                              <span className="text-[7px] font-mono font-bold px-1.5 py-0.5 rounded uppercase"
                                style={{background:`${t.accent}20`,color:t.accent}}>{game.tag}</span>
                            </div>
                            <p className="text-[9px] text-cozy-muted font-light leading-snug">{game.desc}</p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* XP bar — YOUR individual progress */}
                <div className="p-3 rounded-2xl border border-white/5 space-y-2" style={{background:'rgba(0,0,0,0.3)'}}>
                  <p className="text-[8px] font-mono uppercase tracking-widest text-cozy-muted mb-1">Your Progress</p>
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="flex items-center gap-1 text-cozy-muted"><Flame className="w-3 h-3 text-accent-pink"/><strong className="text-white">{myProgression.streak}d streak</strong></span>
                    <span style={{color:theme.accent}} className="font-bold">LVL {myProgression.level}</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      style={{background:`linear-gradient(90deg,${theme.accent},${theme.accent2})`}}
                      animate={{width:`${Math.min((myProgression.xp/myProgression.xpToNextLevel)*100,100)}%`}}
                      transition={{duration:0.8,ease:'easeOut'}}/>
                  </div>
                  <div className="flex justify-between text-[8px] font-mono text-cozy-muted">
                    <span>{myProgression.xp} XP</span><span>{myProgression.xpToNextLevel} NEXT</span>
                  </div>
                  {/* Partner's level for comparison */}
                  {partner && (
                    <div className="pt-1 border-t border-white/5">
                      <div className="flex justify-between text-[8px] font-mono">
                        <span className="text-cozy-muted">{partner.name?.split(' ')[0]}'s level</span>
                        <span className="font-bold" style={{color:theme.accent2}}>LVL {partnerProgression.level} &middot; {partnerProgression.xp} XP</span>
                      </div>
                      <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden mt-1">
                        <motion.div className="h-full rounded-full"
                          style={{background:theme.accent2}}
                          animate={{width:`${Math.min((partnerProgression.xp/partnerProgression.xpToNextLevel)*100,100)}%`}}
                          transition={{duration:0.8,ease:'easeOut'}}/>
                      </div>
                    </div>
                  )}
                </div>

                {/* XP legend */}
                <div className="p-3 rounded-2xl border border-white/5 space-y-1.5" style={{background:'rgba(0,0,0,0.2)'}}>
                  <p className="text-[8px] font-mono uppercase tracking-widest text-cozy-muted mb-1.5">XP REWARDS</p>
                  {[{icon:Crown,label:'Win game',xp:`+${XP.win}`,color:theme.accent},{icon:Star,label:'Draw',xp:`+${XP.draw}`,color:theme.accent2},{icon:Zap,label:'Participate',xp:`+${XP.loss}`,color:'#9E97B8'}].map(({icon:Icon,label,xp:amount,color})=>(
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[9px] text-cozy-muted"><Icon className="w-3 h-3" style={{color}}/>{label}</div>
                      <span className="text-[9px] font-mono font-bold" style={{color}}>{amount} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── HISTORY TAB ── */}
          {tab==='history'&&(
            <motion.div key="history" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="max-w-lg mx-auto">
              <div className="p-4 rounded-2xl border border-white/5 space-y-3" style={{background:'rgba(0,0,0,0.3)'}}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-white flex items-center gap-2" style={{fontFamily:theme.font}}>
                    <History className="w-4 h-4" style={{color:theme.accent}}/> Game History
                  </p>
                  <p className="text-[9px] font-mono text-cozy-muted">{gameHistory.length} games played</p>
                </div>
                <GameHistoryPanel gameHistory={gameHistory} user={user} partner={partner}/>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>{/* end inner content div */}

    </div>
  );
}