import { useState, useEffect, useRef } from 'react';
import * as turf from '@turf/turf';
import { findIntersection, createPolygonFromPath } from '../utils/geometry';
import { db } from '../firebase';
import { ref, push, onValue, update, remove } from 'firebase/database';
import { useUser } from '../context/UserContext';

export function useGameLogic(currentLocation, gameStatus = 'ACTIVE', gameMode = 'solo') {
    const { user } = useUser();
    const [path, setPath] = useState([]);
    const [claimedTerritories, setClaimedTerritories] = useState([]);
    const [isRecording, setIsRecording] = useState(false);

    const lastPointRef = useRef(null);

    // Stop recording if game is NOT active
    useEffect(() => {
        if (gameStatus === 'ACTIVE') {
            setIsRecording(true);
        } else {
            setIsRecording(false);
            setPath([]); // Clear path on pause/stop? Optional. Let's clear to avoid jumps.
            lastPointRef.current = null;
        }
    }, [gameStatus]);

    // 1. Listen for GLOBAL territories from Firebase
    useEffect(() => {
        if (!db) return;
        const territoriesRef = ref(db, 'territories');

        const unsubscribe = onValue(territoriesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setClaimedTerritories(Object.values(data));
            } else {
                setClaimedTerritories([]);
            }
        });

        return () => unsubscribe();
    }, []);

    // 2. Logic to claim new territory
    useEffect(() => {
        if (!currentLocation || !isRecording || !user || gameStatus !== 'ACTIVE') return;

        const { lat, lng } = currentLocation;
        const newPoint = [lat, lng];

        if (lastPointRef.current) {
            const from = turf.point([lastPointRef.current[1], lastPointRef.current[0]]);
            const to = turf.point([lng, lat]);
            const distance = turf.distance(from, to, { units: 'meters' });

            if (distance < 2) return;

            const intersection = findIntersection(path, newPoint);
            if (intersection) {
                console.log("Loop Detected!", intersection);
                const poly = createPolygonFromPath(path, intersection.intersectIndex, intersection.intersectPoint);
                if (poly) {
                    handleTerritoryClaim(poly);

                    // Avoid synchronous setState warning by wrapping in setTimeout
                    setTimeout(() => {
                        setPath([newPoint]);
                    }, 0);
                    lastPointRef.current = newPoint;
                    return;
                }
            }
        }

        setTimeout(() => {
            setPath(prev => [...prev, newPoint]);
        }, 0);
        lastPointRef.current = newPoint;

    }, [currentLocation, isRecording, gameStatus, user, gameMode, path]);


    const handleTerritoryClaim = (poly) => {
        const newPolyGeo = poly.geometry;

        // --- ATTACK LOGIC ---
        claimedTerritories.forEach(existing => {
            // Skip friendly fire
            if (existing.team && user.team && existing.team === user.team) return;

            // Attack logic...
            try {
                const toFeature = (input) => {
                    if (!input) return null;
                    if (input.type === 'Feature') return input;
                    if (input.type === 'Polygon' || input.type === 'MultiPolygon') return turf.feature(input);
                    return null;
                };

                const newFeature = toFeature(newPolyGeo);
                const existingFeature = toFeature(existing.geometry);

                if (!newFeature || !existingFeature) return;

                const intersectionWithEnemy = turf.intersect(turf.featureCollection([newFeature, existingFeature]));

                if (intersectionWithEnemy) {
                    const remaining = turf.difference(turf.featureCollection([existingFeature, newFeature]));
                    const territoryRef = ref(db, `territories/${existing.id}`);

                    if (!remaining) {
                        // Annihilated
                        remove(territoryRef);
                        logEvent('DESTROY', existing.id, existing.area);
                    } else {
                        // Shrink
                        const newArea = turf.area(remaining);
                        update(territoryRef, {
                            geometry: remaining.geometry || remaining,
                            area: newArea
                        });
                        logEvent('SHRINK', existing.id, existing.area - newArea);
                    }
                }
            } catch (err) {
                console.error("Attack Failed:", err);
            }
        });

        // --- CREATE NEW ---
        const newTerritory = {
            ...poly,
            ownerType: gameMode,
            ownerId: user.id,
            ownerName: user.name || 'Anonymous',
            team: user.team || 'blue',
            color: (user.team === 'red') ? '#ef4444' : '#3b82f6',
            timestamp: Date.now()
        };

        const territoriesRef = ref(db, 'territories');
        const newRef = push(territoriesRef, newTerritory);
        newRef.catch(err => console.error("Claim Failed:", err));
        update(newRef, { id: newRef.key });

        logEvent('CAPTURE', newRef.key, newTerritory.area);
    };

    const logEvent = (type, territoryId, amount = 0) => {
        // Push to game/events for the Kill Feed
        // type: CAPTURE, DESTROY, SHRINK
        const eventsRef = ref(db, 'game/events');
        push(eventsRef, {
            type,
            userName: user.name,
            team: user.team,
            amount: Math.round(amount), // Area size or "1" for destroy
            timestamp: Date.now()
        });
    };

    return {
        path,
        claimedTerritories,
        isRecording,
        setIsRecording
    };
}
