import React from 'react';
import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div className="min-h-screen w-full relative bg-[image:var(--background-image-cozy-gradient)] text-cozy-text flex flex-col">
      {/* Ambient background blur elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-accent-purple/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-accent-pink/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Content Injection Interface */}
      <main className="flex-grow z-10 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}