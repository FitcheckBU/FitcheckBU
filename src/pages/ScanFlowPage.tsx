import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonBackButton,
} from "@ionic/react";
import "./ScanFlowPage.css";

const ScanFlowPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonBackButton defaultHref="/scan" slot="start" />
          <IonTitle>Scan Flow</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding scan-flow-content">
        {/* Scan flow functionality will be implemented here */}
        <div className="scan-flow-placeholder">
          <p>Scan flow coming soon...</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ScanFlowPage;
