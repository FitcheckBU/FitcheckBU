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
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<[number, number]>([42.3505, -71.1054]); // Boston University default
  const [radius, setRadius] = useState(2000); // 2km default
  const [stores, setStores] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Force map re-render

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
      if (!apiKey) {
        console.error("Geoapify API key not found. Please add VITE_GEOAPIFY_API_KEY to your environment variables.");
        setStores([]);
        return;
      }

      // Search for thrift stores, secondhand shops, charity shops, vintage stores
      const categories = [
        "commercial.second_hand",
        "commercial.charity", 
        "commercial.vintage",
      ].join(",");

      const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lon},${lat},${radius}&limit=20&apiKey=${apiKey}`;
      console.log("Searching for stores at:", lat, lon, "with radius:", radius);

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error: ${response.status}`, errorText);
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API Response:", data);
      console.log("Found stores:", data.features?.length || 0);
      
      const places: Place[] = (data.features || []).map((feature: any) => ({
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
        name: feature.properties.name || feature.properties.datasource?.raw?.name || "Thrift Store",
        address: feature.properties.formatted || feature.properties.address_line1 || "Address not available",
        distance: feature.properties.distance || 0,
      }));

      setStores(places);
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
      {/* Address Input - Uber Eats style */}
      <div className="map-search-bar">
        <div className="map-search-wrapper">
          <IonIcon icon={locateOutline} className="map-search-icon" />
          <input
            type="text"
            value={address}
            onChange={(e) => handleAddressInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter your address..."
            className="map-search-input"
            data-testid="input-address"
          />
          <button 
            className="map-search-button"
            onClick={handleSearch}
            disabled={loading || !address}
            data-testid="button-search-stores"
          >
            {loading ? (
              <div className="map-loading-spinner"></div>
            ) : (
              <IonIcon icon={searchOutline} />
            )}
          </button>
        </div>

        {/* Address Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="map-suggestions-dropdown">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="map-suggestion-item"
                onClick={() => selectAddress(suggestion)}
                data-testid={`suggestion-${index}`}
              >
                <IonIcon icon={locateOutline} className="suggestion-icon" />
                <div className="suggestion-text">
                  <div className="suggestion-main">{suggestion.properties.address_line1}</div>
                  <div className="suggestion-secondary">{suggestion.properties.address_line2}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Radius Control */}
      <div className="map-radius-control">
        <label className="radius-label">Search Radius:</label>
        <select 
          className="radius-select"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          data-testid="select-radius"
        >
          <option value={500}>0.5 km</option>
          <option value={1000}>1 km</option>
          <option value={2000}>2 km</option>
          <option value={5000}>5 km</option>
          <option value={10000}>10 km</option>
        </select>
      </div>

      {/* Map */}
      <div className="map-wrapper">
        <MapContainer
          key={mapKey}
          center={location}
          zoom={14}
          className="leaflet-map"
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <MapUpdater center={location} zoom={14} />
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

      {/* Store List */}
      {!loading && stores.length > 0 && (
        <div className="map-store-list">
          <div className="store-list-header">
            {stores.length} thrift {stores.length === 1 ? "store" : "stores"} nearby
          </div>
          <div className="store-list-items">
            {stores.slice(0, 5).map((store, index) => (
              <div key={index} className="store-list-item" data-testid={`store-item-${index}`}>
                <div className="store-item-name">{store.name}</div>
                <div className="store-item-address">{store.address}</div>
                <div className="store-item-distance">{(store.distance / 1000).toFixed(2)} km away</div>
              </div>
            ))}
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
