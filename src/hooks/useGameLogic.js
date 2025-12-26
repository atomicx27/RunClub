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


                        // validate geometries
                        if (!newPolyGeo || !existing.geometry) return;

                        try {
                            // Normalize inputs: We want FEATURES for intersect
                            const toFeature = (input, label) => {
                                if (!input) {
                                    console.error(`${label} is null/undefined`);
                                    return null;
                                }
                                if (input.type === 'Feature') return input;
                                if (input.type === 'Polygon' || input.type === 'MultiPolygon') {
                                    return turf.feature(input);
                                }
                                console.error(`${label} has unknown type:`, input.type, input);
                                return null;
                            };

                            const newFeature = toFeature(newPolyGeo, "NewPoly");
                            const existingFeature = toFeature(existing.geometry, "ExistingPoly");

                            if (!newFeature || !existingFeature) {
                                console.warn("Skipping attack check due to invalid feature.");
                                return;
                            }

                            // Check intersection
                            // Turf v7: intersect takes a FeatureCollection
                            const intersectionWithEnemy = turf.intersect(turf.featureCollection([newFeature, existingFeature]));

                            if (intersectionWithEnemy) {
                                // Calculate Difference: Enemy - Me
                                // Turf v7: difference takes a FeatureCollection (First - Others)
                                const remaining = turf.difference(turf.featureCollection([existingFeature, newFeature]));

                                const territoryRef = ref(db, `territories/${existing.id}`);

                                if (!remaining) {
                                    // Total annihilation
                                    console.log("Destroyed territory:", existing.id);
                                    remove(territoryRef);
                                } else {
                                    // Partial shrinking
                                    const newArea = turf.area(remaining);
                                    console.log("Shrinking territory:", existing.id);

                                    // IMPORTANT: 'remaining' is a Feature. 
                                    // We must store the GEOMETRY part if we expect raw geometry later,
                                    // OR store the whole Feature if that's our convention.
                                    // Based on 'createPolygonFromPath', we store 'geometry: polygon' which IS a Feature.
                                    // So we should be consistent.

                                    update(territoryRef, {
                                        geometry: remaining.geometry || remaining, // Handle if difference returns Feature or Geometry
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
                        ownerId: user.id || 'sim-user',
                        ownerName: user.name || 'SIMULATED_HACKER',
                        team: user.team || 'blue', // Default to blue
                        color: (user.team === 'red') ? '#ef4444' : '#3b82f6',
                        timestamp: Date.now()
                    };

                    // PUSH to Firebase
                    const territoriesRef = ref(db, 'territories');
                    // We can't await inside useEffect easily, but push is effectively sync for offline support
                    const newRef = push(territoriesRef, newTerritory);

                    // Update ID
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
