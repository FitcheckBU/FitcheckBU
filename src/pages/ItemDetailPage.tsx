import {
  IonButton,
  IonIcon,
  IonPage,
  IonContent,
  IonSpinner,
} from "@ionic/react";
import {
  arrowBackOutline,
  bookmarkOutline,
  personOutline,
} from "ionicons/icons";
import { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../lib/firebaseClient";
import { saveItem, unsaveItem, isItemSaved } from "../lib/savedItemsService";
import {
  getImageStoragePaths,
  InventoryItem,
  updateItem,
} from "../lib/inventoryService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseClient";
import EditItemModal from "../components/EditItemModal";
import Logo from "../components/Logo";
import { extractSize } from "../lib/metadataParser";
import "../styles/pages/ItemDetailPage.css";
import { printBarcode } from "../lib/printerService";

const ItemDetailPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const history = useHistory<{ fromBuyer?: boolean }>();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  // Check if this is a buyer view
  const isBuyerView = history.location.state?.fromBuyer === true;

  // Helpers for buyer view (dummy implementations)
  // Helper to get store name from store_id
  const getStoreName = (): string => {
    // You'll need to implement store lookup logic
    // For now, return a default
    return "Demo Day Thrift Store";
  };

  // Helper to calculate distance to store
  const calculateDistance = (): string => {
    // You'll need to implement distance calculation
    // based on user location and store location
    return "0 mi";
  };

  // Handler for Directions button
  const handleDirections = () => {
    // Open maps app with BU Center for Computing and Data Sciences
    // 665 Commonwealth Avenue, Boston, MA 02215
    const storeLat = 42.3505;
    const storeLon = -71.1054;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${storeLat},${storeLon}`,
    );
  };

  // handler to check if item is saved
  // Check if item is saved when component mounts or item changes
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!item?.id) return;

      try {
        const userId = getGuestUserId();
        const saved = await isItemSaved(userId, item.id);
        setIsSaved(saved);
      } catch (error) {
        console.error("Error checking if item is saved:", error);
      }
    };

    checkIfSaved();
  }, [item?.id]);

  //handler for guest ID
  // Helper to get or create a guest user ID for saved items (until auth is implemented)
  const getGuestUserId = (): string => {
    const GUEST_USER_KEY = "fitcheck_guest_user_id";
    let guestId = localStorage.getItem(GUEST_USER_KEY);

    if (!guestId) {
      // Generate a unique guest ID
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(GUEST_USER_KEY, guestId);
    }

    return guestId;
  };

  // Handler for Save/Unsave button
  const handleSave = async () => {
    if (!item?.id) {
      console.error("No item ID");
      return;
    }

    const userId = getGuestUserId();

    setSavingItem(true);
    try {
      if (isSaved) {
        // Unsave the item
        await unsaveItem(userId, item.id);
        setIsSaved(false);
        console.log("Item unsaved");
      } else {
        // Save the item
        await saveItem(userId, item.id);
        setIsSaved(true);
        console.log("Item saved");
      }
    } catch (error) {
      console.error("Error saving/unsaving item:", error);
      alert("Failed to save item. Please try again.");
    } finally {
      setSavingItem(false);
    }
  };

  useEffect(() => {
    if (!itemId) return;

    const itemRef = doc(db, "items", itemId);
    const unsubscribe = onSnapshot(itemRef, (snapshot) => {
      if (snapshot.exists()) {
        const itemData = {
          id: snapshot.id,
          ...snapshot.data(),
        } as InventoryItem;
        setItem(itemData);
      }
    });

    return () => unsubscribe();
  }, [itemId]);

  useEffect(() => {
    const loadImage = async () => {
      if (!item) return;

      const storagePaths = getImageStoragePaths(item);
      if (storagePaths.length === 0) {
        setImageUrl("");
        return;
      }

      try {
        const storagePathRef = ref(storage, storagePaths[0]);
        const url = await getDownloadURL(storagePathRef);
        setImageUrl(url);
      } catch (error) {
        console.error("Failed to load image:", error);
        setImageUrl("");
      }
    };

    loadImage();
  }, [item]);

  const handlePrintBarcode = async () => {
    if (!item?.id) return;

    setIsPrinting(true);
    try {
      const sku = item.id.substring(0, 9).toUpperCase();
      await printBarcode(sku);
    } catch {
      alert("An error occurred while printing. Please try again.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleMarkAsSoldClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmMarkAsSold = async () => {
    if (!item?.id) return;

    setLoading(true);
    try {
      await updateItem(item.id, { isSold: true });
      setShowConfirmation(false);
    } catch (error) {
      console.error("Failed to mark as sold:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleBack = () => {
    history.goBack();
  };

  if (!item) {
    return (
      <div className="item-detail-loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <IonPage className={`item-detail-page ${isBuyerView ? "buyer-view" : ""}`}>
      {/* Navbar for Buyer then Seller with logo only */}
      <div className="item-detail-navbar">
        {isBuyerView ? (
          <>
            {/* Buyer Navbar - matches BuyerDashboard */}
            <IonIcon
              icon={bookmarkOutline}
              className="buyer-navbar-icon-left"
              onClick={() => history.push("/buyer-saved")}
              data-testid="icon-bookmark"
            />
            <img
              src="/logo.svg"
              alt="fitcheck"
              className="buyer-navbar-logo"
              data-testid="logo-buyer"
            />
            <IonIcon
              icon={personOutline}
              className="buyer-navbar-icon-right"
              onClick={() => history.push("/buyer-settings")}
              data-testid="icon-profile"
            />
          </>
        ) : (
          <>
            {/* Seller Navbar - just logo */}
            <Logo variant="default" onClick={() => history.push("/home")} />
          </>
        )}
      </div>

      {/* Scrollable content area */}
      <IonContent className="item-detail-body">
        {/* Back button and title section */}
        <div className="item-detail-header-section">
          <IonButton
            fill="clear"
            onClick={handleBack}
            className="item-back-button"
            data-testid="button-back"
          >
            <IonIcon icon={arrowBackOutline} slot="icon-only" />
          </IonButton>
          <h1 className="item-detail-title">View</h1>
        </div>

        <div className="item-detail-content">
          <div className="item-detail-card">
            <div className="item-image-section">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={item.name}
                  className="item-detail-image"
                />
              ) : (
                <div className="item-image-placeholder">No Image</div>
              )}
            </div>

            <div className="item-info-section">
              <h2 className="item-name">{item.name || "Unknown Item"}</h2>

              {isBuyerView ? (
                // NEW: Buyer info grid showing size, color, distance, price, store
                <div className="buyer-info-grid">
                  <span className="buyer-info-left">
                    {extractSize(item.labels) || item.size || "Medium"}
                  </span>
                  <span className="buyer-info-right">
                    ${item.price?.toFixed(2) || "11.99"}
                  </span>

                  <span className="buyer-info-left">
                    {item.color || "Blue"}
                  </span>
                  <span className="buyer-info-right">
                    {calculateDistance()}
                  </span>

                  <span className="buyer-info-left">
                    {item.sex === "men"
                      ? "Men's"
                      : item.sex === "women"
                        ? "Women's"
                        : "Unisex"}
                  </span>
                  <span className="buyer-info-right">
                    {getStoreName() || "Goodwill"}
                  </span>
                </div>
              ) : (
                // EXISTING: Seller view shows Status and SKU (unchanged)
                <div className="item-meta">
                  <p className="item-status">
                    <span className="meta-label">Status:</span>{" "}
                    <span className="meta-value">
                      {item.isSold ? "Sold" : "Listed"}
                    </span>
                  </p>
                  <p className="item-sku">
                    <span className="meta-label">SKU:</span>{" "}
                    <span className="meta-value">
                      {item.id ? item.id.substring(0, 8).toUpperCase() : "N/A"}
                    </span>
                  </p>
                </div>
              )}
              {!isBuyerView && (
                <div className="barcode-section">
                  <svg className="barcode-svg" viewBox="0 0 280 80">
                    {/* Simple barcode pattern */}
                    <rect x="0" y="0" width="8" height="80" fill="#000" />
                    <rect x="12" y="0" width="4" height="80" fill="#000" />
                    <rect x="20" y="0" width="8" height="80" fill="#000" />
                    <rect x="32" y="0" width="4" height="80" fill="#000" />
                    <rect x="40" y="0" width="12" height="80" fill="#000" />
                    <rect x="56" y="0" width="4" height="80" fill="#000" />
                    <rect x="64" y="0" width="8" height="80" fill="#000" />
                    <rect x="76" y="0" width="4" height="80" fill="#000" />
                    <rect x="84" y="0" width="12" height="80" fill="#000" />
                    <rect x="100" y="0" width="4" height="80" fill="#000" />
                    <rect x="108" y="0" width="8" height="80" fill="#000" />
                    <rect x="120" y="0" width="4" height="80" fill="#000" />
                    <rect x="128" y="0" width="12" height="80" fill="#000" />
                    <rect x="144" y="0" width="8" height="80" fill="#000" />
                    <rect x="156" y="0" width="4" height="80" fill="#000" />
                    <rect x="164" y="0" width="8" height="80" fill="#000" />
                    <rect x="176" y="0" width="12" height="80" fill="#000" />
                    <rect x="192" y="0" width="4" height="80" fill="#000" />
                    <rect x="200" y="0" width="8" height="80" fill="#000" />
                    <rect x="212" y="0" width="4" height="80" fill="#000" />
                    <rect x="220" y="0" width="12" height="80" fill="#000" />
                    <rect x="236" y="0" width="4" height="80" fill="#000" />
                    <rect x="244" y="0" width="8" height="80" fill="#000" />
                    <rect x="256" y="0" width="4" height="80" fill="#000" />
                    <rect x="264" y="0" width="12" height="80" fill="#000" />
                  </svg>
                </div>
              )}
              {showMoreInfo && (
                <div className="more-info-section">
                  <div className="info-row">
                    <span className="info-label">Sex:</span>
                    <span className="info-value">{item.style || "Unisex"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Size:</span>
                    <span className="info-value">{item.size || "Medium"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Type:</span>
                    <span className="info-value">
                      {item.category || "Long Sleeve"}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Material:</span>
                    <span className="info-value">
                      {item.description?.split(" ")[0] || "Wool"}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Color:</span>
                    <span className="info-value">{item.color || "Tan"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Pattern:</span>
                    <span className="info-value">{item.decade || "None"}</span>
                  </div>
                </div>
              )}

              <div className="item-actions">
                {!isBuyerView && (
                  <IonButton
                    color="primary"
                    className="print-barcode-button"
                    onClick={handlePrintBarcode}
                    disabled={isPrinting}
                  >
                    {isPrinting ? (
                      <IonSpinner name="crescent" />
                    ) : (
                      "Print Barcode"
                    )}
                  </IonButton>
                )}

                {isBuyerView ? (
                  <>
                    <div className="action-buttons-row">
                      <IonButton
                        fill="outline"
                        color="primary"
                        className="directions-button"
                        onClick={handleDirections}
                        data-testid="button-directions"
                      >
                        Directions
                      </IonButton>
                      <IonButton
                        fill="solid"
                        color="primary"
                        className="save-button"
                        onClick={handleSave}
                        disabled={savingItem}
                        data-testid="button-save"
                      >
                        {isSaved ? "Saved" : "Save"}
                      </IonButton>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Seller View - Show Mark as Sold and Edit */}
                    <IonButton
                      expand="block"
                      color="primary"
                      className="mark-sold-button"
                      onClick={handleMarkAsSoldClick}
                      disabled={item.isSold}
                      data-testid="button-mark-sold"
                    >
                      {item.isSold ? "Marked as Sold" : "Mark as Sold"}
                    </IonButton>

                    <div className="action-buttons-row">
                      <IonButton
                        fill="outline"
                        color="primary"
                        className="secondary-action-button"
                        onClick={() => history.push(`/edit-item/${item.id}`)}
                        data-testid="button-edit"
                      >
                        Edit
                      </IonButton>
                      <IonButton
                        fill="outline"
                        color="primary"
                        className="secondary-action-button"
                        onClick={() => setShowMoreInfo(!showMoreInfo)}
                        data-testid="button-more-info"
                      >
                        {showMoreInfo ? "Less Info" : "More Info"}
                      </IonButton>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Overlay */}
        {showConfirmation && (
          <div className="confirmation-overlay">
            <div className="confirmation-card">
              <p className="confirmation-text">
                Are you sure you want to mark{" "}
                <strong>{item.name || "this item"}</strong> as sold?
              </p>
              <div className="confirmation-buttons">
                <IonButton
                  expand="block"
                  fill="clear"
                  onClick={handleCancelConfirmation}
                  disabled={loading}
                  className="cancel-button"
                >
                  Cancel
                </IonButton>
                <IonButton
                  expand="block"
                  color="primary"
                  onClick={handleConfirmMarkAsSold}
                  disabled={loading}
                  className="confirm-button"
                >
                  {loading ? <IonSpinner name="crescent" /> : "Confirm"}
                </IonButton>
              </div>
            </div>
          </div>
        )}
      </IonContent>

      <EditItemModal
        isOpen={showEditModal}
        item={item}
        onClose={() => setShowEditModal(false)}
        onUpdate={() => {
          setShowEditModal(false);
        }}
      />
    </IonPage>
  );
};

export default ItemDetailPage;
