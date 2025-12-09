import {
  IonButton,
  IonCard,
  IonCardContent,
  IonText,
  IonBackButton,
  IonInput,
} from "@ionic/react";
import { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import {
  //markAsSoldByBarcode,
  findItemByBarcode,
  //InventoryItem,
} from "../lib/inventoryService";
import "../styles/pages/ScanFlowPage.css";

// TapToScan component
const TapToScanBarcode: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div className="tap-to-scan-container" onClick={onClick}>
    <img src="/qr_icon.svg" alt="Scan Barcode" className="qr-icon" />
    <IonText color="primary" className="tap-to-scan-text">
      <p>Tap to Scan Barcode</p>
    </IonText>
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

const ScanFlowPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    color: "success" | "danger";
  } | null>(null);
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
    if (loading) return;
    history.push("/scan-camera");
  };

  const handleLookupItem = async (itemId: string) => {
    setLoading(true);
    setMessage(null);

    try {
      // Find the item by barcode
      const item = await findItemByBarcode(itemId);

      if (!item || !item.id) {
        setMessage({
          text: `Item not found with barcode ${itemId}`,
          color: "danger",
        });
        setLoading(false);
        return;
      }

      // Check if item is already sold
      if (item.isSold) {
        setMessage({
          text: `${item.name || "Item"} is already marked as sold.`,
          color: "danger",
        });
        setLoading(false);
        return;
      }

      // Navigate to the existing ItemDetailPage
      history.push(`/item-scan/${item.id}`, {
        returnTo: isCameraMode
          ? "/scan-flow?mode=camera"
          : "/scan-flow?mode=manual",
      });
    } catch (error) {
      console.error("Error looking up item:", error);
      setMessage({
        text: `Failed to lookup item: ${error instanceof Error ? error.message : "Unknown error"}`,
        color: "danger",
      });
      setLoading(false);
    }
  };

  return (
    <div className="scan-flow-wrapper">
      <div className="scan-flow-header">
        <IonBackButton defaultHref="/scan" className="back-button" />
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

      <div className="scan-flow-content">
        {isCameraMode ? (
          <TapToScanBarcode onClick={triggerCamera} />
        ) : (
          <ManualEntry
            onSubmit={handleLookupItem}
            loading={loading}
            initialValue={scannedBarcode}
          />
        )}
      </div>
    </div>
  );
};

export default ScanFlowPage;
