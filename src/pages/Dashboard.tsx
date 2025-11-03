import {
  IonSearchbar,
  IonButton,
  IonRefresher,
  IonRefresherContent,
  IonAlert,
  RefresherEventDetail,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import filterSvg from "../../public/filter.svg"; // Import the SVG directly
import { useState, useEffect } from "react";
import {
  getAllItems,
  deleteItem,
  InventoryItem,
} from "../lib/inventoryService";
import ItemCard from "../components/ItemCard";
import FilterSheet from "../components/FilterSheet";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const history = useHistory();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Filter states
  const [activeFilters, setActiveFilters] = useState({
    sizes: [] as string[],
    sexes: [] as string[],
    colors: [] as string[],
    materials: [] as string[],
  });

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [items, searchText, activeFilters]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const fetchedItems = await getAllItems();
      setItems(fetchedItems);
    } catch (error) {
      console.error("Failed to load items:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...items];

    // Apply search filter
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(search) ||
          item.brand?.toLowerCase().includes(search) ||
          item.category?.toLowerCase().includes(search) ||
          item.color?.toLowerCase().includes(search),
      );
    }

    // Apply size filter
    if (activeFilters.sizes.length > 0) {
      filtered = filtered.filter((item) =>
        activeFilters.sizes.some((size) =>
          item.category?.toLowerCase().includes(size.toLowerCase()),
        ),
      );
    }

    // Apply color filter
    if (activeFilters.colors.length > 0) {
      filtered = filtered.filter((item) =>
        activeFilters.colors.some((color) =>
          item.color?.toLowerCase().includes(color.toLowerCase()),
        ),
      );
    }

    // Apply material filter
    if (activeFilters.materials.length > 0) {
      filtered = filtered.filter((item) =>
        activeFilters.materials.some(
          (material) =>
            item.description?.toLowerCase().includes(material.toLowerCase()) ||
            item.labels?.some((label) =>
              label.toLowerCase().includes(material.toLowerCase()),
            ),
        ),
      );
    }

    setFilteredItems(filtered);
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadItems();
    event.detail.complete();
  };

  const handleFilterApply = (filters: typeof activeFilters) => {
    setActiveFilters(filters);
    setShowFilterSheet(false);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete?.id) return;

    try {
      await deleteItem(itemToDelete.id);
      await loadItems();
      setItemToDelete(null);
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const hasActiveFilters =
    activeFilters.sizes.length > 0 ||
    activeFilters.sexes.length > 0 ||
    activeFilters.colors.length > 0 ||
    activeFilters.materials.length > 0;

  return (
    <>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent></IonRefresherContent>
      </IonRefresher>

      <div className="dashboard-header">
        <h1 className="dashboard-title">User Dashboard</h1>
        <IonButton
          onClick={() => setShowFilterSheet(true)}
          fill="clear"
          className="filter-button"
        >
          <img
            src={filterSvg}
            alt="Filter"
            className={`filter-icon ${hasActiveFilters ? "filter-active" : ""}`}
          />
        </IonButton>
      </div>

      <div className="dashboard-items">
        {filteredItems.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No items found</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => history.push(`/item/${item.id}`)}
              onEdit={() => history.push(`/item/${item.id}`)}
              onDelete={() => setItemToDelete(item)}
            />
          ))
        )}
      </div>

      <div className="dashboard-search-section">
        <IonSearchbar
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value!)}
          placeholder="Search Name, Size, Color, Etc."
          className="dashboard-searchbar"
          data-testid="input-search"
        ></IonSearchbar>
      </div>

      <FilterSheet
        isOpen={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        onApply={handleFilterApply}
        activeFilters={activeFilters}
        items={items}
      />

      <IonAlert
        isOpen={!!itemToDelete}
        onDidDismiss={() => setItemToDelete(null)}
        header="Delete Item"
        message={`Are you sure you want to delete "${itemToDelete?.name || "this item"}"?`}
        buttons={[
          {
            text: "Cancel",
            role: "cancel",
          },
          {
            text: "Delete",
            role: "destructive",
            handler: handleDeleteConfirm,
          },
        ]}
      />
    </>
  );
};

export default Dashboard;
