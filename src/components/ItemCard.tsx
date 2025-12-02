import {
  IonIcon,
  IonItemSliding,
  IonItem,
  IonItemOptions,
  IonItemOption,
} from "@ionic/react";
import { createOutline, eyeOutline, closeOutline } from "ionicons/icons";
import { getImageStoragePaths, InventoryItem } from "../lib/inventoryService";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../lib/firebaseClient";
import { useEffect, useState } from "react";
import { extractSize, extractColor } from "../lib/metadataParser";
import "./ItemCard.css";

interface ItemCardProps {
  item: InventoryItem;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onClick,
  onEdit,
  onDelete,
}) => {
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    const loadImage = async () => {
      const storagePaths = getImageStoragePaths(item);
      if (storagePaths.length === 0) {
        setImageUrl("");
        return;
      }

      try {
        const storagePathRef = ref(storage, storagePaths[0]);
        const url = await getDownloadURL(storagePathRef);
        setImageUrl(url);
      } catch (error) {
        console.error("Failed to load image:", error);
        setImageUrl("");
      }
    };

    loadImage();
  }, [item]);

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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
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
              <img
                src={imageUrl}
                alt={item.name}
                className="figma-item-image"
              />
            ) : (
              <div className="figma-image-placeholder">
                <span>No Image</span>
              </div>
            )}
          </div>

          <div className="figma-item-info">
            <div className="figma-item-name">
              {item.name || item.brand || "Unknown Item"}
            </div>
            <div className="figma-item-details-grid">
              <div className="figma-details-left">
                <div className="figma-detail-text">
                  {item.id ? item.id.substring(0, 9).toUpperCase() : "NO-ID"}
                </div>
                <div className="figma-detail-text">
                  {extractSize(item.labels) || item.size || "Medium"}
                </div>
                <div className="figma-detail-text">
                  {item.category || "Unknown"}
                </div>
                <div className="figma-detail-text">
                  {item.description?.split(" ")[0] || "Material"}
                </div>
              </div>
              <div className="figma-details-right">
                <div className="figma-detail-text">
                  {item.color || extractColor(item.labels) || "Unknown"}
                </div>
                <div className="figma-detail-text">
                  {item.style || "Unisex"}
                </div>
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
          className="swipe-edit"
        >
          <IonIcon icon={createOutline} slot="icon-only" />
        </IonItemOption>
        <IonItemOption
          color="secondary"
          onClick={handleDelete}
          data-testid={`button-delete-${item.id}`}
          className="swipe-delete"
        >
          <IonIcon icon={closeOutline} slot="icon-only" />
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
  );
};

export default ItemCard;
