// src/pages/World/MusicRoom.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpace } from '../../context/SpaceContext';
import { db } from '../../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Play, Pause, SkipForward, SkipBack, Heart, Music2, Radio, Volume2, Shuffle } from 'lucide-react';

const PLAYLIST = [
  { id:1, title:'Midnight Lo-Fi Echoes',  artist:'Duo Session',     duration:214, mood:'🌙', moodLabel:'Calm',       bpm:72,  color:'#8B5CF6' },
  { id:2, title:'Late Night Drive',        artist:'Neon Collective', duration:187, mood:'🚗', moodLabel:'Nostalgic',  bpm:84,  color:'#06B6D4' },
  { id:3, title:'Soft Static',             artist:'Ambient Studio',  duration:242, mood:'☁️', moodLabel:'Dreamy',     bpm:65,  color:'#A78BFA' },
  { id:4, title:'Cozy Corner',             artist:'Lo-Fi House',     duration:198, mood:'🍵', moodLabel:'Cozy',       bpm:78,  color:'#34D399' },
  { id:5, title:'Electric Dusk',           artist:'Synthwave Lab',   duration:223, mood:'⚡', moodLabel:'Energetic',  bpm:110, color:'#FCD34D' },
  { id:6, title:'Rain on Glass',           artist:'Ambient Studio',  duration:267, mood:'🌧️',moodLabel:'Melancholy', bpm:60,  color:'#60A5FA' },
  { id:7, title:'Together Somewhere',      artist:'Duo Session',     duration:201, mood:'❤️', moodLabel:'Romantic',   bpm:76,  color:'#FF6B97' },
  { id:8, title:'Morning Haze',            artist:'Chill Frames',    duration:178, mood:'🌅', moodLabel:'Fresh',      bpm:88,  color:'#FB923C' },
];

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Vinyl disc ────────────────────────────────────────────────────────────────
function VinylDisc({ isPlaying, color }) {
  return (
    <div className="relative w-36 h-36 md:w-44 md:h-44 mx-auto">
      {/* Outer glow ring */}
      <motion.div
        animate={{ opacity: isPlaying ? [0.4, 0.9, 0.4] : 0.2 }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute inset-[-12px] rounded-full"
        style={{ background: `radial-gradient(circle, ${color}30 0%, transparent 70%)` }}
      />
      {/* Spinning disc */}
      <motion.div
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
        className="w-full h-full rounded-full border-4 border-white/10 overflow-hidden relative"
        style={{ background: `conic-gradient(from 0deg, #0a0a1a, ${color}40, #0a0a1a, ${color}20, #0a0a1a)` }}
      >
        {/* Groove rings */}
        {[40, 60, 72, 80, 86].map(size => (
          <div key={size} className="absolute inset-0 rounded-full border border-white/5 m-auto"
            style={{ width:`${size}%`, height:`${size}%`, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }} />
        ))}
        {/* Center hole */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white/20"
          style={{ background: color + '60' }} />
      </motion.div>
      {/* Tonearm */}
      <motion.div
        animate={{ rotate: isPlaying ? 12 : 2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute -top-2 -right-2 w-14 h-0.5 rounded-full origin-right"
        style={{ background: 'rgba(255,255,255,0.4)', transformOrigin: 'right center' }}
      >
        <div className="absolute left-0 -top-1 w-1.5 h-1.5 rounded-full bg-white/60" />
      </motion.div>
    </div>
  );
}

// ── Animated waveform bars ────────────────────────────────────────────────────
function Waveform({ isPlaying, color, bars = 32 }) {
  return (
    <div className="flex items-end gap-0.5 h-12 w-full px-2">
      {Array.from({ length: bars }).map((_, i) => {
        const height = 15 + Math.abs(Math.sin(i * 0.4 + i * 0.1)) * 70;
        return (
          <motion.div
            key={i}
            className="flex-1 rounded-full"
            style={{ background: `linear-gradient(to top, ${color}, ${color}50)` }}
            animate={isPlaying
              ? { scaleY: [0.2, height / 100, 0.3, height * 0.7 / 100, 0.2] }
              : { scaleY: 0.15 }
            }
            transition={{
              repeat: Infinity,
              duration: 0.4 + (i % 5) * 0.12,
              delay: i * 0.02,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}

// ── Lyrics ticker (simulated) ─────────────────────────────────────────────────
const LYRICS_LINES = [
  "late nights, same screen, different city 🌙",
  "your playlist hits different at 2am ✨",
  "we don't need to be in the same room 💫",
  "just the same song at the same time ❤️",
  "this is our universe, nobody else invited 🚀",
  "vibing together across the distance 🎵",
];

function LyricsTicker({ isPlaying, trackId }) {
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => setLineIdx(i => (i + 1) % LYRICS_LINES.length), 4000);
    return () => clearInterval(t);
  }, [isPlaying, trackId]);

  return (
    <div className="h-6 overflow-hidden flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={lineIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1,  y: 0  }}
          exit={{    opacity: 0,  y: -10 }}
          transition={{ duration: 0.4 }}
          className="text-[10px] font-mono text-center italic"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          {isPlaying ? LYRICS_LINES[lineIdx] : '— paused —'}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export default function MusicRoom() {
  const { user, partner, roomData, updateActivity } = useSpace();

  const musicState  = roomData?.musicState ?? {};
  const isPlaying   = musicState.playing   ?? false;
  const trackId     = musicState.trackId   ?? PLAYLIST[0].id;
  const progress    = musicState.progress  ?? 0;
  const likedBy     = musicState.likedBy   ?? [];

  const track      = PLAYLIST.find(t => t.id === trackId) ?? PLAYLIST[0];
  const trackIdx   = PLAYLIST.findIndex(t => t.id === track.id);

  const [localProgress, setLocalProgress] = useState(progress);
  const [isDragging,    setIsDragging]    = useState(false);
  const [shuffled,      setShuffled]      = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    updateActivity('🎵 In Music Room');
    return () => updateActivity('🌐 In the World');
  }, []);

  useEffect(() => {
    if (!isDragging) setLocalProgress(progress);
  }, [progress, isDragging]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (!isPlaying) return;
    intervalRef.current = setInterval(() => {
      setLocalProgress(prev => {
        const next = prev + 1;
        if (next >= track.duration) { handleNext(); return 0; }
        return next;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, track.id]);

  const write = useCallback(async (patch) => {
    if (!user?.activeRoomId) return;
    const updates = {};
    Object.entries(patch).forEach(([k, v]) => { updates[`musicState.${k}`] = v; });
    await updateDoc(doc(db, 'rooms', user.activeRoomId), updates);
  }, [user?.activeRoomId]);

  const handlePlayPause = () => write({ playing: !isPlaying, progress: localProgress });

  const handleNext = () => {
    const nextIdx = shuffled
      ? Math.floor(Math.random() * PLAYLIST.length)
      : (trackIdx + 1) % PLAYLIST.length;
    write({ trackId: PLAYLIST[nextIdx].id, progress: 0, playing: isPlaying });
    setLocalProgress(0);
  };

  const handlePrev = () => {
    const prevIdx = (trackIdx - 1 + PLAYLIST.length) % PLAYLIST.length;
    write({ trackId: PLAYLIST[prevIdx].id, progress: 0, playing: isPlaying });
    setLocalProgress(0);
  };

  const handleSelect = (t) => {
    write({ trackId: t.id, progress: 0, playing: true });
    setLocalProgress(0);
  };

  const handleSeekEnd = (val) => {
    setIsDragging(false);
    setLocalProgress(Number(val));
    write({ progress: Number(val) });
  };

  const iLiked    = likedBy.includes(user?.uid);
  const handleLike = () => {
    const next = iLiked ? likedBy.filter(id => id !== user.uid) : [...likedBy, user.uid];
    write({ likedBy: next });
  };

  const pct = track.duration > 0 ? (localProgress / track.duration) * 100 : 0;
  const isPartnerHere = !!partner;

  return (
    <div className="min-h-full relative overflow-hidden"
      style={{ background: `linear-gradient(180deg, #00080f 0%, #001020 40%, #07050F 100%)` }}>

      {/* Dynamic bg glow based on track color */}
      <AnimatePresence mode="wait">
        <motion.div key={track.id}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${track.color}18 0%, transparent 70%)` }}
        />
      </AnimatePresence>

      {/* Floating music notes bg */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['🎵','🎶','🎼','♪','♫'].map((e, i) => (
          <motion.div key={e}
            animate={{ y: [0, -50, 0], opacity: [0.05, 0.15, 0.05], rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 6 + i * 2, delay: i * 1.5 }}
            className="absolute select-none"
            style={{ left: `${8 + i * 20}%`, top: `${15 + i * 12}%`, fontSize: 28 + i * 4, filter: 'blur(1px)' }}
          >{e}</motion.div>
        ))}
      </div>

      <div className="relative z-10 p-3 md:p-6 max-w-5xl mx-auto">

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2" style={{ fontFamily:'Syne, sans-serif' }}>
              <span>🎵</span> Music Room
            </h2>
            <p className="text-[9px] font-mono mt-0.5" style={{ color: track.color }}>
              {isPartnerHere
                ? `🔴 LIVE · ${partner.name} hears the same track`
                : '⏸ Solo mode · partner not connected'}
            </p>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[9px] font-mono ${
            isPartnerHere
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-white/10 bg-white/5 text-cozy-muted'
          }`}>
            <Radio className={`w-3 h-3 ${isPartnerHere ? 'animate-pulse' : ''}`} />
            {isPartnerHere ? 'SYNCED' : 'SOLO'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">

          {/* ── NOW PLAYING ────────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={track.id}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1,    y: 0  }}
                exit={{    opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.4 }}
                className="rounded-3xl border p-6 space-y-5 text-center relative overflow-hidden"
                style={{
                  background: 'rgba(0,8,20,0.85)',
                  borderColor: `${track.color}30`,
                  boxShadow: `0 0 60px ${track.color}18, inset 0 0 40px rgba(0,0,0,0.4)`,
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Neon top line */}
                <div className="absolute top-0 inset-x-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${track.color}80, transparent)` }} />

                {/* Vinyl */}
                <VinylDisc isPlaying={isPlaying} color={track.color} />

                {/* Track info */}
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white" style={{ fontFamily:'Syne, sans-serif', textShadow:`0 0 20px ${track.color}60` }}>
                    {track.title}
                  </h3>
                  <p className="text-xs font-mono" style={{ color:`${track.color}80` }}>{track.artist}</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border"
                      style={{ background:`${track.color}15`, borderColor:`${track.color}30`, color:track.color }}>
                      {track.mood} {track.moodLabel}
                    </span>
                    <span className="text-[9px] font-mono text-cozy-muted">{track.bpm} BPM</span>
                  </div>
                </div>

                {/* Lyrics ticker */}
                <LyricsTicker isPlaying={isPlaying} trackId={track.id} />

                {/* Waveform */}
                <Waveform isPlaying={isPlaying} color={track.color} bars={24} />

                {/* Progress */}
                <div className="space-y-1">
                  <input type="range" min={0} max={track.duration} value={localProgress}
                    onChange={e => { setIsDragging(true); setLocalProgress(Number(e.target.value)); }}
                    onMouseUp={e => handleSeekEnd(e.target.value)}
                    onTouchEnd={e => handleSeekEnd(e.currentTarget.value)}
                    className="w-full h-1.5 rounded-full cursor-pointer appearance-none"
                    style={{ background:`linear-gradient(to right, ${track.color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)` }}
                  />
                  <div className="flex justify-between text-[8px] font-mono text-cozy-muted">
                    <span>{fmtTime(localProgress)}</span>
                    <span>{fmtTime(track.duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                    onClick={() => setShuffled(p => !p)}
                    className={`transition-all cursor-pointer ${shuffled ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
                    style={{ color: track.color }}>
                    <Shuffle className="w-4 h-4" />
                  </motion.button>

                  <motion.button whileHover={{ scale:1.12 }} whileTap={{ scale:0.88 }}
                    onClick={handlePrev}
                    className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: track.color }}>
                    <SkipBack className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handlePlayPause}
                    className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl cursor-pointer border-2 border-white/10"
                    style={{ background:`linear-gradient(135deg, ${track.color}, ${track.color}88)`, boxShadow:`0 0 30px ${track.color}50` }}
                  >
                    {isPlaying
                      ? <Pause className="w-6 h-6 text-white fill-white" />
                      : <Play  className="w-6 h-6 text-white fill-white ml-1" />
                    }
                  </motion.button>

                  <motion.button whileHover={{ scale:1.12 }} whileTap={{ scale:0.88 }}
                    onClick={handleNext}
                    className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: track.color }}>
                    <SkipForward className="w-5 h-5" />
                  </motion.button>

                  <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                    onClick={handleLike}
                    className="cursor-pointer transition-all"
                    style={{ color: iLiked ? '#FF6B97' : 'rgba(255,255,255,0.3)' }}>
                    <Heart className={`w-4 h-4 ${iLiked ? 'fill-current' : ''}`} />
                  </motion.button>
                </div>

                {/* Liked by */}
                {likedBy.length > 0 && (
                  <p className="text-[9px] font-mono text-cozy-muted">
                    ❤️ {likedBy.length === 2 ? 'Both of you' : likedBy.length === 1 ? 'Someone' : likedBy.length} like{likedBy.length === 1 ? 's' : ''} this track
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── PLAYLIST ───────────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-2">
            <p className="text-[9px] font-mono uppercase tracking-widest text-cozy-muted flex items-center gap-1.5 mb-3">
              <Volume2 className="w-3 h-3" /> PLAYLIST · {PLAYLIST.length} TRACKS
            </p>

            {PLAYLIST.map((t, i) => {
              const active = t.id === track.id;
              return (
                <motion.button
                  key={t.id}
                  whileHover={{ x: 4, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelect(t)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer"
                  style={{
                    background:   active ? `${t.color}12` : 'rgba(255,255,255,0.02)',
                    borderColor:  active ? `${t.color}40` : 'rgba(255,255,255,0.05)',
                    boxShadow:    active ? `0 0 20px ${t.color}15` : 'none',
                  }}
                >
                  {/* Track number / playing indicator */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black"
                    style={{ background:`${t.color}20`, color: t.color, fontFamily:'Syne, sans-serif' }}>
                    {active && isPlaying ? (
                      <motion.div animate={{ scale:[1,1.4,1] }} transition={{ repeat:Infinity, duration:0.6 }}
                        className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                    ) : i + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] md:text-xs font-bold truncate" style={{ color: active ? t.color : '#fff', fontFamily:'Space Grotesk, sans-serif' }}>
                      {t.title}
                    </p>
                    <p className="text-[9px] text-cozy-muted font-light">{t.artist}</p>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2 flex-shrink-0 text-right">
                    <span className="text-base">{t.mood}</span>
                    <span className="text-[9px] font-mono text-cozy-muted">{fmtTime(t.duration)}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}