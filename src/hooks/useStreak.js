// src/hooks/useStreak.js
//
// Call this once inside DuoRoomLayout (or DashboardHome) on mount.
// It checks if today's date is different from the last recorded visit date.
// If so → increment streak. If gap > 1 day → reset streak to 1.
// Writes to the room's progression.streak field in Firestore.

import { useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

function toDateStr(ts) {
  return new Date(ts).toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

export function useStreak(user, roomData) {
  const ran = useRef(false);

  useEffect(() => {
    // Only run once per session, only when we have both user and room
    if (ran.current)              return;
    if (!user?.activeRoomId)      return;
    if (!roomData?.progression)   return;

    ran.current = true;

    const prog      = roomData.progression;
    const today     = toDateStr(Date.now());
    const lastVisit = prog.lastVisitDate ?? null;

    // Already checked in today — do nothing
    if (lastVisit === today) return;

    let newStreak = prog.streak ?? 0;

    if (!lastVisit) {
      // First ever session
      newStreak = 1;
    } else {
      const lastDate  = new Date(lastVisit);
      const todayDate = new Date(today);
      const diffDays  = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day → increment
        newStreak += 1;
      } else if (diffDays > 1) {
        // Missed a day → reset
        newStreak = 1;
      }
      // diffDays === 0 is handled by the early return above
    }

    // Write to Firestore — both players see the updated streak via onSnapshot
    updateDoc(doc(db, 'rooms', user.activeRoomId), {
      'progression.streak':        newStreak,
      'progression.lastVisitDate': today,
    }).catch((err) => console.error('Streak update failed:', err));

  }, [user?.activeRoomId, roomData?.progression]);
}