import {
  IonIcon,
  IonItemSliding,
  IonItem,
  IonItemOptions,
  IonItemOption,
} from "@ionic/react";
import { createOutline, eyeOutline } from "ionicons/icons";
import { InventoryItem } from "../lib/inventoryService";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../lib/firebaseClient";
import { useEffect, useState } from "react";
import { extractSize, extractColor } from "../lib/metadataParser";
import "./ItemCard.css";

interface ItemCardProps {
  item: InventoryItem;
  onClick?: () => void;
  onEdit?: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onClick,
  onEdit,
}) => {
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    const loadImage = async () => {
      if (item.imageStoragePaths && item.imageStoragePaths.length > 0) {
        try {
          const storageRef = ref(storage, item.imageStoragePaths[0]);
          const url = await getDownloadURL(storageRef);
          setImageUrl(url);
        } catch (error) {
          console.error("Failed to load image:", error);
        }
      }
    };

    loadImage();
  }, [item.imageStoragePaths]);

  const cardClassName = item.isSold 
    ? "figma-item-card sold" 
    : "figma-item-card";

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <IonItemSliding>
      <IonItem
        button={true}
        onClick={onClick}
        lines="none"
        className={cardClassName}
        data-testid={`card-item-${item.id}`}
      >
        <div className="figma-card-content">
          <div className="figma-image-container">
            {imageUrl ? (
              <img src={imageUrl} alt={item.name} className="figma-item-image" />
            ) : (
              <div className="figma-image-placeholder">
                <span>No Image</span>
              </div>
            )}
          </div>

          <div className="figma-item-info">
            <div className="figma-item-name">{item.name || item.brand || "Unknown Item"}</div>
            <div className="figma-item-details">
              <div className="figma-detail-row">
                <span className="figma-detail-label">Size:</span>
                <span className="figma-detail-value">{extractSize(item.labels)}</span>
              </div>
              <div className="figma-detail-row">
                <span className="figma-detail-label">Condition:</span>
                <span className="figma-detail-value">{item.condition || "Unknown"}</span>
              </div>
              <div className="figma-detail-row">
                <span className="figma-detail-label">Color:</span>
                <span className="figma-detail-value">{item.color || extractColor(item.labels)}</span>
              </div>
            </div>
          </div>
        </div>
      </IonItem>

      <IonItemOptions side="end">
        <IonItemOption 
          color="primary"
          onClick={handleView}
          data-testid={`button-view-${item.id}`}
        >
          <IonIcon icon={eyeOutline} slot="icon-only" />
        </IonItemOption>
        <IonItemOption 
          color="warning"
          onClick={handleEdit}
          data-testid={`button-edit-${item.id}`}
        >
          <IonIcon icon={createOutline} slot="icon-only" />
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
  );
};

export default ItemCard;
