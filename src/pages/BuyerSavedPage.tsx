import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { arrowBackOutline, heartOutline, heart } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useState, useEffect } from "react";
import { getSavedItems, unsaveItem } from "../lib/savedItemsService";
import { getItemById, getImageStoragePaths } from "../lib/inventoryService";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../lib/firebaseClient";
import "../styles/pages/BuyerSavedPage.css";

// Define the SavedItem type
interface SavedItem {
  id: string;
  itemId: string;
  imageUrl: string;
  name: string;
  price: number;
  category: string;
  savedAt: Date;
}

const BuyerSavedPage: React.FC = () => {
  const history = useHistory();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch saved items from Firebase/Firestore
    // This is a placeholder - you'll need to implement the actual fetch logic
    fetchSavedItems();
  }, []);

  // helper to get guest ID
  // Helper to get guest user ID
  const getGuestUserId = (): string => {
    const GUEST_USER_KEY = "fitcheck_guest_user_id";
    let guestId = localStorage.getItem(GUEST_USER_KEY);

    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(GUEST_USER_KEY, guestId);
    }

    return guestId;
  };

  const fetchSavedItems = async () => {
    try {
      setLoading(true);

      const userId = getGuestUserId();
      const savedItemIds = await getSavedItems(userId);

      // Fetch full item details for each saved item
      const itemPromises = savedItemIds.map(async (itemId) => {
        const item = await getItemById(itemId);
        if (!item) return null;

        // Get image URL
        const storagePaths = getImageStoragePaths(item);
        let imageUrl = "";
        if (storagePaths.length > 0) {
          try {
            const storagePathRef = ref(storage, storagePaths[0]);
            imageUrl = await getDownloadURL(storagePathRef);
          } catch (error) {
            console.error("Failed to load image:", error);
          }
        }

        return {
          id: itemId,
          itemId: item.id || "",
          imageUrl,
          name: item.name,
          price: item.price,
          category: item.category,
          savedAt: new Date(),
        };
      });

      const items = (await Promise.all(itemPromises)).filter(
        (item) => item !== null,
      ) as SavedItem[];
      setSavedItems(items);
    } catch (error) {
      console.error("Error fetching saved items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSaved = async (savedItemId: string) => {
    try {
      const userId = getGuestUserId();
      await unsaveItem(userId, savedItemId);

      // Update local state
      setSavedItems(savedItems.filter((item) => item.itemId !== savedItemId));
    } catch (error) {
      console.error("Error removing saved item:", error);
    }
  };

  const handleItemClick = (itemId: string) => {
    // Navigate to item detail page with buyer view flag
    history.push(`/item/${itemId}`, { fromBuyer: true });
  };

  const handleBack = () => {
    history.goBack();
  };

  return (
    <IonPage className="buyer-saved-page">
      <IonContent className="buyer-saved-content">
        {/* Green Header matching BuyerDashboard */}
        <div className="buyer-saved-header">
          <IonIcon
            icon={arrowBackOutline}
            className="buyer-saved-back-icon"
            onClick={handleBack}
            data-testid="button-back"
          />
          <h1 className="buyer-saved-title">Saved Items</h1>
        </div>

        {/* Yellow Body */}
        <div className="buyer-saved-body">
          {loading ? (
            <div className="saved-loading-state">
              <p>Loading saved items...</p>
            </div>
          ) : savedItems.length === 0 ? (
            // Empty State
            <div className="saved-empty-state">
              <IonIcon icon={heartOutline} className="empty-state-icon" />
              <h2 className="empty-state-title">No Saved Items Yet</h2>
              <p className="empty-state-text">
                Start browsing and save your favorite items to see them here!
              </p>
              <button
                className="empty-state-button"
                onClick={() => history.push("/buyer")}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            // Saved Items Grid
            <div className="saved-items-container">
              <div className="saved-items-header">
                <p className="saved-items-count">
                  {savedItems.length}{" "}
                  {savedItems.length === 1 ? "Item" : "Items"} Saved
                </p>
              </div>

              <div className="saved-items-grid">
                {savedItems.map((item) => (
                  <div
                    key={item.id}
                    className="saved-item-card"
                    data-testid={`saved-item-${item.id}`}
                  >
                    <div
                      className="saved-item-image-container"
                      onClick={() => handleItemClick(item.itemId)}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="saved-item-image"
                      />
                      {/* Unsave button */}
                      <button
                        className="saved-item-heart-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSaved(item.id);
                        }}
                        data-testid={`unsave-button-${item.id}`}
                      >
                        <IonIcon icon={heart} className="heart-icon-filled" />
                      </button>
                    </div>

                    <div className="saved-item-details">
                      <h3 className="saved-item-name">{item.name}</h3>
                      <p className="saved-item-category">{item.category}</p>
                      <p className="saved-item-price">${item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BuyerSavedPage;
