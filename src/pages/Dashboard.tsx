import {
  IonSearchbar,
  IonButton,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/react";
import filterSvg from "../../public/filter.svg"; // Import the SVG directly
import { useState, useEffect, useRef } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { InventoryItem, FilterState } from "../lib/inventoryService";
import {
  getFilteredItems,
  convertFilterStateToParams,
} from "../lib/filterService";
import { QueryDocumentSnapshot } from "firebase/firestore";
import ItemCard from "../components/ItemCard";
import ItemDetailModal from "../components/ItemDetailModal";
import EditItemModal from "../components/EditItemModal";
import "./Dashboard.css";

const PAGE_SIZE = 30;

type DashboardRouteState =
  | {
      appliedFilters: FilterState;
    }
  | {
      resetFilters: true;
    }
  | undefined;

const Dashboard: React.FC = () => {
  const history = useHistory();
  const location = useLocation<DashboardRouteState>();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const initialLoad = useRef(true);

  // Filter states
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
    conditions: [],
    priceMin: undefined,
    priceMax: undefined,
    decades: [],
    styles: [],
    soldStatus: "all",
    sortBy: { field: "dateAdded", direction: "desc" },
  });

  useEffect(() => {
    const state = location.state;
    if (state && "appliedFilters" in state) {
      setActiveFilters(state.appliedFilters);
      history.replace({ ...location, state: undefined });
    } else if (state && "resetFilters" in state) {
      setActiveFilters({
        categories: [],
        brands: [],
        colors: [],
        sizes: [],
        conditions: [],
        priceMin: undefined,
        priceMax: undefined,
        decades: [],
        styles: [],
        soldStatus: "all",
        sortBy: { field: "dateAdded", direction: "desc" },
      });
      history.replace({ ...location, state: undefined });
    }
  }, [history, location]);

  useEffect(() => {
    if (initialLoad.current) {
      loadItems(true);
      initialLoad.current = false;
    } else {
      loadItems(true);
    }
  }, [searchText, activeFilters]);

  const loadItems = async (reset: boolean = false) => {
    setLoading(true);
    try {
      const currentLastDoc = reset ? undefined : (lastDoc ?? undefined);
      const filterParams = convertFilterStateToParams(activeFilters);

      const {
        items: newItems,
        lastDoc: newLastDoc,
        hasMore,
      } = await getFilteredItems(filterParams, PAGE_SIZE, currentLastDoc);

      setItems((prevItems) => (reset ? newItems : [...prevItems, ...newItems]));
      setLastDoc(newLastDoc);
      setHasMoreItems(hasMore);
    } catch (error) {
      console.error("Failed to load items:", error);
      setError(
        "Failed to load items: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchMoreItems = async () => {
    if (!hasMoreItems || loadingMore) return;
    setLoadingMore(true);
    await loadItems();
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadItems(true);
    event.detail.complete();
  };

  const navigateToFilters = () => {
    history.push("/sort-filter", { activeFilters });
  };

  const hasActiveFilters =
    activeFilters.categories.length > 0 ||
    activeFilters.brands.length > 0 ||
    activeFilters.colors.length > 0 ||
    activeFilters.sizes.length > 0 ||
    activeFilters.conditions.length > 0 ||
    activeFilters.priceMin !== undefined ||
    activeFilters.priceMax !== undefined ||
    activeFilters.decades.length > 0 ||
    activeFilters.styles.length > 0 ||
    activeFilters.soldStatus !== "all" ||
    activeFilters.sortBy.field !== "dateAdded" ||
    activeFilters.sortBy.direction !== "desc";

  return (
    <>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent></IonRefresherContent>
      </IonRefresher>

      <div className="dashboard-search-section">
        <IonSearchbar
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value!)}
          placeholder="Search Name, Size, Color, Etc..."
          className="dashboard-searchbar"
          data-testid="input-search"
        ></IonSearchbar>
        <IonButton onClick={navigateToFilters} color="secondary">
          <img
            src={filterSvg}
            alt="Filter"
            className={`header-icon ${hasActiveFilters ? "filter-active" : ""}`}
          />
        </IonButton>
      </div>

      <div className="dashboard-items">
        {error ? (
          <div className="error-state">
            <p>{error}</p>
          </div>
        ) : loading && items.length === 0 ? (
          <div className="loading-state">Loading items...</div>
        ) : items.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No items found</p>
          </div>
        ) : (
          items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => setSelectedItem(item)}
              onEdit={() => setEditingItem(item)}
            />
          ))
        )}
        <IonInfiniteScroll
          onIonInfinite={fetchMoreItems}
          threshold="100px"
          disabled={!hasMoreItems || loadingMore}
        >
          <IonInfiniteScrollContent
            loadingSpinner="bubbles"
            loadingText="Loading more data..."
          ></IonInfiniteScrollContent>
        </IonInfiniteScroll>
      </div>

      <ItemDetailModal
        isOpen={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdate={() => loadItems(true)}
        onEdit={() => {
          setEditingItem(selectedItem);
          setSelectedItem(null);
        }}
      />

      <EditItemModal
        isOpen={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onUpdate={() => loadItems(true)}
      />
    </>
  );
};

export default Dashboard;
