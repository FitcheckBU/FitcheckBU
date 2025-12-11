// src/lib/savedItemsService.ts
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseClient";
import { Timestamp } from "firebase/firestore";

export interface SavedItem {
  id?: string;
  userId: string;
  itemId: string;
  savedAt: Timestamp; // Timestamp
}

export const saveItem = async (
  userId: string,
  itemId: string,
): Promise<void> => {
  const savedItemsRef = collection(db, "savedItems");
  await addDoc(savedItemsRef, {
    userId,
    itemId,
    savedAt: serverTimestamp(),
  });
};

export const unsaveItem = async (
  userId: string,
  itemId: string,
): Promise<void> => {
  const savedItemsRef = collection(db, "savedItems");
  const q = query(
    savedItemsRef,
    where("userId", "==", userId),
    where("itemId", "==", itemId),
  );
  const snapshot = await getDocs(q);

  snapshot.docs.forEach(async (docSnapshot) => {
    await deleteDoc(doc(db, "savedItems", docSnapshot.id));
  });
};

export const getSavedItems = async (userId: string): Promise<string[]> => {
  const savedItemsRef = collection(db, "savedItems");
  const q = query(savedItemsRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data().itemId);
};

export const isItemSaved = async (
  userId: string,
  itemId: string,
): Promise<boolean> => {
  const savedItemsRef = collection(db, "savedItems");
  const q = query(
    savedItemsRef,
    where("userId", "==", userId),
    where("itemId", "==", itemId),
  );
  const snapshot = await getDocs(q);

  return !snapshot.empty;
};
