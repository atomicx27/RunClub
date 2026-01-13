import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { ref, onValue, query, limitToLast } from 'firebase/database';
import { useGameTimer } from '../../hooks/useGameTimer';

export default function GameOverlay() {
    const { status, gameState } = useGameTimer();
    const [events, setEvents] = useState([]);
    const [banner, setBanner] = useState(null);

    // 1. Kill Feed Listener
    useEffect(() => {
        const eventsRef = query(ref(db, 'game/events'), limitToLast(5));
        const unsub = onValue(eventsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Convert to array and reverse (newest top)
                const list = Object.values(data).reverse();
                setEvents(list);
            }
        });
        return () => unsub();
    }, []);

    // 2. Banner Logic (Status Changes)
    useEffect(() => {
        if (status === 'LOBBY') {
            setBanner({ title: "WAITING FOR HOST", sub: "Warm up your engines..." });
        } else if (status === 'PAUSED') {
            setBanner({ title: "MATCH PAUSED", sub: "Hold your position." });
        } else if (status === 'ENDED') {
            setBanner(null);
        } else if (status === 'ACTIVE') {
            // Check for modifiers
            if (gameState.activeModifiers?.sudden_death > Date.now()) {
                setBanner({ title: "💀 SUDDEN DEATH 💀", sub: "Double Points. No Mercy.", type: 'danger' });
            } else if (gameState.activeModifiers?.double_capture > Date.now()) {
                setBanner({ title: "⚡ POWER SURGE ⚡", sub: "Capture Area Expanded", type: 'info' });
            } else {
                setBanner(null);
            }
        }
    }, [status, gameState.activeModifiers]);


    return (
        <div className="absolute inset-0 pointer-events-none z-[1500] overflow-hidden">

            {/* BIG CENTER BANNER */}
            {banner && (
                <div className="absolute top-1/3 left-0 right-0 flex justify-center animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
                    <div className={`bg-black/60 backdrop-blur-md border-y-2 py-6 px-12 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] ${banner.type === 'danger' ? 'border-red-500 text-red-500' :
                            banner.type === 'info' ? 'border-blue-500 text-blue-400' : 'border-white/20 text-white'
                        }`}>
                        <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter uppercase drop-shadow-2xl">
                            {banner.title}
                        </h1>
                        <p className="text-lg md:text-xl font-mono tracking-widest mt-2 uppercase opacity-90 text-white">
                            {banner.sub}
                        </p>
                    </div>
                </div>
            )}

            {/* KILL FEED (Top Right, below Timer) */}
            <div className="absolute top-24 right-4 w-64 flex flex-col gap-2 items-end">
                {events.map((ev, i) => (
                    <div
                        key={i}
                        className="bg-black/50 backdrop-blur-sm border-r-2 border-white/20 p-2 pr-3 rounded-l-lg text-right animate-in slide-in-from-right fade-in duration-300"
                        style={{ opacity: 1 - (i * 0.15) }} // Fade older ones
                    >
                        <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mb-0.5">
                            {ev.type === 'CAPTURE' ? 'TERRITORY GRAB' :
                                ev.type === 'DESTROY' ? 'ANNIHILATION' : 'SKIRMISH'}
                        </div>
                        <div className="text-xs text-white">
                            <span className={`font-bold ${ev.team === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                                {ev.userName}
                            </span>
                            {' '}
                            {ev.type === 'CAPTURE' && `captured ${ev.amount}m²`}
                            {ev.type === 'DESTROY' && `destroyed a territory!`}
                            {ev.type === 'SHRINK' && `shaved off ${ev.amount}m²`}
                        </div>
                    </div>
                ))}
            </div>

            {/* Lobby Status */}
            {status === 'LOBBY' && (
                <div className="absolute bottom-32 left-0 right-0 text-center animate-pulse">
                    <span className="bg-yellow-500/20 text-yellow-200 border border-yellow-500/50 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
                        Waiting for Game Master to Start...
                    </span>
                </div>
            )}

        </div>
    );
}
