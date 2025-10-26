import {
  IonButton,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonLabel,
  IonItem,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from "@ionic/react";
import { useEffect, useState, useRef } from "react";
import { useHistory, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseClient";
import {
  InventoryItem,
  updateItem,
  getItemImageUrls,
} from "../lib/inventoryService";
import "./ItemConfirmationPage.css";

interface RouteParams {
  itemId: string;
}

interface FormData {
  name: string;
  category: string;
  brand: string;
  color: string;
  size: string;
  condition: string;
  price: number;
  decade: string;
  style: string;
  description: string;
}

const ItemConfirmationPage: React.FC = () => {
  const { itemId } = useParams<RouteParams>();
  const history = useHistory();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [labelsLoaded, setLabelsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "New Item",
    category: "uncategorized",
    brand: "",
    color: "",
    size: "",
    condition: "unknown",
    price: 0,
    decade: "",
    style: "",
    description: "",
  });
  const initialDataLoaded = useRef(false);

  // Listen for item changes from Firestore
  useEffect(() => {
    if (!itemId) return;

    const unsubscribe = onSnapshot(doc(db, "items", itemId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as InventoryItem;
        const itemData = { id: snapshot.id, ...data };
        setItem(itemData);

        // Load images
        if (
          data.imageStoragePaths &&
          data.imageStoragePaths.length > 0 &&
          imageUrls.length === 0
        ) {
          getItemImageUrls(itemData).then((urls) => {
            setImageUrls(urls);
          });
        }
      }
    });

    return () => unsubscribe();
  }, [itemId, imageUrls]);

  // Populate form with initial data
  useEffect(() => {
    if (item && !initialDataLoaded.current) {
      setFormData({
        name: item.name || "New Item",
        category: item.category || "uncategorized",
        brand: item.brand || "",
        color: item.color || "",
        size: item.size || "",
        condition: item.condition || "unknown",
        price: item.price || 0,
        decade: item.decade || "",
        style: item.style || "",
        description: item.description || "",
      });
      initialDataLoaded.current = true;
    }
  }, [item]);

  // Append AI labels to description when they arrive
  useEffect(() => {
    if (item && !labelsLoaded) {
      const labels = item.labels || [];
      if (labels.length > 0) {
        setLabelsLoaded(true);
        setFormData((prev) => ({
          ...prev,
          description: ((prev.description || "") + labels.join(", ")).trim(),
        }));
      }
    }
  }, [item, labelsLoaded]);

  const handleInputChange = (
    field: keyof FormData,
    value: string | number | string[],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!itemId) return;

    setSubmitting(true);
    try {
      await updateItem(itemId, {
        ...formData,
        status: "active",
      });
      history.push("/home");
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to submit item. Please try again.");
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to upload flow or dashboard
    history.push("/upload");
  };

  if (!item) {
    return (
      <div className="confirmation-loading">
        <IonSpinner name="crescent" />
        <IonText>
          <p>Loading item...</p>
        </IonText>
      </div>
    );
  }

  const isSubmitDisabled = !labelsLoaded || submitting;

  return (
    <div className="item-confirmation-page">
      <div className="confirmation-header">
        <h2>Review Your Item</h2>
        <IonText color="medium">
          <p>Review and edit the details before adding to your inventory</p>
        </IonText>
      </div>

      {/* Image Grid */}
      {imageUrls.length > 0 && (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Images</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="confirmation-image-grid">
              {imageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Item ${index + 1}`}
                  className="confirmation-image"
                />
              ))}
            </div>
          </IonCardContent>
        </IonCard>
      )}

      {/* Form Fields */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Item Details</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonItem>
            <IonLabel position="stacked">Name *</IonLabel>
            <IonInput
              value={formData.name}
              onIonInput={(e) => handleInputChange("name", e.detail.value!)}
              placeholder="Enter item name"
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Category</IonLabel>
            <IonSelect
              value={formData.category}
              onIonChange={(e) => handleInputChange("category", e.detail.value)}
            >
              <IonSelectOption value="uncategorized">
                Uncategorized
              </IonSelectOption>
              <IonSelectOption value="tops">Tops</IonSelectOption>
              <IonSelectOption value="bottoms">Bottoms</IonSelectOption>
              <IonSelectOption value="dresses">Dresses</IonSelectOption>
              <IonSelectOption value="outerwear">Outerwear</IonSelectOption>
              <IonSelectOption value="accessories">Accessories</IonSelectOption>
              <IonSelectOption value="shoes">Shoes</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Brand</IonLabel>
            <IonInput
              value={formData.brand}
              onIonInput={(e) => handleInputChange("brand", e.detail.value!)}
              placeholder="Enter brand name"
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Color</IonLabel>
            <IonInput
              value={formData.color}
              onIonInput={(e) => handleInputChange("color", e.detail.value!)}
              placeholder="Enter color"
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Size</IonLabel>
            <IonInput
              value={formData.size}
              onIonInput={(e) => handleInputChange("size", e.detail.value!)}
              placeholder="Enter size"
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Condition</IonLabel>
            <IonSelect
              value={formData.condition}
              onIonChange={(e) =>
                handleInputChange("condition", e.detail.value)
              }
            >
              <IonSelectOption value="unknown">Unknown</IonSelectOption>
              <IonSelectOption value="new">New</IonSelectOption>
              <IonSelectOption value="like-new">Like New</IonSelectOption>
              <IonSelectOption value="good">Good</IonSelectOption>
              <IonSelectOption value="fair">Fair</IonSelectOption>
              <IonSelectOption value="poor">Poor</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Price ($)</IonLabel>
            <IonInput
              type="number"
              value={formData.price}
              onIonInput={(e) =>
                handleInputChange("price", parseFloat(e.detail.value!) || 0)
              }
              placeholder="Enter price"
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Decade</IonLabel>
            <IonSelect
              value={formData.decade}
              onIonChange={(e) => handleInputChange("decade", e.detail.value)}
            >
              <IonSelectOption value="">Not specified</IonSelectOption>
              <IonSelectOption value="1950s">1950s</IonSelectOption>
              <IonSelectOption value="1960s">1960s</IonSelectOption>
              <IonSelectOption value="1970s">1970s</IonSelectOption>
              <IonSelectOption value="1980s">1980s</IonSelectOption>
              <IonSelectOption value="1990s">1990s</IonSelectOption>
              <IonSelectOption value="2000s">2000s</IonSelectOption>
              <IonSelectOption value="2010s">2010s</IonSelectOption>
              <IonSelectOption value="2020s">2020s</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Style</IonLabel>
            <IonInput
              value={formData.style}
              onIonInput={(e) => handleInputChange("style", e.detail.value!)}
              placeholder="Enter style (e.g., casual, formal)"
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">
              Description
              {!labelsLoaded && (
                <IonSpinner name="crescent" className="description-spinner" />
              )}
            </IonLabel>
            <IonTextarea
              value={formData.description}
              onIonInput={(e) =>
                handleInputChange("description", e.detail.value!)
              }
              placeholder="Enter item description"
              rows={4}
            />
          </IonItem>
        </IonCardContent>
      </IonCard>

      {/* Action Buttons */}
      <div className="confirmation-actions">
        <IonButton
          expand="block"
          color="medium"
          fill="outline"
          onClick={handleCancel}
          disabled={submitting}
        >
          Cancel
        </IonButton>
        <IonButton
          expand="block"
          color="primary"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
        >
          {submitting ? (
            <>
              <IonSpinner name="crescent" />
              <span style={{ marginLeft: "8px" }}>Submitting...</span>
            </>
          ) : (
            "Add to Inventory"
          )}
        </IonButton>
      </div>

      {isSubmitDisabled && !submitting && (
        <IonText color="warning" className="submit-warning">
          <p>
            Please wait for AI labels to finish processing before submitting.
          </p>
        </IonText>
      )}
    </div>
  );
};

export default ItemConfirmationPage;
