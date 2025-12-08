import { IonButton, IonIcon, IonPage, IonContent, IonInput } from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../lib/firebaseClient";
import {
  getImageStoragePaths,
  InventoryItem,
  updateItem,
  deleteItem,
} from "../lib/inventoryService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseClient";
import Logo from "../components/Logo";
import "./EditItemPage.css";

const EditItemPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const history = useHistory();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  
  // Form state
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [condition, setCondition] = useState("");
  const [price, setPrice] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const colors = [
    { name: "red", hex: "#FF3B3B" },
    { name: "orange", hex: "#FF933B" },
    { name: "yellow", hex: "#FFD13B" },
    { name: "green", hex: "#59DD00" },
    { name: "blue", hex: "#009DFF" },
    { name: "purple", hex: "#412FFF" },
    { name: "pink", hex: "#F12FFF" },
    { name: "white", hex: "#FFFFFF" },
    { name: "gray", hex: "#9B9B9B" },
    { name: "black", hex: "#000000" },
    { name: "beige", hex: "#DBB778" },
    { name: "brown", hex: "#6F4824" },
  ];

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
        
        // Initialize form fields
        setName(itemData.name || "");
        setBrand(itemData.brand || "");
        setSize(itemData.size || "");
        setCondition(itemData.condition || "");
        setPrice(itemData.price?.toString() || "");
        setSelectedColor(itemData.color || "");
      }
    });

    return () => unsubscribe();
  }, [itemId]);

  useEffect(() => {
    if (!item) return;

    const loadImage = async () => {
      try {
        const paths = getImageStoragePaths(item);
        if (paths.length > 0) {
          const imageRef = ref(storage, paths[0]);
          const url = await getDownloadURL(imageRef);
          setImageUrl(url);
        }
      } catch (error) {
        console.error("Error loading image:", error);
      }
    };

    loadImage();
  }, [item]);

  const handleBack = () => {
    history.goBack();
  };

  const handleConfirm = async () => {
    if (!item || !item.id) return;

    try {
      await updateItem(item.id, {
        name,
        brand,
        size,
        condition,
        price: parseFloat(price) || 0,
        color: selectedColor,
      });
      history.goBack();
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleReset = () => {
    if (!item) return;
    setName(item.name || "");
    setBrand(item.brand || "");
    setSize(item.size || "");
    setCondition(item.condition || "");
    setPrice(item.price?.toString() || "");
    setSelectedColor(item.color || "");
  };

  const handleDelete = async () => {
    if (!item || !item.id) return;
    
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteItem(item.id);
        history.push("/home");
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  if (!item) {
    return (
      <IonPage>
        <div>Loading...</div>
      </IonPage>
    );
  }

  return (
    <IonPage className="edit-item-page">
      {/* Navbar with logo */}
      <div className="edit-item-navbar">
        <Logo variant="default" />
      </div>

      {/* Scrollable content area */}
      <IonContent className="edit-item-body">
        {/* Back button and title section */}
        <div className="edit-item-header-section">
          <IonButton
            fill="clear"
            onClick={handleBack}
            className="edit-back-button"
            data-testid="button-back"
          >
            <IonIcon icon={arrowBackOutline} slot="icon-only" />
          </IonButton>
          <h1 className="edit-item-title">Edit Listing</h1>
        </div>

        <div className="edit-item-content">
          <div className="edit-item-card">
            {/* Image */}
            <div className="edit-image-section">
              {imageUrl ? (
                <img src={imageUrl} alt={item.name} className="edit-item-image" />
              ) : (
                <div className="edit-item-image-placeholder">No Image</div>
              )}
            </div>

            {/* Upload button */}
            <IonButton
              fill="outline"
              className="upload-photo-button"
              data-testid="button-upload-photo"
            >
              Upload New Photo
            </IonButton>

            {/* Form fields */}
            <div className="edit-form-fields">
              <IonInput
                className="edit-text-field"
                value={name}
                onIonInput={(e) => setName(e.detail.value!)}
                placeholder="Name"
                data-testid="input-name"
              />

              <IonInput
                className="edit-text-field"
                value={brand}
                onIonInput={(e) => setBrand(e.detail.value!)}
                placeholder="Brand"
                data-testid="input-brand"
              />

              <IonInput
                className="edit-text-field"
                value={size}
                onIonInput={(e) => setSize(e.detail.value!)}
                placeholder="Size"
                data-testid="input-size"
              />

              <IonInput
                className="edit-text-field"
                value={condition}
                onIonInput={(e) => setCondition(e.detail.value!)}
                placeholder="Condition"
                data-testid="input-condition"
              />

              <IonInput
                className="edit-text-field"
                value={price}
                onIonInput={(e) => setPrice(e.detail.value!)}
                placeholder="Price"
                type="number"
                data-testid="input-price"
              />
            </div>

            {/* Color selection */}
            <div className="edit-color-section">
              <div className="edit-color-grid">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    className={`edit-color-circle ${
                      selectedColor === color.name ? "selected" : ""
                    }`}
                    style={{ backgroundColor: color.hex }}
                    onClick={() => setSelectedColor(color.name)}
                    data-testid={`color-${color.name}`}
                  >
                    {selectedColor === color.name && color.name !== "white" && (
                      <span className="checkmark">✓</span>
                    )}
                    {selectedColor === color.name && color.name === "white" && (
                      <span className="checkmark-dark">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom buttons */}
            <div className="edit-bottom-buttons">
              <IonButton
                expand="block"
                className="confirm-button"
                onClick={handleConfirm}
                data-testid="button-confirm"
              >
                Confirm
              </IonButton>

              <div className="edit-secondary-buttons">
                <IonButton
                  fill="outline"
                  className="reset-button"
                  onClick={handleReset}
                  data-testid="button-reset"
                >
                  Reset
                </IonButton>

                <IonButton
                  fill="outline"
                  className="delete-button"
                  onClick={handleDelete}
                  data-testid="button-delete"
                >
                  Delete
                </IonButton>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EditItemPage;
