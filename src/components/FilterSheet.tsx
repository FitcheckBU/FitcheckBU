import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
} from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
import { useState, useEffect } from "react";
import { InventoryItem } from "../lib/inventoryService";
import "./FilterSheet.css";

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: {
    sizes: string[];
    sexes: string[];
    colors: string[];
    materials: string[];
  }) => void;
  activeFilters: {
    sizes: string[];
    sexes: string[];
    colors: string[];
    materials: string[];
  };
  items: InventoryItem[];
}

const FilterSheet: React.FC<FilterSheetProps> = ({
  isOpen,
  onClose,
  onApply,
  activeFilters,
}) => {
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedSexes, setSelectedSexes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedSizes([...activeFilters.sizes]);
      setSelectedSexes([...activeFilters.sexes]);
      setSelectedColors([...activeFilters.colors]);
      setSelectedMaterials([...activeFilters.materials]);
    }
  }, [isOpen, activeFilters]);

  const toggleSelection = (
    value: string,
    selected: string[],
    setSelected: (values: string[]) => void
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const handleApply = () => {
    onApply({
      sizes: selectedSizes,
      sexes: selectedSexes,
      colors: selectedColors,
      materials: selectedMaterials,
    });
  };

  const handleReset = () => {
    setSelectedSizes([]);
    setSelectedSexes([]);
    setSelectedColors([]);
    setSelectedMaterials([]);
  };

  const colorOptions = [
    { name: "Red", hex: "#EF4444" },
    { name: "Orange", hex: "#F97316" },
    { name: "Yellow", hex: "#FDE047" },
    { name: "Green", hex: "#4ADE80" },
    { name: "Blue", hex: "#60A5FA" },
    { name: "DarkBlue", hex: "#3730A3" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Gray", hex: "#9CA3AF" },
    { name: "Black", hex: "#1F2937" },
    { name: "Tan", hex: "#D4A574" },
    { name: "Brown", hex: "#78350F" },
    { name: "Purple", hex: "#C084FC" },
  ];

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={0.9} breakpoints={[0, 0.9, 1]}>
      <IonHeader>
        <IonToolbar className="filter-toolbar">
          <IonButtons slot="start">
            <IonButton onClick={onClose} data-testid="button-close-filter">
              <IonIcon icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle className="filter-title">Sort & Filter</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="filter-sheet-content">
        {/* Size Section */}
        <div className="filter-section">
          <h3 className="filter-section-title">Size:</h3>
          <div className="filter-chips-row">
            {["XS", "S", "M", "L", "XL"].map((size) => (
              <button
                key={size}
                className={`filter-chip ${selectedSizes.includes(size) ? "chip-selected" : ""}`}
                onClick={() => toggleSelection(size, selectedSizes, setSelectedSizes)}
                data-testid={`chip-size-${size}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Sex Section */}
        <div className="filter-section">
          <h3 className="filter-section-title">Sex:</h3>
          <div className="filter-chips-row">
            {["Male", "Female", "Unisex"].map((sex) => (
              <button
                key={sex}
                className={`filter-chip ${selectedSexes.includes(sex) ? "chip-selected" : ""}`}
                onClick={() => toggleSelection(sex, selectedSexes, setSelectedSexes)}
                data-testid={`chip-sex-${sex}`}
              >
                {sex}
              </button>
            ))}
          </div>
        </div>

        {/* Color Section */}
        <div className="filter-section">
          <h3 className="filter-section-title">Color:</h3>
          <div className="filter-colors-grid">
            {colorOptions.map((color) => {
              const isSelected = selectedColors.includes(color.name);
              const isWhite = color.name === "White";
              
              return (
                <button
                  key={color.name}
                  className={`color-circle ${isSelected ? "color-selected" : ""}`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: "transparent",
                          borderColor: isWhite ? "#9ca3af" : color.hex,
                        }
                      : {
                          backgroundColor: color.hex,
                          borderColor: isWhite ? "#9ca3af" : "transparent",
                        }
                  }
                  onClick={() => toggleSelection(color.name, selectedColors, setSelectedColors)}
                  aria-label={color.name}
                  data-testid={`color-${color.name.toLowerCase()}`}
                />
              );
            })}
          </div>
        </div>

        {/* Material Section */}
        <div className="filter-section">
          <h3 className="filter-section-title">Material:</h3>
          <div className="filter-material-grid">
            {["Cotton", "Wool", "Polyester", "Linen", "Silk", "Denim", "Leather", "Suede", "Other"].map(
              (material) => (
                <button
                  key={material}
                  className={`filter-chip ${selectedMaterials.includes(material) ? "chip-selected" : ""}`}
                  onClick={() => toggleSelection(material, selectedMaterials, setSelectedMaterials)}
                  data-testid={`chip-material-${material.toLowerCase()}`}
                >
                  {material}
                </button>
              )
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="filter-actions-footer">
          <button
            className="filter-reset-button"
            onClick={handleReset}
            data-testid="button-reset"
          >
            Reset
          </button>
          <button
            className="filter-apply-button"
            onClick={handleApply}
            data-testid="button-apply"
          >
            Apply
          </button>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default FilterSheet;
