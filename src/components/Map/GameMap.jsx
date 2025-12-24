import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, useMapEvents, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { useLocation } from '../../hooks/useLocation';
import { useGameLogic } from '../../hooks/useGameLogic';
import { useUser } from '../../context/UserContext';
import { useMultiplayer } from '../../hooks/useMultiplayer';
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
    const [tileStatus, setTileStatus] = useState('Init');

    // Use simulated location if in debug mode, otherwise real
    const activeLocation = debugMode ? simulatedLocation : realLocation;

    const { path, claimedTerritories, addDebugPoint, isRecording } = useGameLogic(activeLocation, gameMode);
    const { rivals } = useMultiplayer(user, activeLocation); // Sync location and get rivals

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
        <div className="w-full h-full relative">
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

                {/* Rivals (SHOW ALL FOR DEBUGGING) */}
                {rivals.map(rival => {
                    const isAlly = rival.team === user?.team;

                    // DEBUG: Disable Fog of War
                    // if (!isAlly) return null; 

                    let markerColor = 'text-gray-500'; // Default unknown
                    if (rival.team === 'blue') markerColor = 'text-blue-500';
                    if (rival.team === 'red') markerColor = 'text-red-500';

                    return (
                        <Marker key={rival.id} position={[rival.lat, rival.lng]} opacity={0.9}>
                            <Popup className="font-orbitron">
                                <span className={`${markerColor} font-bold`}>{rival.name}</span>
                                <br />
                                <span className="text-xs text-gray-500">
                                    {isAlly ? 'TEAMMATE' : `RIVAL (${rival.team || 'No Team'})`}
                                </span>
                            </Popup>
                        </Marker>
                    );
                })}

                {activeLocation && (
                    <>
                        <Marker position={[activeLocation.lat, activeLocation.lng]}>
                            <Popup>
                                <span className="font-bold text-blue-600">{user?.name || 'You'}</span> <br />
                                Accuracy: {Math.round(activeLocation.accuracy)}m
                            </Popup>
                        </Marker>
                        {/* Accuracy Circle */}
                        <Circle
                            center={[activeLocation.lat, activeLocation.lng]}
                            radius={activeLocation.accuracy}
                            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1, dashArray: '5,5' }}
                        />
                        <MapRecenter location={activeLocation} />
                    </>
                )}
            </MapContainer>

            {/* SUPER DEBUG PANEL (Only if Debug Mode ON) */}
            {debugMode && (
                <div className="absolute top-20 right-4 w-48 bg-black/90 text-green-400 text-[10px] font-mono p-2 rounded z-[5000] overflow-hidden pointer-events-auto border border-green-500">
                    <p className="font-bold underline mb-1">DATA INSPECTOR</p>
                    <p>MyID: {user?.id?.slice(0, 4)}</p>
                    <p>MyTeam: {user?.team}</p>
                    <p>Raw Rivals: {rivals.length}</p>
                    <div className="max-h-32 overflow-y-auto mt-1 border-t border-green-900 pt-1">
                        {rivals.length === 0 ? "No Data" : rivals.map(r => (
                            <div key={r.id} className="mb-1 border-b border-green-900/50 pb-1">
                                <span className="text-white">{r.name}</span><br />
                                <span className="text-xs text-gray-400">Team:</span> {r.team || 'N/A'}<br />
                                <span className="text-xs text-gray-400">ID:</span> {r.id?.slice(0, 4)}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
        .dark-map-tiles {
          filter: invert(1) hue-rotate(180deg) brightness(0.6) contrast(1.5) saturate(0.8);
        }
      `}</style>
        </div>
    );
}
