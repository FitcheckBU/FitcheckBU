import { IonPage, IonContent, IonIcon } from "@ionic/react";
import { arrowBackOutline, heartOutline, heart } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useState, useEffect } from "react";
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

  const fetchSavedItems = async () => {
    try {
      setLoading(true);

      // TODO: Replace with actual Firebase query
      // Example structure:
      // const userId = auth.currentUser?.uid;
      // const savedItemsRef = collection(db, 'savedItems');
      // const q = query(savedItemsRef, where('userId', '==', userId));
      // const querySnapshot = await getDocs(q);
      // const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Placeholder data for development
      const mockData: SavedItem[] = [
        {
          id: "1",
          itemId: "item-123",
          imageUrl:
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
          name: "Nike Air Jordan 1",
          price: 150,
          category: "Sneakers",
          savedAt: new Date(),
        },
        {
          id: "2",
          itemId: "item-456",
          imageUrl:
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80",
          name: "Vintage Denim Jacket",
          price: 75,
          category: "Jackets",
          savedAt: new Date(),
        },
      ];

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSavedItems(mockData);
    } catch (error) {
      console.error("Error fetching saved items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSaved = async (itemId: string) => {
    try {
      // TODO: Remove from Firebase/Firestore
      // Example:
      // const savedItemRef = doc(db, 'savedItems', itemId);
      // await deleteDoc(savedItemRef);

      // Update local state
      setSavedItems(savedItems.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Error removing saved item:", error);
    }
  };

  const handleItemClick = (itemId: string) => {
    // Navigate to item detail page
    history.push(`/item/${itemId}`);
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
