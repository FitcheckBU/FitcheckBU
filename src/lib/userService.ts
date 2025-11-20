import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type DocumentReference,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebaseClient";

export type UserType = "buyer" | "seller";

export interface StoreRecord {
  id: string;
  location: string;
}

export interface BuyerProfile {
  id: string;
  location: string;
}

export interface SellerProfile {
  id: string;
  storeRef?: DocumentReference<DocumentData>;
  store?: StoreRecord;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  age: number;
  user_type: UserType;
}

export interface UserProfile {
  user: UserRecord;
  buyer?: BuyerProfile;
  seller?: SellerProfile;
}

const toUserRecord = (id: string, data: DocumentData): UserRecord => ({
  id,
  email: data.email as string,
  name: data.name as string,
  age: Number(data.age),
  user_type: data.user_type as UserType,
});

export const findUserProfileByEmail = async (
  email: string,
): Promise<UserProfile | null> => {
  const usersRef = collection(db, "users");
  const emailQuery = query(usersRef, where("email", "==", email));
  const snapshot = await getDocs(emailQuery);
  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];
  const userData = userDoc.data();
  const user = toUserRecord(userDoc.id, userData);

  const profile: UserProfile = { user };

  if (user.user_type === "buyer") {
    const buyerDoc = await getDoc(doc(db, "buyers", user.id));
    if (buyerDoc.exists()) {
      const buyerData = buyerDoc.data();
      profile.buyer = {
        id: buyerDoc.id,
        location: String(buyerData.location ?? ""),
      };
    }
  }

  if (user.user_type === "seller") {
    const sellerDoc = await getDoc(doc(db, "sellers", user.id));
    if (sellerDoc.exists()) {
      const sellerData = sellerDoc.data();
      const storeRef = sellerData.store_id as
        | DocumentReference<DocumentData>
        | undefined;
      let store: StoreRecord | undefined;

      if (storeRef) {
        const storeSnapshot = await getDoc(storeRef);
        if (storeSnapshot.exists()) {
          const storeData = storeSnapshot.data();
          store = {
            id: storeSnapshot.id,
            location: String(storeData.location ?? ""),
          };
        }
      }

      profile.seller = {
        id: sellerDoc.id,
        storeRef,
        store,
      };
    }
  }

  return profile;
};

export const createStore = async (
  location: string,
): Promise<DocumentReference<DocumentData>> => {
  const storesRef = collection(db, "stores");
  const newStoreRef = doc(storesRef);
  await setDoc(newStoreRef, { location });
  return newStoreRef;
};

export const createUser = async (data: {
  email: string;
  name: string;
  age: number;
  user_type: UserType;
}): Promise<UserRecord> => {
  const usersRef = collection(db, "users");
  const userDoc = await addDoc(usersRef, {
    email: data.email,
    name: data.name,
    age: data.age,
    user_type: data.user_type,
    created_at: serverTimestamp(),
  });
  return {
    id: userDoc.id,
    email: data.email,
    name: data.name,
    age: data.age,
    user_type: data.user_type,
  };
};

export const createBuyerProfile = async (
  userId: string,
  location: string,
): Promise<void> => {
  const buyerRef = doc(db, "buyers", userId);
  await setDoc(buyerRef, { location });
};

export const createSellerProfile = async (
  userId: string,
  storeRef: DocumentReference<DocumentData>,
): Promise<void> => {
  const sellerRef = doc(db, "sellers", userId);
  await setDoc(sellerRef, { store_id: storeRef });
};
