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
import { InventoryItem, updateItem } from "../lib/inventoryService";
import "./EditItemModal.css";

interface EditItemModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onUpdate: () => void;
}

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
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
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
      });
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
        <div className="edit-form-container">
          <div className="edit-form-card">
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
            <button
              onClick={onClose}
              className="cancel-button"
              data-testid="button-cancel-edit"
            >
              Cancel
            </button>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default EditItemModal;
