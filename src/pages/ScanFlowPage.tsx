import {
  IonButton,
  IonCard,
  IonCardContent,
  IonText,
  IonBackButton,
  IonInput,
  IonSpinner,
} from "@ionic/react";
import { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  markAsSoldByBarcode,
  findItemByBarcode,
  InventoryItem,
  getImageStoragePaths,
} from "../lib/inventoryService";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../lib/firebaseClient";
import "./ScanFlowPage.css";

// TapToScan component
const TapToScanBarcode: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div className="tap-to-scan-container" onClick={onClick}>
    <IonText color="primary" className="tap-to-scan-text">
      <p>Tap to Scan Barcode</p>
    </IonText>
    <img src="/qr_icon.svg" alt="Scan Barcode" className="qr-icon" />
  </div>
);

// ManualEntry component
const ManualEntry: React.FC<{
  onSubmit: (itemId: string) => void;
  loading: boolean;
  initialValue?: string;
}> = ({ onSubmit, loading, initialValue = "" }) => {
  const [itemId, setItemId] = useState(initialValue);

  useEffect(() => {
    if (initialValue) {
      setItemId(initialValue);
    }
  }, [initialValue]);

  const handleSubmit = () => {
    if (itemId.trim()) {
      onSubmit(itemId.trim());
    }
  };

  return (
    <div className="manual-entry-container">
      <IonText color="primary" className="manual-entry-text">
        <h2>Enter Item ID</h2>
        <p>Type the ID of the item you want to mark as sold</p>
      </IonText>

      <IonInput
        value={itemId}
        placeholder="Enter Item ID"
        onIonInput={(e) => setItemId(e.detail.value || "")}
        className="item-id-input"
        disabled={loading}
      />

      <IonButton
        expand="block"
        color="success"
        onClick={handleSubmit}
        disabled={loading || !itemId.trim()}
        className="submit-button"
      >
        {loading ? "Processing..." : "Continue"}
      </IonButton>

      <IonText color="medium" className="hint-text">
        <p>Tip: You can find item IDs on the Dashboard</p>
      </IonText>
    </div>
  );
};

// Item Detail Display component -- THIS PART NEEDS UI WORK!!!
// for future reference --> right now if something has already been sold, it shouldn't show up -- this DOESN'T work right now

const ItemDetailDisplay: React.FC<{
  item: InventoryItem;
  imageUrl: string;
  showConfirmation: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ item, imageUrl, showConfirmation, onConfirm, onCancel, loading }) => {
  return (
    <div className="item-detail-display">
      {/* Item Image */}
      <div className="item-detail-image-container">
        {imageUrl ? (
          <img src={imageUrl} alt={item.name} className="item-detail-image" />
        ) : (
          <div className="item-detail-image-placeholder">No Image</div>
        )}
      </div>

      {/* Item Info */}
      <div className="item-detail-info">
        <h2 className="item-detail-name">{item.name || "unsure"}</h2>
        <p className="item-detail-status">
          <span className="status-label">Status:</span>{" "}
          {item.isSold ? "Sold" : "Listed"}
        </p>
        <p className="item-detail-sku">
          <span className="sku-label">SKU:</span>{" "}
          {item.id ? item.id.substring(0, 8).toUpperCase() : "N/A"}
        </p>
      </div>

      {/* Barcode */}
      <div className="item-detail-barcode">
        <svg className="barcode-svg" viewBox="0 0 280 80">
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
        </svg>
      </div>

      {/* Action Buttons */}
      {!showConfirmation ? (
        <div className="item-detail-actions">
          <IonButton
            expand="block"
            color="primary"
            className="mark-sold-button"
            onClick={onConfirm}
          >
            Mark as Sold
          </IonButton>
          <IonButton
            expand="block"
            fill="outline"
            color="medium"
            className="action-button"
          >
            Edit
          </IonButton>
          <IonButton
            expand="block"
            fill="outline"
            color="medium"
            className="action-button"
          >
            More Info
          </IonButton>
        </div>
      ) : null}

      {/* Confirmation Overlay */}
      {showConfirmation && (
        <div className="confirmation-overlay">
          <div className="confirmation-prompt">
            <IonText>
              <p className="confirmation-question">
                Are you sure you want to mark{" "}
                <strong>{item.name || "this item"}</strong> as sold?
              </p>
            </IonText>
            <div className="confirmation-buttons">
              <IonButton
                expand="block"
                fill="outline"
                color="medium"
                onClick={onCancel}
                disabled={loading}
                className="cancel-button"
              >
                Cancel
              </IonButton>
              <IonButton
                expand="block"
                color="primary"
                onClick={onConfirm}
                disabled={loading}
                className="confirm-button"
              >
                {loading ? <IonSpinner name="crescent" /> : "Confirm"}
              </IonButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ScanFlowPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fetchingItem, setFetchingItem] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    color: "success" | "danger";
  } | null>(null);
  const [processedItemId, setProcessedItemId] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemImageUrl, setItemImageUrl] = useState<string>("");
  const history = useHistory();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const isCameraMode = queryParams.get("mode") === "camera";

  // Get scanned barcode from location state (if coming from camera)
  const locationState = location.state as
    | { scannedBarcode?: string }
    | undefined;
  const scannedBarcode = locationState?.scannedBarcode;

  const triggerCamera = () => {
    if (loading || fetchingItem) return;
    history.push("/scan-camera");
  };

  const loadItemImage = async (item: InventoryItem) => {
    const storagePaths = getImageStoragePaths(item);
    if (storagePaths.length === 0) {
      setItemImageUrl("");
      return;
    }

    try {
      const storagePathRef = ref(storage, storagePaths[0]);
      const url = await getDownloadURL(storagePathRef);
      setItemImageUrl(url);
    } catch (error) {
      console.error("Failed to load image:", error);
      setItemImageUrl("");
    }
  };

  const handleLookupItem = async (itemId: string) => {
    setFetchingItem(true);
    setMessage(null);

    try {
      // Find the item by barcode
      const item = await findItemByBarcode(itemId);

      if (!item || !item.id) {
        setMessage({
          text: `Item not found with barcode ${itemId}`,
          color: "danger",
        });
        setFetchingItem(false);
        return;
      }
      if (item.isSold) {
        setMessage({
          text: `${item.name || "Item"} is already marked as sold.`,
          color: "danger",
        });
        setSelectedItem(null);
        setShowConfirmation(false);
        setFetchingItem(false);
        return; // Exit early - don't load image or set selectedItem
      }

      // Load item image
      await loadItemImage(item);
      // Set the item and show it (without confirmation yet)
      setSelectedItem(item);
      setFetchingItem(false);
    } catch (error) {
      console.error("Error looking up item:", error);
      setMessage({
        text: `Failed to lookup item: ${error instanceof Error ? error.message : "Unknown error"}`,
        color: "danger",
      });
      setFetchingItem(false);
    }
  };

  const handleShowConfirmation = () => {
    setShowConfirmation(true);
  };

  const handleConfirmSale = async () => {
    if (!selectedItem?.id) return;

    setLoading(true);
    try {
      await markAsSoldByBarcode(selectedItem.id);
      setProcessedItemId(selectedItem.id);
      setShowConfirmation(false);
      setMessage({
        text: `${selectedItem.name || "Item"} successfully marked as sold!`,
        color: "success",
      });
    } catch (error) {
      console.error("Error marking item as sold:", error);
      setMessage({
        text: `Failed to mark item as sold: ${error instanceof Error ? error.message : "Unknown error"}`,
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleReset = () => {
    setMessage(null);
    setProcessedItemId(null);
    setSelectedItem(null);
    setItemImageUrl("");
    setShowConfirmation(false);
    // Clear location state
    history.replace(location.pathname + location.search, {});
  };

  return (
    <div className="scan-flow-wrapper">
      <div className="scan-flow-header">
        <IonBackButton defaultHref="/scan" className="back-button" />
        {processedItemId && (
          <div className="reset-button-container">
            <IonButton
              color="medium"
              fill="outline"
              disabled={loading || fetchingItem}
              onClick={handleReset}
            >
              Scan Another
            </IonButton>
          </div>
        )}
      </div>

      {message && (
        <IonCard className="message-card">
          <IonCardContent>
            <IonText color={message.color}>
              <p className="message-text">{message.text}</p>
            </IonText>
          </IonCardContent>
        </IonCard>
      )}

      {!processedItemId && !selectedItem ? (
        <div className="scan-flow-content">
          {isCameraMode ? (
            <TapToScanBarcode onClick={triggerCamera} />
          ) : (
            <ManualEntry
              onSubmit={handleLookupItem}
              loading={fetchingItem}
              initialValue={scannedBarcode}
            />
          )}
        </div>
      ) : null}

      {!processedItemId && selectedItem ? (
        <ItemDetailDisplay
          item={selectedItem}
          imageUrl={itemImageUrl}
          showConfirmation={showConfirmation}
          onConfirm={
            showConfirmation ? handleConfirmSale : handleShowConfirmation
          }
          onCancel={handleCancelConfirmation}
          loading={loading}
        />
      ) : null}

      {processedItemId ? (
        <div className="scan-flow-content">
          <div className="success-container">
            <IonText color="success">
              <h1>✓</h1>
              <h2>Item Marked as Sold</h2>
              <p>Item ID: {processedItemId}</p>
            </IonText>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ScanFlowPage;
