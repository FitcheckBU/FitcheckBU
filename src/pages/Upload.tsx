import { IonButton } from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./Upload.css";

const Upload: React.FC = () => {
  const history = useHistory();

  return (
    <div className="upload-selection-container">
      <IonButton
        expand="block"
        onClick={() => history.push("/upload-flow?mode=camera")}
        className="upload-selection-button"
      >
        Scan from Camera
      </IonButton>
      <IonButton
        expand="block"
        onClick={() => history.push("/upload-flow?mode=library")}
        className="upload-selection-button"
      >
        Select from Library
      </IonButton>
    </div>
  );
};

export default Upload;
