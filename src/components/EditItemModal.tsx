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
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  useIonToast,
} from "@ionic/react";
import { closeOutline, saveOutline } from "ionicons/icons";
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
          <IonTitle>Edit Item</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} data-testid="button-close-edit">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="edit-modal-content">
        <div className="edit-form-container">
          <IonItem className="edit-form-item">
            <IonLabel position="stacked" className="edit-form-label">
              Name <span className="required-asterisk">*</span>
            </IonLabel>
            <IonInput
              value={formData.name}
              onIonInput={(e) => handleInputChange("name", e.detail.value || "")}
              placeholder="Enter item name"
              className="edit-form-input"
              data-testid="input-edit-name"
            />
          </IonItem>

          <IonItem className="edit-form-item">
            <IonLabel position="stacked" className="edit-form-label">
              Brand
            </IonLabel>
            <IonInput
              value={formData.brand}
              onIonInput={(e) => handleInputChange("brand", e.detail.value || "")}
              placeholder="Enter brand"
              className="edit-form-input"
              data-testid="input-edit-brand"
            />
          </IonItem>

          <IonItem className="edit-form-item">
            <IonLabel position="stacked" className="edit-form-label">
              Category
            </IonLabel>
            <IonSelect
              value={formData.category}
              onIonChange={(e) => handleInputChange("category", e.detail.value)}
              placeholder="Select category"
              className="edit-form-select"
              data-testid="select-edit-category"
            >
              <IonSelectOption value="Tops">Tops</IonSelectOption>
              <IonSelectOption value="Bottoms">Bottoms</IonSelectOption>
              <IonSelectOption value="Outerwear">Outerwear</IonSelectOption>
              <IonSelectOption value="Dresses">Dresses</IonSelectOption>
              <IonSelectOption value="Shoes">Shoes</IonSelectOption>
              <IonSelectOption value="Accessories">Accessories</IonSelectOption>
              <IonSelectOption value="Other">Other</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem className="edit-form-item">
            <IonLabel position="stacked" className="edit-form-label">
              Color
            </IonLabel>
            <IonInput
              value={formData.color}
              onIonInput={(e) => handleInputChange("color", e.detail.value || "")}
              placeholder="Enter color"
              className="edit-form-input"
              data-testid="input-edit-color"
            />
          </IonItem>

          <IonItem className="edit-form-item">
            <IonLabel position="stacked" className="edit-form-label">
              Condition
            </IonLabel>
            <IonSelect
              value={formData.condition}
              onIonChange={(e) => handleInputChange("condition", e.detail.value)}
              placeholder="Select condition"
              className="edit-form-select"
              data-testid="select-edit-condition"
            >
              <IonSelectOption value="New">New</IonSelectOption>
              <IonSelectOption value="Like New">Like New</IonSelectOption>
              <IonSelectOption value="Good">Good</IonSelectOption>
              <IonSelectOption value="Fair">Fair</IonSelectOption>
              <IonSelectOption value="Poor">Poor</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem className="edit-form-item">
            <IonLabel position="stacked" className="edit-form-label">
              Price ($)
            </IonLabel>
            <IonInput
              type="number"
              value={formData.price}
              onIonInput={(e) => handleInputChange("price", e.detail.value || "")}
              placeholder="0.00"
              className="edit-form-input"
              data-testid="input-edit-price"
            />
          </IonItem>

          <IonItem className="edit-form-item">
            <IonLabel position="stacked" className="edit-form-label">
              Decade
            </IonLabel>
            <IonSelect
              value={formData.decade}
              onIonChange={(e) => handleInputChange("decade", e.detail.value)}
              placeholder="Select decade"
              className="edit-form-select"
              data-testid="select-edit-decade"
            >
              <IonSelectOption value="2020s">2020s</IonSelectOption>
              <IonSelectOption value="2010s">2010s</IonSelectOption>
              <IonSelectOption value="2000s">2000s</IonSelectOption>
              <IonSelectOption value="1990s">1990s</IonSelectOption>
              <IonSelectOption value="1980s">1980s</IonSelectOption>
              <IonSelectOption value="1970s">1970s</IonSelectOption>
              <IonSelectOption value="1960s">1960s</IonSelectOption>
              <IonSelectOption value="Vintage">Vintage (Pre-1960)</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem className="edit-form-item">
            <IonLabel position="stacked" className="edit-form-label">
              Style
            </IonLabel>
            <IonInput
              value={formData.style}
              onIonInput={(e) => handleInputChange("style", e.detail.value || "")}
              placeholder="Enter style (e.g., Casual, Formal)"
              className="edit-form-input"
              data-testid="input-edit-style"
            />
          </IonItem>

          <IonItem className="edit-form-item edit-form-item-textarea">
            <IonLabel position="stacked" className="edit-form-label">
              Description
            </IonLabel>
            <IonTextarea
              value={formData.description}
              onIonInput={(e) => handleInputChange("description", e.detail.value || "")}
              placeholder="Add additional details about the item..."
              rows={4}
              className="edit-form-textarea"
              data-testid="textarea-edit-description"
            />
          </IonItem>

          <div className="edit-form-actions">
            <IonButton
              expand="block"
              onClick={handleSave}
              disabled={isSaving}
              className="edit-save-button"
              data-testid="button-save-edit"
            >
              <IonIcon slot="start" icon={saveOutline} />
              {isSaving ? "Saving..." : "Save Changes"}
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default EditItemModal;
