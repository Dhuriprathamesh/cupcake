import React from 'react';
import { motion } from 'framer-motion';

export default function FeatureCard({ icon: Icon, title, description, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5, borderColor: 'rgba(255, 107, 151, 0.2)' }}
      className="glass-card p-8 rounded-3xl relative overflow-hidden group transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-accent-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="w-12 h-12 rounded-2xl bg-[mix-blend-mode:plus-lighter] bg-accent-purple/10 flex items-center justify-center text-accent-pink mb-6 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6" />
      </div>
      
      <h3 className="text-xl font-semibold mb-3 tracking-wide group-hover:text-glow transition-all text-white">
        {title}
      </h3>
      <p className="text-cozy-muted leading-relaxed text-sm">
        {description}
      </p>
    </motion.div>
  );
}