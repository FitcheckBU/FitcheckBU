import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
} from "@ionic/react";
import { closeOutline, createOutline, trashOutline } from "ionicons/icons";
import { InventoryItem, markAsSold } from "../lib/inventoryService";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../lib/firebaseClient";
import { useEffect, useState } from "react";
import { extractSize, extractColor, extractMaterial } from "../lib/metadataParser";
import "./ItemDetailModal.css";

interface ItemDetailModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onUpdate: () => void;
  onEdit?: () => void;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  item,
  onClose,
  onUpdate,
  onEdit,
}) => {
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    const loadImages = async () => {
      if (item?.imageStoragePaths && item.imageStoragePaths.length > 0) {
        try {
          const urls = await Promise.all(
            item.imageStoragePaths.map(async (path) => {
              const storageRef = ref(storage, path);
              return await getDownloadURL(storageRef);
            })
          );
          setImageUrls(urls);
        } catch (error) {
          console.error("Failed to load images:", error);
        }
      } else {
        setImageUrls([]);
      }
    };

    if (isOpen && item) {
      loadImages();
    }
  }, [isOpen, item]);

  if (!item) return null;

  const handleMarkAsSold = async () => {
    if (item.id) {
      try {
        await markAsSold(item.id);
        onUpdate();
        onClose();
      } catch (error) {
        console.error("Failed to mark as sold:", error);
      }
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar className="detail-toolbar">
          <IonTitle>User Dashboard</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} data-testid="button-close-detail">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="detail-modal-content">
        {/* Images */}
        <div className="detail-images-section">
          {imageUrls.length > 0 ? (
            imageUrls.map((url, index) => (
              <div key={index} className="detail-image-wrapper">
                <img
                  src={url}
                  alt={`${item.name} ${index + 1}`}
                  className="detail-image"
                />
              </div>
            ))
          ) : (
            <div className="detail-image-placeholder-large">
              <span>No Image</span>
            </div>
          )}
        </div>

        {/* Item Header */}
        <div className="detail-header-section">
          <div className="detail-item-name">{item.name || item.brand || "Unknown Item"}</div>
          <div className="detail-item-subtitle">
            {item.category || "Unknown Category"} • Size: {extractSize(item.labels)} • {item.condition || "Unknown"}
          </div>
        </div>

        {/* Barcode */}
        <div className="detail-barcode-section">
          <div className="barcode-display">
            <div className="barcode-lines">
              {Array.from({ length: 50 }).map((_, i) => (
                <div 
                  key={i} 
                  className="barcode-line"
                  style={{
                    width: i % 7 === 0 ? '3px' : i % 3 === 0 ? '2px' : '1px',
                    opacity: 0.9
                  }}
                />
              ))}
            </div>
            <div className="barcode-number">
              {item.id?.slice(0, 12).toUpperCase().replace(/(.{3})/g, '$1 ').trim() || "ITEM-BARCODE"}
            </div>
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <div className="detail-description-section">
            <div className="detail-section-label">Description:</div>
            <div className="detail-description-text">{item.description}</div>
          </div>
        )}

        {/* Details List */}
        <div className="detail-info-section">
          <div className="detail-info-row">
            <span className="detail-info-label">Size:</span>
            <span className="detail-info-value">{extractSize(item.labels)}</span>
          </div>
          <div className="detail-info-row">
            <span className="detail-info-label">Color:</span>
            <span className="detail-info-value">{item.color || extractColor(item.labels)}</span>
          </div>
          <div className="detail-info-row">
            <span className="detail-info-label">Condition:</span>
            <span className="detail-info-value">{item.condition || "Unknown"}</span>
          </div>
          <div className="detail-info-row">
            <span className="detail-info-label">Brand:</span>
            <span className="detail-info-value">{item.brand || "Unknown"}</span>
          </div>
          <div className="detail-info-row">
            <span className="detail-info-label">Material:</span>
            <span className="detail-info-value">{extractMaterial(item.labels)}</span>
          </div>
          {item.price && (
            <div className="detail-info-row">
              <span className="detail-info-label">Price:</span>
              <span className="detail-info-value">${item.price.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="detail-actions-section">
          <IonButton
            expand="block"
            fill="outline"
            className="detail-action-button"
            onClick={onEdit}
            data-testid="button-edit-item"
          >
            <IonIcon slot="start" icon={createOutline} />
            Edit Item
          </IonButton>

          <IonButton
            expand="block"
            fill="outline"
            className="detail-action-button"
            disabled={item.isSold}
            onClick={handleMarkAsSold}
            data-testid="button-mark-sold"
          >
            {item.isSold ? "Already Sold" : "Mark as Sold"}
          </IonButton>

          <IonButton
            expand="block"
            fill="outline"
            color="danger"
            className="detail-action-button detail-delete-button"
            data-testid="button-delete"
          >
            <IonIcon slot="start" icon={trashOutline} />
            Delete
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ItemDetailModal;
