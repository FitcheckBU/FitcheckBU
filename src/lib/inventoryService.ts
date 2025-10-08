//inmport statements for firebase
import { db } from './firebaseClient';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';


//export interface for data types
export interface InventoryItem {
  id?: string;
  name: string;
  category: string;
  subcategory?: string;
  brand: string;
  color: string;
  condition: string;
  price: number;
  originalPrice?: number; //not sure 
  decade: string;
  style: string;
  isSold: boolean;
  soldDate?: Timestamp; //not sure
  soldPrice?: number; //not sure
  imageUrls?: string[]; 
  description?: string;
  size?: string;
  material?: string; //not sure
  sku: string; //not sure
  dateAdded: Timestamp;
  lastUpdated: Timestamp;
}

//add
//update
//get all
//get unsold
//get by id
//get by category
//get by decade
//get by style