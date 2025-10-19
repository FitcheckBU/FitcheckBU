import {
  IonCard,
  IonIcon,
} from "@ionic/react";
import { createOutline, eyeOutline } from "ionicons/icons";
import { InventoryItem } from "../lib/inventoryService";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../lib/firebaseClient";
import { useEffect, useState } from "react";
import "./ItemCard.css";

interface ItemCardProps {
  item: InventoryItem;
  onClick?: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onClick,
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

  return (
    <IonCard
      className="figma-item-card"
      button={true}
      onClick={onClick}
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
              <span className="figma-detail-value">Medium</span>
            </div>
            <div className="figma-detail-row">
              <span className="figma-detail-label">Condition:</span>
              <span className="figma-detail-value">{item.condition || "Worn"}</span>
            </div>
            <div className="figma-detail-row">
              <span className="figma-detail-label">Color:</span>
              <span className="figma-detail-value">{item.color || "Unknown"}</span>
            </div>
          </div>
        </div>

        <div className="figma-item-actions">
          <button 
            className="figma-action-button"
            onClick={(e) => {
              e.stopPropagation();
              console.log("Edit item:", item.id);
            }}
            data-testid={`button-edit-${item.id}`}
          >
            <IonIcon icon={createOutline} />
          </button>
          <button 
            className="figma-action-button"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            data-testid={`button-view-${item.id}`}
          >
            <IonIcon icon={eyeOutline} />
          </button>
        </div>
      </div>
    </IonCard>
  );
};

export default ItemCard;
