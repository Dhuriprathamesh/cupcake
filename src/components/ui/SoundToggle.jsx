// src/components/ui/SoundToggle.jsx
// Global mute/unmute button — shown in DuoRoomLayout header
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { isMuted, setMuted } from '../../utils/soundEngine';
import { playClick } from '../../utils/soundEngine';

export default function SoundToggle() {
  const [muted, setLocalMuted] = useState(isMuted());

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setLocalMuted(next);
    if (!next) playClick(); // little confirmation beep when unmuting
  };

  return (
    <motion.button
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.88 }}
      onClick={toggle}
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
      className="w-8 h-8 rounded-xl flex items-center justify-center text-base cursor-pointer transition-all border border-white/8 hover:border-white/20"
      style={{ background: muted ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)' }}
    >
      {muted ? '🔇' : '🔊'}
    </motion.button>
  );
}