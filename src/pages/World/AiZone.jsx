// src/pages/World/AiZone.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpace } from '../../context/SpaceContext';
import { Sparkles, RefreshCw, Loader2, Flame, Brain, Heart, Zap, Dices, Copy, Check, Bot, Shuffle } from 'lucide-react';

const PROMPT_BANKS = {
  icebreaker: {
    color:'#8B5CF6', emoji:'🧊', label:'Icebreaker', bg:'rgba(139,92,246,0.12)', border:'rgba(139,92,246,0.30)',
    prompts: [
      "What's one thing about yourself you've never told anyone but would tell this person?",
      "If you could live inside any movie world for a week, which one and what would you do?",
      "Describe your perfect day in 5 words. No explanations allowed.",
      "What's a talent you have that would genuinely surprise the other person?",
      "If you had to describe your duo as a weather pattern, what would it be?",
      "What's the most irrational fear you have that you've just accepted is part of you?",
      "Name one thing you'd change about the world if you had a single magic button.",
      "What's a song that you now associate with a memory involving this person?",
    ],
  },
  dare: {
    color:'#FF6B97', emoji:'🔥', label:'Dare', bg:'rgba(255,107,151,0.12)', border:'rgba(255,107,151,0.30)',
    prompts: [
      "Text your most recent contact a random compliment right now. Screenshot it.",
      "Do your best impression of the other person. They rate it out of 10.",
      "Send a voice note of you singing 10 seconds of your current favourite song.",
      "Write a haiku about your duo connection right now. No time to think.",
      "Change your profile picture to something ridiculous for 30 minutes.",
      "Describe the other person using ONLY emoji. At least 6. Go.",
      "Tell the most embarrassing story from this past month. No skipping.",
      "Do 10 push-ups on camera or admit your most recent search history item.",
    ],
  },
  deepTalk: {
    color:'#06B6D4', emoji:'🧠', label:'Deep Talk', bg:'rgba(6,182,212,0.12)', border:'rgba(6,182,212,0.30)',
    prompts: [
      "What's something you've been wanting to say but haven't found the courage to?",
      "What moment made you the most proud of yourself in the last year?",
      "Name one belief you held 3 years ago you've completely changed your mind about.",
      "Describe your ideal life in 5 years. Be specific and honest.",
      "What are you genuinely grateful for that you've been taking for granted?",
      "If you could relive one day from the past exactly as it happened, which would it be?",
      "What's the hardest lesson you've learned about friendship?",
      "What's one thing you wish people understood about you without you having to explain it?",
    ],
  },
  compatibility: {
    color:'#FCD34D', emoji:'❤️', label:'Compatibility', bg:'rgba(252,211,77,0.12)', border:'rgba(252,211,77,0.30)',
    prompts: [
      "Both answer: What's your love language? Compare. Discuss.",
      "Rate your communication style 1-10 honestly. Explain the rating.",
      "What's a habit of the other person you secretly find endearing?",
      "If stuck in an elevator together for 2 hours, what would you talk about?",
      "Chaos to organization scale — where does the other person fall? Are you right?",
      "What's something you'd never let the other person do on your behalf?",
      "The one thing you two would argue about most if you lived together.",
      "Pick a theme song for your duo dynamic. Justify it.",
    ],
  },
  chaos: {
    color:'#FB923C', emoji:'💥', label:'Chaos Mode', bg:'rgba(251,146,60,0.12)', border:'rgba(251,146,60,0.30)',
    prompts: [
      "Swap phone wallpapers for 24 hours. No vetoes allowed.",
      "Create a 3-step plan to take over a small country. 60 seconds each.",
      "Pick an embarrassing username for the other person to use in this session.",
      "Design a terrible business together. Pitch it in under 30 seconds each.",
      "Write the worst possible Tinder bio for each other. Read them out loud.",
      "One rule for a new society you two run. It must be completely unreasonable.",
      "Invent a holiday: name it, describe what people do, and what food is involved.",
      "Both secretly write down what superpower the other would misuse. Reveal together.",
    ],
  },
};

const CATEGORIES = Object.entries(PROMPT_BANKS).map(([id, data]) => ({ id, ...data }));

// ── Animated robot head ───────────────────────────────────────────────────────
function RobotHead({ thinking, color }) {
  return (
    <div className="relative w-16 h-16 mx-auto">
      {/* Outer pulse */}
      <motion.div
        animate={thinking ? { scale:[1,1.3,1], opacity:[0.3,0.6,0.3] } : { scale:1, opacity:0.2 }}
        transition={{ repeat:Infinity, duration:0.8 }}
        className="absolute inset-[-8px] rounded-2xl"
        style={{ background:`${color}30`, border:`1px solid ${color}40` }}
      />
      {/* Face */}
      <motion.div
        animate={thinking ? { rotate:[-2,2,-2] } : { rotate:0 }}
        transition={{ repeat:Infinity, duration:0.4 }}
        className="w-full h-full rounded-2xl border-2 flex flex-col items-center justify-center gap-1 relative overflow-hidden"
        style={{ background:`linear-gradient(135deg, rgba(0,0,0,0.8), ${color}20)`, borderColor:`${color}60` }}
      >
        {/* Eyes */}
        <div className="flex gap-2">
          {[0,1].map(i => (
            <motion.div key={i}
              animate={thinking ? { scaleY:[1,0.1,1] } : { scaleY:1 }}
              transition={{ repeat:Infinity, duration:2, delay:i*0.1 }}
              className="w-2.5 h-2.5 rounded-full"
              style={{ background:color, boxShadow:`0 0 6px ${color}` }}
            />
          ))}
        </div>
        {/* Mouth */}
        <motion.div
          animate={thinking ? { width:['60%','80%','60%'] } : { width:'60%' }}
          transition={{ repeat:Infinity, duration:0.6 }}
          className="h-1 rounded-full"
          style={{ background:`${color}60` }}
        />
      </motion.div>
    </div>
  );
}

// ── Typing effect for prompts ─────────────────────────────────────────────────
function TypedPrompt({ text, color }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed('');
    setDone(false);
    if (!text) return;

    const interval = setInterval(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <p className="text-base text-white font-light leading-relaxed min-h-[80px]">
      "{displayed}
      {!done && (
        <motion.span
          animate={{ opacity:[1,0,1] }}
          transition={{ repeat:Infinity, duration:0.5 }}
          style={{ color }}
        >|</motion.span>
      )}
      {done && '"'}
    </p>
  );
}

export default function AiZone() {
  const { user, partner, addXP, updateActivity } = useSpace();

  const [category,  setCategory]  = useState('icebreaker');
  const [prompt,    setPrompt]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [history,   setHistory]   = useState([]);
  const [copied,    setCopied]    = useState(false);
  const [xpFlash,   setXpFlash]   = useState(null);
  const [streak,    setStreak]    = useState(0);
  const [totalGen,  setTotalGen]  = useState(0);

  const cat = PROMPT_BANKS[category];
  const isPartnerHere = !!partner;

  useEffect(() => {
    updateActivity('🤖 In AI Lab');
    return () => updateActivity('🌐 In the World');
  }, []);

  // First prompt on mount
  useEffect(() => { generatePrompt(false); }, []);

  const generatePrompt = async (awardXP = true) => {
    setLoading(true);
    setPrompt('');

    // Fake AI delay — feels real
    await new Promise(r => setTimeout(r, 700 + Math.random() * 500));

    const bank   = PROMPT_BANKS[category].prompts;
    const result = bank[Math.floor(Math.random() * bank.length)];

    setPrompt(result);
    setHistory(prev => [{ text:result, category, color:cat.color, emoji:cat.emoji, ts:Date.now() }, ...prev.slice(0, 11)]);
    setTotalGen(p => p + 1);
    setStreak(p => p + 1);

    if (awardXP) {
      await addXP(10);
      setXpFlash('+10 XP');
      setTimeout(() => setXpFlash(null), 1800);
    }

    setLoading(false);
  };

  const handleCopy = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCategoryChange = (id) => {
    setCategory(id);
    setPrompt('');
    setStreak(0);
  };

  return (
    <div className="min-h-full relative overflow-hidden"
      style={{ background:'linear-gradient(180deg, #04000a 0%, #080010 40%, #07050F 100%)' }}>

      {/* Dynamic bg glow */}
      <AnimatePresence mode="wait">
        <motion.div key={category}
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          transition={{ duration:0.8 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background:`radial-gradient(ellipse 60% 50% at 50% 0%, ${cat.color}15 0%, transparent 70%)` }}
        />
      </AnimatePresence>

      {/* Scan line */}
      <div className="absolute left-0 right-0 h-px pointer-events-none z-0"
        style={{ background:`linear-gradient(90deg, transparent, ${cat.color}30, transparent)`, animation:'scanLine 5s linear infinite', top:0 }} />

      {/* Retro grid */}
      <div className="absolute inset-0 pointer-events-none opacity-5"
        style={{ backgroundImage:`linear-gradient(${cat.color}20 1px, transparent 1px), linear-gradient(90deg, ${cat.color}20 1px, transparent 1px)`, backgroundSize:'40px 40px' }} />

      {/* Floating AI particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['🤖','✨','💡','⚡','🧠','💫'].map((e, i) => (
          <motion.div key={e}
            animate={{ y:[0,-60,0], opacity:[0.04,0.15,0.04], rotate:[0,20,-20,0] }}
            transition={{ repeat:Infinity, duration:6+i*2, delay:i*1.3 }}
            className="absolute select-none"
            style={{ left:`${5+i*18}%`, top:`${10+i*12}%`, fontSize:16+i*4, filter:'blur(1px)' }}
          >{e}</motion.div>
        ))}
      </div>

      <div className="relative z-10 p-3 md:p-6 max-w-5xl mx-auto space-y-4">

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2" style={{ fontFamily:'Syne, sans-serif' }}>
              <motion.span animate={{ rotate:[0,-5,5,0] }} transition={{ repeat:Infinity, duration:3 }}>🤖</motion.span>
              AI Prompt Lab
              <motion.span
                animate={{ opacity:[1,0,1] }}
                transition={{ repeat:Infinity, duration:1.2 }}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                style={{ background:`${cat.color}20`, borderColor:`${cat.color}40`, color:cat.color }}
              >
                LIVE
              </motion.span>
            </h1>
            <p className="text-[9px] text-cozy-muted font-mono mt-0.5">
              {totalGen} prompts generated · {streak} on current streak · +10 XP per roll
            </p>
          </div>

          {/* XP flash */}
          <AnimatePresence>
            {xpFlash && (
              <motion.div
                initial={{ opacity:0, scale:0.5, y:10 }}
                animate={{ opacity:1, scale:1,   y:0  }}
                exit={{    opacity:0, scale:0.5, y:-10 }}
                className="text-sm font-black px-3 py-1.5 rounded-full border flex items-center gap-1.5"
                style={{ background:`${cat.color}20`, borderColor:`${cat.color}50`, color:cat.color, fontFamily:'Syne, sans-serif' }}
              >
                <Zap className="w-3.5 h-3.5" />{xpFlash}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── LEFT: Category + Generator ──────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Category tabs */}
            <div className="grid grid-cols-5 gap-1.5 md:gap-2">
              {CATEGORIES.map(c => (
                <motion.button
                  key={c.id}
                  whileHover={{ scale:1.05, y:-2 }}
                  whileTap={{ scale:0.95 }}
                  onClick={() => handleCategoryChange(c.id)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all cursor-pointer text-center"
                  style={{
                    background:  category === c.id ? c.bg : 'rgba(255,255,255,0.02)',
                    borderColor: category === c.id ? c.color : 'rgba(255,255,255,0.06)',
                    boxShadow:   category === c.id ? `0 0 20px ${c.color}25` : 'none',
                  }}
                >
                  <span className="text-xl">{c.emoji}</span>
                  <span className="text-[7px] md:text-[8px] font-mono font-black uppercase tracking-wide leading-tight"
                    style={{ color: category === c.id ? c.color : '#9E97B8' }}>
                    {c.label}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Main prompt card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={category}
                initial={{ opacity:0, scale:0.96, y:10 }}
                animate={{ opacity:1, scale:1,    y:0  }}
                exit={{    opacity:0, scale:0.96, y:-10 }}
                transition={{ duration:0.3 }}
                className="relative rounded-3xl border overflow-hidden p-4 md:p-6 space-y-4"
                style={{ background:'rgba(5,0,15,0.85)', borderColor:`${cat.color}30`, boxShadow:`0 0 50px ${cat.color}15`, backdropFilter:'blur(20px)' }}
              >
                {/* Dynamic top glow */}
                <div className="absolute top-0 inset-x-0 h-0.5"
                  style={{ background:`linear-gradient(90deg, transparent, ${cat.color}, transparent)` }} />

                {/* Robot + category label */}
                <div className="flex items-center gap-4">
                  <RobotHead thinking={loading} color={cat.color} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color:cat.color, fontFamily:'Syne, sans-serif' }}>
                        {cat.label}
                      </span>
                    </div>
                    <p className="text-[9px] font-mono text-cozy-muted">
                      {loading ? 'AI is cooking something...' : 'Click roll for a new prompt'}
                    </p>
                  </div>
                </div>

                {/* Prompt display */}
                <div className="min-h-[100px] flex items-center">
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.div key="loading" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                        className="flex items-center gap-3 text-cozy-muted w-full">
                        <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" style={{ color:cat.color }} />
                        <div className="space-y-1.5 flex-1">
                          {[90, 75, 55].map((w, i) => (
                            <motion.div key={i}
                              animate={{ opacity:[0.3,0.7,0.3] }}
                              transition={{ repeat:Infinity, duration:1, delay:i*0.2 }}
                              className="h-2.5 rounded-full bg-white/10"
                              style={{ width:`${w}%` }} />
                          ))}
                        </div>
                      </motion.div>
                    ) : prompt ? (
                      <motion.div key={prompt} initial={{ opacity:0 }} animate={{ opacity:1 }} className="w-full">
                        <TypedPrompt text={prompt} color={cat.color} />
                      </motion.div>
                    ) : (
                      <motion.p key="empty" initial={{ opacity:0 }} animate={{ opacity:0.4 }}
                        className="text-cozy-muted text-sm font-light italic">
                        Pick a category and roll for a prompt...
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 pt-2 border-t border-white/5">
                  <motion.button
                    whileHover={{ scale:1.03, boxShadow:`0 0 30px ${cat.color}40` }}
                    whileTap={{ scale:0.96 }}
                    onClick={() => generatePrompt(true)}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-2 transition-all"
                    style={{ background:`linear-gradient(135deg, ${cat.color}, ${cat.color}88)`, color:'#000', borderColor:`${cat.color}60`, fontFamily:'Syne, sans-serif' }}
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin text-white" /><span className="text-white">Generating...</span></>
                      : <><Dices className="w-4 h-4" /> ROLL PROMPT</>
                    }
                  </motion.button>

                  <motion.button
                    whileHover={{ scale:1.08 }} whileTap={{ scale:0.9 }}
                    onClick={handleCopy}
                    disabled={!prompt || loading}
                    className="p-3 rounded-2xl border transition-all cursor-pointer disabled:opacity-30"
                    style={{ background:'rgba(255,255,255,0.05)', borderColor:'rgba(255,255,255,0.10)' }}
                  >
                    {copied
                      ? <Check className="w-4 h-4 text-emerald-400" />
                      : <Copy className="w-4 h-4 text-cozy-muted" />
                    }
                  </motion.button>
                </div>

                {!isPartnerHere && (
                  <motion.p animate={{ opacity:[0.5,1,0.5] }} transition={{ repeat:Infinity, duration:2 }}
                    className="text-center text-[9px] font-mono"
                    style={{ color:`${cat.color}80` }}>
                    ⚠️ Your partner hasn't joined — prompts running in solo mode
                  </motion.p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── RIGHT: History ───────────────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-[9px] font-mono uppercase tracking-widest text-cozy-muted flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3" /> SESSION HISTORY
            </p>

            {history.length === 0 ? (
              <div className="text-center py-12 opacity-30 space-y-2">
                <Bot className="w-8 h-8 text-cozy-muted mx-auto" />
                <p className="text-[10px] text-cozy-muted font-light">No prompts yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-0.5">
                <AnimatePresence>
                  {history.map((item, i) => (
                    <motion.button
                      key={item.ts}
                      initial={{ opacity:0, x:10 }}
                      animate={{ opacity:1, x:0 }}
                      transition={{ delay: i === 0 ? 0 : 0 }}
                      onClick={() => setPrompt(item.text)}
                      className="w-full text-left p-3 rounded-2xl border transition-all cursor-pointer hover:border-white/15"
                      style={{
                        background:  i === 0 ? `${item.color}10` : 'rgba(255,255,255,0.02)',
                        borderColor: i === 0 ? `${item.color}30` : 'rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="flex items-center gap-1 text-[8px] font-mono font-black uppercase mb-1"
                        style={{ color:item.color }}>
                        {item.emoji} {PROMPT_BANKS[item.category]?.label}
                      </div>
                      <p className="text-[10px] text-cozy-muted font-light leading-snug line-clamp-2">
                        {item.text}
                      </p>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Info */}
            <div className="p-3 rounded-2xl border border-white/5 space-y-1.5 mt-2"
              style={{ background:'rgba(0,0,0,0.3)' }}>
              <p className="text-[8px] font-mono uppercase tracking-widest text-cozy-muted mb-2">HOW IT WORKS</p>
              {[
                { dot:cat.color, text:'Pick a category vibe' },
                { dot:cat.color, text:'Hit ROLL for a new prompt' },
                { dot:cat.color, text:'+10 XP per generation' },
                { dot:cat.color, text:'Tap history to reuse any prompt' },
              ].map(({ dot, text }) => (
                <div key={text} className="flex items-start gap-1.5 text-[9px] text-cozy-muted">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5" style={{ background:dot }} />{text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}