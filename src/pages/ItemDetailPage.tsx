import { IonButton, IonIcon } from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../lib/firebaseClient";
import {
  getImageStoragePaths,
  InventoryItem,
  updateItem,
} from "../lib/inventoryService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseClient";
import EditItemModal from "../components/EditItemModal";
import "./ItemDetailPage.css";

const ItemDetailPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const history = useHistory();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!itemId) return;

    const itemRef = doc(db, "items", itemId);
    const unsubscribe = onSnapshot(itemRef, (snapshot) => {
      if (snapshot.exists()) {
        const itemData = {
          id: snapshot.id,
          ...snapshot.data(),
        } as InventoryItem;
        setItem(itemData);
      }
    });

    return () => unsubscribe();
  }, [itemId]);

  useEffect(() => {
    const loadImage = async () => {
      if (!item) return;

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

  const handleMarkAsSold = async () => {
    if (!item?.id) return;

    try {
      await updateItem(item.id, { isSold: true });
    } catch (error) {
      console.error("Failed to mark as sold:", error);
    }
  };

  const handleBack = () => {
    history.goBack();
  };

  if (!item) {
    return (
      <div className="item-detail-loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="item-detail-page">
        <div className="item-detail-header">
          <IonButton
            fill="clear"
            onClick={handleBack}
            className="back-button"
            data-testid="button-back"
          >
            <IonIcon icon={arrowBackOutline} slot="icon-only" />
          </IonButton>
          <h1 className="item-detail-title">User Dashboard</h1>
        </div>

        <div className="item-detail-content">
          <div className="item-detail-card">
            <div className="item-image-section">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={item.name}
                  className="item-detail-image"
                />
              ) : (
                <div className="item-image-placeholder">No Image</div>
              )}
            </div>

            <div className="item-info-section">
              <h2 className="item-name">{item.name || "Unknown Item"}</h2>
              <div className="item-meta">
                <p className="item-status">
                  <span className="meta-label">Status:</span>{" "}
                  <span className="meta-value">
                    {item.isSold ? "Sold" : "Listed"}
                  </span>
                </p>
                <p className="item-sku">
                  <span className="meta-label">SKU:</span>{" "}
                  <span className="meta-value">
                    {item.id ? item.id.substring(0, 8).toUpperCase() : "N/A"}
                  </span>
                </p>
              </div>

              <div className="barcode-section">
                <svg className="barcode-svg" viewBox="0 0 280 80">
                  {/* Simple barcode pattern */}
                  <rect x="0" y="0" width="8" height="80" fill="#000" />
                  <rect x="12" y="0" width="4" height="80" fill="#000" />
                  <rect x="20" y="0" width="8" height="80" fill="#000" />
                  <rect x="32" y="0" width="4" height="80" fill="#000" />
                  <rect x="40" y="0" width="12" height="80" fill="#000" />
                  <rect x="56" y="0" width="4" height="80" fill="#000" />
                  <rect x="64" y="0" width="8" height="80" fill="#000" />
                  <rect x="76" y="0" width="4" height="80" fill="#000" />
                  <rect x="84" y="0" width="12" height="80" fill="#000" />
                  <rect x="100" y="0" width="4" height="80" fill="#000" />
                  <rect x="108" y="0" width="8" height="80" fill="#000" />
                  <rect x="120" y="0" width="4" height="80" fill="#000" />
                  <rect x="128" y="0" width="12" height="80" fill="#000" />
                  <rect x="144" y="0" width="8" height="80" fill="#000" />
                  <rect x="156" y="0" width="4" height="80" fill="#000" />
                  <rect x="164" y="0" width="8" height="80" fill="#000" />
                  <rect x="176" y="0" width="12" height="80" fill="#000" />
                  <rect x="192" y="0" width="4" height="80" fill="#000" />
                  <rect x="200" y="0" width="8" height="80" fill="#000" />
                  <rect x="212" y="0" width="4" height="80" fill="#000" />
                  <rect x="220" y="0" width="12" height="80" fill="#000" />
                  <rect x="236" y="0" width="4" height="80" fill="#000" />
                  <rect x="244" y="0" width="8" height="80" fill="#000" />
                  <rect x="256" y="0" width="4" height="80" fill="#000" />
                  <rect x="264" y="0" width="12" height="80" fill="#000" />
                </svg>
              </div>

              <div className="item-actions">
                <IonButton
                  expand="block"
                  color="primary"
                  className="mark-sold-button"
                  onClick={handleMarkAsSold}
                  disabled={item.isSold}
                  data-testid="button-mark-sold"
                >
                  {item.isSold ? "Marked as Sold" : "Mark as Sold"}
                </IonButton>

                <div className="action-buttons-row">
                  <IonButton
                    fill="outline"
                    color="primary"
                    className="secondary-action-button"
                    onClick={() => setShowEditModal(true)}
                    data-testid="button-edit"
                  >
                    Edit
                  </IonButton>
                  <IonButton
                    fill="outline"
                    color="primary"
                    className="secondary-action-button"
                    data-testid="button-more-info"
                  >
                    More Info
                  </IonButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditItemModal
        isOpen={showEditModal}
        item={item}
        onClose={() => setShowEditModal(false)}
        onUpdate={() => {
          setShowEditModal(false);
        }}
      />
    </>
  );
};

export default ItemDetailPage;
