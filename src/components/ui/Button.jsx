import React from 'react';
import { motion } from 'framer-motion';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseStyles = "px-6 py-3 rounded-full font-medium tracking-wide text-sm transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-2 active:scale-95 cursor-pointer";
  
  const variants = {
    primary: "bg-gradient-to-r from-accent-purple to-accent-pink text-white shadow-lg shadow-accent-purple/20 hover:shadow-accent-purple/40 hover:opacity-95",
    secondary: "glass-panel text-cozy-text hover:bg-cozy-soft/80 border border-white/10 hover:border-white/20",
    glow: "bg-white text-cozy-dark font-semibold hover:bg-opacity-90 shadow-xl shadow-white/10"
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}