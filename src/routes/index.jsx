// src/routes/index.jsx
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// ── Layouts ────────────────────────────────────────────────────────────────
import RootLayout    from '../layouts/RootLayout';
import DuoRoomLayout from '../layouts/DuoRoomLayout';

// ── Public pages ───────────────────────────────────────────────────────────
import LandingPage   from '../pages/Landing/LandingPage';
import AuthPage      from '../pages/AuthPage';

// ── Post-login pages ───────────────────────────────────────────────────────
import WelcomePage   from '../pages/WelcomePage';
import LobbyPage     from '../pages/LobbyPage';

// ── Private world pages ────────────────────────────────────────────────────
import DashboardHome from '../pages/World/DashboardHome';
import GamesHub      from '../pages/World/GamesHub';
import ChatRoom      from '../pages/World/ChatRoom';
import MemorySpace   from '../pages/World/MemorySpace';
import MusicRoom     from '../pages/World/MusicRoom';
import AiZone        from '../pages/World/AiZone';

// ── Route guards ───────────────────────────────────────────────────────────
import { useSpace } from '../context/SpaceContext';

// Redirect to /auth if user is not logged in
function RequireAuth({ children }) {
  const { user, loading } = useSpace();
  if (loading) return null;               // wait for Firebase auth check
  if (!user)   return <Navigate to="/auth" replace />;
  return children;
}

// Redirect to /auth if not logged in, /lobby if logged in but no active room
function RequireRoom({ children }) {
  const { user, loading } = useSpace();
  if (loading)              return null;
  if (!user)                return <Navigate to="/auth"  replace />;
  if (!user.activeRoomId)   return <Navigate to="/lobby" replace />;
  return children;
}

// Redirect already-authed users away from auth page to lobby
function RedirectIfAuthed({ children }) {
  const { user, loading } = useSpace();
  if (loading) return null;
  if (user?.profileComplete) return <Navigate to="/lobby" replace />;
  return children;
}

export const router = createBrowserRouter([
  {
    path:    '/',
    element: <RootLayout />,
    children: [

      // ── Public ──────────────────────────────────────────────────────────
      { index: true, element: <LandingPage /> },
      {
        path:    'auth',
        element: <RedirectIfAuthed><AuthPage /></RedirectIfAuthed>,
      },

      // ── Post-login, pre-room ─────────────────────────────────────────────
      {
        path:    'welcome',
        element: <RequireAuth><WelcomePage /></RequireAuth>,
      },
      {
        path:    'lobby',
        element: <RequireAuth><LobbyPage /></RequireAuth>,
      },

      // ── Private room world ───────────────────────────────────────────────
      {
        path:    'room',
        element: <RequireRoom><DuoRoomLayout /></RequireRoom>,
        children: [
          { index: true,          element: <DashboardHome /> },
          { path: 'games',        element: <GamesHub      /> },
          { path: 'chat',         element: <ChatRoom      /> },
          { path: 'memories',     element: <MemorySpace   /> },
          { path: 'music',        element: <MusicRoom     /> },
          { path: 'ai-zone',      element: <AiZone        /> },
          // Legacy alias
          { path: 'activities',   element: <MusicRoom     /> },
        ],
      },

      // ── Catch-all ────────────────────────────────────────────────────────
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);