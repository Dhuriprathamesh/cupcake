// src/components/FloatingChat.jsx
// ─── Floating Chat Widget ─────────────────────────────────────────────────────
// Shows on all pages. Notifications auto-dismiss. Full window on click.
// Supports emoji, built-in stickers, custom photo stickers from phone.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpace } from '../context/SpaceContext';
import { db } from '../config/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Send, X, Smile, Image, ChevronDown, Loader2 } from 'lucide-react';
import { playClick, playDing } from '../utils/soundEngine';

// ── Built-in quick emojis ─────────────────────────────────────────────────────
const QUICK_EMOJIS = ['❤️','🔥','😂','💀','😭','👀','🧁','✨','😤','🥺','🎉','💯','👑','🫠','😈','🤝'];
const QUICK_STICKERS = [
  { id:'qs1', e:'🧁', l:'Cupcake' },{ id:'qs2', e:'💀', l:'Dead'   },
  { id:'qs3', e:'🤡', l:'Clown'   },{ id:'qs4', e:'🏆', l:'Winner' },
  { id:'qs5', e:'😤', l:'Salty'   },{ id:'qs6', e:'🚀', l:'Rocket' },
  { id:'qs7', e:'🧠', l:'BigBrain'},{ id:'qs8', e:'🎭', l:'Drama'  },
  { id:'qs9', e:'🌚', l:'Sheesh'  },{ id:'qs10',e:'💅', l:'Unboth' },
  { id:'qs11',e:'🫡', l:'Salute'  },{ id:'qs12',e:'🫠', l:'Melt'   },
];
const REACTIONS = ['❤️','🔥','😂','👀','😮','💀','🥺','✨'];

// ── Unread counter stored in memory per session ────────────────────────────────
let _lastSeenTs = parseInt(localStorage.getItem('fchat_last_seen') ?? '0');

function markSeen() {
  _lastSeenTs = Date.now();
  localStorage.setItem('fchat_last_seen', String(_lastSeenTs));
}

// ── Mini message bubble ────────────────────────────────────────────────────────
function MiniBubble({ msg, isMe }) {
  return (
    <motion.div
      initial={{ opacity:0, y:8, scale:0.9 }}
      animate={{ opacity:1, y:0, scale:1 }}
      exit={{    opacity:0, y:-8, scale:0.9 }}
      transition={{ type:'spring', stiffness:300, damping:22 }}
      className={`max-w-[200px] px-3 py-2 rounded-2xl text-sm text-white leading-snug break-words ${
        isMe ? 'rounded-br-md' : 'rounded-bl-md'
      }`}
      style={isMe
        ? { background:'linear-gradient(135deg,#7C3AED,#EC4899)', boxShadow:'0 4px 16px rgba(124,58,237,0.4)' }
        : { background:'rgba(30,22,58,0.95)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.08)' }
      }>
      {msg.isSticker || msg.isCustomSticker
        ? <span className="text-4xl">{msg.text}</span>
        : <><span className="text-[9px] font-mono opacity-60 block">{isMe?'You':msg.name}</span>{msg.text}</>
      }
    </motion.div>
  );
}

// ── Full message row (inside floating window) ──────────────────────────────────
function FullBubble({ msg, isMe, onReact }) {
  const [hover, setHover] = useState(false);
  const reactCounts = Object.values(msg.reactions??{}).reduce((a,r)=>{ a[r]=(a[r]||0)+1; return a; },{});

  return (
    <div className={`flex items-end gap-1.5 ${isMe?'flex-row-reverse':'flex-row'} group`}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
      <div className="w-6 h-6 rounded-full bg-cozy-soft border border-white/10 flex items-center justify-center text-xs flex-shrink-0 mb-0.5">
        {msg.avatar||'👤'}
      </div>
      <div className={`flex flex-col max-w-[75%] ${isMe?'items-end':'items-start'} gap-0.5`}>
        {msg.isCustomSticker ? (
          <img src={msg.text} alt="sticker" className="w-20 h-20 object-cover rounded-2xl" />
        ) : msg.isSticker ? (
          <span className="text-4xl py-0.5">{msg.text}</span>
        ) : (
          <div className={`px-3 py-2 rounded-2xl text-[13px] leading-snug break-words ${
            isMe ? 'rounded-br-sm text-white' : 'text-white rounded-bl-sm border border-white/8'
          }`}
            style={isMe
              ? { background:'linear-gradient(135deg,#7C3AED,#EC4899)' }
              : { background:'rgba(25,16,48,0.9)' }
            }>{msg.text}</div>
        )}
        {Object.keys(reactCounts).length>0 && (
          <div className="flex gap-0.5">
            {Object.entries(reactCounts).map(([e,c])=>(
              <span key={e} className="text-[10px] px-1 py-0.5 rounded-full border border-white/8"
                style={{ background:'rgba(15,8,32,0.9)', cursor:'pointer' }}
                onClick={()=>onReact(msg.id,e)}>{e}{c>1?` ${c}`:''}</span>
            ))}
          </div>
        )}
        <span className="text-[8px] text-cozy-muted/40 font-mono px-0.5">{msg.time}</span>
        {/* React bar */}
        <AnimatePresence>
          {hover && (
            <motion.div initial={{opacity:0,scale:0.8,y:4}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.8,y:4}}
              transition={{duration:0.12}}
              className={`flex gap-0.5 px-1.5 py-1 rounded-full border border-white/8 ${isMe?'self-end':'self-start'}`}
              style={{background:'rgba(8,4,20,0.97)',backdropFilter:'blur(16px)'}}>
              {REACTIONS.map(r=>(
                <motion.button key={r} whileHover={{scale:1.5}} whileTap={{scale:0.7}}
                  onClick={()=>{onReact(msg.id,r); playClick();}}
                  className="text-xs cursor-pointer p-0.5 rounded">{r}</motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN FLOATING CHAT
// ══════════════════════════════════════════════════════════════════════════════
export default function FloatingChat() {
  const { user, partner, roomData } = useSpace();

  const [open,       setOpen]       = useState(false);
  const [input,      setInput]      = useState('');
  const [sending,    setSending]    = useState(false);
  const [picker,     setPicker]     = useState(null); // null|'emoji'|'sticker'|'custom'
  const [notification, setNotification] = useState(null); // latest msg for 3s preview
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [uploading,    setUploading]    = useState(false);

  const messages     = roomData?.messages     ?? [];
  const customStickers = roomData?.customStickers ?? [];
  const bottomRef    = useRef(null);
  const fileRef      = useRef(null);
  const inputRef     = useRef(null);

  // ── Auto-scroll on new message ─────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:'smooth' }), 60);
    }
  }, [messages.length, open]);

  // ── Show notification on new message from partner ─────────────────────────
  useEffect(() => {
    if (!messages.length || !user) return;
    const latest = messages[messages.length - 1];
    // Only show if from partner & newer than last seen
    if (latest.uid !== user.uid && latest.ts > _lastSeenTs) {
      if (!open) {
        setNotification(latest);
        setUnreadCount(messages.filter(m => m.uid !== user.uid && m.ts > _lastSeenTs).length);
        playDing();
        setTimeout(() => setNotification(null), 3500);
      }
    }
  }, [messages.length]);

  // ── Mark seen when opening ─────────────────────────────────────────────────
  useEffect(() => {
    if (open) { markSeen(); setUnreadCount(0); setNotification(null); }
  }, [open]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const sendMsg = useCallback(async (text, isSticker=false, isCustomSticker=false) => {
    if ((!text.trim() && !isSticker && !isCustomSticker) || !user?.activeRoomId) return;
    setSending(true);
    const newMsg = {
      id:              `${Date.now()}_${Math.random().toString(36).substring(2,5)}`,
      uid:             user.uid,
      name:            user.name,
      avatar:          user.avatar,
      text:            text,
      isSticker,
      isCustomSticker,
      reactions:       {},
      time:            new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
      ts:              Date.now(),
    };
    try {
      await updateDoc(doc(db,'rooms',user.activeRoomId), { messages:arrayUnion(newMsg) });
      setInput(''); setPicker(null);
    } catch(e) { console.error(e); }
    finally { setSending(false); inputRef.current?.focus(); }
  }, [user?.activeRoomId, user?.uid]);

  // ── React ──────────────────────────────────────────────────────────────────
  const handleReact = async (msgId, reaction) => {
    if (!user?.activeRoomId) return;
    const updated = messages.map(m =>
      m.id !== msgId ? m : { ...m, reactions:{ ...(m.reactions??{}), [user.uid]:reaction } }
    );
    await updateDoc(doc(db,'rooms',user.activeRoomId), { messages:updated });
  };

  // ── Custom sticker upload ──────────────────────────────────────────────────
  const handleStickerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 300 * 1024) { alert('Sticker max size is 300KB'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      const sticker = {
        id:          `cs_${Date.now()}`,
        dataUrl,
        addedBy:     user.uid,
        addedByName: user.name,
        ts:          Date.now(),
      };
      await updateDoc(doc(db,'rooms',user.activeRoomId), { customStickers:arrayUnion(sticker) });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  if (!user?.activeRoomId) return null;
  const isPartnerHere = !!partner;

  return (
    <>
      {/* ── NOTIFICATION TOAST (auto-hides after 3.5s) ──────────────── */}
      <AnimatePresence>
        {notification && !open && (
          <motion.div
            key={notification.id}
            initial={{ opacity:0, x:60, scale:0.85 }}
            animate={{ opacity:1, x:0,  scale:1   }}
            exit={{    opacity:0, x:60, scale:0.85 }}
            transition={{ type:'spring', stiffness:260, damping:22 }}
            className="fixed z-[90] flex items-end gap-2"
            style={{ bottom: 'calc(env(safe-area-inset-bottom,0px) + 88px)', right:'72px' }}
            onClick={() => { setOpen(true); setNotification(null); }}>
            <MiniBubble msg={notification} isMe={false} />
            {/* Arrow pointing to button */}
            <div className="w-2 h-2 rounded-full flex-shrink-0 mb-2 animate-pulse"
              style={{ background:'#EC4899' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB (Floating Action Button) ────────────────────────────── */}
      <motion.div
        className="fixed z-[95]"
        style={{ bottom: 'calc(env(safe-area-inset-bottom,0px) + 80px)', right:'16px' }}>

        <motion.button
          whileHover={{ scale:1.08 }}
          whileTap={{ scale:0.88 }}
          onClick={() => { setOpen(p=>!p); playClick(); }}
          className="relative w-13 h-13 rounded-full flex items-center justify-center shadow-2xl cursor-pointer border-2 border-white/20"
          style={{
            width:52, height:52,
            background: open
              ? 'linear-gradient(135deg,#553C9A,#E53E3E)'
              : 'linear-gradient(135deg,#7C3AED,#EC4899)',
            boxShadow:'0 4px 24px rgba(124,58,237,0.5)',
          }}>
          <AnimatePresence mode="wait">
            {open
              ? <motion.span key="close" initial={{rotate:-90,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:90,opacity:0}} transition={{duration:0.18}}>
                  <X className="w-5 h-5 text-white" />
                </motion.span>
              : <motion.span key="chat" initial={{rotate:90,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:-90,opacity:0}} transition={{duration:0.18}}
                  className="text-xl">💬</motion.span>
            }
          </AnimatePresence>

          {/* Unread badge */}
          <AnimatePresence>
            {unreadCount > 0 && !open && (
              <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}
                transition={{type:'spring',stiffness:400}}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white border-2 border-black"
                style={{ background:'#22C55E', boxShadow:'0 0 8px rgba(34,197,94,0.6)' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Green online dot */}
          {isPartnerHere && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-black animate-pulse" />
          )}
        </motion.button>
      </motion.div>

      {/* ── FLOATING CHAT WINDOW ─────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, scale:0.85, y:30, originX:1, originY:1 }}
            animate={{ opacity:1, scale:1,    y:0  }}
            exit={{    opacity:0, scale:0.85, y:30  }}
            transition={{ type:'spring', stiffness:280, damping:26 }}
            className="fixed z-[92] flex flex-col rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
            style={{
              bottom:  'calc(env(safe-area-inset-bottom,0px) + 145px)',
              right:   '14px',
              width:   'min(340px, calc(100vw - 28px))',
              height:  'min(480px, calc(100vh - 200px))',
              background: 'rgba(8,4,20,0.97)',
              backdropFilter: 'blur(32px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
            }}>

            {/* ── Window header ── */}
            <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 border-b border-white/5"
              style={{ background:'rgba(12,6,28,0.9)' }}>
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-cozy-soft border border-white/10 flex items-center justify-center text-base">
                  {partner?.avatar || '👤'}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0c0618] ${isPartnerHere?'bg-emerald-400 animate-pulse':'bg-gray-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate" style={{ fontFamily:'Syne,sans-serif' }}>
                  {partner?.name || 'Your Partner'}
                </p>
                <p className="text-[9px] font-mono" style={{ color:isPartnerHere?'#34D399':'#9E97B8' }}>
                  {isPartnerHere ? '● online' : '○ not connected'}
                </p>
              </div>
              {/* Typing indicator */}
              <AnimatePresence>
                {partner?.isTyping && (
                  <motion.div initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:10}}
                    className="flex gap-0.5">
                    {[0,1,2].map(i=>(
                      <motion.span key={i} animate={{y:[0,-3,0]}} transition={{repeat:Infinity,duration:0.6,delay:i*0.15}}
                        className="w-1 h-1 rounded-full bg-accent-pink inline-block" />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button whileHover={{rotate:90,scale:1.1}} whileTap={{scale:0.85}}
                onClick={()=>{setOpen(false); setPicker(null);}}
                className="text-cozy-muted hover:text-white cursor-pointer p-1 transition-all flex-shrink-0">
                <ChevronDown className="w-4 h-4" />
              </motion.button>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-2 opacity-40">
                  <span className="text-4xl">💬</span>
                  <p className="text-[10px] text-cozy-muted font-light">No messages yet</p>
                </div>
              ) : (
                messages.map(msg => (
                  <FullBubble key={msg.id} msg={msg} isMe={msg.uid===user.uid} onReact={handleReact} />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* ── Emoji / Sticker picker ── */}
            <AnimatePresence>
              {picker && (
                <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}}
                  exit={{height:0,opacity:0}} transition={{duration:0.18}}
                  className="flex-shrink-0 border-t border-white/5 overflow-hidden"
                  style={{background:'rgba(6,3,16,0.98)'}}>
                  {picker==='emoji' && (
                    <div className="flex flex-wrap gap-1.5 p-3">
                      {QUICK_EMOJIS.map(e=>(
                        <motion.button key={e} whileHover={{scale:1.35}} whileTap={{scale:0.75}}
                          onClick={()=>sendMsg(e)}
                          className="w-8 h-8 text-lg flex items-center justify-center rounded-xl hover:bg-white/8 cursor-pointer transition-colors">
                          {e}
                        </motion.button>
                      ))}
                    </div>
                  )}
                  {picker==='sticker' && (
                    <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
                      {/* Built-in stickers */}
                      <p className="text-[8px] font-mono text-cozy-muted uppercase tracking-widest">Built-in Stickers</p>
                      <div className="grid grid-cols-6 gap-1.5">
                        {QUICK_STICKERS.map(s=>(
                          <motion.button key={s.id} whileHover={{scale:1.2,rotate:[-3,3,0]}} whileTap={{scale:0.8}}
                            onClick={()=>sendMsg(s.e,true)}
                            className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl hover:bg-white/8 cursor-pointer transition-colors">
                            <span className="text-2xl">{s.e}</span>
                            <span className="text-[7px] font-mono text-cozy-muted">{s.l}</span>
                          </motion.button>
                        ))}
                      </div>
                      {/* Custom stickers */}
                      {customStickers.length > 0 && (
                        <>
                          <p className="text-[8px] font-mono text-cozy-muted uppercase tracking-widest">Your Stickers</p>
                          <div className="grid grid-cols-4 gap-1.5">
                            {customStickers.map(cs=>(
                              <motion.button key={cs.id} whileHover={{scale:1.1}} whileTap={{scale:0.85}}
                                onClick={()=>sendMsg(cs.dataUrl,false,true)}
                                className="rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-accent-purple/40 transition-all">
                                <img src={cs.dataUrl} alt="sticker" className="w-full h-14 object-cover" />
                              </motion.button>
                            ))}
                          </div>
                        </>
                      )}
                      {/* Upload button */}
                      <motion.div whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                        onClick={()=>fileRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-accent-purple/30 cursor-pointer hover:border-accent-purple/60 transition-all"
                        style={{background:'rgba(124,58,237,0.06)'}}>
                        {uploading
                          ? <Loader2 className="w-4 h-4 text-accent-purple animate-spin" />
                          : <Image className="w-4 h-4 text-accent-purple" />
                        }
                        <span className="text-[10px] font-mono text-accent-purple">
                          {uploading ? 'Uploading...' : 'Add your sticker from phone'}
                        </span>
                      </motion.div>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleStickerUpload} />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Picker toggles ── */}
            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 pt-2 pb-1 border-t border-white/5">
              {[{id:'emoji',icon:'😊'},{id:'sticker',icon:'🧁'}].map(t=>(
                <button key={t.id} onClick={()=>setPicker(p=>p===t.id?null:t.id)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold uppercase border cursor-pointer transition-all ${
                    picker===t.id?'bg-accent-purple/20 border-accent-purple/40 text-accent-purple':'bg-white/3 border-white/6 text-cozy-muted'
                  }`}>
                  {t.icon}
                </button>
              ))}
            </div>

            {/* ── Input ── */}
            <div className="flex-shrink-0 flex items-end gap-2 px-3 pb-3">
              <div className="flex-1 flex items-end rounded-2xl border border-white/10 focus-within:border-accent-purple/50 transition-all overflow-hidden"
                style={{background:'rgba(255,255,255,0.05)'}}>
                <textarea ref={inputRef} rows={1} value={input}
                  onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg(input);}}}
                  placeholder={isPartnerHere?'Message...':'Partner offline...'}
                  disabled={!isPartnerHere}
                  className="flex-1 bg-transparent px-3 py-2 text-white placeholder:text-cozy-muted/30 focus:outline-none text-sm font-light resize-none leading-relaxed disabled:opacity-40"
                  style={{fontSize:'16px',maxHeight:'72px'}} />
              </div>
              <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.88}}
                onClick={()=>sendMsg(input)}
                disabled={!input.trim()||sending||!isPartnerHere}
                className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-30 flex-shrink-0"
                style={input.trim()
                  ? {background:'linear-gradient(135deg,#7C3AED,#EC4899)',boxShadow:'0 4px 16px rgba(124,58,237,0.4)'}
                  : {background:'rgba(255,255,255,0.06)'}}>
                {sending
                  ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  : <Send className="w-3.5 h-3.5 text-white" />
                }
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}