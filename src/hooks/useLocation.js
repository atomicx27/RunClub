import { useState, useEffect } from 'react';

export function useLocation() {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);

    // For smoothing/debug, we might add more state here later (e.g. speed, accuracy)

    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        const options = {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 20000
        };

        const handleSuccess = (position) => {
            const { latitude, longitude, accuracy, speed, heading } = position.coords;

            // Filter out points with poor accuracy (e.g. > 50 meters)
            if (accuracy > 50) {
                // console.log("Ignored weak GPS signal:", accuracy);
                return;
            }

            setLocation({
                lat: latitude,
                lng: longitude,
                accuracy,
                speed,
                heading,
                timestamp: position.timestamp
            });
            setError(null);
        };

        const handleError = (error) => {
            setError(`Location error: ${error.message}`);
        };

        const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, options);

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return { location, error };
}
