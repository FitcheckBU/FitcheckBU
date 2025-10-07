import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { cloudUploadOutline, trashOutline } from "ionicons/icons";
import { useEffect, useRef, useState } from "react";

const Upload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [fileName, setFileName] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const triggerFilePicker = () => {
    setError(undefined);
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      clearSelection();
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      console.log(objectUrl);
      return objectUrl;
    });
    setFileName(file.name);
    setError(undefined);
  };

  const clearSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(undefined);
    setFileName(undefined);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Upload</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Capture or Upload</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText color="medium">
              <p>
                Select an image from your device or open the camera to capture a
                new one.
              </p>
            </IonText>

            <div className="ion-margin-top ion-text-center">
              <IonButton expand="block" onClick={triggerFilePicker}>
                <IonIcon slot="start" icon={cloudUploadOutline} />
                Use Camera / Library
              </IonButton>
            </div>

            {fileName && (
              <IonText color="medium">
                <p className="ion-margin-top">Selected file: {fileName}</p>
              </IonText>
            )}

            {previewUrl && (
              <div className="ion-margin-top">
                <img
                  src={previewUrl}
                  alt="Upload preview"
                  style={{ width: "100%", borderRadius: "12px" }}
                />
                <IonButton
                  className="ion-margin-top"
                  fill="clear"
                  color="danger"
                  onClick={clearSelection}
                >
                  <IonIcon slot="start" icon={trashOutline} />
                  Clear selection
                </IonButton>
              </div>
            )}

            {error && (
              <IonText color="danger">
                <p className="ion-margin-top">{error}</p>
              </IonText>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Upload;
