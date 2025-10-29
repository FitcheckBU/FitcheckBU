import {
  IonButton,
  IonCard,
  IonCardContent,
  IonText,
  IonBackButton,
  IonInput,
} from "@ionic/react";
import { useState } from "react";
import { markAsSoldByBarcode } from "../lib/inventoryService";
import "./ScanFlowPage.css";

// ManualEntry component
const ManualEntry: React.FC<{
  onSubmit: (itemId: string) => void;
  loading: boolean;
}> = ({ onSubmit, loading }) => {
  const [itemId, setItemId] = useState("");

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
          <ManualEntry onSubmit={handleMarkAsSold} loading={loading} />
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
