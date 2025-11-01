import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebaseClient";
import { InventoryItem, BackendFilterParams } from "./inventoryService";

/**
 * HYBRID FILTERING APPROACH:
 * - Backend (Firestore): Filter by isSold + category, sort by dateAdded or price
 * - Frontend (Client-side): Filter by all other fields (brand, color, size, etc.)
 *
 * This approach minimizes required Firestore indexes (~16 total) while maintaining flexibility.
 * Requires these indexes in Firebase Console:
 * - (dateAdded ASC/DESC)
 * - (price ASC/DESC)
 * - (isSold, dateAdded ASC/DESC)
 * - (isSold, price ASC/DESC)
 * - (category, dateAdded ASC/DESC)
 * - (category, price ASC/DESC)
 * - (isSold, category, dateAdded ASC/DESC)
 * - (isSold, category, price ASC/DESC)
 */
export const getFilteredItems = async (
  filters: BackendFilterParams,
  pageSize: number = 30,
  lastDoc?: QueryDocumentSnapshot,
): Promise<{
  items: InventoryItem[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}> => {
  const itemsRef = collection(db, "items");
  const constraints: QueryConstraint[] = [];

  // BACKEND FILTER 1: isSold (most selective - cuts dataset in half)
  if (filters.isSold !== undefined && filters.isSold !== null) {
    constraints.push(where("isSold", "==", filters.isSold));
  }

  // BACKEND FILTER 2: category (moderately selective - 6 categories)
  if (filters.categories && filters.categories.length > 0) {
    constraints.push(where("category", "in", filters.categories.slice(0, 10)));
  }

  // BACKEND SORT: Dynamic sorting by dateAdded or price
  const sortField = filters.sortBy.field;
  const sortDirection = filters.sortBy.direction;
  constraints.push(orderBy(sortField, sortDirection));

  // Fetch more items than needed to account for client-side filtering
  // Only multiply if there are client-side filters active
  const hasClientSideFilters =
    (filters.brands && filters.brands.length > 0) ||
    (filters.colors && filters.colors.length > 0) ||
    (filters.sizes && filters.sizes.length > 0) ||
    (filters.conditions && filters.conditions.length > 0) ||
    (filters.decades && filters.decades.length > 0) ||
    (filters.styles && filters.styles.length > 0) ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined;

  const fetchSize = hasClientSideFilters ? pageSize * 3 : pageSize;
  constraints.push(limit(fetchSize));

  // Add pagination cursor if provided
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  // Build and execute Firestore query
  const q = query(itemsRef, ...constraints);
  const snapshot = await getDocs(q);

  let items = snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as InventoryItem,
  );

  // CLIENT-SIDE FILTERING: Apply all other filters in JavaScript
  items = items.filter((item) => {
    // Brand filter
    if (filters.brands && filters.brands.length > 0) {
      if (!filters.brands.includes(item.brand)) return false;
    }

    // Color filter
    if (filters.colors && filters.colors.length > 0) {
      if (!filters.colors.includes(item.color)) return false;
    }

    // Size filter
    if (filters.sizes && filters.sizes.length > 0) {
      if (!filters.sizes.includes(item.size)) return false;
    }

    // Condition filter
    if (filters.conditions && filters.conditions.length > 0) {
      if (!filters.conditions.includes(item.condition)) return false;
    }

    // Decade filter
    if (filters.decades && filters.decades.length > 0) {
      if (!filters.decades.includes(item.decade)) return false;
    }

    // Style filter
    if (filters.styles && filters.styles.length > 0) {
      if (!filters.styles.includes(item.style)) return false;
    }

    // Price range filter
    if (filters.priceMin !== undefined && filters.priceMin !== null) {
      if (item.price < filters.priceMin) return false;
    }

    if (filters.priceMax !== undefined && filters.priceMax !== null) {
      if (item.price > filters.priceMax) return false;
    }

    return true;
  });

  // Return only the requested page size after filtering
  const paginatedItems = items.slice(0, pageSize);
  const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

  // Determine if there are more items:
  // - If we fetched the full fetchSize from Firestore, there might be more in the database
  // - OR if after filtering we still have more items than pageSize, there are definitely more
  const hasMore = snapshot.docs.length === fetchSize || items.length > pageSize;

  return {
    items: paginatedItems,
    lastDoc: newLastDoc,
    hasMore,
  };
};

/**
 * Get unique values for dropdown filters
 * These functions fetch all distinct values from the database
 */
export const getUniqueBrands = async (): Promise<string[]> => {
  const itemsRef = collection(db, "items");
  const snapshot = await getDocs(itemsRef);

  const brands = new Set<string>();
  snapshot.docs.forEach((doc) => {
    const brand = doc.data().brand;
    if (brand && brand.trim() !== "") {
      brands.add(brand);
    }
  });

  return Array.from(brands).sort();
};

export const getUniqueStyles = async (): Promise<string[]> => {
  const itemsRef = collection(db, "items");
  const snapshot = await getDocs(itemsRef);

  const styles = new Set<string>();
  snapshot.docs.forEach((doc) => {
    const style = doc.data().style;
    if (style && style.trim() !== "") {
      styles.add(style);
    }
  });

  return Array.from(styles).sort();
};

/**
 * Get price range (min and max) from all items
 */
export const getPriceRange = async (): Promise<{
  min: number;
  max: number;
}> => {
  const itemsRef = collection(db, "items");
  const snapshot = await getDocs(itemsRef);

  let min = Infinity;
  let max = -Infinity;

  snapshot.docs.forEach((doc) => {
    const price = doc.data().price;
    if (typeof price === "number") {
      if (price < min) min = price;
      if (price > max) max = price;
    }
  });

  // Default values if no items exist
  if (min === Infinity) min = 0;
  if (max === -Infinity) max = 1000;

  return { min, max };
};

/**
 * Helper function to convert FilterState to BackendFilterParams
 * Separates backend filters (isSold, category, sortBy) from client-side filters
 */
export const convertFilterStateToParams = (filterState: {
  categories: string[];
  brands: string[];
  colors: string[];
  sizes: string[];
  conditions: string[];
  priceMin?: number;
  priceMax?: number;
  decades: string[];
  styles: string[];
  soldStatus: "all" | "available" | "sold";
  sortBy: { field: "dateAdded" | "price"; direction: "asc" | "desc" };
}): BackendFilterParams => {
  return {
    // Backend filters (applied in Firestore)
    categories:
      filterState.categories.length > 0 ? filterState.categories : undefined,
    isSold:
      filterState.soldStatus === "all"
        ? null
        : filterState.soldStatus === "sold"
          ? true
          : false,
    sortBy: filterState.sortBy,

    // Frontend filters (applied client-side)
    brands: filterState.brands.length > 0 ? filterState.brands : undefined,
    colors: filterState.colors.length > 0 ? filterState.colors : undefined,
    sizes: filterState.sizes.length > 0 ? filterState.sizes : undefined,
    conditions:
      filterState.conditions.length > 0 ? filterState.conditions : undefined,
    priceMin: filterState.priceMin,
    priceMax: filterState.priceMax,
    decades: filterState.decades.length > 0 ? filterState.decades : undefined,
    styles: filterState.styles.length > 0 ? filterState.styles : undefined,
  };
};
