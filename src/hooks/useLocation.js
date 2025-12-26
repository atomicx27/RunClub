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

            // Filter out points with poor accuracy
            if (accuracy > 50) return;

            setLocation(prev => {
                if (!prev) {
                    return {
                        lat: latitude,
                        lng: longitude,
                        accuracy,
                        speed,
                        heading,
                        timestamp: position.timestamp
                    };
                }

                // Calculate distance to check for large jumps (teleport)
                const dLat = Math.abs(latitude - prev.lat);
                const dLng = Math.abs(longitude - prev.lng);

                // Roughly > 0.0002 degrees is ~20 meters. Max usage is walking/running.
                const isLargeJump = dLat > 0.0002 || dLng > 0.0002;

                // Smoothing factor. 1 = instant, 0.1 = super smooth lag.
                // 0.6 means taking 60% of new data, keeping 40% of old.
                const alpha = isLargeJump ? 1 : 0.6;

                return {
                    lat: prev.lat + (latitude - prev.lat) * alpha,
                    lng: prev.lng + (longitude - prev.lng) * alpha,
                    accuracy, // Always take latest accuracy
                    speed,
                    heading,
                    timestamp: position.timestamp
                };
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
