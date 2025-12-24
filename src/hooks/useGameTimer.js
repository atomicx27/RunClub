import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, set, update } from 'firebase/database';

export function useGameTimer() {
    const [gameState, setGameState] = useState({
        isActive: true, // Default to active for new users until synced
        endTime: null,
        winner: null,
        scores: { blue: 0, red: 0 }
    });

    const [timeLeft, setTimeLeft] = useState('30:00');

    // 1. Listen to Global Game Status
    useEffect(() => {
        const gameRef = ref(db, 'game/status');
        const unsub = onValue(gameRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setGameState(prev => ({ ...prev, ...data }));
            } else {
                // Initialize if missing
                adminResetGame();
            }
        });
        return () => unsub();
    }, []);

    // 2. Countdown Logic (Client Side)
    useEffect(() => {
        if (!gameState.endTime || !gameState.isActive) {
            if (!gameState.isActive) setTimeLeft('00:00');
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = gameState.endTime - now;

            if (diff <= 0) {
                // Game Over
                setTimeLeft('00:00');
                if (gameState.isActive) {
                    endGame();
                }
            } else {
                // Format MM:SS
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [gameState.endTime, gameState.isActive]);

    // --- Admin Actions ---

    const adminStartGame = (durationMinutes = 30) => {
        const now = Date.now();
        const endTime = now + (durationMinutes * 60 * 1000);

        set(ref(db, 'game/status'), {
            isActive: true,
            endTime: endTime,
            winner: null,
            startTime: now
        });

        // Also clear invalid territories or reset could happen here
    };

    const adminResetGame = () => {
        adminStartGame(30);
    };

    const endGame = () => {
        // Triggered by client, but should ideally be server-side. 
        // We use a race condition here: first client to hit 0 triggers update.
        update(ref(db, 'game/status'), { isActive: false });

        // Winner calculation is visual for now, but we could lock it in DB here.
    };

    return {
        timeLeft,
        isActive: gameState.isActive,
        gameState,
        adminResetGame
    };
}
