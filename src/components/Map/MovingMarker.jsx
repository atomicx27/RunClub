import { useRef, useEffect } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

// Helper to interpolate between two coordinates
const interpolate = (start, end, fraction) => {
    return start + (end - start) * fraction;
};

export default function MovingMarker({ position, duration = 1000, ...props }) {
    const markerRef = useRef(null);
    const prevPosRef = useRef(position);
    const startTimeRef = useRef(null);
    const animFrameRef = useRef(null);

    useEffect(() => {
        // If position hasn't changed, do nothing
        if (prevPosRef.current[0] === position[0] && prevPosRef.current[1] === position[1]) {
            return;
        }

        const startPos = prevPosRef.current;
        const targetPos = position;
        startTimeRef.current = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out function for nicer feel (cubic-bezierish)
            // const ease = 1 - Math.pow(1 - progress, 3); 
            const ease = progress; // Linear is often better for map tracking to avoid "catching up" lag effect

            if (markerRef.current) {
                const currentLat = interpolate(startPos[0], targetPos[0], ease);
                const currentLng = interpolate(startPos[1], targetPos[1], ease);
                markerRef.current.setLatLng([currentLat, currentLng]);
            }

            if (progress < 1) {
                animFrameRef.current = requestAnimationFrame(animate);
            } else {
                prevPosRef.current = targetPos; // Animation complete, update ref
            }
        };

        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animFrameRef.current);
    }, [position, duration]);

    // Initial render
    return <Marker ref={markerRef} position={position} {...props} />;
}
