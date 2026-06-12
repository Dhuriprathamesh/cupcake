// src/pages/World/ChatRoom.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpace } from '../../context/SpaceContext';
import { db } from '../../config/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Send, Smile, Loader2, ImagePlus, Mic, X, Check, CheckCheck } from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const QUICK_EMOJIS = ['❤️','🔥','😂','😮','🎉','💀','🧁','✨','🤣','😭','👀','💯','😤','🥺','👑','🫡'];
const REACTIONS    = ['❤️','🔥','😂','👀','😮','💀','🥺','✨'];

const STICKERS = [
  { id:'s1', emoji:'🧁', label:'Cupcake'   },{ id:'s2', emoji:'💀', label:'Dead'      },
  { id:'s3', emoji:'🤡', label:'Clown'     },{ id:'s4', emoji:'🏆', label:'Winner'    },
  { id:'s5', emoji:'😤', label:'Salty'     },{ id:'s6', emoji:'🚀', label:'Rocket'    },
  { id:'s7', emoji:'🧠', label:'Big Brain' },{ id:'s8', emoji:'🎭', label:'Drama'     },
  { id:'s9', emoji:'🌚', label:'Sheesh'    },{ id:'s10',emoji:'💅', label:'Unbothered'},
  { id:'s11',emoji:'🫠', label:'Melting'   },{ id:'s12',emoji:'🫡', label:'Salute'    },
];

// ── Typing indicator dots ─────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0,1,2].map(i => (
        <motion.span key={i}
          animate={{ y:[0,-4,0] }}
          transition={{ repeat:Infinity, duration:0.6, delay:i*0.15, ease:'easeInOut' }}
          className="w-1.5 h-1.5 rounded-full bg-white/40 inline-block" />
      ))}
    </div>
  );
}

// ── Date separator ────────────────────────────────────────────────────────────
function DateSep({ label }) {
  return (
    <div className="flex items-center gap-3 my-3 px-2">
      <div className="flex-1 h-px bg-white/5" />
      <span className="text-[9px] font-mono text-cozy-muted/60 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg, isMe, showAvatar, showTime, isFirst, onReact }) {
  const [hover, setHover] = useState(false);
  const isSticker = msg.isSticker;
  const reactions = msg.reactions ?? {};
  const reactCounts = Object.values(reactions).reduce((acc,r)=>{ acc[r]=(acc[r]||0)+1; return acc; },{});

  return (
    <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} group`}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>

      {/* Avatar placeholder — only shown for first in group */}
      <div className="flex-shrink-0 w-7 h-7 mb-0.5">
        {showAvatar && !isMe && (
          <div className="w-7 h-7 rounded-full bg-cozy-soft border border-white/10 flex items-center justify-center text-sm">
            {msg.avatar || '👤'}
          </div>
        )}
      </div>

      <div className={`flex flex-col max-w-[78%] md:max-w-[62%] ${isMe ? 'items-end' : 'items-start'} gap-0.5`}>

        {/* Sender name for first in group (other person only) */}
        {showAvatar && !isMe && (
          <span className="text-[9px] font-mono text-cozy-muted/60 pl-1 mb-0.5">{msg.name}</span>
        )}

        {/* Sticker */}
        {isSticker ? (
          <motion.div whileHover={{ scale:1.12, rotate:[-4,4,0] }} transition={{ duration:0.3 }}
            className="text-5xl select-none cursor-default py-1">{msg.text}</motion.div>
        ) : (
          <div className={`relative px-3.5 py-2.5 text-sm leading-relaxed break-words
            ${isMe
              ? 'rounded-2xl rounded-br-md text-white'
              : 'rounded-2xl rounded-bl-md text-white border border-white/8'
            }`}
            style={isMe
              ? { background:'linear-gradient(135deg,#7C3AED,#EC4899)', boxShadow:'0 2px 12px rgba(124,58,237,0.35)' }
              : { background:'rgba(30,22,58,0.92)', backdropFilter:'blur(12px)' }
            }>
            {msg.text}
          </div>
        )}

        {/* Reactions */}
        {Object.keys(reactCounts).length > 0 && (
          <div className={`flex gap-1 -mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
            {Object.entries(reactCounts).map(([emoji,count]) => (
              <span key={emoji}
                className="text-[11px] px-1.5 py-0.5 rounded-full border border-white/10 cursor-pointer hover:scale-110 transition-transform"
                style={{ background:'rgba(20,14,40,0.9)' }}
                onClick={() => onReact(msg.id, emoji)}>
                {emoji}{count > 1 ? ` ${count}` : ''}
              </span>
            ))}
          </div>
        )}

        {/* Time + read status */}
        {showTime && (
          <div className={`flex items-center gap-1 ${isMe ? 'flex-row-reverse' : 'flex-row'} px-1`}>
            <span className="text-[9px] text-cozy-muted/50 font-mono">{msg.time}</span>
            {isMe && (
              msg.read
                ? <CheckCheck className="w-3 h-3 text-accent-cyan" />
                : <Check className="w-3 h-3 text-cozy-muted/40" />
            )}
          </div>
        )}

        {/* Quick react bar */}
        <AnimatePresence>
          {hover && !isSticker && (
            <motion.div
              initial={{ opacity:0, scale:0.85, y:4 }}
              animate={{ opacity:1, scale:1,    y:0 }}
              exit={{    opacity:0, scale:0.85, y:4 }}
              transition={{ duration:0.12 }}
              className={`flex items-center gap-0.5 rounded-full px-2 py-1 border border-white/8 ${isMe ? 'self-end' : 'self-start'}`}
              style={{ background:'rgba(10,6,24,0.97)', backdropFilter:'blur(16px)' }}>
              {REACTIONS.map(r => (
                <motion.button key={r} whileHover={{ scale:1.5 }} whileTap={{ scale:0.7 }}
                  onClick={() => onReact(msg.id, r)}
                  className="text-sm cursor-pointer p-0.5 rounded">
                  {r}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Group messages by sender (consecutive = same group) ───────────────────────
function groupMessages(messages) {
  if (!messages.length) return [];
  const groups = [];
  let curr = [messages[0]];
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].uid === messages[i-1].uid) {
      curr.push(messages[i]);
    } else {
      groups.push(curr);
      curr = [messages[i]];
    }
  }
  groups.push(curr);
  return groups;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN CHAT
// ══════════════════════════════════════════════════════════════════════════════
export default function ChatRoom() {
  const { user, partner, roomData, updateActivity } = useSpace();

  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState('');
  const [sending,    setSending]    = useState(false);
  const [picker,     setPicker]     = useState(null); // null | 'emoji' | 'stickers'
  const [isTyping,   setIsTyping]   = useState(false);
  const [inputRows,  setInputRows]  = useState(1);

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const msgsRef     = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    updateActivity('💬 In Chat Room');
    return () => updateActivity('🌐 In the World');
  }, []);

  // Sync messages
  useEffect(() => {
    if (roomData?.messages) setMessages(roomData.messages);
  }, [roomData?.messages]);

  // Auto scroll
  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior:'smooth' });
    });
  }, [messages]);

  // ── Typing indicator ────────────────────────────────────────────────────────
  const handleTyping = () => {
    if (!user?.activeRoomId) return;
    if (!isTyping) {
      setIsTyping(true);
      updateDoc(doc(db,'users',user.uid), { isTyping:true }).catch(()=>{});
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setIsTyping(false);
      updateDoc(doc(db,'users',user.uid), { isTyping:false }).catch(()=>{});
    }, 1500);
  };

  const clearTyping = () => {
    clearTimeout(typingTimer.current);
    setIsTyping(false);
    updateDoc(doc(db,'users',user.uid), { isTyping:false }).catch(()=>{});
  };

  // ── Auto-grow textarea ──────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    setInput(e.target.value);
    handleTyping();
    const lines = e.target.value.split('\n').length;
    setInputRows(Math.min(lines, 4));
  };

  // ── Send ────────────────────────────────────────────────────────────────────
  const sendMsg = useCallback(async (text, isSticker = false) => {
    if (!text.trim() || !user?.activeRoomId) return;
    setSending(true);
    const newMsg = {
      id:        `${Date.now()}_${Math.random().toString(36).substring(2,6)}`,
      uid:       user.uid,
      name:      user.name,
      avatar:    user.avatar,
      text:      text.trim(),
      isSticker,
      reactions: {},
      read:      false,
      time:      new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
      ts:        Date.now(),
    };
    try {
      await updateDoc(doc(db,'rooms',user.activeRoomId), { messages:arrayUnion(newMsg) });
      setInput('');
      setInputRows(1);
      setPicker(null);
      clearTyping();
    } catch (err) { console.error('Send failed:', err); }
    finally { setSending(false); inputRef.current?.focus(); }
  }, [user?.activeRoomId, user?.uid]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(input); }
  };

  // ── React ───────────────────────────────────────────────────────────────────
  const handleReact = async (msgId, reaction) => {
    if (!user?.activeRoomId) return;
    setMessages(prev => prev.map(m =>
      m.id !== msgId ? m : { ...m, reactions: { ...(m.reactions??{}), [user.uid]:reaction } }
    ));
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const isPartnerHere = !!partner;
  const msgGroups     = groupMessages(messages);

  return (
    /*
     * LAYOUT STRATEGY (matches WhatsApp/Telegram behaviour):
     *  ┌─────────────────────┐  ← absolute fill the parent (100% h/w)
     *  │  HEADER   fixed top │  ← flex-shrink-0
     *  ├─────────────────────┤
     *  │  MESSAGES           │  ← flex-1, overflow-y-auto, min-h-0
     *  │  (scrollable)       │
     *  ├─────────────────────┤
     *  │  PICKER (optional)  │  ← flex-shrink-0, animated height
     *  │  INPUT DOCK fixed ↓ │  ← flex-shrink-0, NEVER moves
     *  └─────────────────────┘
     *
     *  On mobile keyboard open: browser shrinks the visual viewport.
     *  Because the container is 100% of that viewport and uses flex-column,
     *  the messages area shrinks (flex-1 absorbs the lost space) and the
     *  input dock stays pinned at the NEW bottom — exactly like WhatsApp.
     *
     *  NO visualViewport API needed. NO position:fixed tricks.
     *  Just correct flex layout + container height = 100%.
     */
    <div className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ background:'linear-gradient(180deg,#080012 0%,#07050F 100%)' }}>

      {/* ── Ambient background ──────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl opacity-30"
          style={{ background:'radial-gradient(circle,rgba(255,107,151,0.5),transparent)' }} />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ background:'radial-gradient(circle,rgba(139,92,246,0.6),transparent)' }} />
      </div>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/5 relative z-10"
        style={{ background:'rgba(8,0,18,0.90)', backdropFilter:'blur(24px)' }}>

        {/* Partner avatar + name */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-cozy-soft border-2 border-white/10 flex items-center justify-center text-xl">
            {partner?.avatar || '👤'}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#080012] ${isPartnerHere ? 'bg-emerald-400' : 'bg-gray-600'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-white truncate" style={{ fontFamily:'Syne,sans-serif' }}>
            {partner?.name || 'Your Partner'}
          </p>
          <AnimatePresence mode="wait">
            {partner?.isTyping ? (
              <motion.p key="typing" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="text-[10px] font-mono flex items-center gap-1.5" style={{ color:'#FF6B97' }}>
                <span className="flex gap-0.5">
                  {[0,1,2].map(i=><motion.span key={i} animate={{ opacity:[0.3,1,0.3] }} transition={{ repeat:Infinity,duration:0.8,delay:i*0.2 }} className="w-1 h-1 rounded-full bg-accent-pink inline-block"/>)}
                </span>
                typing...
              </motion.p>
            ) : (
              <motion.p key="status" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="text-[10px] font-mono"
                style={{ color: isPartnerHere ? '#34D399' : '#9E97B8' }}>
                {isPartnerHere ? '● online' : '○ not connected'}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Pill badge */}
        <div className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-mono font-bold uppercase border ${
          isPartnerHere ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-white/5 border-white/8 text-cozy-muted'
        }`}>
          {isPartnerHere ? '🔴 LIVE' : '○ SOLO'}
        </div>
      </div>

      {/* ── MESSAGES ────────────────────────────────────────────────────── */}
      <div ref={msgsRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 min-h-0"
        style={{ overscrollBehavior:'contain' }}>

        <div className="px-3 md:px-4 py-4 space-y-1">

          {/* Empty state */}
          {messages.length === 0 && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
              className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <motion.div animate={{ scale:[1,1.08,1], rotate:[0,-5,5,0] }}
                transition={{ repeat:Infinity, duration:3 }} className="text-6xl">💬</motion.div>
              <div>
                <p className="text-sm font-black text-white mb-1" style={{ fontFamily:'Syne,sans-serif' }}>No messages yet</p>
                <p className="text-[10px] text-cozy-muted">Say something. Anything. Even 'hi' works.</p>
              </div>
              <motion.p animate={{ opacity:[0.4,1,0.4] }} transition={{ repeat:Infinity, duration:2 }}
                className="text-[9px] font-mono text-accent-pink">
                👇 Use the box below
              </motion.p>
            </motion.div>
          )}

          {/* Messages grouped */}
          {msgGroups.map((group, gi) => {
            const isMe = group[0].uid === user?.uid;
            // Date separator before first message of the day
            const showDate = gi === 0 || (() => {
              const prev = msgGroups[gi-1];
              const prevDate = new Date(prev[prev.length-1].ts).toDateString();
              const thisDate = new Date(group[0].ts).toDateString();
              return prevDate !== thisDate;
            })();
            const dateLabel = (() => {
              const d = new Date(group[0].ts);
              const today = new Date();
              const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
              if (d.toDateString() === today.toDateString()) return 'Today';
              if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
              return d.toLocaleDateString([],{month:'short',day:'numeric'});
            })();

            return (
              <React.Fragment key={`group-${gi}`}>
                {showDate && <DateSep label={dateLabel} />}
                <div className="space-y-0.5">
                  {group.map((msg, mi) => (
                    <motion.div key={msg.id}
                      initial={{ opacity:0, y:8, scale:0.97 }}
                      animate={{ opacity:1, y:0, scale:1 }}
                      transition={{ duration:0.16, ease:'easeOut' }}>
                      <Bubble
                        msg={msg}
                        isMe={isMe}
                        showAvatar={mi === group.length - 1}   // avatar only on last of group
                        showTime={mi === group.length - 1}     // time only on last of group
                        isFirst={mi === 0}
                        onReact={handleReact}
                      />
                    </motion.div>
                  ))}
                </div>
              </React.Fragment>
            );
          })}

          {/* Partner typing */}
          <AnimatePresence>
            {partner?.isTyping && (
              <motion.div key="typing-bubble"
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
                className="flex items-end gap-2 pl-0">
                <div className="w-7 h-7 rounded-full bg-cozy-soft border border-white/10 flex items-center justify-center text-sm flex-shrink-0">
                  {partner.avatar || '👤'}
                </div>
                <div className="rounded-2xl rounded-bl-md border border-white/8"
                  style={{ background:'rgba(30,22,58,0.92)' }}>
                  <TypingDots />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} className="h-2" />
        </div>
      </div>

      {/* ── EMOJI / STICKER PICKER ───────────────────────────────────────── */}
      <AnimatePresence>
        {picker && (
          <motion.div
            key={picker}
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{    height:0, opacity:0 }}
            transition={{ duration:0.2 }}
            className="flex-shrink-0 overflow-hidden border-t border-white/5 relative z-10"
            style={{ background:'rgba(8,0,18,0.96)', backdropFilter:'blur(20px)' }}>
            {picker === 'emoji' && (
              <div className="flex flex-wrap gap-1.5 p-3">
                {QUICK_EMOJIS.map(e => (
                  <motion.button key={e} whileHover={{ scale:1.35 }} whileTap={{ scale:0.75 }}
                    onClick={() => sendMsg(e)}
                    className="w-9 h-9 text-xl flex items-center justify-center rounded-xl hover:bg-white/8 cursor-pointer transition-colors">
                    {e}
                  </motion.button>
                ))}
              </div>
            )}
            {picker === 'stickers' && (
              <div className="grid grid-cols-6 gap-1.5 p-3">
                {STICKERS.map(s => (
                  <motion.button key={s.id} whileHover={{ scale:1.18, rotate:[-3,3,0] }} whileTap={{ scale:0.8 }}
                    onClick={() => sendMsg(s.emoji, true)}
                    className="flex flex-col items-center gap-0.5 p-2 rounded-xl hover:bg-white/8 cursor-pointer transition-colors">
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="text-[7px] font-mono text-cozy-muted">{s.label}</span>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INPUT DOCK ───────────────────────────────────────────────────── */}
      {/*
       * flex-shrink-0 ensures this never shrinks.
       * When keyboard opens, it's pushed up naturally because the
       * PARENT container is 100% of the visual viewport (absolute inset-0)
       * and flex-column layout — messages shrink, input stays at bottom.
       */}
      <div className="flex-shrink-0 relative z-10 border-t border-white/5"
        style={{
          background:     'rgba(8,0,18,0.96)',
          backdropFilter: 'blur(24px)',
          paddingBottom:  'env(safe-area-inset-bottom,0px)',
        }}>

        {/* Picker toggle row */}
        <div className="flex items-center gap-2 px-3 pt-2">
          {[
            { id:'emoji',    icon:'😊', label:'Emoji'    },
            { id:'stickers', icon:'🧁', label:'Stickers' },
          ].map(t => (
            <button key={t.id}
              onClick={() => setPicker(p => p === t.id ? null : t.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9px] font-mono font-bold uppercase tracking-wide border cursor-pointer transition-all ${
                picker === t.id
                  ? 'bg-accent-purple/20 border-accent-purple/40 text-accent-purple'
                  : 'bg-white/3 border-white/6 text-cozy-muted hover:text-white'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
          {picker && (
            <motion.button initial={{ scale:0 }} animate={{ scale:1 }}
              whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
              onClick={() => setPicker(null)}
              className="ml-auto p-1 text-cozy-muted hover:text-white cursor-pointer transition-all">
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Main input row */}
        <div className="flex items-end gap-2 px-3 py-2">

          {/* Text input */}
          <div className="flex-1 flex items-end rounded-2xl border border-white/10 focus-within:border-accent-purple/50 transition-all overflow-hidden"
            style={{ background:'rgba(255,255,255,0.06)' }}>
            <textarea
              ref={inputRef}
              rows={inputRows}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isPartnerHere ? 'Message...' : 'Waiting for partner...'}
              disabled={!isPartnerHere}
              className="flex-1 bg-transparent px-4 py-2.5 text-white placeholder:text-cozy-muted/35 focus:outline-none font-light resize-none leading-relaxed disabled:opacity-40"
              style={{ fontSize:'16px', maxHeight:'96px' }}
            />
          </div>

          {/* Send button */}
          <motion.button
            whileHover={{ scale:1.08 }}
            whileTap={{ scale:0.88 }}
            onClick={() => sendMsg(input)}
            disabled={!input.trim() || sending || !isPartnerHere}
            className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 transition-all"
            style={input.trim()
              ? { background:'linear-gradient(135deg,#7C3AED,#EC4899)', boxShadow:'0 4px 18px rgba(124,58,237,0.45)' }
              : { background:'rgba(255,255,255,0.08)' }
            }>
            {sending
              ? <Loader2 className="w-4 h-4 text-white animate-spin" />
              : <Send className="w-4 h-4 text-white" />
            }
          </motion.button>
        </div>
      </div>
    </div>
  );
}