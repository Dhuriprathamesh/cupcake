// src/context/SpaceContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db, googleProvider, signInWithPopup, signOut } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc, setDoc, getDoc, onSnapshot,
  updateDoc, arrayUnion,
} from 'firebase/firestore';

const SpaceContext = createContext();

const XP_TO_NEXT = (level) => level * 100;

// ── Clean fresh game state — used on every new game start ──────────────────
export const FRESH_GAME_STATE = {
  activeGame:         'ttt',

  // ── Tic Tac Toe ──────────────────────────────────────────────────────────
  board:              Array(9).fill(null),
  isXNext:            true,
  winner:             null,
  xpAwardedForGame:   false,

  // ── Reaction Blitz ───────────────────────────────────────────────────────
  reactionTarget:     null,
  reactionWinner:     null,
  reactionStartedAt:  null,
  reactionHostRounds: 0,
  reactionGuestRounds:0,
  reactionXpAwarded:  false,

  // ── Emoji Quiz ───────────────────────────────────────────────────────────
  emojiRound:         0,
  emojiScoreHost:     0,
  emojiScoreGuest:    0,
  emojiAnswer:        null,
  emojiRevealed:      false,
  emojiXpAwarded:     false,

  // ── Who Knows Better ─────────────────────────────────────────────────────
  wkbRound:           0,           // current round 0-5 (6 rounds per game)
  wkbShuffledIndices: [],          // pre-shuffled question order for this game
  wkbAnswerHost:      null,        // host secret answer
  wkbAnswerGuest:     null,        // guest secret answer
  wkbRevealed:        false,       // both answered → reveal
  wkbHostScore:       0,
  wkbGuestScore:      0,
  wkbXpAwarded:       false,
  wkbCustomQuestions: [],          // both players can add, persists across games
  wkbGameNumber:      0,           // increments each new game — triggers reshuffle

  // ── Chaos Truth or Dare ───────────────────────────────────────────────────
  // Turn flow: spinnerUid spins → result shows to both → spinner types question/dare
  //            → recipient sees card → recipient completes/submits proof
  //            → spinner approves or resends → next turn, roles alternate
  ctdSpinnerUid:      null,        // whose turn to spin (alternates each round)
  ctdSpinResult:      null,        // 'truth' | 'dare' — result of spin
  ctdSpinning:        false,       // wheel animation in progress
  ctdCard:            null,        // the question/dare text (typed by spinner)
  ctdCardType:        null,        // 'truth' | 'dare'
  ctdTimerEnd:        null,        // dare timer end timestamp
  ctdResponse:        null,        // recipient's answer/proof text
  ctdResponseStatus:  null,        // null | 'submitted' | 'approved' | 'resent'
  ctdRound:           0,
  ctdSkips:           0,
  ctdXpAwarded:       false,
  ctdCustomCards:     [],          // player-added custom cards (both can add)

  // ── Hot Takes Battle ──────────────────────────────────────────────────────
  htRound:            0,
  htShuffled:         [],
  htVoteHost:         null,
  htVoteGuest:        null,
  htRevealed:         false,
  htHostScore:        0,
  htGuestScore:       0,
  htXpAwarded:        false,
  htGameNum:          0,

  // ── UNO ─────────────────────────────────────────────────────────────────
  // Cards: { id, color:'red'|'green'|'blue'|'yellow'|'wild', type:'0'-'9'|'skip'|'reverse'|'draw2'|'wild'|'wild4' }
  unoPhase:           'idle',       // 'idle'|'dealing'|'playing'|'gameover'
  unoDrawPile:        [],           // remaining draw pile (array of card objects)
  unoDiscardTop:      null,         // top card on discard pile
  unoCurrentColor:    null,         // active color (changes after wild)
  unoHostHand:        [],           // host's cards
  unoGuestHand:       [],           // guest's cards
  unoTurn:            null,         // 'host'|'guest'
  unoPending:         null,         // { type:'draw2'|'draw4'|'skip', count:2|4 } pending effect on current player
  unoWinner:          null,         // uid of winner
  unoXpAwarded:       false,
  unoUnoCalled:       null,         // uid who has 1 card (auto-detected)
  unoLastAction:      null,         // description string for last action log
};

export function SpaceProvider({ children }) {
  const [user,          setUser]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [roomData,      setRoomData]      = useState(null);
  const [partner,       setPartner]       = useState(null);
  const [liveReactions, setLiveReactions] = useState([]);

  // ── Derived: who is host (needed before isHost below) ──────────────────────
  const _isHost = !!user && !!roomData && roomData.hostUid === user.uid;

  // ── Derived: per-player progression ──────────────────────────────────────────
  // XP & Level are INDIVIDUAL — each player grows their own.
  // Streak is SHARED — same value shown on both panels.
  const _prog = roomData?.progression ?? {};
  const _streak          = _prog.streak          ?? 0;
  const _milestonesCount = _prog.milestonesCount ?? 0;

  const _myXp    = _isHost ? (_prog.hostXp    ?? 0) : (_prog.guestXp    ?? 0);
  const _myLv    = _isHost ? (_prog.hostLevel  ?? 1) : (_prog.guestLevel  ?? 1);
  const _partXp  = _isHost ? (_prog.guestXp   ?? 0) : (_prog.hostXp    ?? 0);
  const _partLv  = _isHost ? (_prog.guestLevel ?? 1) : (_prog.hostLevel  ?? 1);

  // myProgression — YOUR personal XP / level
  const myProgression = roomData
    ? {
        xp:              _myXp,
        level:           _myLv,
        streak:          _streak,
        xpToNextLevel:   XP_TO_NEXT(_myLv),
        milestonesCount: _milestonesCount,
      }
    : { xp: 0, level: 1, streak: 0, xpToNextLevel: 100, milestonesCount: 0 };

  // partnerProgression — partner's personal XP / level
  const partnerProgression = roomData
    ? {
        xp:            _partXp,
        level:         _partLv,
        streak:        _streak,
        xpToNextLevel: XP_TO_NEXT(_partLv),
      }
    : { xp: 0, level: 1, streak: 0, xpToNextLevel: 100 };

  // Keep `progression` as alias for myProgression (backward compat)
  const progression = myProgression;

  // ── Derived: room flags ───────────────────────────────────────────────────
  const roomCode = roomData?.roomCode ?? null;
  const isLinked = roomData?.connected === true;
  const isHost   = _isHost;

  // ── Derived: gameState — always has safe defaults ─────────────────────────
  const gameState = roomData?.gameState
    ? { ...FRESH_GAME_STATE, ...roomData.gameState }
    : { ...FRESH_GAME_STATE };

  // ── Derived: permanent all-time scores ───────────────────────────────────
  const scores = roomData?.scores ?? { host: 0, guest: 0 };

  // ── Derived: game history (permanent, grows over time) ───────────────────
  const gameHistory = roomData?.gameHistory ?? [];

  // ─────────────────────────────────────────────────────────────────────────
  // 1. AUTH STATE LISTENER
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef  = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        let userData = {
          uid:             firebaseUser.uid,
          name:            firebaseUser.displayName || 'Player',
          email:           firebaseUser.email,
          avatar:          '🧁',
          profileComplete: false,
          currentActivity: 'Just arrived',
          activeRoomId:    null,
          pendingRoomId:   null,
        };

        if (userSnap.exists()) {
          userData = { ...userData, ...userSnap.data() };
        } else {
          await setDoc(userRef, userData);
        }

        setUser(userData);
      } else {
        setUser(null);
        setRoomData(null);
        setPartner(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. ACTIVE ROOM LISTENER + STREAK TRACKER
  // ─────────────────────────────────────────────────────────────────────────
  // Streak rules:
  //   • Shared between both players — same value on both panels.
  //   • Increments when BOTH are connected on a new calendar day.
  //   • Resets to 1 if more than 1 day has passed since last session.
  //   • Only the host triggers the Firestore write (prevents double-write).
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.activeRoomId) return;

    const roomRef   = doc(db, 'rooms', user.activeRoomId);
    let   streakRan = false; // guard: run once per mount

    const unsubRoom = onSnapshot(roomRef, async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setRoomData(data);

      // Resolve partner
      const partnerUid = data.hostUid === user.uid ? data.guestUid : data.hostUid;
      if (partnerUid) {
        const partnerSnap = await getDoc(doc(db, 'users', partnerUid));
        if (partnerSnap.exists()) setPartner(partnerSnap.data());
      } else {
        setPartner(null);
      }

      // ── Streak tracking (host-only write, once per mount) ─────────────────
      if (!streakRan && data.connected && data.hostUid === user.uid) {
        streakRan = true; // prevent re-running on subsequent snapshots
        const prog          = data.progression ?? {};
        const todayStr      = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
        const lastDate      = prog.lastStreakDate ?? null;
        const currentStreak = prog.streak ?? 0;

        if (lastDate !== todayStr) {
          // Check if yesterday — increment streak; otherwise reset
          let newStreak = 1;
          if (lastDate) {
            const last  = new Date(lastDate);
            const today = new Date(todayStr);
            const diffDays = Math.round((today - last) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              newStreak = currentStreak + 1; // consecutive day → keep growing
            }
            // diffDays > 1 → missed a day → reset to 1
          }

          try {
            await updateDoc(roomRef, {
              'progression.streak':        newStreak,
              'progression.lastStreakDate': todayStr,
            });
          } catch (_) {}
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      // Live reactions auto-cleanup
      if (data.reactions?.length) {
        setLiveReactions(data.reactions);
        setTimeout(async () => {
          try { await updateDoc(roomRef, { reactions: [] }); } catch (_) {}
        }, 3000);
      }
    });

    return () => unsubRoom();
  }, [user?.activeRoomId, user?.uid]);

  // ─────────────────────────────────────────────────────────────────────────
  // 2b. PENDING ROOM LISTENER (guest waiting for approval)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.pendingRoomId || user?.activeRoomId) return;

    const roomRef = doc(db, 'rooms', user.pendingRoomId);
    const unsub   = onSnapshot(roomRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();

      if (data.joinStatus === 'approved' && data.guestUid === user.uid) {
        setUser(prev => ({
          ...prev,
          activeRoomId:  user.pendingRoomId,
          pendingRoomId: null,
        }));
      }

      if (
        data.joinStatus === 'declined' ||
        (data.guestUid !== user.uid && data.joinStatus !== 'pending')
      ) {
        setUser(prev => ({ ...prev, pendingRoomId: null }));
      }
    });

    return () => unsub();
  }, [user?.pendingRoomId, user?.uid, user?.activeRoomId]);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. GOOGLE LOGIN
  // ─────────────────────────────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google auth error:', err);
      throw err;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 4. UPDATE PROFILE
  // ─────────────────────────────────────────────────────────────────────────
  const updateProfile = async (updates) => {
    if (!user?.uid) return;
    await updateDoc(doc(db, 'users', user.uid), updates);
    setUser(prev => ({ ...prev, ...updates }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 5. UPDATE ACTIVITY
  // ─────────────────────────────────────────────────────────────────────────
  const updateActivity = useCallback(async (activity) => {
    if (!user?.uid) return;
    await updateDoc(doc(db, 'users', user.uid), { currentActivity: activity });
    setUser(prev => prev ? { ...prev, currentActivity: activity } : null);
  }, [user?.uid]);

  // ─────────────────────────────────────────────────────────────────────────
  // 6. GENERATE ROOM CODE (HOST)
  // ─────────────────────────────────────────────────────────────────────────
  const generateRoomCode = async () => {
    if (!user) return null;

    const code   = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomId = `room_${code}`;

    const newRoom = {
      roomId,
      roomCode:    code,
      hostUid:     user.uid,
      hostName:    user.name,
      hostAvatar:  user.avatar,
      guestUid:    null,
      guestName:   null,
      guestAvatar: null,
      joinStatus:  'none',
      connected:   false,
      createdAt:   new Date().toISOString(),
      // Shared streak + individual XP/Level per player
      progression: {
        streak:       0,
        milestonesCount: 0,
        hostXp:       0,
        hostLevel:    1,
        guestXp:      0,
        guestLevel:   1,
      },
      // All-time win counters — NEVER reset
      scores:      { host:0, guest:0 },
      // Permanent game history log
      gameHistory: [],
      // Current game state — resets each new game
      gameState:   { ...FRESH_GAME_STATE },
      musicState:  { playing:false, trackId:1, progress:0, likedBy:[] },
      navRequest:  null,           // { id, fromUid, fromName, toPath, toLabel, type, ts, status }
      customStickers: [],          // [{ id, dataUrl, addedBy, addedByName, ts }]
      reactions:   [],
      messages:    [],
      memories:    [],
    };

    await setDoc(doc(db, 'rooms', roomId), newRoom);
    await updateDoc(doc(db, 'users', user.uid), { activeRoomId: roomId });
    setUser(prev => ({ ...prev, activeRoomId: roomId }));
    return code;
  };

  const generatePrivateRoom = generateRoomCode;

  // ─────────────────────────────────────────────────────────────────────────
  // 7. CONNECT WITH CODE (GUEST)
  // ─────────────────────────────────────────────────────────────────────────
  const connectWithCode = async (code) => {
    if (!user) return 'error';

    const roomId   = `room_${code.toUpperCase()}`;
    const roomRef  = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists())              return 'not_found';
    const data = roomSnap.data();
    if (data.hostUid === user.uid)       return 'self';
    if (data.guestUid && data.connected) return 'full';

    await updateDoc(roomRef, {
      guestUid:    user.uid,
      guestName:   user.name,
      guestAvatar: user.avatar,
      joinStatus:  'pending',
      connected:   false,
    });

    setUser(prev => ({ ...prev, pendingRoomId: roomId }));
    return 'pending';
  };

  const connectToExistingRoom = connectWithCode;

  // ─────────────────────────────────────────────────────────────────────────
  // 8. APPROVE GUEST (HOST)
  // ─────────────────────────────────────────────────────────────────────────
  const approveGuest = async () => {
    if (!user?.activeRoomId) return;
    const roomRef  = doc(db, 'rooms', user.activeRoomId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const { guestUid } = roomSnap.data();
    if (!guestUid) return;
    await updateDoc(roomRef, { joinStatus: 'approved', connected: true });
    await updateDoc(doc(db, 'users', guestUid), { activeRoomId: user.activeRoomId });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 9. DECLINE GUEST (HOST)
  // ─────────────────────────────────────────────────────────────────────────
  const declineGuest = async () => {
    if (!user?.activeRoomId) return;
    await updateDoc(doc(db, 'rooms', user.activeRoomId), {
      guestUid: null, guestName: null, guestAvatar: null, joinStatus: 'declined',
    });
    setTimeout(async () => {
      try { await updateDoc(doc(db, 'rooms', user.activeRoomId), { joinStatus: 'none' }); } catch (_) {}
    }, 3000);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 10. EMOJI FLING
  // ─────────────────────────────────────────────────────────────────────────
  const flingReaction = async (emoji) => {
    if (!user?.activeRoomId) return;
    await updateDoc(doc(db, 'rooms', user.activeRoomId), {
      reactions: arrayUnion({
        id:        Math.random().toString(36).substring(2),
        emoji,
        sender:    user.name,
        timestamp: Date.now(),
      }),
    });
  };

  const triggerLiveReaction = flingReaction;

  // ─────────────────────────────────────────────────────────────────────────
  // 11. ADD XP — safe, reads from Firestore before writing
  // ─────────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  // 11. ADD XP — writes to THIS player's individual XP/level only.
  //     Each player runs this in their own useEffect, so both get their
  //     share without race conditions.
  //     Streak is NOT touched here — it is updated separately.
  // ─────────────────────────────────────────────────────────────────────────
  const addXP = async (amount) => {
    if (!user?.activeRoomId) return;

    // Always read fresh data to avoid stale local state
    const snap = await getDoc(doc(db, 'rooms', user.activeRoomId));
    if (!snap.exists()) return;

    const prog = snap.data().progression ?? {};

    // Determine which fields belong to the CURRENT user
    const isHostNow  = snap.data().hostUid === user.uid;
    const xpField    = isHostNow ? 'hostXp'    : 'guestXp';
    const levelField = isHostNow ? 'hostLevel'  : 'guestLevel';

    let newXp    = (prog[xpField]    ?? 0) + amount;
    let newLevel = (prog[levelField] ?? 1);

    // Handle level-up (supports multiple level-ups in one call)
    while (newXp >= XP_TO_NEXT(newLevel)) {
      newXp    -= XP_TO_NEXT(newLevel);
      newLevel += 1;
    }

    await updateDoc(doc(db, 'rooms', user.activeRoomId), {
      [`progression.${xpField}`]:    newXp,
      [`progression.${levelField}`]: newLevel,
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 12. UPDATE GAME STATE
  //     Writes a partial patch to roomData.gameState in Firestore.
  // ─────────────────────────────────────────────────────────────────────────
  const updateGameState = async (patch) => {
    if (!user?.activeRoomId) return;
    const updates = {};
    Object.entries(patch).forEach(([k, v]) => {
      updates[`gameState.${k}`] = v;
    });
    await updateDoc(doc(db, 'rooms', user.activeRoomId), updates);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 13. RESET GAME
  //     Clears the board back to FRESH_GAME_STATE (preserving activeGame).
  //     Called when: both players open game tab (auto), or Play Again clicked.
  //     DOES NOT reset scores or gameHistory — those are permanent.
  // ─────────────────────────────────────────────────────────────────────────
  const resetGame = async (keepActiveGame = true) => {
    if (!user?.activeRoomId) return;
    const activeGame = keepActiveGame
      ? (roomData?.gameState?.activeGame ?? 'ttt')
      : 'ttt';

    await updateDoc(doc(db, 'rooms', user.activeRoomId), {
      gameState: { ...FRESH_GAME_STATE, activeGame },
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 14. RECORD WIN + SAVE TO HISTORY
  //     Increments the all-time win counter AND pushes to permanent gameHistory.
  //     xpAwardField: the gameState field to set true to prevent double XP.
  // ─────────────────────────────────────────────────────────────────────────
  const recordWin = async (winnerUid, gameType, xpAwardField) => {
    if (!user?.activeRoomId || !roomData) return;

    const isWinnerHost = winnerUid === roomData.hostUid;
    const field        = isWinnerHost ? 'scores.host' : 'scores.guest';
    const current      = isWinnerHost
      ? (roomData.scores?.host  ?? 0)
      : (roomData.scores?.guest ?? 0);

    const winnerName = winnerUid === user.uid
      ? user.name
      : (partner?.name ?? 'Partner');

    // History entry — permanent record
    const historyEntry = {
      id:         `game_${Date.now()}`,
      gameType:   gameType ?? 'unknown',
      winnerUid,
      winnerName,
      playedAt:   new Date().toISOString(),
      playedAtTs: Date.now(),
    };

    const updates = {
      [field]:               current + 1,
      gameHistory:           arrayUnion(historyEntry),
    };

    // Mark XP as awarded for this game so it never fires again
    if (xpAwardField) {
      updates[`gameState.${xpAwardField}`] = true;
    }

    await updateDoc(doc(db, 'rooms', user.activeRoomId), updates);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 15. MARK XP AWARDED (for draws — no winner but XP still given)
  //     Call this after addXP for draws to prevent re-award on re-open.
  // ─────────────────────────────────────────────────────────────────────────
  const markXpAwarded = async (xpAwardField) => {
    if (!user?.activeRoomId || !xpAwardField) return;
    await updateDoc(doc(db, 'rooms', user.activeRoomId), {
      [`gameState.${xpAwardField}`]: true,
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 16. LOGOUT
  // ─────────────────────────────────────────────────────────────────────────
  const logout = async () => {
    if (user?.uid) {
      await updateDoc(doc(db, 'users', user.uid), { currentActivity:'Offline' }).catch(() => {});
    }
    await signOut(auth);
    setUser(null);
    setRoomData(null);
    setPartner(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ─────────────────────────────────────────────────────────────────────────
  const value = {
    // State
    user, setUser, loading,
    roomData, partner,
    progression,          // alias for myProgression (backward compat)
    myProgression,        // YOUR personal XP / level
    partnerProgression,   // partner's personal XP / level
    liveReactions, roomCode, isLinked, isHost,
    gameState, scores, gameHistory,

    // Auth
    loginWithGoogle, updateProfile, logout,

    // Room
    generateRoomCode, generatePrivateRoom,
    connectWithCode, connectToExistingRoom,
    approveGuest, declineGuest,

    // Interaction
    flingReaction, triggerLiveReaction,
    updateActivity, addXP,

    // Navigation permission
    requestNav: async (toPath, toLabel, type='page', extra={}) => {
      if (!user?.activeRoomId) return 'no_room';
      const reqId = `nav_${Date.now()}`;
      await updateDoc(doc(db, 'rooms', user.activeRoomId), {
        navRequest: {
          id: reqId, fromUid: user.uid, fromName: user.name,
          toPath, toLabel, type, ts: Date.now(), status: 'pending', ...extra,
        },
      });
      return reqId;
    },
    respondNav: async (status) => {
      if (!user?.activeRoomId) return;
      await updateDoc(doc(db, 'rooms', user.activeRoomId), { 'navRequest.status': status });
    },

    // Games
    updateGameState,
    resetGame,
    recordWin,
    markXpAwarded,
  };

  return (
    <SpaceContext.Provider value={value}>
      {!loading && children}
    </SpaceContext.Provider>
  );
}

export const useSpace = () => useContext(SpaceContext);