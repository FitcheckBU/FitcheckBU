import { IonButton, IonIcon } from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../lib/firebaseClient";
import {
  getImageStoragePaths,
  InventoryItem,
  updateItem,
} from "../lib/inventoryService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseClient";
import EditItemModal from "../components/EditItemModal";
import "../styles/pages/ScanItemDetailPage.css";

const ScanItemDetailPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const history = useHistory();
  const location = useLocation<{ returnTo?: string }>();
  const returnTo = location.state?.returnTo;
  const [showScanAgain, setShowScanAgain] = useState(false);
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleMarkAsSoldClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmMarkAsSold = async () => {
    if (!item?.id) return;

    setLoading(true);
    try {
      await updateItem(item.id, { isSold: true });
      setShowConfirmation(false);
      setShowScanAgain(true); // <-- show the prompt
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
    <>
      <div className="item-detail-page">
        <div className="item-detail-header">
          <IonButton
            fill="clear"
            onClick={handleBack}
            className="back-button"
            data-testid="button-back"
          >
            <IonIcon icon={arrowBackOutline} slot="icon-only" />
          </IonButton>
          <h1 className="item-detail-title">User Dashboard</h1>
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
              <h2 className="item-name">{item.name || "Unnamed Item"}</h2>

              <div className="item-meta">
                <p className="item-status">
                  <span className="meta-label">Status: </span>
                  <span className="meta-value">
                    {item.isSold ? "Sold" : "Available"}
                  </span>
                </p>
                <p className="item-sku">
                  <span className="meta-label">SKU: </span>
                  <span className="meta-value">
                    {item.id?.substring(0, 9).toUpperCase() || "N/A"}
                  </span>
                </p>
              </div>

              <div className="barcode-section">
                <svg
                  className="barcode-svg"
                  viewBox="0 0 280 80"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="0" y="0" width="4" height="80" fill="#000" />
                  <rect x="8" y="0" width="8" height="80" fill="#000" />
                  <rect x="20" y="0" width="4" height="80" fill="#000" />
                  <rect x="28" y="0" width="12" height="80" fill="#000" />
                  <rect x="44" y="0" width="4" height="80" fill="#000" />
                  <rect x="52" y="0" width="8" height="80" fill="#000" />
                  <rect x="64" y="0" width="4" height="80" fill="#000" />
                  <rect x="72" y="0" width="12" height="80" fill="#000" />
                  <rect x="88" y="0" width="4" height="80" fill="#000" />
                  <rect x="96" y="0" width="8" height="80" fill="#000" />
                  <rect x="108" y="0" width="4" height="80" fill="#000" />
                  <rect x="116" y="0" width="12" height="80" fill="#000" />
                  <rect x="132" y="0" width="4" height="80" fill="#000" />
                  <rect x="140" y="0" width="8" height="80" fill="#000" />
                  <rect x="152" y="0" width="4" height="80" fill="#000" />
                  <rect x="160" y="0" width="12" height="80" fill="#000" />
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
                    expand="block"
                    fill="outline"
                    className="secondary-action-button"
                    onClick={() => setShowMoreInfo(!showMoreInfo)}
                  >
                    {showMoreInfo ? "Less Info" : "More Info"}
                  </IonButton>
                  <IonButton
                    expand="block"
                    fill="outline"
                    className="secondary-action-button"
                    onClick={() => setShowEditModal(true)}
                    data-testid="button-edit"
                  >
                    Edit
                  </IonButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Overlay (restore) */}
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
                  className="cancel-button"
                  onClick={handleCancelConfirmation}
                  disabled={loading}
                >
                  Cancel
                </IonButton>
                <IonButton
                  expand="block"
                  color="primary"
                  className="confirm-button"
                  onClick={handleConfirmMarkAsSold}
                  disabled={loading}
                >
                  {loading ? "Working..." : "Confirm"}
                </IonButton>
              </div>
            </div>
          </div>
        )}
        {/* Scan-again Overlay */}
        {showScanAgain && (
          <div className="confirmation-overlay">
            <div className="confirmation-card">
              <p className="confirmation-text">
                Item marked as sold. Would you like to scan another item?
              </p>
              <div className="confirmation-buttons">
                <IonButton
                  expand="block"
                  fill="clear"
                  className="cancel-button"
                  onClick={() => {
                    // go to Dashboard and force full page reload
                    window.location.href = "/home";
                  }}
                >
                  Cancel
                </IonButton>
                <IonButton
                  expand="block"
                  color="primary"
                  className="confirm-button"
                  onClick={() => {
                    // go back to the scan flow (preserve mode if available)
                    window.location.href = returnTo || "/scan-flow";
                  }}
                >
                  Scan Another
                </IonButton>
              </div>
            </div>
          </div>
        )}
      </div>

      <EditItemModal
        isOpen={showEditModal}
        item={item}
        onClose={() => setShowEditModal(false)}
        onUpdate={() => {
          setShowEditModal(false);
        }}
      />
    </>
  );
};

export default ScanItemDetailPage;
