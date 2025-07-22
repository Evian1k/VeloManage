import React from 'react';
import { MapPin, Truck, User, Navigation } from 'lucide-react';

const SimpleMap = ({ 
  truckLocation, 
  userLocation, 
  className = "",
  showRoute = false 
}) => {
  // Simple coordinate system - convert lat/lng to pixels
  const mapWidth = 400;
  const mapHeight = 300;
  
  // NYC area bounds for simulation
  const bounds = {
    north: 40.8,
    south: 40.6,
    east: -73.9,
    west: -74.1
  };

  const coordToPixel = (lat, lng) => {
    const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * mapWidth;
    const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * mapHeight;
    return { x: Math.max(0, Math.min(mapWidth, x)), y: Math.max(0, Math.min(mapHeight, y)) };
  };

  const truckPixel = truckLocation ? coordToPixel(truckLocation.lat, truckLocation.lng) : null;
  const userPixel = userLocation ? coordToPixel(userLocation.lat, userLocation.lng) : null;

  // Calculate distance (simple approximation)
  const getDistance = () => {
    if (!truckLocation || !userLocation) return null;
    
    const R = 6371; // Earth's radius in km
    const dLat = (userLocation.lat - truckLocation.lat) * Math.PI / 180;
    const dLng = (userLocation.lng - truckLocation.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(truckLocation.lat * Math.PI / 180) * Math.cos(userLocation.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance.toFixed(1);
  };

  const distance = getDistance();
  const estimatedTime = distance ? Math.ceil(distance * 2) : null; // Rough estimate: 2 min per km

  return (
    <div className={`bg-gray-800 rounded-lg border border-red-900/30 ${className}`}>
      {/* Map Header */}
      <div className="p-4 border-b border-red-900/30">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Live Tracking Map
        </h3>
        {distance && (
          <div className="flex gap-4 mt-2 text-sm text-gray-300">
            <span>Distance: {distance} km</span>
            <span>Est. Time: {estimatedTime} min</span>
          </div>
        )}
      </div>

      {/* Simple Map Canvas */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden rounded-lg">
        <svg width={mapWidth} height={mapHeight} className="w-full h-auto">
          {/* Grid pattern to simulate streets */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="1" opacity="0.3"/>
            </pattern>
            <pattern id="bigGrid" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M 120 0 L 0 0 0 120" fill="none" stroke="#4b5563" strokeWidth="2" opacity="0.4"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <rect width="100%" height="100%" fill="url(#bigGrid)" />
          
          {/* City landmarks simulation */}
          <rect x="50" y="50" width="60" height="40" fill="#1f2937" stroke="#374151" strokeWidth="1" opacity="0.6" />
          <rect x="200" y="120" width="80" height="50" fill="#1f2937" stroke="#374151" strokeWidth="1" opacity="0.6" />
          <rect x="350" y="200" width="70" height="35" fill="#1f2937" stroke="#374151" strokeWidth="1" opacity="0.6" />
          
          {/* Water/park areas */}
          <ellipse cx="400" cy="100" rx="30" ry="20" fill="#1e40af" opacity="0.3" />
          <ellipse cx="150" cy="250" rx="40" ry="25" fill="#059669" opacity="0.3" />
          
          {/* Route line */}
          {showRoute && truckPixel && userPixel && (
            <line
              x1={truckPixel.x}
              y1={truckPixel.y}
              x2={userPixel.x}
              y2={userPixel.y}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.7"
            />
          )}
          
          {/* Truck location */}
          {truckPixel && (
            <g>
              <circle
                cx={truckPixel.x}
                cy={truckPixel.y}
                r="8"
                fill="#3b82f6"
                stroke="#1d4ed8"
                strokeWidth="2"
              />
              <circle
                cx={truckPixel.x}
                cy={truckPixel.y}
                r="15"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1"
                opacity="0.3"
              >
                <animate
                  attributeName="r"
                  values="15;25;15"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.3;0;0.3"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          )}
          
          {/* User location */}
          {userPixel && (
            <g>
              <circle
                cx={userPixel.x}
                cy={userPixel.y}
                r="6"
                fill="#10b981"
                stroke="#059669"
                strokeWidth="2"
              />
              <circle
                cx={userPixel.x}
                cy={userPixel.y}
                r="12"
                fill="none"
                stroke="#10b981"
                strokeWidth="1"
                opacity="0.4"
              />
            </g>
          )}
        </svg>

        {/* Location Labels */}
        {truckPixel && (
          <div 
            className="absolute bg-blue-600 text-white text-xs px-2 py-1 rounded pointer-events-none"
            style={{ 
              left: `${(truckPixel.x / mapWidth) * 100}%`, 
              top: `${(truckPixel.y / mapHeight) * 100 - 5}%`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <Truck className="w-3 h-3 inline mr-1" />
            Truck
          </div>
        )}
        
        {userPixel && (
          <div 
            className="absolute bg-green-600 text-white text-xs px-2 py-1 rounded pointer-events-none"
            style={{ 
              left: `${(userPixel.x / mapWidth) * 100}%`, 
              top: `${(userPixel.y / mapHeight) * 100 - 5}%`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <User className="w-3 h-3 inline mr-1" />
            You
          </div>
        )}
      </div>

      {/* Location Details */}
      <div className="p-4 space-y-3">
        {truckLocation && (
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
            <div>
              <p className="text-sm font-medium text-blue-300">Truck Location</p>
              <p className="text-xs text-gray-400">
                {truckLocation.address || `${truckLocation.lat.toFixed(4)}, ${truckLocation.lng.toFixed(4)}`}
              </p>
              {truckLocation.lastUpdate && (
                <p className="text-xs text-gray-500">
                  Updated: {new Date(truckLocation.lastUpdate).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        )}
        
        {userLocation && (
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
            <div>
              <p className="text-sm font-medium text-green-300">Your Location</p>
              <p className="text-xs text-gray-400">
                {userLocation.address || `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`}
              </p>
              {userLocation.timestamp && (
                <p className="text-xs text-gray-500">
                  Shared: {new Date(userLocation.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        )}
        
        {!truckLocation && !userLocation && (
          <div className="text-center py-4">
            <MapPin className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No location data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleMap;