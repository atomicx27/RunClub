import { useState, useEffect, useRef } from 'react';
import * as turf from '@turf/turf';
import { findIntersection, createPolygonFromPath } from '../utils/geometry';
import { db } from '../firebase';
import { ref, push, onValue, update, remove } from 'firebase/database';
import { useUser } from '../context/UserContext';

export function useGameLogic(currentLocation, gameMode = 'solo', isActive = true) {
    const { user } = useUser();
    const [path, setPath] = useState([]);
    const [claimedTerritories, setClaimedTerritories] = useState([]);
    const [isRecording, setIsRecording] = useState(true);

    const lastPointRef = useRef(null);

    // Stop recording if game is over
    useEffect(() => {
        if (!isActive) {
            setIsRecording(false);
            setPath([]); // Optional: clear path when game ends
        } else {
            setIsRecording(true);
        }
    }, [isActive]);

    // 1. Listen for GLOBAL territories from Firebase
    useEffect(() => {
        if (!db) return;
        const territoriesRef = ref(db, 'territories');

        const unsubscribe = onValue(territoriesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Convert object {key: val} to array [val]
                setClaimedTerritories(Object.values(data));
            } else {
                setClaimedTerritories([]);
            }
        });

        return () => unsubscribe();
    }, []);

    // 2. Logic to claim new territory
    useEffect(() => {
        if (!currentLocation || !isRecording || !user) return; // Need user to claim

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
                    // --- ATTACK LOGIC (Cookie Cutter) ---
                    const newPolyGeo = poly.geometry;

                    // 1. Check against ALL existing territories
                    claimedTerritories.forEach(existing => {
                        // Skip my own team's land (Friendly Fire OFF)
                        const isEnemy = existing.team && user.team && existing.team !== user.team;
                        if (!isEnemy) return;

                        try {
                            // Check intersection
                            const intersectionWithEnemy = turf.intersect(newPolyGeo, existing.geometry);

                            if (intersectionWithEnemy) {
                                // Calculate Difference: Enemy - Me
                                const remaining = turf.difference(existing.geometry, newPolyGeo);

                                const territoryRef = ref(db, `territories/${existing.id}`);

                                if (!remaining) {
                                    // Total annihilation
                                    console.log("Destroyed territory:", existing.id);
                                    remove(territoryRef);
                                } else {
                                    // Partial shrinking
                                    const newArea = turf.area(remaining);
                                    console.log("Shrinking territory:", existing.id);
                                    update(territoryRef, {
                                        geometry: remaining.geometry,
                                        area: newArea
                                    });
                                }
                            }
                        } catch (err) {
                            console.error("Attack calculation failed:", err);
                        }
                    });

                    // --- Create My New Territory ---
                    const newTerritory = {
                        ...poly,
                        ownerType: gameMode,
                        ownerId: user.id,
                        ownerName: user.name,
                        team: user.team || 'neutral',
                        color: user.team === 'red' ? '#ef4444' : (user.team === 'blue' ? '#3b82f6' : '#10b981'),
                        timestamp: Date.now()
                    };

                    // PUSH to Firebase
                    const territoriesRef = ref(db, 'territories');
                    const newRef = push(territoriesRef, newTerritory); // Get ID

                    // Update ID in object just in case
                    update(newRef, { id: newRef.key });

                    setPath([newPoint]);
                    lastPointRef.current = newPoint;
                    return;
                }
            }
        }

        setPath(prev => [...prev, newPoint]);
        lastPointRef.current = newPoint;

    }, [currentLocation, isRecording, gameMode, user]);

    return {
        path,
        claimedTerritories,
        isRecording,
        setIsRecording,
        addDebugPoint: () => { }
    };
}
