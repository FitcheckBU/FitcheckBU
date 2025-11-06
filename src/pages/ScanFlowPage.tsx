import {
  IonButton,
  IonCard,
  IonCardContent,
  IonText,
  IonBackButton,
  IonInput,
  IonModal,
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

// Confirmation Modal component
const ConfirmationModal: React.FC<{
  isOpen: boolean;
  item: InventoryItem | null;
  imageUrl: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ isOpen, item, imageUrl, onConfirm, onCancel, loading }) => {
  if (!item) return null;

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onCancel}
      className="confirmation-modal"
    >
      <div className="confirmation-modal-content">
        {/* Blurred background image */}
        <div className="confirmation-backdrop">
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Item background"
              className="confirmation-backdrop-image"
            />
          )}
        </div>

        {/* Main item display */}
        <div className="confirmation-item-display">
          <div className="confirmation-image-container">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item.name}
                className="confirmation-item-image"
              />
            ) : (
              <div className="confirmation-image-placeholder">No Image</div>
            )}
          </div>

          <div className="confirmation-item-info">
            <h2 className="confirmation-item-name">
              {item.name || "Unknown Item"}
            </h2>
            <p className="confirmation-item-status">
              Status: <span>{item.isSold ? "Sold" : "Listed"}</span>
            </p>
            <p className="confirmation-item-sku">
              SKU: {item.id ? item.id.substring(0, 8).toUpperCase() : "N/A"}
            </p>
          </div>

          {/* Barcode */}
          <div className="confirmation-barcode">
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
        </div>

        {/* Confirmation prompt overlay */}
        <div className="confirmation-prompt-overlay">
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
      </div>
    </IonModal>
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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

      // Load item image
      await loadItemImage(item);

      // Set the item and show confirmation modal
      setSelectedItem(item);
      setShowConfirmModal(true);
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

  const handleConfirmSale = async () => {
    if (!selectedItem?.id) return;

    setLoading(true);
    try {
      await markAsSoldByBarcode(selectedItem.id);
      setProcessedItemId(selectedItem.id);
      setShowConfirmModal(false);
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
    setShowConfirmModal(false);
    setSelectedItem(null);
    setItemImageUrl("");
  };

  const handleReset = () => {
    setMessage(null);
    setProcessedItemId(null);
    setSelectedItem(null);
    setItemImageUrl("");
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

      {!processedItemId ? (
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
      ) : (
        <div className="scan-flow-content">
          <div className="success-container">
            <IonText color="success">
              <h1>✓</h1>
              <h2>Item Marked as Sold</h2>
              <p>Item ID: {processedItemId}</p>
            </IonText>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        item={selectedItem}
        imageUrl={itemImageUrl}
        onConfirm={handleConfirmSale}
        onCancel={handleCancelConfirmation}
        loading={loading}
      />
    </div>
  );
};

export default ScanFlowPage;
