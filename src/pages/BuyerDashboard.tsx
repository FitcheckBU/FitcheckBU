import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { bookmarkOutline, personOutline, searchOutline } from "ionicons/icons";
import { useState } from "react";
import "./BuyerDashboard.css";

const BuyerDashboard: React.FC = () => {
  const [searchText, setSearchText] = useState("");

  return (
    <IonPage>
      <IonContent className="buyer-dashboard">
        {/* Navbar - Exact Figma specs */}
        <div className="buyer-header">
          <IonIcon
            icon={bookmarkOutline}
            className="buyer-header-icon-left"
            data-testid="icon-bookmark"
          />
          <div className="buyer-title">fitcheck</div>
          <IonIcon
            icon={personOutline}
            className="buyer-header-icon-right"
            data-testid="icon-profile"
          />
        </div>

        {/* Body - Yellow background */}
        <div className="buyer-body">
          {/* Search Bar - Exact Figma specs */}
          <div className="buyer-search-container">
            <div className="buyer-search-wrapper">
              <IonIcon icon={searchOutline} className="buyer-search-icon" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search Name, Size, Color, Etc."
                className="buyer-search-input"
                data-testid="input-search"
              />
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
          </div>

          {/* Promo Card - Exact Figma specs */}
          <div className="promo-card" data-testid="card-promo">
            <div className="promo-image-container">
              <img
                src="/promo-megan.png"
                alt="Megan Fehling"
                className="promo-image"
              />
            </div>
            <div className="promo-text">
              Meet the <span className="promo-highlight">Megan Fehling</span>,
              founder of Found Boston.
            </div>
            <div className="promo-dots">
              <div className="dot active" data-testid="dot-1"></div>
              <div className="dot" data-testid="dot-2"></div>
              <div className="dot" data-testid="dot-3"></div>
            </div>
          </div>

          {/* Tagline Section - Exact Figma specs */}
          <div className="tagline-section">
            <div className="tagline-text">
              <span className="tagline-highlight">Revitalize</span> clothing.
            </div>
            <div className="tagline-text">Shop second-hand.</div>
            <div className="tagline-text">
              Discover your <span className="tagline-highlight">style</span>.
            </div>
          </div>

          {/* Tops Section */}
          <div className="category-section">
            <div className="category-header">Tops:</div>
            <div className="category-grid">
              <div className="category-card" data-testid="card-category-shirts">
                <img
                  src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&q=80"
                  alt="Shirts"
                  className="category-image"
                />
                <div className="category-overlay">Shirts</div>
              </div>
              <div className="category-card" data-testid="card-category-tees">
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
              <div className="category-card" data-testid="card-category-jeans">
                <img
                  src="https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80"
                  alt="Jeans"
                  className="category-image"
                />
                <div className="category-overlay">Jeans</div>
              </div>
              <div
                className="category-card"
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
                data-testid="card-category-sneakers"
              >
                <img
                  src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80"
                  alt="Sneakers"
                  className="category-image"
                />
                <div className="category-overlay">Sneakers</div>
              </div>
              <div className="category-card" data-testid="card-category-heels">
                <img
                  src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80"
                  alt="Heels"
                  className="category-image"
                />
                <div className="category-overlay">Heels</div>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BuyerDashboard;
