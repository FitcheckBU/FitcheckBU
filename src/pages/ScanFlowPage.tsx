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
import { markAsSoldByBarcode } from "../lib/inventoryService";
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
        {loading ? "Processing..." : "Mark as Sold"}
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
  const [processedItemId, setProcessedItemId] = useState<string | null>(null);
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

  const handleMarkAsSold = async (itemId: string) => {
    setLoading(true);
    setMessage(null);

    try {
      await markAsSoldByBarcode(itemId);
      setProcessedItemId(itemId);
      setMessage({
        text: `Item ${itemId} successfully marked as sold!`,
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

  const handleReset = () => {
    setMessage(null);
    setProcessedItemId(null);
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
              disabled={loading}
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
              onSubmit={handleMarkAsSold}
              loading={loading}
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
    </div>
  );
};

export default ScanFlowPage;
