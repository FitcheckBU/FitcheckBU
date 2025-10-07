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
import StorageUploadButton from "../components/StorageUploadButton";

type SelectedImage = {
  id: string;
  name: string;
  url: string;
  size: number;
  file: File;
};

const Upload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const selectedImagesRef = useRef<SelectedImage[]>([]);

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((image) =>
        URL.revokeObjectURL(image.url),
      );
    };
  }, []);

  const triggerFilePicker = () => {
    if (uploading) {
      return;
    }

    setError(undefined);
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    let nonImageDetected = false;

    const newSelections: SelectedImage[] = files
      .filter((file) => {
        const isImage = file.type.startsWith("image/");

        if (!isImage) {
          nonImageDetected = true;
        }

        return isImage;
      })
      .map((file, index) => ({
        id: `${file.name}-${Date.now()}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        file,
      }));

    if (newSelections.length > 0) {
      setSelectedImages((current) => [...current, ...newSelections]);
    }

    setError(
      nonImageDetected
        ? "Some files were skipped because they are not images. Please choose image files only."
        : undefined,
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearSelection = () => {
    selectedImages.forEach((image) => URL.revokeObjectURL(image.url));
    setSelectedImages([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (id: string) => {
    setSelectedImages((current) => {
      const imageToRemove = current.find((image) => image.id === id);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }

      return current.filter((image) => image.id !== id);
    });
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
          multiple
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
                Select one or more images from your device or open the camera to
                capture new ones.
              </p>
            </IonText>

            <div className="ion-margin-top ion-text-center">
              <IonButton
                expand="block"
                onClick={triggerFilePicker}
                disabled={uploading}
              >
                <IonIcon slot="start" icon={cloudUploadOutline} />
                Use Camera / Library
              </IonButton>
            </div>

            {selectedImages.length > 0 && (
              <>
                <IonText color="medium">
                  <p className="ion-margin-top">
                    Selected images ({selectedImages.length}):
                  </p>
                </IonText>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "12px",
                    marginTop: "12px",
                  }}
                >
                  {selectedImages.map((image) => (
                    <div
                      key={image.id}
                      style={{
                        borderRadius: "12px",
                        border: "1px solid var(--ion-color-medium-tint)",
                        padding: "8px",
                      }}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        style={{
                          width: "100%",
                          borderRadius: "8px",
                          objectFit: "cover",
                          height: "120px",
                        }}
                      />
                      <IonText color="medium">
                        <p
                          style={{
                            marginTop: "8px",
                            fontSize: "0.8rem",
                            wordBreak: "break-word",
                          }}
                        >
                          {image.name}
                        </p>
                      </IonText>
                      <IonButton
                        color="danger"
                        fill="clear"
                        size="small"
                        disabled={uploading}
                        onClick={() => removeImage(image.id)}
                      >
                        <IonIcon slot="start" icon={trashOutline} />
                        Remove
                      </IonButton>
                    </div>
                  ))}
                </div>

                <StorageUploadButton
                  files={selectedImages.map(({ id, name, file }) => ({
                    id,
                    name,
                    file,
                  }))}
                  disabled={uploading}
                  onUploadingChange={setUploading}
                  onUploadComplete={clearSelection}
                />

                <IonButton
                  className="ion-margin-top"
                  color="medium"
                  fill="outline"
                  disabled={uploading}
                  onClick={clearSelection}
                >
                  Clear all
                </IonButton>
              </>
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
