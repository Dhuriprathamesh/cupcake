// src/components/ui/StickyFooter.jsx
// Reusable sticky footer used on all public pages (Landing, Auth, Lobby, Welcome)
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Shield, Zap } from 'lucide-react';

export default function StickyFooter({ variant = 'minimal' }) {
  const year = new Date().getFullYear();

  if (variant === 'minimal') {
    // Used on Auth page — just a small strip
    return (
      <footer
        className="w-full border-t border-white/5 py-3 px-5 flex items-center justify-center gap-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-4 text-[8px] font-mono text-cozy-muted/50 uppercase tracking-widest">
          <span className="flex items-center gap-1">
            <Shield className="w-2.5 h-2.5 text-emerald-400" /> Secure
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Heart className="w-2.5 h-2.5 text-accent-pink" /> Private
          </span>
          <span>·</span>
          <span>Just for Two</span>
          <span>·</span>
          <span>© {year} Cupcake</span>
        </div>
      </footer>
    );
  }

  if (variant === 'full') {
    // Used on Landing page
    return (
      <footer
        className="w-full border-t border-white/5 py-6 px-5 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: [0,-5,5,-3,0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="text-lg"
            >🧁</motion.span>
            <span className="text-xs font-black text-white" style={{ fontFamily:'Syne,sans-serif' }}>
              CUPCAKE PRIVATE
            </span>
          </div>
          <p className="text-[9px] font-mono text-cozy-muted uppercase tracking-widest text-center">
            © {year} Cupcake Private World · Re-imagining human connection
          </p>
          <div className="flex items-center gap-3 text-[8px] font-mono text-cozy-muted/50 uppercase tracking-wide">
            <span className="flex items-center gap-1"><Shield className="w-2.5 h-2.5 text-emerald-400"/>Encrypted</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5 text-accent-purple"/>Realtime</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Heart className="w-2.5 h-2.5 text-accent-pink fill-current"/>For Two</span>
          </div>
        </div>
      </footer>
    );
  }

  // variant === 'lobby' — used on Lobby and Welcome pages (has CTA info)
  return (
    <footer
      className="w-full border-t border-white/5 py-4 px-5 flex-shrink-0"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)' }}
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-[9px] font-mono text-cozy-muted uppercase tracking-widest">
          Cupcake Private World · Encrypted · Invite-Only · Made for Two ✦
        </p>
        <div className="flex items-center gap-3 text-[8px] font-mono text-cozy-muted/40">
          <span className="flex items-center gap-1"><Shield className="w-2.5 h-2.5 text-emerald-400"/>Secure</span>
          <span>·</span>
          <span>© {year}</span>
        </div>
      </div>
    </footer>
  );
}