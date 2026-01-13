import { useState } from 'react';
import { Play, Pause, Square, Trash2, Zap, Trophy, ShieldAlert, Skull } from 'lucide-react';
import { useGameTimer } from '../../hooks/useGameTimer';
import { ref, remove } from 'firebase/database';
import { db } from '../../firebase';

export default function AdminDashboard({ onClose }) {
    const { adminActions, status } = useGameTimer();
    const [confirmWipe, setConfirmWipe] = useState(false);

    const handleWipe = async () => {
        if (!confirmWipe) {
            setConfirmWipe(true);
            setTimeout(() => setConfirmWipe(false), 3000); // Reset after 3s
            return;
        }
        // NUKE IT
        await remove(ref(db, 'locations'));
        await remove(ref(db, 'territories'));
        await remove(ref(db, 'game/events'));
        adminActions.resetGame();
        setConfirmWipe(false);
        onClose();
    };

    return (
        <div className="absolute inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-yellow-500/30 w-full max-w-md rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <div>
                        <h2 className="text-xl font-display font-bold text-yellow-500 tracking-wider">GAME MASTER</h2>
                        <span className="text-xs text-slate-400 font-mono">AUTHORIZED ACCESS</span>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-xl px-2">
                        &times;
                    </button>
                </div>

                {/* Phase Controls */}
                <div className="space-y-4 mb-8">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Match Control</h3>

                    <div className="grid grid-cols-2 gap-3">
                        {status === 'LOBBY' || status === 'ENDED' ? (
                            <button
                                onClick={() => { adminActions.startGame(30); onClose(); }}
                                className="col-span-2 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20"
                            >
                                <Play size={20} fill="currentColor" /> START MATCH (30m)
                            </button>
                        ) : (
                            <>
                                {status === 'active' || status === 'ACTIVE' ? ( // Handle casing safety
                                    <button
                                        onClick={() => adminActions.pauseGame()}
                                        className="flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl"
                                    >
                                        <Pause size={18} fill="currentColor" /> PAUSE
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => adminActions.resumeGame()}
                                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl"
                                    >
                                        <Play size={18} fill="currentColor" /> RESUME
                                    </button>
                                )}
                                <button
                                    onClick={() => adminActions.endGame()}
                                    className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl"
                                >
                                    <Square size={18} fill="currentColor" /> END MATCH
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Modifiers */}
                <div className="space-y-4 mb-8">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Live Events</h3>

                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={() => { adminActions.triggerEvent('sudden_death', 300); onClose(); }}
                            className="flex items-center gap-3 bg-red-900/30 border border-red-500/30 hover:bg-red-900/50 text-red-200 px-4 py-3 rounded-xl transition-all text-left"
                        >
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <Skull size={20} className="text-red-500" />
                            </div>
                            <div>
                                <div className="font-bold text-sm">SUDDEN DEATH</div>
                                <div className="text-[10px] text-red-300">Fast flips, x2 pts (5m)</div>
                            </div>
                        </button>

                        <button
                            onClick={() => { adminActions.triggerEvent('double_capture', 120); onClose(); }}
                            className="flex items-center gap-3 bg-blue-900/30 border border-blue-500/30 hover:bg-blue-900/50 text-blue-200 px-4 py-3 rounded-xl transition-all text-left"
                        >
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Zap size={20} className="text-blue-500" />
                            </div>
                            <div>
                                <div className="font-bold text-sm">POWER SURGE</div>
                                <div className="text-[10px] text-blue-300">Capture area radius x2 (2m)</div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="mt-8 pt-6 border-t border-white/10">
                    <button
                        onClick={handleWipe}
                        className={`w-full border-2 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${confirmWipe
                                ? 'bg-red-600 border-red-600 text-white animate-pulse'
                                : 'border-red-500/30 text-red-400 hover:bg-red-950'
                            }`}
                    >
                        <Trash2 size={18} />
                        {confirmWipe ? 'CONFIRM WIPE ALL DATA?' : 'WIPE WORLD & RESET'}
                    </button>
                    {confirmWipe && <p className="text-center text-[10px] text-red-500 mt-2 font-mono">THIS CANNOT BE UNDONE</p>}
                </div>

            </div>
        </div>
    );
}
