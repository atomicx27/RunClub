import { useState, useEffect, useRef } from 'react';
import * as turf from '@turf/turf';
import { findIntersection, createPolygonFromPath } from '../utils/geometry';
import { db } from '../firebase';
import { ref, push, onValue } from 'firebase/database';
import { useUser } from '../context/UserContext';

export function useGameLogic(currentLocation, gameMode = 'solo') {
    const { user } = useUser();
    const [path, setPath] = useState([]);
    const [claimedTerritories, setClaimedTerritories] = useState([]);
    const [isRecording, setIsRecording] = useState(true);

    const lastPointRef = useRef(null);

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
                    // Create Territory Object
                    const newTerritory = {
                        ...poly,
                        ownerType: gameMode,
                        ownerId: user.id,
                        ownerName: user.name,
                        team: user.team || 'neutral', // Use user's team
                        color: user.team === 'red' ? '#ef4444' : (user.team === 'blue' ? '#3b82f6' : '#10b981'),
                        timestamp: Date.now()
                    };

                    // PUSH to Firebase (Global State)
                    const territoriesRef = ref(db, 'territories');
                    push(territoriesRef, newTerritory).catch(err => console.error("Claim Failed:", err));

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
