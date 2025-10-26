import { IonButton, IonText, IonBackButton } from "@ionic/react";
import { useEffect, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { usePhotoContext } from "../context/PhotoContext";
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
      src={isLibraryMode ? "/qr_icon.svg" : "/qr_icon.svg"} // Update icon for library mode
      alt={isLibraryMode ? "Select from Library" : "Scan QR Code"}
      className="qr-icon"
    />
  </div>
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
          src="/close.svg"
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

  const handleItemCreated = (itemId: string) => {
    // Navigate to confirmation page instead of showing inline analysis
    history.push(`/item-confirmation/${itemId}`);
  };

  return (
    <div className="upload-flow-wrapper">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden-input"
        onChange={handleFileSelection}
        {...(!isLibraryMode && { capture: "environment" })}
      />

      <div className="upload-page-header">
        <IonBackButton defaultHref="/upload" className="back-button" />
        {selectedImages.length > 0 && (
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
        )}
      </div>

      {selectedImages.length === 0 ? (
        <div className="upload-flow-content">
          <TapToScan
            onClick={triggerFilePicker}
            isLibraryMode={isLibraryMode}
          />
        </div>
      ) : (
        <>
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
    </div>
  );
};

export default UploadFlowPage;
