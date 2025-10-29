import { IonButton } from "@ionic/react";
import { useEffect, useState } from "react";
import "./FilterSheet.css";

export type FilterState = {
  sizes: string[];
  sexes: string[];
  colors: string[];
  materials: string[];
};

interface FilterFormProps {
  initialFilters: FilterState;
  onApply: (filters: FilterState) => void;
  onReset?: () => void;
}

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

const FilterForm: React.FC<FilterFormProps> = ({
  initialFilters,
  onApply,
  onReset,
}) => {
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedSexes, setSelectedSexes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  useEffect(() => {
    setSelectedSizes([...initialFilters.sizes]);
    setSelectedSexes([...initialFilters.sexes]);
    setSelectedColors([...initialFilters.colors]);
    setSelectedMaterials([...initialFilters.materials]);
  }, [initialFilters]);

  const toggleSelection = (
    value: string,
    selected: string[],
    setSelected: (values: string[]) => void,
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
    onReset?.();
  };

  return (
    <div className="filter-sheet-content">
      <div className="filter-section">
        <h3 className="filter-section-title">Size:</h3>
        <div className="filter-chips-row">
          {["XS", "S", "M", "L", "XL"].map((size) => (
            <button
              key={size}
              className={`filter-chip ${selectedSizes.includes(size) ? "chip-selected" : ""}`}
              onClick={() =>
                toggleSelection(size, selectedSizes, setSelectedSizes)
              }
              data-testid={`chip-size-${size}`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-section-title">Sex:</h3>
        <div className="filter-chips-row">
          {["Male", "Female", "Unisex"].map((sex) => (
            <button
              key={sex}
              className={`filter-chip ${selectedSexes.includes(sex) ? "chip-selected" : ""}`}
              onClick={() =>
                toggleSelection(sex, selectedSexes, setSelectedSexes)
              }
              data-testid={`chip-sex-${sex}`}
            >
              {sex}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-section-title">Color:</h3>
        <div className="filter-colors-grid">
          {colorOptions.map((color) => (
            <button
              key={color.name}
              className={`color-circle ${selectedColors.includes(color.name) ? "color-selected" : ""}`}
              style={{
                backgroundColor: color.hex,
              }}
              onClick={() =>
                toggleSelection(color.name, selectedColors, setSelectedColors)
              }
              aria-label={color.name}
              data-testid={`color-${color.name.toLowerCase()}`}
            />
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-section-title">Material:</h3>
        <div className="filter-chips-wrap">
          {[
            "Cotton",
            "Wool",
            "Polyester",
            "Silk",
            "Leather",
            "Linen",
            "Suede",
            "Denim",
            "Cashmere",
          ].map((material) => (
            <button
              key={material}
              className={`filter-chip ${selectedMaterials.includes(material) ? "chip-selected" : ""}`}
              onClick={() =>
                toggleSelection(
                  material,
                  selectedMaterials,
                  setSelectedMaterials,
                )
              }
              data-testid={`chip-material-${material.toLowerCase()}`}
            >
              {material}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-actions-footer">
        <IonButton
          expand="block"
          fill="outline"
          onClick={handleReset}
          className="filter-reset-button"
          data-testid="button-reset"
        >
          Reset
        </IonButton>
        <IonButton
          expand="block"
          onClick={handleApply}
          className="filter-apply-button"
          data-testid="button-apply"
        >
          Apply
        </IonButton>
      </div>
    </div>
  );
};

export default FilterForm;
