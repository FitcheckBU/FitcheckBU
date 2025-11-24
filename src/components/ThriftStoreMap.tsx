import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import { IonIcon } from "@ionic/react";
import { searchOutline, locateOutline } from "ionicons/icons";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./ThriftStoreMap.css";

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Place {
  lat: number;
  lon: number;
  name: string;
  address: string;
  distance: number;
}

interface MapUpdaterProps {
  center: [number, number];
  zoom: number;
}

const MapUpdater: React.FC<MapUpdaterProps> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    // Force map to recalculate size
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [center, zoom, map]);
  return null;
};

const ThriftStoreMap: React.FC = () => {
  const [address, setAddress] = useState("Boston University, Boston, MA");
  const [location, setLocation] = useState<[number, number]>([42.3505, -71.1054]); // Boston University default
  const [radius, setRadius] = useState(5000); // 5km default for better coverage
  const [stores, setStores] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Force map re-render
  const [selectedStore, setSelectedStore] = useState<Place | null>(null);

  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

  // Load initial stores on mount
  useEffect(() => {
    searchNearbyStores(location[0], location[1]);
  }, []);

  // Get address suggestions as user types
  const handleAddressInput = async (value: string) => {
    setAddress(value);
    
    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(value)}&limit=5&apiKey=${apiKey}`
      );
      const data = await response.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
    }
  };

  // Select an address from suggestions
  const selectAddress = async (suggestion: any) => {
    const { lat, lon } = suggestion.properties;
    const formattedAddress = suggestion.properties.formatted;
    
    setAddress(formattedAddress);
    setLocation([lat, lon]);
    setShowSuggestions(false);
    setMapKey(prev => prev + 1); // Force map re-render
    
    // Search for stores at this location
    await searchNearbyStores(lat, lon);
  };

  // Search for thrift stores near location
  const searchNearbyStores = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      // Sample thrift stores in Boston area
      const bostonThriftStores = [
        { name: "Thrifty Threads", lat: 42.3505, lon: -71.0900, address: "123 Commonwealth Ave, Boston, MA" },
        { name: "2nd Street Coolidge Corner", lat: 42.3424, lon: -71.1255, address: "1348 Beacon St, Brookline, MA" },
        { name: "Buffalo Exchange", lat: 42.3480, lon: -71.0812, address: "238 Newbury St, Boston, MA" },
        { name: "Groovy Thrifty", lat: 42.3398, lon: -71.0892, address: "678 Centre St, Jamaica Plain, MA" },
        { name: "DIVERSITY Men's and Women's", lat: 42.3141, lon: -71.0650, address: "80 South St, Boston, MA" },
        { name: "Boomerangs", lat: 42.3434, lon: -71.0934, address: "716 Centre St, Jamaica Plain, MA" },
        { name: "Garment District", lat: 42.3643, lon: -71.0851, address: "200 Broadway, Cambridge, MA" },
        { name: "Urban Renewals", lat: 42.3656, lon: -71.1040, address: "122 Brighton Ave, Allston, MA" },
      ];

      // Calculate distance for each store
      const places: Place[] = bostonThriftStores.map((store) => {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat * Math.PI/180;
        const φ2 = store.lat * Math.PI/180;
        const Δφ = (store.lat - lat) * Math.PI/180;
        const Δλ = (store.lon - lon) * Math.PI/180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        return {
          lat: store.lat,
          lon: store.lon,
          name: store.name,
          address: store.address,
          distance: distance,
        };
      });

      // Filter by radius and sort by distance
      const filtered = places.filter(place => place.distance <= radius);
      filtered.sort((a, b) => a.distance - b.distance);
      
      setStores(filtered);
    } catch (error: any) {
      console.error("Error searching for stores:", error.message || error);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  // Search at current location
  const handleSearch = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      // Geocode the address
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&limit=1&apiKey=${apiKey}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const { lat, lon } = data.features[0].properties;
        setLocation([lat, lon]);
        setMapKey(prev => prev + 1); // Force map re-render
        await searchNearbyStores(lat, lon);
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
    } finally {
      setLoading(false);
    }
  };

  // Custom marker icon for thrift stores
  const storeIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  return (
    <div className="thrift-map-container" data-testid="container-thrift-map">
      {/* Map */}
      <div className="map-wrapper">
        <MapContainer
          key={mapKey}
          center={selectedStore ? [selectedStore.lat, selectedStore.lon] : location}
          zoom={selectedStore ? 15 : 14}
          className="leaflet-map"
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <MapUpdater 
            center={selectedStore ? [selectedStore.lat, selectedStore.lon] : location} 
            zoom={selectedStore ? 15 : 14} 
          />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* User location marker */}
          <Marker position={location}>
            <Popup>
              <strong>Your Location</strong>
              <br />
              {address || "Boston University"}
            </Popup>
          </Marker>

          {/* Search radius circle */}
          <Circle
            center={location}
            radius={radius}
            pathOptions={{
              color: "#023e38",
              fillColor: "#ffeda8",
              fillOpacity: 0.2,
            }}
          />

          {/* Store markers */}
          {stores.map((store, index) => (
            <Marker
              key={index}
              position={[store.lat, store.lon]}
              icon={storeIcon}
            >
              <Popup>
                <strong>{store.name}</strong>
                <br />
                {store.address}
                <br />
                <em>{(store.distance / 1000).toFixed(2)} km away</em>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Near By Section - Clean design like screenshot */}
      {!loading && stores.length > 0 && !selectedStore && (
        <div className="nearby-section">
          <div className="nearby-header">Near By:</div>
          <div className="nearby-list">
            {stores.slice(0, 8).map((store, index) => (
              <div 
                key={index} 
                className="nearby-item" 
                onClick={() => setSelectedStore(store)}
                data-testid={`store-item-${index}`}
              >
                <svg 
                  className="nearby-pin-icon" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none"
                >
                  <path 
                    d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" 
                    fill="#023E38"
                  />
                </svg>
                <div className="nearby-item-content">
                  <div className="nearby-item-name">{store.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store Detail View */}
      {selectedStore && (
        <div className="store-detail-view">
          <div className="store-detail-name">{selectedStore.name}</div>
          <div className="store-detail-address">{selectedStore.address}</div>
          
          <div className="store-action-buttons">
            <button className="store-btn store-btn-primary" data-testid="button-directions">
              Directions
            </button>
            <button className="store-btn store-btn-secondary" data-testid="button-call">
              Call
            </button>
            <button className="store-btn store-btn-secondary" data-testid="button-website">
              Website
            </button>
          </div>
        </div>
      )}

      {/* No stores message */}
      {!loading && stores.length === 0 && address && (
        <div className="map-no-stores">
          <div className="no-stores-icon">🏪</div>
          <div className="no-stores-text">No thrift stores found within {radius / 1000} km</div>
          <div className="no-stores-hint">Try increasing the search radius or searching a different area</div>
        </div>
      )}
    </div>
  );
};

export default ThriftStoreMap;
