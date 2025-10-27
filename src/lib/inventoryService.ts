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
  isSold: boolean;
  dateAdded: Timestamp;
  description?: string; // human-written or AI-generated
  labels?: string[]; // Vision-generated tags
  sessionId?: string; // upload session identifier
  imageStoragePaths?: string[]; // Storage paths for uploaded images
  images?: ItemImage[]; // Structured image metadata
  status?: "draft" | "active" | "archived";

  //additional fields can be added later

  //imageUrls?: string[];
  //description?: string;
  //size?: string;
  //material?: string;
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
