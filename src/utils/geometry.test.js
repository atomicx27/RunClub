import { describe, it, expect } from 'vitest';
import { findIntersection } from './geometry';

describe('geometry utils', () => {
    describe('findIntersection', () => {
        it('should return null for non-intersecting paths', () => {
            const path = [[0, 0], [1, 1], [2, 2]];
            const newPoint = [3, 3];
            const result = findIntersection(path, newPoint);
            expect(result).toBeNull();
        });

        it('should detect intersection when path loops back', () => {
            // A simple square path: (0,0) -> (0,10) -> (10,10) -> (10,0) -> (0,0)
            const path = [
                [0, 0],
                [0, 10],
                [10, 10],
                [10, 0]
            ];
            // New segment going from (10,0) to (-1,0) should intersect with (0,0)-(0,10) at (0,0) approximately
            // But lineIntersects works on segments.
            // Segment 1: (0,0)-(0,10)
            // Segment 2: (0,10)-(10,10)
            // Segment 3: (10,10)-(10,0)
            // New Segment: (10,0)-( -5, 5 ) -> Crosses (0,0)-(0,10) at (0, 5)

            const newPoint = [-5, 5];
            const result = findIntersection(path, newPoint);

            expect(result).not.toBeNull();
            if (result) {
                expect(result.intersectIndex).toBe(0); // Should intersect with the first segment
            }
        });
    });
});
