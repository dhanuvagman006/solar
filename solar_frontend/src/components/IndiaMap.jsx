import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMapEvents, Marker, Popup, useMap } from 'react-leaflet';
import toast from 'react-hot-toast';
import { resolveLocation, fetchWeather } from '../api/location';
import { useLocationStore } from '../store/locationStore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Sun SVG Icon
const sunIcon = new L.DivIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun drop-shadow-md bg-white rounded-full p-1 border border-orange-200"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  className: 'custom-sun-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Component to handle map clicks and location selection
const MapEvents = ({ onLocationSelected, isSelecting }) => {
  useMapEvents({
    click: async (e) => {
      if (isSelecting) return;
      const { lat, lng } = e.latlng;
      onLocationSelected(lat, lng);
    },
  });
  return null;
};

// Component to dynamically pan the map
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};


const IndiaMap = ({ onSelectComplete }) => {
  const [geoData, setGeoData] = useState(null);
  const [markerPos, setMarkerPos] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  
  const selectedLocation = useLocationStore((state) => state.location);
  const setLocation = useLocationStore((state) => state.setLocation);
  const setWeather = useLocationStore((state) => state.setWeather);

  useEffect(() => {
    fetch('/india.json')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Error loading GeoJSON", err));

    if (selectedLocation) {
        setMarkerPos([selectedLocation.latitude, selectedLocation.longitude]);
    }
  }, []);

  const handleLocationSelected = async (lat, lng) => {
    setIsSelecting(true);
    setMarkerPos([lat, lng]); // optimistic update
    
    try {
      toast.loading('Resolving location...', { id: 'loc-resolve' });
      const locData = await resolveLocation(lat, lng);
      
      // Update marker with snapped coordinates from backend
      setMarkerPos([locData.latitude, locData.longitude]);
      setLocation(locData);

      toast.loading('Fetching live weather...', { id: 'loc-resolve' });
      const weatherData = await fetchWeather(locData.latitude, locData.longitude, locData.location_id);
      
      setWeather(weatherData);
      toast.success(`Location set: ${locData.city}`, { id: 'loc-resolve' });
      
      if(onSelectComplete) onSelectComplete();

    } catch (error) {
      console.error(error);
      setMarkerPos(null);
      const msg = error.response?.data?.error || 'Failed to select location';
      toast.error(msg, { id: 'loc-resolve' });
    } finally {
      setIsSelecting(false);
    }
  };

  const getStyle = (feature) => {
    // simplified styling, mapping state name to zone conceptually or just returning default 
    // since we don't have perfect mapping on frontend, we'll give a slight nice color.
    // The actual zone is computed on backend mostly.
    return {
      fillColor: '#60a5fa', // Default blue-ish
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.3
    };
  };

  const onEachFeature = (feature, layer) => {
    layer.on('mouseover', function () {
      this.setStyle({ fillOpacity: 0.6 });
    });
    layer.on('mouseout', function () {
      this.setStyle({ fillOpacity: 0.3 });
    });
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-sm border border-slate-200">
      <MapContainer
        center={[20.59, 78.96]}
        zoom={5}
        minZoom={4}
        maxZoom={18}
        style={{ height: '500px', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {geoData && (
          <GeoJSON 
            data={geoData} 
            style={getStyle}
            onEachFeature={onEachFeature}
          />
        )}
        
        {markerPos && (
          <Marker position={markerPos} icon={sunIcon}>
            {selectedLocation && (
              <Popup>
                <div className="text-center font-sans">
                  <p className="font-bold text-slate-800 text-base m-0 leading-tight">
                    {selectedLocation.city}
                  </p>
                  <p className="text-slate-500 text-xs m-0 mt-1">
                    {selectedLocation.state}
                  </p>
                  <div className="mt-2 text-xs font-semibold px-2 py-1 bg-orange-100 text-orange-700 rounded-full inline-block">
                    Zone {selectedLocation.solar_zone}
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        )}
        
        <MapEvents onLocationSelected={handleLocationSelected} isSelecting={isSelecting} />
        {selectedLocation && <MapUpdater center={[selectedLocation.latitude, selectedLocation.longitude]} />}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md z-10 text-xs border border-slate-100">
        <h4 className="font-semibold text-slate-700 mb-2">Solar Zones</h4>
        <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 bg-orange-500 rounded-sm inline-block"></div><span>Zone 1 (High)</span></div>
        <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 bg-yellow-500 rounded-sm inline-block"></div><span>Zone 2 (Medium)</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-sm inline-block"></div><span>Zone 3 (Moderate)</span></div>
      </div>
    </div>
  );
};

export default IndiaMap;
