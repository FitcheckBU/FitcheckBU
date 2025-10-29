import { IonButton } from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./Scan.css";

const Scan: React.FC = () => {
  const history = useHistory();

  return (
    <div className="scan-selection-container">
      <IonButton
        expand="block"
        onClick={() => history.push("/scan-flow")}
        className="scan-selection-button"
      >
        Scan to Remove
      </IonButton>
    </div>
  );
};

export default Scan;
