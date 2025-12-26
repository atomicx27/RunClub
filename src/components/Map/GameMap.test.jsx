import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameMap from './GameMap';
import { UserProvider } from '../../context/UserContext';

// Mock dependencies
vi.mock('react-leaflet', () => ({
    MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: () => <div data-testid="marker" />,
    Popup: ({ children }) => <div data-testid="popup">{children}</div>,
    useMap: () => ({ panTo: vi.fn() }),
    Polyline: () => <div data-testid="polyline" />,
    useMapEvents: () => null,
    Circle: () => <div data-testid="circle" />,
}));

vi.mock('../../hooks/useLocation', () => ({
    useLocation: () => ({ location: { lat: 0, lng: 0 }, error: null }),
}));

vi.mock('../../hooks/useGameLogic', () => ({
    useGameLogic: () => ({
        path: [],
        claimedTerritories: [],
        addDebugPoint: vi.fn(),
        isRecording: true
    }),
}));

vi.mock('../../hooks/useMultiplayer', () => ({
    useMultiplayer: () => ({ rivals: [] }),
}));

describe('GameMap', () => {
    it('renders map container', () => {
        render(
            <UserProvider>
                <GameMap />
            </UserProvider>
        );
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    it('renders map container in default state', () => {
        render(
            <UserProvider>
                <GameMap />
            </UserProvider>
        );
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
});
