import { IonButton, IonRange, IonSelect, IonSelectOption } from "@ionic/react";
import { useEffect, useState } from "react";
import "./FilterSheet.css";
import { FilterState } from "../lib/inventoryService";
import {
  getUniqueBrands,
  getUniqueStyles,
  getPriceRange,
} from "../lib/filterService";

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

const categoryOptions = [
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "accessories",
  "shoes",
];
const conditionOptions = ["new", "like-new", "good", "fair", "poor"];
const decadeOptions = [
  "1950s",
  "1960s",
  "1970s",
  "1980s",
  "1990s",
  "2000s",
  "2010s",
  "2020s",
];

const sortOptions = [
  {
    value: "dateAdded-desc",
    label: "Newest First",
    field: "dateAdded" as const,
    direction: "desc" as const,
  },
  {
    value: "dateAdded-asc",
    label: "Oldest First",
    field: "dateAdded" as const,
    direction: "asc" as const,
  },
  {
    value: "price-asc",
    label: "Price: Low to High",
    field: "price" as const,
    direction: "asc" as const,
  },
  {
    value: "price-desc",
    label: "Price: High to Low",
    field: "price" as const,
    direction: "desc" as const,
  },
];

const FilterForm: React.FC<FilterFormProps> = ({
  initialFilters,
  onApply,
  onReset,
}) => {
  // State for all filter fields
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<number | undefined>();
  const [priceMax, setPriceMax] = useState<number | undefined>();
  const [selectedDecades, setSelectedDecades] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [soldStatus, setSoldStatus] = useState<"all" | "available" | "sold">(
    "all",
  );
  const [sortBy, setSortBy] = useState<string>("dateAdded-desc");

  // Dropdown options loaded from database
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableStyles, setAvailableStyles] = useState<string[]>([]);
  const [globalPriceRange, setGlobalPriceRange] = useState({
    min: 0,
    max: 1000,
  });

  // Load dropdown options and price range on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [brands, styles, priceRange] = await Promise.all([
          getUniqueBrands(),
          getUniqueStyles(),
          getPriceRange(),
        ]);
        setAvailableBrands(brands);
        setAvailableStyles(styles);
        setGlobalPriceRange(priceRange);
      } catch (error) {
        console.error("Error loading filter options:", error);
      }
    };
    loadFilterOptions();
  }, []);

  // Initialize state from initial filters
  useEffect(() => {
    setSelectedCategories([...initialFilters.categories]);
    setSelectedBrands([...initialFilters.brands]);
    setSelectedColors([...initialFilters.colors]);
    setSelectedSizes([...initialFilters.sizes]);
    setSelectedConditions([...initialFilters.conditions]);
    setPriceMin(initialFilters.priceMin);
    setPriceMax(initialFilters.priceMax);
    setSelectedDecades([...initialFilters.decades]);
    setSelectedStyles([...initialFilters.styles]);
    setSoldStatus(initialFilters.soldStatus);
    setSortBy(
      `${initialFilters.sortBy.field}-${initialFilters.sortBy.direction}`,
    );
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
    const selectedSort =
      sortOptions.find((opt) => opt.value === sortBy) || sortOptions[0];
    onApply({
      categories: selectedCategories,
      brands: selectedBrands,
      colors: selectedColors,
      sizes: selectedSizes,
      conditions: selectedConditions,
      priceMin: priceMin,
      priceMax: priceMax,
      decades: selectedDecades,
      styles: selectedStyles,
      soldStatus: soldStatus,
      sortBy: {
        field: selectedSort.field,
        direction: selectedSort.direction,
      },
    });
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedConditions([]);
    setPriceMin(undefined);
    setPriceMax(undefined);
    setSelectedDecades([]);
    setSelectedStyles([]);
    setSoldStatus("all");
    setSortBy("dateAdded-desc");
    onReset?.();
  };

  return (
    <div className="filter-sheet-content">
      {/* Sort By Selector */}
      <div className="filter-section">
        <h3 className="filter-section-title">Sort By:</h3>
        <IonSelect
          value={sortBy}
          placeholder="Select sort order"
          onIonChange={(e) => setSortBy(e.detail.value)}
          data-testid="select-sort"
        >
          {sortOptions.map((option) => (
            <IonSelectOption key={option.value} value={option.value}>
              {option.label}
            </IonSelectOption>
          ))}
        </IonSelect>
      </div>

      {/* Status (Sold/Available) Filter */}
      <div className="filter-section">
        <h3 className="filter-section-title">Status:</h3>
        <IonSelect
          value={soldStatus}
          placeholder="Select status"
          onIonChange={(e) =>
            setSoldStatus(e.detail.value as "all" | "available" | "sold")
          }
          data-testid="select-status"
        >
          <IonSelectOption value="all">All</IonSelectOption>
          <IonSelectOption value="available">Available</IonSelectOption>
          <IonSelectOption value="sold">Sold</IonSelectOption>
        </IonSelect>
      </div>

      {/* Category Filter */}
      <div className="filter-section">
        <h3 className="filter-section-title">Category:</h3>
        <div className="filter-chips-wrap">
          {categoryOptions.map((category) => (
            <button
              key={category}
              className={`filter-chip ${selectedCategories.includes(category) ? "chip-selected" : ""}`}
              onClick={() =>
                toggleSelection(
                  category,
                  selectedCategories,
                  setSelectedCategories,
                )
              }
              data-testid={`chip-category-${category}`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Filter */}
      <div className="filter-section">
        <h3 className="filter-section-title">Brand:</h3>
        <IonSelect
          multiple={true}
          value={selectedBrands}
          placeholder="Select brands"
          onIonChange={(e) => setSelectedBrands(e.detail.value)}
          data-testid="select-brands"
        >
          {availableBrands.map((brand) => (
            <IonSelectOption key={brand} value={brand}>
              {brand}
            </IonSelectOption>
          ))}
        </IonSelect>
      </div>

      {/* Color Filter */}
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

      {/* Size Filter */}
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

      {/* Condition Filter */}
      <div className="filter-section">
        <h3 className="filter-section-title">Condition:</h3>
        <div className="filter-chips-wrap">
          {conditionOptions.map((condition) => (
            <button
              key={condition}
              className={`filter-chip ${selectedConditions.includes(condition) ? "chip-selected" : ""}`}
              onClick={() =>
                toggleSelection(
                  condition,
                  selectedConditions,
                  setSelectedConditions,
                )
              }
              data-testid={`chip-condition-${condition}`}
            >
              {condition
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="filter-section">
        <h3 className="filter-section-title">
          Price: ${priceMin ?? globalPriceRange.min} - $
          {priceMax ?? globalPriceRange.max}
        </h3>
        <IonRange
          dualKnobs={true}
          min={globalPriceRange.min}
          max={globalPriceRange.max}
          value={{
            lower: priceMin ?? globalPriceRange.min,
            upper: priceMax ?? globalPriceRange.max,
          }}
          onIonChange={(e) => {
            const value = e.detail.value as { lower: number; upper: number };
            setPriceMin(value.lower);
            setPriceMax(value.upper);
          }}
          data-testid="range-price"
        />
      </div>

      {/* Decade Filter */}
      <div className="filter-section">
        <h3 className="filter-section-title">Decade:</h3>
        <div className="filter-chips-wrap">
          {decadeOptions.map((decade) => (
            <button
              key={decade}
              className={`filter-chip ${selectedDecades.includes(decade) ? "chip-selected" : ""}`}
              onClick={() =>
                toggleSelection(decade, selectedDecades, setSelectedDecades)
              }
              data-testid={`chip-decade-${decade}`}
            >
              {decade}
            </button>
          ))}
        </div>
      </div>

      {/* Style Filter */}
      <div className="filter-section">
        <h3 className="filter-section-title">Style:</h3>
        <IonSelect
          multiple={true}
          value={selectedStyles}
          placeholder="Select styles"
          onIonChange={(e) => setSelectedStyles(e.detail.value)}
          data-testid="select-styles"
        >
          {availableStyles.map((style) => (
            <IonSelectOption key={style} value={style}>
              {style}
            </IonSelectOption>
          ))}
        </IonSelect>
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
