import { IonPage, IonContent, IonIcon } from "@ionic/react";
import {
  bookmarkOutline,
  personOutline,
  searchOutline,
  closeOutline,
} from "ionicons/icons";
import { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import {
  getUnsoldItems,
  InventoryItem,
  getItemImageUrls,
} from "../lib/inventoryService";
import ThriftStoreMap from "../components/ThriftStoreMap";
import Logo from "../components/Logo";
import "../styles/pages/BuyerDashboard.css";

interface AddressSuggestion {
  formatted: string;
  lat: number;
  lon: number;
}

interface GeoapifyFeature {
  properties: {
    formatted: string;
    lat: number;
    lon: number;
  };
}

interface ThriftStore {
  name: string;
  address: string;
  imageUrl: string;
}

const BuyerDashboard: React.FC = () => {
  const history = useHistory();
  const [searchText, setSearchText] = useState("");
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [itemImages, setItemImages] = useState<{ [key: string]: string }>({});
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    "Jeans",
    "Tees",
    "Hoodies",
    "Tops",
  ]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [showProximityDropdown, setShowProximityDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [selectedProximity, setSelectedProximity] = useState<string | null>(
    null,
  );
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [locationText, setLocationText] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<
    AddressSuggestion[]
  >([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  
  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const thriftStores: ThriftStore[] = [
    {
      name: "Shop Local Thrift",
      address: "Find unique pieces near you",
      imageUrl: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&q=80"
    },
    {
      name: "Goodwill",
      address: "965 Commonwealth Ave, Boston",
      imageUrl: "/goodwill-commave.png"
    },
    {
      name: "Boomerangs",
      address: "716 Centre St, Jamaica Plain",
      imageUrl: "/boomerangs-jp.png"
    }
  ];

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
        setShowProximityDropdown(false);
        setShowPriceDropdown(false);
      }
    };

    if (showSearchDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearchDropdown]);

  // Carousel auto-advance
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % thriftStores.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [thriftStores.length]);

  // Load all items on mount
  useEffect(() => {
    const loadItems = async () => {
      try {
        const items = await getUnsoldItems();
        setAllItems(items);
      } catch (error) {
        console.error("Error loading items:", error);
      }
    };
    loadItems();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchText.trim() === "") {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const searchLower = searchText.toLowerCase();
    
    // Map display categories to actual categories
    const categoryMap: { [key: string]: string[] } = {
      'shirts': ['tops', 'shirt'],
      'tees': ['tops', 'tee', 't-shirt'],
      'jeans': ['bottoms', 'jean', 'denim'],
      'sweat pants': ['bottoms', 'sweatpants', 'jogger'],
      'sweatpants': ['bottoms', 'sweatpants', 'jogger'],
      'sneakers': ['shoes', 'sneaker'],
      'heels': ['shoes', 'heel', 'pump'],
    };
    
    const mappedTerms = categoryMap[searchLower] || [searchLower];
    
    let filtered = allItems.filter((item) => {
      // Check if any mapped term matches
      const matchesMappedTerm = mappedTerms.some(term => 
        item.name?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term) ||
        item.style?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
      
      // Also do regular search
      const matchesSearch = 
        item.name?.toLowerCase().includes(searchLower) ||
        item.brand?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower) ||
        item.color?.toLowerCase().includes(searchLower) ||
        item.size?.toLowerCase().includes(searchLower) ||
        item.style?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower);
      
      return matchesMappedTerm || matchesSearch;
    });

    // Apply price filter if selected
    if (selectedPrice) {
      filtered = filtered.filter((item) => {
        const price = item.price || 0;
        switch (selectedPrice) {
          case "Under $20":
            return price < 20;
          case "$20 - $50":
            return price >= 20 && price <= 50;
          case "$50 - $100":
            return price >= 50 && price <= 100;
          case "Over $100":
            return price > 100;
          default:
            return true;
        }
      });
    }

    setSearchResults(filtered);
    setIsSearching(true);

    // Load images for search results
    filtered.slice(0, 20).forEach(async (item) => {
      if (!item.id) return;
      if (!itemImages[item.id]) {
        try {
          const urls = await getItemImageUrls(item);
          if (urls.length > 0) {
            setItemImages((prev) => ({ ...prev, [item.id!]: urls[0] }));
          }
        } catch (error) {
          console.error(`Error loading image for item ${item.id}:`, error);
        }
      }
    });
  }, [searchText, allItems, itemImages, selectedPrice, selectedProximity]);

  const clearSearch = () => {
    setSearchText("");
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleCategoryClick = (category: string) => {
    setSearchText(category);
    setShowSearchDropdown(false);
  };

  const handleRecentClick = (search: string) => {
    setSearchText(search);
    setShowSearchDropdown(false);
  };

  const clearRecents = () => {
    setRecentSearches([]);
  };

  const handleSearch = () => {
    setShowSearchDropdown(false);
    setIsSearching(true);
  };

  const handleItemClick = (itemId: string) => {
    history.push(`/item/${itemId}`, { fromBuyer: true });
  };

  const handleProximitySelect = (value: string) => {
    setSelectedProximity(value);
    setShowProximityDropdown(false);
  };

  const handlePriceSelect = (value: string) => {
    setSelectedPrice(value);
    setShowPriceDropdown(false);
  };

  // Fetch address suggestions from Geoapify
  useEffect(() => {
    if (locationText.trim().length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    const fetchAddressSuggestions = async () => {
      try {
        const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
        const response = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(locationText)}&apiKey=${apiKey}&limit=5`,
        );
        const data = await response.json();

        if (data.features) {
          const suggestions: AddressSuggestion[] = data.features.map(
            (feature: GeoapifyFeature) => ({
              formatted: feature.properties.formatted,
              lat: feature.properties.lat,
              lon: feature.properties.lon,
            }),
          );
          setAddressSuggestions(suggestions);
          setShowAddressSuggestions(true);
        }
      } catch (error) {
        console.error("Error fetching address suggestions:", error);
      }
    };

    const debounce = setTimeout(fetchAddressSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [locationText]);

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    setLocationText(suggestion.formatted);
    setShowAddressSuggestions(false);
  };

  return (
    <IonPage>
      <IonContent className="buyer-dashboard">
        {/* Navbar - Exact Figma specs */}
        <div className="buyer-header">
          <IonIcon
            icon={bookmarkOutline}
            className="buyer-header-icon-left"
            data-testid="icon-bookmark"
            onClick={() => history.push("/buyer-saved")}
            style={{ cursor: "pointer" }}
          />
          <Logo variant="buyer" className="buyer-title" />
          <IonIcon
            icon={personOutline}
            className="buyer-header-icon-right"
            data-testid="icon-profile"
            onClick={() => history.push("/buyer-settings")}
            style={{ cursor: "pointer" }}
          />
        </div>

        {/* Body - Yellow background */}
        <div className="buyer-body">
          {/* Search Bar - Exact Figma specs */}
          <div className="buyer-search-container" ref={searchContainerRef}>
            <div className="buyer-search-wrapper">
              <IonIcon icon={searchOutline} className="buyer-search-icon" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Search Name, Size, Color, Etc."
                className="buyer-search-input"
                data-testid="input-search"
              />
              {searchText && (
                <IonIcon
                  icon={closeOutline}
                  className="buyer-clear-icon"
                  onClick={clearSearch}
                  data-testid="button-clear-search"
                />
              )}
              <svg
                className="buyer-filter-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                data-testid="icon-filter"
              >
                <path
                  d="M3 7H9M9 7C9 8.65685 10.3431 10 12 10C13.6569 10 15 8.65685 15 7M9 7C9 5.34315 10.3431 4 12 4C13.6569 4 15 5.34315 15 7M15 7H21M3 17H9M9 17C9 18.6569 10.3431 20 12 20C13.6569 20 15 18.6569 15 17M9 17C9 15.3431 10.3431 14 12 14C13.6569 14 15 15.3431 15 17M15 17H21"
                  stroke="#7B9996"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Search Dropdown Menu */}
            {showSearchDropdown && (
              <div
                className="buyer-search-dropdown"
                data-testid="search-dropdown"
              >
                <div className="search-dropdown-content">
                  {/* Location Section */}
                  <div className="search-dropdown-section">
                    <div className="search-dropdown-label">Location:</div>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        value={locationText}
                        onChange={(e) => setLocationText(e.target.value)}
                        placeholder="Search City, State, Zip Code"
                        className="search-location-input"
                        data-testid="input-location"
                      />
                      {showAddressSuggestions &&
                        addressSuggestions.length > 0 && (
                          <div
                            className="address-suggestions"
                            data-testid="address-suggestions"
                          >
                            {addressSuggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                className="address-suggestion-item"
                                onClick={() => handleAddressSelect(suggestion)}
                                data-testid={`address-suggestion-${index}`}
                              >
                                {suggestion.formatted}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Filter Buttons */}
                  <div className="search-filter-buttons">
                    <div className="filter-btn-wrapper">
                      <button
                        className="search-filter-btn"
                        onClick={() => {
                          setShowProximityDropdown(!showProximityDropdown);
                          setShowPriceDropdown(false);
                        }}
                        data-testid="button-proximity"
                      >
                        {selectedProximity || "Proximity"}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M5 6L8 9L11 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                      {showProximityDropdown && (
                        <div
                          className="filter-dropdown proximity-dropdown"
                          data-testid="dropdown-proximity"
                        >
                          <button
                            className="filter-dropdown-item"
                            onClick={() => handleProximitySelect("5 mi")}
                            data-testid="proximity-5mi"
                          >
                            5 mi
                          </button>
                          <button
                            className="filter-dropdown-item"
                            onClick={() => handleProximitySelect("10 mi")}
                            data-testid="proximity-10mi"
                          >
                            10 mi
                          </button>
                          <button
                            className="filter-dropdown-item"
                            onClick={() => handleProximitySelect("20 mi")}
                            data-testid="proximity-20mi"
                          >
                            20 mi
                          </button>
                          <button
                            className="filter-dropdown-item"
                            onClick={() => handleProximitySelect("50 mi")}
                            data-testid="proximity-50mi"
                          >
                            50 mi
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="filter-btn-wrapper">
                      <button
                        className="search-filter-btn"
                        onClick={() => {
                          setShowPriceDropdown(!showPriceDropdown);
                          setShowProximityDropdown(false);
                        }}
                        data-testid="button-price"
                      >
                        {selectedPrice || "Price"}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M5 6L8 9L11 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                      {showPriceDropdown && (
                        <div
                          className="filter-dropdown price-dropdown"
                          data-testid="dropdown-price"
                        >
                          <button
                            className="filter-dropdown-item"
                            onClick={() => handlePriceSelect("Under $20")}
                            data-testid="price-under20"
                          >
                            Under $20
                          </button>
                          <button
                            className="filter-dropdown-item"
                            onClick={() => handlePriceSelect("$20 - $50")}
                            data-testid="price-20-50"
                          >
                            $20 - $50
                          </button>
                          <button
                            className="filter-dropdown-item"
                            onClick={() => handlePriceSelect("$50 - $100")}
                            data-testid="price-50-100"
                          >
                            $50 - $100
                          </button>
                          <button
                            className="filter-dropdown-item"
                            onClick={() => handlePriceSelect("Over $100")}
                            data-testid="price-over100"
                          >
                            Over $100
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recents Section */}
                  {recentSearches.length > 0 && (
                    <>
                      <div className="search-dropdown-section">
                        <div className="search-dropdown-label">Recents:</div>
                      </div>

                      <div className="search-recents-list">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            className="search-recent-item"
                            onClick={() => handleRecentClick(search)}
                            data-testid={`recent-${index}`}
                          >
                            <span>{search}</span>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                            >
                              <path
                                d="M6 4L10 8L6 12"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        ))}
                      </div>

                      <button
                        className="search-clear-recents"
                        onClick={clearRecents}
                        data-testid="button-clear-recents"
                      >
                        Clear Recents
                      </button>
                      <button
                        className="search-execute-button"
                        onClick={handleSearch}
                        data-testid="button-execute-search"
                      >
                        Search
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Search Results */}
          {isSearching && (
            <div className="search-results-section">
              <div className="search-results-header">
                <span className="search-results-count">
                  {searchResults.length}{" "}
                  {searchResults.length === 1 ? "result" : "results"} for "
                  {searchText}"
                </span>
              </div>
              <div className="search-results-grid">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="search-result-card"
                    onClick={() => item.id && handleItemClick(item.id)}
                    data-testid={`card-search-result-${item.id}`}
                  >
                    <div className="search-result-image">
                      {item.id && itemImages[item.id] ? (
                        <img src={itemImages[item.id]} alt={item.name} />
                      ) : (
                        <div className="search-result-placeholder">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="search-result-info">
                      <div className="search-result-name">{item.name}</div>
                      <div className="search-result-brand">{item.brand}</div>
                      <div className="search-result-price">${item.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show content only when not searching */}
          {!isSearching && (
            <>
              {/* Promo Card Section - Carousel */}
              <div className="promo-section">
                <div className="promo-card" data-testid="card-promo">
                  <div className="promo-carousel">
                    <div 
                      className="promo-slides"
                      style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                      {thriftStores.map((store, index) => (
                        <div key={index} className="promo-slide">
                          <div className="promo-image-container">
                            <img
                              src={store.imageUrl}
                              alt={store.name}
                              className="promo-image"
                            />
                          </div>
                          <div className="promo-content">
                            <div className="promo-title">{store.name}</div>
                            <div className="promo-subtitle">{store.address}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="promo-dots">
                    {thriftStores.map((_, index) => (
                      <div 
                        key={index}
                        className={`promo-dot ${currentSlide === index ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(index)}
                        data-testid={`carousel-dot-${index}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Thrift Store Map */}
              <ThriftStoreMap proximityFilter={selectedProximity} />

              {/* Tagline Section - Exact Figma specs */}
              <div className="tagline-section">
                <div className="tagline-text">
                  <span className="tagline-highlight">Revitalize</span>{" "}
                  clothing.
                </div>
                <div className="tagline-text">Shop second-hand.</div>
                <div className="tagline-text">
                  Discover your <span className="tagline-highlight">style</span>
                  .
                </div>
              </div>

              {/* Tops Section */}
              <div className="category-section">
                <div className="category-header">Tops:</div>
                <div className="category-grid">
                  <div
                    className="category-card"
                    onClick={() => handleCategoryClick("Shirts")}
                    data-testid="card-category-shirts"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80"
                      alt="Shirts"
                      className="category-image"
                    />
                    <div className="category-overlay">Shirts</div>
                  </div>
                  <div
                    className="category-card"
                    onClick={() => handleCategoryClick("Tees")}
                    data-testid="card-category-tees"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80"
                      alt="Tees"
                      className="category-image"
                    />
                    <div className="category-overlay">Tees</div>
                  </div>
                </div>
              </div>

              {/* Bottoms Section */}
              <div className="category-section">
                <div className="category-header">Bottoms:</div>
                <div className="category-grid">
                  <div
                    className="category-card"
                    onClick={() => handleCategoryClick("Jeans")}
                    data-testid="card-category-jeans"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80"
                      alt="Jeans"
                      className="category-image"
                    />
                    <div className="category-overlay">Jeans</div>
                  </div>
                  <div
                    className="category-card"
                    onClick={() => handleCategoryClick("Sweat pants")}
                    data-testid="card-category-sweatpants"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=400&q=80"
                      alt="Sweat pants"
                      className="category-image"
                    />
                    <div className="category-overlay">Sweat pants</div>
                  </div>
                </div>
              </div>

              {/* Shoes Section */}
              <div className="category-section">
                <div className="category-header">Shoes:</div>
                <div className="category-grid">
                  <div
                    className="category-card"
                    onClick={() => handleCategoryClick("Sneakers")}
                    data-testid="card-category-sneakers"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80"
                      alt="Sneakers"
                      className="category-image"
                    />
                    <div className="category-overlay">Sneakers</div>
                  </div>
                  <div
                    className="category-card"
                    onClick={() => handleCategoryClick("Heels")}
                    data-testid="card-category-heels"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80"
                      alt="Heels"
                      className="category-image"
                    />
                    <div className="category-overlay">Heels</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BuyerDashboard;
