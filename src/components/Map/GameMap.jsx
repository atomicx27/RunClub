import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { useLocation } from '../../hooks/useLocation';
import { useGameLogic } from '../../hooks/useGameLogic';
import { useUser } from '../../context/UserContext';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { useGameTimer } from '../../hooks/useGameTimer';
import TerritoryLayer from './TerritoryLayer';
import HelpModal from '../UI/HelpModal';
import AdminDashboard from '../UI/AdminDashboard';
import GameOverlay from '../UI/GameOverlay';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import MovingMarker from './MovingMarker';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to recenter map when user moves
function MapRecenter({ location }) {
    const map = useMap();
    useEffect(() => {
        if (location) {
            map.panTo([location.lat, location.lng], { animate: true });
        }
    }, [location, map]);
    return null;
}

export default function GameMap() {
    const { location: realLocation, error } = useLocation();
    const { user, logout } = useUser();

    // Shared Mode State
    const [showHelp, setShowHelp] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);

    // Real location only
    const activeLocation = realLocation;
    const { timeLeft, status, gameState } = useGameTimer();

    // Pass status to GameLogic to stop recording if paused/lobby
    const { path, claimedTerritories, isRecording } = useGameLogic(activeLocation, status);
    const { rivals } = useMultiplayer(user, activeLocation);

    // Trail Logic: Accumulate rival paths
    const [rivalTrails, setRivalTrails] = useState({});

    // Calculate Scores (Live)
    const scores = claimedTerritories.reduce((acc, t) => {
        if (t.team === 'blue') acc.blue += (t.area || 0);
        if (t.team === 'red') acc.red += (t.area || 0);
        return acc;
    }, { blue: 0, red: 0 });

    useEffect(() => {
        setRivalTrails(prev => {
            const next = { ...prev };
            rivals.forEach(rival => {
                if (!next[rival.id]) next[rival.id] = [];

                const currentTrail = next[rival.id];
                const lastPoint = currentTrail[currentTrail.length - 1];

                // Only add point if it moved significantly (> 2 meters roughly)
                const newPoint = [rival.lat, rival.lng];

                if (!lastPoint || (lastPoint[0] !== newPoint[0] || lastPoint[1] !== newPoint[1])) {
                    // Keep last 50 points
                    const newTrail = [...currentTrail, newPoint].slice(-50);
                    next[rival.id] = newTrail;
                }
            });
            return next;
        });
    }, [rivals]);

    // Default center (e.g. New York) if no location yet
    const defaultCenter = [40.7128, -74.0060];
    const center = activeLocation ? [activeLocation.lat, activeLocation.lng] : defaultCenter;

    return (
        <div className="relative w-full h-[100vh] bg-slate-900 text-white overflow-hidden">

            {/* OVERLAYS */}
            <GameOverlay />
            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
            {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}

            {/* Top HUD */}
            <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-start pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-xl pointer-events-auto">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${user?.team === 'red' ? 'bg-red-500' : 'bg-blue-500'} animate-pulse`} />
                            <span className="font-orbitron font-bold text-sm tracking-widest">{user?.name || 'AGENT'}</span>
                        </div>
                        <div className="h-[1px] bg-white/20 w-full my-1" />
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                            <span>ALLIES: {rivals.filter(r => r.team === user?.team).length}</span>
                        </div>
                    </div>
                </div>

                {/* TIMER & SCORE */}
                <div className="flex flex-col items-end gap-2 pointer-events-auto">
                    <button
                        onClick={() => {
                            // Secret Admin Access: Long press or just click for now?
                            // Let's make it easy: click timer
                            const pwd = prompt("ADMIN ACCESS CODE:");
                            if (pwd === '5555') setShowAdmin(true);
                        }}
                        className="bg-black/80 backdrop-blur text-white px-4 py-2 rounded-xl border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:bg-yellow-900/20 active:scale-95 transition-all"
                    >
                        <span className={`font-orbitron font-bold text-xl ${status !== 'ACTIVE' ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                            {timeLeft}
                        </span>

                    </button>
                    {/* Mini Scoreboard */}
                    <div className="bg-black/60 backdrop-blur p-2 rounded-lg text-xs font-bold border border-white/10 flex gap-4">
                        <div className="text-blue-400">BLUE: {Math.round(scores.blue)} m²</div>
                        <div className="text-red-400">RED: {Math.round(scores.red)} m²</div>
                    </div>
                </div>
            </div>

            {/* GAME OVER CARD (When STATUS is ENDED) */}
            {status === 'ENDED' && (
                <div className="absolute inset-0 z-[5000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-slate-900 border-2 border-yellow-500 p-8 rounded-2xl max-w-sm w-full text-center shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-in fade-in zoom-in duration-300">
                        <h2 className="text-4xl font-display font-bold text-white mb-2 uppercase">Time's Up</h2>
                        <div className="text-6xl mb-6">🏆</div>

                        <div className="space-y-4 mb-8">
                            <div className={`p-4 rounded-xl border ${scores.blue > scores.red ? 'bg-blue-500/20 border-blue-500' : 'bg-slate-800 border-slate-700'}`}>
                                <div className="text-blue-400 font-bold text-sm">BLUE TEAM</div>
                                <div className="text-2xl font-orbitron text-white">{Math.round(scores.blue).toLocaleString()} m²</div>
                            </div>
                            <div className={`p-4 rounded-xl border ${scores.red > scores.blue ? 'bg-red-500/20 border-red-500' : 'bg-slate-800 border-slate-700'}`}>
                                <div className="text-red-400 font-bold text-sm">RED TEAM</div>
                                <div className="text-2xl font-orbitron text-white">{Math.round(scores.red).toLocaleString()} m²</div>
                            </div>
                        </div>

                        <div className="text-xl font-bold text-yellow-400 mb-8 uppercase tracking-widest">
                            {scores.blue > scores.red ? 'BLUE WINS' : (scores.red > scores.blue ? 'RED WINS' : 'DRAW')}
                        </div>

                        <button
                            onClick={() => {
                                const pwd = prompt("ADMIN CODE TO RESET:");
                                if (pwd === '5555') setShowAdmin(true);
                            }}
                            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-wider"
                        >
                            Game Master Menu
                        </button>
                    </div>
                </div>
            )}

            {/* RESET ID BUTTON + Logout */}
            <div className="absolute bottom-24 left-4 z-[1000] flex flex-col gap-2">
                <button
                    onClick={logout}
                    className="bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                >
                    RESET ID
                </button>
                {/* Help Button */}
                <button
                    onClick={() => setShowHelp(true)}
                    className="w-8 h-8 flex items-center justify-center bg-game-primary/20 text-game-primary border border-game-primary/50 rounded-full hover:bg-game-primary hover:text-black font-bold text-lg backdrop-blur"
                >
                    ?
                </button>
            </div>


            {/* Stats HUD (Bottom) */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1001] pointer-events-none">
                <div className="bg-game-surface/90 backdrop-blur border border-game-primary/30 rounded-2xl px-6 py-3 shadow-2xl flex gap-8">
                    <div className="flex flex-col items-center border-r border-white/10 pr-6">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Team</span>
                        <span className={`font-orbitron text-xl font-bold uppercase ${user?.team === 'red' ? 'text-red-500' : 'text-blue-500'}`}>
                            {user?.team || '???'}
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Allies</span>
                        <span className="font-orbitron text-xl text-white">
                            {rivals.filter(r => r.team === user?.team).length}
                        </span>
                    </div>
                </div>
            </div>

            {
                error && (
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-500 text-white px-4 py-2 rounded-full shadow-lg">
                        {error}
                    </div>
                )
            }

            {
                !activeLocation && !error && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] bg-game-surface text-game-primary px-6 py-4 rounded-xl shadow-2xl border border-game-primary/20 backdrop-blur-md">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-game-primary border-t-transparent rounded-full animate-spin" />
                            <span className="font-orbitron text-sm">Acquiring GPS Signal...</span>
                        </div>
                    </div>
                )
            }

            <MapContainer
                center={center}
                zoom={18}
                scrollWheelZoom={true}
                zoomControl={false}
                className="w-full h-full"
                style={{ height: '100vh', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Claimed Territories */}
                <TerritoryLayer territories={claimedTerritories} />

                {/* User Path */}
                <Polyline
                    positions={path}
                    pathOptions={{
                        color: user?.team === 'red' ? '#ef4444' : '#3b82f6',
                        weight: 4,
                        opacity: 0.8,
                        lineCap: 'round',
                        dashArray: isRecording ? null : '10, 10'
                    }}
                />

                {/* Rivals & Teammates */}
                {
                    rivals.map(rival => {
                        const isAlly = rival.team === user?.team;
                        const color = rival.team === 'red' ? '#ef4444' : (rival.team === 'blue' ? '#3b82f6' : '#9ca3af');

                        // Create Custom Icon
                        const borderColorClass = rival.team === 'red' ? 'border-red-500/30' : 'border-blue-500/30';
                        const playerIcon = L.divIcon({
                            className: 'bg-transparent border-none', // Override Leaflet defaults
                            html: `
                            <div class="relative w-0 h-0">
                                <span class="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-[10px] font-bold font-orbitron text-white bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm border ${borderColorClass}">
                                    ${rival.name}
                                </span>
                                <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-[0_0_10px_${color}]" style="background-color: ${color}"></div>
                            </div>
                        `,
                            iconSize: [20, 20], // Explicit size
                            iconAnchor: [10, 10] // Center
                        });

                        return (
                            <div key={rival.id}>
                                {/* Trail for Teammates */}
                                {isAlly && rivalTrails[rival.id] && (
                                    <Polyline
                                        positions={rivalTrails[rival.id]}
                                        pathOptions={{
                                            color: color,
                                            weight: 2,
                                            opacity: 0.4,
                                            dashArray: '5, 5'
                                        }}
                                    />
                                )}


                                {/* Player Marker */}
                                <MovingMarker
                                    position={[rival.lat, rival.lng]}
                                    duration={2000} // Rivals update slower, so slower slide
                                    icon={playerIcon}
                                    zIndexOffset={100}
                                />
                            </div>
                        );
                    })
                }

                {
                    activeLocation && (
                        <>
                            {/* My Player Marker */}
                            <MovingMarker
                                position={[activeLocation.lat, activeLocation.lng]}
                                duration={1000} // I update faster
                                zIndexOffset={1000} // Keep me on top
                                icon={L.divIcon({
                                    className: 'my-player-icon',
                                    html: `
                                <div class="relative">
                                    <div class="w-5 h-5 rounded-full border-2 border-white bg-green-500 shadow-[0_0_15px_#22c55e] animate-pulse"></div>
                                </div>
                            `,
                                    iconSize: [0, 0],
                                    iconAnchor: [10, 10]
                                })}
                            />

                            {/* Accuracy Circle */}
                            <Circle
                                center={[activeLocation.lat, activeLocation.lng]}
                                radius={activeLocation.accuracy}
                                pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1, weight: 1, dashArray: '5,5' }}
                            />
                            <MapRecenter location={activeLocation} />
                        </>
                    )
                }
            </MapContainer >

            <style>{`
        .dark-map-tiles {
          filter: invert(1) hue-rotate(180deg) brightness(0.6) contrast(1.5) saturate(0.8);
        }
      `}</style>
        </div >
    );
}
