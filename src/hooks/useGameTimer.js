import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, set, update } from 'firebase/database';

export function useGameTimer() {
    const [gameState, setGameState] = useState({
        status: 'LOBBY', // LOBBY, ACTIVE, PAUSED, ENDED
        endTime: null,
        winner: null,
        scores: { blue: 0, red: 0 },
        activeModifiers: {}
    });

    const [timeLeft, setTimeLeft] = useState('00:00');

    // 1. Listen to Global Game Status
    useEffect(() => {
        const gameRef = ref(db, 'game/status');
        const unsub = onValue(gameRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setGameState(prev => ({
                    ...prev,
                    ...data,
                    // If status is missing (legacy), default based on isActive
                    status: data.status || (data.isActive ? 'ACTIVE' : 'ENDED')
                }));
            } else {
                // Initialize if missing
                adminResetGame();
            }
        });
        return () => unsub();
    }, []);

    // 2. Countdown Logic (Client Side)
    useEffect(() => {
        if (!gameState.endTime || gameState.status !== 'ACTIVE') {
            if (gameState.status === 'ENDED') setTimeLeft('00:00');
            if (gameState.status === 'LOBBY') setTimeLeft('READY');
            if (gameState.status === 'PAUSED') setTimeLeft('PAUSED');
            return;
        }

        // Run immediately
        const updateTimer = () => {
            const now = Date.now();
            const diff = gameState.endTime - now;

            if (diff <= 0) {
                // Game Over Trigger
                setTimeLeft('00:00');
                // Only one client needs to trigger the DB update, but it's safe if multiple do
                // "End Game" action usually done via Admin or auto-trigger
                // For now, visual 00:00 is enough, Admin can "Confirm End" or we auto-end.
                // Let's AUTO-END for convenience:
                if (gameState.status === 'ACTIVE') {
                    update(ref(db, 'game/status'), { status: 'ENDED' });
                }
            } else {
                // Format MM:SS
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        };

        const interval = setInterval(updateTimer, 1000);
        updateTimer(); // Initial call

        return () => clearInterval(interval);
    }, [gameState.endTime, gameState.status]);

    // --- Admin Actions ---

    const adminStartGame = (durationMinutes = 30) => {
        const now = Date.now();
        const endTime = now + (durationMinutes * 60 * 1000);

        update(ref(db, 'game/status'), {
            status: 'ACTIVE',
            endTime: endTime,
            startTime: now,
            winner: null,
            activeModifiers: {} // Reset modifiers
        });
    };

    const adminPauseGame = () => {
        if (gameState.status === 'ACTIVE') {
            // Store remaining time? Complex.
            // Simpler: Just Pause. Timer keeps ticking in background? 
            // Ideally: Pause extends deadline.
            // For V1: pausing just freezes the "GAMEPLAY", time might keep running or we just accept it.
            // Let's just set status PAUSED. useGameLogic will stop recording.
            update(ref(db, 'game/status'), { status: 'PAUSED' });
        }
    };

    const adminResumeGame = () => {
        if (gameState.status === 'PAUSED') {
            update(ref(db, 'game/status'), { status: 'ACTIVE' });
        }
    };

    const adminEndGame = () => {
        update(ref(db, 'game/status'), { status: 'ENDED' });
    };

    const adminResetGame = () => {
        set(ref(db, 'game/status'), {
            status: 'LOBBY',
            endTime: null,
            winner: null,
            scores: { blue: 0, red: 0 }
        });
        // We do NOT wipe map here, that's separate
    };

    const adminTriggerEvent = (eventName, durationSeconds = 60) => {
        update(ref(db, 'game/status/activeModifiers'), {
            [eventName]: Date.now() + (durationSeconds * 1000)
        });

        // Auto-remove after duration? The client can just check if Date.now() < modifierTime
    };

    return {
        timeLeft,
        status: gameState.status, // LOBBY, ACTIVE, PAUSED, ENDED
        gameState,
        adminActions: {
            startGame: adminStartGame,
            pauseGame: adminPauseGame,
            resumeGame: adminResumeGame,
            endGame: adminEndGame,
            resetGame: adminResetGame,
            triggerEvent: adminTriggerEvent
        }
    };
}
