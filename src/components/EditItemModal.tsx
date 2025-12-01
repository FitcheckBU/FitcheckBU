import React, { useState, useEffect } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  useIonToast,
} from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
import { InventoryItem, updateItem, deleteItem } from "../lib/inventoryService";
import { getItemImageUrls } from "../lib/inventoryService";
import "./EditItemModal.css";

interface EditItemModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onUpdate: () => void;
}

const colorOptions = [
  { name: "Red", hex: "#FF3B3B" },
  { name: "Orange", hex: "#FF933B" },
  { name: "Yellow", hex: "#FFD13B" },
  { name: "Green", hex: "#59DD00" },
  { name: "Blue", hex: "#009DFF" },
  { name: "Purple", hex: "#412FFF" },
  { name: "Pink", hex: "#F12FFF" },
  { name: "White", hex: "#FFFFFF", border: "#023E38" },
  { name: "Gray", hex: "#9B9B9B" },
  { name: "Black", hex: "#000000" },
  { name: "Tan", hex: "#DBB778" },
  { name: "Brown", hex: "#6F4824" },
];

const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  item,
  onClose,
  onUpdate,
}) => {
  const [presentToast] = useIonToast();
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    color: "",
    condition: "",
    price: "",
    decade: "",
    style: "",
    description: "",
    size: "",
    sex: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    if (isOpen && item && item.id) {
      setFormData({
        name: item.name || "",
        brand: item.brand || "",
        category: item.category || "",
        color: item.color || "",
        condition: item.condition || "",
        price: item.price?.toString() || "",
        decade: item.decade || "",
        style: item.style || "",
        description: item.description || "",
        size: item.size || "",
        sex: item.sex || "",
      });

      // Load item image
      const loadImage = async () => {
        try {
          const urls = await getItemImageUrls(item);
          if (urls.length > 0) {
            setImageUrl(urls[0]);
          } else {
            setImageUrl("");
          }
        } catch (error) {
          console.error("Failed to load image:", error);
          setImageUrl("");
        }
      };
      loadImage();
    }
  }, [isOpen, item]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!item?.id) return;

    if (!formData.name.trim()) {
      await presentToast({
        message: "Name is required",
        duration: 2000,
        color: "danger",
        position: "top",
      });
      return;
    }

    try {
      setIsSaving(true);

      const updates: Partial<InventoryItem> = {
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        category: formData.category.trim(),
        color: formData.color.trim(),
        condition: formData.condition.trim(),
        price: parseFloat(formData.price) || 0,
        decade: formData.decade.trim(),
        style: formData.style.trim(),
        description: formData.description.trim(),
        size: formData.size.trim(),
        sex: formData.sex.trim() as "men" | "women" | "unisex" | "",
      };

      await updateItem(item.id, updates);

      await presentToast({
        message: "Item updated successfully!",
        duration: 2000,
        color: "success",
        position: "top",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Failed to update item:", error);
      await presentToast({
        message: "Failed to update item. Please try again.",
        duration: 3000,
        color: "danger",
        position: "top",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item?.id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this item? This action cannot be undone.",
    );
    if (!confirmed) return;

    try {
      await deleteItem(item.id);

      await presentToast({
        message: "Item deleted successfully!",
        duration: 2000,
        color: "success",
        position: "top",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Failed to delete item:", error);
      await presentToast({
        message: "Failed to delete item. Please try again.",
        duration: 3000,
        color: "danger",
        position: "top",
      });
    }
  };

  const handleReset = () => {
    if (item) {
      setFormData({
        name: item.name || "",
        brand: item.brand || "",
        category: item.category || "",
        color: item.color || "",
        condition: item.condition || "",
        price: item.price?.toString() || "",
        decade: item.decade || "",
        style: item.style || "",
        description: item.description || "",
        size: item.size || "",
        sex: item.sex || "",
      });
    }
  };

  if (!item) return null;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar className="edit-toolbar">
          <IonButtons slot="start">
            <IonButton onClick={onClose} data-testid="button-close-edit">
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle className="edit-title">Edit Item</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="edit-modal-content">
        {/* Header with back button and title - positioned to account for navbar */}
        <div className="edit-header-section">
          <IonButton
            fill="clear"
            onClick={onClose}
            className="edit-back-button"
            data-testid="button-close-edit"
          >
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
          <h1 className="edit-title">Edit Listing</h1>
        </div>

        <div className="edit-form-container">
          <div className="edit-form-card">
            {/* Item Image */}
            <div className="edit-image-container">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={formData.name}
                  className="edit-item-image"
                />
              ) : (
                <div className="edit-image-placeholder">No Image</div>
              )}
            </div>

            {/* Upload Button */}
            <button className="upload-button" data-testid="button-upload-photo">
              Upload New Photo
            </button>

            {/* Form Fields */}
            {/* Basic Information Section */}
            <div className="form-section">
              <h3 className="section-title">Basic Information</h3>

              <div className="form-field">
                <label className="field-label">
                  Name <span className="required-mark">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter item name"
                  className="field-input"
                  data-testid="input-edit-name"
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="field-label">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => handleInputChange("brand", e.target.value)}
                    placeholder="Enter brand"
                    className="field-input"
                    data-testid="input-edit-brand"
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    className="field-select"
                    data-testid="select-edit-category"
                  >
                    <option value="">Select category</option>
                    <option value="Tops">Tops</option>
                    <option value="Bottoms">Bottoms</option>
                    <option value="Outerwear">Outerwear</option>
                    <option value="Dresses">Dresses</option>
                    <option value="Shoes">Shoes</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="form-section">
              <h3 className="section-title">Details</h3>

              <div className="form-row">
                <div className="form-field">
                  <label className="field-label">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    placeholder="Enter color"
                    className="field-input"
                    data-testid="input-edit-color"
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Size</label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => handleInputChange("size", e.target.value)}
                    placeholder="Enter size"
                    className="field-input"
                    data-testid="input-edit-size"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="field-label">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) =>
                      handleInputChange("condition", e.target.value)
                    }
                    className="field-select"
                    data-testid="select-edit-condition"
                  >
                    <option value="">Select condition</option>
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="0.00"
                    className="field-input"
                    data-testid="input-edit-price"
                  />
                </div>
              </div>
            </div>

            {/* Style & Era Section */}
            <div className="form-section">
              <h3 className="section-title">Style & Era</h3>

              <div className="form-row">
                <div className="form-field">
                  <label className="field-label">Style</label>
                  <input
                    type="text"
                    value={formData.style}
                    onChange={(e) => handleInputChange("style", e.target.value)}
                    placeholder="e.g., Casual, Formal"
                    className="field-input"
                    data-testid="input-edit-style"
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Decade</label>
                  <select
                    value={formData.decade}
                    onChange={(e) =>
                      handleInputChange("decade", e.target.value)
                    }
                    className="field-select"
                    data-testid="select-edit-decade"
                  >
                    <option value="">Select decade</option>
                    <option value="2020s">2020s</option>
                    <option value="2010s">2010s</option>
                    <option value="2000s">2000s</option>
                    <option value="1990s">1990s</option>
                    <option value="1980s">1980s</option>
                    <option value="1970s">1970s</option>
                    <option value="1960s">1960s</option>
                    <option value="Vintage">Vintage (Pre-1960)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="form-section">
              <h3 className="section-title">Description</h3>

              <div className="form-field">
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Add additional details about the item..."
                  rows={4}
                  className="field-textarea"
                  data-testid="textarea-edit-description"
                />
              </div>
            </div>

            {/* Color Selection */}
            <div className="edit-color-section">
              <h3 className="section-title">Color:</h3>
              <div className="edit-colors-grid">
                {colorOptions.map((color) => (
                  <button
                    key={color.name}
                    className={`edit-color-circle ${
                      formData.color === color.name ? "edit-color-selected" : ""
                    }`}
                    style={{
                      backgroundColor: color.hex,
                      border: color.border
                        ? `1px solid ${color.border}`
                        : "1px solid transparent",
                    }}
                    onClick={() => handleInputChange("color", color.name)}
                    aria-label={color.name}
                    data-testid={`color-${color.name.toLowerCase()}`}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="edit-form-actions">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="save-button"
                data-testid="button-save-edit"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>

              <div className="edit-secondary-actions">
                <button
                  onClick={handleReset}
                  className="cancel-button"
                  data-testid="button-reset-edit"
                >
                  Reset
                </button>
                <button
                  onClick={handleDelete}
                  className="delete-button"
                  data-testid="button-delete-edit"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default EditItemModal;
