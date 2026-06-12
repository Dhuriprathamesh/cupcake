// src/components/ui/ParticleCanvas.jsx
import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function ParticleCanvas() {
  const canvasRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Environment Presets Based on Routing Path
    let config = { color: 'rgba(255,107,151,0.2)', speed: 0.5, density: 40, size: 3 };
    const path = location.pathname;

    if (path.includes('games')) {
      config = { color: 'rgba(54,211,153,0.4)', speed: 2.5, density: 60, size: 6 }; // Energetic Childish
    } else if (path.includes('music')) {
      config = { color: 'rgba(6,182,212,0.3)', speed: 0.2, density: 25, size: 2 }; // Neon Calm Ambient
    } else if (path.includes('ai-zone')) {
      config = { color: 'rgba(139,92,246,0.5)', speed: 1.2, density: 50, size: 4 }; // Experimental Matrix
    } else if (path.includes('memories')) {
      config = { color: 'rgba(253,224,71,0.2)', speed: 0.3, density: 30, size: 3 }; // Dreamy Amber Warmth
    }

    let particles = Array.from({ length: config.density }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * config.speed,
      vy: (Math.random() - 0.5) * config.speed,
      radius: Math.random() * config.size + 1
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = config.color;

      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [location.pathname]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}