import { Polygon, Tooltip } from 'react-leaflet';

export default function TerritoryLayer({ territories }) {
    return (
        <>
            {territories.map((territory) => {
                if (!territory?.geometry?.coordinates?.[0]) return null;

                return (
                    <Polygon
                        key={territory.id}
                        positions={territory.geometry.coordinates[0].map(coord => [coord[1], coord[0]])}
                        pathOptions={{
                            color: territory.color || '#3b82f6',
                            fillColor: territory.color || '#3b82f6',
                            fillOpacity: 0.4,
                            weight: 2
                        }}
                    >
                        <Tooltip sticky direction="center" className="bg-game-surface text-gray-200 font-orbitron border-game-primary">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider opacity-70">
                                    {territory.ownerName || (territory.ownerType === 'shared' ? 'SHARED ZONE' : 'MY CLAN')}
                                </span>
                                <span>{Math.round(territory.area)} m²</span>
                            </div>
                        </Tooltip>
                    </Polygon>
                );
            })}
        </>
    );
}
