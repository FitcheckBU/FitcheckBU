import { createContext } from "react";

export interface PhotoContextType {
  photos: string[];
  addPhoto: (photo: string) => void;
  setPhotos: (photos: string[]) => void;
  clearPhotos: () => void;
}

export const PhotoContext = createContext<PhotoContextType | undefined>(
  undefined,
);
