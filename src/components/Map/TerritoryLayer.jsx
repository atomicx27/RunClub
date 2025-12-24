import { Polygon, Tooltip } from 'react-leaflet';

export default function TerritoryLayer({ territories }) {
    return (
        <>
            {territories.map((territory) => {
                if (!territory?.geometry?.coordinates) return null;

                const positions = territory.geometry.type === 'MultiPolygon'
                    ? territory.geometry.coordinates.map(poly => poly[0].map(coord => [coord[1], coord[0]])) // [ [ [lat,lng] ] ]
                    : [territory.geometry.coordinates[0].map(coord => [coord[1], coord[0]])]; // [ [lat,lng] ]

                return (
                    <Polygon
                        key={territory.id}
                        positions={positions}
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
