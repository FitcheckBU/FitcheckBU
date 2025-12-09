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
import "../styles/pages/ItemConfirmationPage.css";
import { printBarcode } from "../lib/printerService";

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

// Color options matching FilterSheet
const colorOptions = [
  { name: "Red", hex: "#EF4444" },
  { name: "Orange", hex: "#F97316" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Green", hex: "#22C55E" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Black", hex: "#1F2937" },
  { name: "Tan", hex: "#D4A574" },
  { name: "Brown", hex: "#92400E" },
];

// Size options matching FilterSheet
const sizeOptions = ["XS", "S", "M", "L", "XL"];

const ItemConfirmationPage: React.FC = () => {
  const { itemId } = useParams<RouteParams>();
  const history = useHistory();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [labelsApplied, setLabelsApplied] = useState(false);
  const [aiFieldsApplied, setAiFieldsApplied] = useState(false);
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

  useEffect(() => {
    setLabelsApplied(false);
    setAiFieldsApplied(false);
    initialDataLoaded.current = false;
  }, [itemId]);

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

  const metadataStatusValue = item?.metadataStatus ?? "pending";
  const metadataReady = metadataStatusValue !== "pending";
  const metadataErrored = metadataStatusValue === "error";
  const labelsReady = Boolean(item?.labels && item.labels.length > 0);

  // Append AI labels to description when they arrive
  useEffect(() => {
    if (!item || labelsApplied) return;
    if (!labelsReady) return;

    const labels = item.labels ?? [];
    if (labels.length > 0) {
      setFormData((prev) => ({
        ...prev,
        description: ((prev.description || "") + labels.join(", ")).trim(),
      }));
      setLabelsApplied(true);
    }
  }, [item, labelsReady, labelsApplied]);

  useEffect(() => {
    if (!item || aiFieldsApplied) return;
    if (!metadataReady) return;
    if (metadataStatusValue !== "complete") {
      setAiFieldsApplied(true);
      return;
    }

    const mergeText = (
      currentValue: string,
      candidateValue?: string,
      defaultValue: string = "",
    ) => {
      if (candidateValue && candidateValue.length > 0) {
        const trimmedCandidate = candidateValue.trim();
        if (currentValue === defaultValue || currentValue.trim().length === 0) {
          return trimmedCandidate;
        }
      }
      return currentValue;
    };

    const mergeNumber = (currentValue: number, candidateValue?: number) => {
      if (
        typeof candidateValue === "number" &&
        Number.isFinite(candidateValue)
      ) {
        if (currentValue === 0 || Number.isNaN(currentValue)) {
          return candidateValue;
        }
      }
      return currentValue;
    };

    setFormData((prev) => ({
      ...prev,
      name: mergeText(prev.name, item.name, "New Item"),
      brand: mergeText(prev.brand, item.brand),
      category: mergeText(prev.category, item.category, "uncategorized"),
      color: mergeText(prev.color, item.color),
      condition: mergeText(prev.condition, item.condition, "unknown"),
      style: mergeText(prev.style, item.style),
      size: mergeText(prev.size, item.size),
      decade: mergeText(prev.decade, item.decade),
      price: mergeNumber(prev.price, item.price),
      description:
        prev.description?.trim().length === 0 && item.description
          ? item.description
          : prev.description,
    }));
    setAiFieldsApplied(true);
  }, [item, metadataReady, aiFieldsApplied, metadataStatusValue]);

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

      const sku = itemId.substring(0, 9).toUpperCase();
      await printBarcode(sku);

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

  const isSubmitDisabled =
    submitting || !labelsReady || metadataStatusValue === "pending";

  return (
    <div className="item-confirmation-page">
      <div className="confirmation-header">
        <h2>Review Your Item</h2>
        <IonText color="medium">
          <p>Review and edit the details before adding to your inventory</p>
        </IonText>
      </div>
      {(!labelsReady || metadataStatusValue === "pending") && (
        <div className="confirmation-loading inline">
          <IonSpinner name="crescent" className="description-spinner" />
          <IonText color="medium">
            <p>
              Analyzing images
              {metadataStatusValue === "pending"
                ? " and generating item details..."
                : "..."}
            </p>
          </IonText>
        </div>
      )}
      {metadataErrored && (
        <div className="warning-banner">
          <IonText color="warning">
            <p>
              We couldn&apos;t auto-fill every field. Please review and enter
              any missing details manually.
            </p>
          </IonText>
        </div>
      )}

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

          <div className="form-section">
            <IonLabel className="form-section-label">Color</IonLabel>
            <div className="color-selection-grid">
              {colorOptions.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  className={`color-circle ${formData.color === color.name ? "color-selected" : ""}`}
                  style={{
                    backgroundColor: color.hex,
                  }}
                  onClick={() => handleInputChange("color", color.name)}
                  aria-label={color.name}
                />
              ))}
            </div>
          </div>

          <IonItem>
            <IonLabel position="stacked">Size</IonLabel>
            <IonSelect
              value={formData.size}
              onIonChange={(e) => handleInputChange("size", e.detail.value)}
              placeholder="Select size"
            >
              {sizeOptions.map((size) => (
                <IonSelectOption key={size} value={size}>
                  {size}
                </IonSelectOption>
              ))}
            </IonSelect>
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
              {!labelsReady && (
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
