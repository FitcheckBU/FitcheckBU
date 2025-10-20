import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import "./Upload.css";

const Upload: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Upload</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding page-content">
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
      </IonContent>
    </IonPage>
  );
};

export default Upload;
