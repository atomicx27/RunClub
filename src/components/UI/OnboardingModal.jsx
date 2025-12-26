import { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { User, MapPin, Shield, Zap } from 'lucide-react';

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
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

                <div className="text-center mb-8 relative z-10">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20 rotate-3">
                        <MapPin size={32} className="text-white drop-shadow-md" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-white tracking-wider">
                        RUNCLUB
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm">Join the global territory war.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    {/* Name Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest pl-1">
                            Agent Codename
                        </label>
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter alias..."
                                className="w-full bg-slate-950/50 border border-slate-700 text-white pl-10 pr-4 py-3.5 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                autoFocus
                                maxLength={15}
                            />
                        </div>
                    </div>

                    {/* Team Selection */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest pl-1">
                            Select Faction
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Blue Team */}
                            <button
                                type="button"
                                onClick={() => setUserTeam('blue')}
                                className={`relative p-4 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2 group overflow-hidden ${userTeam === 'blue'
                                    ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-[1.02]'
                                    : 'bg-slate-800/50 border-white/5 hover:bg-slate-800 hover:border-white/10'
                                    }`}
                            >
                                <Shield size={24} className={`transition-colors ${userTeam === 'blue' ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                <span className={`text-xs font-bold font-orbitron tracking-wider ${userTeam === 'blue' ? 'text-blue-100' : 'text-slate-400'}`}>BLUE</span>
                                {userTeam === 'blue' && <div className="absolute inset-0 border-2 border-blue-500 rounded-xl" />}
                            </button>

                            {/* Red Team */}
                            <button
                                type="button"
                                onClick={() => setUserTeam('red')}
                                className={`relative p-4 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2 group overflow-hidden ${userTeam === 'red'
                                    ? 'bg-red-900/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)] scale-[1.02]'
                                    : 'bg-slate-800/50 border-white/5 hover:bg-slate-800 hover:border-white/10'
                                    }`}
                            >
                                <Zap size={24} className={`transition-colors ${userTeam === 'red' ? 'text-red-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                <span className={`text-xs font-bold font-orbitron tracking-wider ${userTeam === 'red' ? 'text-red-100' : 'text-slate-400'}`}>RED</span>
                                {userTeam === 'red' && <div className="absolute inset-0 border-2 border-red-500 rounded-xl" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wide text-sm transform active:scale-95"
                    >
                        Initialize System
                    </button>

                </form>
            </div>
        </div>
    );
}
