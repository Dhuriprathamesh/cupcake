// src/pages/World/MemorySpace.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpace } from '../../context/SpaceContext';
import { db, storage } from '../../config/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
  Heart, Camera, Award, Calendar, Plus, X, Loader2,
  Star, Trophy, Zap, Sparkles, Clock, Image, Video,
  Pin, Trash2, SmilePlus, Share2, TrendingUp,
} from 'lucide-react';

// ── Memory type config ────────────────────────────────────────────────────────
const MEMORY_TYPES = [
  { id:'moment',    label:'Sweet Moment', icon:Heart,    color:'#FF6B97', bg:'rgba(255,107,151,0.12)', border:'rgba(255,107,151,0.25)', emoji:'❤️' },
  { id:'milestone', label:'Milestone',    icon:Award,    color:'#FCD34D', bg:'rgba(252,211,77,0.12)',  border:'rgba(252,211,77,0.25)',  emoji:'🏆' },
  { id:'win',       label:'Game Win',     icon:Trophy,   color:'#8B5CF6', bg:'rgba(139,92,246,0.12)', border:'rgba(139,92,246,0.25)',  emoji:'🎮' },
  { id:'memory',    label:'Memory',       icon:Camera,   color:'#06B6D4', bg:'rgba(6,182,212,0.12)',  border:'rgba(6,182,212,0.25)',   emoji:'📸' },
  { id:'highlight', label:'Highlight',    icon:Star,     color:'#FB923C', bg:'rgba(251,146,60,0.12)', border:'rgba(251,146,60,0.25)',  emoji:'⭐' },
  { id:'chaos',     label:'Chaotic Moment',icon:Sparkles,color:'#FF4DC4', bg:'rgba(255,77,196,0.12)', border:'rgba(255,77,196,0.25)',  emoji:'🤡' },
  { id:'photo',     label:'Photo Memory', icon:Image,    color:'#34D399', bg:'rgba(52,211,153,0.12)', border:'rgba(52,211,153,0.25)',  emoji:'📷' },
  { id:'video',     label:'Video Moment', icon:Video,    color:'#60A5FA', bg:'rgba(96,165,250,0.12)', border:'rgba(96,165,250,0.25)',  emoji:'🎬' },
];

const REACTIONS_LIST = ['❤️','😂','😮','🔥','💀','🥺','✨','👑'];

function getType(id) { return MEMORY_TYPES.find(t => t.id === id) ?? MEMORY_TYPES[0]; }

// ── Random funny caption suggestions ────────────────────────────────────────
const FUNNY_CAPTIONS = [
  "proof that we survived this",
  "no context needed. or maybe a lot of context",
  "historians will study this moment",
  "peak duo behaviour",
  "this is going in the chaos archives",
  "we were normal once. briefly.",
  "documentation of the incident",
  "no one will believe us anyway",
];

// ── Upload Progress Ring ──────────────────────────────────────────────────────
function UploadRing({ progress }) {
  const r = 18, c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;
  return (
    <svg width="48" height="48" className="rotate-[-90deg]">
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
      <circle cx="24" cy="24" r={r} fill="none" stroke="#34D399" strokeWidth="3"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition:'stroke-dashoffset 0.3s ease' }} />
    </svg>
  );
}

// ── Media thumbnail in card ───────────────────────────────────────────────────
function MediaThumb({ url, mediaType, onClick }) {
  if (!url) return null;
  if (mediaType === 'video') {
    return (
      <div className="relative rounded-xl overflow-hidden cursor-pointer group" onClick={onClick}>
        <video src={url} className="w-full h-28 object-cover" muted />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <span className="text-white text-lg ml-0.5">▶</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative rounded-xl overflow-hidden cursor-pointer group" onClick={onClick}>
      <img src={url} alt="memory" className="w-full h-28 object-cover transition-transform group-hover:scale-105" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all" />
    </div>
  );
}

// ── Full media viewer ─────────────────────────────────────────────────────────
function MediaViewer({ url, mediaType, onClose }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.95)', backdropFilter:'blur(20px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale:0.8 }} animate={{ scale:1 }} exit={{ scale:0.8 }}
        transition={{ type:'spring', stiffness:200 }} onClick={e => e.stopPropagation()}>
        {mediaType === 'video'
          ? <video src={url} controls autoPlay className="max-w-full max-h-[80vh] rounded-2xl" />
          : <img src={url} alt="Memory" className="max-w-full max-h-[80vh] rounded-2xl object-contain" />
        }
      </motion.div>
      <button onClick={onClose} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer hover:bg-white/20 transition-all">
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ── Memory Card ───────────────────────────────────────────────────────────────
function MemoryCard({ memory, index, currentUserId, roomId, onReact, onPin, onDelete, onView }) {
  const t    = getType(memory.type);
  const Icon = t.icon;
  const [flipped,     setFlipped]     = useState(false);
  const [showMedia,   setShowMedia]   = useState(false);
  const [showReacts,  setShowReacts]  = useState(false);
  const isPinned    = memory.pinned === true;
  const myReaction  = (memory.reactions ?? {})[currentUserId];
  const allReactions= memory.reactions ?? {};
  const reactCounts = Object.values(allReactions).reduce((acc, r) => { acc[r] = (acc[r]||0)+1; return acc; }, {});
  const isMyCard    = memory.uid === currentUserId;

  return (
    <>
      <motion.div
        initial={{ opacity:0, y:20, rotate: index % 2 === 0 ? -1.5 : 1.5 }}
        animate={{ opacity:1, y:0,  rotate:0 }}
        transition={{ delay: Math.min(index * 0.04, 0.4), duration:0.35, type:'spring', stiffness:200 }}
        whileHover={{ y:-5, scale:1.02 }}
        className="cursor-pointer group"
        style={{ perspective:'1000px' }}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration:0.5, type:'spring', stiffness:150 }}
          className="relative rounded-2xl overflow-hidden"
          style={{ transformStyle:'preserve-3d', minHeight: memory.mediaUrl ? 260 : 180 }}
          onClick={() => !showReacts && setFlipped(p => !p)}
        >
          {/* ── FRONT ── */}
          <div className="absolute inset-0 rounded-2xl flex flex-col border"
            style={{ background:`linear-gradient(135deg,${t.bg},rgba(13,10,26,0.95))`, borderColor: isPinned ? t.color : t.border, backfaceVisibility:'hidden',
              boxShadow: isPinned ? `0 0 20px ${t.color}30` : 'none' }}>

            {/* Top glow line */}
            <div className="absolute top-0 inset-x-0 h-0.5 rounded-t-2xl"
              style={{ background:`linear-gradient(90deg,transparent,${t.color}80,transparent)` }} />

            {/* Pinned badge */}
            {isPinned && (
              <div className="absolute top-2 right-2 z-10">
                <motion.div animate={{ rotate:[0,-10,10,-5,0] }} transition={{ repeat:Infinity, duration:4 }}>
                  <Pin className="w-4 h-4" style={{ color:t.color }} />
                </motion.div>
              </div>
            )}

            {/* Media */}
            {memory.mediaUrl && (
              <div className="flex-shrink-0 px-3 pt-3">
                <MediaThumb url={memory.mediaUrl} mediaType={memory.mediaType}
                  onClick={(e) => { e.stopPropagation(); setShowMedia(true); }} />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[9px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background:`${t.color}20`, color:t.color, border:`1px solid ${t.color}30` }}>
                  <Icon className="w-3 h-3" />{t.label}
                </div>
                <span className="text-lg flex-shrink-0">{t.emoji}</span>
              </div>

              <p className="text-sm text-white/90 font-light leading-relaxed mt-2 flex-1">{memory.text}</p>

              {/* Reactions row */}
              {Object.keys(reactCounts).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(reactCounts).map(([emoji, count]) => (
                    <span key={emoji} className="text-[11px] px-1.5 py-0.5 rounded-full border border-white/10"
                      style={{ background:'rgba(255,255,255,0.06)' }}>
                      {emoji}{count > 1 ? ` ${count}` : ''}
                    </span>
                  ))}
                </div>
              )}

              {/* Bottom bar */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                <span className="text-[9px] font-mono text-cozy-muted flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />{memory.date}
                </span>
                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  {/* React */}
                  <motion.button whileHover={{ scale:1.2 }} whileTap={{ scale:0.8 }}
                    onClick={() => setShowReacts(p => !p)}
                    className="text-base cursor-pointer hover:scale-110 transition-transform">
                    {myReaction || '😊'}
                  </motion.button>
                  {/* Pin */}
                  <motion.button whileHover={{ scale:1.15 }} whileTap={{ scale:0.85 }}
                    onClick={() => onPin(memory.id, !isPinned)}
                    className="cursor-pointer transition-all text-cozy-muted hover:text-white">
                    <Pin className="w-3 h-3" />
                  </motion.button>
                  {/* Delete (only own) */}
                  {isMyCard && (
                    <motion.button whileHover={{ scale:1.15 }} whileTap={{ scale:0.85 }}
                      onClick={() => onDelete(memory.id)}
                      className="cursor-pointer text-red-400/40 hover:text-red-400 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </motion.button>
                  )}
                  <span className="text-[8px] font-mono text-cozy-muted/50">flip</span>
                </div>
              </div>
            </div>

            {/* Reaction picker */}
            <AnimatePresence>
              {showReacts && (
                <motion.div initial={{ opacity:0, scale:0.8, y:8 }} animate={{ opacity:1, scale:1, y:0 }}
                  exit={{ opacity:0, scale:0.8, y:8 }}
                  className="absolute bottom-10 right-3 z-20 flex gap-1 p-2 rounded-2xl border border-white/10"
                  style={{ background:'rgba(10,5,25,0.97)', backdropFilter:'blur(16px)' }}
                  onClick={e => e.stopPropagation()}>
                  {REACTIONS_LIST.map(r => (
                    <motion.button key={r} whileHover={{ scale:1.4 }} whileTap={{ scale:0.7 }}
                      onClick={() => { onReact(memory.id, r); setShowReacts(false); }}
                      className={`text-lg cursor-pointer p-0.5 rounded-lg transition-all ${myReaction===r?'bg-white/15':''}`}>
                      {r}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── BACK ── */}
          <div className="absolute inset-0 rounded-2xl p-5 flex flex-col items-center justify-center border text-center gap-3"
            style={{ background:`linear-gradient(135deg,rgba(13,10,26,0.97),${t.bg})`, borderColor:t.border, backfaceVisibility:'hidden', transform:'rotateY(180deg)' }}>
            <span className="text-5xl">{t.emoji}</span>
            <div className="space-y-0.5">
              <p className="text-[10px] font-mono text-cozy-muted">Saved by</p>
              <p className="text-base font-black text-white" style={{ fontFamily:'Syne,sans-serif' }}>{memory.savedBy}</p>
            </div>
            <p className="text-[9px] font-mono" style={{ color:t.color }}>{memory.date}</p>
            {memory.xp && (
              <div className="flex items-center gap-1 text-[9px] font-mono" style={{ color:t.color }}>
                <Zap className="w-3 h-3" />+{memory.xp} XP
              </div>
            )}
            <p className="text-[8px] font-mono text-cozy-muted/40 mt-2">tap to flip back</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Media viewer */}
      <AnimatePresence>
        {showMedia && (
          <MediaViewer url={memory.mediaUrl} mediaType={memory.mediaType} onClose={() => setShowMedia(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Add Memory Modal ──────────────────────────────────────────────────────────
function AddModal({ onClose, onSave, saving, roomId, userUid }) {
  const [text,      setText]      = useState('');
  const [type,      setType]      = useState('moment');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl,  setMediaUrl]  = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [error,     setError]     = useState('');
  const fileRef = useRef();
  const t = getType(type);

  // Random funny caption suggestion
  const [captionHint] = useState(FUNNY_CAPTIONS[Math.floor(Math.random()*FUNNY_CAPTIONS.length)]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');

    if (!isImg && !isVid) { setError('Only images or videos please!'); return; }
    if (file.size > 15 * 1024 * 1024) { setError('Max file size is 15MB.'); return; }

    setUploading(true); setError('');
    try {
      // Upload to Firebase Storage
      const path    = `memories/${roomId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      const task    = uploadBytesResumable(storageRef, file);

      task.on('state_changed',
        (snap) => setUploadPct(Math.round((snap.bytesTransferred/snap.totalBytes)*100)),
        (err)  => { console.error(err); setError('Upload failed. Try again.'); setUploading(false); },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          setMediaUrl(url);
          setMediaType(isImg ? 'image' : 'video');
          setUploading(false);
          // Auto-set type
          if (isImg) setType('photo');
          if (isVid) setType('video');
        }
      );
    } catch (err) {
      setError('Upload error.'); setUploading(false);
    }
  };

  const removeMedia = () => { setMediaUrl(null); setMediaType(null); setUploadPct(0); };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background:'rgba(4,2,10,0.88)', backdropFilter:'blur(16px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ scale:0.92, opacity:0, y:40 }}
        animate={{ scale:1,    opacity:1, y:0  }}
        exit={{    scale:0.92, opacity:0, y:40 }}
        transition={{ type:'spring', stiffness:260, damping:24 }}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border overflow-hidden relative"
        style={{ background:'rgba(12,8,28,0.98)', borderColor:`${t.color}30`, maxHeight:'92vh', overflowY:'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Dynamic top glow */}
        <motion.div animate={{ opacity:[0.4,0.8,0.4] }} transition={{ repeat:Infinity, duration:2 }}
          className="absolute top-0 inset-x-0 h-px"
          style={{ background:`linear-gradient(90deg,transparent,${t.color},transparent)` }} />

        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2" style={{ fontFamily:'Syne,sans-serif' }}>
              <span className="text-xl">{t.emoji}</span> Save a Memory
            </h3>
            <motion.button whileHover={{ rotate:90, scale:1.1 }} onClick={onClose}
              className="text-cozy-muted hover:text-white cursor-pointer p-1 transition-all">
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Type pills — scrollable row */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono text-cozy-muted uppercase tracking-widest">Type</label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 flex-nowrap">
              {MEMORY_TYPES.map(mt => {
                const Icon = mt.icon;
                return (
                  <motion.button key={mt.id} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                    onClick={() => setType(mt.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[9px] font-bold transition-all cursor-pointer flex-shrink-0"
                    style={{
                      background:  type===mt.id ? mt.bg : 'rgba(255,255,255,0.03)',
                      borderColor: type===mt.id ? mt.color : 'rgba(255,255,255,0.08)',
                      color:       type===mt.id ? mt.color : '#9E97B8',
                    }}>
                    <Icon className="w-3 h-3" />{mt.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── MEDIA UPLOAD ── */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono text-cozy-muted uppercase tracking-widest">
              Photo / Video (optional)
            </label>

            {!mediaUrl && !uploading && (
              <motion.div whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed rounded-2xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-all"
                style={{ borderColor:`${t.color}40`, background:`${t.color}05` }}>
                <div className="flex gap-3">
                  <Image className="w-6 h-6" style={{ color:t.color }} />
                  <Video className="w-6 h-6" style={{ color:t.color }} />
                </div>
                <p className="text-xs text-white font-semibold">Tap to add photo or video</p>
                <p className="text-[9px] text-cozy-muted font-mono">JPG, PNG, MP4, MOV · max 15MB</p>
              </motion.div>
            )}

            {uploading && (
              <div className="flex flex-col items-center gap-2 py-4">
                <UploadRing progress={uploadPct} />
                <p className="text-xs font-mono" style={{ color:t.color }}>{uploadPct}% uploading...</p>
              </div>
            )}

            {mediaUrl && (
              <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor:`${t.color}30` }}>
                {mediaType === 'video'
                  ? <video src={mediaUrl} className="w-full max-h-40 object-cover rounded-2xl" controls />
                  : <img src={mediaUrl} alt="preview" className="w-full max-h-40 object-cover rounded-2xl" />
                }
                <button onClick={removeMedia}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white cursor-pointer hover:bg-black/80 transition-all">
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-[9px] font-mono text-white">
                  {mediaType === 'video' ? '🎬 Video' : '📷 Photo'} saved
                </div>
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
          </div>

          {/* Caption */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono text-cozy-muted uppercase tracking-widest">
              What happened? <span className="text-cozy-muted/40 normal-case font-light">(or: "{captionHint}")</span>
            </label>
            <textarea value={text} onChange={e => { setText(e.target.value); setError(''); }}
              placeholder={`e.g. "${captionHint}"`}
              rows={3} maxLength={300} autoFocus
              className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-cozy-muted/25 focus:outline-none transition-all font-light resize-none border"
              style={{ background:'rgba(0,0,0,0.4)', borderColor:`${t.color}20`, fontSize:'16px' }}
              onFocus={e => e.target.style.borderColor=`${t.color}50`}
              onBlur={e => e.target.style.borderColor=`${t.color}20`} />
            <div className="flex justify-between">
              <AnimatePresence>
                {error && <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-[9px] text-red-400 font-mono">{error}</motion.span>}
              </AnimatePresence>
              <span className="text-[9px] font-mono text-cozy-muted ml-auto">{text.length}/300</span>
            </div>
          </div>

          {/* Save */}
          <motion.button
            whileHover={{ scale:1.02, boxShadow:`0 0 30px ${t.color}40` }} whileTap={{ scale:0.97 }}
            onClick={() => {
              if (!text.trim()) { setError('Write something first!'); return; }
              if (uploading)    { setError('Wait for upload to finish!'); return; }
              onSave({ text:text.trim(), type, mediaUrl, mediaType });
            }}
            disabled={saving || uploading || !text.trim()}
            className="w-full py-4 rounded-2xl font-black text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 transition-all"
            style={{ background:`linear-gradient(135deg,${t.color},${t.color}aa)`, color:'#000', borderColor:t.color, fontFamily:'Syne,sans-serif' }}>
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin text-white" /><span className="text-white">Saving...</span></>
              : <>{t.emoji} Save This Memory</>
            }
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Timeline view ─────────────────────────────────────────────────────────────
function TimelineView({ memories, currentUserId, roomId, onReact, onPin, onDelete }) {
  const sorted = [...memories].sort((a,b)=>(b.ts??0)-(a.ts??0));
  if (!sorted.length) return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-40">
      <Clock className="w-10 h-10 text-cozy-muted mx-auto" />
      <p className="text-sm font-bold text-white" style={{ fontFamily:'Syne,sans-serif' }}>No memories yet</p>
    </div>
  );
  return (
    <div className="space-y-4 relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-accent-purple/40 via-accent-pink/20 to-transparent" />
      {sorted.map((mem,i) => {
        const t = getType(mem.type);
        return (
          <motion.div key={mem.id} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
            transition={{ delay:i*0.04 }} className="flex items-start gap-4 pl-2">
            <div className="w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs mt-1 z-10"
              style={{ background:`${t.color}25`, borderColor:t.color }}>{t.emoji}</div>
            <div className="flex-1 rounded-2xl border p-3 space-y-2"
              style={{ background:t.bg, borderColor:t.border }}>
              {mem.mediaUrl && (
                <MediaThumb url={mem.mediaUrl} mediaType={mem.mediaType} onClick={()=>{}} />
              )}
              <div className="flex justify-between gap-2">
                <span className="text-[9px] font-mono font-black uppercase tracking-wider" style={{ color:t.color }}>{t.label}</span>
                <span className="text-[8px] font-mono text-cozy-muted">{mem.date}</span>
              </div>
              <p className="text-xs text-white/90 font-light leading-relaxed">{mem.text}</p>
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-mono text-cozy-muted">by {mem.savedBy}</span>
                <div className="flex gap-1">
                  {Object.entries((mem.reactions??{})).slice(0,3).map(([uid,r])=>(
                    <span key={uid} className="text-sm">{r}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Fun stats panel ───────────────────────────────────────────────────────────
function StatsPanel({ memories, user, partner }) {
  if (!memories.length) return null;
  const byType      = MEMORY_TYPES.map(t => ({ ...t, count: memories.filter(m=>m.type===t.id).length })).filter(t=>t.count>0).sort((a,b)=>b.count-a.count);
  const withMedia   = memories.filter(m=>m.mediaUrl).length;
  const pinned      = memories.filter(m=>m.pinned).length;
  const totalXP     = memories.reduce((acc,m)=>acc+(m.xp??0),0);
  const myCount     = memories.filter(m=>m.uid===user?.uid).length;
  const partCount   = memories.length - myCount;
  const topType     = byType[0];
  const funFacts    = [
    `${withMedia} memories with photos or videos 📸`,
    `${pinned} memories pinned as favourites 📌`,
    `${topType?.count} ${topType?.label?.toLowerCase()} memories — your most saved type ${topType?.emoji}`,
    myCount > partCount
      ? `${user?.name} saves more memories. ${partner?.name || 'Partner'} needs to step up 😤`
      : myCount < partCount
      ? `${partner?.name || 'Partner'} saves more memories. ${user?.name} is slacking 💀`
      : `You both save equally. Perfectly balanced. ⚖️`,
  ];

  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
      className="rounded-2xl border border-white/5 p-4 space-y-4"
      style={{ background:'rgba(13,10,26,0.7)' }}>
      <h4 className="text-xs font-black text-white flex items-center gap-2" style={{ fontFamily:'Syne,sans-serif' }}>
        <TrendingUp className="w-4 h-4 text-accent-purple" /> Duo Archive Stats
      </h4>
      {/* Type breakdown */}
      <div className="space-y-1.5">
        {byType.slice(0,4).map(t => (
          <div key={t.id} className="flex items-center gap-2">
            <span className="text-sm flex-shrink-0">{t.emoji}</span>
            <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full"
                initial={{ width:0 }}
                animate={{ width:`${Math.round((t.count/memories.length)*100)}%` }}
                transition={{ duration:0.8, delay:0.1 }}
                style={{ background:t.color }} />
            </div>
            <span className="text-[9px] font-mono text-cozy-muted w-4 flex-shrink-0">{t.count}</span>
          </div>
        ))}
      </div>
      {/* Fun facts */}
      <div className="space-y-1.5 pt-2 border-t border-white/5">
        <p className="text-[8px] font-mono uppercase tracking-widest text-cozy-muted">Fun Facts</p>
        {funFacts.map((f,i) => (
          <p key={i} className="text-[10px] text-white/70 font-light flex items-start gap-1.5">
            <span className="text-accent-pink flex-shrink-0">·</span>{f}
          </p>
        ))}
      </div>
    </motion.div>
  );
}

// ── MAIN MemorySpace ──────────────────────────────────────────────────────────
export default function MemorySpace() {
  const { user, partner, roomData, addXP, updateActivity } = useSpace();

  const memories   = roomData?.memories ?? [];
  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [filter,    setFilter]    = useState('all');
  const [viewMode,  setViewMode]  = useState('grid');
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    updateActivity('📸 In Duo Archives');
    return () => updateActivity('🌐 In the World');
  }, []);

  const handleSave = async ({ text, type, mediaUrl, mediaType }) => {
    if (!user?.activeRoomId) return;
    setSaving(true);
    const xpAmount = type==='milestone'?60:type==='win'?40:type==='photo'?35:type==='video'?40:25;
    const newMem   = {
      id:        `mem_${Date.now()}_${Math.random().toString(36).substring(2,5)}`,
      text, type, mediaUrl: mediaUrl||null, mediaType: mediaType||null,
      date:      new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
      savedBy:   user.name,
      uid:       user.uid,
      xp:        xpAmount,
      ts:        Date.now(),
      pinned:    false,
      reactions: {},
    };
    try {
      await updateDoc(doc(db,'rooms',user.activeRoomId), {
        memories:                            arrayUnion(newMem),
        'progression.milestonesCount':       (roomData?.progression?.milestonesCount??0)+1,
      });
      await addXP(xpAmount);
      setShowModal(false);
    } catch (err) { console.error('Save failed:', err); }
    finally { setSaving(false); }
  };

  const handleReact = async (memId, reaction) => {
    if (!user?.activeRoomId) return;
    const updated = memories.map(m => {
      if (m.id !== memId) return m;
      const reactions = { ...(m.reactions??{}), [user.uid]: reaction };
      return { ...m, reactions };
    });
    await updateDoc(doc(db,'rooms',user.activeRoomId), { memories: updated });
  };

  const handlePin = async (memId, pinned) => {
    if (!user?.activeRoomId) return;
    const updated = memories.map(m => m.id===memId ? { ...m, pinned } : m);
    await updateDoc(doc(db,'rooms',user.activeRoomId), { memories: updated });
  };

  const handleDelete = async (memId) => {
    if (!user?.activeRoomId) return;
    const updated = memories.filter(m => m.id!==memId);
    await updateDoc(doc(db,'rooms',user.activeRoomId), { memories: updated });
  };

  // Sort: pinned first, then newest
  const sortedAll = [...memories].sort((a,b)=>{
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.ts??0)-(a.ts??0);
  });
  const displayed = filter==='all' ? sortedAll : sortedAll.filter(m=>m.type===filter);

  const totalXP     = memories.reduce((acc,m)=>acc+(m.xp??0),0);
  const withMedia   = memories.filter(m=>m.mediaUrl).length;

  return (
    <div className="min-h-full relative overflow-hidden"
      style={{ background:'linear-gradient(180deg,#100a1e 0%,#07050F 100%)' }}>

      {/* Bg particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['✨','🌟','💫','⭐','🌙'].map((e,i)=>(
          <motion.div key={e} animate={{ y:[0,-40,0],opacity:[0.05,0.2,0.05],rotate:[0,15,-15,0] }}
            transition={{ repeat:Infinity,duration:5+i*2,delay:i*1.2 }}
            className="absolute select-none" style={{ left:`${8+i*20}%`,top:`${8+i*12}%`,fontSize:20+i*6,filter:'blur(1px)' }}>
            {e}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 p-3 md:p-6 max-w-6xl mx-auto space-y-4">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2" style={{ fontFamily:'Syne,sans-serif' }}>
              <motion.span animate={{ rotate:[0,-8,8,0] }} transition={{ repeat:Infinity,duration:4 }}>📸</motion.span>
              Duo Archives
            </h1>
            <p className="text-[10px] text-cozy-muted font-light mt-0.5">
              {memories.length} memories · {withMedia} with media · {totalXP} XP · flip cards to see details
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
              onClick={() => setShowStats(p=>!p)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[9px] font-mono font-bold uppercase cursor-pointer transition-all"
              style={{ background:showStats?'rgba(139,92,246,0.2)':'rgba(255,255,255,0.04)', borderColor:showStats?'rgba(139,92,246,0.5)':'rgba(255,255,255,0.08)', color:showStats?'#8B5CF6':'#9E97B8' }}>
              <TrendingUp className="w-3 h-3" /> Stats
            </motion.button>
            <motion.button
              whileHover={{ scale:1.05,boxShadow:'0 0 30px rgba(255,107,151,0.4)' }} whileTap={{ scale:0.96 }}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-sm cursor-pointer shadow-lg border-2"
              style={{ background:'linear-gradient(135deg,#FF6B97,#8B5CF6)',color:'#fff',borderColor:'rgba(255,255,255,0.2)',fontFamily:'Space Grotesk,sans-serif' }}>
              <Plus className="w-4 h-4" /> Add Memory
            </motion.button>
          </div>
        </div>

        {/* ── STATS ── */}
        <AnimatePresence>
          {showStats && (
            <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }}
              exit={{ opacity:0,height:0 }} className="overflow-hidden">
              <StatsPanel memories={memories} user={user} partner={partner} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STAT PILLS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label:'Total',     value:memories.length,                              emoji:'📦', color:'#8B5CF6' },
            { label:'With Media',value:withMedia,                                    emoji:'📷', color:'#34D399' },
            { label:'XP Earned', value:totalXP,                                      emoji:'⚡', color:'#06B6D4' },
            { label:'Pinned',    value:memories.filter(m=>m.pinned).length,          emoji:'📌', color:'#FCD34D' },
          ].map(({ label,value,emoji,color }) => (
            <div key={label} className="rounded-xl border p-2.5 text-center"
              style={{ background:`${color}08`,borderColor:`${color}20` }}>
              <div className="text-lg mb-0.5">{emoji}</div>
              <div className="text-base font-black text-white" style={{ fontFamily:'Syne,sans-serif',color }}>{value}</div>
              <div className="text-[8px] font-mono text-cozy-muted uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>

        {/* ── FILTER + VIEW SWITCHER ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-nowrap">
            {[{ id:'all',label:'All',emoji:'🌟'}, ...MEMORY_TYPES.map(t=>({ id:t.id,label:t.label,emoji:t.emoji }))].map(tab=>(
              <motion.button key={tab.id} whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                onClick={() => setFilter(tab.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[9px] font-bold uppercase tracking-wide cursor-pointer transition-all flex-shrink-0"
                style={{
                  background:  filter===tab.id?'rgba(139,92,246,0.2)':'rgba(255,255,255,0.03)',
                  borderColor: filter===tab.id?'rgba(139,92,246,0.5)':'rgba(255,255,255,0.06)',
                  color:       filter===tab.id?'#fff':'#9E97B8',
                }}>
                {tab.emoji} {tab.label}
              </motion.button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl p-1 flex-shrink-0">
            {[{id:'grid',icon:'⊞',label:'Grid'},{id:'timeline',icon:'☰',label:'Timeline'}].map(v=>(
              <button key={v.id} onClick={() => setViewMode(v.id)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wide cursor-pointer transition-all ${viewMode===v.id?'bg-accent-purple/30 text-white':'text-cozy-muted hover:text-white'}`}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── MEMORIES ── */}
        <AnimatePresence mode="wait">
          {viewMode==='grid' ? (
            <motion.div key="grid" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              {displayed.length===0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-3 opacity-40">
                  <Camera className="w-12 h-12 text-cozy-muted" />
                  <p className="text-sm font-bold text-white" style={{ fontFamily:'Syne,sans-serif' }}>
                    {filter==='all'?'No memories yet':`No ${filter} memories`}
                  </p>
                  <p className="text-[10px] text-cozy-muted">
                    {filter==='all'?'Click "Add Memory" to start your duo timeline.':'Try a different filter.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {displayed.map((mem,i)=>(
                    <MemoryCard key={mem.id} memory={mem} index={i}
                      currentUserId={user?.uid} roomId={user?.activeRoomId}
                      onReact={handleReact} onPin={handlePin} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="timeline" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <TimelineView memories={displayed} currentUserId={user?.uid}
                roomId={user?.activeRoomId} onReact={handleReact} onPin={handlePin} onDelete={handleDelete} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && (
          <AddModal onClose={()=>setShowModal(false)} onSave={handleSave} saving={saving}
            roomId={user?.activeRoomId} userUid={user?.uid} />
        )}
      </AnimatePresence>
    </div>
  );
}