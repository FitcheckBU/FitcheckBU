import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { bookmarkOutline, personOutline, searchOutline, optionsOutline } from "ionicons/icons";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import "./BuyerDashboard.css";
import promoImage from "../../attached_assets/promo-megan.png";

const BuyerDashboard: React.FC = () => {
  const history = useHistory();
  const [searchText, setSearchText] = useState("");

  return (
    <IonPage>
      <IonContent className="buyer-dashboard">
        {/* Header */}
        <div className="buyer-header">
          <IonIcon 
            icon={bookmarkOutline} 
            className="buyer-header-icon"
            data-testid="icon-bookmark"
          />
          <div className="buyer-title">fitcheck</div>
          <IonIcon 
            icon={personOutline} 
            className="buyer-header-icon"
            data-testid="icon-profile"
          />
        </div>

        {/* Search Bar */}
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
            <IonIcon icon={optionsOutline} className="buyer-filter-icon" />
          </div>
        </div>

        {/* Promo Card */}
        <div className="promo-card">
          <div className="promo-image-container">
            <img 
              src={promoImage} 
              alt="Megan Fehling" 
              className="promo-image"
            />
          </div>
          <div className="promo-text">
            Meet the <span className="promo-highlight">Megan Fehling</span>, founder of Found Boston.
          </div>
          <div className="promo-dots">
            <div className="dot active"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>

        {/* Tagline Section */}
        <div className="tagline-section">
          <div className="tagline-text">
            <span className="tagline-highlight">Revitalize</span> clothing.
          </div>
          <div className="tagline-text">
            Shop second-hand.
          </div>
          <div className="tagline-text">
            Discover your style.
          </div>
        </div>

        {/* Tops Section */}
        <div className="category-section">
          <div className="category-header">Tops:</div>
          <div className="category-grid">
            <div 
              className="category-card"
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
            <div 
              className="category-card"
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
      </IonContent>
    </IonPage>
  );
};

export default BuyerDashboard;
