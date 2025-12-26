import * as turf from '@turf/turf';

// Check if the new segment (lastPoint -> newPoint) intersects any validation segments
// Exclude the immediate previous segment to avoid false positives
export function findIntersection(path, newPoint) {
    if (path.length < 3) return null;

    const currentLine = turf.lineString([
        [path[path.length - 1][1], path[path.length - 1][0]], // previous point (lng, lat)
        [newPoint[1], newPoint[0]] // new point (lng, lat)
    ]);

    // Check against all previous segments
    // Iterate backwards, skip the last segment (which connects to current start)
    for (let i = path.length - 2; i > 0; i--) {
        const segment = turf.lineString([
            [path[i][1], path[i][0]],
            [path[i - 1][1], path[i - 1][0]]
        ]);

        const intersects = turf.lineIntersect(currentLine, segment);
        if (intersects.features.length > 0) {
            return {
                intersectIndex: i - 1,   // The start index of the loop
                intersectPoint: intersects.features[0].geometry.coordinates // [lng, lat]
            };
        }
    }
    return null;
}

export function createPolygonFromPath(path, startIndex, intersectPoint) {
    // Extract Loop
    // Path is [lat, lng], convert to [lng, lat] for turf
    const loopPoints = path.slice(startIndex).map(p => [p[1], p[0]]);

    // Add intersect point to close cleanly if needed, or just let turf close it
    if (intersectPoint) {
        loopPoints.push(intersectPoint);
        loopPoints.push(loopPoints[0]); // Ensure closure
    } else {
        loopPoints.push(loopPoints[0]);
    }

    try {
        const polygon = turf.polygon([loopPoints]);
        // Calculate Area
        const area = turf.area(polygon);

        // Filter small glitches
        if (area < 10) return null; // Minimum 10 sq meters (lowered for testing)

        return {
            geometry: polygon.geometry, // Return raw GEOMETRY, not the Feature wrapper
            area: area,
            id: Date.now()
        };

    } catch (e) {
        console.error("Failed to create polygon", e);
        return null;
    }
}
