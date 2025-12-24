import { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { User, MapPin } from 'lucide-react';

export default function OnboardingModal() {
    const { login } = useUser();
    const [name, setName] = useState('');
    const [userTeam, setUserTeam] = useState('blue'); // Default to blue

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            login(name.trim(), userTeam); // Pass team
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-md shadow-2xl">
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                        <MapPin size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white font-display uppercase tracking-widest">
                        RunClub
                    </h1>
                    <p className="text-slate-400 mt-2">Claim your territory. Rule the city.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2 uppercase tracking-wide">
                            Runner Name / Callsign
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Maverick"
                                className="w-full bg-slate-800 border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                autoFocus
                            />
                        </div>
                    </div>



                    {/* Team Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2 uppercase tracking-wide">
                            Choose Your Team
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setUserTeam('blue')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${userTeam === 'blue' ? 'bg-blue-900/40 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-slate-800 border-slate-700 opacity-60 hover:opacity-80'}`}
                            >
                                <div className="w-4 h-4 rounded-full bg-blue-500" />
                                <span className={`font-orbitron font-bold ${userTeam === 'blue' ? 'text-white' : 'text-slate-400'}`}>BLUE</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setUserTeam('red')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${userTeam === 'red' ? 'bg-red-900/40 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-slate-800 border-slate-700 opacity-60 hover:opacity-80'}`}
                            >
                                <div className="w-4 h-4 rounded-full bg-red-500" />
                                <span className={`font-orbitron font-bold ${userTeam === 'red' ? 'text-white' : 'text-slate-400'}`}>RED</span>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!name.trim() || !userTeam}
                        className="w-full bg-game-primary hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 uppercase tracking-wide"
                    >
                        Enter The Grid
                    </button>

                    <p className="text-xs text-center text-slate-600">
                        *Identity and Team stored locally.
                    </p>
                </form>
            </div>
        </div>
    );
}
