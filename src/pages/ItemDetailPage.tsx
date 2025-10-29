import { useCallback, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import {
  IonButton,
  IonIcon,
  IonSlide,
  IonSlides,
  IonSpinner,
} from "@ionic/react";
import { arrowBackOutline, createOutline, trashOutline } from "ionicons/icons";
import {
  InventoryItem,
  getItemById,
  markAsSold,
} from "../lib/inventoryService";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../lib/firebaseClient";
import EditItemModal from "../components/EditItemModal";
import {
  extractColor,
  extractMaterial,
  extractSize,
} from "../lib/metadataParser";
import "@ionic/react/css/ionic-swiper.css";
import "./ItemDetailPage.css";
import "../components/ItemDetailModal.css";

type RouteParams = {
  itemId: string;
};

const ItemDetailPage = () => {
  const { itemId } = useParams<RouteParams>();
  const history = useHistory();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMarkingSold, setIsMarkingSold] = useState(false);

  const loadItem = useCallback(async () => {
    if (!itemId) {
      setItem(null);
      setError("Item not found");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedItem = await getItemById(itemId);
      if (!fetchedItem) {
        setItem(null);
        setError("Item not found");
      } else {
        setItem(fetchedItem);
      }
    } catch (err) {
      console.error("Failed to load item:", err);
      setError("Failed to load item details. Please try again later.");
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  useEffect(() => {
    const loadImages = async () => {
      if (item?.imageStoragePaths && item.imageStoragePaths.length > 0) {
        try {
          const urls = await Promise.all(
            item.imageStoragePaths.map(async (path) => {
              const storageRef = ref(storage, path);
              return await getDownloadURL(storageRef);
            }),
          );
          setImageUrls(urls);
        } catch (err) {
          console.error("Failed to load images:", err);
          setImageUrls([]);
        }
      } else {
        setImageUrls([]);
      }
    };

    loadImages();
  }, [item]);

  const handleBack = () => {
    if (history.length > 1) {
      history.goBack();
    } else {
      history.push("/home");
    }
  };

  const handleMarkAsSold = async () => {
    if (!item?.id || item.isSold) return;

    try {
      setIsMarkingSold(true);
      await markAsSold(item.id);
      setItem((prev) => (prev ? { ...prev, isSold: true } : prev));
    } catch (err) {
      console.error("Failed to mark as sold:", err);
    } finally {
      setIsMarkingSold(false);
    }
  };

  const handleItemUpdated = async () => {
    await loadItem();
  };

  return (
    <div className="item-detail-page">
      <div className="item-detail-header">
        <IonButton
          fill="clear"
          onClick={handleBack}
          className="item-detail-back-button"
        >
          <IonIcon icon={arrowBackOutline} slot="icon-only" />
        </IonButton>
        <h2 className="item-detail-title">Item Details</h2>
      </div>

      <div className="item-detail-card">
        {loading ? (
          <div className="item-detail-status">
            <IonSpinner name="crescent" />
            <span>Loading item...</span>
          </div>
        ) : error ? (
          <div className="item-detail-status">
            <p>{error}</p>
            <IonButton fill="outline" onClick={handleBack}>
              Go Back
            </IonButton>
          </div>
        ) : item ? (
          <>
            <div className="detail-images-section detail-page-images">
              {imageUrls.length > 0 ? (
                <IonSlides
                  pager={imageUrls.length > 1}
                  options={{
                    slidesPerView: 1,
                    spaceBetween: 16,
                    centeredSlides: true,
                  }}
                >
                  {imageUrls.map((url, index) => (
                    <IonSlide key={index}>
                      <div className="detail-image-wrapper">
                        <img
                          src={url}
                          alt={`${item.name} ${index + 1}`}
                          className="detail-image"
                        />
                      </div>
                    </IonSlide>
                  ))}
                </IonSlides>
              ) : (
                <div className="detail-image-placeholder-large">
                  <span>No Image</span>
                </div>
              )}
            </div>

            <div className="detail-header-section">
              <div className="detail-item-name">
                {item.name || item.brand || "Unknown Item"}
              </div>
              <div className="detail-item-subtitle">
                {item.category || "Unknown Category"} • Size:{" "}
                {extractSize(item.labels)} • {item.condition || "Unknown"}
              </div>
            </div>

            <div className="detail-barcode-section">
              <div className="barcode-display">
                <div className="barcode-lines">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div
                      key={i}
                      className="barcode-line"
                      style={{
                        width:
                          i % 7 === 0 ? "3px" : i % 3 === 0 ? "2px" : "1px",
                        opacity: 0.9,
                      }}
                    />
                  ))}
                </div>
                <div className="barcode-number">
                  {item.id
                    ?.slice(0, 12)
                    .toUpperCase()
                    .replace(/(.{3})/g, "$1 ")
                    .trim() || "ITEM-BARCODE"}
                </div>
              </div>
            </div>

            {item.description && (
              <div className="detail-description-section">
                <div className="detail-section-label">Description:</div>
                <div className="detail-description-text">
                  {item.description}
                </div>
              </div>
            )}

            <div className="detail-info-section">
              <div className="detail-info-row">
                <span className="detail-info-label">Size:</span>
                <span className="detail-info-value">
                  {extractSize(item.labels)}
                </span>
              </div>
              <div className="detail-info-row">
                <span className="detail-info-label">Color:</span>
                <span className="detail-info-value">
                  {item.color || extractColor(item.labels)}
                </span>
              </div>
              <div className="detail-info-row">
                <span className="detail-info-label">Condition:</span>
                <span className="detail-info-value">
                  {item.condition || "Unknown"}
                </span>
              </div>
              <div className="detail-info-row">
                <span className="detail-info-label">Brand:</span>
                <span className="detail-info-value">
                  {item.brand || "Unknown"}
                </span>
              </div>
              <div className="detail-info-row">
                <span className="detail-info-label">Material:</span>
                <span className="detail-info-value">
                  {extractMaterial(item.labels)}
                </span>
              </div>
              {item.price !== undefined && item.price !== null && (
                <div className="detail-info-row">
                  <span className="detail-info-label">Price:</span>
                  <span className="detail-info-value">
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="detail-actions-section">
              <IonButton
                expand="block"
                fill="outline"
                className="detail-action-button"
                onClick={() => setIsEditModalOpen(true)}
                data-testid="button-edit-item"
              >
                <IonIcon slot="start" icon={createOutline} />
                Edit Item
              </IonButton>

              <IonButton
                expand="block"
                fill="outline"
                className="detail-action-button"
                disabled={item.isSold || isMarkingSold}
                onClick={handleMarkAsSold}
                data-testid="button-mark-sold"
              >
                {item.isSold
                  ? "Already Sold"
                  : isMarkingSold
                    ? "Marking as Sold..."
                    : "Mark as Sold"}
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
          </>
        ) : null}
      </div>

      <EditItemModal
        isOpen={isEditModalOpen}
        item={item}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleItemUpdated}
      />
    </div>
  );
};

export default ItemDetailPage;
