//-------------IMPORTS------------------
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteDoc,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { PhotoRole } from "../constants/photoStages";
import { db, storage } from "./firebaseClient";
import { getDownloadURL, ref as storageRef } from "firebase/storage";

//-------------TYPES------------------
export interface ItemImage {
  role: PhotoRole;
  storagePath: string;
  originalName?: string;
}

export interface InventoryItem {
  id?: string; // Firestore document ID
  name: string;
  category: string;
  brand: string;
  color: string;
  size: string;
  condition: string;
  price: number;
  decade: string;
  style: string;
  sex?: string; // Gender category: "Men", "Women", "Unisex"
  isSold: boolean;
  dateAdded: Timestamp;
  description?: string; // human-written or AI-generated
  labels?: string[]; // Vision-generated tags
  labelText?: string; // OCR result from garment label/tag
  material?: string;
  sessionId?: string; // upload session identifier
  imageStoragePaths?: string[]; // Storage paths for uploaded images
  images?: ItemImage[]; // Structured image metadata
  status?: "draft" | "active" | "archived";
  metadataStatus?: "pending" | "complete" | "skipped" | "error";

  //additional fields can be added later

  //imageUrls?: string[];
  //description?: string;
  //size?: string;
  //material?: string;
}

export interface SortOption {
  field: "dateAdded" | "price";
  direction: "asc" | "desc";
}

export interface FilterState {
  categories: string[];
  brands: string[];
  colors: string[];
  sizes: string[];
  conditions: string[];
  priceMin?: number;
  priceMax?: number;
  decades: string[];
  styles: string[];
  soldStatus: "all" | "available" | "sold"; // isSold filter
  sortBy: SortOption;
}

export interface BackendFilterParams {
  // Backend filters (applied in Firestore)
  categories?: string[];
  isSold?: boolean | null; // null means "all"
  sortBy: SortOption;

  // Frontend filters (applied client-side)
  brands?: string[];
  colors?: string[];
  sizes?: string[];
  conditions?: string[];
  priceMin?: number;
  priceMax?: number;
  decades?: string[];
  styles?: string[];
}

//-------------CRUD OPERATIONS------------------

//add
export const addItem = async (
  itemData: Omit<InventoryItem, "id" | "dateAdded" | "isSold">,
): Promise<string> => {
  const itemsRef = collection(db, "items");
  const fallbackPaths =
    itemData.images?.map((image) => image.storagePath) ?? [];
  const imageStoragePaths = itemData.imageStoragePaths ?? fallbackPaths;
  const docRef = await addDoc(itemsRef, {
    ...itemData,
    description: itemData.description ?? "",
    labels: [],
    images: itemData.images ?? [],
    imageStoragePaths,
    size: itemData.size ?? "",
    dateAdded: serverTimestamp(),
    isSold: false,
    metadataStatus: "pending",
  });
  return docRef.id;
};

//update
export const updateItem = async (
  itemId: string,
  updates: Partial<Omit<InventoryItem, "id" | "dateAdded">>,
): Promise<void> => {
  const itemRef = doc(db, "items", itemId);
  await updateDoc(itemRef, updates);
};

//delete
export const deleteItem = async (itemId: string): Promise<void> => {
  const itemRef = doc(db, "items", itemId);
  await deleteDoc(itemRef);
};

//get all
export const getAllItems = async (): Promise<InventoryItem[]> => {
  const itemsRef = collection(db, "items");
  const snapshot = await getDocs(itemsRef);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as InventoryItem,
  );
};

//get unsold
export const getUnsoldItems = async (): Promise<InventoryItem[]> => {
  const itemsRef = collection(db, "items");
  const q = query(itemsRef, where("isSold", "==", false));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as InventoryItem,
  );
};

//get sold items
export const getSoldItems = async (): Promise<InventoryItem[]> => {
  const itemsRef = collection(db, "items");
  const q = query(itemsRef, where("isSold", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as InventoryItem,
  );
};

//get by id
export const getItemById = async (
  itemId: string,
): Promise<InventoryItem | null> => {
  const itemRef = doc(db, "items", itemId);
  const docSnap = await getDoc(itemRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as InventoryItem;
  }
  return null;
};

//get by category
export const getItemsByCategory = async (
  category: string,
): Promise<InventoryItem[]> => {
  const itemsRef = collection(db, "items");
  const q = query(itemsRef, where("category", "==", category));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as InventoryItem,
  );
};

//get by decade
export const getItemsByDecade = async (
  decade: string,
): Promise<InventoryItem[]> => {
  const itemsRef = collection(db, "items");
  const q = query(itemsRef, where("decade", "==", decade));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as InventoryItem,
  );
};

//get by style
export const getItemsByStyle = async (
  style: string,
): Promise<InventoryItem[]> => {
  const itemsRef = collection(db, "items");
  const q = query(itemsRef, where("style", "==", style));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as InventoryItem,
  );
};

//---------------CONVENIENCE METHODS------------------

//mark as sold
export const markAsSold = async (itemId: string): Promise<void> => {
  await updateItem(itemId, { isSold: true });
};

//mark as unsold(available)
export const markAsUnsold = async (itemId: string): Promise<void> => {
  await updateItem(itemId, { isSold: false });
};

//find item by barcode (partial ID match)
export const findItemByBarcode = async (
  barcode: string,
): Promise<InventoryItem | null> => {
  const itemsRef = collection(db, "items");
  const snapshot = await getDocs(itemsRef);

  // Normalize the barcode (remove spaces, uppercase)
  const normalizedBarcode = barcode.replace(/\s/g, "").toUpperCase();

  // Find item where document ID starts with the barcode
  const matchingDoc = snapshot.docs.find((doc) =>
    doc.id.toUpperCase().startsWith(normalizedBarcode),
  );

  if (matchingDoc) {
    return {
      id: matchingDoc.id,
      ...matchingDoc.data(),
    } as InventoryItem;
  }

  return null;
};

//mark as sold by barcode
export const markAsSoldByBarcode = async (barcode: string): Promise<void> => {
  const item = await findItemByBarcode(barcode);

  if (!item || !item.id) {
    throw new Error(
      "No document to update: Item not found with barcode " + barcode,
    );
  }

  await markAsSold(item.id);
};

//---------------COMPLEX OPERATIIONS------------------//

//Paginated fetch
export const getItemsPaginated = async (
  pageSize: number = 20,
  lastDoc?: QueryDocumentSnapshot,
): Promise<{
  items: InventoryItem[];
  lastDoc: QueryDocumentSnapshot | null;
}> => {
  const itemsRef = collection(db, "items");

  let q = query(itemsRef, orderBy("dateAdded", "desc"), limit(pageSize));

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);

  return {
    items: snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as InventoryItem,
    ),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
  };
};

//search by label
export const searchItemsByLabels = async (
  labels: string[],
): Promise<InventoryItem[]> => {
  const itemsRef = collection(db, "items");
  const q = query(
    itemsRef,
    where("labels", "array-contains-any", labels.slice(0, 10)), // Max 10 labels
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as InventoryItem,
  );
};

//get image
export const getImageStoragePaths = (item: InventoryItem): string[] => {
  if (item.imageStoragePaths && item.imageStoragePaths.length > 0) {
    return item.imageStoragePaths;
  }
  if (item.images && item.images.length > 0) {
    return item.images
      .map((image) => image.storagePath)
      .filter((path): path is string => Boolean(path));
  }
  return [];
};

export const getItemImageUrls = async (
  item: InventoryItem,
): Promise<string[]> => {
  const storagePaths = getImageStoragePaths(item);
  if (storagePaths.length === 0) {
    return [];
  }

  try {
    const urlPromises = storagePaths.map((path) =>
      getDownloadURL(storageRef(storage, path)),
    );
    return await Promise.all(urlPromises);
  } catch (error) {
    console.error("Error getting image URLs:", error);
    return [];
  }
};

// DEPRECATED: Use getFilteredItems from filterService.ts instead
// This function is kept for backward compatibility but should not be used for new code
export const getItemsPaginatedWithFilters = async (
  pageSize: number = 30,
  lastDoc?: QueryDocumentSnapshot,
  searchText: string = "",
  activeFilters?: {
    sizes: string[];
    sexes: string[];
    colors: string[];
    materials: string[];
  },
): Promise<{
  items: InventoryItem[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}> => {
  console.warn(
    "getItemsPaginatedWithFilters is deprecated. Use getFilteredItems from filterService.ts instead.",
  );

  const itemsRef = collection(db, "items");

  // Start with basic query ordered by dateAdded (this doesn't require additional indexes)
  let q = query(itemsRef, orderBy("dateAdded", "desc"), limit(pageSize));

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  let items = snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as InventoryItem,
  );

  // Apply frontend filtering for search and filters to avoid complex Firestore indexes
  if (
    searchText ||
    (activeFilters &&
      (activeFilters.sizes.length > 0 ||
        activeFilters.colors.length > 0 ||
        activeFilters.sexes.length > 0 ||
        activeFilters.materials.length > 0))
  ) {
    items = items.filter((item) => {
      // Apply search filter
      if (searchText) {
        const search = searchText.toLowerCase();
        const matchesSearch =
          item.name?.toLowerCase().includes(search) ||
          item.brand?.toLowerCase().includes(search) ||
          item.category?.toLowerCase().includes(search) ||
          item.color?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Apply active filters
      if (activeFilters) {
        // Size filter (checking category for size info)
        if (activeFilters.sizes.length > 0) {
          const matchesSize = activeFilters.sizes.some(
            (size) =>
              item.category?.toLowerCase().includes(size.toLowerCase()) ||
              item.size?.toLowerCase().includes(size.toLowerCase()),
          );
          if (!matchesSize) return false;
        }

        // Color filter
        if (activeFilters.colors.length > 0) {
          const matchesColor = activeFilters.colors.some((color) =>
            item.color?.toLowerCase().includes(color.toLowerCase()),
          );
          if (!matchesColor) return false;
        }

        // Material filter (checking description and labels)
        if (activeFilters.materials.length > 0) {
          const matchesMaterial = activeFilters.materials.some(
            (material) =>
              item.description
                ?.toLowerCase()
                .includes(material.toLowerCase()) ||
              item.labels?.some((label) =>
                label.toLowerCase().includes(material.toLowerCase()),
              ),
          );
          if (!matchesMaterial) return false;
        }
      }

      return true;
    });
  }

  const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
  const hasMore = snapshot.docs.length === pageSize;

  return {
    items: items,
    lastDoc: newLastDoc,
    hasMore: hasMore,
  };
};
