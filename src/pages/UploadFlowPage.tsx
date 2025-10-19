import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonPage,
  IonText,
} from "@ionic/react";
import { useEffect, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import "../components/PageContent.css";
import { usePhotoContext } from "../context/PhotoContext";
import { db } from "../lib/firebaseClient";
import { InventoryItem } from "../lib/inventoryService";
import { doc, onSnapshot, Unsubscribe } from "firebase/firestore";
import StorageUploadButton from "../components/StorageUploadButton";
import "./UploadFlowPage.css";

type SelectedImage = {
  id: string;
  name: string;
  url: string;
  size: number;
  file: File;
};

// TapToScan component
const TapToScan: React.FC<{ onClick: () => void; isLibraryMode: boolean }> = ({
  onClick,
  isLibraryMode,
}) => (
  <div className="tap-to-scan-container" onClick={onClick}>
    <IonText color="primary" className="tap-to-scan-text">
      <p>{isLibraryMode ? "Select from Library" : "Tap to Scan"}</p>
    </IonText>
    <img
      src={isLibraryMode ? "/Qr Icon.png" : "/Qr Icon.png"} // Update icon for library mode
      alt={isLibraryMode ? "Select from Library" : "Scan QR Code"}
      className="qr-icon"
    />
  </div>
);

// VisionAnalysis component
const VisionAnalysis: React.FC<{
  item: InventoryItem;
  sessionId: string;
}> = ({ item, sessionId }) => (
  <IonCard className="ion-margin-top">
    <IonCardHeader>
      <IonCardTitle>Vision Analysis (Session {sessionId})</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonText color="medium">
        <p>Description: {item.description || "Pending..."}</p>
        <p>
          Labels:
          {item.labels && item.labels.length > 0 ? (
            <code className="vision-analysis-labels">
              {JSON.stringify(item.labels, null, 2)}
            </code>
          ) : (
            " Pending Vision results..."
          )}
        </p>
      </IonText>
    </IonCardContent>
  </IonCard>
);

// ImageGrid component
const ImageGrid: React.FC<{
  images: SelectedImage[];
  onRemove: (id: string) => void;
}> = ({ images, onRemove }) => (
  <div className="image-grid">
    {images.map((image) => (
      <div key={image.id} className="image-grid-item">
        <img src={image.url} alt={image.name} className="image-grid-item-img" />
        <img
          src="/Close.png"
          alt="Remove"
          className="remove-image-icon"
          onClick={() => onRemove(image.id)}
        />
      </div>
    ))}
  </div>
);

const UploadFlowPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [latestItem, setLatestItem] = useState<InventoryItem | null>(null);
  const [latestSessionId, setLatestSessionId] = useState<string>();
  const itemListenerRef = useRef<Unsubscribe | null>(null);
  const history = useHistory();
  const location = useLocation();
  const { photos, clearPhotos } = usePhotoContext();
  const processedPhotosCountRef = useRef(0);

  const queryParams = new URLSearchParams(location.search);
  const isLibraryMode = queryParams.get("mode") === "library";

  useEffect(() => {
    if (isLibraryMode) return;
    if (photos.length > processedPhotosCountRef.current) {
      const newPhotosToProcess = photos.slice(processedPhotosCountRef.current);
      const newSelections: SelectedImage[] = newPhotosToProcess.map(
        (dataUrl, index) => {
          const filename = `camera_photo_${Date.now()}_${
            processedPhotosCountRef.current + index
          }.jpeg`;
          const byteString = atob(dataUrl.split(",")[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const file = new File([ab], filename, { type: "image/jpeg" });
          return {
            id: `${filename}-${Date.now()}-${
              processedPhotosCountRef.current + index
            }`,
            name: filename,
            url: dataUrl,
            size: file.size,
            file: file,
          };
        },
      );
      setSelectedImages((current) => [...current, ...newSelections]);
      processedPhotosCountRef.current = photos.length;
    } else if (photos.length === 0) {
      if (selectedImages.length > 0) {
        selectedImages.forEach((image) => URL.revokeObjectURL(image.url));
      }
      setSelectedImages([]);
      processedPhotosCountRef.current = 0;
    }
  }, [photos, selectedImages.length, isLibraryMode]);

  const triggerFilePicker = () => {
    if (uploading) return;
    if (isLibraryMode) {
      fileInputRef.current?.click();
    } else {
      history.push("/camera");
    }
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const newSelections: SelectedImage[] = newFiles.map((file) => ({
        id: `${file.name}-${Date.now()}`,
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        file: file,
      }));
      setSelectedImages((current) => [...current, ...newSelections]);
    }
  };

  const clearSelection = () => {
    selectedImages.forEach((image) => URL.revokeObjectURL(image.url));
    setSelectedImages([]);
    clearPhotos();
    processedPhotosCountRef.current = 0;
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
        clearPhotos();
      }
      return updatedImages;
    });
  };

  const handleItemCreated = (itemId: string, sessionId: string) => {
    setLatestSessionId(sessionId);
    itemListenerRef.current?.();
    itemListenerRef.current = null;

    const itemRef = doc(db, "items", itemId);
    itemListenerRef.current = onSnapshot(itemRef, (snapshot) => {
      if (snapshot.exists()) {
        setLatestItem({
          id: snapshot.id,
          ...snapshot.data(),
        } as InventoryItem);
      }
    });
  };

  return (
    <IonPage>
      <IonContent className="ion-padding page-content upload-page-content">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden-input"
          onChange={handleFileSelection}
          {...(!isLibraryMode && { capture: "environment" })}
        />

        {selectedImages.length === 0 ? (
          <TapToScan
            onClick={triggerFilePicker}
            isLibraryMode={isLibraryMode}
          />
        ) : (
          <>
            <div className="clear-all-button-container">
              <IonButton
                color="medium"
                fill="outline"
                disabled={uploading}
                onClick={clearSelection}
              >
                Clear all
              </IonButton>
            </div>
            {latestItem && latestSessionId && (
              <VisionAnalysis item={latestItem} sessionId={latestSessionId} />
            )}
            <ImageGrid images={selectedImages} onRemove={removeImage} />
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
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default UploadFlowPage;
