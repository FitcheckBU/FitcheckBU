import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonInput,
  IonButton,
  IonText,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import { useState } from "react";
import { markAsSold } from "../lib/inventoryService";

const Scan: React.FC = () => {
  const [itemId, setItemId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    color: string;
  } | null>(null);

  const handleMarkAsSold = async () => {
    if (!itemId.trim()) {
      setMessage({ text: "Please enter an Item ID", color: "danger" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await markAsSold(itemId.trim());

      setMessage({ text: `Item ${itemId} marked as sold!`, color: "success" });
      setItemId(""); // Clear input
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Scan</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <h2>Mark Item as Sold</h2>
            <p>Enter an Item ID to mark it as sold</p>

            <IonInput
              value={itemId}
              placeholder="Enter Item ID"
              onIonInput={(e) => setItemId(e.detail.value || "")}
              style={{
                border: "1px solid var(--ion-color-medium)",
                borderRadius: "8px",
                padding: "10px",
                marginTop: "12px",
              }}
            />

            <IonButton
              expand="block"
              color="success"
              onClick={handleMarkAsSold}
              disabled={loading || !itemId.trim()}
              style={{ marginTop: "16px" }}
            >
              {loading ? "Processing..." : "Mark as Sold"}
            </IonButton>

            {message && (
              <IonText color={message.color}>
                <p style={{ marginTop: "12px" }}>{message.text}</p>
              </IonText>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Scan;
