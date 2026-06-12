import React from 'react';
import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div className="min-h-screen w-full relative bg-[image:var(--background-image-cozy-gradient)] text-cozy-text flex flex-col">
      {/* Static ambient blobs — no animation, no blur cost on mobile */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full pointer-events-none hidden md:block"
        style={{ background:'rgba(139,92,246,0.10)', filter:'blur(100px)' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full pointer-events-none hidden md:block"
        style={{ background:'rgba(255,107,151,0.05)', filter:'blur(80px)' }} />

      {/* Content */}
      <main className="flex-grow z-10 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}