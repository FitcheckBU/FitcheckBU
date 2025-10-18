import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonIcon,
  IonPage,
  IonText,
} from "@ionic/react";
import { cloudUploadOutline, trashOutline } from "ionicons/icons";
import { useEffect, useRef, useState } from "react";
import StorageUploadButton from "../components/StorageUploadButton";
import { InventoryItem } from "../lib/inventoryService";
import { db } from "../lib/firebaseClient";
import { doc, onSnapshot, Unsubscribe } from "firebase/firestore";
import "../components/PageContent.css";
// import { getCapturedPhotos, clearCapturedPhotos } from '../lib/photo-storage'; // No longer needed
import { useHistory } from "react-router-dom";
import { usePhotoContext } from "../context/PhotoContext";

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
  const [latestItem, setLatestItem] = useState<InventoryItem | null>(null);
  const [latestSessionId, setLatestSessionId] = useState<string>();
  const selectedImagesRef = useRef<SelectedImage[]>([]);
  const itemListenerRef = useRef<Unsubscribe | null>(null);
  const history = useHistory();
  const { photos, clearPhotos } = usePhotoContext(); // Use context here
  const processedPhotosCountRef = useRef(0); // New ref to track processed photos

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    if (photos.length > processedPhotosCountRef.current) {
      const newPhotosToProcess = photos.slice(processedPhotosCountRef.current);
      const newSelections: SelectedImage[] = newPhotosToProcess.map(
        (dataUrl, index) => {
          const filename = `camera_photo_${Date.now()}_${processedPhotosCountRef.current + index}.jpeg`;
          // Convert dataUrl to File object for StorageUploadButton
          const byteString = atob(dataUrl.split(",")[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const file = new File([ab], filename, { type: "image/jpeg" });
          return {
            id: `${filename}-${Date.now()}-${processedPhotosCountRef.current + index}`,
            name: filename,
            url: dataUrl,
            size: file.size,
            file: file,
          };
        },
      );
      setSelectedImages((current) => [...current, ...newSelections]);
      processedPhotosCountRef.current = photos.length; // Update count after processing
    } else if (photos.length === 0) {
      // If photos in context are cleared, clear local state and reset counter
      if (selectedImages.length > 0) {
        // Only revoke URLs if there are images
        selectedImages.forEach((image) => URL.revokeObjectURL(image.url));
      }
      setSelectedImages([]);
      processedPhotosCountRef.current = 0;
    }
  }, [photos, selectedImages.length]); // Depend on photos from context and selectedImages.length to handle clearing

  const triggerFilePicker = () => {
    if (uploading) {
      return;
    }

    setError(undefined);
    history.push("/camera");
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
    clearPhotos(); // Clear photos from context
    processedPhotosCountRef.current = 0; // Reset processed count

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

      const updatedImages = current.filter((image) => image.id !== id);
      if (updatedImages.length === 0) {
        clearPhotos(); // Clear context if no images left
      }
      return updatedImages;
    });
  };

  const handleItemCreated = (itemId: string, sessionId: string) => {
    setLatestSessionId(sessionId);
    itemListenerRef.current?.();
    itemListenerRef.current = null;

    const itemRef = doc(db, "items", itemId);
    itemListenerRef.current = onSnapshot(
      itemRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setLatestItem({
            id: snapshot.id,
            ...snapshot.data(),
          } as InventoryItem);
        }
      },
      (listenerError) => {
        console.error("Failed to subscribe to item updates:", listenerError);
      },
    );
  };

  return (
    <IonPage>
      <IonContent className="ion-padding page-content">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          capture="environment" // Use the camera directly
          onChange={handleFileChange}
        />

        {selectedImages.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%", // Ensure this div takes full height
              gap: "10px", // Add gap for spacing between text and image
            }}
            onClick={triggerFilePicker}
          >
            <IonText color="primary" style={{ textAlign: "center" }}>
              <p style={{ margin: "0" }}>Tap to Scan</p>{" "}
              {/* Remove default paragraph margin */}
            </IonText>
            <img
              src="/Qr Icon.png"
              alt="Scan QR Code"
              style={{ width: "100px", height: "100px" }} // Remove margin: auto
            />
          </div>
        ) : (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Capture or Upload</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText color="medium">
                <p>
                  Select one or more images from your device or open the camera
                  to capture new ones.
                </p>
              </IonText>
              <div className="ion-margin-top ion-text-center">
                <IonButton
                  expand="block"
                  onClick={triggerFilePicker} // This will now go to camera page
                  disabled={uploading}
                >
                  <IonIcon slot="start" icon={cloudUploadOutline} />
                  Use Camera / Library
                </IonButton>
              </div>

              {error && (
                <IonText color="danger">
                  <p className="ion-margin-top">{error}</p>
                </IonText>
              )}
              {latestItem && (
                <IonCard className="ion-margin-top">
                  <IonCardHeader>
                    <IonCardTitle>
                      Vision Analysis (Session {latestSessionId})
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonText color="medium">
                      <p>
                        Description: {latestItem.description || "Pending..."}
                      </p>
                      <p>
                        Labels:
                        {latestItem.labels && latestItem.labels.length > 0 ? (
                          <code
                            style={{
                              display: "block",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {JSON.stringify(latestItem.labels, null, 2)}
                          </code>
                        ) : (
                          " Pending Vision results..."
                        )}
                      </p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              )}
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
                onItemCreated={handleItemCreated}
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
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Upload;
