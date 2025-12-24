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

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

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

// Component to handle map clicks for debugging
function DebugMapEvents({ onLocationSelect }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng);
        },
    });
    return null;
}

export default function GameMap() {
    const { location: realLocation, error } = useLocation();
    const { user, logout } = useUser();

    // Debug State
    const [debugMode, setDebugMode] = useState(false);
    const [simulatedLocation, setSimulatedLocation] = useState(null);

    // Shared Mode State
    const [gameMode, setGameMode] = useState('solo'); // 'solo' | 'shared'
    // const [tileStatus, setTileStatus] = useState('Init'); // Removed tileStatus

    // Use simulated location if in debug mode, otherwise real
    const activeLocation = debugMode ? simulatedLocation : realLocation;
    const { timeLeft, isActive, gameState, adminResetGame } = useGameTimer(); // Added useGameTimer hook

    const { path, claimedTerritories, addDebugPoint, isRecording } = useGameLogic(activeLocation, gameMode, isActive); // Added isActive
    const { rivals } = useMultiplayer(user, activeLocation); // Sync location and get rivals

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

    const handleDebugClick = (latlng) => {
        if (!debugMode) return;
        const newLoc = {
            lat: latlng.lat,
            lng: latlng.lng,
            accuracy: 10,
            timestamp: Date.now()
        };
        setSimulatedLocation(newLoc);
    };

    return (
        <div className="relative w-full h-[100vh] bg-slate-900 text-white overflow-hidden">
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
                    <div className="bg-black/80 backdrop-blur text-white px-4 py-2 rounded-xl border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                        <span className={`font-orbitron font-bold text-xl ${!isActive ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                            {timeLeft}
                        </span>
                    </div>
                    {/* Mini Scoreboard */}
                    <div className="bg-black/60 backdrop-blur p-2 rounded-lg text-xs font-bold border border-white/10">
                        <div className="text-blue-400">BLUE: {Math.round(scores.blue)} m²</div>
                        <div className="text-red-400">RED: {Math.round(scores.red)} m²</div>
                    </div>
                </div>
            </div>

            {/* GAME OVER MODAL */}
            {!isActive && (
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
                            onClick={() => adminResetGame()}
                            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-wider"
                        >
                            Start New Round
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
                {/* Secret Admin Reset (Bottom Left, small) */}
                <button
                    onClick={() => { if (confirm("Reset Game Timer?")) adminResetGame() }}
                    className="bg-gray-800/50 text-gray-500 px-2 py-1 rounded text-[8px] hover:text-white"
                >
                    RESTART
                </button>
            </div>

            {/* HUD / Controls */}
            <div className="absolute top-4 left-4 right-4 z-[1001] flex justify-between items-start pointer-events-none">

                {/* Game Mode Toggle */}
                <div className="pointer-events-auto bg-game-surface/90 backdrop-blur rounded-xl border border-game-primary/30 p-1 flex gap-1 shadow-xl">
                    <button
                        onClick={() => setGameMode('solo')}
                        className={`px-4 py-2 rounded-lg font-orbitron text-xs transition-colors ${gameMode === 'solo' ? 'bg-game-primary text-white' : 'text-game-primary/60 hover:text-game-primary'}`}
                    >
                        SOLO
                    </button>
                    <button
                        onClick={() => setGameMode('shared')}
                        className={`px-4 py-2 rounded-lg font-orbitron text-xs transition-colors ${gameMode === 'shared' ? 'bg-game-accent text-white' : 'text-game-accent/60 hover:text-game-accent'}`}
                    >
                        SHARED
                    </button>
                </div>

                {/* Debug Toggle */}
                <div className="pointer-events-auto bg-game-surface/80 backdrop-blur p-2 rounded-lg border border-game-primary/30">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-orbitron text-game-primary">
                        <input
                            type="checkbox"
                            checked={debugMode}
                            onChange={(e) => setDebugMode(e.target.checked)}
                            className="accent-game-primary"
                        />
                        DEBUG
                    </label>
                    <button
                        onClick={logout}
                        className="mt-2 w-full text-[10px] bg-red-900/50 text-red-200 border border-red-500/30 rounded px-2 py-1 hover:bg-red-900"
                    >
                        RESET ID
                    </button>
                </div>
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
                    {/* Only show claimed area if needed, or maybe just replace one of them? 
                        Let's keep Area/Zones for now but maybe make them smaller or scrollable?
                        Actually, let's just REPLACE Area/Zones with Team/Allies for this Debug Phase 
                        so the user sees the connection immediately. */}
                </div>
            </div>



            {error && !debugMode && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1000] bg-red-500 text-white px-4 py-2 rounded-full shadow-lg">
                    {error}
                </div>
            )}

            {!activeLocation && !error && !debugMode && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] bg-game-surface text-game-primary px-6 py-4 rounded-xl shadow-2xl border border-game-primary/20 backdrop-blur-md">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-game-primary border-t-transparent rounded-full animate-spin" />
                        <span className="font-orbitron text-sm">Acquiring GPS Signal...</span>
                    </div>
                </div>
            )}

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

                <DebugMapEvents onLocationSelect={handleDebugClick} />

                {/* Claimed Territories */}
                <TerritoryLayer territories={claimedTerritories} />

                {/* User Path */}
                <Polyline
                    positions={path}
                    pathOptions={{
                        color: gameMode === 'shared' ? '#10b981' : '#3b82f6',
                        weight: 4,
                        opacity: 0.8,
                        lineCap: 'round',
                        dashArray: isRecording ? null : '10, 10'
                    }}
                />

                {/* Rivals & Teammates */}
                {rivals.map(rival => {
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
                            <Marker
                                position={[rival.lat, rival.lng]}
                                icon={playerIcon}
                                zIndexOffset={100}
                            >
                                {/* Removed Popup, using permanent custom label in icon */}
                            </Marker>
                        </div>
                    );
                })}

                {activeLocation && (
                    <>
                        {/* My Player Marker */}
                        <Marker
                            position={[activeLocation.lat, activeLocation.lng]}
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
                        >
                        </Marker>

                        {/* Accuracy Circle */}
                        <Circle
                            center={[activeLocation.lat, activeLocation.lng]}
                            radius={activeLocation.accuracy}
                            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1, weight: 1, dashArray: '5,5' }}
                        />
                        <MapRecenter location={activeLocation} />
                    </>
                )}
            </MapContainer>

            <style>{`
        .dark-map-tiles {
          filter: invert(1) hue-rotate(180deg) brightness(0.6) contrast(1.5) saturate(0.8);
        }
      `}</style>
        </div >
    );
}
