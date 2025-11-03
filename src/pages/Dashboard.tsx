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
import { useState, useEffect, useRef, useMemo } from "react";
import type { InfiniteScrollCustomEvent } from "@ionic/react";
import { useHistory, useLocation } from "react-router-dom";
import { InventoryItem, FilterState } from "../lib/inventoryService";
import {
  getFilteredItems,
  convertFilterStateToParams,
} from "../lib/filterService";
import { QueryDocumentSnapshot } from "firebase/firestore";
import ItemCard from "../components/ItemCard";
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

  // Frontend search filtering - filters items by name and description
  const filteredItems = useMemo(() => {
    if (!searchText || searchText.trim() === "") {
      return items;
    }

    const searchLower = searchText.toLowerCase().trim();
    return items.filter((item) => {
      const nameMatch = item.name?.toLowerCase().includes(searchLower);
      const descMatch = item.description?.toLowerCase().includes(searchLower);
      return nameMatch || descMatch;
    });
  }, [items, searchText]);

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

  useEffect(() => {
    if (initialLoad.current) {
      loadItems(true);
      initialLoad.current = false;
    } else {
      loadItems(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilters]);

  const fetchMoreItems = async (event: InfiniteScrollCustomEvent) => {
    // Handle the case where there are no more items
    if (!hasMoreItems) {
      event.target.complete();
      event.target.disabled = true;
      return;
    }

    // Handle the case where we're already loading
    if (loadingMore) {
      event.target.complete();
      return;
    }

    setLoadingMore(true);
    await loadItems(false);
    event.target.complete();
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadItems(true);
    event.detail.complete();
  };

  const navigateToFilters = () => {
    history.push("/sort-filter", { activeFilters });
  };

  return (
    <>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent></IonRefresherContent>
      </IonRefresher>

      <div className="dashboard-header">
        <h1 className="dashboard-title">User Dashboard</h1>
        <IonButton onClick={navigateToFilters} color="secondary">
          <img src={filterSvg} alt="Filter" />
        </IonButton>
      </div>

      <div className="dashboard-items">
        {error ? (
          <div className="error-state">
            <p>{error}</p>
          </div>
        ) : loading && items.length === 0 ? (
          <div className="loading-state">Loading items...</div>
        ) : filteredItems.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No items found</p>
          </div>
        ) : (
          <>
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => history.push(`/item/${item.id}`)}
              />
            ))}
            <IonInfiniteScroll
              onIonInfinite={fetchMoreItems}
              threshold="500px"
              disabled={false}
            >
              <IonInfiniteScrollContent
                loadingSpinner="bubbles"
                loadingText="Loading more data..."
              ></IonInfiniteScrollContent>
            </IonInfiniteScroll>
          </>
        )}
      </div>

      <div className="dashboard-search-section">
        <IonSearchbar
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value!)}
          placeholder="Search Name or Description"
          className="dashboard-searchbar"
          data-testid="input-search"
        ></IonSearchbar>
      </div>
    </>
  );
};

export default Dashboard;
