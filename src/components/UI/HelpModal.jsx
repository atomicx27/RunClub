import React from 'react';

export default function HelpModal({ onClose }) {
    return (
        <div className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-game-primary/50 text-white p-6 rounded-2xl max-w-md w-full shadow-2xl relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-orbitron font-bold text-game-primary mb-6 text-center tracking-wider">
                    HOW TO PLAY
                </h2>

                <div className="space-y-6 font-mono text-sm">

                    <div className="flex gap-4 items-start">
                        <div className="bg-blue-500/20 p-2 rounded-lg text-2xl">🏃</div>
                        <div>
                            <h3 className="font-bold text-blue-400 mb-1">MOVE TO PAINT</h3>
                            <p className="text-gray-300">Your GPS location is your paintbrush. Run around the real world to draw lines on the map.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="bg-green-500/20 p-2 rounded-lg text-2xl">🔄</div>
                        <div>
                            <h3 className="font-bold text-green-400 mb-1">LOOP TO CLAIM</h3>
                            <p className="text-gray-300">Run in a complete circle (start and end at the same point) to <span className="text-white font-bold">capture territory</span>.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="bg-red-500/20 p-2 rounded-lg text-2xl">⚔️</div>
                        <div>
                            <h3 className="font-bold text-red-400 mb-1">ATTACK & STEAL</h3>
                            <p className="text-gray-300">Draw a loop AROUND an enemy's territory to steal it! You can slice pieces off or swallow it whole.</p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="bg-yellow-500/20 p-2 rounded-lg text-2xl">🏆</div>
                        <div>
                            <h3 className="font-bold text-yellow-400 mb-1">WIN THE WAR</h3>
                            <p className="text-gray-300">The team with the most land area when the timer runs out WINS.</p>
                        </div>
                    </div>

                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-game-primary text-black font-bold py-3 rounded-xl mt-8 hover:bg-white transition-colors font-orbitron tracking-widest"
                >
                    LET'S RUN
                </button>
            </div>
        </div>
    );
}
