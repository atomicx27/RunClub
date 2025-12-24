import { useEffect, useState } from 'react';
import { ref, set, onValue, onDisconnect } from 'firebase/database';
import { db } from '../firebase';

export function useMultiplayer(user, currentLocation) {
    const [rivals, setRivals] = useState([]);

    // 1. Sync MY location to Firebase
    useEffect(() => {
        if (!user || !currentLocation || !db) return;

        const userRef = ref(db, `locations/${user.id}`);

        // Write location to DB
        // We use .set() which overwrites the node
        set(userRef, {
            id: user.id,
            name: user.name,
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            accuracy: currentLocation.accuracy,
            timestamp: Date.now(),
            team: user.team || 'blue', // Force default
            color: user.color || '#ff0000'
        }).catch(err => console.error("Firebase Sync Error:", err));

        // Cleanup: Remove my dot when I disconnect
        onDisconnect(userRef).remove();

    }, [user, currentLocation]);

    // 2. Listen for OTHERS
    useEffect(() => {
        if (!db) return;

        const allLocationsRef = ref(db, 'locations');

        const unsubscribe = onValue(allLocationsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const rivalList = Object.values(data)
                    .filter(p => p.id !== user?.id); // Exclude myself
                // .filter(p => Date.now() - p.timestamp < 300000); // FILTER REMOVED // Disable time filter for debugging

                setRivals(rivalList);
            } else {
                setRivals([]);
            }
        });

        return () => unsubscribe();
    }, [user]);

    return { rivals };
}
