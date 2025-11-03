import { IonButton } from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./Scan.css";

const Scan: React.FC = () => {
  const history = useHistory();

  return (
    <div className="scan-selection-container">
      <IonButton
        expand="block"
        onClick={() => history.push("/scan-flow?mode=camera")}
        className="scan-selection-button"
      >
        Scan Barcode with Camera
      </IonButton>
      <IonButton
        expand="block"
        onClick={() => history.push("/scan-flow?mode=manual")}
        className="scan-selection-button"
        color="secondary"
      >
        Enter ID Manually
      </IonButton>
    </div>
  );
};

export default Scan;
